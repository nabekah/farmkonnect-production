import { router, protectedProcedure, adminProcedure } from "../_core/trpc";
import { z } from "zod";
import { APIRateLimitingService } from "../services/apiRateLimitingService";
import { TRPCError } from "@trpc/server";

export const apiRateLimitingRouter = router({
  // Get current user's rate limit status
  getCurrentStatus: protectedProcedure.query(async ({ ctx }) => {
    const stats = await APIRateLimitingService.getUserStatistics(ctx.user.id);
    const tier = await APIRateLimitingService.getUserTier(ctx.user.id);

    return {
      tier,
      stats,
      limits: {
        default: APIRateLimitingService.getDefaultLimit(tier),
        endpoints: APIRateLimitingService.getAllEndpointLimits(),
      },
    };
  }),

  // Get user's usage history
  getUserUsage: protectedProcedure
    .input(z.object({ endpoint: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      return await APIRateLimitingService.getUserUsage(ctx.user.id, input.endpoint);
    }),

  // Get user's statistics
  getUserStatistics: protectedProcedure.query(async ({ ctx }) => {
    return await APIRateLimitingService.getUserStatistics(ctx.user.id);
  }),

  // Get global statistics (admin only)
  getGlobalStatistics: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only admins can view global statistics",
      });
    }

    return await APIRateLimitingService.getGlobalStatistics();
  }),

  // Set user tier (admin only)
  setUserTier: protectedProcedure
    .input(
      z.object({
        userId: z.number(),
        tier: z.enum(["free", "pro", "enterprise"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can set user tiers",
        });
      }

      await APIRateLimitingService.setUserTier(input.userId, input.tier);

      return {
        success: true,
        message: `User ${input.userId} tier set to ${input.tier}`,
      };
    }),

  // Get all user tiers (admin only)
  getAllUserTiers: protectedProcedure
    .input(z.object({ limit: z.number().default(100), offset: z.number().default(0) }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can view user tiers",
        });
      }

      return await APIRateLimitingService.getAllUserTiers(input.limit, input.offset);
    }),

  // Get default limits for all tiers
  getDefaultLimits: protectedProcedure.query(async () => {
    return {
      free: APIRateLimitingService.getDefaultLimit("free"),
      pro: APIRateLimitingService.getDefaultLimit("pro"),
      enterprise: APIRateLimitingService.getDefaultLimit("enterprise"),
    };
  }),

  // Get endpoint-specific limits
  getEndpointLimits: protectedProcedure.query(async () => {
    return APIRateLimitingService.getAllEndpointLimits();
  }),

  // Get specific endpoint limit
  getEndpointLimit: protectedProcedure
    .input(z.object({ endpoint: z.string(), tier: z.enum(["free", "pro", "enterprise"]) }))
    .query(async ({ input }) => {
      return {
        endpoint: input.endpoint,
        tier: input.tier,
        limit: APIRateLimitingService.getEndpointLimit(input.endpoint, input.tier),
      };
    }),

  // Cleanup old entries (admin only)
  cleanupOldEntries: protectedProcedure.mutation(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only admins can cleanup old entries",
      });
    }

    const deleted = await APIRateLimitingService.cleanupOldEntries();

    return {
      success: true,
      message: `Deleted ${deleted} old rate limit entries`,
    };
  }),
});
