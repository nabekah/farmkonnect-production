import { z } from "zod";
import { publicProcedure, router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { TRPCError } from "@trpc/server";
import { sql } from "drizzle-orm";

/**
 * Authentication Analytics Router
 * Tracks login methods, success rates, and user authentication patterns
 */
export const authAnalyticsRouter = router({
  /**
   * Log a login attempt
   * Called by OAuth callbacks to track authentication events
   */
  logLoginAttempt: publicProcedure
    .input(
      z.object({
        userId: z.number().optional(),
        loginMethod: z.enum(["google", "manus", "manual"]),
        success: z.boolean(),
        failureReason: z.string().optional(),
        ipAddress: z.string().optional(),
        userAgent: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        console.warn("[AuthAnalytics] Database not available");
        return { success: false };
      }

      try {
        await db.execute(
          sql`INSERT INTO authAnalytics (userId, loginMethod, success, failureReason, ipAddress, userAgent, loginAt) 
              VALUES (${input.userId || null}, ${input.loginMethod}, ${input.success}, ${input.failureReason || null}, ${input.ipAddress || null}, ${input.userAgent || null}, NOW())`
        );

        return { success: true };
      } catch (error) {
        console.error("[AuthAnalytics] Failed to log login attempt:", error);
        return { success: false };
      }
    }),

  /**
   * Log a logout event
   * Called when user signs out to track session duration
   */
  logLogoutEvent: protectedProcedure
    .input(z.object({ sessionDuration: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        console.warn("[AuthAnalytics] Database not available");
        return { success: false };
      }

      try {
        await db.execute(
          sql`UPDATE authAnalytics 
              SET logoutAt = NOW(), sessionDuration = ${input.sessionDuration}
              WHERE userId = ${ctx.user?.id} AND logoutAt IS NULL
              ORDER BY loginAt DESC LIMIT 1`
        );

        return { success: true };
      } catch (error) {
        console.error("[AuthAnalytics] Failed to log logout event:", error);
        return { success: false };
      }
    }),

  /**
   * Get login statistics
   * Returns aggregated login data for the past N days
   */
  getLoginStats: protectedProcedure
    .input(z.object({ days: z.number().default(30) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        console.warn("[AuthAnalytics] Database not available");
        return null;
      }

      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can view login statistics",
        });
      }

      try {
        const stats = await db.execute(
          sql`SELECT 
                loginMethod,
                COUNT(*) as totalAttempts,
                SUM(CASE WHEN success = true THEN 1 ELSE 0 END) as successfulLogins,
                SUM(CASE WHEN success = false THEN 1 ELSE 0 END) as failedLogins,
                ROUND(SUM(CASE WHEN success = true THEN 1 ELSE 0 END) / COUNT(*) * 100, 2) as successRate,
                AVG(sessionDuration) as avgSessionDuration
              FROM authAnalytics
              WHERE loginAt >= DATE_SUB(NOW(), INTERVAL ${input.days} DAY)
              GROUP BY loginMethod
              ORDER BY totalAttempts DESC`
        );

        return stats;
      } catch (error) {
        console.error("[AuthAnalytics] Failed to get login stats:", error);
        return null;
      }
    }),

  /**
   * Get daily login trends
   * Returns login count by day for the past N days
   */
  getDailyLoginTrends: protectedProcedure
    .input(z.object({ days: z.number().default(30) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        console.warn("[AuthAnalytics] Database not available");
        return null;
      }

      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can view login trends",
        });
      }

      try {
        const trends = await db.execute(
          sql`SELECT 
                DATE(loginAt) as date,
                COUNT(*) as totalLogins,
                SUM(CASE WHEN success = true THEN 1 ELSE 0 END) as successfulLogins,
                SUM(CASE WHEN success = false THEN 1 ELSE 0 END) as failedLogins
              FROM authAnalytics
              WHERE loginAt >= DATE_SUB(NOW(), INTERVAL ${input.days} DAY)
              GROUP BY DATE(loginAt)
              ORDER BY date DESC`
        );

        return trends;
      } catch (error) {
        console.error("[AuthAnalytics] Failed to get daily login trends:", error);
        return null;
      }
    }),

  /**
   * Get user login history
   * Returns login events for a specific user
   */
  getUserLoginHistory: protectedProcedure
    .input(z.object({ userId: z.number().optional(), limit: z.number().default(50) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        console.warn("[AuthAnalytics] Database not available");
        return null;
      }

      const targetUserId = input.userId || ctx.user?.id;
      if (!targetUserId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User ID is required",
        });
      }

      // Users can only view their own history unless they're admin
      if (ctx.user?.id !== targetUserId && ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only view your own login history",
        });
      }

      try {
        const history = await db.execute(
          sql`SELECT 
                id,
                loginMethod,
                success,
                failureReason,
                loginAt,
                logoutAt,
                sessionDuration,
                ipAddress
              FROM authAnalytics
              WHERE userId = ${targetUserId}
              ORDER BY loginAt DESC
              LIMIT ${input.limit}`
        );

        return history;
      } catch (error) {
        console.error("[AuthAnalytics] Failed to get user login history:", error);
        return null;
      }
    }),

  /**
   * Get login method preferences
   * Shows which login methods users prefer
   */
  getLoginMethodPreferences: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      console.warn("[AuthAnalytics] Database not available");
      return null;
    }

    if (ctx.user?.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only admins can view login method preferences",
      });
    }

    try {
      const preferences = await db.execute(
        sql`SELECT 
              loginMethod,
              COUNT(*) as count,
              COUNT(DISTINCT userId) as uniqueUsers,
              ROUND(COUNT(*) / (SELECT COUNT(*) FROM authAnalytics) * 100, 2) as percentage
            FROM authAnalytics
            WHERE success = true
            GROUP BY loginMethod
            ORDER BY count DESC`
      );

      return preferences;
    } catch (error) {
      console.error("[AuthAnalytics] Failed to get login method preferences:", error);
      return null;
    }
  }),

  /**
   * Get failed login attempts
   * Returns recent failed login attempts for security monitoring
   */
  getFailedLoginAttempts: protectedProcedure
    .input(z.object({ limit: z.number().default(100), hours: z.number().default(24) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        console.warn("[AuthAnalytics] Database not available");
        return null;
      }

      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can view failed login attempts",
        });
      }

      try {
        const failedAttempts = await db.execute(
          sql`SELECT 
                id,
                userId,
                loginMethod,
                failureReason,
                ipAddress,
                loginAt
              FROM authAnalytics
              WHERE success = false
              AND loginAt >= DATE_SUB(NOW(), INTERVAL ${input.hours} HOUR)
              ORDER BY loginAt DESC
              LIMIT ${input.limit}`
        );

        return failedAttempts;
      } catch (error) {
        console.error("[AuthAnalytics] Failed to get failed login attempts:", error);
        return null;
      }
    }),
});
