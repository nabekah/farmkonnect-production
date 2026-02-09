import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';

interface ActivityLog {
  id: number;
  farmId: number;
  workerId: number;
  activityType: string;
  description: string;
  location: { latitude: number; longitude: number };
  startTime: Date;
  endTime?: Date;
  duration?: number;
  status: 'pending' | 'approved' | 'rejected';
  photoUrl?: string;
  notes?: string;
  createdAt: Date;
  approvedBy?: number;
  approvalDate?: Date;
}

interface Task {
  id: number;
  farmId: number;
  assignedTo: number;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  dueDate: Date;
  createdAt: Date;
  completedAt?: Date;
  notes?: string;
}

// Mock storage
const activityLogs: Map<number, ActivityLog[]> = new Map();
const tasks: Map<number, Task[]> = new Map();
const taskHistory: Map<number, any[]> = new Map();

export const fieldWorkerRouter = router({
  /**
   * Create activity log
   */
  createActivityLog: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        activityType: z.string(),
        description: z.string(),
        latitude: z.number(),
        longitude: z.number(),
        startTime: z.date(),
        endTime: z.date().optional(),
        photoUrl: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const duration = input.endTime
          ? Math.round((input.endTime.getTime() - input.startTime.getTime()) / 60000)
          : undefined;

        const activityLog: ActivityLog = {
          id: Math.floor(Math.random() * 1000000),
          farmId: input.farmId,
          workerId: ctx.user.id,
          activityType: input.activityType,
          description: input.description,
          location: { latitude: input.latitude, longitude: input.longitude },
          startTime: input.startTime,
          endTime: input.endTime,
          duration,
          status: 'pending',
          photoUrl: input.photoUrl,
          notes: input.notes,
          createdAt: new Date(),
        };

        if (!activityLogs.has(input.farmId)) {
          activityLogs.set(input.farmId, []);
        }
        activityLogs.get(input.farmId)!.push(activityLog);

        return activityLog;
      } catch (error) {
        console.error('Error creating activity log:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create activity log',
        });
      }
    }),

  /**
   * Get activity logs
   */
  getActivityLogs: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        status: z.enum(['pending', 'approved', 'rejected']).optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        let logs = activityLogs.get(input.farmId) || [];

        if (input.status) {
          logs = logs.filter((log) => log.status === input.status);
        }

        return {
          total: logs.length,
          logs: logs.slice(input.offset, input.offset + input.limit),
        };
      } catch (error) {
        console.error('Error getting activity logs:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get activity logs',
        });
      }
    }),

  /**
   * Update activity log
   */
  updateActivityLog: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        farmId: z.number(),
        description: z.string().optional(),
        notes: z.string().optional(),
        endTime: z.date().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const logs = activityLogs.get(input.farmId) || [];
        const log = logs.find((l) => l.id === input.id);

        if (!log) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Activity log not found',
          });
        }

        if (input.description) log.description = input.description;
        if (input.notes) log.notes = input.notes;
        if (input.endTime) {
          log.endTime = input.endTime;
          log.duration = Math.round((input.endTime.getTime() - log.startTime.getTime()) / 60000);
        }

        return log;
      } catch (error) {
        console.error('Error updating activity log:', error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update activity log',
        });
      }
    }),

  /**
   * Approve activity log
   */
  approveActivityLog: protectedProcedure
    .input(z.object({ id: z.number(), farmId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const logs = activityLogs.get(input.farmId) || [];
        const log = logs.find((l) => l.id === input.id);

        if (!log) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Activity log not found',
          });
        }

        log.status = 'approved';
        log.approvedBy = ctx.user.id;
        log.approvalDate = new Date();

        return log;
      } catch (error) {
        console.error('Error approving activity log:', error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to approve activity log',
        });
      }
    }),

  /**
   * Reject activity log
   */
  rejectActivityLog: protectedProcedure
    .input(z.object({ id: z.number(), farmId: z.number(), reason: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const logs = activityLogs.get(input.farmId) || [];
        const log = logs.find((l) => l.id === input.id);

        if (!log) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Activity log not found',
          });
        }

        log.status = 'rejected';
        log.notes = input.reason;

        return log;
      } catch (error) {
        console.error('Error rejecting activity log:', error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to reject activity log',
        });
      }
    }),

  /**
   * Get tasks
   */
  getTasks: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        let farmTasks = tasks.get(input.farmId) || [];

        if (input.status) {
          farmTasks = farmTasks.filter((t) => t.status === input.status);
        }

        return farmTasks;
      } catch (error) {
        console.error('Error getting tasks:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get tasks',
        });
      }
    }),

  /**
   * Create task
   */
  createTask: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        title: z.string(),
        description: z.string(),
        priority: z.enum(['low', 'medium', 'high']),
        dueDate: z.date(),
        assignedTo: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const task: Task = {
          id: Math.floor(Math.random() * 1000000),
          farmId: input.farmId,
          assignedTo: input.assignedTo,
          title: input.title,
          description: input.description,
          priority: input.priority,
          status: 'pending',
          dueDate: input.dueDate,
          createdAt: new Date(),
        };

        if (!tasks.has(input.farmId)) {
          tasks.set(input.farmId, []);
        }
        tasks.get(input.farmId)!.push(task);

        return task;
      } catch (error) {
        console.error('Error creating task:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create task',
        });
      }
    }),

  /**
   * Update task
   */
  updateTask: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        farmId: z.number(),
        status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const farmTasks = tasks.get(input.farmId) || [];
        const task = farmTasks.find((t) => t.id === input.id);

        if (!task) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Task not found',
          });
        }

        if (input.status) {
          task.status = input.status;
          if (input.status === 'completed') {
            task.completedAt = new Date();
          }
        }
        if (input.notes) task.notes = input.notes;

        return task;
      } catch (error) {
        console.error('Error updating task:', error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update task',
        });
      }
    }),

  /**
   * Get task history
   */
  getTaskHistory: protectedProcedure
    .input(z.object({ taskId: z.number() }))
    .query(async ({ input, ctx }) => {
      try {
        return taskHistory.get(input.taskId) || [];
      } catch (error) {
        console.error('Error getting task history:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get task history',
        });
      }
    }),

  /**
   * Upload photo
   */
  uploadPhoto: protectedProcedure
    .input(z.object({ farmId: z.number(), activityLogId: z.number(), photoUrl: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const logs = activityLogs.get(input.farmId) || [];
        const log = logs.find((l) => l.id === input.activityLogId);

        if (!log) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Activity log not found',
          });
        }

        log.photoUrl = input.photoUrl;
        return log;
      } catch (error) {
        console.error('Error uploading photo:', error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to upload photo',
        });
      }
    }),

  /**
   * Complete task
   */
  completeTask: protectedProcedure
    .input(z.object({ id: z.number(), farmId: z.number(), notes: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const farmTasks = tasks.get(input.farmId) || [];
        const task = farmTasks.find((t) => t.id === input.id);

        if (!task) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Task not found',
          });
        }

        task.status = 'completed';
        task.completedAt = new Date();
        if (input.notes) task.notes = input.notes;

        return task;
      } catch (error) {
        console.error('Error completing task:', error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to complete task',
        });
      }
    }),
});
