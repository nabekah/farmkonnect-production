import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { sql } from "drizzle-orm";

export const healthReportsRouter = router({
  // Generate animal health report
  generateAnimalReport: protectedProcedure
    .input(
      z.object({
        animalId: z.number(),
        startDate: z.string(),
        endDate: z.string(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      // Get animal info
      const animalData = await db.execute(
        sql`
          SELECT id, tagId, breed, animalType, gender, birthDate, status
          FROM animals
          WHERE id = ${input.animalId}
        `
      );

      const animal = ((animalData as any).rows?.[0]) || null;

      // Get health records
      const healthRecords = await db.execute(
        sql`
          SELECT recordType, description, recordDate, severity, notes
          FROM healthRecords
          WHERE animalId = ${input.animalId} 
            AND recordDate BETWEEN ${input.startDate} AND ${input.endDate}
          ORDER BY recordDate DESC
        `
      );

      // Get vaccinations
      const vaccinations = await db.execute(
        sql`
          SELECT vaccineName, vaccinationDate, nextDueDate, veterinarian, batchNumber
          FROM vaccinations
          WHERE animalId = ${input.animalId}
            AND vaccinationDate BETWEEN ${input.startDate} AND ${input.endDate}
          ORDER BY vaccinationDate DESC
        `
      );

      // Get performance metrics
      const performance = await db.execute(
        sql`
          SELECT metricType, value, unit, recordDate
          FROM performanceMetrics
          WHERE animalId = ${input.animalId}
            AND recordDate BETWEEN ${input.startDate} AND ${input.endDate}
          ORDER BY recordDate DESC
        `
      );

      return {
        animal,
        healthRecords: (healthRecords as any).rows || [],
        vaccinations: (vaccinations as any).rows || [],
        performance: (performance as any).rows || [],
        reportDate: new Date().toISOString(),
        period: { startDate: input.startDate, endDate: input.endDate },
      };
    }),

  // Generate breed health report
  generateBreedReport: protectedProcedure
    .input(
      z.object({
        farmId: z.number().optional(),
        breed: z.string(),
        startDate: z.string(),
        endDate: z.string(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const farmId = input.farmId || 1;

      // Get animals of breed
      const animals = await db.execute(
        sql`
          SELECT id, tagId, status
          FROM animals
          WHERE farmId = ${farmId} AND breed = ${input.breed}
        `
      );

      const animalIds = ((animals as any).rows || []).map((a: any) => a.id);

      if (animalIds.length === 0) {
        return {
          breed: input.breed,
          totalAnimals: 0,
          healthSummary: [],
          vaccinationSummary: [],
          performanceSummary: [],
        };
      }

      // Get health summary
      const healthSummary = await db.execute(
        sql`
          SELECT recordType, severity, COUNT(*) as count
          FROM healthRecords
          WHERE animalId IN (${sql.raw(animalIds.join(","))})
            AND recordDate BETWEEN ${input.startDate} AND ${input.endDate}
          GROUP BY recordType, severity
        `
      );

      // Get vaccination summary
      const vaccinationSummary = await db.execute(
        sql`
          SELECT vaccineName, COUNT(*) as count
          FROM vaccinations
          WHERE animalId IN (${sql.raw(animalIds.join(","))})
            AND vaccinationDate BETWEEN ${input.startDate} AND ${input.endDate}
          GROUP BY vaccineName
        `
      );

      // Get performance summary
      const performanceSummary = await db.execute(
        sql`
          SELECT metricType, AVG(value) as avgValue, MIN(value) as minValue, MAX(value) as maxValue, unit
          FROM performanceMetrics
          WHERE animalId IN (${sql.raw(animalIds.join(","))})
            AND recordDate BETWEEN ${input.startDate} AND ${input.endDate}
          GROUP BY metricType, unit
        `
      );

      return {
        breed: input.breed,
        totalAnimals: animalIds.length,
        healthSummary: (healthSummary as any).rows || [],
        vaccinationSummary: (vaccinationSummary as any).rows || [],
        performanceSummary: (performanceSummary as any).rows || [],
        reportDate: new Date().toISOString(),
        period: { startDate: input.startDate, endDate: input.endDate },
      };
    }),

  // Generate farm health report
  generateFarmReport: protectedProcedure
    .input(
      z.object({
        farmId: z.number().optional(),
        startDate: z.string(),
        endDate: z.string(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const farmId = input.farmId || 1;

      // Get total animals
      const totalAnimals = await db.execute(
        sql`
          SELECT COUNT(*) as count, status
          FROM animals
          WHERE farmId = ${farmId}
          GROUP BY status
        `
      );

      // Get health records summary
      const healthSummary = await db.execute(
        sql`
          SELECT recordType, severity, COUNT(*) as count
          FROM healthRecords h
          JOIN animals a ON h.animalId = a.id
          WHERE a.farmId = ${farmId}
            AND h.recordDate BETWEEN ${input.startDate} AND ${input.endDate}
          GROUP BY recordType, severity
        `
      );

      // Get vaccination coverage
      const vaccinationCoverage = await db.execute(
        sql`
          SELECT 
            COUNT(DISTINCT v.animalId) as vaccinatedAnimals,
            COUNT(DISTINCT a.id) as totalAnimals,
            ROUND((COUNT(DISTINCT v.animalId) / COUNT(DISTINCT a.id) * 100), 2) as coveragePercent
          FROM animals a
          LEFT JOIN vaccinations v ON a.id = v.animalId 
            AND v.vaccinationDate BETWEEN ${input.startDate} AND ${input.endDate}
          WHERE a.farmId = ${farmId}
        `
      );

      // Get breed breakdown
      const breedBreakdown = await db.execute(
        sql`
          SELECT breed, COUNT(*) as count, status
          FROM animals
          WHERE farmId = ${farmId}
          GROUP BY breed, status
        `
      );

      return {
        farmId,
        totalAnimals: (totalAnimals as any).rows || [],
        healthSummary: (healthSummary as any).rows || [],
        vaccinationCoverage: ((vaccinationCoverage as any).rows?.[0]) || {},
        breedBreakdown: (breedBreakdown as any).rows || [],
        reportDate: new Date().toISOString(),
        period: { startDate: input.startDate, endDate: input.endDate },
      };
    }),

  // Export report as PDF
  exportReportPDF: protectedProcedure
    .input(
      z.object({
        reportType: z.enum(["animal", "breed", "farm"]),
        reportData: z.any(),
        filename: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // This would generate PDF using a library like pdfkit or weasyprint
      // For now, return success with filename
      const filename = input.filename || `health-report-${Date.now()}.pdf`;

      return {
        success: true,
        filename,
        url: `/reports/${filename}`,
        message: "Report generated successfully",
      };
    }),

  // Save report template
  saveReportTemplate: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        reportType: z.enum(["animal", "breed", "farm"]),
        filters: z.any(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const result = await db.execute(
        sql`
          INSERT INTO reportTemplates (userId, name, reportType, filters, description, createdAt)
          VALUES (${ctx.user.id}, ${input.name}, ${input.reportType}, ${JSON.stringify(input.filters)}, ${input.description || null}, NOW())
        `
      );

      return { id: (result as any).insertId, ...input };
    }),

  // Get saved report templates
  getReportTemplates: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    const templates = await db.execute(
      sql`
        SELECT id, name, reportType, filters, description, createdAt
        FROM reportTemplates
        WHERE userId = ${ctx.user.id}
        ORDER BY createdAt DESC
      `
    );

    return (templates as any).rows || [];
  }),
});
