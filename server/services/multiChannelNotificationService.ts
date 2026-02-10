import webpush from 'web-push';
import { getUserSubscriptions, getUserNotificationPreferences } from '../db/pushSubscriptions';
import {
  sendBreedingReminderEmail,
  sendStockAlertEmail,
  sendWeatherAlertEmail,
  sendVaccinationReminderEmail,
  sendHarvestReminderEmail,
  sendMarketplaceOrderEmail,
} from './emailNotificationService';
import {
  sendBreedingReminderSMS,
  sendStockAlertSMS,
  sendWeatherAlertSMS,
  sendVaccinationReminderSMS,
  sendHarvestReminderSMS,
  sendMarketplaceOrderSMS,
  sendIoTSensorAlertSMS,
  sendTrainingReminderSMS,
  isSMSConfigured,
} from './smsNotificationService';

const vapidPublicKey = process.env.VITE_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    'mailto:admin@farmkonnect.com',
    vapidPublicKey,
    vapidPrivateKey
  );
}

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
  data?: Record<string, unknown>;
}

/**
 * Send push notification to user's subscriptions
 */
async function sendPushNotification(
  userId: number,
  payload: NotificationPayload
): Promise<{ success: number; failed: number }> {
  try {
    const subscriptions = await getUserSubscriptions(userId);

    if (subscriptions.length === 0) {
      console.log(`[MultiChannel] No push subscriptions found for user ${userId}`);
      return { success: 0, failed: 0 };
    }

    const notificationPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/icon-192x192.png',
      badge: payload.badge || '/badge-72x72.png',
      tag: payload.tag || 'notification',
      requireInteraction: payload.requireInteraction || false,
      data: payload.data || {},
    });

    let successCount = 0;
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
          notificationPayload
        );
        successCount++;
      } catch (error) {
        console.error(`[MultiChannel] Failed to send push to subscription ${subscription.id}:`, error);
        failedCount++;
      }
    }

    console.log(`[MultiChannel] Push notifications sent: ${successCount} success, ${failedCount} failed`);
    return { success: successCount, failed: failedCount };
  } catch (error) {
    console.error('[MultiChannel] Error sending push notifications:', error);
    return { success: 0, failed: 1 };
  }
}

/**
 * Send breeding reminder through multiple channels
 */
export async function sendBreedingReminder(
  userId: number,
  userEmail: string,
  userPhone: string | null,
  animalName: string,
  daysUntilDue: number,
  actionUrl: string
): Promise<{ channels: Record<string, boolean> }> {
  const channels: Record<string, boolean> = {};

  try {
    const prefs = await getUserNotificationPreferences(userId);

    if (!prefs.breedingReminders) {
      console.log(`[MultiChannel] Breeding reminders disabled for user ${userId}`);
      return { channels };
    }

    // Send push notification
    if (prefs.pushNotificationsEnabled) {
      try {
        await sendPushNotification(userId, {
          title: 'Breeding Reminder',
          body: `${animalName} is due for breeding in ${daysUntilDue} days`,
          tag: 'breeding-reminder',
          data: { actionUrl },
        });
        channels.push = true;
      } catch (error) {
        console.error('[MultiChannel] Push notification failed:', error);
        channels.push = false;
      }
    }

    // Send email notification
    if (prefs.emailNotificationsEnabled && userEmail) {
      try {
        const result = await sendBreedingReminderEmail(userId, userEmail, animalName, daysUntilDue, actionUrl);
        channels.email = result.success;
      } catch (error) {
        console.error('[MultiChannel] Email notification failed:', error);
        channels.email = false;
      }
    }

    // Send SMS notification
    if (prefs.smsNotificationsEnabled && userPhone && isSMSConfigured()) {
      try {
        const result = await sendBreedingReminderSMS(userId, userPhone, animalName, daysUntilDue);
        channels.sms = result.success;
      } catch (error) {
        console.error('[MultiChannel] SMS notification failed:', error);
        channels.sms = false;
      }
    }

    return { channels };
  } catch (error) {
    console.error('[MultiChannel] Error sending breeding reminder:', error);
    return { channels };
  }
}

/**
 * Send stock alert through multiple channels
 */
export async function sendStockAlert(
  userId: number,
  userEmail: string,
  userPhone: string | null,
  itemName: string,
  currentStock: number,
  minimumThreshold: number,
  actionUrl: string
): Promise<{ channels: Record<string, boolean> }> {
  const channels: Record<string, boolean> = {};

  try {
    const prefs = await getUserNotificationPreferences(userId);

    if (!prefs.stockAlerts) {
      return { channels };
    }

    // Send push notification
    if (prefs.pushNotificationsEnabled) {
      try {
        await sendPushNotification(userId, {
          title: 'Stock Alert',
          body: `${itemName} stock is low (${currentStock} / ${minimumThreshold})`,
          tag: 'stock-alert',
          data: { actionUrl },
        });
        channels.push = true;
      } catch (error) {
        channels.push = false;
      }
    }

    // Send email notification
    if (prefs.emailNotificationsEnabled && userEmail) {
      try {
        const result = await sendStockAlertEmail(userId, userEmail, itemName, currentStock, minimumThreshold, actionUrl);
        channels.email = result.success;
      } catch (error) {
        channels.email = false;
      }
    }

    // Send SMS notification
    if (prefs.smsNotificationsEnabled && userPhone && isSMSConfigured()) {
      try {
        const result = await sendStockAlertSMS(userId, userPhone, itemName, currentStock);
        channels.sms = result.success;
      } catch (error) {
        channels.sms = false;
      }
    }

    return { channels };
  } catch (error) {
    console.error('[MultiChannel] Error sending stock alert:', error);
    return { channels };
  }
}

/**
 * Send weather alert through multiple channels
 */
export async function sendWeatherAlert(
  userId: number,
  userEmail: string,
  userPhone: string | null,
  alertType: string,
  description: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  actionUrl: string
): Promise<{ channels: Record<string, boolean> }> {
  const channels: Record<string, boolean> = {};

  try {
    const prefs = await getUserNotificationPreferences(userId);

    if (!prefs.weatherAlerts) {
      return { channels };
    }

    // Send push notification
    if (prefs.pushNotificationsEnabled) {
      try {
        await sendPushNotification(userId, {
          title: `Weather Alert: ${alertType}`,
          body: description,
          tag: 'weather-alert',
          requireInteraction: severity === 'critical' || severity === 'high',
          data: { actionUrl, severity },
        });
        channels.push = true;
      } catch (error) {
        channels.push = false;
      }
    }

    // Send email notification
    if (prefs.emailNotificationsEnabled && userEmail) {
      try {
        const result = await sendWeatherAlertEmail(userId, userEmail, alertType, description, severity, actionUrl);
        channels.email = result.success;
      } catch (error) {
        channels.email = false;
      }
    }

    // Send SMS notification
    if (prefs.smsNotificationsEnabled && userPhone && isSMSConfigured()) {
      try {
        const result = await sendWeatherAlertSMS(userId, userPhone, alertType, severity);
        channels.sms = result.success;
      } catch (error) {
        channels.sms = false;
      }
    }

    return { channels };
  } catch (error) {
    console.error('[MultiChannel] Error sending weather alert:', error);
    return { channels };
  }
}

/**
 * Send vaccination reminder through multiple channels
 */
export async function sendVaccinationReminder(
  userId: number,
  userEmail: string,
  userPhone: string | null,
  animalName: string,
  vaccinationType: string,
  daysUntilDue: number,
  actionUrl: string
): Promise<{ channels: Record<string, boolean> }> {
  const channels: Record<string, boolean> = {};

  try {
    const prefs = await getUserNotificationPreferences(userId);

    if (!prefs.vaccinationReminders) {
      return { channels };
    }

    // Send push notification
    if (prefs.pushNotificationsEnabled) {
      try {
        await sendPushNotification(userId, {
          title: 'Vaccination Reminder',
          body: `${animalName} needs ${vaccinationType} in ${daysUntilDue} days`,
          tag: 'vaccination-reminder',
          data: { actionUrl },
        });
        channels.push = true;
      } catch (error) {
        channels.push = false;
      }
    }

    // Send email notification
    if (prefs.emailNotificationsEnabled && userEmail) {
      try {
        const result = await sendVaccinationReminderEmail(userId, userEmail, animalName, vaccinationType, daysUntilDue, actionUrl);
        channels.email = result.success;
      } catch (error) {
        channels.email = false;
      }
    }

    // Send SMS notification
    if (prefs.smsNotificationsEnabled && userPhone && isSMSConfigured()) {
      try {
        const result = await sendVaccinationReminderSMS(userId, userPhone, animalName, vaccinationType, daysUntilDue);
        channels.sms = result.success;
      } catch (error) {
        channels.sms = false;
      }
    }

    return { channels };
  } catch (error) {
    console.error('[MultiChannel] Error sending vaccination reminder:', error);
    return { channels };
  }
}

/**
 * Send harvest reminder through multiple channels
 */
export async function sendHarvestReminder(
  userId: number,
  userEmail: string,
  userPhone: string | null,
  cropName: string,
  daysUntilHarvest: number,
  actionUrl: string
): Promise<{ channels: Record<string, boolean> }> {
  const channels: Record<string, boolean> = {};

  try {
    const prefs = await getUserNotificationPreferences(userId);

    if (!prefs.harvestReminders) {
      return { channels };
    }

    // Send push notification
    if (prefs.pushNotificationsEnabled) {
      try {
        await sendPushNotification(userId, {
          title: 'Harvest Reminder',
          body: `${cropName} is ready for harvest in ${daysUntilHarvest} days`,
          tag: 'harvest-reminder',
          data: { actionUrl },
        });
        channels.push = true;
      } catch (error) {
        channels.push = false;
      }
    }

    // Send email notification
    if (prefs.emailNotificationsEnabled && userEmail) {
      try {
        const result = await sendHarvestReminderEmail(userId, userEmail, cropName, daysUntilHarvest, actionUrl);
        channels.email = result.success;
      } catch (error) {
        channels.email = false;
      }
    }

    // Send SMS notification
    if (prefs.smsNotificationsEnabled && userPhone && isSMSConfigured()) {
      try {
        const result = await sendHarvestReminderSMS(userId, userPhone, cropName, daysUntilHarvest);
        channels.sms = result.success;
      } catch (error) {
        channels.sms = false;
      }
    }

    return { channels };
  } catch (error) {
    console.error('[MultiChannel] Error sending harvest reminder:', error);
    return { channels };
  }
}

/**
 * Send marketplace order notification through multiple channels
 */
export async function sendMarketplaceOrderNotification(
  userId: number,
  userEmail: string,
  userPhone: string | null,
  orderNumber: string,
  status: string,
  actionUrl: string
): Promise<{ channels: Record<string, boolean> }> {
  const channels: Record<string, boolean> = {};

  try {
    const prefs = await getUserNotificationPreferences(userId);

    if (!prefs.marketplaceUpdates) {
      return { channels };
    }

    // Send push notification
    if (prefs.pushNotificationsEnabled) {
      try {
        await sendPushNotification(userId, {
          title: 'Order Update',
          body: `Order #${orderNumber} is now ${status}`,
          tag: 'order-update',
          data: { actionUrl },
        });
        channels.push = true;
      } catch (error) {
        channels.push = false;
      }
    }

    // Send email notification
    if (prefs.emailNotificationsEnabled && userEmail) {
      try {
        const result = await sendMarketplaceOrderEmail(userId, userEmail, orderNumber, status, actionUrl);
        channels.email = result.success;
      } catch (error) {
        channels.email = false;
      }
    }

    // Send SMS notification
    if (prefs.smsNotificationsEnabled && userPhone && isSMSConfigured()) {
      try {
        const result = await sendMarketplaceOrderSMS(userId, userPhone, orderNumber, status);
        channels.sms = result.success;
      } catch (error) {
        channels.sms = false;
      }
    }

    return { channels };
  } catch (error) {
    console.error('[MultiChannel] Error sending marketplace order notification:', error);
    return { channels };
  }
}
