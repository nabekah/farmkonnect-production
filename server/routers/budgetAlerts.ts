/**
 * Budget Alert Monitoring Router
 * Handles real-time budget monitoring and alert generation
 * Alerts when expenses exceed 80% of budget threshold
 */
import { router, protectedProcedure } from "../\_core/trpc";
import { getDb } from "../db";
import { budgets, budgetLineItems, expenses, budgetVarianceAlerts } from "../../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

export const budgetAlertsRouter = router({
  /**
   * Get active budget alerts for a farm
   * Returns alerts that haven't been acknowledged
   */
  getActiveAlerts: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        const alerts = await db
          .select({
            id: budgetVarianceAlerts.id,
            budgetLineItemId: budgetVarianceAlerts.budgetLineItemId,
            farmId: budgetVarianceAlerts.farmId,
            varianceAmount: budgetVarianceAlerts.varianceAmount,
            variancePercentage: budgetVarianceAlerts.variancePercentage,
            alertType: budgetVarianceAlerts.alertType,
            severity: budgetVarianceAlerts.severity,
            acknowledged: budgetVarianceAlerts.acknowledged,
            acknowledgedAt: budgetVarianceAlerts.acknowledgedAt,
            createdAt: budgetVarianceAlerts.createdAt,
            budgetName: budgets.budgetName,
            categoryName: budgetLineItems.categoryName,
            budgetedAmount: budgetLineItems.budgetedAmount,
          })
          .from(budgetVarianceAlerts)
          .innerJoin(
            budgetLineItems,
            eq(budgetVarianceAlerts.budgetLineItemId, budgetLineItems.id)
          )
          .innerJoin(budgets, eq(budgetLineItems.budgetId, budgets.id))
          .where(
            and(
              eq(budgetVarianceAlerts.farmId, input.farmId),
              eq(budgetVarianceAlerts.acknowledged, false)
            )
          )
          .orderBy(sql`FIELD(${budgetVarianceAlerts.severity}, 'critical', 'high', 'medium', 'low')`)
          .orderBy(sql`${budgetVarianceAlerts.createdAt} DESC`);

        return {
          alerts,
          count: alerts.length,
          criticalCount: alerts.filter((a) => a.severity === "critical").length,
          highCount: alerts.filter((a) => a.severity === "high").length,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch active alerts",
        });
      }
    }),

  /**
   * Monitor budget and generate alerts
   * Checks all budget line items and creates alerts for overspending
   */
  monitorBudgets: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        // Get all budget line items for the farm
        const lineItems = await db
          .select({
            id: budgetLineItems.id,
            budgetId: budgetLineItems.budgetId,
            categoryName: budgetLineItems.categoryName,
            budgetedAmount: budgetLineItems.budgetedAmount,
          })
          .from(budgetLineItems)
          .innerJoin(budgets, eq(budgetLineItems.budgetId, budgets.id))
          .where(eq(budgets.farmId, input.farmId));

        const alertsCreated = [];

        for (const item of lineItems) {
          // Calculate actual spending for this category
          const spendingResult = await db
            .select({
              totalSpent: sql<number>`COALESCE(SUM(${expenses.amount}), 0)`,
            })
            .from(expenses)
            .where(
              and(
                eq(expenses.farmId, input.farmId),
                eq(expenses.categoryName, item.categoryName)
              )
            );

          const totalSpent = Number(spendingResult[0]?.totalSpent || 0);
          const budgetedAmount = Number(item.budgetedAmount);
          const spendingPercentage = budgetedAmount > 0 ? (totalSpent / budgetedAmount) * 100 : 0;
          const varianceAmount = totalSpent - budgetedAmount;

          // Determine alert type and severity
          let alertType: "over_budget" | "approaching_budget" | "under_budget" = "under_budget";
          let severity: "low" | "medium" | "high" | "critical" = "low";

          if (spendingPercentage >= 100) {
            alertType = "over_budget";
            severity = spendingPercentage >= 120 ? "critical" : "high";
          } else if (spendingPercentage >= 80) {
            alertType = "approaching_budget";
            severity = spendingPercentage >= 95 ? "high" : "medium";
          }

          // Check if alert already exists for this line item
          const existingAlert = await db
            .select()
            .from(budgetVarianceAlerts)
            .where(
              and(
                eq(budgetVarianceAlerts.budgetLineItemId, item.id),
                eq(budgetVarianceAlerts.acknowledged, false)
              )
            )
            .limit(1);

          // Create alert only if spending is at or above 80% threshold
          if (spendingPercentage >= 80 && existingAlert.length === 0) {
            await db.insert(budgetVarianceAlerts).values({
              budgetLineItemId: item.id,
              farmId: input.farmId,
              varianceAmount: varianceAmount,
              variancePercentage: spendingPercentage,
              alertType,
              severity,
              acknowledged: false,
            });

            alertsCreated.push({
              categoryName: item.categoryName,
              spendingPercentage: spendingPercentage.toFixed(1),
              severity,
              alertType,
            });
          }
        }

        return {
          success: true,
          alertsCreated,
          totalAlertsCreated: alertsCreated.length,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to monitor budgets",
        });
      }
    }),

  /**
   * Acknowledge an alert
   * Mark alert as acknowledged by user
   */
  acknowledgeAlert: protectedProcedure
    .input(z.object({ alertId: z.number(), notes: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        await db
          .update(budgetVarianceAlerts)
          .set({
            acknowledged: true,
            acknowledgedBy: ctx.user.id,
            acknowledgedAt: new Date(),
            notes: input.notes,
          })
          .where(eq(budgetVarianceAlerts.id, input.alertId));

        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to acknowledge alert",
        });
      }
    }),

  /**
   * Get alert history for a farm
   * Returns all alerts (acknowledged and unacknowledged)
   */
  getAlertHistory: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        const alerts = await db
          .select({
            id: budgetVarianceAlerts.id,
            budgetLineItemId: budgetVarianceAlerts.budgetLineItemId,
            varianceAmount: budgetVarianceAlerts.varianceAmount,
            variancePercentage: budgetVarianceAlerts.variancePercentage,
            alertType: budgetVarianceAlerts.alertType,
            severity: budgetVarianceAlerts.severity,
            acknowledged: budgetVarianceAlerts.acknowledged,
            acknowledgedBy: budgetVarianceAlerts.acknowledgedBy,
            acknowledgedAt: budgetVarianceAlerts.acknowledgedAt,
            notes: budgetVarianceAlerts.notes,
            createdAt: budgetVarianceAlerts.createdAt,
            categoryName: budgetLineItems.categoryName,
            budgetedAmount: budgetLineItems.budgetedAmount,
          })
          .from(budgetVarianceAlerts)
          .innerJoin(
            budgetLineItems,
            eq(budgetVarianceAlerts.budgetLineItemId, budgetLineItems.id)
          )
          .where(eq(budgetVarianceAlerts.farmId, input.farmId))
          .orderBy(sql`${budgetVarianceAlerts.createdAt} DESC`)
          .limit(input.limit)
          .offset(input.offset);

        const total = await db
          .select({ count: sql<number>`COUNT(*)` })
          .from(budgetVarianceAlerts)
          .where(eq(budgetVarianceAlerts.farmId, input.farmId));

        return {
          alerts,
          total: Number(total[0]?.count || 0),
          limit: input.limit,
          offset: input.offset,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch alert history",
        });
      }
    }),

  /**
   * Get budget status summary
   * Returns spending status for all budget categories
   */
  getBudgetStatus: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        const lineItems = await db
          .select({
            id: budgetLineItems.id,
            categoryName: budgetLineItems.categoryName,
            budgetedAmount: budgetLineItems.budgetedAmount,
          })
          .from(budgetLineItems)
          .innerJoin(budgets, eq(budgetLineItems.budgetId, budgets.id))
          .where(eq(budgets.farmId, input.farmId));

        const budgetStatus = [];

        for (const item of lineItems) {
          const spendingResult = await db
            .select({
              totalSpent: sql<number>`COALESCE(SUM(${expenses.amount}), 0)`,
            })
            .from(expenses)
            .where(
              and(
                eq(expenses.farmId, input.farmId),
                eq(expenses.categoryName, item.categoryName)
              )
            );

          const totalSpent = Number(spendingResult[0]?.totalSpent || 0);
          const budgetedAmount = Number(item.budgetedAmount);
          const spendingPercentage = budgetedAmount > 0 ? (totalSpent / budgetedAmount) * 100 : 0;
          const remaining = budgetedAmount - totalSpent;

          budgetStatus.push({
            categoryName: item.categoryName,
            budgetedAmount,
            totalSpent,
            remaining,
            spendingPercentage: parseFloat(spendingPercentage.toFixed(1)),
            status:
              spendingPercentage >= 100
                ? "over_budget"
                : spendingPercentage >= 80
                  ? "warning"
                  : "on_track",
          });
        }

        return {
          budgetStatus,
          totalBudgeted: budgetStatus.reduce((sum, b) => sum + b.budgetedAmount, 0),
          totalSpent: budgetStatus.reduce((sum, b) => sum + b.totalSpent, 0),
          totalRemaining: budgetStatus.reduce((sum, b) => sum + b.remaining, 0),
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch budget status",
        });
      }
    }),
});
