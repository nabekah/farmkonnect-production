import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { getDb } from '../db';
import { notifications } from '../../drizzle/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getWebSocketServer } from '../_core/websocket';

export const realtimeNotificationsRouter = router({
  /**
   * Get unread notifications for current user
   */
  getUnread: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();

    const unread = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, ctx.user.id),
          eq(notifications.isRead, false)
        )
      )
      .orderBy(desc(notifications.createdAt))
      .limit(50);

    return unread;
  }),

  /**
   * Get all notifications for current user with pagination
   */
  getAll: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();

      const userNotifications = await db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, ctx.user.id))
        .orderBy(desc(notifications.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return userNotifications;
    }),

  /**
   * Mark notification as read
   */
  markAsRead: protectedProcedure
    .input(z.object({ notificationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();

      // Verify notification belongs to user
      const notif = await db
        .select()
        .from(notifications)
        .where(
          and(
            eq(notifications.id, input.notificationId),
            eq(notifications.userId, ctx.user.id)
          )
        );

      if (notif.length === 0) {
        throw new Error('Notification not found');
      }

      await db
        .update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.id, input.notificationId));

      return { success: true };
    }),

  /**
   * Mark all notifications as read
   */
  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();

    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, ctx.user.id));

    return { success: true };
  }),

  /**
   * Delete notification
   */
  delete: protectedProcedure
    .input(z.object({ notificationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();

      // Verify notification belongs to user
      const notif = await db
        .select()
        .from(notifications)
        .where(
          and(
            eq(notifications.id, input.notificationId),
            eq(notifications.userId, ctx.user.id)
          )
        );

      if (notif.length === 0) {
        throw new Error('Notification not found');
      }

      await db
        .delete(notifications)
        .where(eq(notifications.id, input.notificationId));

      return { success: true };
    }),

  /**
   * Delete all notifications for user
   */
  deleteAll: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();

    await db
      .delete(notifications)
      .where(eq(notifications.userId, ctx.user.id));

    return { success: true };
  }),

  /**
   * Get notification statistics
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();

    const allNotifications = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, ctx.user.id));

    const unreadCount = allNotifications.filter((n) => !n.isRead).length;
    const totalCount = allNotifications.length;

    // Group by type
    const byType: Record<string, number> = {};
    allNotifications.forEach((n) => {
      byType[n.type] = (byType[n.type] || 0) + 1;
    });

    return {
      unreadCount,
      totalCount,
      byType,
    };
  }),

  /**
   * Subscribe to real-time notifications (WebSocket)
   * Note: This is handled by the WebSocket server directly
   * This procedure is for initializing the subscription
   */
  subscribe: protectedProcedure.mutation(async ({ ctx }) => {
    const wsServer = getWebSocketServer();

    if (!wsServer) {
      return {
        success: false,
        message: 'WebSocket server not available',
      };
    }

    return {
      success: true,
      message: 'Subscribed to real-time notifications',
      wsAvailable: true,
    };
  }),

  /**
   * Send test notification (for testing purposes)
   */
  sendTest: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        message: z.string(),
        type: z.enum([
          'farm_alert',
          'task_completed',
          'weather_alert',
          'crop_update',
          'system_alert',
        ]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const wsServer = getWebSocketServer();

      // Store notification in database
      const result = await db.insert(notifications).values({
        userId: ctx.user.id,
        type: input.type,
        title: input.title,
        message: input.message,
        data: JSON.stringify({}),
        isRead: false,
        createdAt: new Date(),
      });

      // Send via WebSocket if available
      if (wsServer) {
        wsServer.broadcastToUser(ctx.user.id, {
          type: 'notification',
          data: {
            type: input.type,
            title: input.title,
            message: input.message,
            timestamp: Date.now(),
          },
        });
      }

      return {
        success: true,
        message: 'Test notification sent',
      };
    }),
});
