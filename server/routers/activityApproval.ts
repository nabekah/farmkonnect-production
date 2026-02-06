import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { getDb } from '../db';
import { fieldWorkerActivityLogs } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

export const activityApprovalRouter = router({
  // Approve an activity record
  approveActivity: protectedProcedure
    .input(z.object({
      id: z.number(),
      reviewNotes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Only admins can approve
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only administrators can approve activities',
        });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });
      
      await db
        .update(fieldWorkerActivityLogs)
        .set({
          status: 'reviewed',
          reviewedBy: ctx.user.id,
          reviewedAt: new Date(),
          reviewNotes: input.reviewNotes,
        })
        .where(eq(fieldWorkerActivityLogs.id, input.id));

      return { success: true, message: 'Activity approved successfully' };
    }),

  // Reject an activity record
  rejectActivity: protectedProcedure
    .input(z.object({
      id: z.number(),
      reviewNotes: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Only admins can reject
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only administrators can reject activities',
        });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });
      
      await db
        .update(fieldWorkerActivityLogs)
        .set({
          status: 'draft',
          reviewedBy: ctx.user.id,
          reviewedAt: new Date(),
          reviewNotes: input.reviewNotes,
        })
        .where(eq(fieldWorkerActivityLogs.id, input.id));

      return { success: true, message: 'Activity rejected and returned to draft' };
    }),

  // Get pending activities for review
  getPendingActivities: protectedProcedure
    .query(async ({ ctx }) => {
      // Only admins can view pending activities
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only administrators can view pending activities',
        });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });
      
      const pending = await db
        .select()
        .from(fieldWorkerActivityLogs)
        .where(eq(fieldWorkerActivityLogs.status, 'submitted'));

      return pending;
    }),

  // Bulk approve activities
  bulkApproveActivities: protectedProcedure
    .input(z.object({
      ids: z.array(z.number()),
      reviewNotes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Only admins can approve
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only administrators can approve activities',
        });
      }

      if (input.ids.length === 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'No activities selected',
        });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

      for (const id of input.ids) {
        await db
          .update(fieldWorkerActivityLogs)
          .set({
            status: 'reviewed',
            reviewedBy: ctx.user.id,
            reviewedAt: new Date(),
            reviewNotes: input.reviewNotes,
          })
          .where(eq(fieldWorkerActivityLogs.id, id));
      }

      return {
        success: true,
        message: `${input.ids.length} activities approved successfully`,
        count: input.ids.length,
      };
    }),

  // Bulk delete activities
  bulkDeleteActivities: protectedProcedure
    .input(z.object({
      ids: z.array(z.number()),
    }))
    .mutation(async ({ ctx, input }) => {
      // Only admins can delete activities
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only administrators can delete activities',
        });
      }

      if (input.ids.length === 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'No activities selected',
        });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

      for (const id of input.ids) {
        await db
          .delete(fieldWorkerActivityLogs)
          .where(eq(fieldWorkerActivityLogs.id, id));
      }

      return {
        success: true,
        message: `${input.ids.length} activities deleted successfully`,
        count: input.ids.length,
      };
    }),

  // Bulk update status
  bulkUpdateStatus: protectedProcedure
    .input(z.object({
      ids: z.array(z.number()),
      status: z.enum(['draft', 'submitted', 'reviewed']),
    }))
    .mutation(async ({ ctx, input }) => {
      // Only admins can update status
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only administrators can update activity status',
        });
      }

      if (input.ids.length === 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'No activities selected',
        });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

      for (const id of input.ids) {
        await db
          .update(fieldWorkerActivityLogs)
          .set({ status: input.status })
          .where(eq(fieldWorkerActivityLogs.id, id));
      }

      return {
        success: true,
        message: `${input.ids.length} activities updated to ${input.status}`,
        count: input.ids.length,
      };
    }),
});
