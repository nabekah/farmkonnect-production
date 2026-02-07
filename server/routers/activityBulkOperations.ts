import { protectedProcedure } from '../_core/trpc';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { getDb } from '../db';
import { fieldWorkerActivityLogs } from '../../drizzle/schema';
import { sql } from 'drizzle-orm';

/**
 * Bulk Operations Router for Activity Management
 * Handles bulk approve, reject, and delete operations
 */

export const activityBulkOperationsRouter = {
  /**
   * Bulk approve activities
   */
  bulkApprove: protectedProcedure
    .input(
      z.object({
        activityIds: z.array(z.string()).min(1),
        farmId: z.number(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Database not available',
          });
        }

        const { activityIds, farmId, notes } = input;

        // Update activities to reviewed status
        const result = await db.execute(
          sql`
            UPDATE fieldWorkerActivityLogs
            SET 
              status = 'reviewed',
              reviewedBy = ${ctx.user.id},
              reviewedAt = NOW(),
              reviewNotes = ${notes || null},
              updatedAt = NOW()
            WHERE logId IN (${sql.join(activityIds, ',')})
            AND farmId = ${farmId}
            AND status != 'reviewed'
          `
        );

        return {
          success: true,
          updated: (result as any).affectedRows || 0,
          message: `Successfully approved ${(result as any).affectedRows || 0} activities`,
        };
      } catch (error) {
        console.error('Bulk approve error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to approve activities',
        });
      }
    }),

  /**
   * Bulk reject activities
   */
  bulkReject: protectedProcedure
    .input(
      z.object({
        activityIds: z.array(z.string()).min(1),
        farmId: z.number(),
        reason: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Database not available',
          });
        }

        const { activityIds, farmId, reason } = input;

        const result = await db.execute(
          sql`
            UPDATE fieldWorkerActivityLogs
            SET 
              status = 'rejected',
              reviewedBy = ${ctx.user.id},
              reviewedAt = NOW(),
              reviewNotes = ${reason},
              updatedAt = NOW()
            WHERE logId IN (${sql.join(activityIds, ',')})
            AND farmId = ${farmId}
          `
        );

        return {
          success: true,
          updated: (result as any).affectedRows || 0,
          message: `Successfully rejected ${(result as any).affectedRows || 0} activities`,
        };
      } catch (error) {
        console.error('Bulk reject error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to reject activities',
        });
      }
    }),

  /**
   * Bulk delete activities (admin only)
   */
  bulkDelete: protectedProcedure
    .input(
      z.object({
        activityIds: z.array(z.string()).min(1),
        farmId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Database not available',
          });
        }

        const { activityIds, farmId } = input;

        // Verify user has permission (admin only)
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Only administrators can delete activities',
          });
        }

        const result = await db.execute(
          sql`
            DELETE FROM fieldWorkerActivityLogs
            WHERE logId IN (${sql.join(activityIds, ',')})
            AND farmId = ${farmId}
          `
        );

        return {
          success: true,
          deleted: (result as any).affectedRows || 0,
          message: `Successfully deleted ${(result as any).affectedRows || 0} activities`,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error('Bulk delete error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete activities',
        });
      }
    }),

  /**
   * Bulk update activity status
   */
  bulkUpdateStatus: protectedProcedure
    .input(
      z.object({
        activityIds: z.array(z.string()).min(1),
        farmId: z.number(),
        status: z.enum(['draft', 'submitted', 'reviewed']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Database not available',
          });
        }

        const { activityIds, farmId, status } = input;

        const result = await db.execute(
          sql`
            UPDATE fieldWorkerActivityLogs
            SET 
              status = ${status},
              updatedAt = NOW()
            WHERE logId IN (${sql.join(activityIds, ',')})
            AND farmId = ${farmId}
          `
        );

        return {
          success: true,
          updated: (result as any).affectedRows || 0,
          message: `Successfully updated ${(result as any).affectedRows || 0} activities to ${status}`,
        };
      } catch (error) {
        console.error('Bulk update status error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update activity status',
        });
      }
    }),

  /**
   * Get bulk operation statistics
   */
  getStats: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Database not available',
          });
        }

        const { farmId } = input;

        const statsResult = await db.execute(
          sql`
            SELECT 
              COUNT(*) as total,
              SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft_count,
              SUM(CASE WHEN status = 'submitted' THEN 1 ELSE 0 END) as submitted_count,
              SUM(CASE WHEN status = 'reviewed' THEN 1 ELSE 0 END) as reviewed_count
            FROM fieldWorkerActivityLogs
            WHERE farmId = ${farmId}
          `
        );

        const statsArray = Array.isArray(statsResult) ? statsResult : [];
        const stats = statsArray[0] || {
          total: 0,
          draft_count: 0,
          submitted_count: 0,
          reviewed_count: 0,
        };

        return {
          total: (stats as any).total || 0,
          draft: (stats as any).draft_count || 0,
          submitted: (stats as any).submitted_count || 0,
          reviewed: (stats as any).reviewed_count || 0,
        };
      } catch (error) {
        console.error('Get stats error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get statistics',
        });
      }
    }),
};
