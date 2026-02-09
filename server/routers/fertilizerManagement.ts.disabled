import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { fertilizerInventoryService } from '../_core/fertilizerInventoryService';
import { soilHealthRecommendationsEngine } from '../_core/soilHealthRecommendationsEngine';
import { fertilizerCostAnalysisService } from '../_core/fertilizerCostAnalysisService';

export const fertilizerManagementRouter = router({
  // ============================================================================
  // INVENTORY MANAGEMENT
  // ============================================================================
  inventory: router({
    getByFarm: protectedProcedure
      .input(z.object({ farmId: z.number() }))
      .query(async ({ input }) => {
        return await fertilizerInventoryService.getInventoryByFarm(input.farmId);
      }),

    getItem: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await fertilizerInventoryService.getInventoryItem(input.id);
      }),

    upsert: protectedProcedure
      .input(
        z.object({
          farmId: z.number(),
          fertilizerType: z.string(),
          currentStock: z.number().optional(),
          reorderPoint: z.number().optional(),
          reorderQuantity: z.number().optional(),
          supplier: z.string().optional(),
          supplierContact: z.string().optional(),
          storageLocation: z.string().optional(),
          expiryDate: z.date().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await fertilizerInventoryService.upsertInventoryItem(
          input.farmId,
          input.fertilizerType,
          input
        );
      }),

    recordTransaction: protectedProcedure
      .input(
        z.object({
          inventoryId: z.number(),
          transactionType: z.enum(['purchase', 'usage', 'adjustment', 'damage', 'expiry']),
          quantity: z.number(),
          cost: z.number().optional(),
          reason: z.string().optional(),
          referenceId: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await fertilizerInventoryService.recordTransaction(
          input.inventoryId,
          input.transactionType,
          input.quantity,
          {
            cost: input.cost,
            reason: input.reason,
            referenceId: input.referenceId,
          }
        );
      }),

    getTransactionHistory: protectedProcedure
      .input(z.object({ inventoryId: z.number(), limit: z.number().optional() }))
      .query(async ({ input }) => {
        return await fertilizerInventoryService.getTransactionHistory(input.inventoryId, input.limit);
      }),

    getLowStockItems: protectedProcedure
      .input(z.object({ farmId: z.number() }))
      .query(async ({ input }) => {
        return await fertilizerInventoryService.getLowStockItems(input.farmId);
      }),

    getExpiringItems: protectedProcedure
      .input(z.object({ farmId: z.number(), daysThreshold: z.number().optional() }))
      .query(async ({ input }) => {
        return await fertilizerInventoryService.getExpiringItems(input.farmId, input.daysThreshold);
      }),

    getInventoryValue: protectedProcedure
      .input(z.object({ farmId: z.number() }))
      .query(async ({ input }) => {
        return await fertilizerInventoryService.calculateInventoryValue(input.farmId);
      }),
  }),

  // ============================================================================
  // SOIL HEALTH RECOMMENDATIONS
  // ============================================================================
  soilHealth: router({
    analyze: protectedProcedure
      .input(z.object({ soilTestId: z.number(), cycleId: z.number() }))
      .mutation(async ({ input }) => {
        return await soilHealthRecommendationsEngine.analyzeSoilAndRecommend(
          input.soilTestId,
          input.cycleId
        );
      }),

    getRecommendationsForCycle: protectedProcedure
      .input(z.object({ cycleId: z.number() }))
      .query(async ({ input }) => {
        return await soilHealthRecommendationsEngine.getRecommendationsForCycle(input.cycleId);
      }),

    updateRecommendationStatus: protectedProcedure
      .input(
        z.object({
          recommendationId: z.number(),
          status: z.enum(['pending', 'applied', 'completed', 'cancelled']),
        })
      )
      .mutation(async ({ input }) => {
        await soilHealthRecommendationsEngine.updateRecommendationStatus(input.recommendationId, input.status);
        return { success: true };
      }),
  }),

  // ============================================================================
  // COST ANALYSIS
  // ============================================================================
  costAnalysis: router({
    analyzeCycleCosts: protectedProcedure
      .input(z.object({ cycleId: z.number() }))
      .mutation(async ({ input }) => {
        return await fertilizerCostAnalysisService.analyzeCycleCosts(input.cycleId);
      }),

    getCostTrend: protectedProcedure
      .input(z.object({ fertilizerType: z.string(), days: z.number().optional() }))
      .query(async ({ input }) => {
        return await fertilizerCostAnalysisService.getCostTrend(input.fertilizerType, input.days);
      }),

    compareFertilizerCosts: protectedProcedure.query(async () => {
      return await fertilizerCostAnalysisService.compareFertilizerCosts();
    }),
  }),
});
