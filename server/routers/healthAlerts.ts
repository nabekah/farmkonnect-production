import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { sql } from "drizzle-orm";

export const healthAlertsRouter = router({
  // Get all active health alerts for user's farm
  getActiveAlerts: protectedProcedure
    .input(z.object({ farmId: z.number().optional() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const farmId = input.farmId || 1;

      // Get overdue vaccinations
      const overdueVaccinations = await db.execute(
        sql`
          SELECT 
            a.id, a.tagId, a.breed, v.vaccineName, v.nextDueDate, 'vaccination' as alertType, 'high' as severity
          FROM animals a
          JOIN vaccinations v ON a.id = v.animalId
          WHERE a.farmId = ${farmId} AND v.nextDueDate < NOW() AND a.status = 'active'
          ORDER BY v.nextDueDate ASC
        `
      );

      // Get high severity health issues
      const healthIssues = await db.execute(
        sql`
          SELECT 
            a.id, a.tagId, a.breed, h.description, h.recordDate, 'health_issue' as alertType, h.severity
          FROM animals a
          JOIN healthRecords h ON a.id = h.animalId
          WHERE a.farmId = ${farmId} AND h.severity = 'high' AND h.recordDate > DATE_SUB(NOW(), INTERVAL 7 DAY) AND a.status = 'active'
          ORDER BY h.recordDate DESC
        `
      );

      // Get performance anomalies
      const performanceAnomalies = await db.execute(
        sql`
          SELECT 
            a.id, a.tagId, a.breed, p.metricType, p.value, p.unit, 'performance' as alertType, 'medium' as severity
          FROM animals a
          JOIN performanceMetrics p ON a.id = p.animalId
          WHERE a.farmId = ${farmId} AND p.recordDate > DATE_SUB(NOW(), INTERVAL 30 DAY) AND a.status = 'active'
          ORDER BY p.recordDate DESC
          LIMIT 10
        `
      );

      return {
        overdueVaccinations: (overdueVaccinations as any).rows || [],
        healthIssues: (healthIssues as any).rows || [],
        performanceAnomalies: (performanceAnomalies as any).rows || [],
        totalAlerts: 
          ((overdueVaccinations as any).rows?.length || 0) +
          ((healthIssues as any).rows?.length || 0) +
          ((performanceAnomalies as any).rows?.length || 0),
      };
    }),

  // Create health alert
  createAlert: protectedProcedure
    .input(
      z.object({
        animalId: z.number(),
        alertType: z.enum(["vaccination", "health_issue", "performance", "custom"]),
        severity: z.enum(["low", "medium", "high"]),
        message: z.string().min(1),
        dueDate: z.string(),
        status: z.enum(["active", "resolved"]).default("active"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const result = await db.execute(
        sql`
          INSERT INTO healthAlerts (animalId, alertType, severity, message, dueDate, status, createdAt)
          VALUES (${input.animalId}, ${input.alertType}, ${input.severity}, ${input.message}, ${input.dueDate}, ${input.status}, NOW())
        `
      );

      return { id: (result as any).insertId, ...input };
    }),

  // Resolve alert
  resolveAlert: protectedProcedure
    .input(z.object({ alertId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      await db.execute(
        sql`
          UPDATE healthAlerts
          SET status = 'resolved', resolvedAt = NOW()
          WHERE id = ${input.alertId}
        `
      );

      return { success: true };
    }),

  // Get alert statistics
  getAlertStats: protectedProcedure
    .input(z.object({ farmId: z.number().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const farmId = input.farmId || 1;

      const stats = await db.execute(
        sql`
          SELECT 
            alertType,
            severity,
            COUNT(*) as count,
            status
          FROM healthAlerts
          WHERE farmId = ${farmId}
          GROUP BY alertType, severity, status
        `
      );

      return (stats as any).rows || [];
    }),

  // Send alert notifications
  sendAlertNotifications: protectedProcedure
    .input(z.object({ alertIds: z.array(z.number()).min(1) }))
    .mutation(async ({ input, ctx }) => {
      // This would integrate with email/SMS service
      // For now, just mark as notified
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      for (const alertId of input.alertIds) {
        await db.execute(
          sql`
            UPDATE healthAlerts
            SET notificationSent = true, notificationSentAt = NOW()
            WHERE id = ${alertId}
          `
        );
      }

      return { success: true, notified: input.alertIds.length };
    }),
});
