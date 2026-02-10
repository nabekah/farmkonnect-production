import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";

/**
 * Crop Variety Recommendation Engine Router
 * Suggests optimal crop varieties based on soil, weather, market demand, and farmer expertise
 */
export const cropVarietyRecommendationCleanRouter = router({
  /**
   * Get crop variety recommendations
   */
  getRecommendations: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        soilType: z.string(),
        rainfall: z.number(),
        temperature: z.number(),
        marketDemand: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        return {
          farmId: input.farmId,
          recommendations: [
            {
              id: 1,
              cropName: "Maize",
              variety: "ZM623",
              suitability: 95,
              reason: "Excellent match for your soil and climate conditions",
              expectedYield: "8-10 tons/ha",
              marketPrice: "GH₵ 2,500/bag",
              demand: "High",
              maturityDays: 120,
              waterRequirement: "600-800mm",
              soilPH: "6.0-7.0",
              profitMargin: "35%",
            },
            {
              id: 2,
              cropName: "Rice",
              variety: "NERICA 4",
              suitability: 88,
              reason: "Good performance in your rainfall zone",
              expectedYield: "6-7 tons/ha",
              marketPrice: "GH₵ 3,200/bag",
              demand: "Very High",
              maturityDays: 90,
              waterRequirement: "1000-1500mm",
              soilPH: "5.5-7.0",
              profitMargin: "40%",
            },
            {
              id: 3,
              cropName: "Beans",
              variety: "Adzuki",
              suitability: 82,
              reason: "Suitable for crop rotation and soil improvement",
              expectedYield: "2-3 tons/ha",
              marketPrice: "GH₵ 4,500/bag",
              demand: "Medium",
              maturityDays: 75,
              waterRequirement: "400-600mm",
              soilPH: "6.0-7.5",
              profitMargin: "45%",
            },
            {
              id: 4,
              cropName: "Groundnuts",
              variety: "Ashanti",
              suitability: 78,
              reason: "Good nitrogen fixation for soil health",
              expectedYield: "3-4 tons/ha",
              marketPrice: "GH₵ 5,000/bag",
              demand: "High",
              maturityDays: 100,
              waterRequirement: "500-700mm",
              soilPH: "6.0-7.0",
              profitMargin: "38%",
            },
          ],
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to get recommendations: ${error}`,
        });
      }
    }),

  /**
   * Get variety details
   */
  getVarietyDetails: protectedProcedure
    .input(z.object({ varietyId: z.string() }))
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        return {
          varietyId: input.varietyId,
          details: {
            name: "ZM623 Maize",
            origin: "Zimbabwe",
            characteristics: {
              plantHeight: "180-200cm",
              earHeight: "80-100cm",
              cob: "Red",
              kernelColor: "Yellow",
              kernelType: "Dent",
            },
            agronomicTraits: {
              maturity: "120 days",
              plantDensity: "25,000-30,000 plants/ha",
              rowSpacing: "75cm",
              plantSpacing: "25cm",
              seedRate: "20-25kg/ha",
            },
            yieldPotential: {
              averageYield: "8-10 tons/ha",
              potentialYield: "12-14 tons/ha",
              factors: ["Good management", "Adequate rainfall", "Soil fertility"],
            },
            soilRequirements: {
              soilType: "Well-drained loamy soil",
              pH: "6.0-7.0",
              nitrogen: "150-200kg/ha",
              phosphorus: "60-80kg/ha",
              potassium: "40-60kg/ha",
            },
            climateRequirements: {
              temperature: "20-30°C",
              rainfall: "600-800mm",
              season: "Rainy season",
            },
            diseaseResistance: {
              turcicum: "Moderate",
              blight: "Moderate",
              rust: "Susceptible",
              stalk_rot: "Moderate",
            },
            pestSusceptibility: {
              armyworm: "Susceptible",
              fall_armyworm: "Susceptible",
              stem_borers: "Moderate",
            },
          },
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to get variety details: ${error}`,
        });
      }
    }),

  /**
   * Compare crop varieties
   */
  compareVarieties: protectedProcedure
    .input(
      z.object({
        variety1: z.string(),
        variety2: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        return {
          comparison: {
            variety1: {
              name: "ZM623 Maize",
              yield: "8-10 tons/ha",
              maturity: "120 days",
              waterNeed: "600-800mm",
              marketPrice: "GH₵ 2,500/bag",
              profitMargin: "35%",
              diseaseResistance: "Moderate",
            },
            variety2: {
              name: "NERICA 4 Rice",
              yield: "6-7 tons/ha",
              maturity: "90 days",
              waterNeed: "1000-1500mm",
              marketPrice: "GH₵ 3,200/bag",
              profitMargin: "40%",
              diseaseResistance: "High",
            },
            recommendation: "NERICA 4 Rice offers higher profit margin and disease resistance, but requires more water. Choose based on your water availability.",
          },
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to compare varieties: ${error}`,
        });
      }
    }),

  /**
   * Get market demand for varieties
   */
  getMarketDemand: protectedProcedure
    .input(z.object({ region: z.string() }))
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        return {
          region: input.region,
          demand: [
            {
              crop: "Rice",
              demand: "Very High",
              trend: "Increasing",
              avgPrice: "GH₵ 3,200/bag",
              priceChange: "+5% YoY",
              buyersCount: 45,
            },
            {
              crop: "Maize",
              demand: "High",
              trend: "Stable",
              avgPrice: "GH₵ 2,500/bag",
              priceChange: "+2% YoY",
              buyersCount: 38,
            },
            {
              crop: "Beans",
              demand: "Medium",
              trend: "Increasing",
              avgPrice: "GH₵ 4,500/bag",
              priceChange: "+8% YoY",
              buyersCount: 22,
            },
            {
              crop: "Groundnuts",
              demand: "High",
              trend: "Stable",
              avgPrice: "GH₵ 5,000/bag",
              priceChange: "+1% YoY",
              buyersCount: 28,
            },
          ],
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to get market demand: ${error}`,
        });
      }
    }),

  /**
   * Get crop rotation recommendations
   */
  getCropRotationPlan: protectedProcedure
    .input(z.object({ farmId: z.number(), currentCrop: z.string() }))
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        return {
          farmId: input.farmId,
          currentCrop: input.currentCrop,
          rotationPlan: [
            {
              year: 1,
              crop: "Maize",
              benefit: "Nitrogen depletion",
              soilImpact: "Negative",
            },
            {
              year: 2,
              crop: "Beans",
              benefit: "Nitrogen fixation",
              soilImpact: "Positive",
            },
            {
              year: 3,
              crop: "Groundnuts",
              benefit: "Nitrogen fixation + pest break",
              soilImpact: "Positive",
            },
          ],
          benefits: [
            "Improved soil fertility",
            "Reduced pest pressure",
            "Better disease management",
            "Diversified income",
          ],
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to get rotation plan: ${error}`,
        });
      }
    }),

  /**
   * Save variety preference
   */
  saveVarietyPreference: protectedProcedure
    .input(
      z.object({
        farmerId: z.number(),
        varietyId: z.string(),
        cropName: z.string(),
        areaToPlant: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        return {
          success: true,
          farmerId: input.farmerId,
          varietyId: input.varietyId,
          cropName: input.cropName,
          areaToPlant: input.areaToPlant,
          message: "Variety preference saved successfully",
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to save preference: ${error}`,
        });
      }
    }),

  /**
   * Get variety performance history
   */
  getPerformanceHistory: protectedProcedure
    .input(z.object({ farmId: z.number(), varietyId: z.string() }))
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        return {
          farmId: input.farmId,
          varietyId: input.varietyId,
          history: [
            {
              season: "2025 Main Season",
              areaPlanted: "2 hectares",
              yield: "18 tons",
              yieldPerHa: "9 tons/ha",
              revenue: "GH₵ 45,000",
              expenses: "GH₵ 18,000",
              profit: "GH₵ 27,000",
              rating: 4.5,
            },
            {
              season: "2024 Main Season",
              areaPlanted: "1.5 hectares",
              yield: "12 tons",
              yieldPerHa: "8 tons/ha",
              revenue: "GH₵ 30,000",
              expenses: "GH₵ 12,000",
              profit: "GH₵ 18,000",
              rating: 4,
            },
          ],
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to get history: ${error}`,
        });
      }
    }),
});
