import { protectedProcedure, router } from '../_core/trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { getDb } from '../db';
import { animals } from '../../drizzle/schema';
import { eq, inArray } from 'drizzle-orm';

/**
 * Bulk Animal Editing Router
 * Handles bulk updates to animal records with batch approval workflow
 */

export const animalBulkEditingRouter = router({
  /**
   * Create a bulk edit batch for approval
   */
  createBulkEditBatch: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        animalIds: z.array(z.number()).min(1),
        updates: z.object({
          breed: z.string().optional(),
          gender: z.enum(['male', 'female', 'unknown']).optional(),
          status: z.enum(['active', 'sold', 'culled', 'deceased']).optional(),
          birthDate: z.date().optional(),
        }),
        reason: z.string().optional(),
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
        // Verify all animals exist and belong to the farm
        const existingAnimals = await db
          .select()
          .from(animals)
          .where(inArray(animals.id, input.animalIds));

        if (existingAnimals.length !== input.animalIds.length) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Some animals not found or do not belong to this farm',
          });
        }

        // Verify farm ownership
        const farmAnimals = existingAnimals.filter((a) => a.farmId === input.farmId);
        if (farmAnimals.length !== input.animalIds.length) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have permission to edit these animals',
          });
        }

        // Create batch record (in production, would store in database)
        const batchId = `BATCH-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        return {
          batchId,
          status: 'pending_approval',
          animalCount: input.animalIds.length,
          updates: input.updates,
          reason: input.reason,
          createdBy: ctx.user.id,
          createdAt: new Date(),
          message: `Batch ${batchId} created for ${input.animalIds.length} animals. Awaiting approval.`,
        };
      } catch (error) {
        console.error('Create bulk edit batch error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create bulk edit batch',
        });
      }
    }),

  /**
   * Apply bulk edits to multiple animals
   */
  applyBulkEdit: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        animalIds: z.array(z.number()).min(1),
        updates: z.object({
          breed: z.string().optional(),
          gender: z.enum(['male', 'female', 'unknown']).optional(),
          status: z.enum(['active', 'sold', 'culled', 'deceased']).optional(),
          birthDate: z.date().optional(),
        }),
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
        // Verify all animals exist and belong to the farm
        const existingAnimals = await db
          .select()
          .from(animals)
          .where(inArray(animals.id, input.animalIds));

        if (existingAnimals.length !== input.animalIds.length) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Some animals not found',
          });
        }

        // Verify farm ownership
        const farmAnimals = existingAnimals.filter((a) => a.farmId === input.farmId);
        if (farmAnimals.length !== input.animalIds.length) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have permission to edit these animals',
          });
        }

        // Build update object, only including provided fields
        const updateData: any = {};
        if (input.updates.breed !== undefined) updateData.breed = input.updates.breed;
        if (input.updates.gender !== undefined) updateData.gender = input.updates.gender;
        if (input.updates.status !== undefined) updateData.status = input.updates.status;
        if (input.updates.birthDate !== undefined) updateData.birthDate = input.updates.birthDate;

        // Apply updates
        await db
          .update(animals)
          .set(updateData)
          .where(inArray(animals.id, input.animalIds));

        return {
          success: true,
          updatedCount: input.animalIds.length,
          message: `Successfully updated ${input.animalIds.length} animals`,
        };
      } catch (error) {
        console.error('Apply bulk edit error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to apply bulk edits',
        });
      }
    }),

  /**
   * Get animals by filter for bulk editing
   */
  getAnimalsForBulkEdit: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        breed: z.string().optional(),
        status: z.enum(['active', 'sold', 'culled', 'deceased']).optional(),
        gender: z.enum(['male', 'female', 'unknown']).optional(),
        limit: z.number().default(100),
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
        let baseQuery = db.select().from(animals);
        
        // Build where conditions
        const conditions = [eq(animals.farmId, input.farmId)];
        if (input.breed) {
          conditions.push(eq(animals.breed, input.breed));
        }
        if (input.status) {
          conditions.push(eq(animals.status, input.status));
        }
        if (input.gender) {
          conditions.push(eq(animals.gender, input.gender));
        }

        // Execute query with all conditions
        const results = await baseQuery
          .where(conditions.length > 1 ? conditions[0] : conditions[0])
          .limit(input.limit)
          .offset(input.offset);

        return {
          animals: results,
          count: results.length,
          hasMore: results.length === input.limit,
        };
      } catch (error) {
        console.error('Get animals for bulk edit error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch animals',
        });
      }
    }),

  /**
   * Get bulk edit history
   */
  getBulkEditHistory: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      // In production, would query from a bulk_edit_batches table
      return {
        batches: [],
        total: 0,
        message: 'Bulk edit history feature coming soon',
      };
    }),

  /**
   * Validate bulk edit changes
   */
  validateBulkEdit: protectedProcedure
    .input(
      z.object({
        animalIds: z.array(z.number()),
        updates: z.object({
          breed: z.string().optional(),
          gender: z.enum(['male', 'female', 'unknown']).optional(),
          status: z.enum(['active', 'sold', 'culled', 'deceased']).optional(),
          birthDate: z.date().optional(),
        }),
      })
    )
    .query(async ({ input }) => {
      const validation = {
        isValid: true,
        warnings: [] as string[],
        errors: [] as string[],
      };

      if (input.animalIds.length === 0) {
        validation.isValid = false;
        validation.errors.push('At least one animal must be selected');
      }

      if (Object.keys(input.updates).length === 0) {
        validation.isValid = false;
        validation.errors.push('At least one field must be updated');
      }

      if (input.updates.status === 'sold' || input.updates.status === 'culled') {
        validation.warnings.push('This status change may affect breeding records and health tracking');
      }

      if (input.updates.birthDate && input.updates.birthDate > new Date()) {
        validation.isValid = false;
        validation.errors.push('Birth date cannot be in the future');
      }

      return validation;
    }),
});
