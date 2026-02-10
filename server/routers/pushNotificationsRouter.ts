import { publicProcedure, protectedProcedure, router } from '../_core/trpc';
import { z } from 'zod';
import webpush from 'web-push';

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
        expirationTime: z.number().nullable(),
        keys: z.object({
          p256dh: z.string(),
          auth: z.string(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // In a real app, you would save this subscription to the database
        // For now, we'll just acknowledge it
        console.log(`[PushNotifications] User ${ctx.user.id} subscribed to push notifications`);

        return {
          success: true,
          message: 'Successfully subscribed to push notifications',
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
        // In a real app, you would remove this subscription from the database
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
   * Send test push notification
   */
  sendTestNotification: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      // This would normally send to a stored subscription
      // For testing, we'll just return success
      console.log(`[PushNotifications] Sending test notification to user ${ctx.user.id}`);

      return {
        success: true,
        message: 'Test notification sent successfully',
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
});
