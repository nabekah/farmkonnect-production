import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { getDb } from '../db';
import { fieldWorkerTasks, taskCompletionRecords } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

export const taskCompletionVerificationRouter = router({
  /**
   * Submit task completion with verification
   */
  submitTaskCompletion: protectedProcedure
    .input(z.object({
      taskId: z.number(),
      completionNotes: z.string().optional(),
      photoEvidence: z.array(z.string()).optional(),
      location: z.object({
        latitude: z.number().optional(),
        longitude: z.number().optional(),
      }).optional(),
      requiresSupervisorApproval: z.boolean().default(false),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database connection failed');

      try {
        // Get the task
        const task = await db
          .select()
          .from(fieldWorkerTasks)
          .where(eq(fieldWorkerTasks.id, input.taskId))
          .limit(1);

        if (task.length === 0) {
          throw new Error('Task not found');
        }

        const currentTask = task[0];

        // Validate photo evidence if required
        if (input.requiresSupervisorApproval && (!input.photoEvidence || input.photoEvidence.length === 0)) {
          throw new Error('Photo evidence is required for supervisor approval');
        }

        // Create completion record
        const completionRecord = await db
          .insert(taskCompletionRecords)
          .values({
            taskId: input.taskId,
            workerId: currentTask.workerId,
            farmId: currentTask.farmId,
            completionNotes: input.completionNotes || '',
            photoEvidence: input.photoEvidence ? JSON.stringify(input.photoEvidence) : null,
            location: input.location ? JSON.stringify(input.location) : null,
            completionTime: new Date(),
            status: input.requiresSupervisorApproval ? 'pending_approval' : 'completed',
            approvalStatus: input.requiresSupervisorApproval ? 'pending' : 'approved',
          });

        // Update task status
        const newStatus = input.requiresSupervisorApproval ? 'pending_approval' : 'completed';
        await db
          .update(fieldWorkerTasks)
          .set({ status: newStatus })
          .where(eq(fieldWorkerTasks.id, input.taskId));

        return {
          success: true,
          taskId: input.taskId,
          taskTitle: currentTask.title,
          completionTime: new Date().toISOString(),
          status: newStatus,
          requiresApproval: input.requiresSupervisorApproval,
          photoCount: input.photoEvidence?.length || 0,
        };
      } catch (error) {
        console.error('Error submitting task completion:', error);
        throw error;
      }
    }),

  /**
   * Approve task completion (supervisor action)
   */
  approveTaskCompletion: protectedProcedure
    .input(z.object({
      taskId: z.number(),
      approvalNotes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database connection failed');

      try {
        // Get the task
        const task = await db
          .select()
          .from(fieldWorkerTasks)
          .where(eq(fieldWorkerTasks.id, input.taskId))
          .limit(1);

        if (task.length === 0) {
          throw new Error('Task not found');
        }

        // Update completion record
        const completionRecord = await db
          .select()
          .from(taskCompletionRecords)
          .where(eq(taskCompletionRecords.taskId, input.taskId));

        if (completionRecord.length > 0) {
          // Update the most recent completion record
          const recordId = completionRecord[completionRecord.length - 1].id;
          // Note: This assumes taskCompletionRecords has an update method
          // In practice, you'd need to implement this update
        }

        // Update task status to completed
        await db
          .update(fieldWorkerTasks)
          .set({ status: 'completed' })
          .where(eq(fieldWorkerTasks.id, input.taskId));

        return {
          success: true,
          taskId: input.taskId,
          status: 'completed',
          approvalTime: new Date().toISOString(),
          approvalNotes: input.approvalNotes,
        };
      } catch (error) {
        console.error('Error approving task completion:', error);
        throw error;
      }
    }),

  /**
   * Reject task completion (supervisor action)
   */
  rejectTaskCompletion: protectedProcedure
    .input(z.object({
      taskId: z.number(),
      rejectionReason: z.string(),
      feedbackForWorker: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database connection failed');

      try {
        // Get the task
        const task = await db
          .select()
          .from(fieldWorkerTasks)
          .where(eq(fieldWorkerTasks.id, input.taskId))
          .limit(1);

        if (task.length === 0) {
          throw new Error('Task not found');
        }

        // Update task status back to in_progress
        await db
          .update(fieldWorkerTasks)
          .set({ status: 'in_progress' })
          .where(eq(fieldWorkerTasks.id, input.taskId));

        return {
          success: true,
          taskId: input.taskId,
          status: 'in_progress',
          rejectionTime: new Date().toISOString(),
          rejectionReason: input.rejectionReason,
          feedbackForWorker: input.feedbackForWorker,
        };
      } catch (error) {
        console.error('Error rejecting task completion:', error);
        throw error;
      }
    }),

  /**
   * Get task completion details
   */
  getTaskCompletionDetails: protectedProcedure
    .input(z.object({
      taskId: z.number(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      try {
        const completionRecords = await db
          .select()
          .from(taskCompletionRecords)
          .where(eq(taskCompletionRecords.taskId, input.taskId));

        if (completionRecords.length === 0) {
          return null;
        }

        const record = completionRecords[completionRecords.length - 1];

        return {
          taskId: input.taskId,
          completionTime: record.completionTime,
          completionNotes: record.completionNotes,
          photoEvidence: record.photoEvidence ? JSON.parse(record.photoEvidence) : [],
          location: record.location ? JSON.parse(record.location) : null,
          status: record.status,
          approvalStatus: record.approvalStatus,
        };
      } catch (error) {
        console.error('Error getting task completion details:', error);
        return null;
      }
    }),

  /**
   * Get pending approvals for supervisor
   */
  getPendingApprovals: protectedProcedure
    .input(z.object({
      farmId: z.number(),
      limit: z.number().default(50),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      try {
        const tasks = await db
          .select()
          .from(fieldWorkerTasks)
          .where(
            eq(fieldWorkerTasks.farmId, input.farmId)
          )
          .limit(input.limit);

        // Filter for pending approval tasks
        const pendingTasks = tasks.filter((t: any) => t.status === 'pending_approval');

        const pendingWithDetails = [];
        for (const task of pendingTasks) {
          const completionRecords = await db
            .select()
            .from(taskCompletionRecords)
            .where(eq(taskCompletionRecords.taskId, task.id));

          if (completionRecords.length > 0) {
            const record = completionRecords[completionRecords.length - 1];
            pendingWithDetails.push({
              taskId: task.id,
              taskTitle: task.title,
              workerName: task.workerName,
              completionTime: record.completionTime,
              completionNotes: record.completionNotes,
              photoCount: record.photoEvidence ? JSON.parse(record.photoEvidence).length : 0,
              dueDate: task.dueDate,
            });
          }
        }

        return pendingWithDetails;
      } catch (error) {
        console.error('Error getting pending approvals:', error);
        return [];
      }
    }),

  /**
   * Get completion statistics for a farm
   */
  getCompletionStats: protectedProcedure
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

        const completionRecords = await db
          .select()
          .from(taskCompletionRecords)
          .where(eq(taskCompletionRecords.farmId, input.farmId));

        const stats = {
          totalTasks: tasks.length,
          completedTasks: tasks.filter((t: any) => t.status === 'completed').length,
          pendingApproval: tasks.filter((t: any) => t.status === 'pending_approval').length,
          inProgress: tasks.filter((t: any) => t.status === 'in_progress').length,
          pending: tasks.filter((t: any) => t.status === 'pending').length,
          completionRate: tasks.length > 0 
            ? ((tasks.filter((t: any) => t.status === 'completed').length / tasks.length) * 100).toFixed(2)
            : 0,
          tasksWithPhotoEvidence: completionRecords.filter((r: any) => r.photoEvidence).length,
          averageCompletionTime: completionRecords.length > 0 ? 'N/A' : 'N/A',
        };

        return stats;
      } catch (error) {
        console.error('Error getting completion stats:', error);
        return null;
      }
    }),
});
