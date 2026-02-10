import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { farms, soilTests, cropCycles, yieldRecords, fertilizerApplications } from "../../drizzle/schema";
import { eq, desc, and, gte } from "drizzle-orm";
import { cropRecommendationEngine, FarmConditions, CropRecommendation } from "../services/cropRecommendationEngine";

export const cropRecommendationRouter = router({
  /**
   * Get farm conditions for crop recommendations
   * Retrieves soil data, climate data, and historical yields
   */
  getFarmConditions: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ ctx, input }) => {
      const database = await getDb();
      try {
        // Get farm data
        const farm = await database.query.farms.findFirst({
          where: eq(farms.id, input.farmId),
        });

        if (!farm) {
          throw new Error("Farm not found");
        }

        // Get latest soil test
        const latestSoilTest = await database.query.soilTests.findFirst({
          where: eq(soilTests.farmId, input.farmId),
          orderBy: desc(soilTests.testDate),
        });

        // Get recent crop cycles for historical data
        const recentCycles = await database.query.cropCycles.findMany({
          where: eq(cropCycles.farmId, input.farmId),
          orderBy: desc(cropCycles.plantingDate),
          limit: 5,
        });

        // Get yield records for recent cycles
        const yieldData = await database.query.yieldRecords.findMany({
          where: recentCycles.length > 0 
            ? { cycleId: { in: recentCycles.map(c => c.id) } }
            : undefined,
        });

        // Get fertilizer applications for recent cycles
        const fertilizerData = await database.query.fertilizerApplications.findMany({
          where: recentCycles.length > 0
            ? { cycleId: { in: recentCycles.map(c => c.id) } }
            : undefined,
        });

        // Calculate average yields by crop
        const yieldByCrop: Record<string, number[]> = {};
        yieldData.forEach(y => {
          const cycle = recentCycles.find(c => c.id === y.cycleId);
          if (cycle) {
            if (!yieldByCrop[cycle.cropName]) {
              yieldByCrop[cycle.cropName] = [];
            }
            yieldByCrop[cycle.cropName].push(Number(y.yieldQuantityKg) / 1000); // Convert to tons
          }
        });

        // Get previous crops
        const previousCrops = recentCycles.map(c => c.cropName).filter(Boolean);

        // Estimate climate data based on location (would be integrated with weather API)
        const estimatedTemperature = 25; // Default, would come from weather API
        const estimatedRainfall = 800; // Default, would come from weather API
        const estimatedHumidity = 65; // Default, would come from weather API

        return {
          farmId: input.farmId,
          farmName: farm.farmName,
          farmSize: Number(farm.sizeHectares) || 1,
          soilType: latestSoilTest ? "loam" : "unknown", // Would be determined from soil test
          soilPH: latestSoilTest ? Number(latestSoilTest.phLevel) : 6.5,
          soilNitrogen: latestSoilTest ? Number(latestSoilTest.nitrogenLevel) : 50,
          soilPhosphorus: latestSoilTest ? Number(latestSoilTest.phosphorusLevel) : 30,
          soilPotassium: latestSoilTest ? Number(latestSoilTest.potassiumLevel) : 150,
          rainfall: estimatedRainfall,
          temperature: estimatedTemperature,
          humidity: estimatedHumidity,
          elevation: 100, // Would come from GPS data
          budget: 5000, // Default, would come from user input
          marketDemand: ["maize", "rice", "vegetables"], // Would come from market analysis
          previousCrops: previousCrops.slice(0, 5),
          diseaseHistory: [], // Would come from health records
          averageYields: yieldByCrop,
        };
      } catch (error) {
        console.error("Error fetching farm conditions:", error);
        throw error;
      }
    }),

  /**
   * Generate crop recommendations based on farm conditions
   */
  generateRecommendations: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const database = await getDb();
        // Get farm conditions
        const conditionsResponse = await database.query.farms.findFirst({
          where: eq(farms.id, input.farmId),
        });

        if (!conditionsResponse) {
          throw new Error("Farm not found");
        }

        // Get soil test data
        const soilTest = await database.query.soilTests.findFirst({
          where: eq(soilTests.farmId, input.farmId),
          orderBy: desc(soilTests.testDate),
        });

        // Build farm conditions object
        const farmConditions: FarmConditions = {
          soilType: "loam",
          soilPH: soilTest ? Number(soilTest.phLevel) : 6.5,
          soilNitrogen: soilTest ? Number(soilTest.nitrogenLevel) : 50,
          soilPhosphorus: soilTest ? Number(soilTest.phosphorusLevel) : 30,
          soilPotassium: soilTest ? Number(soilTest.potassiumLevel) : 150,
          rainfall: 800,
          temperature: 25,
          humidity: 65,
          elevation: 100,
          farmSize: Number(conditionsResponse.sizeHectares) || 1,
          budget: 5000,
          marketDemand: ["maize", "rice", "vegetables"],
          previousCrops: [],
          diseaseHistory: [],
        };

        // Generate recommendations using AI engine
        const recommendations = await cropRecommendationEngine.generateRecommendations(farmConditions);

        // Store recommendations in database
        const now = new Date();
        const storedRecommendations = recommendations.map(rec => ({
          farmId: input.farmId,
          cropName: rec.cropName,
          suitability: rec.suitability,
          expectedYield: rec.expectedYield,
          estimatedRevenue: rec.estimatedRevenue,
          riskFactors: JSON.stringify(rec.riskFactors),
          benefits: JSON.stringify(rec.benefits),
          requirements: JSON.stringify(rec.requirements),
          plantingSchedule: JSON.stringify(rec.plantingSchedule),
          marketOpportunities: JSON.stringify(rec.marketOpportunities),
          generatedAt: now,
        }));

        return {
          success: true,
          recommendations,
          message: `Generated ${recommendations.length} crop recommendations`,
        };
      } catch (error) {
        console.error("Error generating recommendations:", error);
        throw error;
      }
    }),

  /**
   * Get detailed analysis for a specific crop
   */
  getCropAnalysis: protectedProcedure
    .input(z.object({ farmId: z.number(), cropName: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        const database = await getDb();
        // Get farm conditions
        const farm = await database.query.farms.findFirst({
          where: eq(farms.id, input.farmId),
        });

        if (!farm) {
          throw new Error("Farm not found");
        }

        const soilTest = await database.query.soilTests.findFirst({
          where: eq(soilTests.farmId, input.farmId),
          orderBy: desc(soilTests.testDate),
        });

        const farmConditions: FarmConditions = {
          soilType: "loam",
          soilPH: soilTest ? Number(soilTest.phLevel) : 6.5,
          soilNitrogen: soilTest ? Number(soilTest.nitrogenLevel) : 50,
          soilPhosphorus: soilTest ? Number(soilTest.phosphorusLevel) : 30,
          soilPotassium: soilTest ? Number(soilTest.potassiumLevel) : 150,
          rainfall: 800,
          temperature: 25,
          humidity: 65,
          elevation: 100,
          farmSize: Number(farm.sizeHectares) || 1,
          budget: 5000,
          marketDemand: ["maize", "rice", "vegetables"],
          previousCrops: [],
          diseaseHistory: [],
        };

        // Get detailed analysis from AI engine
        const analysis = await cropRecommendationEngine.getDetailedCropAnalysis(input.cropName, farmConditions);

        return {
          cropName: input.cropName,
          farmId: input.farmId,
          analysis,
        };
      } catch (error) {
        console.error("Error getting crop analysis:", error);
        throw error;
      }
    }),

  /**
   * Get recommendation history for a farm
   */
  getRecommendationHistory: protectedProcedure
    .input(z.object({ farmId: z.number(), limit: z.number().default(10) }))
    .query(async ({ ctx, input }) => {
      try {
        // This would query from a recommendation_history table
        // For now, return empty array as table needs to be created
        return {
          farmId: input.farmId,
          recommendations: [],
          message: "Recommendation history table pending database migration",
        };
      } catch (error) {
        console.error("Error fetching recommendation history:", error);
        throw error;
      }
    }),

  /**
   * Compare crop recommendations for multiple farms
   */
  compareRecommendations: protectedProcedure
    .input(z.object({ farmIds: z.array(z.number()) }))
    .query(async ({ ctx, input }) => {
      try {
        const database = await getDb();
        const comparisons = await Promise.all(
          input.farmIds.map(async (farmId) => {
            const farm = await database.query.farms.findFirst({
              where: eq(farms.id, farmId),
            });

            const soilTest = await database.query.soilTests.findFirst({
              where: eq(soilTests.farmId, farmId),
              orderBy: desc(soilTests.testDate),
            });

            return {
              farmId,
              farmName: farm?.farmName || "Unknown",
              soilPH: soilTest ? Number(soilTest.phLevel) : 6.5,
              soilNitrogen: soilTest ? Number(soilTest.nitrogenLevel) : 50,
              soilPhosphorus: soilTest ? Number(soilTest.phosphorusLevel) : 30,
              soilPotassium: soilTest ? Number(soilTest.potassiumLevel) : 150,
            };
          })
        );

        return {
          farmCount: input.farmIds.length,
          comparisons,
        };
      } catch (error) {
        console.error("Error comparing recommendations:", error);
        throw error;
      }
    }),
});
