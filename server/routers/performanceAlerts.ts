import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getDb } from "../db";

export const performanceAlertsRouter = router({
  // Get alerts for a user
  getMyAlerts: protectedProcedure
    .input(z.object({
      farmId: z.string().optional(),
      limit: z.number().default(20),
      offset: z.number().default(0),
      unreadOnly: z.boolean().default(false)
    }))
    .query(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        let query = `SELECT id, alertType, severity, message, isRead, createdAt
                     FROM performance_alerts
                     WHERE userId = ?`;
        const params: any[] = [ctx.user.id];

        if (input.farmId) {
          query += ` AND farmId = ?`;
          params.push(parseInt(input.farmId));
        }

        if (input.unreadOnly) {
          query += ` AND isRead = FALSE`;
        }

        query += ` ORDER BY createdAt DESC LIMIT ? OFFSET ?`;
        params.push(input.limit, input.offset);

        const alerts = await db.query.raw(query, params);
        return alerts || [];
      } catch (error) {
        console.error("Error fetching alerts:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch alerts"
        });
      }
    }),

  // Get alerts for a worker (manager view)
  getWorkerAlerts: protectedProcedure
    .input(z.object({
      farmId: z.string(),
      userId: z.string(),
      limit: z.number().default(20)
    }))
    .query(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        // Verify user has access to the farm
        const hasAccess = await db.query.raw(
          `SELECT fw.role FROM farm_workers fw
           WHERE fw.userId = ? AND fw.farmId = ? AND fw.status = 'active'`,
          [ctx.user.id, parseInt(input.farmId)]
        );

        if (!hasAccess || hasAccess.length === 0) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have access to view this worker's alerts"
          });
        }

        const alerts = await db.query.raw(
          `SELECT id, alertType, severity, message, isRead, createdAt, actionTaken
           FROM performance_alerts
           WHERE userId = ? AND farmId = ?
           ORDER BY createdAt DESC
           LIMIT ?`,
          [input.userId, parseInt(input.farmId), input.limit]
        );

        return alerts || [];
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Error fetching worker alerts:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch worker alerts"
        });
      }
    }),

  // Mark alert as read
  markAsRead: protectedProcedure
    .input(z.object({ alertId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        // Verify alert belongs to user
        const alert = await db.query.raw(
          `SELECT userId FROM performance_alerts WHERE id = ?`,
          [input.alertId]
        );

        if (!alert || alert.length === 0 || alert[0].userId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have permission to update this alert"
          });
        }

        await db.query.raw(
          `UPDATE performance_alerts SET isRead = TRUE, readAt = NOW() WHERE id = ?`,
          [input.alertId]
        );

        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Error marking alert as read:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to mark alert as read"
        });
      }
    }),

  // Create alert (internal use)
  createAlert: protectedProcedure
    .input(z.object({
      userId: z.string(),
      farmId: z.string(),
      alertType: z.enum(["low_activity", "low_quality", "high_absence", "task_overdue", "attendance_drop"]),
      severity: z.enum(["low", "medium", "high", "critical"]),
      message: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        // Verify user is manager or admin
        const userRole = await db.query.raw(
          `SELECT fw.role FROM farm_workers fw
           WHERE fw.userId = ? AND fw.farmId = ? AND fw.status = 'active'`,
          [ctx.user.id, parseInt(input.farmId)]
        );

        if (!userRole || userRole.length === 0 || !["manager", "admin"].includes(userRole[0].role)) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have permission to create alerts"
          });
        }

        // Check if similar alert already exists (avoid duplicates)
        const existing = await db.query.raw(
          `SELECT id FROM performance_alerts
           WHERE userId = ? AND farmId = ? AND alertType = ? AND isRead = FALSE
           AND createdAt > DATE_SUB(NOW(), INTERVAL 1 HOUR)`,
          [input.userId, parseInt(input.farmId), input.alertType]
        );

        if (existing && existing.length > 0) {
          return {
            success: false,
            message: "Similar alert already exists"
          };
        }

        await db.query.raw(
          `INSERT INTO performance_alerts (userId, farmId, alertType, severity, message)
           VALUES (?, ?, ?, ?, ?)`,
          [input.userId, parseInt(input.farmId), input.alertType, input.severity, input.message]
        );

        return {
          success: true,
          message: "Alert created successfully"
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Error creating alert:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create alert"
        });
      }
    }),

  // Get alert summary
  getAlertSummary: protectedProcedure
    .input(z.object({ farmId: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        // Verify user has access
        const hasAccess = await db.query.raw(
          `SELECT fw.role FROM farm_workers fw
           WHERE fw.userId = ? AND fw.farmId = ? AND fw.status = 'active'`,
          [ctx.user.id, parseInt(input.farmId)]
        );

        if (!hasAccess || hasAccess.length === 0) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have access to view alerts for this farm"
          });
        }

        const summary = await db.query.raw(
          `SELECT 
             COUNT(*) as totalAlerts,
             SUM(CASE WHEN isRead = FALSE THEN 1 ELSE 0 END) as unreadAlerts,
             SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) as criticalAlerts,
             SUM(CASE WHEN severity = 'high' THEN 1 ELSE 0 END) as highAlerts,
             SUM(CASE WHEN severity = 'medium' THEN 1 ELSE 0 END) as mediumAlerts,
             SUM(CASE WHEN severity = 'low' THEN 1 ELSE 0 END) as lowAlerts
           FROM performance_alerts
           WHERE farmId = ? AND createdAt > DATE_SUB(NOW(), INTERVAL 30 DAY)`,
          [parseInt(input.farmId)]
        );

        return summary?.[0] || {
          totalAlerts: 0,
          unreadAlerts: 0,
          criticalAlerts: 0,
          highAlerts: 0,
          mediumAlerts: 0,
          lowAlerts: 0
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Error fetching alert summary:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch alert summary"
        });
      }
    })
});
