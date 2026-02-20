import { Request } from "express";
import { sql } from "drizzle-orm";
import { getDb } from "../db";

/**
 * Extract client IP address from request
 * Handles proxies and load balancers
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  return req.socket.remoteAddress || "unknown";
}

/**
 * Extract user agent from request
 */
export function getUserAgent(req: Request): string {
  return req.headers["user-agent"] || "unknown";
}

/**
 * Log authentication attempt to analytics table
 */
export async function logAuthenticationAttempt(options: {
  req: Request;
  userId?: number;
  loginMethod: "google" | "manus" | "manual";
  success: boolean;
  failureReason?: string;
}): Promise<void> {
  const { req, userId, loginMethod, success, failureReason } = options;

  try {
    const db = await getDb();
    if (!db) {
      console.warn("[AuthAnalyticsLogger] Database not available");
      return;
    }

    const ipAddress = getClientIp(req);
    const userAgent = getUserAgent(req);

    await db.execute(
      sql`INSERT INTO authAnalytics (userId, loginMethod, success, failureReason, ipAddress, userAgent, loginAt) 
          VALUES (${userId || null}, ${loginMethod}, ${success}, ${failureReason || null}, ${ipAddress}, ${userAgent}, NOW())`
    );

    console.log(`[AuthAnalytics] Logged ${loginMethod} login attempt:`, {
      userId,
      success,
      ipAddress,
      failureReason: failureReason || "none",
    });
  } catch (error) {
    console.error("[AuthAnalyticsLogger] Failed to log authentication attempt:", error);
    // Don't throw - analytics logging should not break authentication
  }
}

/**
 * Log logout event with session duration
 */
export async function logLogoutEvent(options: {
  userId: number;
  sessionDurationMs: number;
}): Promise<void> {
  const { userId, sessionDurationMs } = options;

  try {
    const db = await getDb();
    if (!db) {
      console.warn("[AuthAnalyticsLogger] Database not available");
      return;
    }

    // Convert milliseconds to seconds
    const sessionDurationSeconds = Math.round(sessionDurationMs / 1000);

    await db.execute(
      sql`UPDATE authAnalytics 
          SET logoutAt = NOW(), sessionDuration = ${sessionDurationSeconds}
          WHERE userId = ${userId} AND logoutAt IS NULL
          ORDER BY loginAt DESC LIMIT 1`
    );

    console.log(`[AuthAnalytics] Logged logout for user ${userId}:`, {
      sessionDurationSeconds,
    });
  } catch (error) {
    console.error("[AuthAnalyticsLogger] Failed to log logout event:", error);
    // Don't throw - analytics logging should not break authentication
  }
}

/**
 * Get analytics summary for a specific login method
 */
export async function getLoginMethodStats(loginMethod: "google" | "manus" | "manual", days: number = 30): Promise<any> {
  try {
    const db = await getDb();
    if (!db) {
      console.warn("[AuthAnalyticsLogger] Database not available");
      return null;
    }

    const stats = await db.execute(
      sql`SELECT 
            COUNT(*) as totalAttempts,
            SUM(CASE WHEN success = true THEN 1 ELSE 0 END) as successfulLogins,
            SUM(CASE WHEN success = false THEN 1 ELSE 0 END) as failedLogins,
            ROUND(SUM(CASE WHEN success = true THEN 1 ELSE 0 END) / COUNT(*) * 100, 2) as successRate,
            AVG(sessionDuration) as avgSessionDuration
          FROM authAnalytics
          WHERE loginMethod = ${loginMethod}
          AND loginAt >= DATE_SUB(NOW(), INTERVAL ${days} DAY)`
    );

    return stats?.[0] || null;
  } catch (error) {
    console.error("[AuthAnalyticsLogger] Failed to get login method stats:", error);
    return null;
  }
}
