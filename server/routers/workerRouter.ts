import { router, publicProcedure, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { getDb } from '../db';
import { farmWorkers } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

export const workerRouter = router({
  /**
   * Get all workers for a farm
   */
  getAllWorkers: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      try {
        const result = await db
          .select({
            id: farmWorkers.id,
            name: farmWorkers.name,
            email: farmWorkers.email,
            phone: farmWorkers.phone,
            farmId: farmWorkers.farmId,
            role: farmWorkers.role,
            status: farmWorkers.status,
          })
          .from(farmWorkers)
          .where(eq(farmWorkers.farmId, input.farmId));

        return result;
      } catch (error) {
        console.error('Error fetching workers:', error);
        throw new Error('Failed to fetch workers');
      }
    }),

  /**
   * Get a specific worker by ID
   */
  getWorkerById: protectedProcedure
    .input(z.object({ workerId: z.number(), farmId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      try {
        const result = await db
          .select()
          .from(farmWorkers)
          .where(eq(farmWorkers.id, input.workerId));

        if (!result || result.length === 0) {
          throw new Error('Worker not found');
        }

        return result[0];
      } catch (error) {
        console.error('Error fetching worker:', error);
        throw new Error('Failed to fetch worker');
      }
    }),

  /**
   * Get available workers (not on leave, active status)
   */
  getAvailableWorkers: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      try {
        const result = await db
          .select({
            id: farmWorkers.id,
            name: farmWorkers.name,
            email: farmWorkers.email,
            phone: farmWorkers.phone,
            role: farmWorkers.role,
            status: farmWorkers.status,
          })
          .from(farmWorkers)
          .where(eq(farmWorkers.farmId, input.farmId));

        // Filter for active workers
        return result.filter((w: any) => w.status === 'active');
      } catch (error) {
        console.error('Error fetching available workers:', error);
        throw new Error('Failed to fetch available workers');
      }
    }),

  /**
   * Search workers by name or email
   */
  searchWorkers: protectedProcedure
    .input(z.object({ farmId: z.number(), query: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      try {
        const result = await db
          .select({
            id: farmWorkers.id,
            name: farmWorkers.name,
            email: farmWorkers.email,
            phone: farmWorkers.phone,
            role: farmWorkers.role,
            status: farmWorkers.status,
          })
          .from(farmWorkers)
          .where(eq(farmWorkers.farmId, input.farmId));

        // Filter by search query
        const query = input.query.toLowerCase();
        return result.filter((w: any) =>
          w.name.toLowerCase().includes(query) ||
          w.email.toLowerCase().includes(query)
        );
      } catch (error) {
        console.error('Error searching workers:', error);
        throw new Error('Failed to search workers');
      }
    }),

  /**
   * Get worker count for a farm
   */
  getWorkerCount: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      try {
        const result = await db
          .select()
          .from(farmWorkers)
          .where(eq(farmWorkers.farmId, input.farmId));

        return {
          total: result.length,
          active: result.filter((w: any) => w.status === 'active').length,
          inactive: result.filter((w: any) => w.status !== 'active').length,
        };
      } catch (error) {
        console.error('Error getting worker count:', error);
        throw new Error('Failed to get worker count');
      }
    }),
});
