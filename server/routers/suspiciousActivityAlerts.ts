import { router, protectedProcedure, adminProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { sql, eq, and, gte, desc } from "drizzle-orm";

const FAILED_ATTEMPTS_THRESHOLD = 5; // Alert after 5 failed attempts
const FAILED_ATTEMPTS_WINDOW = 15 * 60 * 1000; // Within 15 minutes
const GEOGRAPHIC_ANOMALY_THRESHOLD = 1000; // km - alert if login from very different location

export const suspiciousActivityAlertsRouter = router({
  // Check for suspicious activity and create alerts
  checkAndCreateAlerts: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    const alerts = [];

    // Check for multiple failed attempts from same IP
    const failedAttemptsResult = await db.execute(sql`
      SELECT 
        ipAddress,
        COUNT(*) as failureCount,
        MAX(timestamp) as lastAttempt
      FROM authAnalytics
      WHERE 
        success = false 
        AND timestamp > DATE_SUB(NOW(), INTERVAL 15 MINUTE)
      GROUP BY ipAddress
      HAVING COUNT(*) >= ${FAILED_ATTEMPTS_THRESHOLD}
      ORDER BY failureCount DESC
      LIMIT 10
    `);

    for (const attempt of failedAttemptsResult as any[]) {
      alerts.push({
        type: "multiple_failed_attempts",
        severity: "high",
        ipAddress: attempt.ipAddress,
        failureCount: attempt.failureCount,
        description: `${attempt.failureCount} failed login attempts from IP ${attempt.ipAddress} in the last 15 minutes`,
      });
    }

    // Check for geographic anomalies (same user logging in from different locations)
    const geoAnomaliesResult = await db.execute(sql`
      SELECT 
        userId,
        COUNT(DISTINCT ipAddress) as uniqueIPs,
        GROUP_CONCAT(DISTINCT ipAddress) as ipAddresses,
        MAX(timestamp) as lastLogin
      FROM authAnalytics
      WHERE 
        userId IS NOT NULL
        AND success = true
        AND timestamp > DATE_SUB(NOW(), INTERVAL 1 HOUR)
      GROUP BY userId
      HAVING COUNT(DISTINCT ipAddress) > 1
    `);

    for (const anomaly of geoAnomaliesResult as any[]) {
      alerts.push({
        type: "geographic_anomaly",
        severity: "medium",
        userId: anomaly.userId,
        ipAddresses: anomaly.ipAddresses,
        description: `User ${anomaly.userId} logged in from ${anomaly.uniqueIPs} different IP addresses in the last hour`,
      });
    }

    // Store alerts in database
    for (const alert of alerts) {
      await db.execute(sql`
        INSERT INTO suspiciousActivityAlerts (
          type,
          severity,
          userId,
          ipAddress,
          description,
          createdAt,
          acknowledged
        ) VALUES (
          ${alert.type},
          ${alert.severity},
          ${alert.userId || null},
          ${alert.ipAddress || null},
          ${alert.description},
          NOW(),
          false
        )
      `);
    }

    return { alertsCreated: alerts.length, alerts };
  }),

  // Get all suspicious activity alerts (admin only)
  getAlerts: adminProcedure
    .input(
      z.object({
        limit: z.number().default(50),
        offset: z.number().default(0),
        severity: z.enum(["low", "medium", "high"]).optional(),
        acknowledged: z.boolean().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      let query = sql`
        SELECT 
          id,
          type,
          severity,
          userId,
          ipAddress,
          description,
          createdAt,
          acknowledged
        FROM suspiciousActivityAlerts
        WHERE 1=1
      `;

      if (input.severity) {
        query = sql`${query} AND severity = ${input.severity}`;
      }

      if (input.acknowledged !== undefined) {
        query = sql`${query} AND acknowledged = ${input.acknowledged}`;
      }

      query = sql`
        ${query}
        ORDER BY createdAt DESC
        LIMIT ${input.limit}
        OFFSET ${input.offset}
      `;

      const alerts = await db.execute(query);
      return alerts;
    }),

  // Acknowledge an alert (admin only)
  acknowledgeAlert: adminProcedure
    .input(z.object({ alertId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      await db.execute(sql`
        UPDATE suspiciousActivityAlerts
        SET acknowledged = true
        WHERE id = ${input.alertId}
      `);

      return { success: true };
    }),

  // Get alert statistics
  getAlertStats: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    const stats = await db.execute(sql`
      SELECT 
        severity,
        COUNT(*) as count,
        SUM(CASE WHEN acknowledged = true THEN 1 ELSE 0 END) as acknowledged,
        SUM(CASE WHEN acknowledged = false THEN 1 ELSE 0 END) as unacknowledged
      FROM suspiciousActivityAlerts
      WHERE createdAt > DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY severity
    `);

    return stats;
  }),

  // Get alerts by user (admin only)
  getAlertsByUser: adminProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const alerts = await db.execute(sql`
        SELECT 
          id,
          type,
          severity,
          description,
          createdAt,
          acknowledged
        FROM suspiciousActivityAlerts
        WHERE userId = ${input.userId}
        ORDER BY createdAt DESC
        LIMIT 50
      `);

      return alerts;
    }),

  // Get alerts by IP address (admin only)
  getAlertsByIP: adminProcedure
    .input(z.object({ ipAddress: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const alerts = await db.execute(sql`
        SELECT 
          id,
          type,
          severity,
          userId,
          description,
          createdAt,
          acknowledged
        FROM suspiciousActivityAlerts
        WHERE ipAddress = ${input.ipAddress}
        ORDER BY createdAt DESC
        LIMIT 50
      `);

      return alerts;
    }),
});
