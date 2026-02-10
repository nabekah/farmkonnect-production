import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { eq, and, gte, lte, sum, inArray, sql, desc } from "drizzle-orm";
import {
  expenses,
  revenue,
  budgets,
  budgetLineItems,
  financialForecasts,
  budgetVarianceAlerts,
  animalProfitability
} from "../../drizzle/schema";

export const financialForecastingRouter = router({
  /**
   * Generate financial forecasts based on historical trends
   */
  generateForecasts: protectedProcedure
    .input(z.object({
      farmId: z.string(),
      forecastPeriods: z.number().default(3), // Number of periods to forecast
      historicalPeriods: z.number().default(12) // Number of historical periods to analyze
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const farmId = parseInt(input.farmId);
      const forecasts = [];

      // Get expense history
      const expenseHistory = await db
        .select({
          month: sql`DATE_FORMAT(${expenses.expenseDate}, '%Y-%m')`,
          expenseType: expenses.expenseType,
          total: sum(expenses.amount)
        })
        .from(expenses)
        .where(eq(expenses.farmId, farmId))
        .groupBy(sql`DATE_FORMAT(${expenses.expenseDate}, '%Y-%m')`, expenses.expenseType)
        .orderBy(sql`DATE_FORMAT(${expenses.expenseDate}, '%Y-%m')`)
        .limit(input.historicalPeriods);

      // Get revenue history
      const revenueHistory = await db
        .select({
          month: sql`DATE_FORMAT(${revenue.revenueDate}, '%Y-%m')`,
          revenueType: revenue.revenueType,
          total: sum(revenue.amount)
        })
        .from(revenue)
        .where(eq(revenue.farmId, farmId))
        .groupBy(sql`DATE_FORMAT(${revenue.revenueDate}, '%Y-%m')`, revenue.revenueType)
        .orderBy(sql`DATE_FORMAT(${revenue.revenueDate}, '%Y-%m')`)
        .limit(input.historicalPeriods);

      // Calculate expense forecasts
      const expenseByType: Record<string, number[]> = {};
      expenseHistory.forEach((record: any) => {
        if (!expenseByType[record.expenseType]) {
          expenseByType[record.expenseType] = [];
        }
        expenseByType[record.expenseType].push(Number(record.total || 0));
      });

      // Generate expense forecasts
      for (const [expenseType, values] of Object.entries(expenseByType)) {
        if (values.length > 0) {
          const average = values.reduce((a, b) => a + b, 0) / values.length;
          const trend = calculateTrend(values);
          const forecastedAmount = average * (1 + trend.percentage / 100);

          await db.insert(financialForecasts).values({
            farmId,
            forecastType: "expense",
            category: expenseType,
            forecastPeriod: getNextMonth(),
            historicalAverage: average,
            forecastedAmount,
            confidence: calculateConfidence(values),
            trend: trend.direction,
            trendPercentage: trend.percentage,
            dataPointsUsed: values.length
          });
        }
      }

      // Calculate revenue forecasts
      const revenueByType: Record<string, number[]> = {};
      revenueHistory.forEach((record: any) => {
        if (!revenueByType[record.revenueType]) {
          revenueByType[record.revenueType] = [];
        }
        revenueByType[record.revenueType].push(Number(record.total || 0));
      });

      // Generate revenue forecasts
      for (const [revenueType, values] of Object.entries(revenueByType)) {
        if (values.length > 0) {
          const average = values.reduce((a, b) => a + b, 0) / values.length;
          const trend = calculateTrend(values);
          const forecastedAmount = average * (1 + trend.percentage / 100);

          await db.insert(financialForecasts).values({
            farmId,
            forecastType: "revenue",
            category: revenueType,
            forecastPeriod: getNextMonth(),
            historicalAverage: average,
            forecastedAmount,
            confidence: calculateConfidence(values),
            trend: trend.direction,
            trendPercentage: trend.percentage,
            dataPointsUsed: values.length
          });
        }
      }

      return { success: true, forecasts: forecasts.length };
    }),

  /**
   * Get forecasts for a farm
   */
  getForecasts: protectedProcedure
    .input(z.object({
      farmId: z.string(),
      forecastType: z.enum(["revenue", "expense", "profit"]).optional(),
      limit: z.number().default(20)
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const farmId = parseInt(input.farmId);
      const conditions = [eq(financialForecasts.farmId, farmId)];
      
      if (input.forecastType) {
        conditions.push(eq(financialForecasts.forecastType, input.forecastType));
      }

      const result = await db
        .select()
        .from(financialForecasts)
        .where(and(...conditions))
        .orderBy(desc(financialForecasts.generatedAt))
        .limit(input.limit);

      return result;
    }),

  /**
   * Create a budget with line items
   */
  createBudget: protectedProcedure
    .input(z.object({
      farmId: z.string(),
      budgetName: z.string(),
      budgetType: z.enum(["annual", "quarterly", "monthly", "project"]),
      startDate: z.date(),
      endDate: z.date(),
      totalBudget: z.number().positive(),
      lineItems: z.array(z.object({
        expenseType: z.string(),
        description: z.string().optional(),
        budgetedAmount: z.number().positive()
      }))
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const farmId = parseInt(input.farmId);
      const startDateStr = input.startDate instanceof Date 
        ? input.startDate.toISOString().split('T')[0]
        : input.startDate.toString();
      const endDateStr = input.endDate instanceof Date 
        ? input.endDate.toISOString().split('T')[0]
        : input.endDate.toString();

      const [budgetResult] = await db.insert(budgets).values({
        farmId,
        budgetName: input.budgetName,
        budgetType: input.budgetType,
        startDate: startDateStr,
        endDate: endDateStr,
        totalBudget: input.totalBudget,
        status: "draft"
      });

      const budgetId = budgetResult.insertId;

      // Insert line items
      for (const item of input.lineItems) {
        await db.insert(budgetLineItems).values({
          budgetId: budgetId,
          expenseType: item.expenseType,
          description: item.description,
          budgetedAmount: item.budgetedAmount
        });
      }

      return { budgetId, success: true };
    }),

  /**
   * Get budget with variance analysis
   */
  getBudgetWithVariance: protectedProcedure
    .input(z.object({
      budgetId: z.number()
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const budget = await db.select().from(budgets).where(eq(budgets.id, input.budgetId));
      if (!budget.length) throw new Error("Budget not found");

      const lineItems = await db
        .select()
        .from(budgetLineItems)
        .where(eq(budgetLineItems.budgetId, input.budgetId));

      // Calculate actual spending for each line item
      const budgetWithVariance = await Promise.all(
        lineItems.map(async (item) => {
          const expenseResult = await db
            .select({ total: sum(expenses.amount) })
            .from(expenses)
            .where(
              and(
                eq(expenses.farmId, budget[0].farmId),
                eq(expenses.expenseType, item.expenseType)
              )
            );

          const actualAmount = Number(expenseResult[0]?.total || 0);
          const budgetedAmount = Number(item.budgetedAmount);
          const variance = actualAmount - budgetedAmount;
          const variancePercentage = budgetedAmount > 0 ? (variance / budgetedAmount) * 100 : 0;

          return {
            ...item,
            actualAmount,
            variance,
            variancePercentage,
            percentageUsed: budgetedAmount > 0 ? (actualAmount / budgetedAmount) * 100 : 0
          };
        })
      );

      return {
        ...budget[0],
        lineItems: budgetWithVariance
      };
    }),

  /**
   * Check and create budget variance alerts
   */
  checkBudgetVariances: protectedProcedure
    .input(z.object({
      farmId: z.string(),
      thresholds: z.object({
        overBudgetThreshold: z.number().default(100), // percentage
        approachingThreshold: z.number().default(80)   // percentage
      }).optional()
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const farmId = parseInt(input.farmId);
      const thresholds = input.thresholds || {
        overBudgetThreshold: 100,
        approachingThreshold: 80
      };

      // Get active budgets
      const activeBudgets = await db
        .select()
        .from(budgets)
        .where(and(eq(budgets.farmId, farmId), eq(budgets.status, "active")));

      const alerts = [];

      for (const budget of activeBudgets) {
        const lineItems = await db
          .select()
          .from(budgetLineItems)
          .where(eq(budgetLineItems.budgetId, budget.id));

        for (const item of lineItems) {
          const expenseResult = await db
            .select({ total: sum(expenses.amount) })
            .from(expenses)
            .where(
              and(
                eq(expenses.farmId, farmId),
                eq(expenses.expenseType, item.expenseType)
              )
            );

          const actualAmount = Number(expenseResult[0]?.total || 0);
          const budgetedAmount = Number(item.budgetedAmount);
          const percentageUsed = budgetedAmount > 0 ? (actualAmount / budgetedAmount) * 100 : 0;
          const variance = actualAmount - budgetedAmount;

          let alertType = null;
          let severity = "low";

          if (percentageUsed > thresholds.overBudgetThreshold) {
            alertType = "over_budget";
            severity = percentageUsed > 150 ? "critical" : "high";
          } else if (percentageUsed > thresholds.approachingThreshold) {
            alertType = "approaching_budget";
            severity = "medium";
          }

          if (alertType) {
            await db.insert(budgetVarianceAlerts).values({
              budgetLineItemId: item.id,
              farmId,
              varianceAmount: variance,
              variancePercentage: percentageUsed - 100,
              alertType: alertType as any,
              severity: severity as any
            });

            alerts.push({
              itemId: item.id,
              expenseType: item.expenseType,
              alertType,
              severity
            });
          }
        }
      }

      return { alerts, alertCount: alerts.length };
    }),

  /**
   * Get budget variance alerts
   */
  getVarianceAlerts: protectedProcedure
    .input(z.object({
      farmId: z.string(),
      severity: z.enum(["low", "medium", "high", "critical"]).optional(),
      unacknowledgedOnly: z.boolean().default(true)
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const farmId = parseInt(input.farmId);
      const conditions = [eq(budgetVarianceAlerts.farmId, farmId)];

      if (input.severity) {
        conditions.push(eq(budgetVarianceAlerts.severity, input.severity));
      }

      if (input.unacknowledgedOnly) {
        conditions.push(eq(budgetVarianceAlerts.acknowledged, false));
      }

      const alerts = await db
        .select()
        .from(budgetVarianceAlerts)
        .where(and(...conditions))
        .orderBy(desc(budgetVarianceAlerts.createdAt));

      return alerts;
    })
});

// Helper functions
function calculateTrend(values: number[]): { direction: "increasing" | "decreasing" | "stable", percentage: number } {
  if (values.length < 2) return { direction: "stable", percentage: 0 };

  const firstHalf = values.slice(0, Math.floor(values.length / 2)).reduce((a, b) => a + b, 0) / Math.floor(values.length / 2);
  const secondHalf = values.slice(Math.floor(values.length / 2)).reduce((a, b) => a + b, 0) / Math.ceil(values.length / 2);

  const percentage = firstHalf > 0 ? ((secondHalf - firstHalf) / firstHalf) * 100 : 0;

  let direction: "increasing" | "decreasing" | "stable" = "stable";
  if (percentage > 5) direction = "increasing";
  else if (percentage < -5) direction = "decreasing";

  return { direction, percentage };
}

function calculateConfidence(values: number[]): number {
  if (values.length < 2) return 50;

  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  const coefficientOfVariation = mean > 0 ? (stdDev / mean) * 100 : 100;

  // Lower CV = higher confidence
  return Math.max(30, Math.min(95, 100 - coefficientOfVariation));
}

function getNextMonth(): string {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  return date.toISOString().split('T')[0];
}
