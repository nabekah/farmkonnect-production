import webpush from "web-push";
import { ENV } from "./env";

/**
 * Web Push Notifications Service
 * Sends real-time notifications to users' browsers
 */
class PushNotificationService {
  private isConfigured: boolean;

  constructor() {
    const vapidPublicKey = ENV.vapidPublicKey;
    const vapidPrivateKey = ENV.vapidPrivateKey;

    this.isConfigured = !!(vapidPublicKey && vapidPrivateKey);

    if (this.isConfigured) {
      webpush.setVapidDetails("mailto:noreply@farmconnekt.com", vapidPublicKey, vapidPrivateKey);
      console.log("[PushNotifications] Initialized with VAPID keys");
    } else {
      console.warn("[PushNotifications] Not configured. Push notifications will be mocked. Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY to enable real push.");
    }
  }

  /**
   * Send login alert push notification
   * @param subscription - Push subscription object
   * @param deviceInfo - Device information
   * @param location - Login location
   * @returns Success status
   */
  async sendLoginAlert(
    subscription: PushSubscription,
    deviceInfo: string,
    location: string
  ): Promise<{ success: boolean; error?: string }> {
    const notification = {
      title: "🔐 New Login Detected",
      body: `Login from ${deviceInfo} in ${location}`,
      icon: "/icon-192x192.png",
      badge: "/badge-72x72.png",
      tag: "login-alert",
      requireInteraction: true,
      actions: [
        { action: "verify", title: "Verify" },
        { action: "secure", title: "Secure Account" },
      ],
      data: {
        type: "login_alert",
        deviceInfo,
        location,
        timestamp: new Date().toISOString(),
      },
    };

    return this.sendNotification(subscription, notification);
  }

  /**
   * Send security alert push notification
   * @param subscription - Push subscription object
   * @param alertType - Type of security alert
   * @param details - Alert details
   * @returns Success status
   */
  async sendSecurityAlert(
    subscription: PushSubscription,
    alertType: string,
    details: string
  ): Promise<{ success: boolean; error?: string }> {
    const notification = {
      title: "⚠️ Security Alert",
      body: `${alertType}: ${details}`,
      icon: "/icon-192x192.png",
      badge: "/badge-72x72.png",
      tag: "security-alert",
      requireInteraction: true,
      actions: [
        { action: "review", title: "Review" },
        { action: "dismiss", title: "Dismiss" },
      ],
      data: {
        type: "security_alert",
        alertType,
        details,
        timestamp: new Date().toISOString(),
      },
    };

    return this.sendNotification(subscription, notification);
  }

  /**
   * Send 2FA verification push notification
   * @param subscription - Push subscription object
   * @param code - Verification code
   * @returns Success status
   */
  async send2FaVerification(subscription: PushSubscription, code: string): Promise<{ success: boolean; error?: string }> {
    const notification = {
      title: "🔑 2FA Verification",
      body: `Your verification code is: ${code}`,
      icon: "/icon-192x192.png",
      badge: "/badge-72x72.png",
      tag: "2fa-verification",
      requireInteraction: true,
      data: {
        type: "2fa_verification",
        code,
        timestamp: new Date().toISOString(),
      },
    };

    return this.sendNotification(subscription, notification);
  }

  /**
   * Send general notification push
   * @param subscription - Push subscription object
   * @param title - Notification title
   * @param body - Notification body
   * @param options - Additional notification options
   * @returns Success status
   */
  async sendNotification(
    subscription: PushSubscription,
    notification: {
      title: string;
      body: string;
      icon?: string;
      badge?: string;
      tag?: string;
      requireInteraction?: boolean;
      actions?: Array<{ action: string; title: string }>;
      data?: Record<string, any>;
    }
  ): Promise<{ success: boolean; error?: string }> {
    // If not configured, return mock response
    if (!this.isConfigured) {
      console.log(`[PushNotifications] Mock push: ${notification.title} - ${notification.body}`);
      return { success: true };
    }

    try {
      const payload = JSON.stringify(notification);
      await webpush.sendNotification(subscription, payload);
      return { success: true };
    } catch (error) {
      console.error("[PushNotifications] Failed to send notification:", error);

      // Handle subscription expiration
      if (error instanceof webpush.WebPushError && error.statusCode === 410) {
        return {
          success: false,
          error: "Subscription expired",
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to send notification",
      };
    }
  }

  /**
   * Get VAPID public key for frontend
   * @returns VAPID public key
   */
  getVapidPublicKey(): string {
    return ENV.vapidPublicKey || "";
  }
}

export const pushNotifications = new PushNotificationService();

/**
 * Push Subscription Interface
 */
export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}
