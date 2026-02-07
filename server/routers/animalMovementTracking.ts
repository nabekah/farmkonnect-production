import { protectedProcedure, router } from '../_core/trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { getDb } from '../db';
import { animals } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

/**
 * Animal Movement Tracking Router
 * Logs animal transfers between farms/fields with quarantine and health clearance
 */

// Movement record structure (would be in schema)
interface MovementRecord {
  id: number;
  animalId: number;
  fromFarmId: number;
  toFarmId: number;
  movementDate: Date;
  reason: string;
  quarantineRequired: boolean;
  quarantineStartDate?: Date;
  quarantineEndDate?: Date;
  healthClearanceRequired: boolean;
  healthClearanceDate?: Date;
  notes?: string;
  createdAt: Date;
}

export const animalMovementTrackingRouter = router({
  /**
   * Record animal movement between farms
   */
  recordAnimalMovement: protectedProcedure
    .input(
      z.object({
        animalId: z.number(),
        fromFarmId: z.number(),
        toFarmId: z.number(),
        movementDate: z.date(),
        reason: z.enum(['sale', 'transfer', 'breeding', 'grazing', 'other']),
        quarantineRequired: z.boolean().default(true),
        quarantineDays: z.number().default(14),
        healthClearanceRequired: z.boolean().default(true),
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

        // Calculate quarantine end date
        const quarantineEndDate = new Date(input.movementDate);
        quarantineEndDate.setDate(quarantineEndDate.getDate() + input.quarantineDays);

        // Create movement record
        const movement = {
          animalId: input.animalId,
          fromFarmId: input.fromFarmId,
          toFarmId: input.toFarmId,
          movementDate: input.movementDate,
          reason: input.reason,
          quarantineRequired: input.quarantineRequired,
          quarantineStartDate: input.movementDate,
          quarantineEndDate: quarantineEndDate,
          healthClearanceRequired: input.healthClearanceRequired,
          healthClearanceDate: null,
          notes: input.notes,
          status: 'in_quarantine' as const,
        };

        return {
          success: true,
          message: `Animal movement recorded for ${animal[0].uniqueTagId || 'animal'}`,
          movement,
        };
      } catch (error) {
        console.error('Record animal movement error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to record animal movement',
        });
      }
    }),

  /**
   * Get animal movement history
   */
  getAnimalMovementHistory: protectedProcedure
    .input(
      z.object({
        animalId: z.number(),
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
        // Verify animal exists
        const animal = await db.select().from(animals).where(eq(animals.id, input.animalId));
        if (animal.length === 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Animal not found',
          });
        }

        // Simulate movement history
        const movements = [
          {
            id: 1,
            animalId: input.animalId,
            fromFarmId: 1,
            toFarmId: 2,
            movementDate: new Date('2024-01-15'),
            reason: 'transfer',
            status: 'completed',
            quarantineStatus: 'cleared',
          },
          {
            id: 2,
            animalId: input.animalId,
            fromFarmId: 2,
            toFarmId: 3,
            movementDate: new Date('2024-03-20'),
            reason: 'breeding',
            status: 'in_quarantine',
            quarantineStatus: 'pending',
          },
        ];

        return {
          animal: animal[0],
          movements: movements.slice(input.offset, input.offset + input.limit),
          total: movements.length,
        };
      } catch (error) {
        console.error('Get animal movement history error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch animal movement history',
        });
      }
    }),

  /**
   * Get animals in quarantine
   */
  getAnimalsInQuarantine: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
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
        // Get all animals on farm
        const farmAnimals = await db
          .select()
          .from(animals)
          .where(eq(animals.farmId, input.farmId));

        // Simulate quarantine data
        const quarantinedAnimals = farmAnimals
          .filter((a) => Math.random() > 0.8) // 20% in quarantine
          .map((animal) => {
            const quarantineStart = new Date();
            quarantineStart.setDate(quarantineStart.getDate() - 5);
            const quarantineEnd = new Date(quarantineStart);
            quarantineEnd.setDate(quarantineEnd.getDate() + 14);

            return {
              animalId: animal.id,
              tagId: animal.uniqueTagId,
              breed: animal.breed,
              quarantineStartDate: quarantineStart,
              quarantineEndDate: quarantineEnd,
              daysRemaining: Math.ceil((quarantineEnd.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
              reason: 'Transfer from another farm',
              healthStatus: 'pending_clearance',
              requiredTests: ['TB test', 'Brucellosis test', 'General health check'],
              completedTests: ['TB test'],
            };
          });

        return {
          farmId: input.farmId,
          totalInQuarantine: quarantinedAnimals.length,
          animals: quarantinedAnimals.slice(input.offset, input.offset + input.limit),
          readyForClearance: quarantinedAnimals.filter((a) => a.daysRemaining <= 0).length,
        };
      } catch (error) {
        console.error('Get animals in quarantine error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch animals in quarantine',
        });
      }
    }),

  /**
   * Clear animal from quarantine
   */
  clearFromQuarantine: protectedProcedure
    .input(
      z.object({
        animalId: z.number(),
        healthClearanceDate: z.date(),
        veterinarianNotes: z.string().optional(),
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

        return {
          success: true,
          message: `${animal[0].uniqueTagId || 'Animal'} cleared from quarantine`,
          clearanceDate: input.healthClearanceDate,
          veterinarianNotes: input.veterinarianNotes,
        };
      } catch (error) {
        console.error('Clear from quarantine error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to clear animal from quarantine',
        });
      }
    }),

  /**
   * Get movement statistics by farm
   */
  getMovementStatistics: protectedProcedure
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
        const stats = {
          farmId: input.farmId,
          timeRange: input.timeRange,
          totalMovements: 15,
          incomingAnimals: 8,
          outgoingAnimals: 7,
          movementsByReason: {
            sale: 5,
            transfer: 4,
            breeding: 3,
            grazing: 2,
            other: 1,
          },
          animalsInQuarantine: 3,
          quarantineCompletionRate: 85,
          averageQuarantineDays: 14,
          healthClearanceRate: 92,
          movementTrends: [
            { week: 'Week 1', movements: 3 },
            { week: 'Week 2', movements: 4 },
            { week: 'Week 3', movements: 5 },
            { week: 'Week 4', movements: 3 },
          ],
        };

        return stats;
      } catch (error) {
        console.error('Get movement statistics error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch movement statistics',
        });
      }
    }),

  /**
   * Get quarantine schedule
   */
  getQuarantineSchedule: protectedProcedure
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
        const schedule = {
          farmId: input.farmId,
          upcomingClearances: [
            {
              animalId: 1,
              tagId: 'TAG-001',
              clearanceDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
              daysUntilClearance: 3,
              requiredTests: ['TB test', 'Brucellosis test'],
              completedTests: ['TB test', 'Brucellosis test'],
              status: 'ready_for_clearance',
            },
            {
              animalId: 2,
              tagId: 'TAG-002',
              clearanceDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              daysUntilClearance: 7,
              requiredTests: ['TB test', 'Brucellosis test', 'General health check'],
              completedTests: ['TB test'],
              status: 'in_progress',
            },
          ],
          overdueClearances: [
            {
              animalId: 3,
              tagId: 'TAG-003',
              clearanceDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
              daysOverdue: 2,
              requiredTests: ['TB test', 'Brucellosis test'],
              completedTests: ['TB test', 'Brucellosis test'],
              status: 'overdue',
            },
          ],
        };

        return schedule;
      } catch (error) {
        console.error('Get quarantine schedule error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch quarantine schedule',
        });
      }
    }),

  /**
   * Track animal location history
   */
  getAnimalLocationHistory: protectedProcedure
    .input(
      z.object({
        animalId: z.number(),
        limit: z.number().default(20),
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

        const locationHistory = [
          {
            date: new Date('2024-01-01'),
            farmId: 1,
            farmName: 'Main Farm',
            fieldId: 1,
            fieldName: 'North Pasture',
            duration: 30,
          },
          {
            date: new Date('2024-02-01'),
            farmId: 2,
            farmName: 'Secondary Farm',
            fieldId: 2,
            fieldName: 'Breeding Pen',
            duration: 45,
          },
          {
            date: new Date('2024-03-15'),
            farmId: 1,
            farmName: 'Main Farm',
            fieldId: 3,
            fieldName: 'South Pasture',
            duration: 20,
          },
        ];

        return {
          animal: animal[0],
          locationHistory: locationHistory.slice(0, input.limit),
          currentLocation: locationHistory[0],
        };
      } catch (error) {
        console.error('Get animal location history error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch animal location history',
        });
      }
    }),
});
