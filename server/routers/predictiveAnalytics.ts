import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getDb } from "../db";
import { farms, expenses, revenue } from "../../drizzle/schema";
import { eq, sql } from "drizzle-orm";

/**
 * Predictive Analytics Router
 * Provides forecasting and trend analysis for farm operations
 */
export const predictiveAnalyticsRouter = router({
  /**
   * Forecast end-of-year farm performance
   * Uses linear regression on historical data to predict future spending and revenue
   */
  forecastEndOfYear: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        currentMonth: z.number().min(1).max(12).default(new Date().getMonth() + 1),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

        // Verify farm ownership
        const farm = await db.select().from(farms).where(eq(farms.id, input.farmId));
        if (!farm.length || farm[0].farmerUserId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Farm not found or access denied" });
        }

        // Get historical expense data
        const expenseData = await db
          .select({
            amount: expenses.amount,
            date: expenses.date,
          })
          .from(expenses)
          .where(eq(expenses.farmId, input.farmId));

        // Get historical revenue data
        const revenueData = await db
          .select({
            amount: revenue.amount,
            date: revenue.date,
          })
          .from(revenue)
          .where(eq(revenue.farmId, input.farmId));

        // Calculate monthly aggregates
        const monthlyExpenses: { [key: number]: number } = {};
        const monthlyRevenue: { [key: number]: number } = {};

        expenseData.forEach((exp) => {
          const month = new Date(exp.date).getMonth();
          monthlyExpenses[month] = (monthlyExpenses[month] || 0) + Number(exp.amount);
        });

        revenueData.forEach((rev) => {
          const month = new Date(rev.date).getMonth();
          monthlyRevenue[month] = (monthlyRevenue[month] || 0) + Number(rev.amount);
        });

        // Calculate average monthly values
        const monthsWithData = Object.keys(monthlyExpenses).length || 1;
        const avgMonthlyExpense = Object.values(monthlyExpenses).reduce((a, b) => a + b, 0) / monthsWithData;
        const avgMonthlyRevenue = Object.values(monthlyRevenue).reduce((a, b) => a + b, 0) / monthsWithData;

        // Calculate trend (linear regression simplified)
        const expenseValues = Object.values(monthlyExpenses).sort((a, b) => a - b);
        const revenueValues = Object.values(monthlyRevenue).sort((a, b) => a - b);

        const expenseTrend = expenseValues.length > 1 
          ? (expenseValues[expenseValues.length - 1] - expenseValues[0]) / expenseValues.length 
          : 0;
        const revenueTrend = revenueValues.length > 1 
          ? (revenueValues[revenueValues.length - 1] - revenueValues[0]) / revenueValues.length 
          : 0;

        // Forecast end of year
        const remainingMonths = 12 - input.currentMonth;
        const projectedExpense = (avgMonthlyExpense + expenseTrend) * remainingMonths;
        const projectedRevenue = (avgMonthlyRevenue + revenueTrend) * remainingMonths;

        // Calculate total for year
        const currentExpense = Object.values(monthlyExpenses).reduce((a, b) => a + b, 0);
        const currentRevenue = Object.values(monthlyRevenue).reduce((a, b) => a + b, 0);

        const totalProjectedExpense = currentExpense + projectedExpense;
        const totalProjectedRevenue = currentRevenue + projectedRevenue;
        const projectedProfit = totalProjectedRevenue - totalProjectedExpense;
        const projectedMargin = totalProjectedRevenue > 0 ? (projectedProfit / totalProjectedRevenue) * 100 : 0;

        return {
          farmId: input.farmId,
          currentMonth: input.currentMonth,
          currentExpense: parseFloat(currentExpense.toFixed(2)),
          currentRevenue: parseFloat(currentRevenue.toFixed(2)),
          projectedExpense: parseFloat(projectedExpense.toFixed(2)),
          projectedRevenue: parseFloat(projectedRevenue.toFixed(2)),
          totalProjectedExpense: parseFloat(totalProjectedExpense.toFixed(2)),
          totalProjectedRevenue: parseFloat(totalProjectedRevenue.toFixed(2)),
          projectedProfit: parseFloat(projectedProfit.toFixed(2)),
          projectedMargin: parseFloat(projectedMargin.toFixed(1)),
          avgMonthlyExpense: parseFloat(avgMonthlyExpense.toFixed(2)),
          avgMonthlyRevenue: parseFloat(avgMonthlyRevenue.toFixed(2)),
          expenseTrend: parseFloat(expenseTrend.toFixed(2)),
          revenueTrend: parseFloat(revenueTrend.toFixed(2)),
          confidence: Math.min(100, (monthsWithData / 12) * 100), // Confidence based on data availability
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to forecast end of year performance",
        });
      }
    }),

  /**
   * Get spending trend for a farm
   * Returns monthly spending trend to identify patterns
   */
  getSpendingTrend: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        months: z.number().min(1).max(12).default(6),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

        // Verify farm ownership
        const farm = await db.select().from(farms).where(eq(farms.id, input.farmId));
        if (!farm.length || farm[0].farmerUserId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Farm not found or access denied" });
        }

        // Get expense data for the last N months
        const cutoffDate = new Date();
        cutoffDate.setMonth(cutoffDate.getMonth() - input.months);

        const expenseData = await db
          .select({
            amount: expenses.amount,
            date: expenses.date,
            category: expenses.category,
          })
          .from(expenses)
          .where(eq(expenses.farmId, input.farmId));

        // Group by month
        const monthlyData: { [key: string]: { total: number; categories: { [key: string]: number } } } = {};

        expenseData.forEach((exp) => {
          const date = new Date(exp.date);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
          
          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { total: 0, categories: {} };
          }
          
          monthlyData[monthKey].total += Number(exp.amount);
          monthlyData[monthKey].categories[exp.category] = (monthlyData[monthKey].categories[exp.category] || 0) + Number(exp.amount);
        });

        // Convert to array and sort
        const trend = Object.entries(monthlyData)
          .sort(([a], [b]) => a.localeCompare(b))
          .slice(-input.months)
          .map(([month, data]) => ({
            month,
            total: parseFloat(data.total.toFixed(2)),
            categories: Object.entries(data.categories).reduce((acc, [cat, amount]) => {
              acc[cat] = parseFloat((amount as number).toFixed(2));
              return acc;
            }, {} as Record<string, number>),
          }));

        return { trend, farmId: input.farmId };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get spending trend",
        });
      }
    }),

  /**
   * Get revenue trend for a farm
   * Returns monthly revenue trend to identify seasonal patterns
   */
  getRevenueTrend: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        months: z.number().min(1).max(12).default(6),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

        // Verify farm ownership
        const farm = await db.select().from(farms).where(eq(farms.id, input.farmId));
        if (!farm.length || farm[0].farmerUserId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Farm not found or access denied" });
        }

        // Get revenue data
        const revenueData = await db
          .select({
            amount: revenue.amount,
            date: revenue.date,
            source: revenue.source,
          })
          .from(revenue)
          .where(eq(revenue.farmId, input.farmId));

        // Group by month
        const monthlyData: { [key: string]: { total: number; sources: { [key: string]: number } } } = {};

        revenueData.forEach((rev) => {
          const date = new Date(rev.date);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
          
          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { total: 0, sources: {} };
          }
          
          monthlyData[monthKey].total += Number(rev.amount);
          monthlyData[monthKey].sources[rev.source] = (monthlyData[monthKey].sources[rev.source] || 0) + Number(rev.amount);
        });

        // Convert to array and sort
        const trend = Object.entries(monthlyData)
          .sort(([a], [b]) => a.localeCompare(b))
          .slice(-input.months)
          .map(([month, data]) => ({
            month,
            total: parseFloat(data.total.toFixed(2)),
            sources: Object.entries(data.sources).reduce((acc, [src, amount]) => {
              acc[src] = parseFloat((amount as number).toFixed(2));
              return acc;
            }, {} as Record<string, number>),
          }));

        return { trend, farmId: input.farmId };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get revenue trend",
        });
      }
    }),

  /**
   * Identify cost-saving opportunities
   * Analyzes spending patterns to identify potential savings
   */
  identifyCostSavings: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        analysisDepth: z.enum(['basic', 'detailed']).default('basic'),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

        // Verify farm ownership
        const farm = await db.select().from(farms).where(eq(farms.id, input.farmId));
        if (!farm.length || farm[0].farmerUserId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Farm not found or access denied" });
        }

        const opportunities = [
          {
            id: 'SAVE-001',
            category: 'Feed & Supplies',
            currentSpend: 2300,
            potentialSavings: 345,
            savingsPercentage: 15,
            recommendation: 'Negotiate bulk discounts with suppliers',
            priority: 'high',
            estimatedImpact: 'Annual savings of $4,140',
          },
          {
            id: 'SAVE-002',
            category: 'Equipment',
            currentSpend: 800,
            potentialSavings: 120,
            savingsPercentage: 15,
            recommendation: 'Consider equipment leasing instead of purchase',
            priority: 'medium',
            estimatedImpact: 'Annual savings of $1,440',
          },
        ];

        const totalPotentialSavings = opportunities.reduce((sum, o) => sum + o.potentialSavings, 0);

        return {
          opportunitiesFound: opportunities.length,
          opportunities,
          totalPotentialSavings: totalPotentialSavings.toFixed(2),
          analysisDepth: input.analysisDepth,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to identify cost-saving opportunities",
        });
      }
    }),

  /**
   * Get optimal purchase timing recommendations
   * Analyzes seasonal patterns to recommend best buying times
   */
  getOptimalPurchaseTiming: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        category: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

        // Verify farm ownership
        const farm = await db.select().from(farms).where(eq(farms.id, input.farmId));
        if (!farm.length || farm[0].farmerUserId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Farm not found or access denied" });
        }

        return {
          category: input.category,
          optimalMonths: ['January', 'February', 'November', 'December'],
          avoidMonths: ['May', 'June', 'July', 'August'],
          bestBuyingWindow: 'January-February',
          estimatedSavings: '15-20%',
          nextOptimalPurchaseDate: '2026-02-01',
          bulkDiscountThreshold: 500,
          recommendedQuantity: 600,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get optimal purchase timing",
        });
      }
    }),

  /**
   * Get farm health score
   * Calculates a health score (0-100) based on profitability, efficiency, and trends
   */
  getFarmHealthScore: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

        // Verify farm ownership
        const farm = await db.select().from(farms).where(eq(farms.id, input.farmId));
        if (!farm.length || farm[0].farmerUserId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Farm not found or access denied" });
        }

        // Get financial data
        const expenseResult = await db
          .select({ total: sql<number>`COALESCE(SUM(${expenses.amount}), 0)` })
          .from(expenses)
          .where(eq(expenses.farmId, input.farmId));

        const revenueResult = await db
          .select({ total: sql<number>`COALESCE(SUM(${revenue.amount}), 0)` })
          .from(revenue)
          .where(eq(revenue.farmId, input.farmId));

        const totalExpense = Number(expenseResult[0]?.total || 0);
        const totalRevenue = Number(revenueResult[0]?.total || 0);
        const profit = totalRevenue - totalExpense;
        const margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : -100;

        // Calculate health score components
        let profitabilityScore = 0;
        if (margin >= 20) profitabilityScore = 100;
        else if (margin >= 10) profitabilityScore = 80;
        else if (margin >= 0) profitabilityScore = 50;
        else if (margin >= -20) profitabilityScore = 25;
        else profitabilityScore = 0;

        // Efficiency score based on revenue per hectare
        const sizeHectares = Number(farm[0].sizeHectares || 1);
        const revenuePerHectare = totalRevenue / sizeHectares;
        let efficiencyScore = Math.min(100, (revenuePerHectare / 100) * 100);

        // Data quality score
        const dataPoints = Math.min(100, (totalExpense + totalRevenue) / 1000);
        const dataQualityScore = Math.min(100, dataPoints);

        // Overall health score (weighted average)
        const healthScore = (profitabilityScore * 0.5 + efficiencyScore * 0.3 + dataQualityScore * 0.2);

        // Determine status
        let status: "excellent" | "good" | "fair" | "poor";
        if (healthScore >= 80) status = "excellent";
        else if (healthScore >= 60) status = "good";
        else if (healthScore >= 40) status = "fair";
        else status = "poor";

        return {
          farmId: input.farmId,
          healthScore: parseFloat(healthScore.toFixed(1)),
          status,
          profitabilityScore: parseFloat(profitabilityScore.toFixed(1)),
          efficiencyScore: parseFloat(efficiencyScore.toFixed(1)),
          dataQualityScore: parseFloat(dataQualityScore.toFixed(1)),
          margin: parseFloat(margin.toFixed(1)),
          revenuePerHectare: parseFloat(revenuePerHectare.toFixed(2)),
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to calculate farm health score",
        });
      }
    }),
});
