import { getDb } from "../db";
import { pushSubscriptions, notificationDeliveryLog, userNotificationPreferences } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

/**
 * Save or update a push subscription
 */
export async function savePushSubscription(
  userId: number,
  endpoint: string,
  auth: string,
  p256dh: string,
  expirationTime?: string,
  userAgent?: string
) {
  const db = await getDb();
  
  try {
    const existing = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.endpoint, endpoint))
      .limit(1);

    if (existing.length > 0) {
      // Update existing subscription
      await db
        .update(pushSubscriptions)
        .set({
          userId,
          auth,
          p256dh,
          expirationTime,
          userAgent,
          isActive: true,
          updatedAt: new Date(),
        })
        .where(eq(pushSubscriptions.endpoint, endpoint));

      return { success: true, created: false, id: existing[0].id };
    } else {
      // Create new subscription
      const result = await db.insert(pushSubscriptions).values({
        userId,
        endpoint,
        auth,
        p256dh,
        expirationTime,
        userAgent,
        isActive: true,
      });

      return { success: true, created: true, id: result.insertId };
    }
  } catch (error) {
    console.error("[PushSubscriptions] Error saving subscription:", error);
    throw error;
  }
}

/**
 * Get all active subscriptions for a user
 */
export async function getUserSubscriptions(userId: number) {
  const db = await getDb();
  
  try {
    const subscriptions = await db
      .select()
      .from(pushSubscriptions)
      .where(and(eq(pushSubscriptions.userId, userId), eq(pushSubscriptions.isActive, true)));

    return subscriptions;
  } catch (error) {
    console.error("[PushSubscriptions] Error getting user subscriptions:", error);
    throw error;
  }
}

/**
 * Remove a push subscription
 */
export async function removePushSubscription(endpoint: string) {
  const db = await getDb();
  
  try {
    await db
      .update(pushSubscriptions)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(pushSubscriptions.endpoint, endpoint));

    return { success: true };
  } catch (error) {
    console.error("[PushSubscriptions] Error removing subscription:", error);
    throw error;
  }
}

/**
 * Get all active subscriptions for a farm (all users in the farm)
 */
export async function getFarmSubscriptions(farmId: number) {
  const db = await getDb();
  
  try {
    // This would need to join with farm members table
    // For now, returning empty array as placeholder
    const subscriptions = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.isActive, true));

    return subscriptions;
  } catch (error) {
    console.error("[PushSubscriptions] Error getting farm subscriptions:", error);
    throw error;
  }
}

/**
 * Log a notification delivery
 */
export async function logNotificationDelivery(
  userId: number,
  notificationType: string,
  title: string,
  message: string,
  channel: "push" | "email" | "sms",
  priority: "low" | "medium" | "high" | "urgent" = "medium",
  relatedId?: number,
  relatedType?: string,
  actionUrl?: string
) {
  const db = await getDb();
  
  try {
    const result = await db.insert(notificationDeliveryLog).values({
      userId,
      notificationType,
      title,
      message,
      channel,
      deliveryStatus: "pending",
      priority,
      relatedId,
      relatedType,
      actionUrl,
      isRead: false,
      retryCount: 0,
    });

    return { success: true, id: result.insertId };
  } catch (error) {
    console.error("[NotificationDeliveryLog] Error logging notification:", error);
    throw error;
  }
}

/**
 * Update notification delivery status
 */
export async function updateNotificationStatus(
  logId: number,
  status: "sent" | "delivered" | "failed" | "bounced",
  error?: string
) {
  const db = await getDb();
  
  try {
    await db
      .update(notificationDeliveryLog)
      .set({
        deliveryStatus: status,
        deliveryError: error,
        sentAt: status !== "pending" ? new Date() : undefined,
        updatedAt: new Date(),
      })
      .where(eq(notificationDeliveryLog.id, logId));

    return { success: true };
  } catch (error) {
    console.error("[NotificationDeliveryLog] Error updating status:", error);
    throw error;
  }
}

/**
 * Get user notification preferences
 */
export async function getUserNotificationPreferences(userId: number) {
  const db = await getDb();
  
  try {
    const prefs = await db
      .select()
      .from(userNotificationPreferences)
      .where(eq(userNotificationPreferences.userId, userId))
      .limit(1);

    if (prefs.length > 0) {
      return prefs[0];
    }

    // Create default preferences if not exists
    await db.insert(userNotificationPreferences).values({
      userId,
      breedingReminders: true,
      stockAlerts: true,
      weatherAlerts: true,
      vaccinationReminders: true,
      harvestReminders: true,
      marketplaceUpdates: true,
      iotSensorAlerts: true,
      trainingReminders: true,
      pushNotificationsEnabled: true,
      emailNotificationsEnabled: true,
      smsNotificationsEnabled: false,
      quietHoursEnabled: false,
      timezone: "UTC",
    });

    return {
      userId,
      breedingReminders: true,
      stockAlerts: true,
      weatherAlerts: true,
      vaccinationReminders: true,
      harvestReminders: true,
      marketplaceUpdates: true,
      iotSensorAlerts: true,
      trainingReminders: true,
      pushNotificationsEnabled: true,
      emailNotificationsEnabled: true,
      smsNotificationsEnabled: false,
      quietHoursEnabled: false,
      timezone: "UTC",
    };
  } catch (error) {
    console.error("[UserNotificationPreferences] Error getting preferences:", error);
    throw error;
  }
}

/**
 * Update user notification preferences
 */
export async function updateUserNotificationPreferences(
  userId: number,
  preferences: Partial<typeof userNotificationPreferences.$inferInsert>
) {
  const db = await getDb();
  
  try {
    await db
      .update(userNotificationPreferences)
      .set({ ...preferences, updatedAt: new Date() })
      .where(eq(userNotificationPreferences.userId, userId));

    return { success: true };
  } catch (error) {
    console.error("[UserNotificationPreferences] Error updating preferences:", error);
    throw error;
  }
}

/**
 * Get pending notifications for retry
 */
export async function getPendingNotificationsForRetry(maxRetries: number = 3) {
  const db = await getDb();
  
  try {
    const pending = await db
      .select()
      .from(notificationDeliveryLog)
      .where(
        and(
          eq(notificationDeliveryLog.deliveryStatus, "pending"),
          // Add retry count check if needed
        )
      );

    return pending;
  } catch (error) {
    console.error("[NotificationDeliveryLog] Error getting pending notifications:", error);
    throw error;
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(logId: number) {
  const db = await getDb();
  
  try {
    await db
      .update(notificationDeliveryLog)
      .set({
        isRead: true,
        readAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(notificationDeliveryLog.id, logId));

    return { success: true };
  } catch (error) {
    console.error("[NotificationDeliveryLog] Error marking as read:", error);
    throw error;
  }
}

/**
 * Get unread notification count for user
 */
export async function getUnreadNotificationCount(userId: number) {
  const db = await getDb();
  
  try {
    const result = await db
      .select()
      .from(notificationDeliveryLog)
      .where(
        and(
          eq(notificationDeliveryLog.userId, userId),
          eq(notificationDeliveryLog.isRead, false)
        )
      );

    return result.length;
  } catch (error) {
    console.error("[NotificationDeliveryLog] Error getting unread count:", error);
    throw error;
  }
}
