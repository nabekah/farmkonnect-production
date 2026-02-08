import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { z } from "zod";
import { and, eq, gte, lte } from "drizzle-orm";
import {
  animals,
  speciesTemplates,
  productionMetricsTemplates,
  speciesProductionRecords,
} from "../../drizzle/schema";

export const speciesReportsRouter = router({
  // Get production report by species
  getProductionReport: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        speciesName: z.string(),
        startDate: z.date(),
        endDate: z.date(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = ctx.db;
      if (!db) throw new Error("Database not available");

      // Get animals of this species
      const speciesAnimals = await db
        .select()
        .from(animals)
        .where(
          and(
            eq(animals.farmId, input.farmId),
            eq(animals.animalType, input.speciesName)
          )
        );

      // Get production metrics for this species
      const metrics = await db
        .select()
        .from(productionMetricsTemplates)
        .where(
          eq(
            productionMetricsTemplates.speciesId,
            speciesAnimals[0]?.id || 0
          )
        );

      return {
        species: input.speciesName,
        animalCount: speciesAnimals.length,
        metrics: metrics,
        reportPeriod: {
          start: input.startDate,
          end: input.endDate,
        },
      };
    }),

  // Get herd health summary by species
  getHerdHealthSummary: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        speciesName: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = ctx.db;
      if (!db) throw new Error("Database not available");

      const speciesAnimals = await db
        .select()
        .from(animals)
        .where(
          and(
            eq(animals.farmId, input.farmId),
            eq(animals.animalType, input.speciesName)
          )
        );

      const healthyCount = speciesAnimals.filter(
        (a) => a.healthStatus === "Healthy"
      ).length;
      const sickCount = speciesAnimals.filter(
        (a) => a.healthStatus === "Sick"
      ).length;
      const treatedCount = speciesAnimals.filter(
        (a) => a.healthStatus === "Treated"
      ).length;

      return {
        species: input.speciesName,
        totalAnimals: speciesAnimals.length,
        healthyCount,
        sickCount,
        treatedCount,
        healthPercentage: (healthyCount / speciesAnimals.length) * 100,
      };
    }),

  // Get breeding performance report
  getBreedingPerformanceReport: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        speciesName: z.string(),
        year: z.number(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = ctx.db;
      if (!db) throw new Error("Database not available");

      const speciesAnimals = await db
        .select()
        .from(animals)
        .where(
          and(
            eq(animals.farmId, input.farmId),
            eq(animals.animalType, input.speciesName)
          )
        );

      const femaleCount = speciesAnimals.filter(
        (a) => a.gender === "Female"
      ).length;
      const maleCount = speciesAnimals.filter(
        (a) => a.gender === "Male"
      ).length;
      const breedingAge = speciesAnimals.filter((a) => {
        if (!a.dateOfBirth) return false;
        const age =
          (new Date().getTime() - a.dateOfBirth.getTime()) /
          (1000 * 60 * 60 * 24 * 365);
        return age >= 1;
      }).length;

      return {
        species: input.speciesName,
        year: input.year,
        femaleCount,
        maleCount,
        breedingAgeCount: breedingAge,
        sexRatio: (femaleCount / (maleCount || 1)).toFixed(2),
      };
    }),

  // Get financial analysis by species
  getFinancialAnalysis: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        speciesName: z.string(),
        startDate: z.date(),
        endDate: z.date(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = ctx.db;
      if (!db) throw new Error("Database not available");

      // This would typically query financial records
      // For now, return placeholder data
      return {
        species: input.speciesName,
        period: {
          start: input.startDate,
          end: input.endDate,
        },
        revenue: 0,
        expenses: 0,
        profit: 0,
        profitMargin: 0,
      };
    }),

  // Get benchmarking comparison
  getBenchmarkComparison: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        speciesName: z.string(),
        metricName: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = ctx.db;
      if (!db) throw new Error("Database not available");

      const species = await db
        .select()
        .from(speciesTemplates)
        .where(eq(speciesTemplates.speciesName, input.speciesName))
        .limit(1);

      if (!species.length) {
        throw new Error(`Species ${input.speciesName} not found`);
      }

      const metrics = await db
        .select()
        .from(productionMetricsTemplates)
        .where(
          and(
            eq(productionMetricsTemplates.speciesId, species[0].id),
            eq(productionMetricsTemplates.metricName, input.metricName)
          )
        )
        .limit(1);

      if (!metrics.length) {
        throw new Error(`Metric ${input.metricName} not found`);
      }

      return {
        species: input.speciesName,
        metric: input.metricName,
        benchmark: {
          min: metrics[0].benchmarkMin,
          average: metrics[0].benchmarkAverage,
          max: metrics[0].benchmarkMax,
        },
        farmPerformance: {
          current: 0, // Would be calculated from actual data
          trend: "stable",
        },
      };
    }),

  // Generate comprehensive species report
  generateComprehensiveReport: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        speciesName: z.string(),
        includeFinancials: z.boolean().default(true),
        includeBreeding: z.boolean().default(true),
        includeHealth: z.boolean().default(true),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = ctx.db;
      if (!db) throw new Error("Database not available");

      const report: any = {
        species: input.speciesName,
        generatedAt: new Date(),
        sections: [],
      };

      if (input.includeHealth) {
        const healthSummary = await db
          .select()
          .from(animals)
          .where(
            and(
              eq(animals.farmId, input.farmId),
              eq(animals.animalType, input.speciesName)
            )
          );

        report.sections.push({
          name: "Health Summary",
          data: {
            totalAnimals: healthSummary.length,
            healthy: healthSummary.filter(
              (a) => a.healthStatus === "Healthy"
            ).length,
          },
        });
      }

      if (input.includeBreeding) {
        report.sections.push({
          name: "Breeding Performance",
          data: {
            females: 0,
            males: 0,
            breedingAge: 0,
          },
        });
      }

      if (input.includeFinancials) {
        report.sections.push({
          name: "Financial Analysis",
          data: {
            revenue: 0,
            expenses: 0,
            profit: 0,
          },
        });
      }

      return report;
    }),
});
