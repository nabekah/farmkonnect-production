import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { and, eq, gte, lte, desc } from "drizzle-orm";
import { prescriptions, prescriptionCompliance } from "../../drizzle/schema";

export const prescriptionManagementRouter = router({
  /**
   * Create a new prescription
   */
  createPrescription: protectedProcedure
    .input(
      z.object({
        appointmentId: z.number(),
        farmId: z.number(),
        animalId: z.number(),
        veterinarianId: z.number(),
        medicationName: z.string().min(1),
        dosage: z.string().min(1),
        frequency: z.string().min(1),
        duration: z.number().min(1),
        route: z.enum(["oral", "injection", "topical", "inhalation", "other"]),
        quantity: z.number().min(1),
        instructions: z.string().optional(),
        expiryDate: z.date(),
        cost: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      const [result] = await db.insert(prescriptions).values({
        appointmentId: input.appointmentId,
        farmId: input.farmId,
        animalId: input.animalId,
        veterinarianId: input.veterinarianId,
        medicationName: input.medicationName,
        dosage: input.dosage,
        frequency: input.frequency,
        duration: input.duration,
        route: input.route,
        quantity: input.quantity,
        instructions: input.instructions,
        expiryDate: input.expiryDate,
        cost: input.cost ? parseFloat(input.cost) : null,
      });

      return {
        success: true,
        prescriptionId: result.insertId,
        message: "Prescription created successfully",
      };
    }),

  /**
   * Get prescriptions for an animal
   */
  getAnimalPrescriptions: protectedProcedure
    .input(
      z.object({
        animalId: z.number(),
        status: z.enum(["active", "fulfilled", "expired", "cancelled"]).optional(),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();

      let query = db
        .select()
        .from(prescriptions)
        .where(eq(prescriptions.animalId, input.animalId));

      if (input.status) {
        query = db
          .select()
          .from(prescriptions)
          .where(
            and(
              eq(prescriptions.animalId, input.animalId),
              eq(prescriptions.status, input.status)
            )
          );
      }

      const results = await query.orderBy(desc(prescriptions.prescriptionDate));

      return results.map((p) => ({
        id: p.id,
        medicationName: p.medicationName,
        dosage: p.dosage,
        frequency: p.frequency,
        duration: p.duration,
        route: p.route,
        quantity: p.quantity,
        instructions: p.instructions,
        prescriptionDate: p.prescriptionDate,
        expiryDate: p.expiryDate,
        status: p.status,
        fulfillmentDate: p.fulfillmentDate,
        fulfillmentVendor: p.fulfillmentVendor,
        cost: p.cost ? parseFloat(p.cost.toString()) : 0,
        complianceStatus: p.complianceStatus,
      }));
    }),

  /**
   * Get active prescriptions for a farm
   */
  getActivePrescriptions: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();

      const now = new Date();
      const results = await db
        .select()
        .from(prescriptions)
        .where(
          and(
            eq(prescriptions.farmId, input.farmId),
            eq(prescriptions.status, "active"),
            gte(prescriptions.expiryDate, now)
          )
        )
        .orderBy(desc(prescriptions.prescriptionDate));

      return results.map((p) => ({
        id: p.id,
        animalId: p.animalId,
        medicationName: p.medicationName,
        dosage: p.dosage,
        frequency: p.frequency,
        duration: p.duration,
        route: p.route,
        quantity: p.quantity,
        expiryDate: p.expiryDate,
        daysRemaining: Math.ceil(
          (p.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        ),
        complianceStatus: p.complianceStatus,
      }));
    }),

  /**
   * Mark prescription as fulfilled
   */
  markPrescriptionFulfilled: protectedProcedure
    .input(
      z.object({
        prescriptionId: z.number(),
        fulfillmentVendor: z.string(),
        fulfillmentDate: z.date(),
        cost: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      await db
        .update(prescriptions)
        .set({
          status: "fulfilled",
          fulfillmentDate: input.fulfillmentDate,
          fulfillmentVendor: input.fulfillmentVendor,
          cost: input.cost ? parseFloat(input.cost) : null,
        })
        .where(eq(prescriptions.id, input.prescriptionId));

      return { success: true, message: "Prescription marked as fulfilled" };
    }),

  /**
   * Record prescription compliance (dose administration)
   */
  recordCompliance: protectedProcedure
    .input(
      z.object({
        prescriptionId: z.number(),
        doseDate: z.date(),
        doseTime: z.string().optional(),
        administered: z.boolean(),
        dosesGiven: z.number().default(1),
        notes: z.string().optional(),
        recordedBy: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      const [result] = await db.insert(prescriptionCompliance).values({
        prescriptionId: input.prescriptionId,
        doseDate: input.doseDate,
        doseTime: input.doseTime,
        administered: input.administered,
        dosesGiven: input.dosesGiven,
        notes: input.notes,
        recordedBy: input.recordedBy,
      });

      return {
        success: true,
        complianceId: result.insertId,
        message: "Compliance recorded successfully",
      };
    }),

  /**
   * Get prescription compliance history
   */
  getComplianceHistory: protectedProcedure
    .input(
      z.object({
        prescriptionId: z.number(),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();

      const compliance = await db
        .select()
        .from(prescriptionCompliance)
        .where(eq(prescriptionCompliance.prescriptionId, input.prescriptionId))
        .orderBy(desc(prescriptionCompliance.doseDate));

      return compliance.map((c) => ({
        id: c.id,
        doseDate: c.doseDate,
        doseTime: c.doseTime,
        administered: c.administered,
        dosesGiven: c.dosesGiven,
        notes: c.notes,
        recordedBy: c.recordedBy,
      }));
    }),

  /**
   * Calculate prescription compliance rate
   */
  getComplianceRate: protectedProcedure
    .input(z.object({ prescriptionId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();

      const prescription = await db
        .select()
        .from(prescriptions)
        .where(eq(prescriptions.id, input.prescriptionId))
        .limit(1);

      if (!prescription || prescription.length === 0) {
        return { error: "Prescription not found" };
      }

      const p = prescription[0];
      const compliance = await db
        .select()
        .from(prescriptionCompliance)
        .where(eq(prescriptionCompliance.prescriptionId, input.prescriptionId));

      const administeredDoses = compliance.filter((c) => c.administered).length;
      const expectedDoses = p.duration; // Assuming one dose per day
      const complianceRate = expectedDoses > 0 ? (administeredDoses / expectedDoses) * 100 : 0;

      return {
        prescriptionId: input.prescriptionId,
        medicationName: p.medicationName,
        expectedDoses,
        administeredDoses,
        missedDoses: expectedDoses - administeredDoses,
        complianceRate: parseFloat(complianceRate.toFixed(1)),
        status: complianceRate >= 80 ? "good" : complianceRate >= 50 ? "fair" : "poor",
      };
    }),

  /**
   * Get expiring prescriptions alert
   */
  getExpiringPrescriptions: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        daysUntilExpiry: z.number().default(7),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();

      const now = new Date();
      const expiryThreshold = new Date(now.getTime() + input.daysUntilExpiry * 24 * 60 * 60 * 1000);

      const results = await db
        .select()
        .from(prescriptions)
        .where(
          and(
            eq(prescriptions.farmId, input.farmId),
            eq(prescriptions.status, "active"),
            lte(prescriptions.expiryDate, expiryThreshold),
            gte(prescriptions.expiryDate, now)
          )
        )
        .orderBy(prescriptions.expiryDate);

      return results.map((p) => ({
        id: p.id,
        animalId: p.animalId,
        medicationName: p.medicationName,
        expiryDate: p.expiryDate,
        daysUntilExpiry: Math.ceil(
          (p.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        ),
        urgency: Math.ceil((p.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) <= 3 ? "critical" : "warning",
      }));
    }),

  /**
   * Get prescription summary for a farm
   */
  getPrescriptionSummary: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();

      const allPrescriptions = await db
        .select()
        .from(prescriptions)
        .where(eq(prescriptions.farmId, input.farmId));

      const now = new Date();
      const active = allPrescriptions.filter(
        (p) => p.status === "active" && p.expiryDate > now
      ).length;
      const fulfilled = allPrescriptions.filter((p) => p.status === "fulfilled").length;
      const expired = allPrescriptions.filter(
        (p) => p.status === "expired" || (p.status === "active" && p.expiryDate <= now)
      ).length;

      const totalCost = allPrescriptions.reduce(
        (sum, p) => sum + (p.cost ? parseFloat(p.cost.toString()) : 0),
        0
      );

      return {
        totalPrescriptions: allPrescriptions.length,
        activePrescriptions: active,
        fulfilledPrescriptions: fulfilled,
        expiredPrescriptions: expired,
        totalCost: parseFloat(totalCost.toFixed(2)),
        averageCost: allPrescriptions.length > 0 ? parseFloat((totalCost / allPrescriptions.length).toFixed(2)) : 0,
      };
    }),
});
