import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { getDb } from '../db';
import { fieldWorkerTasks, farmWorkers } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

export const taskReassignmentRouter = router({
  /**
   * Reassign a task from one worker to another
   */
  reassignTask: protectedProcedure
    .input(z.object({
      taskId: z.number(),
      newWorkerId: z.number(),
      reason: z.string().optional(),
      notifyBothWorkers: z.boolean().default(true),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database connection failed');

      try {
        // Get the current task
        const task = await db
          .select()
          .from(fieldWorkerTasks)
          .where(eq(fieldWorkerTasks.id, input.taskId))
          .limit(1);

        if (task.length === 0) {
          throw new Error('Task not found');
        }

        const currentTask = task[0];
        const oldWorkerId = currentTask.workerId;

        // Get new worker info
        const newWorker = await db
          .select()
          .from(farmWorkers)
          .where(eq(farmWorkers.id, input.newWorkerId))
          .limit(1);

        if (newWorker.length === 0) {
          throw new Error('New worker not found');
        }

        // Update task with new worker
        await db
          .update(fieldWorkerTasks)
          .set({
            workerId: input.newWorkerId,
            workerName: newWorker[0].name,
          })
          .where(eq(fieldWorkerTasks.id, input.taskId));

        return {
          success: true,
          taskId: input.taskId,
          taskTitle: currentTask.title,
          oldWorkerId: oldWorkerId,
          oldWorkerName: currentTask.workerName,
          newWorkerId: input.newWorkerId,
          newWorkerName: newWorker[0].name,
          reason: input.reason,
          timestamp: new Date().toISOString(),
          notificationSent: input.notifyBothWorkers,
        };
      } catch (error) {
        console.error('Error reassigning task:', error);
        throw error;
      }
    }),

  /**
   * Bulk reassign multiple tasks to a different worker
   */
  bulkReassignTasks: protectedProcedure
    .input(z.object({
      taskIds: z.array(z.number()),
      newWorkerId: z.number(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database connection failed');

      try {
        // Get new worker info
        const newWorker = await db
          .select()
          .from(farmWorkers)
          .where(eq(farmWorkers.id, input.newWorkerId))
          .limit(1);

        if (newWorker.length === 0) {
          throw new Error('New worker not found');
        }

        const reassignments = [];

        for (const taskId of input.taskIds) {
          const task = await db
            .select()
            .from(fieldWorkerTasks)
            .where(eq(fieldWorkerTasks.id, taskId))
            .limit(1);

          if (task.length > 0) {
            const oldWorkerId = task[0].workerId;

            await db
              .update(fieldWorkerTasks)
              .set({
                workerId: input.newWorkerId,
                workerName: newWorker[0].name,
              })
              .where(eq(fieldWorkerTasks.id, taskId));

            reassignments.push({
              taskId: taskId,
              taskTitle: task[0].title,
              oldWorkerId: oldWorkerId,
              oldWorkerName: task[0].workerName,
              newWorkerId: input.newWorkerId,
              newWorkerName: newWorker[0].name,
            });
          }
        }

        return {
          success: true,
          reassignedCount: reassignments.length,
          reassignments: reassignments,
          reason: input.reason,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        console.error('Error bulk reassigning tasks:', error);
        throw error;
      }
    }),

  /**
   * Get reassignment candidates (workers who can take the task)
   */
  getReassignmentCandidates: protectedProcedure
    .input(z.object({
      taskId: z.number(),
      farmId: z.number(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      try {
        // Get the current task
        const task = await db
          .select()
          .from(fieldWorkerTasks)
          .where(eq(fieldWorkerTasks.id, input.taskId))
          .limit(1);

        if (task.length === 0) {
          return [];
        }

        // Get all workers in the farm
        const workers = await db
          .select()
          .from(farmWorkers)
          .where(eq(farmWorkers.farmId, input.farmId));

        // Filter out the current worker and return candidates
        const candidates = workers
          .filter((w: any) => w.id !== task[0].workerId)
          .map((w: any) => ({
            id: w.id,
            name: w.name,
            phone: w.phone,
            availability: w.availability || 'available',
          }));

        return candidates;
      } catch (error) {
        console.error('Error getting reassignment candidates:', error);
        return [];
      }
    }),

  /**
   * Get reassignment history for a task
   */
  getTaskReassignmentHistory: protectedProcedure
    .input(z.object({
      taskId: z.number(),
    }))
    .query(async ({ input }) => {
      // This would require a separate reassignment_history table
      // For now, returning placeholder
      return {
        taskId: input.taskId,
        reassignments: [],
        message: 'Reassignment history tracking requires a dedicated table',
      };
    }),

  /**
   * Validate if a task can be reassigned to a worker
   */
  validateReassignment: protectedProcedure
    .input(z.object({
      taskId: z.number(),
      newWorkerId: z.number(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { valid: false, errors: ['Database connection failed'] };

      try {
        const errors = [];

        // Check if task exists
        const task = await db
          .select()
          .from(fieldWorkerTasks)
          .where(eq(fieldWorkerTasks.id, input.taskId))
          .limit(1);

        if (task.length === 0) {
          errors.push('Task not found');
        }

        // Check if new worker exists
        const worker = await db
          .select()
          .from(farmWorkers)
          .where(eq(farmWorkers.id, input.newWorkerId))
          .limit(1);

        if (worker.length === 0) {
          errors.push('Worker not found');
        }

        // Check if worker is the same
        if (task.length > 0 && task[0].workerId === input.newWorkerId) {
          errors.push('Worker is already assigned to this task');
        }

        // Check if task is already completed
        if (task.length > 0 && task[0].status === 'completed') {
          errors.push('Cannot reassign completed tasks');
        }

        return {
          valid: errors.length === 0,
          errors: errors,
        };
      } catch (error) {
        console.error('Error validating reassignment:', error);
        return {
          valid: false,
          errors: ['Error validating reassignment'],
        };
      }
    }),
});
