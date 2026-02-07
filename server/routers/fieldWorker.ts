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

export const fieldWorkerRouter = router({
  getTasks: protectedProcedure
    .input(z.object({
      farmId: z.number(),
      status: z.enum(['pending', 'in_progress', 'completed']).optional(),
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
        const tasks = await db
          .select()
          .from(fieldWorkerTasks)
          .where(eq(fieldWorkerTasks.farmId, input.farmId))
          .orderBy(desc(fieldWorkerTasks.createdAt));

        return tasks;
      } catch (error) {
        console.error('Failed to fetch tasks:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch tasks',
        });
      }
    }),

  getTaskDetails: protectedProcedure
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
        const task = await db
          .select()
          .from(fieldWorkerTasks)
          .where(eq(fieldWorkerTasks.taskId, input.taskId))
          .limit(1);

        if (task.length === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Task not found',
          });
        }

        return task[0];
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error('Failed to fetch task details:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch task details',
        });
      }
    }),

  updateTaskStatus: protectedProcedure
    .input(z.object({
      taskId: z.string(),
      status: z.enum(['pending', 'in_progress', 'completed']),
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

      try {
        const now = new Date();
        await db
          .update(fieldWorkerTasks)
          .set({
            status: input.status,
            updatedAt: now,
          })
          .where(eq(fieldWorkerTasks.taskId, input.taskId));

        const historyId = uuidv4();
        await db.execute(
          sql`INSERT INTO taskHistory (historyId, taskId, userId, action, notes, createdAt)
              VALUES (${historyId}, ${input.taskId}, ${ctx.user.id}, ${input.status}, ${input.notes || null}, ${now})`
        );

        const updatedTask = await db
          .select()
          .from(fieldWorkerTasks)
          .where(eq(fieldWorkerTasks.taskId, input.taskId))
          .limit(1);

        if (updatedTask.length > 0) {
          broadcastToFarm(updatedTask[0].farmId, {
            type: 'task_updated',
            data: updatedTask[0],
            timestamp: now.toISOString(),
          });
        }

        return { success: true, message: 'Task status updated' };
      } catch (error) {
        console.error('Failed to update task status:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update task status',
        });
      }
    }),

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
          sql`SELECT * FROM fieldWorkerActivityLogs WHERE farmId = ${input.farmId} ORDER BY createdAt DESC LIMIT ${input.limit} OFFSET ${input.offset}`
        );

        return logs;
      } catch (error) {
        console.error('Failed to fetch activity logs:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch activity logs',
        });
      }
    }),

  getActivityLogDetails: protectedProcedure
    .input(z.object({
      logId: z.string(),
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
          sql`SELECT * FROM fieldWorkerActivityLogs WHERE logId = ${input.logId}`
        );

        if (logs.length === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Activity log not found',
          });
        }

        return logs[0];
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error('Failed to fetch activity log details:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch activity log details',
        });
      }
    }),

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
        const photoUrlsJson = JSON.stringify(input.photoUrls || []);
        
        await db.execute(
          sql`INSERT INTO fieldWorkerActivityLogs (
            logId, userId, farmId, fieldId, activityType, title, description, observations,
            gpsLatitude, gpsLongitude, photoUrls, createdAt, updatedAt
          ) VALUES (
            ${logId}, ${ctx.user.id}, ${input.farmId}, ${input.fieldId ?? null}, 
            ${input.activityType}, ${input.title}, ${input.description ?? null}, 
            ${input.observations ?? null}, ${input.gpsLatitude ?? null}, 
            ${input.gpsLongitude ?? null}, ${photoUrlsJson}, ${now}, ${now}
          )`
        );

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
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('Failed to create activity log:', errorMessage);
        console.error('Full error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to log activity: ${errorMessage}`,
        });
      }
    }),

  updateActivityLog: protectedProcedure
    .input(z.object({
      logId: z.string(),
      title: z.string().optional(),
      description: z.string().optional(),
      observations: z.string().optional(),
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

      try {
        const now = new Date();
        const updates: string[] = ['updatedAt = NOW()'];

        if (input.title) updates.push(`title = '${input.title}'`);
        if (input.description) updates.push(`description = '${input.description}'`);
        if (input.observations) updates.push(`observations = '${input.observations}'`);
        if (input.photoUrls) updates.push(`photoUrls = '${JSON.stringify(input.photoUrls)}'`);

        await db.execute(
          sql`UPDATE fieldWorkerActivityLogs SET ${sql.raw(updates.join(', '))} WHERE logId = ${input.logId}`
        );

        return { success: true, message: 'Activity log updated' };
      } catch (error) {
        console.error('Failed to update activity log:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update activity log',
        });
      }
    }),

  deleteActivityLog: protectedProcedure
    .input(z.object({
      logId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Database not available',
        });
      }

      try {
        await db.execute(
          sql`DELETE FROM fieldWorkerActivityLogs WHERE logId = ${input.logId}`
        );

        return { success: true, message: 'Activity log deleted' };
      } catch (error) {
        console.error('Failed to delete activity log:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete activity log',
        });
      }
    }),

  getDashboardData: protectedProcedure
    .input(z.object({
      farmId: z.number(),
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
        // Get pending tasks
        const pendingTasks = await db
          .select()
          .from(fieldWorkerTasks)
          .where(eq(fieldWorkerTasks.farmId, input.farmId))
          .orderBy(desc(fieldWorkerTasks.dueDate))
          .limit(10);

        // Get recent activities
        const recentActivities = await db.execute(
          sql`SELECT id, logId, userId, farmId, activityType, title, description, gpsLatitude, gpsLongitude, createdAt 
              FROM fieldWorkerActivityLogs 
              WHERE farmId = ${input.farmId} 
              ORDER BY createdAt DESC 
              LIMIT 10`
        );

        // Calculate work hours today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const workHoursResult = await db.execute(
          sql`SELECT 
                SUM(TIMESTAMPDIFF(MINUTE, clockInTime, clockOutTime)) as totalMinutes
              FROM timeTrackerLogs 
              WHERE userId = ${ctx.user.id} 
              AND farmId = ${input.farmId}
              AND clockInTime >= ${today}
              AND clockInTime < ${tomorrow}`
        );

        const totalMinutes = (workHoursResult[0]?.totalMinutes as number) || 0;
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;

        return {
          pendingTasks: pendingTasks || [],
          recentActivities: recentActivities || [],
          workHoursToday: { hours, minutes },
        };
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch dashboard data',
        });
      }
    }),

  clockIn: protectedProcedure
    .input(z.object({
      farmId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Database not available',
        });
      }

      try {
        const now = new Date();
        await db.execute(
          sql`INSERT INTO timeTrackerLogs (userId, farmId, clockInTime, createdAt, updatedAt)
              VALUES (${ctx.user.id}, ${input.farmId}, ${now}, ${now}, ${now})`
        );
        return { success: true, message: 'Clocked in successfully' };
      } catch (error) {
        console.error('Failed to clock in:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to clock in',
        });
      }
    }),

  clockOut: protectedProcedure
    .input(z.object({
      farmId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Database not available',
        });
      }

      try {
        const now = new Date();
        await db.execute(
          sql`UPDATE timeTrackerLogs 
              SET clockOutTime = ${now}, updatedAt = ${now}
              WHERE userId = ${ctx.user.id} 
              AND farmId = ${input.farmId}
              AND clockOutTime IS NULL
              ORDER BY clockInTime DESC
              LIMIT 1`
        );
        return { success: true, message: 'Clocked out successfully' };
      } catch (error) {
        console.error('Failed to clock out:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to clock out',
        });
      }
    }),
});
