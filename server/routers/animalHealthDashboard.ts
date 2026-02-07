import { protectedProcedure, router } from '../_core/trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { getDb } from '../db';
import { animals, animalHealthRecords } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

/**
 * Animal Health Dashboard Router
 * Handles health tracking, vaccination schedules, and health alerts
 */

export const animalHealthDashboardRouter = router({
  /**
   * Get health dashboard summary
   */
  getHealthDashboard: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
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

        // Get health records
        const healthRecords = await db.select().from(animalHealthRecords);

        // Calculate statistics
        const stats = {
          totalAnimals: farmAnimals.length,
          activeAnimals: farmAnimals.filter((a) => a.status === 'active').length,
          healthyAnimals: farmAnimals.length - (healthRecords.filter((r) => r.eventType === 'illness').length),
          sickAnimals: healthRecords.filter((r) => r.eventType === 'illness').length,
          vaccinated: healthRecords.filter((r) => r.eventType === 'vaccination').length,
          treatmentsThisMonth: healthRecords.filter((r) => {
            const recordDate = new Date(r.recordDate);
            const now = new Date();
            return r.eventType === 'treatment' && 
                   recordDate.getMonth() === now.getMonth() &&
                   recordDate.getFullYear() === now.getFullYear();
          }).length,
        };

        return {
          summary: stats,
          lastUpdated: new Date(),
        };
      } catch (error) {
        console.error('Get health dashboard error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch health dashboard',
        });
      }
    }),

  /**
   * Get vaccination schedule for animals
   */
  getVaccinationSchedule: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        animalId: z.number().optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
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
        // Get vaccination records
        let vaccinations = await db
          .select()
          .from(animalHealthRecords)
          .where(eq(animalHealthRecords.eventType, 'vaccination'));

        if (input.animalId) {
          vaccinations = vaccinations.filter((v) => v.animalId === input.animalId);
        }

        // Get animal details for each vaccination
        const vaccinationWithAnimals = await Promise.all(
          vaccinations.map(async (vac) => {
            const animal = await db.select().from(animals).where(eq(animals.id, vac.animalId));
            return {
              ...vac,
              animal: animal[0] || null,
            };
          })
        );

        // Calculate next vaccination dates (example: annual boosters)
        const schedule = vaccinationWithAnimals.map((vac) => {
          const lastVacDate = new Date(vac.recordDate);
          const nextVacDate = new Date(lastVacDate);
          nextVacDate.setFullYear(nextVacDate.getFullYear() + 1);

          return {
            ...vac,
            lastVaccinationDate: vac.recordDate,
            nextVaccinationDate: nextVacDate,
            daysUntilDue: Math.ceil((nextVacDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
            isDue: nextVacDate <= new Date(),
          };
        });

        return {
          schedule: schedule.slice(input.offset, input.offset + input.limit),
          total: schedule.length,
          overdue: schedule.filter((s) => s.isDue).length,
        };
      } catch (error) {
        console.error('Get vaccination schedule error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch vaccination schedule',
        });
      }
    }),

  /**
   * Get health alerts for animals
   */
  getHealthAlerts: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        severity: z.enum(['low', 'medium', 'high']).optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
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
        // Get recent health issues
        const illnessRecords = await db
          .select()
          .from(animalHealthRecords)
          .where(eq(animalHealthRecords.eventType, 'illness'));

        // Get animal details
        const alerts = await Promise.all(
          illnessRecords.map(async (record) => {
            const animal = await db.select().from(animals).where(eq(animals.id, record.animalId));
            
            // Determine severity based on record details
            let severity: 'low' | 'medium' | 'high' = 'low';
            if (record.details && record.details.toLowerCase().includes('critical')) {
              severity = 'high';
            } else if (record.details && record.details.toLowerCase().includes('serious')) {
              severity = 'medium';
            }

            return {
              id: record.id,
              animalId: record.animalId,
              animal: animal[0] || null,
              recordDate: record.recordDate,
              details: record.details,
              severity,
              veterinarianUserId: record.veterinarianUserId,
              createdAt: record.createdAt,
            };
          })
        );

        // Filter by severity if provided
        let filtered = alerts;
        if (input.severity) {
          filtered = filtered.filter((a) => a.severity === input.severity);
        }

        // Sort by date (newest first)
        filtered.sort((a, b) => new Date(b.recordDate).getTime() - new Date(a.recordDate).getTime());

        return {
          alerts: filtered.slice(input.offset, input.offset + input.limit),
          total: filtered.length,
          highSeverity: filtered.filter((a) => a.severity === 'high').length,
          mediumSeverity: filtered.filter((a) => a.severity === 'medium').length,
        };
      } catch (error) {
        console.error('Get health alerts error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch health alerts',
        });
      }
    }),

  /**
   * Record health event for an animal
   */
  recordHealthEvent: protectedProcedure
    .input(
      z.object({
        animalId: z.number(),
        eventType: z.enum(['vaccination', 'treatment', 'illness', 'checkup', 'other']),
        recordDate: z.date(),
        details: z.string().optional(),
        veterinarianUserId: z.number().optional(),
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

        // Record the health event
        await db.insert(animalHealthRecords).values({
          animalId: input.animalId,
          recordDate: input.recordDate,
          eventType: input.eventType,
          details: input.details,
          veterinarianUserId: input.veterinarianUserId,
        });

        return {
          success: true,
          message: `Health event recorded for ${animal[0].uniqueTagId || 'animal'}`,
        };
      } catch (error) {
        console.error('Record health event error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to record health event',
        });
      }
    }),

  /**
   * Get animal health history
   */
  getAnimalHealthHistory: protectedProcedure
    .input(
      z.object({
        animalId: z.number(),
        eventType: z.enum(['vaccination', 'treatment', 'illness', 'checkup', 'other']).optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
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
        // Get animal
        const animal = await db.select().from(animals).where(eq(animals.id, input.animalId));
        if (animal.length === 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Animal not found',
          });
        }

        // Get health records
        let records = await db
          .select()
          .from(animalHealthRecords)
          .where(eq(animalHealthRecords.animalId, input.animalId));

        if (input.eventType) {
          records = records.filter((r) => r.eventType === input.eventType);
        }

        // Sort by date (newest first)
        records.sort((a, b) => new Date(b.recordDate).getTime() - new Date(a.recordDate).getTime());

        return {
          animal: animal[0],
          healthHistory: records.slice(input.offset, input.offset + input.limit),
          total: records.length,
          summary: {
            vaccinations: records.filter((r) => r.eventType === 'vaccination').length,
            treatments: records.filter((r) => r.eventType === 'treatment').length,
            illnesses: records.filter((r) => r.eventType === 'illness').length,
            checkups: records.filter((r) => r.eventType === 'checkup').length,
          },
        };
      } catch (error) {
        console.error('Get animal health history error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch animal health history',
        });
      }
    }),

  /**
   * Get health statistics by breed
   */
  getBreedHealthStats: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        breed: z.string(),
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

        // Get health records for these animals
        const healthRecords = await db.select().from(animalHealthRecords);

        const breedHealthRecords = healthRecords.filter((r) =>
          breedAnimals.some((a) => a.id === r.animalId)
        );

        return {
          breed: input.breed,
          totalAnimals: breedAnimals.length,
          totalHealthRecords: breedHealthRecords.length,
          vaccinations: breedHealthRecords.filter((r) => r.eventType === 'vaccination').length,
          treatments: breedHealthRecords.filter((r) => r.eventType === 'treatment').length,
          illnesses: breedHealthRecords.filter((r) => r.eventType === 'illness').length,
          checkups: breedHealthRecords.filter((r) => r.eventType === 'checkup').length,
          healthScore: breedAnimals.length > 0
            ? Math.round(
                ((breedAnimals.length - breedHealthRecords.filter((r) => r.eventType === 'illness').length) /
                  breedAnimals.length) *
                  100
              )
            : 0,
        };
      } catch (error) {
        console.error('Get breed health stats error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch breed health statistics',
        });
      }
    }),
});
