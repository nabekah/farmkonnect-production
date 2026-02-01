import { z } from 'zod';
import { protectedProcedure, router } from './_core/trpc';
import { analyticsService } from './_core/analyticsService';

export const analyticsRouter = router({
  // Livestock health prediction
  predictLivestockHealth: protectedProcedure
    .input(z.object({
      animalId: z.number(),
    }))
    .query(async ({ input }) => {
      return await analyticsService.predictLivestockHealth(input.animalId);
    }),

  // Feed cost optimization
  optimizeFeedCosts: protectedProcedure
    .input(z.object({
      farmId: z.number(),
    }))
    .query(async ({ input }) => {
      return await analyticsService.optimizeFeedCosts(input.farmId);
    }),

  // Harvest time prediction
  predictHarvestTime: protectedProcedure
    .input(z.object({
      pondId: z.number(),
    }))
    .query(async ({ input }) => {
      return await analyticsService.predictOptimalHarvestTime(input.pondId);
    }),
});
