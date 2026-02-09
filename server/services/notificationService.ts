import { TRPCError } from '@trpc/server';
import { getDb } from '../db';
import { medicationCompliance, farms, animals } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

// Twilio configuration
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || '';
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || '';

// SendGrid configuration
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || '';

interface ComplianceAlert {
  farmId: number;
  animalId: number;
  animalName: string;
  compliancePercentage: number;
  missedDoses: number;
  phoneNumber?: string;
  email?: string;
  farmName?: string;
}

interface NotificationResult {
  success: boolean;
  method: 'sms' | 'email' | 'both';
  messageId?: string;
  error?: string;
}

/**
 * Send SMS notification using Twilio
 */
export async function sendSMSAlert(
  phoneNumber: string,
  message: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
      console.warn('Twilio credentials not configured');
      return { success: false, error: 'SMS service not configured' };
    }

    // In production, use actual Twilio SDK
    // For now, we'll simulate the API call
    const messageId = `SMS-${Date.now()}`;
    console.log(`[SMS] To: ${phoneNumber}, Message: ${message}`);

    return {
      success: true,
      messageId,
    };
  } catch (error) {
    console.error('Error sending SMS:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send SMS',
    };
  }
}

/**
 * Send email notification using SendGrid
 */
export async function sendEmailAlert(
  email: string,
  subject: string,
  htmlContent: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (!SENDGRID_API_KEY) {
      console.warn('SendGrid API key not configured');
      return { success: false, error: 'Email service not configured' };
    }

    // In production, use actual SendGrid SDK
    // For now, we'll simulate the API call
    const messageId = `EMAIL-${Date.now()}`;
    console.log(`[EMAIL] To: ${email}, Subject: ${subject}`);

    return {
      success: true,
      messageId,
    };
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    };
  }
}

/**
 * Check compliance and send alerts if needed
 */
export async function checkAndSendComplianceAlerts(
  farmId: number,
  complianceThreshold: number = 80
): Promise<ComplianceAlert[]> {
  try {
    const db = getDb();

    // Get all animals on medication for this farm
    const records = await db
      .select()
      .from(medicationCompliance)
      .where(eq(medicationCompliance.farmId, farmId));

    const alertsToSend: ComplianceAlert[] = [];
    const animalCompliance: Record<number, { total: number; administered: number }> = {};

    // Calculate compliance per animal
    for (const record of records) {
      if (!animalCompliance[record.animalId]) {
        animalCompliance[record.animalId] = { total: 0, administered: 0 };
      }
      animalCompliance[record.animalId].total += 1;
      if (record.status === 'administered') {
        animalCompliance[record.animalId].administered += 1;
      }
    }

    // Check which animals have low compliance
    for (const [animalId, compliance] of Object.entries(animalCompliance)) {
      const compliancePercentage = (compliance.administered / compliance.total) * 100;

      if (compliancePercentage < complianceThreshold) {
        const missedDoses = compliance.total - compliance.administered;

        alertsToSend.push({
          farmId,
          animalId: parseInt(animalId),
          animalName: `Animal ${animalId}`,
          compliancePercentage: Math.round(compliancePercentage),
          missedDoses,
        });
      }
    }

    // Send alerts for low compliance animals
    for (const alert of alertsToSend) {
      await sendComplianceAlert(alert);
    }

    return alertsToSend;
  } catch (error) {
    console.error('Error checking compliance:', error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to check compliance and send alerts',
    });
  }
}

/**
 * Send compliance alert via SMS and/or email
 */
export async function sendComplianceAlert(alert: ComplianceAlert): Promise<NotificationResult> {
  try {
    const results: { sms?: boolean; email?: boolean } = {};

    // Send SMS if phone number is available
    if (alert.phoneNumber) {
      const smsMessage = `Alert: ${alert.animalName} on farm ${alert.farmName} has low medication compliance (${alert.compliancePercentage}%). ${alert.missedDoses} doses missed. Please take action.`;
      const smsResult = await sendSMSAlert(alert.phoneNumber, smsMessage);
      results.sms = smsResult.success;
    }

    // Send email if email is available
    if (alert.email) {
      const emailSubject = `Medication Compliance Alert - ${alert.animalName}`;
      const emailContent = `
        <h2>Medication Compliance Alert</h2>
        <p><strong>Animal:</strong> ${alert.animalName}</p>
        <p><strong>Farm:</strong> ${alert.farmName}</p>
        <p><strong>Compliance:</strong> ${alert.compliancePercentage}%</p>
        <p><strong>Missed Doses:</strong> ${alert.missedDoses}</p>
        <p>Please take immediate action to improve medication compliance.</p>
      `;
      const emailResult = await sendEmailAlert(alert.email, emailSubject, emailContent);
      results.email = emailResult.success;
    }

    const method = results.sms && results.email ? 'both' : results.sms ? 'sms' : 'email';
    const success = results.sms || results.email;

    return {
      success,
      method,
    };
  } catch (error) {
    console.error('Error sending compliance alert:', error);
    return {
      success: false,
      method: 'both',
      error: error instanceof Error ? error.message : 'Failed to send alert',
    };
  }
}

/**
 * Send dose reminder before scheduled administration
 */
export async function sendDoseReminder(
  animalId: number,
  medicationName: string,
  scheduledTime: string,
  phoneNumber?: string,
  email?: string
): Promise<NotificationResult> {
  try {
    const results: { sms?: boolean; email?: boolean } = {};

    // Send SMS reminder
    if (phoneNumber) {
      const smsMessage = `Reminder: Time to administer ${medicationName} to Animal ${animalId} at ${scheduledTime}. Please confirm administration.`;
      const smsResult = await sendSMSAlert(phoneNumber, smsMessage);
      results.sms = smsResult.success;
    }

    // Send email reminder
    if (email) {
      const emailSubject = `Medication Reminder - ${medicationName}`;
      const emailContent = `
        <h2>Medication Reminder</h2>
        <p><strong>Animal:</strong> Animal ${animalId}</p>
        <p><strong>Medication:</strong> ${medicationName}</p>
        <p><strong>Scheduled Time:</strong> ${scheduledTime}</p>
        <p>Please administer the medication and confirm in the system.</p>
      `;
      const emailResult = await sendEmailAlert(email, emailSubject, emailContent);
      results.email = emailResult.success;
    }

    const method = results.sms && results.email ? 'both' : results.sms ? 'sms' : 'email';
    const success = results.sms || results.email;

    return {
      success,
      method,
    };
  } catch (error) {
    console.error('Error sending dose reminder:', error);
    return {
      success: false,
      method: 'both',
      error: error instanceof Error ? error.message : 'Failed to send reminder',
    };
  }
}

/**
 * Send appointment reminder
 */
export async function sendAppointmentReminder(
  appointmentDate: string,
  appointmentTime: string,
  vetName: string,
  animalName: string,
  phoneNumber?: string,
  email?: string
): Promise<NotificationResult> {
  try {
    const results: { sms?: boolean; email?: boolean } = {};

    // Send SMS reminder
    if (phoneNumber) {
      const smsMessage = `Reminder: Veterinary appointment for ${animalName} with ${vetName} on ${appointmentDate} at ${appointmentTime}. Please arrive on time.`;
      const smsResult = await sendSMSAlert(phoneNumber, smsMessage);
      results.sms = smsResult.success;
    }

    // Send email reminder
    if (email) {
      const emailSubject = `Veterinary Appointment Reminder - ${animalName}`;
      const emailContent = `
        <h2>Veterinary Appointment Reminder</h2>
        <p><strong>Animal:</strong> ${animalName}</p>
        <p><strong>Veterinarian:</strong> ${vetName}</p>
        <p><strong>Date:</strong> ${appointmentDate}</p>
        <p><strong>Time:</strong> ${appointmentTime}</p>
        <p>Please arrive 10 minutes early.</p>
      `;
      const emailResult = await sendEmailAlert(email, emailSubject, emailContent);
      results.email = emailResult.success;
    }

    const method = results.sms && results.email ? 'both' : results.sms ? 'sms' : 'email';
    const success = results.sms || results.email;

    return {
      success,
      method,
    };
  } catch (error) {
    console.error('Error sending appointment reminder:', error);
    return {
      success: false,
      method: 'both',
      error: error instanceof Error ? error.message : 'Failed to send reminder',
    };
  }
}

/**
 * Send bulk notification to all farms with low compliance
 */
export async function sendBulkComplianceNotifications(
  complianceThreshold: number = 80
): Promise<{ farmsNotified: number; alertsSent: number }> {
  try {
    const db = getDb();

    // Get all farms
    const allFarms = await db.select().from(farms);

    let farmsNotified = 0;
    let alertsSent = 0;

    for (const farm of allFarms) {
      const alerts = await checkAndSendComplianceAlerts(farm.id, complianceThreshold);
      if (alerts.length > 0) {
        farmsNotified += 1;
        alertsSent += alerts.length;
      }
    }

    return {
      farmsNotified,
      alertsSent,
    };
  } catch (error) {
    console.error('Error sending bulk notifications:', error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to send bulk notifications',
    });
  }
}
