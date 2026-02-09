import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import {
  getSellerAnalytics,
  getSalesByCategory,
  getCustomerInsights,
  exportAnalyticsToCSV,
} from '../services/sellerAnalyticsService';

export const sellerAnalyticsRouter = router({
  /**
   * Get comprehensive seller analytics
   */
  getAnalytics: protectedProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const analytics = await getSellerAnalytics(ctx.user.id, input.startDate, input.endDate);
        return analytics;
      } catch (error) {
        console.error('Error getting analytics:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get analytics',
        });
      }
    }),

  /**
   * Get sales by category
   */
  getSalesByCategory: protectedProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const sales = await getSalesByCategory(ctx.user.id, input.startDate, input.endDate);
        return sales;
      } catch (error) {
        console.error('Error getting sales by category:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get sales by category',
        });
      }
    }),

  /**
   * Get customer insights
   */
  getCustomerInsights: protectedProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const insights = await getCustomerInsights(ctx.user.id, input.startDate, input.endDate);
        return insights;
      } catch (error) {
        console.error('Error getting customer insights:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get customer insights',
        });
      }
    }),

  /**
   * Export analytics to CSV
   */
  exportToCSV: protectedProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const csv = await exportAnalyticsToCSV(ctx.user.id, input.startDate, input.endDate);
        return {
          csv,
          filename: `seller-analytics-${new Date().toISOString().split('T')[0]}.csv`,
        };
      } catch (error) {
        console.error('Error exporting analytics:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to export analytics',
        });
      }
    }),
});
