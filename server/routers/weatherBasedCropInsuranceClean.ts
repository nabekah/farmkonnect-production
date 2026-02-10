import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";

/**
 * Weather-Based Crop Insurance Router
 * Parametric insurance with automatic triggers and instant payouts
 */
export const weatherBasedCropInsuranceCleanRouter = router({
  /**
   * Get insurance products
   */
  getInsuranceProducts: protectedProcedure
    .input(z.object({ cropType: z.string().optional(), region: z.string().optional() }))
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        return {
          products: [
            {
              id: 1,
              name: "Drought Protection - Maize",
              crop: "Maize",
              region: "Ashanti",
              coverage: 5000,
              premium: 250,
              premiumRate: 0.05,
              trigger: "Rainfall < 300mm",
              payout: 5000,
              season: "June-October",
              status: "active",
            },
            {
              id: 2,
              name: "Excess Rainfall - Vegetables",
              crop: "Vegetables",
              region: "Greater Accra",
              coverage: 3000,
              premium: 150,
              premiumRate: 0.05,
              trigger: "Rainfall > 500mm",
              payout: 3000,
              season: "Year-round",
              status: "active",
            },
            {
              id: 3,
              name: "Temperature Stress - Cocoa",
              crop: "Cocoa",
              region: "Western",
              coverage: 8000,
              premium: 400,
              premiumRate: 0.05,
              trigger: "Temperature > 35°C",
              payout: 8000,
              season: "May-September",
              status: "active",
            },
          ],
          total: 3,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to get products: ${error}`,
        });
      }
    }),

  /**
   * Purchase insurance policy
   */
  purchasePolicy: protectedProcedure
    .input(
      z.object({
        farmerId: z.number(),
        productId: z.number(),
        coverage: z.number(),
        season: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        return {
          success: true,
          policyId: `POL-${Date.now()}`,
          farmerId: input.farmerId,
          productId: input.productId,
          coverage: input.coverage,
          premium: input.coverage * 0.05,
          season: input.season,
          status: "active",
          startDate: new Date(),
          endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
          message: "Policy purchased successfully",
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to purchase policy: ${error}`,
        });
      }
    }),

  /**
   * Get active policies
   */
  getActivePolicies: protectedProcedure
    .input(z.object({ farmerId: z.number() }))
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        return {
          farmerId: input.farmerId,
          policies: [
            {
              id: 1,
              policyId: "POL-1707500000",
              product: "Drought Protection - Maize",
              coverage: 5000,
              premium: 250,
              status: "active",
              startDate: "2026-01-01",
              endDate: "2026-06-30",
              triggers: [
                { condition: "Rainfall < 300mm", status: "monitoring" },
              ],
            },
            {
              id: 2,
              policyId: "POL-1707510000",
              product: "Excess Rainfall - Vegetables",
              coverage: 3000,
              premium: 150,
              status: "active",
              startDate: "2026-02-01",
              endDate: "2026-12-31",
              triggers: [
                { condition: "Rainfall > 500mm", status: "monitoring" },
              ],
            },
          ],
          total: 2,
          totalCoverage: 8000,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to get policies: ${error}`,
        });
      }
    }),

  /**
   * Get insurance claims
   */
  getInsuranceClaims: protectedProcedure
    .input(z.object({ farmerId: z.number() }))
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        return {
          farmerId: input.farmerId,
          claims: [
            {
              id: 1,
              claimId: "CLM-2026-001",
              policyId: "POL-1707500000",
              product: "Drought Protection - Maize",
              trigger: "Rainfall < 300mm",
              triggerDate: "2025-08-15",
              payout: 5000,
              status: "paid",
              paymentDate: "2025-08-20",
            },
            {
              id: 2,
              claimId: "CLM-2026-002",
              policyId: "POL-1707510000",
              product: "Excess Rainfall - Vegetables",
              trigger: "Rainfall > 500mm",
              triggerDate: "2025-09-10",
              payout: 3000,
              status: "processing",
              estimatedPayout: "2026-02-15",
            },
          ],
          totalClaims: 2,
          totalPaid: 5000,
          totalPending: 3000,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to get claims: ${error}`,
        });
      }
    }),

  /**
   * Get weather monitoring data
   */
  getWeatherMonitoring: protectedProcedure
    .input(z.object({ farmId: z.number(), policyId: z.string() }))
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        return {
          farmId: input.farmId,
          policyId: input.policyId,
          monitoring: {
            currentRainfall: 280,
            rainfallThreshold: 300,
            rainfallStatus: "critical",
            currentTemperature: 28,
            temperatureThreshold: 35,
            temperatureStatus: "normal",
            humidity: 65,
            windSpeed: 12,
          },
          forecast: [
            { date: "2026-02-11", rainfall: 15, temperature: 28, condition: "Partly Cloudy" },
            { date: "2026-02-12", rainfall: 5, temperature: 29, condition: "Sunny" },
            { date: "2026-02-13", rainfall: 0, temperature: 30, condition: "Sunny" },
          ],
          alerts: [
            {
              id: 1,
              type: "warning",
              message: "Rainfall approaching threshold. Monitor closely.",
              severity: "high",
            },
          ],
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to get monitoring: ${error}`,
        });
      }
    }),

  /**
   * Get insurance analytics
   */
  getInsuranceAnalytics: protectedProcedure
    .input(z.object({ farmerId: z.number() }))
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        return {
          farmerId: input.farmerId,
          analytics: {
            activePolicies: 2,
            totalCoverage: 8000,
            totalPremiums: 400,
            totalClaims: 2,
            totalPaid: 5000,
            claimRate: 0.625,
            roi: 12.5,
          },
          policyBreakdown: [
            { product: "Drought Protection", count: 1, coverage: 5000 },
            { product: "Excess Rainfall", count: 1, coverage: 3000 },
          ],
          claimHistory: [
            { month: "August 2025", claims: 1, payout: 5000 },
            { month: "September 2025", claims: 1, payout: 3000 },
          ],
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to get analytics: ${error}`,
        });
      }
    }),

  /**
   * Get insurance recommendations
   */
  getInsuranceRecommendations: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        cropType: z.string(),
        region: z.string(),
        farmArea: z.number(),
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
              product: "Drought Protection",
              reason: "High drought risk in your region during dry season",
              recommendedCoverage: 5000,
              estimatedPremium: 250,
              priority: "high",
            },
            {
              product: "Excess Rainfall",
              reason: "Moderate excess rainfall risk during monsoon",
              recommendedCoverage: 3000,
              estimatedPremium: 150,
              priority: "medium",
            },
          ],
          totalRecommendedCoverage: 8000,
          totalEstimatedPremium: 400,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to get recommendations: ${error}`,
        });
      }
    }),

  /**
   * File insurance claim
   */
  fileInsuranceClaim: protectedProcedure
    .input(
      z.object({
        policyId: z.string(),
        farmerId: z.number(),
        trigger: z.string(),
        evidence: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        return {
          success: true,
          claimId: `CLM-${Date.now()}`,
          policyId: input.policyId,
          farmerId: input.farmerId,
          trigger: input.trigger,
          status: "submitted",
          submittedAt: new Date(),
          estimatedPayout: 5000,
          estimatedPaymentDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          message: "Claim submitted successfully",
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to file claim: ${error}`,
        });
      }
    }),
});
