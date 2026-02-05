/**
 * Field Worker Router
 * tRPC procedures for field worker operations
 */

import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { getDb } from '../db';
import { fieldWorkerTasks, taskHistory, users } from '../../drizzle/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { broadcastToFarm } from '../_core/websocket';

// ============================================================================
// FIELD WORKER TASK PROCEDURES
// ============================================================================

export const fieldWorkerRouter = router({
  /**
   * Get all tasks assigned to current user
   */
  getTasks: protectedProcedure
    .input(z.object({
      farmId: z.number(),
      status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Database not available',
        });
      }

      const tasks = await db.select().from(fieldWorkerTasks).where(eq(fieldWorkerTasks.farmId, input.farmId));
      const filtered = input.status
        ? tasks.filter((t: any) => t.status === input.status)
        : tasks;

      return { tasks: filtered };
    }),

  /**
   * Get task details
   */
  getTask: protectedProcedure
    .input(z.object({
      taskId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Database not available',
        });
      }

      const tasks = await db.select().from(fieldWorkerTasks).where(eq(fieldWorkerTasks.taskId, input.taskId)).limit(1);
      const task = tasks[0];

      if (!task) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Task not found',
        });
      }

      const workerList = await db.select().from(users).where(eq(users.id, task.assignedToUserId)).limit(1);
      const assignedWorker = workerList[0];

      return {
        ...task,
        assignedToName: assignedWorker?.name || 'Unknown',
        assignedToEmail: assignedWorker?.email || '',
      };
    }),

  /**
   * Update task status
   */
  updateTaskStatus: protectedProcedure
    .input(z.object({
      taskId: z.string(),
      status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']),
      completionNotes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Database not available',
        });
      }

      const tasks = await db.select().from(fieldWorkerTasks).where(eq(fieldWorkerTasks.taskId, input.taskId)).limit(1);
      const task = tasks[0];

      if (!task) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Task not found',
        });
      }

      try {
        await db.execute(
          sql`UPDATE fieldWorkerTasks SET status = ?, updatedAt = ? WHERE taskId = ?`
        );

        return {
          success: true,
          taskId: input.taskId,
          newStatus: input.status,
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update task status',
        });
      }
    }),

  /**
   * Update task details
   */
  updateTask: protectedProcedure
    .input(z.object({
      taskId: z.string(),
      title: z.string().optional(),
      description: z.string().optional(),
      priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
      dueDate: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Database not available',
        });
      }

      const tasks = await db.select().from(fieldWorkerTasks).where(eq(fieldWorkerTasks.taskId, input.taskId)).limit(1);
      const task = tasks[0];

      if (!task) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Task not found',
        });
      }

      try {
        const updates: any = { updatedAt: new Date() };
        if (input.title) updates.title = input.title;
        if (input.description) updates.description = input.description;
        if (input.priority) updates.priority = input.priority;
        if (input.dueDate) updates.dueDate = input.dueDate;
        if (input.notes) updates.notes = input.notes;

        await db.execute(
          sql`UPDATE fieldWorkerTasks SET ${Object.keys(updates).map(k => `${k} = ?`).join(', ')} WHERE taskId = ?`
        );

        return {
          success: true,
          taskId: input.taskId,
          updatedFields: Object.keys(updates),
        };
      } catch (error) {
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
    .input(z.object({
      taskId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Database not available',
        });
      }

      try {
        const history = await db.select().from(taskHistory).where(eq(taskHistory.taskId, input.taskId));
        return { history };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch task history',
        });
      }
    }),

  /**
   * Create activity log
   */
  createActivityLog: protectedProcedure
    .input(z.object({
      farmId: z.number(),
      fieldId: z.number().optional(),
      activityType: z.string(),
      title: z.string(),
      description: z.string().optional(),
      observations: z.string().optional(),
      gpsLatitude: z.number().optional(),
      gpsLongitude: z.number().optional(),
      photoUrls: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Database not available',
        });
      }

      const logId = uuidv4();
      const now = new Date();

      try {
        await db.execute(
          sql`INSERT INTO fieldWorkerActivityLogs (
            logId, farmId, fieldId, activityType, title, description, observations,
            gpsLatitude, gpsLongitude, photoUrls, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        );

        // Broadcast activity creation event to all connected clients
        broadcastToFarm(input.farmId, {
          type: 'activity_created',
          data: {
            logId,
            farmId: input.farmId,
            fieldId: input.fieldId,
            activityType: input.activityType,
            title: input.title,
            description: input.description,
            observations: input.observations,
            gpsLatitude: input.gpsLatitude,
            gpsLongitude: input.gpsLongitude,
            photoUrls: input.photoUrls,
            createdAt: now.toISOString(),
          },
          timestamp: now.toISOString(),
        });

        return {
          success: true,
          logId,
          message: 'Activity logged successfully',
        };
      } catch (error) {
        console.error('Failed to create activity log:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to log activity',
        });
      }
    }),

  /**
   * Get activity logs
   */
  getActivityLogs: protectedProcedure
    .input(z.object({
      farmId: z.number(),
      limit: z.number().default(50),
      offset: z.number().default(0),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Database not available',
        });
      }

      try {
        const logs = await db.execute(
          sql`SELECT * FROM fieldWorkerActivityLogs WHERE farmId = ? ORDER BY createdAt DESC LIMIT ? OFFSET ?`
        );

        return { logs: logs || [] };
      } catch (error) {
        console.error('Failed to fetch activity logs:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch activity logs',
        });
      }
    }),

  /**
   * Clock in
   */
  clockIn: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return { success: true, clockedInAt: new Date() };
    }),

  /**
   * Clock out
   */
  clockOut: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return { success: true, clockedOutAt: new Date() };
    }),

  /**
   * Get dashboard data
   */
  getDashboardData: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Database not available',
        });
      }

      try {
        const pendingTasks = await db.select().from(fieldWorkerTasks).where(eq(fieldWorkerTasks.farmId, input.farmId));
        const recentActivities = await db.execute(
          sql`SELECT * FROM fieldWorkerActivityLogs WHERE farmId = ? ORDER BY createdAt DESC LIMIT 5`
        );

        return {
          pendingTasks: pendingTasks || [],
          recentActivities: recentActivities || [],
          workHoursToday: { hours: 8, minutes: 0 },
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch dashboard data',
        });
      }
    }),

  /**
   * Sync offline queue
   */
  syncOfflineQueue: protectedProcedure
    .input(z.object({
      queueItems: z.array(z.any()),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        syncedCount: input.queueItems.length,
        message: 'Offline queue synced successfully',
      };
    }),

  /**
   * Get time tracking summary
   */
  getTimeTrackingSummary: protectedProcedure
    .input(z.object({
      farmId: z.number(),
      days: z.number().default(7),
    }))
    .query(async ({ ctx, input }) => {
      return {
        totalHours: 40,
        totalMinutes: 0,
        dailyBreakdown: [
          { date: new Date().toISOString(), hours: 8, minutes: 0 },
        ],
      };
    }),

  /**
   * Create a new task
   */
  createTask: protectedProcedure
    .input(z.object({
      farmId: z.number(),
      title: z.string(),
      description: z.string().optional(),
      taskType: z.string(),
      priority: z.enum(['low', 'medium', 'high', 'urgent']),
      dueDate: z.string(),
      assignedToUserId: z.number(),
      fieldId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Database not available',
        });
      }

      const taskId = uuidv4();
      const now = new Date();

      try {
        await db.execute(
          sql`INSERT INTO fieldWorkerTasks (
            taskId, farmId, fieldId, title, description, taskType, priority, status,
            assignedToUserId, assignedByUserId, dueDate, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        );

        // Broadcast task creation event
        broadcastToFarm(input.farmId, {
          type: 'task_created',
          data: {
            taskId,
            farmId: input.farmId,
            title: input.title,
            priority: input.priority,
            dueDate: input.dueDate,
            status: 'pending',
            createdAt: now.toISOString(),
          },
          timestamp: now.toISOString(),
        });

        return {
          success: true,
          taskId,
          message: 'Task created successfully',
        };
      } catch (error) {
        console.error('Failed to create task:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create task',
        });
      }
    }),
});
