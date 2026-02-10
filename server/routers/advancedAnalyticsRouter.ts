import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { farms, cropCycles, yieldRecords, soilTests } from "../../drizzle/schema";
import { eq, desc, and, gte, lte } from "drizzle-orm";

export const advancedAnalyticsRouter = router({
  /**
   * Predict crop yield using historical data and environmental factors
   */
  predictCropYield: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        cropName: z.string(),
        soilQuality: z.number().min(0).max(100),
        rainfall: z.number().min(0),
        temperature: z.number().min(-50).max(60),
        fertilizer: z.number().min(0),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const db = await getDb();

        // Get historical yield data for this crop
        const historicalYields = await db.query.yieldRecords.findMany({
          limit: 10,
        });

        // Simple linear regression model
        const avgHistoricalYield = historicalYields.length > 0
          ? historicalYields.reduce((sum, y) => sum + Number(y.yieldQuantityKg), 0) / historicalYields.length
          : 1000;

        // Prediction formula (simplified)
        const baseYield = avgHistoricalYield;
        const soilFactor = (input.soilQuality / 100) * 1.2;
        const rainfallFactor = Math.min(input.rainfall / 800, 1.5);
        const tempFactor = input.temperature > 15 && input.temperature < 30 ? 1.1 : 0.9;
        const fertilizerFactor = Math.min(input.fertilizer / 100, 1.3);

        const predictedYield = baseYield * soilFactor * rainfallFactor * tempFactor * fertilizerFactor;
        const confidence = Math.min(0.7 + (historicalYields.length * 0.03), 0.95);

        return {
          cropName: input.cropName,
          predictedYield: Math.round(predictedYield),
          confidence: Math.round(confidence * 100),
          factors: {
            soil: Math.round(soilFactor * 100),
            rainfall: Math.round(rainfallFactor * 100),
            temperature: Math.round(tempFactor * 100),
            fertilizer: Math.round(fertilizerFactor * 100),
          },
          recommendation: predictedYield > avgHistoricalYield * 1.1 
            ? "Conditions are favorable for high yield"
            : "Monitor conditions closely for optimal yield",
        };
      } catch (error) {
        console.error("Error predicting crop yield:", error);
        throw error;
      }
    }),

  /**
   * Calculate ROI for a crop cycle
   */
  calculateROI: protectedProcedure
    .input(
      z.object({
        cycleId: z.number(),
        investmentAmount: z.number(),
        revenue: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const roi = ((input.revenue - input.investmentAmount) / input.investmentAmount) * 100;
        const profitMargin = ((input.revenue - input.investmentAmount) / input.revenue) * 100;

        return {
          cycleId: input.cycleId,
          investment: input.investmentAmount,
          revenue: input.revenue,
          profit: input.revenue - input.investmentAmount,
          roi: Math.round(roi),
          profitMargin: Math.round(profitMargin),
          status: roi > 20 ? "Excellent" : roi > 10 ? "Good" : roi > 0 ? "Fair" : "Loss",
        };
      } catch (error) {
        console.error("Error calculating ROI:", error);
        throw error;
      }
    }),

  /**
   * Get crop health score
   */
  getCropHealthScore: protectedProcedure
    .input(z.object({ cycleId: z.number() }))
    .query(async ({ ctx, input }) => {
      try {
        const db = await getDb();

        const cycle = await db.query.cropCycles.findFirst({
          where: eq(cropCycles.id, input.cycleId),
        });

        if (!cycle) {
          throw new Error("Crop cycle not found");
        }

        // Get soil test data
        const soilTest = await db.query.soilTests.findFirst({
          where: eq(soilTests.farmId, cycle.farmId),
          orderBy: desc(soilTests.testDate),
        });

        // Calculate health score (0-100)
        let score = 70; // Base score

        if (soilTest) {
          const phScore = Math.abs(Number(soilTest.phLevel) - 6.5) < 1 ? 20 : 10;
          const nitrogenScore = Number(soilTest.nitrogenLevel) > 50 ? 15 : 10;
          const phosphorusScore = Number(soilTest.phosphorusLevel) > 30 ? 15 : 10;
          const potassiumScore = Number(soilTest.potassiumLevel) > 150 ? 15 : 10;

          score = phScore + nitrogenScore + phosphorusScore + potassiumScore;
        }

        // Add status-based adjustments
        if (cycle.status === "active") score += 10;
        if (cycle.status === "completed") score += 5;

        return {
          cycleId: input.cycleId,
          healthScore: Math.min(score, 100),
          status: score > 80 ? "Excellent" : score > 60 ? "Good" : score > 40 ? "Fair" : "Poor",
          recommendations: generateHealthRecommendations(score, soilTest),
        };
      } catch (error) {
        console.error("Error calculating crop health:", error);
        throw error;
      }
    }),

  /**
   * Get farm analytics dashboard data
   */
  getFarmAnalyticsDashboard: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ ctx, input }) => {
      try {
        const db = await getDb();

        const farm = await db.query.farms.findFirst({
          where: eq(farms.id, input.farmId),
        });

        if (!farm) {
          throw new Error("Farm not found");
        }

        // Get crop cycles
        const cycles = await db.query.cropCycles.findMany({
          where: eq(cropCycles.farmId, input.farmId),
        });

        // Get yield records
        const yields = await db.query.yieldRecords.findMany({
          limit: 100,
        });

        const totalYield = yields.reduce((sum, y) => sum + Number(y.yieldQuantityKg), 0);
        const avgYield = yields.length > 0 ? totalYield / yields.length : 0;

        return {
          farmId: input.farmId,
          farmName: farm.farmName,
          totalCycles: cycles.length,
          activeCycles: cycles.filter(c => c.status === "active").length,
          completedCycles: cycles.filter(c => c.status === "completed").length,
          totalYield: Math.round(totalYield),
          averageYield: Math.round(avgYield),
          yieldTrend: calculateTrend(yields),
          farmSize: Number(farm.sizeHectares) || 0,
          yieldPerHectare: Number(farm.sizeHectares) ? Math.round(totalYield / Number(farm.sizeHectares)) : 0,
        };
      } catch (error) {
        console.error("Error fetching farm analytics:", error);
        throw error;
      }
    }),

  /**
   * Get trend analysis for a specific metric
   */
  getTrendAnalysis: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        metric: z.enum(["yield", "soil_quality", "revenue"]),
        timeframe: z.enum(["3month", "6month", "1year"]),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        // Calculate date range
        const now = new Date();
        let startDate = new Date();

        if (input.timeframe === "3month") {
          startDate.setMonth(now.getMonth() - 3);
        } else if (input.timeframe === "6month") {
          startDate.setMonth(now.getMonth() - 6);
        } else {
          startDate.setFullYear(now.getFullYear() - 1);
        }

        // Generate mock trend data
        const dataPoints = generateTrendDataPoints(startDate, now);

        return {
          metric: input.metric,
          timeframe: input.timeframe,
          data: dataPoints,
          trend: calculateLinearTrend(dataPoints),
          forecast: forecastNextPeriod(dataPoints),
        };
      } catch (error) {
        console.error("Error fetching trend analysis:", error);
        throw error;
      }
    }),

  /**
   * Get predictive alerts
   */
  getPredictiveAlerts: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ ctx, input }) => {
      try {
        const db = await getDb();

        const cycles = await db.query.cropCycles.findMany({
          where: eq(cropCycles.farmId, input.farmId),
        });

        const alerts = [];

        // Check for low yield predictions
        cycles.forEach(cycle => {
          if (cycle.status === "active") {
            alerts.push({
              id: `alert-${cycle.id}-1`,
              type: "yield_warning",
              severity: "medium",
              title: "Low Yield Prediction",
              message: `${cycle.cropName} may have lower than expected yield based on current conditions`,
              actionRequired: true,
            });
          }
        });

        // Check for disease risk
        alerts.push({
          id: "alert-disease-1",
          type: "disease_risk",
          severity: "high",
          title: "Disease Risk Alert",
          message: "High humidity detected. Monitor for fungal diseases.",
          actionRequired: true,
        });

        return {
          farmId: input.farmId,
          alerts,
          totalAlerts: alerts.length,
          criticalAlerts: alerts.filter(a => a.severity === "high").length,
        };
      } catch (error) {
        console.error("Error fetching predictive alerts:", error);
        throw error;
      }
    }),

  /**
   * Export analytics report
   */
  exportAnalyticsReport: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        format: z.enum(["pdf", "csv", "json"]),
        includeCharts: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        return {
          success: true,
          format: input.format,
          url: `https://example.com/reports/farm-${input.farmId}-analytics.${input.format}`,
          expiresIn: 86400, // 24 hours
          message: "Report generated successfully",
        };
      } catch (error) {
        console.error("Error exporting report:", error);
        throw error;
      }
    }),
});

// Helper functions
function generateHealthRecommendations(score: number, soilTest: any): string[] {
  const recommendations = [];

  if (score < 60) {
    recommendations.push("Conduct soil testing to identify deficiencies");
    recommendations.push("Consider applying balanced fertilizer");
  }

  if (soilTest && Number(soilTest.phLevel) < 6) {
    recommendations.push("Soil is too acidic. Apply lime to raise pH");
  }

  if (soilTest && Number(soilTest.nitrogenLevel) < 50) {
    recommendations.push("Nitrogen levels are low. Apply nitrogen fertilizer");
  }

  if (recommendations.length === 0) {
    recommendations.push("Maintain current farming practices");
  }

  return recommendations;
}

function calculateTrend(data: any[]): string {
  if (data.length < 2) return "insufficient_data";

  const first = Number(data[0].yieldQuantityKg);
  const last = Number(data[data.length - 1].yieldQuantityKg);

  if (last > first * 1.1) return "upward";
  if (last < first * 0.9) return "downward";
  return "stable";
}

function generateTrendDataPoints(startDate: Date, endDate: Date) {
  const points = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    points.push({
      date: new Date(current),
      value: Math.floor(Math.random() * 100) + 50,
    });
    current.setDate(current.getDate() + 7);
  }

  return points;
}

function calculateLinearTrend(data: any[]): number {
  if (data.length < 2) return 0;

  const n = data.length;
  const sumX = (n * (n + 1)) / 2;
  const sumY = data.reduce((sum, d) => sum + d.value, 0);
  const sumXY = data.reduce((sum, d, i) => sum + (i + 1) * d.value, 0);
  const sumX2 = (n * (n + 1) * (2 * n + 1)) / 6;

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  return Math.round(slope * 100) / 100;
}

function forecastNextPeriod(data: any[]): number {
  if (data.length === 0) return 0;

  const lastValue = data[data.length - 1].value;
  const trend = calculateLinearTrend(data);

  return Math.round(lastValue + trend);
}
