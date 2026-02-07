import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { sql } from "drizzle-orm";

export const bulkHealthOperationsRouter = router({
  // Bulk add health records
  addHealthRecords: protectedProcedure
    .input(
      z.object({
        animalIds: z.array(z.number()).min(1),
        recordType: z.enum(["vaccination", "treatment", "checkup", "medication"]),
        description: z.string().min(1),
        date: z.string(),
        notes: z.string().optional(),
        severity: z.enum(["low", "medium", "high"]).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const results = [];
      for (const animalId of input.animalIds) {
        try {
          const result = await db.execute(
            sql`
              INSERT INTO healthRecords (animalId, recordType, description, recordDate, notes, severity, createdAt)
              VALUES (${animalId}, ${input.recordType}, ${input.description}, ${input.date}, ${input.notes || null}, ${input.severity || "medium"}, NOW())
            `
          );
          results.push({ animalId, success: true, id: (result as any).insertId });
        } catch (error) {
          results.push({ animalId, success: false, error: String(error) });
        }
      }

      return {
        total: input.animalIds.length,
        successful: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
        details: results,
      };
    }),

  // Bulk add vaccinations
  addVaccinations: protectedProcedure
    .input(
      z.object({
        animalIds: z.array(z.number()).min(1),
        vaccineName: z.string().min(1),
        vaccinationDate: z.string(),
        nextDueDate: z.string().optional(),
        veterinarian: z.string().optional(),
        batchNumber: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const results = [];
      for (const animalId of input.animalIds) {
        try {
          const result = await db.execute(
            sql`
              INSERT INTO vaccinations (animalId, vaccineName, vaccinationDate, nextDueDate, veterinarian, batchNumber, notes, createdAt)
              VALUES (${animalId}, ${input.vaccineName}, ${input.vaccinationDate}, ${input.nextDueDate || null}, ${input.veterinarian || null}, ${input.batchNumber || null}, ${input.notes || null}, NOW())
            `
          );
          results.push({ animalId, success: true, id: (result as any).insertId });
        } catch (error) {
          results.push({ animalId, success: false, error: String(error) });
        }
      }

      return {
        total: input.animalIds.length,
        successful: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
        details: results,
      };
    }),

  // Bulk add performance metrics
  addPerformanceMetrics: protectedProcedure
    .input(
      z.object({
        animalIds: z.array(z.number()).min(1),
        metricType: z.enum(["weight", "milk_production", "egg_production", "growth_rate"]),
        value: z.number().min(0),
        unit: z.string(),
        recordDate: z.string(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const results = [];
      for (const animalId of input.animalIds) {
        try {
          const result = await db.execute(
            sql`
              INSERT INTO performanceMetrics (animalId, metricType, value, unit, recordDate, notes, createdAt)
              VALUES (${animalId}, ${input.metricType}, ${input.value}, ${input.unit}, ${input.recordDate}, ${input.notes || null}, NOW())
            `
          );
          results.push({ animalId, success: true, id: (result as any).insertId });
        } catch (error) {
          results.push({ animalId, success: false, error: String(error) });
        }
      }

      return {
        total: input.animalIds.length,
        successful: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
        details: results,
      };
    }),

  // Get health summary for animals
  getHealthSummary: protectedProcedure
    .input(z.object({ animalIds: z.array(z.number()).min(1) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const summaries = [];
      for (const animalId of input.animalIds) {
        const healthRecords = await db.execute(
          sql`
            SELECT COUNT(*) as count, recordType
            FROM healthRecords
            WHERE animalId = ${animalId}
            GROUP BY recordType
          `
        );

        const vaccinations = await db.execute(
          sql`
            SELECT COUNT(*) as count
            FROM vaccinations
            WHERE animalId = ${animalId}
          `
        );

        summaries.push({
          animalId,
          healthRecords: (healthRecords as any).rows || [],
          vaccinationCount: ((vaccinations as any).rows?.[0]?.count) || 0,
        });
      }

      return summaries;
    }),
});
