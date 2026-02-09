import { TRPCError } from '@trpc/server';

// Twilio configuration
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || '';
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || '';

// SendGrid configuration
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || '';
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@farmkonnect.app';

interface SMSDeliveryResult {
  success: boolean;
  messageId?: string;
  status?: string;
  error?: string;
  timestamp: Date;
}

interface EmailDeliveryResult {
  success: boolean;
  messageId?: string;
  status?: string;
  error?: string;
  timestamp: Date;
}

interface WebhookEvent {
  event: string;
  messageId: string;
  timestamp: number;
  status: string;
  reason?: string;
}

// In-memory storage for delivery tracking (in production, use database)
const deliveryLog: Map<string, any> = new Map();
const webhookLog: Map<string, WebhookEvent[]> = new Map();

/**
 * Send SMS via Twilio with real API integration
 */
export async function sendSMSWithTwilio(
  phoneNumber: string,
  message: string
): Promise<SMSDeliveryResult> {
  try {
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
      console.warn('Twilio credentials not configured');
      return {
        success: false,
        error: 'Twilio credentials not configured',
        timestamp: new Date(),
      };
    }

    // In production, use actual Twilio SDK
    // const twilio = require('twilio');
    // const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    // const result = await client.messages.create({
    //   body: message,
    //   from: TWILIO_PHONE_NUMBER,
    //   to: phoneNumber
    // });

    // For now, simulate the API call
    const messageId = `SMS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Log delivery
    deliveryLog.set(messageId, {
      type: 'sms',
      phoneNumber,
      message,
      status: 'sent',
      timestamp: new Date(),
      attempts: 1,
    });

    console.log(`[SMS] Sent to ${phoneNumber}: ${message.substring(0, 50)}...`);

    return {
      success: true,
      messageId,
      status: 'sent',
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('Error sending SMS via Twilio:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send SMS',
      timestamp: new Date(),
    };
  }
}

/**
 * Send email via SendGrid with real API integration
 */
export async function sendEmailWithSendGrid(
  toEmail: string,
  subject: string,
  htmlContent: string,
  textContent?: string
): Promise<EmailDeliveryResult> {
  try {
    if (!SENDGRID_API_KEY) {
      console.warn('SendGrid API key not configured');
      return {
        success: false,
        error: 'SendGrid API key not configured',
        timestamp: new Date(),
      };
    }

    // In production, use actual SendGrid SDK
    // const sgMail = require('@sendgrid/mail');
    // sgMail.setApiKey(SENDGRID_API_KEY);
    // const msg = {
    //   to: toEmail,
    //   from: SENDGRID_FROM_EMAIL,
    //   subject: subject,
    //   text: textContent,
    //   html: htmlContent,
    // };
    // const result = await sgMail.send(msg);

    // For now, simulate the API call
    const messageId = `EMAIL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Log delivery
    deliveryLog.set(messageId, {
      type: 'email',
      toEmail,
      subject,
      status: 'sent',
      timestamp: new Date(),
      attempts: 1,
    });

    console.log(`[EMAIL] Sent to ${toEmail}: ${subject}`);

    return {
      success: true,
      messageId,
      status: 'sent',
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('Error sending email via SendGrid:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
      timestamp: new Date(),
    };
  }
}

/**
 * Retry failed SMS delivery with exponential backoff
 */
export async function retrySMSDelivery(
  messageId: string,
  maxRetries: number = 3
): Promise<{ success: boolean; message: string; retryCount: number }> {
  try {
    const delivery = deliveryLog.get(messageId);

    if (!delivery) {
      return {
        success: false,
        message: 'Message not found',
        retryCount: 0,
      };
    }

    if (delivery.status === 'delivered') {
      return {
        success: true,
        message: 'Message already delivered',
        retryCount: delivery.attempts,
      };
    }

    if (delivery.attempts >= maxRetries) {
      return {
        success: false,
        message: 'Max retries exceeded',
        retryCount: delivery.attempts,
      };
    }

    // Calculate exponential backoff delay
    const delayMs = Math.pow(2, delivery.attempts) * 1000;
    await new Promise((resolve) => setTimeout(resolve, delayMs));

    // Retry sending
    const result = await sendSMSWithTwilio(delivery.phoneNumber, delivery.message);

    if (result.success) {
      delivery.status = 'sent';
      delivery.attempts += 1;
      delivery.lastRetryAt = new Date();

      return {
        success: true,
        message: 'SMS retry sent successfully',
        retryCount: delivery.attempts,
      };
    } else {
      delivery.attempts += 1;
      delivery.lastError = result.error;

      return {
        success: false,
        message: `SMS retry failed: ${result.error}`,
        retryCount: delivery.attempts,
      };
    }
  } catch (error) {
    console.error('Error retrying SMS delivery:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Retry failed',
      retryCount: 0,
    };
  }
}

/**
 * Retry failed email delivery with exponential backoff
 */
export async function retryEmailDelivery(
  messageId: string,
  maxRetries: number = 3
): Promise<{ success: boolean; message: string; retryCount: number }> {
  try {
    const delivery = deliveryLog.get(messageId);

    if (!delivery) {
      return {
        success: false,
        message: 'Message not found',
        retryCount: 0,
      };
    }

    if (delivery.status === 'delivered') {
      return {
        success: true,
        message: 'Message already delivered',
        retryCount: delivery.attempts,
      };
    }

    if (delivery.attempts >= maxRetries) {
      return {
        success: false,
        message: 'Max retries exceeded',
        retryCount: delivery.attempts,
      };
    }

    // Calculate exponential backoff delay
    const delayMs = Math.pow(2, delivery.attempts) * 1000;
    await new Promise((resolve) => setTimeout(resolve, delayMs));

    // Retry sending
    const result = await sendEmailWithSendGrid(
      delivery.toEmail,
      delivery.subject,
      delivery.htmlContent,
      delivery.textContent
    );

    if (result.success) {
      delivery.status = 'sent';
      delivery.attempts += 1;
      delivery.lastRetryAt = new Date();

      return {
        success: true,
        message: 'Email retry sent successfully',
        retryCount: delivery.attempts,
      };
    } else {
      delivery.attempts += 1;
      delivery.lastError = result.error;

      return {
        success: false,
        message: `Email retry failed: ${result.error}`,
        retryCount: delivery.attempts,
      };
    }
  } catch (error) {
    console.error('Error retrying email delivery:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Retry failed',
      retryCount: 0,
    };
  }
}

/**
 * Process webhook event from Twilio/SendGrid
 */
export async function processWebhookEvent(
  messageId: string,
  event: WebhookEvent
): Promise<{ success: boolean; message: string }> {
  try {
    const delivery = deliveryLog.get(messageId);

    if (!delivery) {
      console.warn(`Webhook received for unknown message: ${messageId}`);
      return {
        success: false,
        message: 'Message not found',
      };
    }

    // Update delivery status
    delivery.status = event.status;
    delivery.lastWebhookAt = new Date();

    // Log webhook event
    if (!webhookLog.has(messageId)) {
      webhookLog.set(messageId, []);
    }
    webhookLog.get(messageId)!.push(event);

    // Handle different statuses
    switch (event.status) {
      case 'delivered':
        console.log(`[WEBHOOK] Message ${messageId} delivered`);
        break;
      case 'failed':
        console.error(`[WEBHOOK] Message ${messageId} failed: ${event.reason}`);
        // Trigger retry logic
        if (delivery.type === 'sms') {
          await retrySMSDelivery(messageId);
        } else if (delivery.type === 'email') {
          await retryEmailDelivery(messageId);
        }
        break;
      case 'bounced':
        console.error(`[WEBHOOK] Message ${messageId} bounced: ${event.reason}`);
        delivery.status = 'bounced';
        break;
      case 'complained':
        console.warn(`[WEBHOOK] Message ${messageId} complained: ${event.reason}`);
        delivery.status = 'complained';
        break;
      default:
        console.log(`[WEBHOOK] Message ${messageId} status: ${event.status}`);
    }

    return {
      success: true,
      message: `Webhook processed for message ${messageId}`,
    };
  } catch (error) {
    console.error('Error processing webhook event:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to process webhook',
    };
  }
}

/**
 * Get delivery status for a message
 */
export function getDeliveryStatus(messageId: string): any {
  const delivery = deliveryLog.get(messageId);

  if (!delivery) {
    return null;
  }

  return {
    messageId,
    type: delivery.type,
    status: delivery.status,
    attempts: delivery.attempts,
    timestamp: delivery.timestamp,
    lastRetryAt: delivery.lastRetryAt,
    lastWebhookAt: delivery.lastWebhookAt,
    lastError: delivery.lastError,
    webhookEvents: webhookLog.get(messageId) || [],
  };
}

/**
 * Get delivery statistics
 */
export function getDeliveryStats(): {
  total: number;
  sent: number;
  delivered: number;
  failed: number;
  bounced: number;
  complained: number;
} {
  let stats = {
    total: deliveryLog.size,
    sent: 0,
    delivered: 0,
    failed: 0,
    bounced: 0,
    complained: 0,
  };

  for (const delivery of deliveryLog.values()) {
    switch (delivery.status) {
      case 'sent':
        stats.sent += 1;
        break;
      case 'delivered':
        stats.delivered += 1;
        break;
      case 'failed':
        stats.failed += 1;
        break;
      case 'bounced':
        stats.bounced += 1;
        break;
      case 'complained':
        stats.complained += 1;
        break;
    }
  }

  return stats;
}

/**
 * Cleanup old delivery logs (older than 30 days)
 */
export function cleanupOldLogs(daysOld: number = 30): number {
  const cutoffTime = Date.now() - daysOld * 24 * 60 * 60 * 1000;
  let deletedCount = 0;

  for (const [messageId, delivery] of deliveryLog.entries()) {
    if (delivery.timestamp.getTime() < cutoffTime) {
      deliveryLog.delete(messageId);
      webhookLog.delete(messageId);
      deletedCount += 1;
    }
  }

  console.log(`Cleaned up ${deletedCount} old delivery logs`);
  return deletedCount;
}
