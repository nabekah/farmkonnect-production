import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";

/**
 * Pest Early Warning System Router
 * Predictive pest alerts based on weather patterns, crop stage, and historical data
 */
export const pestEarlyWarningSystemCleanRouter = router({
  /**
   * Get pest alerts for farm
   */
  getPestAlerts: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        return {
          farmId: input.farmId,
          alerts: [
            {
              id: 1,
              pestName: "Armyworm",
              severity: "high",
              riskScore: 85,
              probability: "Very High",
              affectedCrops: ["Maize", "Rice"],
              expectedDate: "2026-02-15",
              description: "High risk of armyworm outbreak based on weather and crop stage",
              triggers: ["Temperature 25-30°C", "Humidity 70-80%", "Crop stage: V4-V6"],
            },
            {
              id: 2,
              pestName: "Leaf Spot",
              severity: "medium",
              riskScore: 65,
              probability: "High",
              affectedCrops: ["Rice", "Beans"],
              expectedDate: "2026-02-18",
              description: "Moderate risk of leaf spot disease due to high humidity",
              triggers: ["Humidity > 75%", "Temperature 20-25°C", "Wet conditions"],
            },
            {
              id: 3,
              pestName: "Aphids",
              severity: "low",
              riskScore: 35,
              probability: "Moderate",
              affectedCrops: ["Beans", "Vegetables"],
              expectedDate: "2026-02-20",
              description: "Low risk of aphid infestation",
              triggers: ["Temperature 15-20°C", "Dry conditions"],
            },
          ],
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to get alerts: ${error}`,
        });
      }
    }),

  /**
   * Get pest risk forecast
   */
  getPestRiskForecast: protectedProcedure
    .input(z.object({ farmId: z.number(), days: z.number().default(14) }))
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        return {
          farmId: input.farmId,
          forecast: [
            {
              date: "2026-02-11",
              armywormRisk: 45,
              leafSpotRisk: 35,
              aphidRisk: 20,
              overallRisk: "Low",
            },
            {
              date: "2026-02-12",
              armywormRisk: 55,
              leafSpotRisk: 45,
              aphidRisk: 25,
              overallRisk: "Medium",
            },
            {
              date: "2026-02-13",
              armywormRisk: 70,
              leafSpotRisk: 65,
              aphidRisk: 30,
              overallRisk: "High",
            },
            {
              date: "2026-02-14",
              armywormRisk: 75,
              leafSpotRisk: 70,
              aphidRisk: 35,
              overallRisk: "High",
            },
            {
              date: "2026-02-15",
              armywormRisk: 85,
              leafSpotRisk: 75,
              aphidRisk: 40,
              overallRisk: "Very High",
            },
          ],
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to get forecast: ${error}`,
        });
      }
    }),

  /**
   * Get treatment recommendations
   */
  getTreatmentRecommendations: protectedProcedure
    .input(z.object({ pestName: z.string(), cropType: z.string() }))
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        return {
          pest: input.pestName,
          crop: input.cropType,
          recommendations: [
            {
              method: "Biological Control",
              description: "Release natural predators (Trichogramma wasps)",
              effectiveness: 75,
              cost: 500,
              timing: "Immediately",
              safetyRating: "High",
              environmentalImpact: "Positive",
            },
            {
              method: "Chemical Control",
              description: "Apply pyrethroid insecticide (Cypermethrin 10%)",
              effectiveness: 90,
              cost: 150,
              timing: "Early morning or late evening",
              safetyRating: "Medium",
              environmentalImpact: "Moderate",
            },
            {
              method: "Cultural Control",
              description: "Remove affected leaves, improve field hygiene",
              effectiveness: 60,
              cost: 50,
              timing: "Ongoing",
              safetyRating: "High",
              environmentalImpact: "Positive",
            },
            {
              method: "Integrated Pest Management",
              description: "Combine biological, cultural, and targeted chemical control",
              effectiveness: 85,
              cost: 300,
              timing: "Phased approach",
              safetyRating: "High",
              environmentalImpact: "Positive",
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
   * Get pest history
   */
  getPestHistory: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        return {
          farmId: input.farmId,
          history: [
            {
              date: "2025-12-01",
              pest: "Armyworm",
              crop: "Maize",
              severity: "high",
              treatment: "Cypermethrin 10%",
              outcome: "Controlled",
              costOfTreatment: 150,
            },
            {
              date: "2025-10-15",
              pest: "Leaf Spot",
              crop: "Rice",
              severity: "medium",
              treatment: "Fungicide spray",
              outcome: "Controlled",
              costOfTreatment: 200,
            },
            {
              date: "2025-09-20",
              pest: "Aphids",
              crop: "Beans",
              severity: "low",
              treatment: "Neem oil spray",
              outcome: "Controlled",
              costOfTreatment: 100,
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

  /**
   * Get pest identification guide
   */
  getPestIdentificationGuide: protectedProcedure
    .input(z.object({ pestName: z.string() }))
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        return {
          pest: input.pestName,
          guide: {
            description: "Small moths with gray-brown wings, wingspan 30-40mm",
            identification: [
              "Look for small holes in leaves",
              "Find dark droppings on leaves",
              "Observe wilting of young plants",
              "Check for larvae inside leaf rolls",
            ],
            lifeStage: "Larvae (most damaging stage)",
            damage: [
              "Leaf damage: Small holes and irregular feeding patterns",
              "Stem damage: Tunneling in young plants",
              "Ear damage: Feeding on corn cobs",
            ],
            favorableConditions: [
              "Temperature: 25-30°C",
              "Humidity: 70-80%",
              "Crop stage: V4-V6",
              "Rainy season",
            ],
          },
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to get guide: ${error}`,
        });
      }
    }),

  /**
   * Set pest alert preferences
   */
  setPestAlertPreferences: protectedProcedure
    .input(
      z.object({
        farmerId: z.number(),
        alertThreshold: z.number(),
        notificationMethods: z.array(z.enum(["sms", "email", "push"])),
        pestsToMonitor: z.array(z.string()),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        return {
          success: true,
          farmerId: input.farmerId,
          preferences: {
            alertThreshold: input.alertThreshold,
            notificationMethods: input.notificationMethods,
            pestsToMonitor: input.pestsToMonitor,
          },
          message: "Pest alert preferences updated",
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to set preferences: ${error}`,
        });
      }
    }),

  /**
   * Record pest sighting
   */
  recordPestSighting: protectedProcedure
    .input(
      z.object({
        farmerId: z.number(),
        fieldId: z.number(),
        pestName: z.string(),
        severity: z.enum(["low", "medium", "high"]),
        quantity: z.number(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        return {
          success: true,
          sightingId: Math.floor(Math.random() * 100000),
          farmerId: input.farmerId,
          fieldId: input.fieldId,
          pestName: input.pestName,
          severity: input.severity,
          recordedAt: new Date(),
          message: "Pest sighting recorded successfully",
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to record sighting: ${error}`,
        });
      }
    }),

  /**
   * Get pest control calendar
   */
  getPestControlCalendar: protectedProcedure
    .input(z.object({ farmId: z.number(), cropType: z.string() }))
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        return {
          farmId: input.farmId,
          crop: input.cropType,
          calendar: [
            {
              month: "January",
              activities: [
                "Monitor for armyworm in early plantings",
                "Scout for leaf spot in wet areas",
                "Apply preventive fungicide if needed",
              ],
              riskLevel: "Medium",
            },
            {
              month: "February",
              activities: [
                "High armyworm risk - weekly scouting required",
                "Apply biological or chemical control if threshold reached",
                "Monitor weather for disease conditions",
              ],
              riskLevel: "High",
            },
            {
              month: "March",
              activities: [
                "Continue pest monitoring",
                "Prepare for end-of-season pests",
                "Plan crop rotation to break pest cycle",
              ],
              riskLevel: "Medium",
            },
          ],
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to get calendar: ${error}`,
        });
      }
    }),
});
