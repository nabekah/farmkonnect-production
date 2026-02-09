import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { TRPCError } from "@trpc/server";
import { notifications } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

export const notificationRouter = router({
  getAll: protectedProcedure
    .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      const limit = input?.limit || 50;
      const offset = input?.offset || 0;
      return await db.select().from(notifications)
        .where(eq(notifications.userId, ctx.user.id))
        .orderBy((n: any) => [n.createdAt])
        .limit(limit)
        .offset(offset);
    }),

  getUnread: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      return await db.select().from(notifications)
        .where(and(eq(notifications.userId, ctx.user.id), eq(notifications.isRead, false)))
        .orderBy((n: any) => [n.createdAt]);
    }),

  markAsRead: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      return await db.update(notifications)
        .set({ isRead: true, readAt: new Date() })
        .where(eq(notifications.id, input.id));
    }),

  markAllAsRead: protectedProcedure
    .mutation(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      return await db.update(notifications)
        .set({ isRead: true, readAt: new Date() })
        .where(eq(notifications.userId, ctx.user.id));
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      return await db.delete(notifications).where(eq(notifications.id, input.id));
    }),

  create: protectedProcedure
    .input(z.object({
      type: z.enum(["vaccination_due", "vaccination_overdue", "breeding_due", "breeding_overdue", "health_alert", "performance_alert", "feed_low", "task_reminder", "system_alert"]),
      title: z.string(),
      message: z.string(),
      relatedAnimalId: z.number().optional(),
      relatedBreedingId: z.number().optional(),
      relatedVaccinationId: z.number().optional(),
      priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
      actionUrl: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      return await db.insert(notifications).values({
        userId: ctx.user.id,
        type: input.type,
        title: input.title,
        message: input.message,
        relatedAnimalId: input.relatedAnimalId,
        relatedBreedingId: input.relatedBreedingId,
        relatedVaccinationId: input.relatedVaccinationId,
        priority: input.priority,
        actionUrl: input.actionUrl,
      });
    }),
});
