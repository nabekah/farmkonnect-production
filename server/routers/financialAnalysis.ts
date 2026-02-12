import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { and, eq, gte, lte, sum, desc, asc, inArray } from "drizzle-orm";

/**
 * Financial Analysis & Cost Tracking Router
 * Handles expense tracking, revenue tracking, cost calculations, and profitability analysis
 */

export const financialAnalysisRouter = router({
  /**
   * EXPENSE MANAGEMENT PROCEDURES
   */

  /**
   * Create a new expense record
   */
  createExpense: protectedProcedure
    .input(
      z.object({
        farmId: z.string(),
        categoryName: z.string(),
        categoryType: z.enum([
          "feed",
          "medication",
          "labor",
          "equipment",
          "utilities",
          "other",
        ]),
        expenseDate: z.date(),
        description: z.string(),
        amount: z.number().positive(),
        quantity: z.number().optional(),
        unit: z.string().optional(),
        relatedAnimalId: z.string().optional(),
        relatedCropId: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const farmId = parseInt(input.farmId);
      const expenseDateStr = input.expenseDate instanceof Date
        ? input.expenseDate.toISOString().split("T")[0]
        : input.expenseDate.toString();

      // For now, return mock data as we don't have the actual schema yet
      return {
        id: Math.floor(Math.random() * 10000),
        farmId,
        categoryName: input.categoryName,
        categoryType: input.categoryType,
        expenseDate: expenseDateStr,
        description: input.description,
        amount: input.amount,
        quantity: input.quantity || 1,
        unit: input.unit || "unit",
        relatedAnimalId: input.relatedAnimalId,
        relatedCropId: input.relatedCropId,
        notes: input.notes,
        createdAt: new Date(),
      };
    }),

  /**
   * Get all expenses for a farm with filters
   */
  getExpenses: protectedProcedure
    .input(
      z.object({
        farmId: z.string(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        categoryType: z
          .enum(["feed", "medication", "labor", "equipment", "utilities", "other"])
          .optional(),
        animalId: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      // Mock implementation - returns sample data
      const expenses = [
        {
          id: 1,
          farmId: parseInt(input.farmId),
          categoryName: "Feed",
          categoryType: "feed",
          expenseDate: "2026-02-01",
          description: "Cattle feed purchase",
          amount: 500,
          quantity: 100,
          unit: "kg",
          relatedAnimalId: "1",
          notes: "Monthly feed supply",
          createdAt: new Date("2026-02-01"),
        },
        {
          id: 2,
          farmId: parseInt(input.farmId),
          categoryName: "Medication",
          categoryType: "medication",
          expenseDate: "2026-02-05",
          description: "Veterinary treatment",
          amount: 250,
          quantity: 1,
          unit: "treatment",
          relatedAnimalId: "2",
          notes: "Vaccination for herd",
          createdAt: new Date("2026-02-05"),
        },
        {
          id: 3,
          farmId: parseInt(input.farmId),
          categoryName: "Labor",
          categoryType: "labor",
          expenseDate: "2026-02-10",
          description: "Worker wages",
          amount: 800,
          quantity: 1,
          unit: "month",
          notes: "Monthly salary",
          createdAt: new Date("2026-02-10"),
        },
      ];

      // Filter by category if provided
      if (input.categoryType) {
        return expenses.filter((e) => e.categoryType === input.categoryType);
      }

      return expenses;
    }),

  /**
   * Get expense summary for a farm
   */
  getExpenseSummary: protectedProcedure
    .input(
      z.object({
        farmId: z.string(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      // Mock implementation
      const totalExpenses = 1550;
      const byCategory = {
        feed: 500,
        medication: 250,
        labor: 800,
        equipment: 0,
        utilities: 0,
        other: 0,
      };

      return {
        totalExpenses,
        byCategory,
        expenseCount: 3,
        averageExpense: totalExpenses / 3,
      };
    }),

  /**
   * REVENUE MANAGEMENT PROCEDURES
   */

  /**
   * Create a new revenue record
   */
  createRevenue: protectedProcedure
    .input(
      z.object({
        farmId: z.string(),
        revenueType: z.string(),
        revenueDate: z.date(),
        description: z.string(),
        amount: z.number().positive(),
        quantity: z.number().optional(),
        unit: z.string().optional(),
        relatedAnimalId: z.string().optional(),
        relatedCropId: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const farmId = parseInt(input.farmId);
      const revenueDateStr = input.revenueDate instanceof Date
        ? input.revenueDate.toISOString().split("T")[0]
        : input.revenueDate.toString();

      return {
        id: Math.floor(Math.random() * 10000),
        farmId,
        revenueType: input.revenueType,
        revenueDate: revenueDateStr,
        description: input.description,
        amount: input.amount,
        quantity: input.quantity || 1,
        unit: input.unit || "unit",
        relatedAnimalId: input.relatedAnimalId,
        relatedCropId: input.relatedCropId,
        notes: input.notes,
        createdAt: new Date(),
      };
    }),

  /**
   * Get all revenue for a farm with filters
   */
  getRevenue: protectedProcedure
    .input(
      z.object({
        farmId: z.string(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        revenueType: z.string().optional(),
        animalId: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      // Mock implementation
      const revenue = [
        {
          id: 1,
          farmId: parseInt(input.farmId),
          revenueType: "Milk Sales",
          revenueDate: "2026-02-01",
          description: "Milk production sale",
          amount: 1200,
          quantity: 600,
          unit: "liters",
          relatedAnimalId: "1",
          notes: "Weekly milk sale",
          createdAt: new Date("2026-02-01"),
        },
        {
          id: 2,
          farmId: parseInt(input.farmId),
          revenueType: "Animal Sale",
          revenueDate: "2026-02-10",
          description: "Cattle sale",
          amount: 2500,
          quantity: 1,
          unit: "animal",
          relatedAnimalId: "3",
          notes: "Sold mature cattle",
          createdAt: new Date("2026-02-10"),
        },
      ];

      if (input.revenueType) {
        return revenue.filter((r) => r.revenueType === input.revenueType);
      }

      return revenue;
    }),

  /**
   * Get revenue summary for a farm
   */
  getRevenueSummary: protectedProcedure
    .input(
      z.object({
        farmId: z.string(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      // Mock implementation
      const totalRevenue = 3700;
      const byType = {
        "Milk Sales": 1200,
        "Animal Sale": 2500,
        "Egg Sales": 0,
        "Crop Sales": 0,
      };

      return {
        totalRevenue,
        byType,
        revenueCount: 2,
        averageRevenue: totalRevenue / 2,
      };
    }),

  /**
   * COST ANALYSIS PROCEDURES
   */

  /**
   * Calculate cost-per-animal
   */
  calculateCostPerAnimal: protectedProcedure
    .input(
      z.object({
        farmId: z.string(),
        animalId: z.string(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      // Mock implementation
      const totalExpenses = 1550;
      const totalRevenue = 3700;
      const profit = totalRevenue - totalExpenses;
      const profitMargin = (profit / totalRevenue) * 100;

      return {
        animalId: input.animalId,
        costPerAnimal: totalExpenses,
        totalExpenses,
        totalRevenue,
        profit,
        profitMargin: parseFloat(profitMargin.toFixed(2)),
        roi: parseFloat(((profit / totalExpenses) * 100).toFixed(2)),
      };
    }),

  /**
   * Calculate cost-per-hectare
   */
  calculateCostPerHectare: protectedProcedure
    .input(
      z.object({
        farmId: z.string(),
        cropId: z.string(),
        hectares: z.number().positive(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      // Mock implementation
      const totalExpenses = 2000;
      const totalRevenue = 5000;
      const costPerHectare = totalExpenses / input.hectares;
      const revenuePerHectare = totalRevenue / input.hectares;
      const profit = totalRevenue - totalExpenses;
      const profitMargin = (profit / totalRevenue) * 100;

      return {
        cropId: input.cropId,
        hectares: input.hectares,
        costPerHectare: parseFloat(costPerHectare.toFixed(2)),
        revenuePerHectare: parseFloat(revenuePerHectare.toFixed(2)),
        totalExpenses,
        totalRevenue,
        profit,
        profitMargin: parseFloat(profitMargin.toFixed(2)),
        roi: parseFloat(((profit / totalExpenses) * 100).toFixed(2)),
      };
    }),

  /**
   * Get profitability analysis
   */
  getProfitabilityAnalysis: protectedProcedure
    .input(
      z.object({
        farmId: z.string(),
        groupBy: z.enum(["animal", "crop", "category", "month"]),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      // Mock implementation
      if (input.groupBy === "animal") {
        return [
          {
            id: "1",
            name: "Cattle Herd",
            totalExpenses: 1000,
            totalRevenue: 2500,
            profit: 1500,
            profitMargin: 60,
            roi: 150,
          },
          {
            id: "2",
            name: "Dairy Cows",
            totalExpenses: 800,
            totalRevenue: 2000,
            profit: 1200,
            profitMargin: 60,
            roi: 150,
          },
        ];
      } else if (input.groupBy === "crop") {
        return [
          {
            id: "1",
            name: "Corn",
            hectares: 10,
            totalExpenses: 2000,
            totalRevenue: 5000,
            profit: 3000,
            profitMargin: 60,
            roi: 150,
            costPerHectare: 200,
          },
          {
            id: "2",
            name: "Wheat",
            hectares: 8,
            totalExpenses: 1600,
            totalRevenue: 4000,
            profit: 2400,
            profitMargin: 60,
            roi: 150,
            costPerHectare: 200,
          },
        ];
      } else if (input.groupBy === "category") {
        return [
          {
            category: "Feed",
            totalExpenses: 500,
            percentage: 32.3,
          },
          {
            category: "Labor",
            totalExpenses: 800,
            percentage: 51.6,
          },
          {
            category: "Medication",
            totalExpenses: 250,
            percentage: 16.1,
          },
        ];
      } else {
        // By month
        return [
          {
            month: "January",
            expenses: 1200,
            revenue: 2800,
            profit: 1600,
          },
          {
            month: "February",
            expenses: 1350,
            revenue: 2900,
            profit: 1550,
          },
        ];
      }
    }),

  /**
   * FINANCIAL DASHBOARD PROCEDURES
   */

  /**
   * Get financial overview/dashboard data
   */
  getFinancialOverview: protectedProcedure
    .input(
      z.object({
        farmId: z.string(),
        period: z.enum(["week", "month", "quarter", "year"]),
      })
    )
    .query(async ({ input, ctx }) => {
      // Mock implementation
      const totalIncome = 3700;
      const totalExpenses = 1550;
      const profit = totalIncome - totalExpenses;
      const profitMargin = (profit / totalIncome) * 100;
      const roi = (profit / totalExpenses) * 100;

      return {
        period: input.period,
        totalIncome,
        totalExpenses,
        profit,
        profitMargin: parseFloat(profitMargin.toFixed(2)),
        roi: parseFloat(roi.toFixed(2)),
        transactionCount: 5,
        trends: {
          incomeChange: 5.2,
          expenseChange: -2.1,
          profitChange: 8.3,
        },
      };
    }),

  /**
   * Get financial KPIs
   */
  getFinancialKPIs: protectedProcedure
    .input(z.object({ farmId: z.string() }))
    .query(async ({ input, ctx }) => {
      // Mock implementation
      return {
        farmId: input.farmId,
        kpis: [
          {
            name: "Total Revenue",
            value: 3700,
            currency: "GHS",
            trend: 5.2,
            period: "This Month",
          },
          {
            name: "Total Expenses",
            value: 1550,
            currency: "GHS",
            trend: -2.1,
            period: "This Month",
          },
          {
            name: "Net Profit",
            value: 2150,
            currency: "GHS",
            trend: 8.3,
            period: "This Month",
          },
          {
            name: "Profit Margin",
            value: 58.11,
            unit: "%",
            trend: 3.1,
            period: "This Month",
          },
          {
            name: "ROI",
            value: 138.71,
            unit: "%",
            trend: 10.5,
            period: "This Month",
          },
          {
            name: "Break-even Point",
            value: 1550,
            currency: "GHS",
            period: "Monthly",
          },
        ],
      };
    }),

  /**
   * Get expense breakdown chart data
   */
  getExpenseBreakdown: protectedProcedure
    .input(
      z.object({
        farmId: z.string(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      // Mock implementation
      return [
        {
          category: "Labor",
          amount: 800,
          percentage: 51.6,
          color: "#3b82f6",
        },
        {
          category: "Feed",
          amount: 500,
          percentage: 32.3,
          color: "#10b981",
        },
        {
          category: "Medication",
          amount: 250,
          percentage: 16.1,
          color: "#f59e0b",
        },
      ];
    }),

  /**
   * Get revenue breakdown chart data
   */
  getRevenueBreakdown: protectedProcedure
    .input(
      z.object({
        farmId: z.string(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      // Mock implementation
      return [
        {
          type: "Milk Sales",
          amount: 1200,
          percentage: 32.4,
          color: "#3b82f6",
        },
        {
          type: "Animal Sales",
          amount: 2500,
          percentage: 67.6,
          color: "#10b981",
        },
      ];
    }),

  /**
   * Get income vs expense trend
   */
  getIncomeVsExpenseTrend: protectedProcedure
    .input(
      z.object({
        farmId: z.string(),
        period: z.enum(["week", "month", "quarter", "year"]),
      })
    )
    .query(async ({ input, ctx }) => {
      // Mock implementation
      if (input.period === "month") {
        return [
          {
            month: "January",
            income: 2800,
            expenses: 1200,
            profit: 1600,
          },
          {
            month: "February",
            income: 2900,
            expenses: 1350,
            profit: 1550,
          },
          {
            month: "March",
            income: 3100,
            expenses: 1400,
            profit: 1700,
          },
        ];
      }
      return [];
    }),
});
