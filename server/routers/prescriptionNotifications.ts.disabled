import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { and, eq, gte, lte } from "drizzle-orm";
import { prescriptions, prescriptionCompliance } from "../../drizzle/schema";
import { notifyOwner } from "../_core/notification";

export const prescriptionNotificationsRouter = router({
  /**
   * Check for missed doses and send notifications
   */
  checkMissedDoses: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();

      // Get all active prescriptions
      const activePrescriptions = await db
        .select()
        .from(prescriptions)
        .where(
          and(
            eq(prescriptions.farmId, input.farmId),
            eq(prescriptions.status, "active")
          )
        );

      const missedDosesAlerts = [];

      for (const rx of activePrescriptions) {
        // Get compliance records for this prescription
        const compliance = await db
          .select()
          .from(prescriptionCompliance)
          .where(eq(prescriptionCompliance.prescriptionId, rx.id));

        // Calculate expected vs actual doses
        const today = new Date();
        const daysElapsed = Math.floor(
          (today.getTime() - rx.prescriptionDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        const expectedDoses = Math.min(daysElapsed, rx.duration);
        const administeredDoses = compliance.filter((c) => c.administered).length;
        const missedDoses = expectedDoses - administeredDoses;

        if (missedDoses > 0) {
          missedDosesAlerts.push({
            prescriptionId: rx.id,
            medicationName: rx.medicationName,
            animalId: rx.animalId,
            missedDoses,
            expectedDoses,
            complianceRate: ((administeredDoses / expectedDoses) * 100).toFixed(1),
            severity: missedDoses > 3 ? "critical" : missedDoses > 1 ? "warning" : "info",
          });
        }
      }

      return {
        farmId: input.farmId,
        totalAlerts: missedDosesAlerts.length,
        alerts: missedDosesAlerts,
      };
    }),

  /**
   * Check for expiring prescriptions
   */
  checkExpiringPrescriptions: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        daysUntilExpiry: z.number().default(7),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();

      const now = new Date();
      const expiryThreshold = new Date(
        now.getTime() + input.daysUntilExpiry * 24 * 60 * 60 * 1000
      );

      const expiringPrescriptions = await db
        .select()
        .from(prescriptions)
        .where(
          and(
            eq(prescriptions.farmId, input.farmId),
            eq(prescriptions.status, "active"),
            lte(prescriptions.expiryDate, expiryThreshold),
            gte(prescriptions.expiryDate, now)
          )
        );

      return {
        farmId: input.farmId,
        totalAlerts: expiringPrescriptions.length,
        alerts: expiringPrescriptions.map((rx) => ({
          prescriptionId: rx.id,
          medicationName: rx.medicationName,
          animalId: rx.animalId,
          expiryDate: rx.expiryDate,
          daysRemaining: Math.ceil(
            (rx.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          ),
          severity: Math.ceil((rx.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) <= 3 ? "critical" : "warning",
        })),
      };
    }),

  /**
   * Record dose administration and check compliance
   */
  recordDoseAndNotify: protectedProcedure
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

      // Record compliance
      const [complianceResult] = await db.insert(prescriptionCompliance).values({
        prescriptionId: input.prescriptionId,
        doseDate: input.doseDate,
        doseTime: input.doseTime,
        administered: input.administered,
        dosesGiven: input.dosesGiven,
        notes: input.notes,
        recordedBy: input.recordedBy,
      });

      // Get prescription details
      const rx = await db
        .select()
        .from(prescriptions)
        .where(eq(prescriptions.id, input.prescriptionId))
        .limit(1);

      if (rx && rx.length > 0) {
        const prescription = rx[0];

        // Get all compliance records
        const allCompliance = await db
          .select()
          .from(prescriptionCompliance)
          .where(eq(prescriptionCompliance.prescriptionId, input.prescriptionId));

        const administeredCount = allCompliance.filter((c) => c.administered).length;
        const complianceRate = (administeredCount / prescription.duration) * 100;

        // Send notification if compliance is low
        if (complianceRate < 50 && administeredCount > 0) {
          try {
            await notifyOwner({
              title: "Low Prescription Compliance Alert",
              content: `Prescription "${prescription.medicationName}" for animal #${prescription.animalId} has low compliance rate (${complianceRate.toFixed(1)}%). Only ${administeredCount} of ${prescription.duration} doses administered.`,
            });
          } catch (error) {
            console.error("Failed to send notification:", error);
          }
        }
      }

      return {
        success: true,
        complianceId: complianceResult.insertId,
        message: "Dose recorded and compliance checked",
      };
    }),

  /**
   * Get compliance summary for a farm
   */
  getComplianceSummary: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();

      const activePrescriptions = await db
        .select()
        .from(prescriptions)
        .where(
          and(
            eq(prescriptions.farmId, input.farmId),
            eq(prescriptions.status, "active")
          )
        );

      let totalExpectedDoses = 0;
      let totalAdministeredDoses = 0;
      const complianceByPrescription = [];

      for (const rx of activePrescriptions) {
        const compliance = await db
          .select()
          .from(prescriptionCompliance)
          .where(eq(prescriptionCompliance.prescriptionId, rx.id));

        const administered = compliance.filter((c) => c.administered).length;
        const expected = rx.duration;

        totalExpectedDoses += expected;
        totalAdministeredDoses += administered;

        complianceByPrescription.push({
          prescriptionId: rx.id,
          medicationName: rx.medicationName,
          expected,
          administered,
          rate: ((administered / expected) * 100).toFixed(1),
        });
      }

      const overallRate =
        totalExpectedDoses > 0
          ? ((totalAdministeredDoses / totalExpectedDoses) * 100).toFixed(1)
          : "0";

      return {
        farmId: input.farmId,
        totalPrescriptions: activePrescriptions.length,
        overallComplianceRate: parseFloat(overallRate as string),
        totalExpectedDoses,
        totalAdministeredDoses,
        complianceByPrescription,
      };
    }),

  /**
   * Send reminder notification for upcoming doses
   */
  sendDoseReminder: protectedProcedure
    .input(
      z.object({
        prescriptionId: z.number(),
        reminderTime: z.string(), // "08:00", "14:00", etc.
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      const rx = await db
        .select()
        .from(prescriptions)
        .where(eq(prescriptions.id, input.prescriptionId))
        .limit(1);

      if (!rx || rx.length === 0) {
        return { error: "Prescription not found" };
      }

      const prescription = rx[0];

      // In a real implementation, this would schedule a notification
      // For now, we'll just return success
      return {
        success: true,
        message: `Reminder set for ${prescription.medicationName} at ${input.reminderTime}`,
        prescriptionId: input.prescriptionId,
        reminderTime: input.reminderTime,
      };
    }),

  /**
   * Get non-compliance alerts
   */
  getNonComplianceAlerts: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();

      const activePrescriptions = await db
        .select()
        .from(prescriptions)
        .where(
          and(
            eq(prescriptions.farmId, input.farmId),
            eq(prescriptions.status, "active")
          )
        );

      const alerts = [];

      for (const rx of activePrescriptions) {
        const compliance = await db
          .select()
          .from(prescriptionCompliance)
          .where(eq(prescriptionCompliance.prescriptionId, rx.id));

        const administered = compliance.filter((c) => c.administered).length;
        const rate = (administered / rx.duration) * 100;

        if (rate < 80) {
          // Alert if less than 80% compliant
          alerts.push({
            prescriptionId: rx.id,
            medicationName: rx.medicationName,
            animalId: rx.animalId,
            complianceRate: rate.toFixed(1),
            dosesMissed: rx.duration - administered,
            severity: rate < 50 ? "critical" : "warning",
            message: `${rx.medicationName} compliance is ${rate.toFixed(1)}% - ${rx.duration - administered} doses missed`,
          });
        }
      }

      return {
        farmId: input.farmId,
        totalAlerts: alerts.length,
        alerts,
      };
    }),
});
