import sgMail from '@sendgrid/mail';
import { logNotificationDelivery, updateNotificationStatus } from '../db/pushSubscriptions';

const sendGridApiKey = process.env.SENDGRID_API_KEY;

if (sendGridApiKey) {
  sgMail.setApiKey(sendGridApiKey);
}

interface EmailNotificationPayload {
  userId: number;
  email: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  notificationType: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  relatedId?: number;
  relatedType?: string;
  actionUrl?: string;
}

/**
 * Send email notification using SendGrid
 */
export async function sendEmailNotification(payload: EmailNotificationPayload): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  if (!sendGridApiKey) {
    console.warn('[EmailNotification] SendGrid API key not configured');
    return {
      success: false,
      error: 'SendGrid API key not configured',
    };
  }

  try {
    // Log the notification first
    const logResult = await logNotificationDelivery(
      payload.userId,
      payload.notificationType,
      payload.subject,
      payload.textContent || payload.htmlContent,
      'email',
      payload.priority || 'medium',
      payload.relatedId,
      payload.relatedType,
      payload.actionUrl
    );

    const msg = {
      to: payload.email,
      from: 'noreply@farmkonnect.com',
      subject: payload.subject,
      text: payload.textContent || payload.htmlContent,
      html: payload.htmlContent,
      replyTo: 'support@farmkonnect.com',
    };

    const result = await sgMail.send(msg);

    // Update the log with sent status
    if (logResult.success) {
      await updateNotificationStatus(logResult.id, 'sent');
    }

    console.log(`[EmailNotification] Email sent to ${payload.email} (Message ID: ${result[0].headers['x-message-id']})`);

    return {
      success: true,
      messageId: result[0].headers['x-message-id'] as string,
    };
  } catch (error) {
    console.error('[EmailNotification] Error sending email:', error);

    // Log the failure
    try {
      const logResult = await logNotificationDelivery(
        payload.userId,
        payload.notificationType,
        payload.subject,
        payload.textContent || payload.htmlContent,
        'email',
        payload.priority || 'medium',
        payload.relatedId,
        payload.relatedType,
        payload.actionUrl
      );

      if (logResult.success) {
        await updateNotificationStatus(
          logResult.id,
          'failed',
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
    } catch (logError) {
      console.error('[EmailNotification] Error logging failed notification:', logError);
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send breeding reminder email
 */
export async function sendBreedingReminderEmail(
  userId: number,
  email: string,
  animalName: string,
  daysUntilDue: number,
  actionUrl: string
): Promise<{ success: boolean; error?: string }> {
  const htmlContent = `
    <h2>Breeding Reminder</h2>
    <p>Hi,</p>
    <p><strong>${animalName}</strong> is due for breeding in <strong>${daysUntilDue} days</strong>.</p>
    <p>Please take the necessary steps to ensure proper breeding management.</p>
    <p>
      <a href="${actionUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">
        View Details
      </a>
    </p>
    <p>Best regards,<br/>FarmKonnect Team</p>
  `;

  const textContent = `Breeding Reminder\n\nHi,\n\n${animalName} is due for breeding in ${daysUntilDue} days.\n\nPlease take the necessary steps to ensure proper breeding management.\n\nView Details: ${actionUrl}\n\nBest regards,\nFarmKonnect Team`;

  return sendEmailNotification({
    userId,
    email,
    subject: `Breeding Reminder: ${animalName}`,
    htmlContent,
    textContent,
    notificationType: 'breeding_reminder',
    priority: daysUntilDue <= 3 ? 'high' : 'medium',
    relatedType: 'animal',
    actionUrl,
  });
}

/**
 * Send stock alert email
 */
export async function sendStockAlertEmail(
  userId: number,
  email: string,
  itemName: string,
  currentStock: number,
  minimumThreshold: number,
  actionUrl: string
): Promise<{ success: boolean; error?: string }> {
  const htmlContent = `
    <h2>Stock Alert</h2>
    <p>Hi,</p>
    <p><strong>${itemName}</strong> stock level is low.</p>
    <p>Current Stock: <strong>${currentStock}</strong></p>
    <p>Minimum Threshold: <strong>${minimumThreshold}</strong></p>
    <p>Please reorder to maintain adequate inventory.</p>
    <p>
      <a href="${actionUrl}" style="display: inline-block; padding: 10px 20px; background-color: #ff9800; color: white; text-decoration: none; border-radius: 5px;">
        Reorder Now
      </a>
    </p>
    <p>Best regards,<br/>FarmKonnect Team</p>
  `;

  const textContent = `Stock Alert\n\nHi,\n\n${itemName} stock level is low.\n\nCurrent Stock: ${currentStock}\nMinimum Threshold: ${minimumThreshold}\n\nPlease reorder to maintain adequate inventory.\n\nReorder Now: ${actionUrl}\n\nBest regards,\nFarmKonnect Team`;

  return sendEmailNotification({
    userId,
    email,
    subject: `Stock Alert: ${itemName}`,
    htmlContent,
    textContent,
    notificationType: 'stock_alert',
    priority: 'high',
    relatedType: 'inventory',
    actionUrl,
  });
}

/**
 * Send weather alert email
 */
export async function sendWeatherAlertEmail(
  userId: number,
  email: string,
  alertType: string,
  description: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  actionUrl: string
): Promise<{ success: boolean; error?: string }> {
  const severityColor = {
    low: '#4CAF50',
    medium: '#ff9800',
    high: '#f44336',
    critical: '#9c27b0',
  }[severity];

  const htmlContent = `
    <h2>Weather Alert</h2>
    <p>Hi,</p>
    <p><strong>${alertType}</strong> - Severity: <span style="color: ${severityColor}; font-weight: bold;">${severity.toUpperCase()}</span></p>
    <p>${description}</p>
    <p>Please take necessary precautions for your farm.</p>
    <p>
      <a href="${actionUrl}" style="display: inline-block; padding: 10px 20px; background-color: ${severityColor}; color: white; text-decoration: none; border-radius: 5px;">
        View Details
      </a>
    </p>
    <p>Best regards,<br/>FarmKonnect Team</p>
  `;

  const textContent = `Weather Alert\n\nHi,\n\n${alertType} - Severity: ${severity.toUpperCase()}\n\n${description}\n\nPlease take necessary precautions for your farm.\n\nView Details: ${actionUrl}\n\nBest regards,\nFarmKonnect Team`;

  return sendEmailNotification({
    userId,
    email,
    subject: `Weather Alert: ${alertType}`,
    htmlContent,
    textContent,
    notificationType: 'weather_alert',
    priority: severity === 'critical' ? 'urgent' : severity === 'high' ? 'high' : 'medium',
    relatedType: 'weather',
    actionUrl,
  });
}

/**
 * Send vaccination reminder email
 */
export async function sendVaccinationReminderEmail(
  userId: number,
  email: string,
  animalName: string,
  vaccinationType: string,
  daysUntilDue: number,
  actionUrl: string
): Promise<{ success: boolean; error?: string }> {
  const htmlContent = `
    <h2>Vaccination Reminder</h2>
    <p>Hi,</p>
    <p><strong>${animalName}</strong> needs <strong>${vaccinationType}</strong> vaccination in <strong>${daysUntilDue} days</strong>.</p>
    <p>Please schedule an appointment with a veterinarian.</p>
    <p>
      <a href="${actionUrl}" style="display: inline-block; padding: 10px 20px; background-color: #2196F3; color: white; text-decoration: none; border-radius: 5px;">
        Schedule Appointment
      </a>
    </p>
    <p>Best regards,<br/>FarmKonnect Team</p>
  `;

  const textContent = `Vaccination Reminder\n\nHi,\n\n${animalName} needs ${vaccinationType} vaccination in ${daysUntilDue} days.\n\nPlease schedule an appointment with a veterinarian.\n\nSchedule Appointment: ${actionUrl}\n\nBest regards,\nFarmKonnect Team`;

  return sendEmailNotification({
    userId,
    email,
    subject: `Vaccination Reminder: ${animalName}`,
    htmlContent,
    textContent,
    notificationType: 'vaccination_reminder',
    priority: daysUntilDue <= 3 ? 'high' : 'medium',
    relatedType: 'health',
    actionUrl,
  });
}

/**
 * Send harvest reminder email
 */
export async function sendHarvestReminderEmail(
  userId: number,
  email: string,
  cropName: string,
  daysUntilHarvest: number,
  actionUrl: string
): Promise<{ success: boolean; error?: string }> {
  const htmlContent = `
    <h2>Harvest Reminder</h2>
    <p>Hi,</p>
    <p><strong>${cropName}</strong> is ready for harvest in <strong>${daysUntilHarvest} days</strong>.</p>
    <p>Please prepare for harvesting.</p>
    <p>
      <a href="${actionUrl}" style="display: inline-block; padding: 10px 20px; background-color: #8B4513; color: white; text-decoration: none; border-radius: 5px;">
        View Harvest Plan
      </a>
    </p>
    <p>Best regards,<br/>FarmKonnect Team</p>
  `;

  const textContent = `Harvest Reminder\n\nHi,\n\n${cropName} is ready for harvest in ${daysUntilHarvest} days.\n\nPlease prepare for harvesting.\n\nView Harvest Plan: ${actionUrl}\n\nBest regards,\nFarmKonnect Team`;

  return sendEmailNotification({
    userId,
    email,
    subject: `Harvest Reminder: ${cropName}`,
    htmlContent,
    textContent,
    notificationType: 'harvest_reminder',
    priority: daysUntilHarvest <= 3 ? 'high' : 'medium',
    relatedType: 'crop',
    actionUrl,
  });
}

/**
 * Send marketplace order notification email
 */
export async function sendMarketplaceOrderEmail(
  userId: number,
  email: string,
  orderNumber: string,
  status: string,
  actionUrl: string
): Promise<{ success: boolean; error?: string }> {
  const htmlContent = `
    <h2>Marketplace Order Update</h2>
    <p>Hi,</p>
    <p>Your order <strong>#${orderNumber}</strong> status has been updated to <strong>${status}</strong>.</p>
    <p>
      <a href="${actionUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">
        Track Order
      </a>
    </p>
    <p>Best regards,<br/>FarmKonnect Team</p>
  `;

  const textContent = `Marketplace Order Update\n\nHi,\n\nYour order #${orderNumber} status has been updated to ${status}.\n\nTrack Order: ${actionUrl}\n\nBest regards,\nFarmKonnect Team`;

  return sendEmailNotification({
    userId,
    email,
    subject: `Order Update: #${orderNumber}`,
    htmlContent,
    textContent,
    notificationType: 'marketplace_order',
    priority: 'medium',
    relatedType: 'order',
    actionUrl,
  });
}
