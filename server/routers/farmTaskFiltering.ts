import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { getDb } from '../db';
import { fieldWorkerTasks, farms } from '../../drizzle/schema';
import { eq, and } from 'drizzle-orm';

export const farmTaskFilteringRouter = router({
  /**
   * Get all farms for the current user
   */
  getUserFarms: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    try {
      const userFarms = await db
        .select()
        .from(farms)
        .where(eq(farms.farmerUserId, ctx.user.id));

      return userFarms.map((farm: any) => ({
        id: farm.id,
        name: farm.farmName,
        location: farm.location,
        size: farm.sizeHectares,
        type: farm.farmType,
      }));
    } catch (error) {
      console.error('Error fetching user farms:', error);
      return [];
    }
  }),

  /**
   * Get tasks for a specific farm
   */
  getTasksByFarm: protectedProcedure
    .input(z.object({
      farmId: z.number(),
      status: z.enum(['pending', 'in_progress', 'completed']).optional(),
      limit: z.number().default(100),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      try {
        let query = db
          .select()
          .from(fieldWorkerTasks)
          .where(eq(fieldWorkerTasks.farmId, input.farmId));

        if (input.status) {
          query = query.where(
            and(
              eq(fieldWorkerTasks.farmId, input.farmId),
              eq(fieldWorkerTasks.status, input.status)
            )
          );
        }

        const tasks = await query.limit(input.limit);
        return tasks;
      } catch (error) {
        console.error('Error fetching tasks by farm:', error);
        return [];
      }
    }),

  /**
   * Get tasks across all farms for the current user
   */
  getAllFarmsTasks: protectedProcedure
    .input(z.object({
      status: z.enum(['pending', 'in_progress', 'completed']).optional(),
      limit: z.number().default(100),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];

      try {
        // Get all farms for the user
        const userFarms = await db
          .select({ id: farms.id })
          .from(farms)
          .where(eq(farms.farmerUserId, ctx.user.id));

        const farmIds = userFarms.map((f: any) => f.id);
        if (farmIds.length === 0) return [];

        // Get tasks from all farms
        let query = db
          .select()
          .from(fieldWorkerTasks)
          .where(
            fieldWorkerTasks.farmId.inArray(farmIds)
          );

        if (input.status) {
          query = query.where(
            and(
              fieldWorkerTasks.farmId.inArray(farmIds),
              eq(fieldWorkerTasks.status, input.status)
            )
          );
        }

        const tasks = await query.limit(input.limit);
        return tasks;
      } catch (error) {
        console.error('Error fetching all farms tasks:', error);
        return [];
      }
    }),

  /**
   * Get task statistics by farm
   */
  getTaskStatsByFarm: protectedProcedure
    .input(z.object({
      farmId: z.number(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      try {
        const tasks = await db
          .select()
          .from(fieldWorkerTasks)
          .where(eq(fieldWorkerTasks.farmId, input.farmId));

        const stats = {
          total: tasks.length,
          pending: tasks.filter((t: any) => t.status === 'pending').length,
          inProgress: tasks.filter((t: any) => t.status === 'in_progress').length,
          completed: tasks.filter((t: any) => t.status === 'completed').length,
          urgent: tasks.filter((t: any) => t.priority === 'urgent').length,
          high: tasks.filter((t: any) => t.priority === 'high').length,
          medium: tasks.filter((t: any) => t.priority === 'medium').length,
          low: tasks.filter((t: any) => t.priority === 'low').length,
        };

        return stats;
      } catch (error) {
        console.error('Error fetching task stats:', error);
        return null;
      }
    }),

  /**
   * Get task statistics across all farms
   */
  getAllFarmsTaskStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;

    try {
      // Get all farms for the user
      const userFarms = await db
        .select({ id: farms.id })
        .from(farms)
        .where(eq(farms.farmerUserId, ctx.user.id));

      const farmIds = userFarms.map((f: any) => f.id);
      if (farmIds.length === 0) return null;

      // Get all tasks from all farms
      const tasks = await db
        .select()
        .from(fieldWorkerTasks)
        .where(
          fieldWorkerTasks.farmId.inArray(farmIds)
        );

      const stats = {
        total: tasks.length,
        pending: tasks.filter((t: any) => t.status === 'pending').length,
        inProgress: tasks.filter((t: any) => t.status === 'in_progress').length,
        completed: tasks.filter((t: any) => t.status === 'completed').length,
        urgent: tasks.filter((t: any) => t.priority === 'urgent').length,
        high: tasks.filter((t: any) => t.priority === 'high').length,
        medium: tasks.filter((t: any) => t.priority === 'medium').length,
        low: tasks.filter((t: any) => t.priority === 'low').length,
      };

      return stats;
    } catch (error) {
      console.error('Error fetching all farms task stats:', error);
      return null;
    }
  }),

  /**
   * Switch farm context (for UI state management)
   */
  setFarmContext: protectedProcedure
    .input(z.object({
      farmId: z.number().optional(),
      allFarms: z.boolean().default(false),
    }))
    .mutation(async ({ input }) => {
      // This is a client-side operation, but we validate the farm exists
      const db = await getDb();
      if (!db) throw new Error('Database connection failed');

      if (input.farmId) {
        const farm = await db
          .select()
          .from(farms)
          .where(eq(farms.id, input.farmId))
          .limit(1);

        if (farm.length === 0) {
          throw new Error('Farm not found');
        }
      }

      return {
        success: true,
        farmId: input.farmId,
        allFarms: input.allFarms,
      };
    }),
});
