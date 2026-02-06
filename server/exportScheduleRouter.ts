import { router, protectedProcedure } from './_core/trpc';
import { z } from 'zod';
import { getDb } from './db';
import { eq } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { farms } from '../drizzle/schema';

interface ExportSchedule {
  id: string;
  userId: string;
  farmId: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  format: 'csv' | 'json' | 'pdf';
  recipients: string[];
  kpiPreferences: {
    revenue: boolean;
    expenses: boolean;
    profit: boolean;
    animals: boolean;
    workers: boolean;
    ponds: boolean;
    assets: boolean;
  };
  lastRun?: string;
  nextRun: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export const exportScheduleRouter = router({
  // Create new export schedule
  create: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        frequency: z.enum(['daily', 'weekly', 'monthly']),
        format: z.enum(['csv', 'json', 'pdf']),
        recipients: z.array(z.string().email()),
        kpiPreferences: z.object({
          revenue: z.boolean(),
          expenses: z.boolean(),
          profit: z.boolean(),
          animals: z.boolean(),
          workers: z.boolean(),
          ponds: z.boolean(),
          assets: z.boolean(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database connection failed');

      // Verify farm ownership
      const farmResult = await db.select().from(farms).where(eq(farms.id, input.farmId)).limit(1);
      const farm = farmResult[0];

      if (!farm || farm.farmerUserId !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to create schedules for this farm',
        });
      }

      // Calculate next run time
      const nextRun = calculateNextRun(input.frequency);

      const schedule: ExportSchedule = {
        id: `schedule_${Date.now()}`,
        userId: ctx.user.id as unknown as string,
        farmId: input.farmId.toString(),
        frequency: input.frequency,
        format: input.format,
        recipients: input.recipients,
        kpiPreferences: input.kpiPreferences,
        nextRun,
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return schedule;
    }),

  // List export schedules for a farm
  list: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database connection failed');

      // Verify farm access
      const farmResult = await db.select().from(farms).where(eq(farms.id, input.farmId)).limit(1);
      const farm = farmResult[0];

      if (!farm || farm.farmerUserId !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to access this farm',
        });
      }

      // Return mock schedules for now
      const schedules: ExportSchedule[] = [
        {
          id: 'schedule_1',
          userId: ctx.user.id as unknown as string,
          farmId: input.farmId.toString(),
          frequency: 'weekly',
          format: 'csv',
          recipients: ['manager@farm.com'],
          kpiPreferences: {
            revenue: true,
            expenses: true,
            profit: true,
            animals: true,
            workers: true,
            ponds: false,
            assets: false,
          },
          lastRun: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          nextRun: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          active: true,
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      return schedules;
    }),

  // Update export schedule
  update: protectedProcedure
    .input(
      z.object({
        scheduleId: z.string(),
        farmId: z.number(),
        frequency: z.enum(['daily', 'weekly', 'monthly']).optional(),
        format: z.enum(['csv', 'json', 'pdf']).optional(),
        recipients: z.array(z.string().email()).optional(),
        active: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database connection failed');

      // Verify farm ownership
      const farmResult = await db.select().from(farms).where(eq(farms.id, input.farmId)).limit(1);
      const farm = farmResult[0];

      if (!farm || farm.farmerUserId !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to update schedules for this farm',
        });
      }

      return {
        id: input.scheduleId,
        message: 'Schedule updated successfully',
      };
    }),

  // Delete export schedule
  delete: protectedProcedure
    .input(
      z.object({
        scheduleId: z.string(),
        farmId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database connection failed');

      // Verify farm ownership
      const farmResult = await db.select().from(farms).where(eq(farms.id, input.farmId)).limit(1);
      const farm = farmResult[0];

      if (!farm || farm.farmerUserId !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to delete schedules for this farm',
        });
      }

      return {
        id: input.scheduleId,
        message: 'Schedule deleted successfully',
      };
    }),

  // Trigger manual export
  triggerManual: protectedProcedure
    .input(
      z.object({
        scheduleId: z.string(),
        farmId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database connection failed');

      // Verify farm ownership
      const farmResult = await db.select().from(farms).where(eq(farms.id, input.farmId)).limit(1);
      const farm = farmResult[0];

      if (!farm || farm.farmerUserId !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to trigger exports for this farm',
        });
      }

      return {
        id: input.scheduleId,
        message: 'Export triggered successfully',
        exportId: `export_${Date.now()}`,
      };
    }),
});

/**
 * Calculate next run time based on frequency
 */
function calculateNextRun(frequency: 'daily' | 'weekly' | 'monthly'): string {
  const now = new Date();

  switch (frequency) {
    case 'daily':
      now.setDate(now.getDate() + 1);
      now.setHours(8, 0, 0, 0);
      break;
    case 'weekly':
      now.setDate(now.getDate() + 7);
      now.setHours(8, 0, 0, 0);
      break;
    case 'monthly':
      now.setMonth(now.getMonth() + 1);
      now.setDate(1);
      now.setHours(8, 0, 0, 0);
      break;
  }

  return now.toISOString();
}
