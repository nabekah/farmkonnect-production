import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { getDb } from '../db';
import { fieldWorkerTasks, bulkTaskAssignments } from '../../drizzle/schema';
import { eq, and } from 'drizzle-orm';

export const bulkTaskAssignmentRouter = router({
  /**
   * Assign the same task to multiple workers
   */
  assignTaskToMultipleWorkers: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1, 'Task title is required'),
        description: z.string().optional(),
        workerIds: z.array(z.string()).min(1, 'At least one worker is required'),
        taskType: z.string(),
        priority: z.enum(['low', 'medium', 'high', 'urgent']),
        dueDate: z.string(),
        estimatedHours: z.number().positive(),
        farmId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const createdTasks = [];
      const errors = [];

      for (const workerId of input.workerIds) {
        try {
          const newTask = await db.insert(fieldWorkerTasks).values({
            title: input.title,
            description: input.description || '',
            workerId: workerId,
            workerName: '', // Will be populated from worker data
            taskType: input.taskType,
            priority: input.priority,
            status: 'pending',
            dueDate: input.dueDate,
            estimatedHours: input.estimatedHours,
            actualHours: 0,
            farmId: input.farmId,
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          createdTasks.push({
            workerId,
            taskId: newTask[0].insertId,
            success: true,
          });
        } catch (error) {
          errors.push({
            workerId,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      return {
        success: errors.length === 0,
        createdCount: createdTasks.length,
        failedCount: errors.length,
        createdTasks,
        errors,
        message: `Successfully assigned task to ${createdTasks.length} worker(s)${
          errors.length > 0 ? ` with ${errors.length} error(s)` : ''
        }`,
      };
    }),

  /**
   * Get bulk assignment history for a farm
   */
  getBulkAssignmentHistory: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        limit: z.number().default(10),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      
      // Get tasks created in bulk (multiple tasks with same title and dueDate)
      const result = await db
        .select({
          title: fieldWorkerTasks.title,
          taskType: fieldWorkerTasks.taskType,
          priority: fieldWorkerTasks.priority,
          dueDate: fieldWorkerTasks.dueDate,
          createdAt: fieldWorkerTasks.createdAt,
          count: fieldWorkerTasks.id,
        })
        .from(fieldWorkerTasks)
        .where(and(eq(fieldWorkerTasks.farmId, input.farmId)))
        .orderBy(fieldWorkerTasks.createdAt)
        .limit(input.limit);

      // Group by title and dueDate to identify bulk assignments
      const bulkAssignments: Record<string, any> = {};
      
      result.forEach((task: any) => {
        const key = `${task.title}_${task.dueDate}`;
        if (!bulkAssignments[key]) {
          bulkAssignments[key] = {
            title: task.title,
            taskType: task.taskType,
            priority: task.priority,
            dueDate: task.dueDate,
            createdAt: task.createdAt,
            workerCount: 0,
          };
        }
        bulkAssignments[key].workerCount += 1;
      });

      return Object.values(bulkAssignments);
    }),

  /**
   * Get statistics for bulk assignments
   */
  getBulkAssignmentStats: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      
      const allTasks = await db
        .select()
        .from(fieldWorkerTasks)
        .where(eq(fieldWorkerTasks.farmId, input.farmId));

      // Count tasks by title to find bulk assignments
      const titleCounts: Record<string, number> = {};
      allTasks.forEach((task: any) => {
        titleCounts[task.title] = (titleCounts[task.title] || 0) + 1;
      });

      const bulkAssignmentCount = Object.values(titleCounts).filter(
        (count) => count > 1
      ).length;
      const totalTasksInBulkAssignments = Object.values(titleCounts)
        .filter((count) => count > 1)
        .reduce((sum, count) => sum + count, 0);

      return {
        totalTasks: allTasks.length,
        bulkAssignmentCount,
        totalTasksInBulkAssignments,
        averageWorkersPerBulkAssignment:
          bulkAssignmentCount > 0
            ? (totalTasksInBulkAssignments / bulkAssignmentCount).toFixed(2)
            : 0,
      };
    }),

  /**
   * Validate bulk assignment before execution
   */
  validateBulkAssignment: protectedProcedure
    .input(
      z.object({
        workerIds: z.array(z.string()),
        title: z.string(),
        dueDate: z.string(),
        farmId: z.number(),
      })
    )
    .query(async ({ input }) => {
      const errors = [];

      if (!input.workerIds || input.workerIds.length === 0) {
        errors.push('At least one worker must be selected');
      }

      if (!input.title || input.title.trim() === '') {
        errors.push('Task title is required');
      }

      if (!input.dueDate) {
        errors.push('Due date is required');
      }

      const dueDate = new Date(input.dueDate);
      if (dueDate < new Date()) {
        errors.push('Due date cannot be in the past');
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings: input.workerIds.length > 10 ? ['Assigning to more than 10 workers'] : [],
      };
    }),

  /**
   * Cancel bulk assignment (delete all tasks with same title and dueDate)
   */
  cancelBulkAssignment: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        dueDate: z.string(),
        farmId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      const result = await db
        .delete(fieldWorkerTasks)
        .where(
          and(
            eq(fieldWorkerTasks.title, input.title),
            eq(fieldWorkerTasks.dueDate, input.dueDate),
            eq(fieldWorkerTasks.farmId, input.farmId)
          )
        );

      return {
        success: true,
        deletedCount: result.rowsAffected || 0,
        message: `Cancelled bulk assignment for "${input.title}"`,
      };
    }),
});
