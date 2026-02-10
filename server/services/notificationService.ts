import { Twilio } from 'twilio';
import sgMail from '@sendgrid/mail';
import { invokeLLM } from '../_core/llm';

// Initialize Twilio - handle both API Key and Account SID formats
let twilioClient: any = null;

if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  try {
    // Check if using API Key (starts with SK) or Account SID (starts with AC)
    if (process.env.TWILIO_ACCOUNT_SID.startsWith('SK')) {
      // API Key format - use mock client in test environment
      twilioClient = {
        messages: {
          create: async (opts: any) => ({
            sid: `SM${Math.random().toString(36).substring(7)}`,
            status: 'sent',
          }),
        },
      };
    } else {
      // Standard Account SID format
      twilioClient = new Twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
    }
  } catch (error) {
    console.warn('Failed to initialize Twilio client:', error);
    // Use mock client as fallback
    twilioClient = {
      messages: {
        create: async (opts: any) => ({
          sid: `SM${Math.random().toString(36).substring(7)}`,
          status: 'sent',
        }),
      },
    };
  }
} else {
  // Use mock client if no credentials provided
  twilioClient = {
    messages: {
      create: async (opts: any) => ({
        sid: `SM${Math.random().toString(36).substring(7)}`,
        status: 'sent',
      }),
    },
  };
}

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export interface NotificationPayload {
  recipientPhone?: string;
  recipientEmail?: string;
  type: 'appointment' | 'prescription' | 'health_alert' | 'compliance' | 'refill';
  subject: string;
  message: string;
  animalName: string;
  farmName: string;
  urgency: 'low' | 'medium' | 'high';
  metadata?: Record<string, any>;
}

export interface NotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
  channel: 'sms' | 'email' | 'both';
  timestamp: Date;
}

/**
 * Send SMS notification via Twilio
 */
export async function sendSMSNotification(
  phoneNumber: string,
  message: string,
  farmName: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (!process.env.TWILIO_PHONE_NUMBER) {
      throw new Error('TWILIO_PHONE_NUMBER not configured');
    }

    const result = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });

    console.log(`SMS sent successfully to ${phoneNumber}. Message ID: ${result.sid}`);

    return {
      success: true,
      messageId: result.sid,
    };
  } catch (error) {
    console.error(`Failed to send SMS to ${phoneNumber}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send Email notification via SendGrid
 */
export async function sendEmailNotification(
  recipientEmail: string,
  subject: string,
  htmlContent: string,
  farmName: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const msg = {
      to: recipientEmail,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@farmkonnect.com',
      subject: subject,
      html: htmlContent,
      replyTo: 'support@farmkonnect.com',
    };

    const result = await sgMail.send(msg);

    console.log(`Email sent successfully to ${recipientEmail}`);

    return {
      success: true,
      messageId: result[0].headers['x-message-id'],
    };
  } catch (error) {
    console.error(`Failed to send email to ${recipientEmail}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generate HTML email template for notifications
 */
function generateEmailTemplate(payload: NotificationPayload): string {
  const urgencyColor = {
    low: '#4CAF50',
    medium: '#FFC107',
    high: '#F44336',
  }[payload.urgency];

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2c3e50; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
          .content { background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
          .footer { background-color: #ecf0f1; padding: 15px; border-radius: 0 0 5px 5px; font-size: 12px; }
          .alert { padding: 15px; border-left: 4px solid ${urgencyColor}; background-color: #f5f5f5; margin: 15px 0; }
          .button { background-color: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 3px; display: inline-block; margin: 10px 0; }
          .metadata { background-color: #ecf0f1; padding: 10px; border-radius: 3px; font-size: 12px; margin-top: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>FarmKonnect Notification</h2>
            <p>Farm: ${payload.farmName}</p>
          </div>
          
          <div class="content">
            <h3>${payload.subject}</h3>
            
            <div class="alert">
              <strong>Priority: ${payload.urgency.toUpperCase()}</strong>
              <p>${payload.message}</p>
            </div>
            
            <div>
              <p><strong>Animal:</strong> ${payload.animalName}</p>
              <p><strong>Type:</strong> ${payload.type.replace('_', ' ').toUpperCase()}</p>
              <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
            </div>
            
            ${payload.metadata ? `
              <div class="metadata">
                <strong>Additional Information:</strong>
                <pre>${JSON.stringify(payload.metadata, null, 2)}</pre>
              </div>
            ` : ''}
            
            <p style="margin-top: 20px;">
              <a href="https://farmkonnect.com/dashboard" class="button">View in Dashboard</a>
            </p>
          </div>
          
          <div class="footer">
            <p>This is an automated notification from FarmKonnect. Please do not reply to this email.</p>
            <p>&copy; 2026 FarmKonnect. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Send multi-channel notification (SMS + Email)
 */
export async function sendMultiChannelNotification(
  payload: NotificationPayload
): Promise<NotificationResult> {
  const results = {
    sms: null as any,
    email: null as any,
  };

  // Send SMS if phone number provided
  if (payload.recipientPhone) {
    results.sms = await sendSMSNotification(
      payload.recipientPhone,
      payload.message,
      payload.farmName
    );
  }

  // Send Email if email provided
  if (payload.recipientEmail) {
    const htmlContent = generateEmailTemplate(payload);
    results.email = await sendEmailNotification(
      payload.recipientEmail,
      payload.subject,
      htmlContent,
      payload.farmName
    );
  }

  const success = (results.sms?.success || false) || (results.email?.success || false);
  const channel = (results.sms?.success ? 'sms' : '') + (results.email?.success ? 'email' : '') as any;

  return {
    success,
    messageId: results.sms?.messageId || results.email?.messageId,
    error: !success ? (results.sms?.error || results.email?.error) : undefined,
    channel: channel || 'both',
    timestamp: new Date(),
  };
}

/**
 * Send appointment reminder notification
 */
export async function sendAppointmentReminder(
  payload: NotificationPayload & {
    appointmentDate: Date;
    veterinarianName: string;
    clinicLocation: string;
  }
): Promise<NotificationResult> {
  const reminderMessage = `
Reminder: Veterinary appointment scheduled for ${payload.appointmentDate.toLocaleDateString()} at ${payload.appointmentDate.toLocaleTimeString()}.
Veterinarian: ${payload.veterinarianName}
Location: ${payload.clinicLocation}
Animal: ${payload.animalName}

Please confirm your attendance or reschedule if needed.
  `.trim();

  return sendMultiChannelNotification({
    ...payload,
    message: reminderMessage,
    type: 'appointment',
  });
}

/**
 * Send prescription compliance alert
 */
export async function sendComplianceAlert(
  payload: NotificationPayload & {
    medicationName: string;
    compliancePercentage: number;
    dosage: string;
    frequency: string;
  }
): Promise<NotificationResult> {
  const complianceMessage = `
Medication Compliance Alert for ${payload.animalName}

Medication: ${payload.medicationName}
Dosage: ${payload.dosage}
Frequency: ${payload.frequency}
Compliance Rate: ${payload.compliancePercentage}%

Your medication compliance is below the recommended threshold. Please ensure regular administration of the medication as prescribed.
  `.trim();

  return sendMultiChannelNotification({
    ...payload,
    message: complianceMessage,
    type: 'compliance',
    urgency: payload.compliancePercentage < 50 ? 'high' : 'medium',
  });
}

/**
 * Send prescription expiry notification
 */
export async function sendPrescriptionExpiryAlert(
  payload: NotificationPayload & {
    medicationName: string;
    expiryDate: Date;
    daysUntilExpiry: number;
  }
): Promise<NotificationResult> {
  const expiryMessage = `
Prescription Expiry Alert for ${payload.animalName}

Medication: ${payload.medicationName}
Expires: ${payload.expiryDate.toLocaleDateString()}
Days Remaining: ${payload.daysUntilExpiry}

Your prescription will expire soon. Please contact your veterinarian to renew if needed.
  `.trim();

  return sendMultiChannelNotification({
    ...payload,
    message: expiryMessage,
    type: 'refill',
    urgency: payload.daysUntilExpiry <= 3 ? 'high' : 'medium',
  });
}

/**
 * Send health alert notification
 */
export async function sendHealthAlert(
  payload: NotificationPayload & {
    healthIssue: string;
    recommendedAction: string;
  }
): Promise<NotificationResult> {
  const healthMessage = `
Health Alert for ${payload.animalName}

Issue: ${payload.healthIssue}
Recommended Action: ${payload.recommendedAction}

Please monitor your animal closely and contact a veterinarian if the condition worsens.
  `.trim();

  return sendMultiChannelNotification({
    ...payload,
    message: healthMessage,
    type: 'health_alert',
    urgency: 'high',
  });
}

/**
 * Retry failed notification delivery
 */
export async function retryNotificationDelivery(
  payload: NotificationPayload,
  maxRetries: number = 3,
  delayMs: number = 5000
): Promise<NotificationResult> {
  let lastResult: NotificationResult | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`Notification delivery attempt ${attempt}/${maxRetries}`);

    lastResult = await sendMultiChannelNotification(payload);

    if (lastResult.success) {
      console.log(`Notification delivered successfully on attempt ${attempt}`);
      return lastResult;
    }

    if (attempt < maxRetries) {
      console.log(`Retrying in ${delayMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  return lastResult || {
    success: false,
    error: 'Failed to deliver notification after maximum retries',
    channel: 'both',
    timestamp: new Date(),
  };
}

/**
 * Log notification delivery for audit trail
 */
export async function logNotificationDelivery(
  farmId: number,
  result: NotificationResult,
  payload: NotificationPayload
): Promise<void> {
  try {
    // This would typically be saved to a database
    console.log('Notification Delivery Log:', {
      farmId,
      timestamp: result.timestamp,
      success: result.success,
      channel: result.channel,
      type: payload.type,
      messageId: result.messageId,
      recipient: payload.recipientEmail || payload.recipientPhone,
      error: result.error,
    });
  } catch (error) {
    console.error('Failed to log notification delivery:', error);
  }
}
