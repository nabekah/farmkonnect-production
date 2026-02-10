import { publicProcedure, protectedProcedure, router } from '../_core/trpc';
import { z } from 'zod';
import webpush from 'web-push';
import {
  savePushSubscription,
  getUserSubscriptions,
  removePushSubscription,
  logNotificationDelivery,
  updateNotificationStatus,
  getUserNotificationPreferences,
  updateUserNotificationPreferences,
  getUnreadNotificationCount,
  markNotificationAsRead,
} from '../db/pushSubscriptions';

// Configure web-push with VAPID keys
const vapidPublicKey = process.env.VITE_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    'mailto:admin@farmkonnect.com',
    vapidPublicKey,
    vapidPrivateKey
  );
}

export const pushNotificationsRouter = router({
  /**
   * Subscribe to push notifications
   */
  subscribe: protectedProcedure
    .input(
      z.object({
        endpoint: z.string().url(),
        expirationTime: z.string().nullable().optional(),
        keys: z.object({
          p256dh: z.string(),
          auth: z.string(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const result = await savePushSubscription(
          ctx.user.id,
          input.endpoint,
          input.keys.auth,
          input.keys.p256dh,
          input.expirationTime || undefined,
          ctx.user.userAgent || undefined
        );

        console.log(`[PushNotifications] User ${ctx.user.id} subscribed to push notifications`);

        return {
          success: true,
          message: 'Successfully subscribed to push notifications',
          subscriptionId: result.id,
        };
      } catch (error) {
        console.error('[PushNotifications] Subscription error:', error);
        throw new Error('Failed to subscribe to push notifications');
      }
    }),

  /**
   * Unsubscribe from push notifications
   */
  unsubscribe: protectedProcedure
    .input(
      z.object({
        endpoint: z.string().url(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await removePushSubscription(input.endpoint);
        console.log(`[PushNotifications] User ${ctx.user.id} unsubscribed from push notifications`);

        return {
          success: true,
          message: 'Successfully unsubscribed from push notifications',
        };
      } catch (error) {
        console.error('[PushNotifications] Unsubscription error:', error);
        throw new Error('Failed to unsubscribe from push notifications');
      }
    }),

  /**
   * Get user's subscriptions
   */
  getSubscriptions: protectedProcedure.query(async ({ ctx }) => {
    try {
      const subscriptions = await getUserSubscriptions(ctx.user.id);
      return {
        success: true,
        subscriptions: subscriptions.map((sub) => ({
          id: sub.id,
          endpoint: sub.endpoint,
          isActive: sub.isActive,
          createdAt: sub.createdAt,
          lastUsed: sub.lastUsed,
        })),
      };
    } catch (error) {
      console.error('[PushNotifications] Error getting subscriptions:', error);
      throw new Error('Failed to get subscriptions');
    }
  }),

  /**
   * Send test push notification
   */
  sendTestNotification: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      const subscriptions = await getUserSubscriptions(ctx.user.id);

      if (subscriptions.length === 0) {
        return {
          success: false,
          message: 'No active push subscriptions found',
        };
      }

      const testPayload = JSON.stringify({
        title: 'FarmKonnect Test Notification',
        body: 'This is a test push notification from FarmKonnect',
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        tag: 'test-notification',
        requireInteraction: false,
      });

      let sentCount = 0;
      let failedCount = 0;

      for (const subscription of subscriptions) {
        try {
          await webpush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: {
                auth: subscription.auth,
                p256dh: subscription.p256dh,
              },
            },
            testPayload
          );
          sentCount++;
        } catch (error) {
          console.error('[PushNotifications] Failed to send test notification:', error);
          failedCount++;
        }
      }

      // Log the notification
      await logNotificationDelivery(
        ctx.user.id,
        'test',
        'Test Notification',
        'This is a test push notification from FarmKonnect',
        'push',
        'low'
      );

      return {
        success: true,
        message: `Test notification sent to ${sentCount} subscriptions (${failedCount} failed)`,
        sentCount,
        failedCount,
      };
    } catch (error) {
      console.error('[PushNotifications] Test notification error:', error);
      throw new Error('Failed to send test notification');
    }
  }),

  /**
   * Get VAPID public key
   */
  getVapidPublicKey: publicProcedure.query(async () => {
    if (!vapidPublicKey) {
      throw new Error('VAPID public key not configured');
    }

    return {
      vapidPublicKey,
    };
  }),

  /**
   * Check if push notifications are configured
   */
  isConfigured: publicProcedure.query(async () => {
    return {
      configured: !!(vapidPublicKey && vapidPrivateKey),
      hasPublicKey: !!vapidPublicKey,
      hasPrivateKey: !!vapidPrivateKey,
    };
  }),

  /**
   * Get user notification preferences
   */
  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    try {
      const preferences = await getUserNotificationPreferences(ctx.user.id);
      return {
        success: true,
        preferences,
      };
    } catch (error) {
      console.error('[NotificationPreferences] Error getting preferences:', error);
      throw new Error('Failed to get notification preferences');
    }
  }),

  /**
   * Update user notification preferences
   */
  updatePreferences: protectedProcedure
    .input(
      z.object({
        breedingReminders: z.boolean().optional(),
        stockAlerts: z.boolean().optional(),
        weatherAlerts: z.boolean().optional(),
        vaccinationReminders: z.boolean().optional(),
        harvestReminders: z.boolean().optional(),
        marketplaceUpdates: z.boolean().optional(),
        iotSensorAlerts: z.boolean().optional(),
        trainingReminders: z.boolean().optional(),
        pushNotificationsEnabled: z.boolean().optional(),
        emailNotificationsEnabled: z.boolean().optional(),
        smsNotificationsEnabled: z.boolean().optional(),
        quietHoursEnabled: z.boolean().optional(),
        quietHoursStart: z.string().optional(),
        quietHoursEnd: z.string().optional(),
        timezone: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await updateUserNotificationPreferences(ctx.user.id, input);
        return {
          success: true,
          message: 'Notification preferences updated',
        };
      } catch (error) {
        console.error('[NotificationPreferences] Error updating preferences:', error);
        throw new Error('Failed to update notification preferences');
      }
    }),

  /**
   * Get unread notification count
   */
  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    try {
      const count = await getUnreadNotificationCount(ctx.user.id);
      return {
        success: true,
        unreadCount: count,
      };
    } catch (error) {
      console.error('[NotificationDeliveryLog] Error getting unread count:', error);
      throw new Error('Failed to get unread notification count');
    }
  }),

  /**
   * Mark notification as read
   */
  markAsRead: protectedProcedure
    .input(z.object({ notificationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      try {
        await markNotificationAsRead(input.notificationId);
        return {
          success: true,
          message: 'Notification marked as read',
        };
      } catch (error) {
        console.error('[NotificationDeliveryLog] Error marking as read:', error);
        throw new Error('Failed to mark notification as read');
      }
    }),
});
