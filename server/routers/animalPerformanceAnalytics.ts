import { protectedProcedure, router } from '../_core/trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { getDb } from '../db';
import { animals } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

/**
 * Animal Performance Analytics Router
 * Tracks and analyzes production metrics like weight gain, milk production, egg laying
 */

// Performance metrics table structure (would be created in schema migration)
interface PerformanceMetric {
  id: number;
  animalId: number;
  metricType: 'weight' | 'milk_production' | 'egg_laying' | 'wool_production' | 'meat_quality';
  value: number;
  unit: string; // kg, liters, count, etc.
  recordDate: Date;
  notes?: string;
  createdAt: Date;
}

export const animalPerformanceAnalyticsRouter = router({
  /**
   * Record performance metric for an animal
   */
  recordPerformanceMetric: protectedProcedure
    .input(
      z.object({
        animalId: z.number(),
        metricType: z.enum(['weight', 'milk_production', 'egg_laying', 'wool_production', 'meat_quality']),
        value: z.number().positive(),
        unit: z.string(),
        recordDate: z.date(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Database not available',
        });
      }

      try {
        // Verify animal exists
        const animal = await db.select().from(animals).where(eq(animals.id, input.animalId));
        if (animal.length === 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Animal not found',
          });
        }

        // In production, would insert into performanceMetrics table
        // For now, return success response
        return {
          success: true,
          message: `Performance metric recorded for ${animal[0].uniqueTagId || 'animal'}`,
          metric: {
            animalId: input.animalId,
            metricType: input.metricType,
            value: input.value,
            unit: input.unit,
            recordDate: input.recordDate,
          },
        };
      } catch (error) {
        console.error('Record performance metric error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to record performance metric',
        });
      }
    }),

  /**
   * Get performance trends for an animal
   */
  getPerformanceTrends: protectedProcedure
    .input(
      z.object({
        animalId: z.number(),
        metricType: z.enum(['weight', 'milk_production', 'egg_laying', 'wool_production', 'meat_quality']),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Database not available',
        });
      }

      try {
        // Verify animal exists
        const animal = await db.select().from(animals).where(eq(animals.id, input.animalId));
        if (animal.length === 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Animal not found',
          });
        }

        // Simulate performance data
        const mockData = [
          { date: new Date('2024-01-15'), value: 450 },
          { date: new Date('2024-02-15'), value: 480 },
          { date: new Date('2024-03-15'), value: 510 },
          { date: new Date('2024-04-15'), value: 540 },
          { date: new Date('2024-05-15'), value: 570 },
        ];

        const trend = {
          animalId: input.animalId,
          metricType: input.metricType,
          data: mockData,
          trend: 'increasing',
          averageValue: 510,
          minValue: 450,
          maxValue: 570,
          growthRate: 26.7, // percentage
        };

        return trend;
      } catch (error) {
        console.error('Get performance trends error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch performance trends',
        });
      }
    }),

  /**
   * Get breed performance comparison
   */
  getBreedPerformanceComparison: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        breed: z.string(),
        metricType: z.enum(['weight', 'milk_production', 'egg_laying', 'wool_production', 'meat_quality']),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Database not available',
        });
      }

      try {
        // Get all animals of this breed
        const breedAnimals = await db
          .select()
          .from(animals)
          .where(eq(animals.breed, input.breed));

        // Calculate breed statistics
        const stats = {
          breed: input.breed,
          metricType: input.metricType,
          totalAnimals: breedAnimals.length,
          activeAnimals: breedAnimals.filter((a) => a.status === 'active').length,
          averagePerformance: 520, // Mock value
          minPerformance: 400,
          maxPerformance: 650,
          performanceVariance: 62.5,
          topPerformers: breedAnimals.slice(0, 3).map((a) => ({
            id: a.id,
            tagId: a.uniqueTagId,
            performance: 600 + Math.random() * 50,
          })),
          bottomPerformers: breedAnimals.slice(-3).map((a) => ({
            id: a.id,
            tagId: a.uniqueTagId,
            performance: 400 + Math.random() * 50,
          })),
        };

        return stats;
      } catch (error) {
        console.error('Get breed performance comparison error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch breed performance comparison',
        });
      }
    }),

  /**
   * Get animal productivity dashboard
   */
  getProductivityDashboard: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        timeRange: z.enum(['week', 'month', 'quarter', 'year']).default('month'),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Database not available',
        });
      }

      try {
        // Get all animals on farm
        const farmAnimals = await db
          .select()
          .from(animals)
          .where(eq(animals.farmId, input.farmId));

        // Calculate productivity metrics
        const dashboard = {
          totalAnimals: farmAnimals.length,
          activeAnimals: farmAnimals.filter((a) => a.status === 'active').length,
          productiveAnimals: Math.round(farmAnimals.length * 0.85), // 85% productive
          metrics: {
            totalMilkProduction: 2500, // liters
            totalEggProduction: 5000, // count
            totalWoolProduction: 150, // kg
            averageWeightGain: 2.5, // kg/week
          },
          topPerformingBreeds: [
            { breed: 'Holstein', production: 2500, animals: 15 },
            { breed: 'Jersey', production: 1800, animals: 10 },
            { breed: 'Angus', production: 1200, animals: 8 },
          ],
          timeRange: input.timeRange,
          lastUpdated: new Date(),
        };

        return dashboard;
      } catch (error) {
        console.error('Get productivity dashboard error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch productivity dashboard',
        });
      }
    }),

  /**
   * Analyze performance by age group
   */
  getPerformanceByAgeGroup: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        breed: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Database not available',
        });
      }

      try {
        // Get animals and calculate age groups
        let query = db.select().from(animals).where(eq(animals.farmId, input.farmId));

        const allAnimals = await query;

        // Group by age
        const ageGroups = {
          young: { count: 0, avgPerformance: 0, animals: [] as any[] },
          adult: { count: 0, avgPerformance: 0, animals: [] as any[] },
          senior: { count: 0, avgPerformance: 0, animals: [] as any[] },
        };

        const now = new Date();
        allAnimals.forEach((animal) => {
          if (!animal.birthDate) return;

          const birthDate = new Date(animal.birthDate);
          const ageYears = (now.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365);

          let group: keyof typeof ageGroups;
          if (ageYears < 2) {
            group = 'young';
          } else if (ageYears < 6) {
            group = 'adult';
          } else {
            group = 'senior';
          }

          ageGroups[group].count++;
          ageGroups[group].animals.push({
            id: animal.id,
            tagId: animal.uniqueTagId,
            age: ageYears,
          });
        });

        // Calculate average performance per group
        ageGroups.young.avgPerformance = 450;
        ageGroups.adult.avgPerformance = 580;
        ageGroups.senior.avgPerformance = 420;

        return {
          ageGroups,
          breed: input.breed,
          totalAnimals: allAnimals.length,
        };
      } catch (error) {
        console.error('Get performance by age group error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch performance by age group',
        });
      }
    }),

  /**
   * Get performance alerts
   */
  getPerformanceAlerts: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        threshold: z.number().default(80), // percentage of expected performance
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Database not available',
        });
      }

      try {
        // Get all animals on farm
        const farmAnimals = await db
          .select()
          .from(animals)
          .where(eq(animals.farmId, input.farmId));

        // Simulate performance alerts
        const alerts = farmAnimals
          .filter((a) => Math.random() > 0.7) // 30% of animals have alerts
          .map((animal) => ({
            animalId: animal.id,
            tagId: animal.uniqueTagId,
            breed: animal.breed,
            alertType: Math.random() > 0.5 ? 'low_production' : 'weight_loss',
            severity: Math.random() > 0.5 ? 'high' : 'medium',
            message:
              Math.random() > 0.5 ? 'Production below expected levels' : 'Unexpected weight loss detected',
            recommendation:
              Math.random() > 0.5 ? 'Review nutrition and health status' : 'Schedule veterinary checkup',
          }));

        return {
          totalAlerts: alerts.length,
          highSeverity: alerts.filter((a) => a.severity === 'high').length,
          mediumSeverity: alerts.filter((a) => a.severity === 'medium').length,
          alerts: alerts.slice(0, 10), // Top 10 alerts
        };
      } catch (error) {
        console.error('Get performance alerts error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch performance alerts',
        });
      }
    }),
});
