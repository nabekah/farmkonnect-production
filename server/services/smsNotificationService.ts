import twilio from 'twilio';
import { logNotificationDelivery, updateNotificationStatus } from '../db/pushSubscriptions';

const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

let twilioClient: ReturnType<typeof twilio> | null = null;

if (twilioAccountSid && twilioAuthToken) {
  twilioClient = twilio(twilioAccountSid, twilioAuthToken);
}

interface SMSNotificationPayload {
  userId: number;
  phoneNumber: string;
  message: string;
  notificationType: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  relatedId?: number;
  relatedType?: string;
}

/**
 * Send SMS notification using Twilio
 */
export async function sendSMSNotification(payload: SMSNotificationPayload): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  if (!twilioClient || !twilioPhoneNumber) {
    console.warn('[SMSNotification] Twilio credentials not configured');
    return {
      success: false,
      error: 'Twilio credentials not configured',
    };
  }

  try {
    // Log the notification first
    const logResult = await logNotificationDelivery(
      payload.userId,
      payload.notificationType,
      'SMS: ' + payload.message.substring(0, 50),
      payload.message,
      'sms',
      payload.priority || 'medium',
      payload.relatedId,
      payload.relatedType
    );

    const message = await twilioClient.messages.create({
      body: payload.message,
      from: twilioPhoneNumber,
      to: payload.phoneNumber,
    });

    // Update the log with sent status
    if (logResult.success) {
      await updateNotificationStatus(logResult.id, 'sent');
    }

    console.log(`[SMSNotification] SMS sent to ${payload.phoneNumber} (Message ID: ${message.sid})`);

    return {
      success: true,
      messageId: message.sid,
    };
  } catch (error) {
    console.error('[SMSNotification] Error sending SMS:', error);

    // Log the failure
    try {
      const logResult = await logNotificationDelivery(
        payload.userId,
        payload.notificationType,
        'SMS: ' + payload.message.substring(0, 50),
        payload.message,
        'sms',
        payload.priority || 'medium',
        payload.relatedId,
        payload.relatedType
      );

      if (logResult.success) {
        await updateNotificationStatus(
          logResult.id,
          'failed',
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
    } catch (logError) {
      console.error('[SMSNotification] Error logging failed notification:', logError);
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send breeding reminder SMS
 */
export async function sendBreedingReminderSMS(
  userId: number,
  phoneNumber: string,
  animalName: string,
  daysUntilDue: number
): Promise<{ success: boolean; error?: string }> {
  const message = `FarmKonnect: ${animalName} is due for breeding in ${daysUntilDue} days. Please take necessary steps for breeding management.`;

  return sendSMSNotification({
    userId,
    phoneNumber,
    message,
    notificationType: 'breeding_reminder',
    priority: daysUntilDue <= 3 ? 'high' : 'medium',
    relatedType: 'animal',
  });
}

/**
 * Send stock alert SMS
 */
export async function sendStockAlertSMS(
  userId: number,
  phoneNumber: string,
  itemName: string,
  currentStock: number
): Promise<{ success: boolean; error?: string }> {
  const message = `FarmKonnect: Stock alert! ${itemName} is low (Current: ${currentStock}). Please reorder.`;

  return sendSMSNotification({
    userId,
    phoneNumber,
    message,
    notificationType: 'stock_alert',
    priority: 'high',
    relatedType: 'inventory',
  });
}

/**
 * Send weather alert SMS
 */
export async function sendWeatherAlertSMS(
  userId: number,
  phoneNumber: string,
  alertType: string,
  severity: 'low' | 'medium' | 'high' | 'critical'
): Promise<{ success: boolean; error?: string }> {
  const message = `FarmKonnect: ${alertType} alert (${severity.toUpperCase()}). Please take necessary precautions for your farm.`;

  return sendSMSNotification({
    userId,
    phoneNumber,
    message,
    notificationType: 'weather_alert',
    priority: severity === 'critical' ? 'urgent' : severity === 'high' ? 'high' : 'medium',
    relatedType: 'weather',
  });
}

/**
 * Send vaccination reminder SMS
 */
export async function sendVaccinationReminderSMS(
  userId: number,
  phoneNumber: string,
  animalName: string,
  vaccinationType: string,
  daysUntilDue: number
): Promise<{ success: boolean; error?: string }> {
  const message = `FarmKonnect: ${animalName} needs ${vaccinationType} vaccination in ${daysUntilDue} days. Schedule an appointment with your veterinarian.`;

  return sendSMSNotification({
    userId,
    phoneNumber,
    message,
    notificationType: 'vaccination_reminder',
    priority: daysUntilDue <= 3 ? 'high' : 'medium',
    relatedType: 'health',
  });
}

/**
 * Send harvest reminder SMS
 */
export async function sendHarvestReminderSMS(
  userId: number,
  phoneNumber: string,
  cropName: string,
  daysUntilHarvest: number
): Promise<{ success: boolean; error?: string }> {
  const message = `FarmKonnect: ${cropName} is ready for harvest in ${daysUntilHarvest} days. Please prepare for harvesting.`;

  return sendSMSNotification({
    userId,
    phoneNumber,
    message,
    notificationType: 'harvest_reminder',
    priority: daysUntilHarvest <= 3 ? 'high' : 'medium',
    relatedType: 'crop',
  });
}

/**
 * Send marketplace order notification SMS
 */
export async function sendMarketplaceOrderSMS(
  userId: number,
  phoneNumber: string,
  orderNumber: string,
  status: string
): Promise<{ success: boolean; error?: string }> {
  const message = `FarmKonnect: Your order #${orderNumber} status has been updated to ${status}.`;

  return sendSMSNotification({
    userId,
    phoneNumber,
    message,
    notificationType: 'marketplace_order',
    priority: 'medium',
    relatedType: 'order',
  });
}

/**
 * Send IoT sensor alert SMS
 */
export async function sendIoTSensorAlertSMS(
  userId: number,
  phoneNumber: string,
  sensorName: string,
  alertMessage: string,
  severity: 'low' | 'medium' | 'high' | 'critical'
): Promise<{ success: boolean; error?: string }> {
  const message = `FarmKonnect: ${sensorName} alert (${severity.toUpperCase()}): ${alertMessage}`;

  return sendSMSNotification({
    userId,
    phoneNumber,
    message,
    notificationType: 'iot_sensor_alert',
    priority: severity === 'critical' ? 'urgent' : severity === 'high' ? 'high' : 'medium',
    relatedType: 'iot',
  });
}

/**
 * Send training session reminder SMS
 */
export async function sendTrainingReminderSMS(
  userId: number,
  phoneNumber: string,
  trainingName: string,
  startTime: string
): Promise<{ success: boolean; error?: string }> {
  const message = `FarmKonnect: Reminder! ${trainingName} starts at ${startTime}. Don't miss it!`;

  return sendSMSNotification({
    userId,
    phoneNumber,
    message,
    notificationType: 'training_reminder',
    priority: 'medium',
    relatedType: 'training',
  });
}

/**
 * Check if SMS notifications are configured
 */
export function isSMSConfigured(): boolean {
  return !!(twilioClient && twilioPhoneNumber);
}

/**
 * Get SMS configuration status
 */
export function getSMSConfigurationStatus() {
  return {
    configured: isSMSConfigured(),
    hasAccountSid: !!twilioAccountSid,
    hasAuthToken: !!twilioAuthToken,
    hasPhoneNumber: !!twilioPhoneNumber,
  };
}
