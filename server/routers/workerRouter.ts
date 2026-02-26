import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import {
  getWorkersByFarm,
  getWorkerById,
  getAvailableWorkers,
  searchWorkers,
  getWorkerCount,
} from '../_core/workforceUtils';

export const workerRouter = router({
  /**
   * Get all workers for a farm
   */
  getAllWorkers: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ input }) => {
      try {
        return await getWorkersByFarm(input.farmId);
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
      try {
        const worker = await getWorkerById(input.workerId);
        if (!worker) {
          throw new Error('Worker not found');
        }
        return worker;
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
      try {
        return await getAvailableWorkers(input.farmId);
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
      try {
        return await searchWorkers(input.farmId, input.query);
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
      try {
        return await getWorkerCount(input.farmId);
      } catch (error) {
        console.error('Error getting worker count:', error);
        throw new Error('Failed to get worker count');
      }
    }),
});
