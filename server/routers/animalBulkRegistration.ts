import { protectedProcedure, router } from '../_core/trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { getDb } from '../db';
import { animals } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

/**
 * Bulk Animal Registration Router
 * Handles registering multiple animals of the same breed with serial tag IDs
 */

export const animalBulkRegistrationRouter = router({
  /**
   * Register multiple animals of the same breed with serial tag IDs
   * Supports gender distribution: specify femaleCount and rest will be males
   */
  registerBulk: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        typeId: z.number(),
        breed: z.string(),
        gender: z.enum(['male', 'female', 'unknown']).optional(),
        femaleCount: z.number().optional(), // Number of females, rest will be males
        birthDate: z.date().optional(),
        serialTagIds: z.array(z.string()).min(1, 'At least one serial tag ID is required'),
        startingNumber: z.number().optional(), // For auto-generating tag IDs
        tagPrefix: z.string().optional(), // For auto-generating tag IDs (e.g., "COW-")
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
        // Validate farm ownership
        // TODO: Add farm permission check

        const registeredAnimals = [];
        const errors: { tagId: string; error: string }[] = [];

        // Process each serial tag ID
        for (let index = 0; index < input.serialTagIds.length; index++) {
          const tagId = input.serialTagIds[index];
          try {
            // Check if tag already exists
            const existingAnimal = await db
              .select()
              .from(animals)
              .where(eq(animals.uniqueTagId, tagId));

            if (existingAnimal.length > 0) {
              errors.push({
                tagId,
                error: 'Tag ID already exists',
              });
              continue;
            }

            // Determine gender based on femaleCount
            let animalGender = input.gender || 'unknown';
            if (input.femaleCount !== undefined) {
              animalGender = index < input.femaleCount ? 'female' : 'male';
            }

            // Register the animal
            const result = await db.insert(animals).values({
              farmId: input.farmId,
              typeId: input.typeId,
              uniqueTagId: tagId,
              breed: input.breed,
              gender: animalGender,
              birthDate: input.birthDate,
              status: 'active',
            });

            registeredAnimals.push({
              tagId,
              success: true,
            });
          } catch (error) {
            errors.push({
              tagId,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }

        return {
          success: registeredAnimals.length > 0,
          registered: registeredAnimals.length,
          total: input.serialTagIds.length,
          registeredAnimals,
          errors: errors.length > 0 ? errors : undefined,
          message: `Successfully registered ${registeredAnimals.length} out of ${input.serialTagIds.length} animals`,
        };
      } catch (error) {
        console.error('Bulk animal registration error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to register animals in bulk',
        });
      }
    }),

  /**
   * Generate serial tag IDs with auto-increment
   */
  generateSerialTagIds: protectedProcedure
    .input(
      z.object({
        count: z.number().min(1).max(1000),
        prefix: z.string().optional(),
        startingNumber: z.number().default(1),
        padLength: z.number().default(5), // Number of digits to pad (e.g., 00001)
      })
    )
    .query(async ({ input }) => {
      const tagIds: string[] = [];
      const prefix = input.prefix || 'TAG-';

      for (let i = 0; i < input.count; i++) {
        const number = input.startingNumber + i;
        const paddedNumber = number.toString().padStart(input.padLength, '0');
        tagIds.push(`${prefix}${paddedNumber}`);
      }

      return {
        count: tagIds.length,
        tagIds,
      };
    }),

  /**
   * Validate serial tag IDs before bulk registration
   */
  validateSerialTagIds: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        serialTagIds: z.array(z.string()).min(1),
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
        const validation = {
          valid: [] as string[],
          duplicates: [] as string[],
          invalid: [] as string[],
        };

        // Check for duplicates within input
        const seen = new Set<string>();
        for (const tagId of input.serialTagIds) {
          if (!tagId || tagId.trim().length === 0) {
            validation.invalid.push(tagId);
          } else if (seen.has(tagId)) {
            validation.duplicates.push(tagId);
          } else {
            seen.add(tagId);
            validation.valid.push(tagId);
          }
        }

        // Check for existing tags in database
        const existingTags = await db
          .select({ uniqueTagId: animals.uniqueTagId })
          .from(animals)
          .where(eq(animals.farmId, input.farmId));

        const existingTagSet = new Set(existingTags.map((a) => a.uniqueTagId));
        const alreadyExists = validation.valid.filter((tagId) => existingTagSet.has(tagId));

        return {
          totalInput: input.serialTagIds.length,
          valid: validation.valid.length - alreadyExists.length,
          duplicatesInInput: validation.duplicates.length,
          alreadyExists: alreadyExists.length,
          invalid: validation.invalid.length,
          canRegister: validation.valid.length - alreadyExists.length > 0,
          details: {
            validTags: validation.valid.filter((t) => !alreadyExists.includes(t)),
            duplicateTags: validation.duplicates,
            invalidTags: validation.invalid,
            existingTags: alreadyExists,
          },
        };
      } catch (error) {
        console.error('Tag validation error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to validate serial tag IDs',
        });
      }
    }),

  /**
   * Get bulk registration history
   */
  getBulkRegistrationHistory: protectedProcedure
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
        // Get animals registered in bulk (created within last 24 hours with same breed)
        const recentAnimals = await db
          .select()
          .from(animals)
          .where(eq(animals.farmId, input.farmId))
          .orderBy(animals.createdAt)
          .limit(input.limit)
          .offset(input.offset);

        // Group by breed and creation time to identify bulk registrations
        const bulkGroups: Record<string, any[]> = {};
        for (const animal of recentAnimals) {
          const key = `${animal.breed}-${animal.createdAt?.toISOString().split('T')[0]}`;
          if (!bulkGroups[key]) {
            bulkGroups[key] = [];
          }
          bulkGroups[key].push(animal);
        }

        return {
          total: recentAnimals.length,
          bulkGroups: Object.entries(bulkGroups)
            .filter(([_, animals]) => animals.length > 1)
            .map(([key, animalsList]) => ({
              breed: animalsList[0].breed,
              date: animalsList[0].createdAt,
              count: animalsList.length,
              animals: animalsList,
            })),
        };
      } catch (error) {
        console.error('Get bulk registration history error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch bulk registration history',
        });
      }
    }),
});
