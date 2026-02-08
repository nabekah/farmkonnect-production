import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { and, eq } from "drizzle-orm";
import { expenses, revenue, farms } from "../../drizzle/schema";

// Regional benchmarks for Ghana (cost-per-hectare averages)
const GHANA_REGIONAL_BENCHMARKS: Record<string, Record<string, number>> = {
  "Greater Accra": {
    feed: 1200,
    medication: 150,
    labor: 800,
    equipment: 300,
    utilities: 200,
    transport: 250,
  },
  Ashanti: {
    feed: 1100,
    medication: 140,
    labor: 750,
    equipment: 280,
    utilities: 180,
    transport: 230,
  },
  "Eastern Region": {
    feed: 1050,
    medication: 130,
    labor: 700,
    equipment: 260,
    utilities: 170,
    transport: 210,
  },
  "Western Region": {
    feed: 1150,
    medication: 145,
    labor: 780,
    equipment: 290,
    utilities: 190,
    transport: 240,
  },
  "Northern Region": {
    feed: 950,
    medication: 120,
    labor: 650,
    equipment: 240,
    utilities: 150,
    transport: 190,
  },
  "Upper East Region": {
    feed: 900,
    medication: 110,
    labor: 600,
    equipment: 220,
    utilities: 140,
    transport: 170,
  },
  "Upper West Region": {
    feed: 880,
    medication: 105,
    labor: 580,
    equipment: 210,
    utilities: 130,
    transport: 160,
  },
  Volta: {
    feed: 1000,
    medication: 125,
    labor: 680,
    equipment: 250,
    utilities: 160,
    transport: 200,
  },
  "Central Region": {
    feed: 1080,
    medication: 135,
    labor: 720,
    equipment: 270,
    utilities: 175,
    transport: 220,
  },
  Bono: {
    feed: 1020,
    medication: 128,
    labor: 690,
    equipment: 260,
    utilities: 165,
    transport: 205,
  },
};

export const farmAnalytics = router({
  /**
   * Calculate cost-per-hectare for a farm
   */
  calculateCostPerHectare: protectedProcedure
    .input(
      z.object({
        farmId: z.string(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      const farmId = parseInt(input.farmId);

      // Get farm details
      const farmRecords = await db
        .select()
        .from(farms)
        .where(eq(farms.id, farmId));

      if (!farmRecords || farmRecords.length === 0) {
        return {
          error: "Farm not found",
          costPerHectare: 0,
          totalExpenses: 0,
          farmSize: 0,
        };
      }

      const farm = farmRecords[0];
      const farmSize = parseFloat(farm.sizeHectares?.toString() || "0");

      if (farmSize === 0) {
        return {
          error: "Farm size not specified",
          costPerHectare: 0,
          totalExpenses: 0,
          farmSize: 0,
        };
      }

      // Get expenses
      let expenseQuery = db.select().from(expenses).where(eq(expenses.farmId, farmId));

      if (input.startDate && input.endDate) {
        expenseQuery = db
          .select()
          .from(expenses)
          .where(
            and(
              eq(expenses.farmId, farmId)
            )
          );
      }

      const expenseRecords = await expenseQuery;

      const totalExpenses = expenseRecords.reduce(
        (sum, exp) => sum + parseFloat(exp.amount.toString()),
        0
      );

      const costPerHectare = totalExpenses / farmSize;

      return {
        farmId,
        farmName: farm.name,
        farmSize,
        totalExpenses: parseFloat(totalExpenses.toFixed(2)),
        costPerHectare: parseFloat(costPerHectare.toFixed(2)),
      };
    }),

  /**
   * Compare farm's cost-per-hectare against regional benchmark
   */
  compareWithRegionalBenchmark: protectedProcedure
    .input(
      z.object({
        farmId: z.string(),
        region: z.string(),
        category: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      const farmId = parseInt(input.farmId);

      // Get farm
      const farmRecords = await db
        .select()
        .from(farms)
        .where(eq(farms.id, farmId));

      if (!farmRecords || farmRecords.length === 0) {
        return { error: "Farm not found" };
      }

      const farm = farmRecords[0];
      const farmSize = parseFloat(farm.sizeHectares?.toString() || "1");

      // Get regional benchmark
      const benchmark = GHANA_REGIONAL_BENCHMARKS[input.region];
      if (!benchmark) {
        return { error: "Region not found in benchmarks" };
      }

      // Get farm expenses
      let expenseRecords = await db
        .select()
        .from(expenses)
        .where(eq(expenses.farmId, farmId));

      if (input.category) {
        expenseRecords = expenseRecords.filter((e) => e.category === input.category);
      }

      const farmExpenses = expenseRecords.reduce(
        (sum, exp) => sum + parseFloat(exp.amount.toString()),
        0
      );

      const farmCostPerHectare = farmExpenses / farmSize;

      // Calculate benchmark total
      const benchmarkTotal = Object.values(benchmark).reduce((a, b) => a + b, 0);

      // Compare
      const difference = farmCostPerHectare - benchmarkTotal;
      const percentDifference = (difference / benchmarkTotal) * 100;

      return {
        farmName: farm.name,
        region: input.region,
        farmCostPerHectare: parseFloat(farmCostPerHectare.toFixed(2)),
        regionalBenchmark: benchmarkTotal,
        difference: parseFloat(difference.toFixed(2)),
        percentDifference: parseFloat(percentDifference.toFixed(1)),
        status:
          percentDifference < -10
            ? "excellent"
            : percentDifference < 0
              ? "good"
              : percentDifference < 10
                ? "fair"
                : "needs_improvement",
        message:
          percentDifference < 0
            ? `Your farm is ${Math.abs(percentDifference).toFixed(1)}% more efficient than regional average`
            : `Your farm is ${percentDifference.toFixed(1)}% less efficient than regional average`,
      };
    }),

  /**
   * Get efficiency metrics for a farm
   */
  getEfficiencyMetrics: protectedProcedure
    .input(
      z.object({
        farmId: z.string(),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      const farmId = parseInt(input.farmId);

      // Get expenses and revenue
      const expenseRecords = await db
        .select()
        .from(expenses)
        .where(eq(expenses.farmId, farmId));

      const revenueRecords = await db
        .select()
        .from(revenue)
        .where(eq(revenue.farmId, farmId));

      const totalExpenses = expenseRecords.reduce(
        (sum, exp) => sum + parseFloat(exp.amount.toString()),
        0
      );

      const totalRevenue = revenueRecords.reduce(
        (sum, rev) => sum + parseFloat(rev.amount.toString()),
        0
      );

      const profit = totalRevenue - totalExpenses;
      const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

      // Expense breakdown
      const expenseByCategory: Record<string, number> = {};
      expenseRecords.forEach((exp) => {
        const cat = exp.category;
        expenseByCategory[cat] =
          (expenseByCategory[cat] || 0) + parseFloat(exp.amount.toString());
      });

      // Revenue breakdown
      const revenueByType: Record<string, number> = {};
      revenueRecords.forEach((rev) => {
        const type = rev.revenueType;
        revenueByType[type] =
          (revenueByType[type] || 0) + parseFloat(rev.amount.toString());
      });

      // Calculate efficiency score (0-100)
      let efficiencyScore = 50; // baseline
      if (profitMargin > 30) efficiencyScore = 90;
      else if (profitMargin > 20) efficiencyScore = 80;
      else if (profitMargin > 10) efficiencyScore = 70;
      else if (profitMargin > 0) efficiencyScore = 60;
      else efficiencyScore = 30;

      return {
        farmId,
        totalExpenses: parseFloat(totalExpenses.toFixed(2)),
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        profit: parseFloat(profit.toFixed(2)),
        profitMargin: parseFloat(profitMargin.toFixed(1)),
        efficiencyScore,
        expenseBreakdown: Object.fromEntries(
          Object.entries(expenseByCategory).map(([cat, amount]) => [
            cat,
            parseFloat(amount.toFixed(2)),
          ])
        ),
        revenueBreakdown: Object.fromEntries(
          Object.entries(revenueByType).map(([type, amount]) => [
            type,
            parseFloat(amount.toFixed(2)),
          ])
        ),
        topExpenseCategory: Object.entries(expenseByCategory).sort(
          ([, a], [, b]) => b - a
        )[0]?.[0],
        topRevenueSource: Object.entries(revenueByType).sort(
          ([, a], [, b]) => b - a
        )[0]?.[0],
      };
    }),

  /**
   * Get farm comparison with similar farms
   */
  getFarmComparison: protectedProcedure
    .input(
      z.object({
        farmId: z.string(),
        metric: z.enum(["costPerHectare", "profitMargin", "efficiency"]).default("profitMargin"),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      const farmId = parseInt(input.farmId);

      // Get current farm
      const currentFarmRecords = await db
        .select()
        .from(farms)
        .where(eq(farms.id, farmId));

      if (!currentFarmRecords || currentFarmRecords.length === 0) {
        return { error: "Farm not found" };
      }

      const currentFarm = currentFarmRecords[0];

      // Get all farms for comparison
      const allFarms = await db.select().from(farms);

      // Calculate metrics for each farm
      const farmMetrics = [];

      for (const farm of allFarms) {
        const farmExpenses = await db
          .select()
          .from(expenses)
          .where(eq(expenses.farmId, farm.id));

        const farmRevenue = await db
          .select()
          .from(revenue)
          .where(eq(revenue.farmId, farm.id));

        const totalExp = farmExpenses.reduce(
          (sum, exp) => sum + parseFloat(exp.amount.toString()),
          0
        );

        const totalRev = farmRevenue.reduce(
          (sum, rev) => sum + parseFloat(rev.amount.toString()),
          0
        );

        const profit = totalRev - totalExp;
        const profitMargin = totalRev > 0 ? (profit / totalRev) * 100 : 0;
        const farmSize = parseFloat(farm.sizeHectares?.toString() || "1");
        const costPerHectare = totalExp / farmSize;

        farmMetrics.push({
          farmId: farm.id,
          farmName: farm.name,
          profitMargin: parseFloat(profitMargin.toFixed(1)),
          costPerHectare: parseFloat(costPerHectare.toFixed(2)),
          efficiency: profitMargin > 0 ? 50 + profitMargin / 2 : 30,
        });
      }

      // Sort by selected metric
      const sortKey = input.metric === "costPerHectare" ? "costPerHectare" : "profitMargin";
      farmMetrics.sort((a, b) => {
        if (input.metric === "costPerHectare") {
          return a.costPerHectare - b.costPerHectare;
        }
        return b[sortKey] - a[sortKey];
      });

      // Find current farm rank
      const currentFarmMetric = farmMetrics.find((f) => f.farmId === farmId);
      const rank = farmMetrics.findIndex((f) => f.farmId === farmId) + 1;

      return {
        currentFarm: currentFarmMetric,
        rank,
        totalFarms: farmMetrics.length,
        topPerformers: farmMetrics.slice(0, 3),
        allFarms: farmMetrics,
        metric: input.metric,
      };
    }),

  /**
   * Get recommendations based on farm analytics
   */
  getRecommendations: protectedProcedure
    .input(
      z.object({
        farmId: z.string(),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      const farmId = parseInt(input.farmId);

      // Get farm metrics
      const expenseRecords = await db
        .select()
        .from(expenses)
        .where(eq(expenses.farmId, farmId));

      const revenueRecords = await db
        .select()
        .from(revenue)
        .where(eq(revenue.farmId, farmId));

      const totalExpenses = expenseRecords.reduce(
        (sum, exp) => sum + parseFloat(exp.amount.toString()),
        0
      );

      const totalRevenue = revenueRecords.reduce(
        (sum, rev) => sum + parseFloat(rev.amount.toString()),
        0
      );

      const profit = totalRevenue - totalExpenses;
      const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

      // Expense breakdown
      const expenseByCategory: Record<string, number> = {};
      expenseRecords.forEach((exp) => {
        const cat = exp.category;
        expenseByCategory[cat] =
          (expenseByCategory[cat] || 0) + parseFloat(exp.amount.toString());
      });

      const recommendations = [];

      // Analyze expenses
      if (totalExpenses > 0) {
        const feedPercent = (expenseByCategory.feed || 0) / totalExpenses * 100;
        if (feedPercent > 40) {
          recommendations.push({
            priority: "high",
            category: "feed",
            recommendation: "Feed costs are high. Consider bulk purchasing or alternative feed sources",
            savings: "10-15%",
          });
        }

        const laborPercent = (expenseByCategory.labor || 0) / totalExpenses * 100;
        if (laborPercent > 30) {
          recommendations.push({
            priority: "high",
            category: "labor",
            recommendation: "Labor costs are high. Consider automation or efficiency improvements",
            savings: "5-10%",
          });
        }

        const medicationPercent = (expenseByCategory.medication || 0) / totalExpenses * 100;
        if (medicationPercent > 15) {
          recommendations.push({
            priority: "medium",
            category: "medication",
            recommendation: "Medication costs are elevated. Focus on preventive health measures",
            savings: "5-8%",
          });
        }
      }

      // Analyze profitability
      if (profitMargin < 10) {
        recommendations.push({
          priority: "critical",
          category: "profitability",
          recommendation: "Profit margin is low. Review all expenses and consider price increases",
          savings: "Improve margin by 5-10%",
        });
      }

      // Analyze revenue
      if (revenueRecords.length < 5) {
        recommendations.push({
          priority: "medium",
          category: "revenue",
          recommendation: "Limited revenue streams. Consider diversifying products/services",
          savings: "Increase revenue by 20-30%",
        });
      }

      return {
        farmId,
        recommendations: recommendations.sort((a, b) => {
          const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
          return priorityOrder[a.priority as keyof typeof priorityOrder] -
                 priorityOrder[b.priority as keyof typeof priorityOrder];
        }),
      };
    }),
});
