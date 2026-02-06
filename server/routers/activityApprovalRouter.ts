/**
 * Activity Approval Router
 * tRPC procedures for activity record approval workflow
 */

import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { getDb } from '../db';
import { fieldWorkerActivityLogs } from '../../drizzle/schema';
import { eq, inArray, sql } from 'drizzle-orm';

export const activityApprovalRouter = router({
  /**
   * Approve a single activity record
   */
  approveActivity: protectedProcedure
    .input(z.object({
      activityId: z.number(),
      comments: z.string().optional(),
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
        // Update activity status to reviewed (approved)
        const result = await db
          .update(fieldWorkerActivityLogs)
          .set({
            status: 'reviewed',
            updatedAt: new Date(),
          })
          .where(eq(fieldWorkerActivityLogs.id, input.activityId));

        return {
          success: true,
          message: 'Activity approved successfully',
          activityId: input.activityId,
        };
      } catch (error) {
        console.error('Failed to approve activity:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to approve activity',
        });
      }
    }),

  /**
   * Reject a single activity record
   */
  rejectActivity: protectedProcedure
    .input(z.object({
      activityId: z.number(),
      reason: z.string(),
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
        // Update activity status to reviewed (rejected)
        const result = await db
          .update(fieldWorkerActivityLogs)
          .set({
            status: 'reviewed',
            updatedAt: new Date(),
          })
          .where(eq(fieldWorkerActivityLogs.id, input.activityId));

        return {
          success: true,
          message: 'Activity rejected successfully',
          activityId: input.activityId,
          reason: input.reason,
        };
      } catch (error) {
        console.error('Failed to reject activity:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to reject activity',
        });
      }
    }),

  /**
   * Bulk approve multiple activities
   */
  bulkApproveActivities: protectedProcedure
    .input(z.object({
      activityIds: z.array(z.number()),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Database not available',
        });
      }

      if (input.activityIds.length === 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'No activities selected',
        });
      }

      try {
        // Update all selected activities to reviewed (approved)
        const result = await db
          .update(fieldWorkerActivityLogs)
          .set({
            status: 'reviewed',
            updatedAt: new Date(),
          })
          .where(inArray(fieldWorkerActivityLogs.id, input.activityIds));

        return {
          success: true,
          message: `${input.activityIds.length} activities approved successfully`,
          count: input.activityIds.length,
        };
      } catch (error) {
        console.error('Failed to bulk approve activities:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to bulk approve activities',
        });
      }
    }),

  /**
   * Bulk reject multiple activities
   */
  bulkRejectActivities: protectedProcedure
    .input(z.object({
      activityIds: z.array(z.number()),
      reason: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Database not available',
        });
      }

      if (input.activityIds.length === 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'No activities selected',
        });
      }

      try {
        // Update all selected activities to reviewed (rejected)
        const result = await db
          .update(fieldWorkerActivityLogs)
          .set({
            status: 'reviewed',
            updatedAt: new Date(),
          })
          .where(inArray(fieldWorkerActivityLogs.id, input.activityIds));

        return {
          success: true,
          message: `${input.activityIds.length} activities rejected successfully`,
          count: input.activityIds.length,
          reason: input.reason,
        };
      } catch (error) {
        console.error('Failed to bulk reject activities:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to bulk reject activities',
        });
      }
    }),

  /**
   * Bulk delete activities
   */
  bulkDeleteActivities: protectedProcedure
    .input(z.object({
      activityIds: z.array(z.number()),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Database not available',
        });
      }

      if (input.activityIds.length === 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'No activities selected',
        });
      }

      try {
        // Delete all selected activities
        const result = await db
          .delete(fieldWorkerActivityLogs)
          .where(inArray(fieldWorkerActivityLogs.id, input.activityIds));

        return {
          success: true,
          message: `${input.activityIds.length} activities deleted successfully`,
          count: input.activityIds.length,
        };
      } catch (error) {
        console.error('Failed to bulk delete activities:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to bulk delete activities',
        });
      }
    }),

  /**
   * Bulk update activity status
   */
  bulkUpdateStatus: protectedProcedure
    .input(z.object({
      activityIds: z.array(z.number()),
      status: z.enum(['draft', 'submitted', 'reviewed']),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Database not available',
        });
      }

      if (input.activityIds.length === 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'No activities selected',
        });
      }

      try {
        // Update all selected activities with new status
        const result = await db
          .update(fieldWorkerActivityLogs)
          .set({
            status: input.status,
            updatedAt: new Date(),
          })
          .where(inArray(fieldWorkerActivityLogs.id, input.activityIds));

        return {
          success: true,
          message: `${input.activityIds.length} activities updated to ${input.status}`,
          count: input.activityIds.length,
          status: input.status,
        };
      } catch (error) {
        console.error('Failed to bulk update activities:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to bulk update activities',
        });
      }
    }),

  /**
   * Get pending activities for approval
   */
  getPendingActivities: protectedProcedure
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
        // Get activities with submitted or draft status
        const logs = await db.execute(
          sql`SELECT * FROM fieldWorkerActivityLogs WHERE farmId = ${input.farmId} AND status IN ('submitted', 'draft') ORDER BY createdAt DESC LIMIT ${input.limit} OFFSET ${input.offset}`
        );

        return {
          logs: logs || [],
          count: (logs || []).length,
        };
      } catch (error) {
        console.error('Failed to fetch pending activities:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch pending activities',
        });
      }
    }),

  /**
   * Get activity statistics
   */
  getActivityStats: protectedProcedure
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
        const stats = await db.execute(
          sql`SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft,
            SUM(CASE WHEN status = 'submitted' THEN 1 ELSE 0 END) as submitted,
            SUM(CASE WHEN status = 'reviewed' THEN 1 ELSE 0 END) as reviewed
          FROM fieldWorkerActivityLogs WHERE farmId = ${input.farmId}`
        );

        const result = (stats?.[0] as any) || {
          total: 0,
          draft: 0,
          submitted: 0,
          reviewed: 0,
        };

        return {
          total: Number(result.total) || 0,
          draft: Number(result.draft) || 0,
          submitted: Number(result.submitted) || 0,
          reviewed: Number(result.reviewed) || 0,
        };
      } catch (error) {
        console.error('Failed to fetch activity stats:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch activity stats',
        });
      }
    }),
});
