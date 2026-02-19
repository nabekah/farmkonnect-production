import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { RateLimitingService } from "../services/rateLimitingService";
import { TRPCError } from "@trpc/server";

export const rateLimitingRouter = router({
  // Get rate limit status for login
  getLoginRateLimitStatus: publicProcedure
    .input(z.object({ email: z.string().email(), ipAddress: z.string() }))
    .query(({ input }) => {
      return RateLimitingService.checkLoginRateLimit(input.email, input.ipAddress);
    }),

  // Get rate limit status for 2FA
  get2FARateLimitStatus: protectedProcedure
    .input(z.object({ ipAddress: z.string() }))
    .query(({ ctx, input }) => {
      return RateLimitingService.check2FARateLimit(ctx.user.id, input.ipAddress);
    }),

  // Record failed login attempt
  recordFailedLogin: publicProcedure
    .input(z.object({ email: z.string().email(), ipAddress: z.string() }))
    .mutation(({ input }) => {
      return RateLimitingService.recordFailedLogin(input.email, input.ipAddress);
    }),

  // Record failed 2FA attempt
  recordFailed2FA: protectedProcedure
    .input(z.object({ ipAddress: z.string() }))
    .mutation(({ ctx, input }) => {
      return RateLimitingService.recordFailed2FA(ctx.user.id, input.ipAddress);
    }),

  // Reset login rate limit (called after successful login)
  resetLoginRateLimit: publicProcedure
    .input(z.object({ email: z.string().email(), ipAddress: z.string() }))
    .mutation(({ input }) => {
      RateLimitingService.resetLoginRateLimit(input.email, input.ipAddress);
      return { success: true, message: "Rate limit reset" };
    }),

  // Reset 2FA rate limit (called after successful 2FA)
  reset2FARateLimit: protectedProcedure
    .input(z.object({ ipAddress: z.string() }))
    .mutation(({ ctx, input }) => {
      RateLimitingService.reset2FARateLimit(ctx.user.id, input.ipAddress);
      return { success: true, message: "Rate limit reset" };
    }),

  // Get rate limiting statistics (admin only)
  getStats: protectedProcedure.query(({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only admins can view rate limiting statistics",
      });
    }

    return RateLimitingService.getStats();
  }),

  // Clear all rate limits (admin only - for testing/emergency)
  clearAll: protectedProcedure.mutation(({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only admins can clear rate limits",
      });
    }

    RateLimitingService.clearAll();
    return { success: true, message: "All rate limits cleared" };
  }),
});
