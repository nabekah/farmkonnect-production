import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { eq, and, gte, lte, sum, inArray, sql, desc } from "drizzle-orm";
import {
  expenses,
  revenue,
  animals,
  animalProfitability
} from "../../drizzle/schema";

export const animalProfitabilityRouter = router({
  /**
   * Calculate profitability by animal type for a period
   */
  calculateAnimalProfitability: protectedProcedure
    .input(z.object({
      farmId: z.string(),
      startDate: z.date(),
      endDate: z.date(),
      animalType: z.string().optional() // Filter by specific animal type
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

      // Get animals for the farm
      const animalList = await db
        .select()
        .from(animals)
        .where(eq(animals.farmId, farmId));

      // Group animals by type
      const animalsByType: Record<string, any[]> = {};
      animalList.forEach(animal => {
        const type = animal.breed || animal.species || "Unknown";
        if (!animalsByType[type]) {
          animalsByType[type] = [];
        }
        animalsByType[type].push(animal);
      });

      const period = getPeriodString(input.startDate, input.endDate);
      const profitabilityRecords = [];

      // Calculate profitability for each animal type
      for (const [animalType, typeAnimals] of Object.entries(animalsByType)) {
        if (input.animalType && animalType !== input.animalType) continue;

        const animalIds = typeAnimals.map(a => a.id);

        // Get revenue for this animal type
        const revenueResult = await db
          .select({ total: sum(revenue.amount) })
          .from(revenue)
          .where(
            and(
              eq(revenue.farmId, farmId),
              inArray(revenue.animalId, animalIds),
              gte(revenue.revenueDate, startDateStr),
              lte(revenue.revenueDate, endDateStr)
            )
          );

        // Get expenses for this animal type
        const expenseResult = await db
          .select({ total: sum(expenses.amount) })
          .from(expenses)
          .where(
            and(
              eq(expenses.farmId, farmId),
              inArray(expenses.animalId, animalIds),
              gte(expenses.expenseDate, startDateStr),
              lte(expenses.expenseDate, endDateStr)
            )
          );

        const totalRevenue = Number(revenueResult[0]?.total || 0);
        const totalExpenses = Number(expenseResult[0]?.total || 0);
        const netProfit = totalRevenue - totalExpenses;
        const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
        const revenuePerAnimal = typeAnimals.length > 0 ? totalRevenue / typeAnimals.length : 0;
        const costPerAnimal = typeAnimals.length > 0 ? totalExpenses / typeAnimals.length : 0;
        const roi = totalExpenses > 0 ? (netProfit / totalExpenses) * 100 : 0;

        // Save to database
        const [result] = await db.insert(animalProfitability).values({
          farmId,
          animalTypeId: typeAnimals[0].id, // Use first animal's ID as type reference
          animalType,
          period,
          totalAnimals: typeAnimals.length,
          totalRevenue,
          totalExpenses,
          netProfit,
          profitMargin,
          revenuePerAnimal,
          costPerAnimal,
          roi
        });

        profitabilityRecords.push({
          animalType,
          totalAnimals: typeAnimals.length,
          totalRevenue,
          totalExpenses,
          netProfit,
          profitMargin,
          revenuePerAnimal,
          costPerAnimal,
          roi
        });
      }

      return {
        period,
        records: profitabilityRecords,
        success: true
      };
    }),

  /**
   * Get profitability analysis for a farm
   */
  getProfitabilityAnalysis: protectedProcedure
    .input(z.object({
      farmId: z.string(),
      period: z.string().optional(), // YYYY-MM or YYYY-Q1
      limit: z.number().default(12)
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const farmId = parseInt(input.farmId);
      const conditions = [eq(animalProfitability.farmId, farmId)];

      if (input.period) {
        conditions.push(eq(animalProfitability.period, input.period));
      }

      const results = await db
        .select()
        .from(animalProfitability)
        .where(and(...conditions))
        .orderBy(desc(animalProfitability.period))
        .limit(input.limit);

      return results;
    }),

  /**
   * Get animal type comparison
   */
  getAnimalTypeComparison: protectedProcedure
    .input(z.object({
      farmId: z.string(),
      period: z.string() // YYYY-MM or YYYY-Q1
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const farmId = parseInt(input.farmId);

      const results = await db
        .select()
        .from(animalProfitability)
        .where(
          and(
            eq(animalProfitability.farmId, farmId),
            eq(animalProfitability.period, input.period)
          )
        )
        .orderBy(desc(animalProfitability.netProfit));

      return results;
    }),

  /**
   * Get profitability trends for an animal type
   */
  getAnimalTypeTrends: protectedProcedure
    .input(z.object({
      farmId: z.string(),
      animalType: z.string(),
      periods: z.number().default(12)
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const farmId = parseInt(input.farmId);

      const trends = await db
        .select()
        .from(animalProfitability)
        .where(
          and(
            eq(animalProfitability.farmId, farmId),
            eq(animalProfitability.animalType, input.animalType)
          )
        )
        .orderBy(animalProfitability.period)
        .limit(input.periods);

      // Calculate trend metrics
      if (trends.length < 2) {
        return {
          trends,
          trendAnalysis: {
            profitTrend: "insufficient_data",
            profitChangePercentage: 0,
            avgProfitMargin: trends[0]?.profitMargin || 0,
            bestPeriod: trends[0]?.period || null,
            worstPeriod: trends[0]?.period || null
          }
        };
      }

      const firstProfit = Number(trends[0].netProfit);
      const lastProfit = Number(trends[trends.length - 1].netProfit);
      const profitChangePercentage = firstProfit !== 0 
        ? ((lastProfit - firstProfit) / Math.abs(firstProfit)) * 100
        : 0;

      const avgProfitMargin = trends.reduce((sum, t) => sum + Number(t.profitMargin), 0) / trends.length;
      const bestPeriod = trends.reduce((best, t) => Number(t.netProfit) > Number(best.netProfit) ? t : best);
      const worstPeriod = trends.reduce((worst, t) => Number(t.netProfit) < Number(worst.netProfit) ? t : worst);

      return {
        trends,
        trendAnalysis: {
          profitTrend: profitChangePercentage > 5 ? "improving" : profitChangePercentage < -5 ? "declining" : "stable",
          profitChangePercentage: Math.round(profitChangePercentage * 100) / 100,
          avgProfitMargin: Math.round(avgProfitMargin * 100) / 100,
          bestPeriod: bestPeriod.period,
          worstPeriod: worstPeriod.period
        }
      };
    }),

  /**
   * Get recommendations based on profitability
   */
  getProfitabilityRecommendations: protectedProcedure
    .input(z.object({
      farmId: z.string(),
      period: z.string()
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const farmId = parseInt(input.farmId);

      const analysis = await db
        .select()
        .from(animalProfitability)
        .where(
          and(
            eq(animalProfitability.farmId, farmId),
            eq(animalProfitability.period, input.period)
          )
        )
        .orderBy(desc(animalProfitability.netProfit));

      const recommendations = [];

      if (analysis.length === 0) {
        return { recommendations: ["No data available for this period"] };
      }

      // Sort by profitability
      const mostProfitable = analysis[0];
      const leastProfitable = analysis[analysis.length - 1];

      // Generate recommendations
      if (Number(mostProfitable.profitMargin) > 20) {
        recommendations.push({
          type: "expand",
          animalType: mostProfitable.animalType,
          message: `${mostProfitable.animalType} is highly profitable (${Math.round(Number(mostProfitable.profitMargin))}% margin). Consider expanding this animal type.`,
          priority: "high"
        });
      }

      if (Number(leastProfitable.profitMargin) < 0) {
        recommendations.push({
          type: "reduce",
          animalType: leastProfitable.animalType,
          message: `${leastProfitable.animalType} is operating at a loss. Review costs or consider reducing numbers.`,
          priority: "high"
        });
      }

      if (Number(leastProfitable.costPerAnimal) > Number(mostProfitable.costPerAnimal) * 1.5) {
        recommendations.push({
          type: "optimize_costs",
          animalType: leastProfitable.animalType,
          message: `${leastProfitable.animalType} has high per-animal costs. Look for ways to optimize feeding or healthcare expenses.`,
          priority: "medium"
        });
      }

      // Revenue per animal analysis
      const avgRevenuePerAnimal = analysis.reduce((sum, a) => sum + Number(a.revenuePerAnimal), 0) / analysis.length;
      const lowRevenueAnimals = analysis.filter(a => Number(a.revenuePerAnimal) < avgRevenuePerAnimal * 0.7);

      if (lowRevenueAnimals.length > 0) {
        recommendations.push({
          type: "improve_revenue",
          animalType: lowRevenueAnimals[0].animalType,
          message: `${lowRevenueAnimals[0].animalType} generates below-average revenue per animal. Consider improving product quality or market channels.`,
          priority: "medium"
        });
      }

      return { recommendations };
    })
});

function getPeriodString(startDate: Date, endDate: Date): string {
  const start = startDate instanceof Date ? startDate : new Date(startDate);
  const end = endDate instanceof Date ? endDate : new Date(endDate);
  
  const monthDiff = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  
  if (monthDiff === 0) {
    return start.toISOString().split('T')[0];
  } else if (monthDiff === 2) {
    return `${start.getFullYear()}-Q${Math.floor(start.getMonth() / 3) + 1}`;
  } else if (monthDiff === 11) {
    return start.getFullYear().toString();
  }
  
  return `${start.toISOString().split('T')[0]}_to_${end.toISOString().split('T')[0]}`;
}
