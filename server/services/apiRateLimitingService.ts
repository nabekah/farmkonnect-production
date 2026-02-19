import { getDb } from "../db";
import { apiRateLimits, userTiers } from "../../drizzle/schema";
import { eq, and, gte } from "drizzle-orm";

export type UserTier = "free" | "pro" | "enterprise";
export type RateLimitWindow = "minute" | "hour" | "day";

export interface RateLimitConfig {
  window: RateLimitWindow;
  limit: number;
  tier: UserTier;
}

export interface EndpointRateLimit {
  endpoint: string;
  window: RateLimitWindow;
  limit: number;
  tier: UserTier;
}

// Default rate limits per tier per minute
const DEFAULT_LIMITS: Record<UserTier, number> = {
  free: 60, // 60 requests per minute
  pro: 300, // 300 requests per minute
  enterprise: 1000, // 1000 requests per minute
};

// Endpoint-specific limits (more restrictive for expensive operations)
const ENDPOINT_LIMITS: Record<string, Record<UserTier, number>> = {
  "auth.login": { free: 5, pro: 20, enterprise: 100 },
  "auth.register": { free: 3, pro: 10, enterprise: 50 },
  "security.addToWhitelist": { free: 10, pro: 50, enterprise: 200 },
  "security.bulkImportIPs": { free: 2, pro: 10, enterprise: 50 },
  "audit.exportLogs": { free: 5, pro: 20, enterprise: 100 },
  "rateLimiting.getStats": { free: 30, pro: 100, enterprise: 500 },
};

// In-memory store for rate limiting (userId:endpoint -> { count, resetAt })
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export class APIRateLimitingService {
  /**
   * Get user's tier
   */
  static async getUserTier(userId: number): Promise<UserTier> {
    const db = getDb();

    try {
      const tier = await db
        .select()
        .from(userTiers)
        .where(eq(userTiers.userId, userId))
        .limit(1);

      return tier.length > 0 ? (tier[0].tier as UserTier) : "free";
    } catch {
      return "free";
    }
  }

  /**
   * Check if request is within rate limit
   */
  static async checkRateLimit(
    userId: number,
    endpoint: string,
    window: RateLimitWindow = "minute"
  ): Promise<{
    allowed: boolean;
    remaining: number;
    resetAt: number;
    limit: number;
  }> {
    const tier = await this.getUserTier(userId);
    const key = `${userId}:${endpoint}`;
    const now = Date.now();

    // Get limit for this endpoint and tier
    const limit = ENDPOINT_LIMITS[endpoint]?.[tier] ?? DEFAULT_LIMITS[tier];

    // Get window in milliseconds
    const windowMs = this.getWindowMs(window);

    // Check if we have an existing entry
    const entry = rateLimitStore.get(key);

    if (!entry || now >= entry.resetAt) {
      // Create new entry
      rateLimitStore.set(key, {
        count: 1,
        resetAt: now + windowMs,
      });

      return {
        allowed: true,
        remaining: limit - 1,
        resetAt: now + windowMs,
        limit,
      };
    }

    // Check if limit exceeded
    if (entry.count >= limit) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: entry.resetAt,
        limit,
      };
    }

    // Increment count
    entry.count++;

    return {
      allowed: true,
      remaining: limit - entry.count,
      resetAt: entry.resetAt,
      limit,
    };
  }

  /**
   * Record API usage
   */
  static async recordUsage(
    userId: number,
    endpoint: string,
    responseTime: number,
    statusCode: number
  ): Promise<void> {
    try {
      const db = getDb();

      await db.insert(apiRateLimits).values({
        userId,
        endpoint,
        responseTime,
        statusCode,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error("Failed to record API usage:", error);
    }
  }

  /**
   * Get user's current usage
   */
  static async getUserUsage(userId: number, endpoint?: string): Promise<any[]> {
    const db = getDb();

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    let query = db
      .select()
      .from(apiRateLimits)
      .where(
        and(
          eq(apiRateLimits.userId, userId),
          gte(apiRateLimits.timestamp, oneHourAgo)
        )
      );

    if (endpoint) {
      query = query.where(eq(apiRateLimits.endpoint, endpoint));
    }

    return await query;
  }

  /**
   * Get usage statistics for user
   */
  static async getUserStatistics(userId: number): Promise<{
    tier: UserTier;
    totalRequests: number;
    averageResponseTime: number;
    errorRate: number;
    topEndpoints: Array<{ endpoint: string; count: number }>;
  }> {
    const db = getDb();
    const tier = await this.getUserTier(userId);
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const usage = await db
      .select()
      .from(apiRateLimits)
      .where(
        and(
          eq(apiRateLimits.userId, userId),
          gte(apiRateLimits.timestamp, oneHourAgo)
        )
      );

    const totalRequests = usage.length;
    const totalResponseTime = usage.reduce((sum, u) => sum + u.responseTime, 0);
    const averageResponseTime = totalRequests > 0 ? totalResponseTime / totalRequests : 0;

    const errorCount = usage.filter((u) => u.statusCode >= 400).length;
    const errorRate = totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0;

    // Get top endpoints
    const endpointMap = new Map<string, number>();
    usage.forEach((u) => {
      endpointMap.set(u.endpoint, (endpointMap.get(u.endpoint) || 0) + 1);
    });

    const topEndpoints = Array.from(endpointMap.entries())
      .map(([endpoint, count]) => ({ endpoint, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      tier,
      totalRequests,
      averageResponseTime: Math.round(averageResponseTime),
      errorRate: Math.round(errorRate * 100) / 100,
      topEndpoints,
    };
  }

  /**
   * Set user tier
   */
  static async setUserTier(userId: number, tier: UserTier): Promise<void> {
    const db = getDb();

    const existing = await db
      .select()
      .from(userTiers)
      .where(eq(userTiers.userId, userId))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(userTiers)
        .set({ tier })
        .where(eq(userTiers.userId, userId));
    } else {
      await db.insert(userTiers).values({
        userId,
        tier,
        createdAt: new Date(),
      });
    }
  }

  /**
   * Get all users with custom limits
   */
  static async getAllUserTiers(limit: number = 100, offset: number = 0): Promise<any[]> {
    const db = getDb();

    return await db
      .select()
      .from(userTiers)
      .limit(limit)
      .offset(offset);
  }

  /**
   * Get rate limit statistics (admin)
   */
  static async getGlobalStatistics(): Promise<{
    totalRequests: number;
    uniqueUsers: number;
    averageResponseTime: number;
    errorRate: number;
    topEndpoints: Array<{ endpoint: string; count: number }>;
    topUsers: Array<{ userId: number; count: number }>;
  }> {
    const db = getDb();
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const allUsage = await db
      .select()
      .from(apiRateLimits)
      .where(gte(apiRateLimits.timestamp, oneHourAgo));

    const totalRequests = allUsage.length;
    const uniqueUsers = new Set(allUsage.map((u) => u.userId)).size;
    const totalResponseTime = allUsage.reduce((sum, u) => sum + u.responseTime, 0);
    const averageResponseTime = totalRequests > 0 ? totalResponseTime / totalRequests : 0;

    const errorCount = allUsage.filter((u) => u.statusCode >= 400).length;
    const errorRate = totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0;

    // Get top endpoints
    const endpointMap = new Map<string, number>();
    allUsage.forEach((u) => {
      endpointMap.set(u.endpoint, (endpointMap.get(u.endpoint) || 0) + 1);
    });

    const topEndpoints = Array.from(endpointMap.entries())
      .map(([endpoint, count]) => ({ endpoint, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Get top users
    const userMap = new Map<number, number>();
    allUsage.forEach((u) => {
      userMap.set(u.userId, (userMap.get(u.userId) || 0) + 1);
    });

    const topUsers = Array.from(userMap.entries())
      .map(([userId, count]) => ({ userId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalRequests,
      uniqueUsers,
      averageResponseTime: Math.round(averageResponseTime),
      errorRate: Math.round(errorRate * 100) / 100,
      topEndpoints,
      topUsers,
    };
  }

  /**
   * Clean up old rate limit entries
   */
  static async cleanupOldEntries(): Promise<number> {
    const db = getDb();
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Note: This requires a proper delete implementation in your Drizzle setup
    // For now, just log the intention
    console.log(`Rate limit cleanup: Would delete entries older than ${twentyFourHoursAgo.toISOString()}`);

    return 0;
  }

  /**
   * Clear in-memory rate limit store (for testing)
   */
  static clearStore(): void {
    rateLimitStore.clear();
  }

  /**
   * Get window in milliseconds
   */
  private static getWindowMs(window: RateLimitWindow): number {
    switch (window) {
      case "minute":
        return 60 * 1000;
      case "hour":
        return 60 * 60 * 1000;
      case "day":
        return 24 * 60 * 60 * 1000;
      default:
        return 60 * 1000;
    }
  }

  /**
   * Get default limit for tier
   */
  static getDefaultLimit(tier: UserTier): number {
    return DEFAULT_LIMITS[tier];
  }

  /**
   * Get endpoint-specific limit
   */
  static getEndpointLimit(endpoint: string, tier: UserTier): number {
    return ENDPOINT_LIMITS[endpoint]?.[tier] ?? DEFAULT_LIMITS[tier];
  }

  /**
   * Get all endpoint limits
   */
  static getAllEndpointLimits(): Record<string, Record<UserTier, number>> {
    return ENDPOINT_LIMITS;
  }
}
