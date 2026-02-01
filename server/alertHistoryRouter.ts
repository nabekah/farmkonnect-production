import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { alertHistory } from "../drizzle/schema";
import { eq, and, desc, gte, lte } from "drizzle-orm";

export const alertHistoryRouter = router({
  // List alerts with filters
  list: protectedProcedure
    .input(
      z.object({
        farmId: z.number().optional(),
        severity: z.enum(["critical", "warning", "info"]).optional(),
        alertType: z.enum(["health", "water_quality", "weather", "maintenance", "other"]).optional(),
        isRead: z.boolean().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const conditions = [eq(alertHistory.userId, ctx.user.id)];

      if (input.farmId) {
        conditions.push(eq(alertHistory.farmId, input.farmId));
      }

      if (input.severity) {
        conditions.push(eq(alertHistory.severity, input.severity));
      }

      if (input.alertType) {
        conditions.push(eq(alertHistory.alertType, input.alertType));
      }

      if (input.isRead !== undefined) {
        conditions.push(eq(alertHistory.isRead, input.isRead));
      }

      if (input.startDate) {
        conditions.push(gte(alertHistory.createdAt, new Date(input.startDate)));
      }

      if (input.endDate) {
        conditions.push(lte(alertHistory.createdAt, new Date(input.endDate)));
      }

      const alerts = await db
        .select()
        .from(alertHistory)
        .where(and(...conditions))
        .orderBy(desc(alertHistory.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      const total = await db
        .select({ count: alertHistory.id })
        .from(alertHistory)
        .where(and(...conditions));

      return {
        alerts,
        total: total.length,
        hasMore: input.offset + input.limit < total.length,
      };
    }),

  // Get unread count
  unreadCount: protectedProcedure
    .input(z.object({ farmId: z.number().optional() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const conditions = [
        eq(alertHistory.userId, ctx.user.id),
        eq(alertHistory.isRead, false),
      ];

      if (input.farmId) {
        conditions.push(eq(alertHistory.farmId, input.farmId));
      }

      const result = await db
        .select({ count: alertHistory.id })
        .from(alertHistory)
        .where(and(...conditions));

      return result.length;
    }),

  // Mark as read
  markAsRead: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(alertHistory)
        .set({ isRead: true, readAt: new Date() })
        .where(
          and(
            eq(alertHistory.id, input.id),
            eq(alertHistory.userId, ctx.user.id)
          )
        );

      return { success: true };
    }),

  // Mark all as read
  markAllAsRead: protectedProcedure
    .input(z.object({ farmId: z.number().optional() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const conditions = [
        eq(alertHistory.userId, ctx.user.id),
        eq(alertHistory.isRead, false),
      ];

      if (input.farmId) {
        conditions.push(eq(alertHistory.farmId, input.farmId));
      }

      await db
        .update(alertHistory)
        .set({ isRead: true, readAt: new Date() })
        .where(and(...conditions));

      return { success: true };
    }),

  // Acknowledge alert
  acknowledge: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        actionTaken: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get the alert to calculate response time
      const [alert] = await db
        .select()
        .from(alertHistory)
        .where(
          and(
            eq(alertHistory.id, input.id),
            eq(alertHistory.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!alert) {
        throw new Error("Alert not found");
      }

      // Calculate response time in minutes
      const responseTimeMinutes = Math.floor(
        (Date.now() - new Date(alert.createdAt).getTime()) / (1000 * 60)
      );

      await db
        .update(alertHistory)
        .set({
          isAcknowledged: true,
          acknowledgedAt: new Date(),
          acknowledgedBy: ctx.user.id,
          actionTaken: input.actionTaken || null,
          responseTimeMinutes,
        })
        .where(
          and(
            eq(alertHistory.id, input.id),
            eq(alertHistory.userId, ctx.user.id)
          )
        );

      return { success: true, responseTimeMinutes };
    }),

  // Get acknowledgment statistics
  getAcknowledgmentStats: protectedProcedure
    .input(z.object({ farmId: z.number().optional() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const conditions = [eq(alertHistory.userId, ctx.user.id)];

      if (input.farmId) {
        conditions.push(eq(alertHistory.farmId, input.farmId));
      }

      const alerts = await db
        .select()
        .from(alertHistory)
        .where(and(...conditions));

      const total = alerts.length;
      const acknowledged = alerts.filter((a) => a.isAcknowledged).length;
      const avgResponseTime =
        alerts
          .filter((a) => a.responseTimeMinutes !== null)
          .reduce((sum, a) => sum + (a.responseTimeMinutes || 0), 0) /
          (alerts.filter((a) => a.responseTimeMinutes !== null).length || 1);

      return {
        total,
        acknowledged,
        acknowledgmentRate: total > 0 ? (acknowledged / total) * 100 : 0,
        avgResponseTimeMinutes: Math.round(avgResponseTime),
      };
    }),

  // Delete alert
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .delete(alertHistory)
        .where(
          and(
            eq(alertHistory.id, input.id),
            eq(alertHistory.userId, ctx.user.id)
          )
        );

      return { success: true };
    }),
});
