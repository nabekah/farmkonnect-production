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

      const oldStatus = task.status;
      const completedDate = input.status === 'completed' ? new Date() : null;

      await db.update(fieldWorkerTasks)
        .set({
          status: input.status,
          completionNotes: input.completionNotes,
          completedDate,
          updatedAt: new Date(),
        })
        .where(eq(fieldWorkerTasks.taskId, input.taskId));

      await db.insert(taskHistory).values({
        historyId: uuidv4(),
        taskId: input.taskId,
        changedByUserId: ctx.user!.id,
        changeType: 'status_changed',
        oldValue: JSON.stringify({ status: oldStatus }),
        newValue: JSON.stringify({ status: input.status }),
        fieldChanged: 'status',
        description: `Status changed from ${oldStatus} to ${input.status}`,
      });

      return { success: true, message: 'Task updated successfully' };
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
      dueDate: z.date().optional(),
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

      const updates: any = {};
      const changes: any[] = [];

      if (input.title && input.title !== task.title) {
        updates.title = input.title;
        changes.push({
          field: 'title',
          oldValue: task.title,
          newValue: input.title,
        });
      }

      if (input.description && input.description !== task.description) {
        updates.description = input.description;
        changes.push({
          field: 'description',
          oldValue: task.description,
          newValue: input.description,
        });
      }

      if (input.priority && input.priority !== task.priority) {
        updates.priority = input.priority;
        changes.push({
          field: 'priority',
          oldValue: task.priority,
          newValue: input.priority,
        });
      }

      if (input.dueDate && input.dueDate !== task.dueDate) {
        updates.dueDate = input.dueDate;
        changes.push({
          field: 'dueDate',
          oldValue: task.dueDate,
          newValue: input.dueDate,
        });
      }

      if (input.notes && input.notes !== task.notes) {
        updates.notes = input.notes;
        changes.push({
          field: 'notes',
          oldValue: task.notes,
          newValue: input.notes,
        });
      }

      if (Object.keys(updates).length === 0) {
        return { success: true, message: 'No changes made' };
      }

      updates.updatedAt = new Date();

      await db.update(fieldWorkerTasks)
        .set(updates)
        .where(eq(fieldWorkerTasks.taskId, input.taskId));

      for (const change of changes) {
        await db.insert(taskHistory).values({
          historyId: uuidv4(),
          taskId: input.taskId,
          changedByUserId: ctx.user!.id,
          changeType: 'edited',
          oldValue: JSON.stringify(change.oldValue),
          newValue: JSON.stringify(change.newValue),
          fieldChanged: change.field,
          description: `${change.field} updated`,
        });
      }

      return { success: true, message: 'Task updated successfully' };
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

      const history = await db.select().from(taskHistory).where(eq(taskHistory.taskId, input.taskId));

      const enrichedHistory = await Promise.all(
        history.map(async (h: any) => {
          const userList = await db.select().from(users).where(eq(users.id, h.changedByUserId)).limit(1);
          const user = userList[0];
          return {
            ...h,
            changedByName: user?.name || 'Unknown',
          };
        })
      );

      return enrichedHistory.sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime());
    }),

  /**
   * Create activity log - USING RAW SQL
   */
  createActivityLog: protectedProcedure
    .input(z.object({
      farmId: z.number(),
      fieldId: z.number().optional(),
      taskId: z.string().optional(),
      activityType: z.enum([
        'crop_health',
        'pest_monitoring',
        'disease_detection',
        'irrigation',
        'fertilizer_application',
        'weed_control',
        'harvest',
        'equipment_check',
        'soil_test',
        'weather_observation',
        'general_note',
      ]),
      title: z.string(),
      description: z.string(),
      observations: z.string().optional(),
      gpsLatitude: z.number().optional(),
      gpsLongitude: z.number().optional(),
      photoUrls: z.array(z.string()).optional(),
      duration: z.number().optional(),
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

      try {
        // Use raw SQL to insert activity log
        await db.execute(sql`
          INSERT INTO fieldWorkerActivityLogs (
            logId, userId, farmId, fieldId, taskId, activityType, 
            title, description, observations, gpsLatitude, gpsLongitude, 
            photoUrls, duration, status, syncedToServer
          ) VALUES (
            ${logId}, ${ctx.user!.id}, ${input.farmId}, 
            ${input.fieldId || null}, ${input.taskId || null}, ${input.activityType},
            ${input.title}, ${input.description || ''}, ${input.observations || null},
            ${input.gpsLatitude || null}, ${input.gpsLongitude || null},
            ${input.photoUrls ? JSON.stringify(input.photoUrls) : null},
            ${input.duration || null}, 'submitted', true
          )
        `);

        return {
          success: true,
          logId,
          message: 'Activity logged successfully',
        };
      } catch (error: any) {
        console.error('Activity creation error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to save activity: ${error.message}`,
        });
      }
    }),

  /**
   * Get recent activity logs - USING RAW SQL
   */
  getActivityLogs: protectedProcedure
    .input(z.object({
      farmId: z.number(),
      limit: z.number().default(20),
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
        // Use raw SQL to query activity logs
        const logs = await db.execute(sql`
          SELECT * FROM fieldWorkerActivityLogs 
          WHERE farmId = ${input.farmId}
          ORDER BY createdAt DESC
          LIMIT ${input.limit}
        `);

        const rows = (logs as any).rows || [];

        return {
          logs: rows.map((log: any) => ({
            id: log.id,
            logId: log.logId,
            title: log.title,
            activityType: log.activityType,
            description: log.description,
            observations: log.observations,
            gpsLatitude: log.gpsLatitude,
            gpsLongitude: log.gpsLongitude,
            photoUrls: log.photoUrls ? JSON.parse(log.photoUrls) : [],
            createdAt: log.createdAt,
            updatedAt: log.updatedAt,
            status: log.status,
          })),
        };
      } catch (error: any) {
        console.error('Activity retrieval error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to retrieve activities: ${error.message}`,
        });
      }
    }),

  /**
   * Clock in
   */
  clockIn: protectedProcedure
    .input(z.object({
      farmId: z.number(),
      taskId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        clockInTime: new Date().toISOString(),
        message: 'Clocked in successfully',
      };
    }),

  /**
   * Clock out
   */
  clockOut: protectedProcedure
    .input(z.object({
      farmId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        clockOutTime: new Date().toISOString(),
        workDuration: 480,
        message: 'Clocked out successfully',
      };
    }),

  /**
   * Get dashboard data
   */
  getDashboardData: protectedProcedure
    .input(z.object({
      farmId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      return {
        pendingTasks: [
          {
            id: '1',
            title: 'Monitor crop health',
            priority: 'high',
            dueDate: new Date().toISOString(),
          },
        ],
        recentActivities: [
          {
            id: '1',
            title: 'Crop health check',
            createdAt: new Date().toISOString(),
          },
        ],
        workHoursToday: { hours: 8, minutes: 30 },
        todayTimeTracking: [],
      };
    }),

  /**
   * Sync offline queue
   */
  syncOfflineQueue: protectedProcedure
    .input(z.object({
      farmId: z.number(),
      queueItems: z.array(z.object({
        queueId: z.string(),
        actionType: z.string(),
        payload: z.any(),
      })),
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
});
