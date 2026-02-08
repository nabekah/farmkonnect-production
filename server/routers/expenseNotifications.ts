import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { and, eq, gte, lte } from "drizzle-orm";
import { budgets, expenses } from "../../drizzle/schema";

export const expenseNotifications = router({
  /**
   * Check if an expense exceeds budget threshold
   * Returns alert if spending is above threshold percentage
   */
  checkBudgetAlert: protectedProcedure
    .input(
      z.object({
        farmId: z.string(),
        category: z.string(),
        thresholdPercent: z.number().min(0).max(100).default(80),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      const farmId = parseInt(input.farmId);

      // Get current budget for category
      const budget = await db
        .select()
        .from(budgets)
        .where(
          and(
            eq(budgets.farmId, farmId),
            eq(budgets.category, input.category)
          )
        )
        .limit(1);

      if (!budget || budget.length === 0) {
        return {
          hasAlert: false,
          message: "No budget set for this category",
          spent: 0,
          allocated: 0,
          percentUsed: 0,
        };
      }

      const budgetRecord = budget[0];
      const allocated = parseFloat(budgetRecord.allocatedAmount.toString());

      // Get total spent in this category
      const expenseRecords = await db
        .select()
        .from(expenses)
        .where(
          and(
            eq(expenses.farmId, farmId),
            eq(expenses.category, input.category)
          )
        );

      const spent = expenseRecords.reduce(
        (sum, exp) => sum + parseFloat(exp.amount.toString()),
        0
      );

      const percentUsed = (spent / allocated) * 100;
      const hasAlert = percentUsed >= input.thresholdPercent;

      return {
        hasAlert,
        message: hasAlert
          ? `Alert: ${input.category} spending is at ${percentUsed.toFixed(1)}% of budget`
          : `${input.category} spending is within budget`,
        spent: parseFloat(spent.toFixed(2)),
        allocated,
        percentUsed: parseFloat(percentUsed.toFixed(1)),
        remaining: parseFloat((allocated - spent).toFixed(2)),
      };
    }),

  /**
   * Get all budget alerts for a farm
   * Returns alerts for all categories exceeding threshold
   */
  getAllBudgetAlerts: protectedProcedure
    .input(
      z.object({
        farmId: z.string(),
        thresholdPercent: z.number().min(0).max(100).default(80),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      const farmId = parseInt(input.farmId);

      // Get all budgets for farm
      const budgetRecords = await db
        .select()
        .from(budgets)
        .where(eq(budgets.farmId, farmId));

      const alerts = [];

      for (const budget of budgetRecords) {
        const allocated = parseFloat(budget.allocatedAmount.toString());

        // Get expenses for this category
        const expenseRecords = await db
          .select()
          .from(expenses)
          .where(
            and(
              eq(expenses.farmId, farmId),
              eq(expenses.category, budget.category)
            )
          );

        const spent = expenseRecords.reduce(
          (sum, exp) => sum + parseFloat(exp.amount.toString()),
          0
        );

        const percentUsed = (spent / allocated) * 100;

        if (percentUsed >= input.thresholdPercent) {
          alerts.push({
            category: budget.category,
            budgetName: budget.name,
            spent: parseFloat(spent.toFixed(2)),
            allocated,
            percentUsed: parseFloat(percentUsed.toFixed(1)),
            remaining: parseFloat((allocated - spent).toFixed(2)),
            severity:
              percentUsed >= 100
                ? "critical"
                : percentUsed >= 95
                  ? "warning"
                  : "info",
            message:
              percentUsed >= 100
                ? `CRITICAL: ${budget.category} budget exceeded by GHS ${(spent - allocated).toFixed(2)}`
                : `WARNING: ${budget.category} spending at ${percentUsed.toFixed(1)}% of budget`,
          });
        }
      }

      return {
        alertCount: alerts.length,
        alerts: alerts.sort((a, b) => b.percentUsed - a.percentUsed),
      };
    }),

  /**
   * Get spending trend for a category
   * Shows if spending is increasing or decreasing
   */
  getSpendingTrend: protectedProcedure
    .input(
      z.object({
        farmId: z.string(),
        category: z.string(),
        monthsToAnalyze: z.number().min(1).max(12).default(3),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      const farmId = parseInt(input.farmId);

      const expenseRecords = await db
        .select()
        .from(expenses)
        .where(
          and(
            eq(expenses.farmId, farmId),
            eq(expenses.category, input.category)
          )
        );

      // Group by month
      const monthlyData: Record<string, number> = {};

      expenseRecords.forEach((exp) => {
        const date = new Date(exp.expenseDate);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

        monthlyData[monthKey] =
          (monthlyData[monthKey] || 0) + parseFloat(exp.amount.toString());
      });

      const months = Object.keys(monthlyData).sort();
      const amounts = months.map((m) => monthlyData[m]);

      // Calculate trend
      let trend = "stable";
      if (amounts.length >= 2) {
        const recentAvg =
          amounts.slice(-Math.ceil(amounts.length / 2)).reduce((a, b) => a + b, 0) /
          Math.ceil(amounts.length / 2);
        const olderAvg =
          amounts.slice(0, Math.floor(amounts.length / 2)).reduce((a, b) => a + b, 0) /
          Math.floor(amounts.length / 2);

        const percentChange = ((recentAvg - olderAvg) / olderAvg) * 100;

        if (percentChange > 10) {
          trend = "increasing";
        } else if (percentChange < -10) {
          trend = "decreasing";
        }
      }

      return {
        category: input.category,
        trend,
        monthlyData,
        months,
        amounts,
        totalSpent: amounts.reduce((a, b) => a + b, 0),
        averageMonthly: amounts.length > 0 ? amounts.reduce((a, b) => a + b, 0) / amounts.length : 0,
      };
    }),

  /**
   * Get high-spending alerts
   * Returns expenses that are significantly higher than average
   */
  getHighSpendingAlerts: protectedProcedure
    .input(
      z.object({
        farmId: z.string(),
        deviationPercent: z.number().min(0).max(200).default(50),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      const farmId = parseInt(input.farmId);

      const expenseRecords = await db
        .select()
        .from(expenses)
        .where(eq(expenses.farmId, farmId));

      // Group by category and calculate average
      const categoryStats: Record<
        string,
        { amounts: number[]; total: number; count: number }
      > = {};

      expenseRecords.forEach((exp) => {
        const cat = exp.category;
        if (!categoryStats[cat]) {
          categoryStats[cat] = { amounts: [], total: 0, count: 0 };
        }
        const amount = parseFloat(exp.amount.toString());
        categoryStats[cat].amounts.push(amount);
        categoryStats[cat].total += amount;
        categoryStats[cat].count += 1;
      });

      // Find high-spending transactions
      const alerts = [];

      for (const [category, stats] of Object.entries(categoryStats)) {
        const average = stats.total / stats.count;
        const threshold = average * (1 + input.deviationPercent / 100);

        expenseRecords.forEach((exp) => {
          if (
            exp.category === category &&
            parseFloat(exp.amount.toString()) > threshold
          ) {
            alerts.push({
              id: exp.id,
              category,
              description: exp.description,
              amount: parseFloat(exp.amount.toString()),
              date: exp.expenseDate,
              vendor: exp.vendor,
              percentAboveAverage: parseFloat(
                (
                  ((parseFloat(exp.amount.toString()) - average) / average) *
                  100
                ).toFixed(1)
              ),
              averageForCategory: parseFloat(average.toFixed(2)),
            });
          }
        });
      }

      return {
        alertCount: alerts.length,
        alerts: alerts.sort((a, b) => b.percentAboveAverage - a.percentAboveAverage),
      };
    }),

  /**
   * Get expense forecast based on recent spending
   * Projects future expenses based on trend
   */
  getForecastedExpenses: protectedProcedure
    .input(
      z.object({
        farmId: z.string(),
        category: z.string(),
        monthsAhead: z.number().min(1).max(12).default(3),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      const farmId = parseInt(input.farmId);

      const expenseRecords = await db
        .select()
        .from(expenses)
        .where(
          and(
            eq(expenses.farmId, farmId),
            eq(expenses.category, input.category)
          )
        );

      // Get last 3 months of data
      const now = new Date();
      const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());

      const recentExpenses = expenseRecords.filter(
        (exp) => new Date(exp.expenseDate) >= threeMonthsAgo
      );

      if (recentExpenses.length === 0) {
        return {
          category: input.category,
          forecast: [],
          message: "Insufficient data for forecast",
        };
      }

      // Calculate average monthly spending
      const totalRecent = recentExpenses.reduce(
        (sum, exp) => sum + parseFloat(exp.amount.toString()),
        0
      );
      const averageMonthly = totalRecent / 3;

      // Generate forecast
      const forecast = [];
      for (let i = 1; i <= input.monthsAhead; i++) {
        const forecastDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
        forecast.push({
          month: forecastDate.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
          }),
          forecastedAmount: parseFloat(averageMonthly.toFixed(2)),
          confidence: "medium",
        });
      }

      return {
        category: input.category,
        baselineMonthly: parseFloat(averageMonthly.toFixed(2)),
        forecast,
        message: `Based on last 3 months average of GHS ${averageMonthly.toFixed(2)}/month`,
      };
    }),
});
