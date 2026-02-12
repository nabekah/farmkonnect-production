/**
 * Period Comparison Analysis Router
 * Handles month-over-month and year-over-year financial analysis
 * Provides trend indicators and comparative metrics
 */
import { router, protectedProcedure } from "../\_core/trpc";
import { getDb } from "../db";
import { expenses, revenue } from "../../drizzle/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

export const periodComparisonRouter = router({
  /**
   * Get month-over-month expense comparison
   * Compares current month with previous month
   */
  getMonthOverMonthExpenses: protectedProcedure
    .input(z.object({ farmId: z.number(), month: z.number(), year: z.number() }))
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        const currentMonth = new Date(input.year, input.month - 1, 1);
        const currentMonthEnd = new Date(input.year, input.month, 0);
        const previousMonthStart = new Date(input.year, input.month - 2, 1);
        const previousMonthEnd = new Date(input.year, input.month - 1, 0);

        // Get current month expenses by category
        const currentExpenses = await db
          .select({
            categoryName: expenses.categoryName,
            totalAmount: sql<number>`COALESCE(SUM(${expenses.amount}), 0)`,
            count: sql<number>`COUNT(*)`,
          })
          .from(expenses)
          .where(
            and(
              eq(expenses.farmId, input.farmId),
              gte(expenses.expenseDate, currentMonth),
              lte(expenses.expenseDate, currentMonthEnd)
            )
          )
          .groupBy(expenses.categoryName);

        // Get previous month expenses by category
        const previousExpenses = await db
          .select({
            categoryName: expenses.categoryName,
            totalAmount: sql<number>`COALESCE(SUM(${expenses.amount}), 0)`,
            count: sql<number>`COUNT(*)`,
          })
          .from(expenses)
          .where(
            and(
              eq(expenses.farmId, input.farmId),
              gte(expenses.expenseDate, previousMonthStart),
              lte(expenses.expenseDate, previousMonthEnd)
            )
          )
          .groupBy(expenses.categoryName);

        // Create comparison map
        const comparisonMap = new Map();
        
        currentExpenses.forEach((curr) => {
          comparisonMap.set(curr.categoryName, {
            category: curr.categoryName,
            currentMonth: Number(curr.totalAmount),
            previousMonth: 0,
            change: 0,
            changePercentage: 0,
            trend: "stable" as const,
          });
        });

        previousExpenses.forEach((prev) => {
          if (comparisonMap.has(prev.categoryName)) {
            const entry = comparisonMap.get(prev.categoryName);
            entry.previousMonth = Number(prev.totalAmount);
          } else {
            comparisonMap.set(prev.categoryName, {
              category: prev.categoryName,
              currentMonth: 0,
              previousMonth: Number(prev.totalAmount),
              change: 0,
              changePercentage: 0,
              trend: "stable" as const,
            });
          }
        });

        // Calculate changes and trends
        const comparison = Array.from(comparisonMap.values()).map((item) => {
          const change = item.currentMonth - item.previousMonth;
          const changePercentage =
            item.previousMonth > 0
              ? (change / item.previousMonth) * 100
              : item.currentMonth > 0
                ? 100
                : 0;

          let trend: "up" | "down" | "stable" = "stable";
          if (changePercentage > 5) trend = "up";
          else if (changePercentage < -5) trend = "down";

          return {
            ...item,
            change: parseFloat(change.toFixed(2)),
            changePercentage: parseFloat(changePercentage.toFixed(1)),
            trend,
          };
        });

        const totalCurrentMonth = comparison.reduce((sum, item) => sum + item.currentMonth, 0);
        const totalPreviousMonth = comparison.reduce((sum, item) => sum + item.previousMonth, 0);
        const totalChange = totalCurrentMonth - totalPreviousMonth;
        const totalChangePercentage =
          totalPreviousMonth > 0 ? (totalChange / totalPreviousMonth) * 100 : 0;

        return {
          currentMonth: input.month,
          previousMonth: input.month === 1 ? 12 : input.month - 1,
          comparison,
          summary: {
            totalCurrentMonth,
            totalPreviousMonth,
            totalChange: parseFloat(totalChange.toFixed(2)),
            totalChangePercentage: parseFloat(totalChangePercentage.toFixed(1)),
          },
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch month-over-month expenses",
        });
      }
    }),

  /**
   * Get year-over-year expense comparison
   * Compares current year with previous year
   */
  getYearOverYearExpenses: protectedProcedure
    .input(z.object({ farmId: z.number(), year: z.number() }))
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        const currentYearStart = new Date(input.year, 0, 1);
        const currentYearEnd = new Date(input.year, 11, 31);
        const previousYearStart = new Date(input.year - 1, 0, 1);
        const previousYearEnd = new Date(input.year - 1, 11, 31);

        // Get current year expenses by category
        const currentYearExpenses = await db
          .select({
            categoryName: expenses.categoryName,
            totalAmount: sql<number>`COALESCE(SUM(${expenses.amount}), 0)`,
          })
          .from(expenses)
          .where(
            and(
              eq(expenses.farmId, input.farmId),
              gte(expenses.expenseDate, currentYearStart),
              lte(expenses.expenseDate, currentYearEnd)
            )
          )
          .groupBy(expenses.categoryName);

        // Get previous year expenses by category
        const previousYearExpenses = await db
          .select({
            categoryName: expenses.categoryName,
            totalAmount: sql<number>`COALESCE(SUM(${expenses.amount}), 0)`,
          })
          .from(expenses)
          .where(
            and(
              eq(expenses.farmId, input.farmId),
              gte(expenses.expenseDate, previousYearStart),
              lte(expenses.expenseDate, previousYearEnd)
            )
          )
          .groupBy(expenses.categoryName);

        // Create comparison
        const comparisonMap = new Map();

        currentYearExpenses.forEach((curr) => {
          comparisonMap.set(curr.categoryName, {
            category: curr.categoryName,
            currentYear: Number(curr.totalAmount),
            previousYear: 0,
          });
        });

        previousYearExpenses.forEach((prev) => {
          if (comparisonMap.has(prev.categoryName)) {
            const entry = comparisonMap.get(prev.categoryName);
            entry.previousYear = Number(prev.totalAmount);
          } else {
            comparisonMap.set(prev.categoryName, {
              category: prev.categoryName,
              currentYear: 0,
              previousYear: Number(prev.totalAmount),
            });
          }
        });

        const comparison = Array.from(comparisonMap.values()).map((item) => {
          const change = item.currentYear - item.previousYear;
          const changePercentage =
            item.previousYear > 0
              ? (change / item.previousYear) * 100
              : item.currentYear > 0
                ? 100
                : 0;

          let trend: "up" | "down" | "stable" = "stable";
          if (changePercentage > 5) trend = "up";
          else if (changePercentage < -5) trend = "down";

          return {
            ...item,
            change: parseFloat(change.toFixed(2)),
            changePercentage: parseFloat(changePercentage.toFixed(1)),
            trend,
          };
        });

        const totalCurrentYear = comparison.reduce((sum, item) => sum + item.currentYear, 0);
        const totalPreviousYear = comparison.reduce((sum, item) => sum + item.previousYear, 0);
        const totalChange = totalCurrentYear - totalPreviousYear;
        const totalChangePercentage =
          totalPreviousYear > 0 ? (totalChange / totalPreviousYear) * 100 : 0;

        return {
          currentYear: input.year,
          previousYear: input.year - 1,
          comparison,
          summary: {
            totalCurrentYear,
            totalPreviousYear,
            totalChange: parseFloat(totalChange.toFixed(2)),
            totalChangePercentage: parseFloat(totalChangePercentage.toFixed(1)),
          },
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch year-over-year expenses",
        });
      }
    }),

  /**
   * Get month-over-month revenue comparison
   */
  getMonthOverMonthRevenue: protectedProcedure
    .input(z.object({ farmId: z.number(), month: z.number(), year: z.number() }))
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        const currentMonth = new Date(input.year, input.month - 1, 1);
        const currentMonthEnd = new Date(input.year, input.month, 0);
        const previousMonthStart = new Date(input.year, input.month - 2, 1);
        const previousMonthEnd = new Date(input.year, input.month - 1, 0);

        // Get current month revenue by type
        const currentRevenue = await db
          .select({
            revenueType: revenue.revenueType,
            totalAmount: sql<number>`COALESCE(SUM(${revenue.amount}), 0)`,
            count: sql<number>`COUNT(*)`,
          })
          .from(revenue)
          .where(
            and(
              eq(revenue.farmId, input.farmId),
              gte(revenue.revenueDate, currentMonth),
              lte(revenue.revenueDate, currentMonthEnd)
            )
          )
          .groupBy(revenue.revenueType);

        // Get previous month revenue by type
        const previousRevenue = await db
          .select({
            revenueType: revenue.revenueType,
            totalAmount: sql<number>`COALESCE(SUM(${revenue.amount}), 0)`,
            count: sql<number>`COUNT(*)`,
          })
          .from(revenue)
          .where(
            and(
              eq(revenue.farmId, input.farmId),
              gte(revenue.revenueDate, previousMonthStart),
              lte(revenue.revenueDate, previousMonthEnd)
            )
          )
          .groupBy(revenue.revenueType);

        // Create comparison map
        const comparisonMap = new Map();

        currentRevenue.forEach((curr) => {
          comparisonMap.set(curr.revenueType, {
            type: curr.revenueType,
            currentMonth: Number(curr.totalAmount),
            previousMonth: 0,
            change: 0,
            changePercentage: 0,
            trend: "stable" as const,
          });
        });

        previousRevenue.forEach((prev) => {
          if (comparisonMap.has(prev.revenueType)) {
            const entry = comparisonMap.get(prev.revenueType);
            entry.previousMonth = Number(prev.totalAmount);
          } else {
            comparisonMap.set(prev.revenueType, {
              type: prev.revenueType,
              currentMonth: 0,
              previousMonth: Number(prev.totalAmount),
              change: 0,
              changePercentage: 0,
              trend: "stable" as const,
            });
          }
        });

        // Calculate changes and trends
        const comparison = Array.from(comparisonMap.values()).map((item) => {
          const change = item.currentMonth - item.previousMonth;
          const changePercentage =
            item.previousMonth > 0
              ? (change / item.previousMonth) * 100
              : item.currentMonth > 0
                ? 100
                : 0;

          let trend: "up" | "down" | "stable" = "stable";
          if (changePercentage > 5) trend = "up";
          else if (changePercentage < -5) trend = "down";

          return {
            ...item,
            change: parseFloat(change.toFixed(2)),
            changePercentage: parseFloat(changePercentage.toFixed(1)),
            trend,
          };
        });

        const totalCurrentMonth = comparison.reduce((sum, item) => sum + item.currentMonth, 0);
        const totalPreviousMonth = comparison.reduce((sum, item) => sum + item.previousMonth, 0);
        const totalChange = totalCurrentMonth - totalPreviousMonth;
        const totalChangePercentage =
          totalPreviousMonth > 0 ? (totalChange / totalPreviousMonth) * 100 : 0;

        return {
          currentMonth: input.month,
          previousMonth: input.month === 1 ? 12 : input.month - 1,
          comparison,
          summary: {
            totalCurrentMonth,
            totalPreviousMonth,
            totalChange: parseFloat(totalChange.toFixed(2)),
            totalChangePercentage: parseFloat(totalChangePercentage.toFixed(1)),
          },
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch month-over-month revenue",
        });
      }
    }),

  /**
   * Get year-over-year revenue comparison
   */
  getYearOverYearRevenue: protectedProcedure
    .input(z.object({ farmId: z.number(), year: z.number() }))
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        const currentYearStart = new Date(input.year, 0, 1);
        const currentYearEnd = new Date(input.year, 11, 31);
        const previousYearStart = new Date(input.year - 1, 0, 1);
        const previousYearEnd = new Date(input.year - 1, 11, 31);

        // Get current year revenue by type
        const currentYearRevenue = await db
          .select({
            revenueType: revenue.revenueType,
            totalAmount: sql<number>`COALESCE(SUM(${revenue.amount}), 0)`,
          })
          .from(revenue)
          .where(
            and(
              eq(revenue.farmId, input.farmId),
              gte(revenue.revenueDate, currentYearStart),
              lte(revenue.revenueDate, currentYearEnd)
            )
          )
          .groupBy(revenue.revenueType);

        // Get previous year revenue by type
        const previousYearRevenue = await db
          .select({
            revenueType: revenue.revenueType,
            totalAmount: sql<number>`COALESCE(SUM(${revenue.amount}), 0)`,
          })
          .from(revenue)
          .where(
            and(
              eq(revenue.farmId, input.farmId),
              gte(revenue.revenueDate, previousYearStart),
              lte(revenue.revenueDate, previousYearEnd)
            )
          )
          .groupBy(revenue.revenueType);

        // Create comparison
        const comparisonMap = new Map();

        currentYearRevenue.forEach((curr) => {
          comparisonMap.set(curr.revenueType, {
            type: curr.revenueType,
            currentYear: Number(curr.totalAmount),
            previousYear: 0,
          });
        });

        previousYearRevenue.forEach((prev) => {
          if (comparisonMap.has(prev.revenueType)) {
            const entry = comparisonMap.get(prev.revenueType);
            entry.previousYear = Number(prev.totalAmount);
          } else {
            comparisonMap.set(prev.revenueType, {
              type: prev.revenueType,
              currentYear: 0,
              previousYear: Number(prev.totalAmount),
            });
          }
        });

        const comparison = Array.from(comparisonMap.values()).map((item) => {
          const change = item.currentYear - item.previousYear;
          const changePercentage =
            item.previousYear > 0
              ? (change / item.previousYear) * 100
              : item.currentYear > 0
                ? 100
                : 0;

          let trend: "up" | "down" | "stable" = "stable";
          if (changePercentage > 5) trend = "up";
          else if (changePercentage < -5) trend = "down";

          return {
            ...item,
            change: parseFloat(change.toFixed(2)),
            changePercentage: parseFloat(changePercentage.toFixed(1)),
            trend,
          };
        });

        const totalCurrentYear = comparison.reduce((sum, item) => sum + item.currentYear, 0);
        const totalPreviousYear = comparison.reduce((sum, item) => sum + item.previousYear, 0);
        const totalChange = totalCurrentYear - totalPreviousYear;
        const totalChangePercentage =
          totalPreviousYear > 0 ? (totalChange / totalPreviousYear) * 100 : 0;

        return {
          currentYear: input.year,
          previousYear: input.year - 1,
          comparison,
          summary: {
            totalCurrentYear,
            totalPreviousYear,
            totalChange: parseFloat(totalChange.toFixed(2)),
            totalChangePercentage: parseFloat(totalChangePercentage.toFixed(1)),
          },
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch year-over-year revenue",
        });
      }
    }),
});
