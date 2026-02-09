import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import {
  getMarketplaceFinancialSummary,
  syncMarketplaceRevenueToFinancial,
  getMarketplaceTransactions,
  generateMarketplaceFinancialReport,
} from '../services/marketplaceFinancialIntegration';

export const marketplaceFinancialRouter = router({
  /**
   * Get marketplace financial summary
   */
  getFinancialSummary: protectedProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const summary = await getMarketplaceFinancialSummary(ctx.user.id, input.startDate, input.endDate);
        return summary;
      } catch (error) {
        console.error('Error getting financial summary:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get financial summary',
        });
      }
    }),

  /**
   * Sync marketplace revenue to financial dashboard
   */
  syncToFinancialDashboard: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const result = await syncMarketplaceRevenueToFinancial(
          ctx.user.id,
          input.farmId,
          input.startDate,
          input.endDate
        );
        return {
          success: result,
          message: 'Marketplace revenue synced to financial dashboard',
        };
      } catch (error) {
        console.error('Error syncing to financial dashboard:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to sync to financial dashboard',
        });
      }
    }),

  /**
   * Get marketplace transactions
   */
  getTransactions: protectedProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const transactions = await getMarketplaceTransactions(
          ctx.user.id,
          input.startDate,
          input.endDate,
          input.limit,
          input.offset
        );
        return transactions;
      } catch (error) {
        console.error('Error getting transactions:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get transactions',
        });
      }
    }),

  /**
   * Generate marketplace financial report
   */
  generateReport: protectedProcedure
    .input(
      z.object({
        period: z.enum(['week', 'month', 'quarter', 'year']),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const report = await generateMarketplaceFinancialReport(ctx.user.id, input.period);
        return report;
      } catch (error) {
        console.error('Error generating report:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to generate report',
        });
      }
    }),

  /**
   * Get marketplace revenue breakdown
   */
  getRevenueBreakdown: protectedProcedure.query(async ({ ctx }) => {
    try {
      const summary = await getMarketplaceFinancialSummary(ctx.user.id);

      return {
        grossRevenue: summary.totalRevenue,
        commissions: summary.totalCommissions,
        processingFees: summary.paymentProcessingFee,
        netRevenue: summary.netRevenue,
        commissionRate: 3,
        processingFeeRate: 2.9,
        breakdown: [
          {
            label: 'Gross Revenue',
            value: summary.totalRevenue,
            percentage: 100,
          },
          {
            label: 'Commission (3%)',
            value: summary.totalCommissions,
            percentage: (summary.totalCommissions / summary.totalRevenue) * 100,
          },
          {
            label: 'Processing Fees',
            value: summary.paymentProcessingFee,
            percentage: (summary.paymentProcessingFee / summary.totalRevenue) * 100,
          },
          {
            label: 'Net Revenue',
            value: summary.netRevenue,
            percentage: (summary.netRevenue / summary.totalRevenue) * 100,
          },
        ],
      };
    } catch (error) {
      console.error('Error getting revenue breakdown:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get revenue breakdown',
      });
    }
  }),
});
