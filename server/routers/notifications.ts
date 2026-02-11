import { router, protectedProcedure, publicProcedure } from "./_core/trpc";
import { z } from "zod";
import { db } from "../db";
import { notifications, users } from "@/drizzle/schema";
import { eq, desc, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const notificationsRouter = router({
  // Get user notifications
  getNotifications: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(20),
        offset: z.number().default(0),
        unreadOnly: z.boolean().default(false),
      })
    )
    .query(async ({ ctx, input }) => {
      const query = db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, ctx.user.id))
        .orderBy(desc(notifications.createdAt));

      if (input.unreadOnly) {
        query.where(eq(notifications.isRead, false));
      }

      const items = await query.limit(input.limit).offset(input.offset);
      const total = await db
        .select({ count: db.sql`count(*)` })
        .from(notifications)
        .where(eq(notifications.userId, ctx.user.id));

      return {
        items,
        total: total[0]?.count || 0,
        hasMore: (input.offset + input.limit) < (total[0]?.count || 0),
      };
    }),

  // Get unread count
  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    const result = await db
      .select({ count: db.sql`count(*)` })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, ctx.user.id),
          eq(notifications.isRead, false)
        )
      );

    return result[0]?.count || 0;
  }),

  // Mark notification as read
  markAsRead: protectedProcedure
    .input(z.object({ notificationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const notification = await db
        .select()
        .from(notifications)
        .where(eq(notifications.id, input.notificationId));

      if (!notification[0] || notification[0].userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      await db
        .update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.id, input.notificationId));

      return { success: true };
    }),

  // Mark all as read
  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, ctx.user.id));

    return { success: true };
  }),

  // Delete notification
  deleteNotification: protectedProcedure
    .input(z.object({ notificationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const notification = await db
        .select()
        .from(notifications)
        .where(eq(notifications.id, input.notificationId));

      if (!notification[0] || notification[0].userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      await db
        .delete(notifications)
        .where(eq(notifications.id, input.notificationId));

      return { success: true };
    }),

  // Get notification preferences
  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, ctx.user.id));

    if (!user[0]) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }

    return {
      emailNotifications: user[0].emailNotifications ?? true,
      smsNotifications: user[0].smsNotifications ?? false,
      pushNotifications: user[0].pushNotifications ?? true,
      budgetAlerts: user[0].budgetAlerts ?? true,
      appointmentReminders: user[0].appointmentReminders ?? true,
      lowStockAlerts: user[0].lowStockAlerts ?? true,
    };
  }),

  // Update notification preferences
  updatePreferences: protectedProcedure
    .input(
      z.object({
        emailNotifications: z.boolean().optional(),
        smsNotifications: z.boolean().optional(),
        pushNotifications: z.boolean().optional(),
        budgetAlerts: z.boolean().optional(),
        appointmentReminders: z.boolean().optional(),
        lowStockAlerts: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await db
        .update(users)
        .set({
          emailNotifications: input.emailNotifications,
          smsNotifications: input.smsNotifications,
          pushNotifications: input.pushNotifications,
          budgetAlerts: input.budgetAlerts,
          appointmentReminders: input.appointmentReminders,
          lowStockAlerts: input.lowStockAlerts,
        })
        .where(eq(users.id, ctx.user.id));

      return { success: true };
    }),

  // Create notification (admin/system use)
  createNotification: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        title: z.string(),
        message: z.string(),
        type: z.enum(["budget", "appointment", "stock", "system", "alert"]),
        actionUrl: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Only allow users to create notifications for themselves or admins to create for others
      if (input.userId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const notification = await db
        .insert(notifications)
        .values({
          id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          userId: input.userId,
          title: input.title,
          message: input.message,
          type: input.type,
          actionUrl: input.actionUrl,
          isRead: false,
          createdAt: new Date(),
        })
        .returning();

      return notification[0];
    }),

  // Clear old notifications (older than 30 days)
  clearOldNotifications: protectedProcedure.mutation(async ({ ctx }) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await db
      .delete(notifications)
      .where(
        and(
          eq(notifications.userId, ctx.user.id),
          eq(notifications.isRead, true)
        )
      );

    return { success: true, deletedCount: result.rowsAffected };
  }),

  // Get notification statistics
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const unread = await db
      .select({ count: db.sql`count(*)` })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, ctx.user.id),
          eq(notifications.isRead, false)
        )
      );

    const byType = await db
      .select({
        type: notifications.type,
        count: db.sql`count(*)`,
      })
      .from(notifications)
      .where(eq(notifications.userId, ctx.user.id))
      .groupBy(notifications.type);

    return {
      unreadCount: unread[0]?.count || 0,
      byType: byType.map((item: any) => ({
        type: item.type,
        count: item.count,
      })),
    };
  }),
});

export default notificationsRouter;
