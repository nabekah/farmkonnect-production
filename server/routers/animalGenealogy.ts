import { protectedProcedure, router } from '../_core/trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { getDb } from '../db';
import { animals, breedingRecords } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

/**
 * Animal Genealogy Tracking Router
 * Handles parent-offspring relationships and bloodline tracking
 */

export const animalGenealogyRouter = router({
  /**
   * Link parent and offspring animals
   */
  linkParentOffspring: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        offspringId: z.number(),
        sireId: z.number().optional(),
        damId: z.number().optional(),
        breedingDate: z.date(),
        expectedDueDate: z.date().optional(),
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
        // Verify all animals exist
        const offspring = await db.select().from(animals).where(eq(animals.id, input.offspringId));
        if (offspring.length === 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Offspring animal not found',
          });
        }

        if (input.sireId) {
          const sire = await db.select().from(animals).where(eq(animals.id, input.sireId));
          if (sire.length === 0) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'Sire animal not found',
            });
          }
        }

        if (input.damId) {
          const dam = await db.select().from(animals).where(eq(animals.id, input.damId));
          if (dam.length === 0) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'Dam animal not found',
            });
          }
        }

        // Create breeding record
        await db.insert(breedingRecords).values({
          animalId: input.offspringId,
          breedingDate: input.breedingDate,
          sireId: input.sireId,
          damId: input.damId,
          expectedDueDate: input.expectedDueDate,
          outcome: 'successful',
          notes: input.notes,
        });

        return {
          success: true,
          message: 'Parent-offspring relationship created successfully',
        };
      } catch (error) {
        console.error('Link parent offspring error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to link parent and offspring',
        });
      }
    }),

  /**
   * Get animal pedigree (ancestors)
   */
  getAnimalPedigree: protectedProcedure
    .input(
      z.object({
        animalId: z.number(),
        generations: z.number().default(3),
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
        // Get the animal
        const animal = await db.select().from(animals).where(eq(animals.id, input.animalId));
        if (animal.length === 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Animal not found',
          });
        }

        // Get breeding records for this animal
        const breedingRecord = await db
          .select()
          .from(breedingRecords)
          .where(eq(breedingRecords.animalId, input.animalId));

        // Build pedigree tree
        const pedigree = {
          animal: animal[0],
          sire: null as any,
          dam: null as any,
          breedingInfo: breedingRecord[0] || null,
        };

        if (breedingRecord.length > 0) {
          const record = breedingRecord[0];
          
          if (record.sireId) {
            const sire = await db.select().from(animals).where(eq(animals.id, record.sireId));
            pedigree.sire = sire[0] || null;
          }

          if (record.damId) {
            const dam = await db.select().from(animals).where(eq(animals.id, record.damId));
            pedigree.dam = dam[0] || null;
          }
        }

        return pedigree;
      } catch (error) {
        console.error('Get animal pedigree error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch animal pedigree',
        });
      }
    }),

  /**
   * Get animal offspring
   */
  getAnimalOffspring: protectedProcedure
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
        // Get breeding records where this animal is sire or dam
        const offspring = await db
          .select()
          .from(breedingRecords)
          .where(eq(breedingRecords.sireId, input.animalId))
          .limit(input.limit)
          .offset(input.offset);

        const damOffspring = await db
          .select()
          .from(breedingRecords)
          .where(eq(breedingRecords.damId, input.animalId))
          .limit(input.limit)
          .offset(input.offset);

        // Get animal details for offspring
        const offspringIds = [...offspring, ...damOffspring].map((r) => r.animalId);
        const offspringAnimals = offspringIds.length > 0
          ? await db.select().from(animals).where(eq(animals.id, offspringIds[0]))
          : [];

        return {
          sireOffspring: offspring,
          damOffspring: damOffspring,
          totalOffspring: offspring.length + damOffspring.length,
          offspringAnimals: offspringAnimals,
        };
      } catch (error) {
        console.error('Get animal offspring error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch animal offspring',
        });
      }
    }),

  /**
   * Get bloodline statistics
   */
  getBloodlineStats: protectedProcedure
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
        // Get all animals of this breed on the farm
        const breedAnimals = await db
          .select()
          .from(animals)
          .where(eq(animals.breed, input.breed));

        // Count breeding records
        const totalBreedingRecords = await db.select().from(breedingRecords);

        // Calculate statistics
        const stats = {
          totalAnimals: breedAnimals.length,
          activeAnimals: breedAnimals.filter((a) => a.status === 'active').length,
          maleCount: breedAnimals.filter((a) => a.gender === 'male').length,
          femaleCount: breedAnimals.filter((a) => a.gender === 'female').length,
          totalBreedingRecords: totalBreedingRecords.length,
          averageOffspringPerSire: 0,
          inbreedingRisk: 'low' as const,
        };

        // Calculate average offspring per sire
        const sireOffspringMap: Record<number, number> = {};
        totalBreedingRecords.forEach((record) => {
          if (record.sireId) {
            sireOffspringMap[record.sireId] = (sireOffspringMap[record.sireId] || 0) + 1;
          }
        });

        const sireCount = Object.keys(sireOffspringMap).length;
        if (sireCount > 0) {
          const totalOffspring = Object.values(sireOffspringMap).reduce((a, b) => a + b, 0);
          stats.averageOffspringPerSire = totalOffspring / sireCount;
        }

        return stats;
      } catch (error) {
        console.error('Get bloodline stats error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch bloodline statistics',
        });
      }
    }),

  /**
   * Detect potential inbreeding
   */
  detectInbreeding: protectedProcedure
    .input(
      z.object({
        sireId: z.number(),
        damId: z.number(),
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
        // Get pedigree for both sire and dam
        const sireBreeding = await db
          .select()
          .from(breedingRecords)
          .where(eq(breedingRecords.animalId, input.sireId));

        const damBreeding = await db
          .select()
          .from(breedingRecords)
          .where(eq(breedingRecords.animalId, input.damId));

        // Check for common ancestors
        const sireAncestors = new Set<number>();
        const damAncestors = new Set<number>();

        if (sireBreeding.length > 0) {
          const record = sireBreeding[0];
          if (record.sireId) sireAncestors.add(record.sireId);
          if (record.damId) sireAncestors.add(record.damId);
        }

        if (damBreeding.length > 0) {
          const record = damBreeding[0];
          if (record.sireId) damAncestors.add(record.sireId);
          if (record.damId) damAncestors.add(record.damId);
        }

        // Find common ancestors
        const commonAncestors = Array.from(sireAncestors).filter((id) => damAncestors.has(id));

        return {
          hasCommonAncestors: commonAncestors.length > 0,
          commonAncestorCount: commonAncestors.length,
          inbreedingRisk: commonAncestors.length > 0 ? 'moderate' : 'low',
          recommendation: commonAncestors.length > 0 
            ? 'Consider alternative breeding partners to reduce inbreeding risk'
            : 'Safe to proceed with breeding',
        };
      } catch (error) {
        console.error('Detect inbreeding error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to detect inbreeding',
        });
      }
    }),
});
