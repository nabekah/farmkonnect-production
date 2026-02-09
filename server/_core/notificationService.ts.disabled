// Notification service with SendGrid and Twilio integration
import sgMail from '@sendgrid/mail';
import twilio from 'twilio';

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// Initialize Twilio
let twilioClient: any = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  // Check if using API Key (starts with SK) or Account SID (starts with AC)
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  
  if (accountSid.startsWith('SK')) {
    // Using API Key - need actual Account SID
    console.warn('[Twilio] API Key detected (SK*). Please provide the actual Account SID (AC*) as TWILIO_ACCOUNT_SID and use the API Key as TWILIO_API_KEY');
    // For now, disable Twilio to prevent errors
    twilioClient = null;
  } else {
    twilioClient = twilio(accountSid, authToken);
  }
}

export interface NotificationPayload {
  userId: number;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  channels?: ('email' | 'sms' | 'push')[];
}

export class NotificationService {
  async sendEmail(to: string, subject: string, html: string) {
    console.log(`[Notification] Sending email to ${to}: ${subject}`);
    
    if (!process.env.SENDGRID_API_KEY) {
      console.warn('[Notification] SendGrid API key not configured');
      return { success: false, provider: 'sendgrid', error: 'API key not configured' };
    }

    const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@farmkonnect.com';
    
    try {
      await sgMail.send({ to, from: fromEmail, subject, html });
      console.log(`[Notification] Email sent successfully to ${to}`);
      return { success: true, provider: 'sendgrid' };
    } catch (error: any) {
      console.error('[Notification] SendGrid error:', error.message);
      return { success: false, provider: 'sendgrid', error: error.message };
    }
  }
  async sendEmailWithAttachment(options: { to: string | string[]; subject: string; html: string; attachmentBuffer: Buffer; attachmentFilename: string; }) {
    console.log(`[Notification] Sending email with attachment`);
    
    if (!process.env.SENDGRID_API_KEY) {
      console.warn('[Notification] SendGrid API key not configured');
      return { success: false, provider: 'sendgrid', error: 'API key not configured' };
    }

    const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@farmkonnect.com';
    const recipients = Array.isArray(options.to) ? options.to : [options.to];
    
    try {
      const attachmentBase64 = options.attachmentBuffer.toString('base64');
      const attachmentType = options.attachmentFilename.endsWith('.pdf') 
        ? 'application/pdf' 
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

      for (const recipient of recipients) {
        await sgMail.send({
          to: recipient,
          from: fromEmail,
          subject: options.subject,
          html: options.html,
          attachments: [
            {
              content: attachmentBase64,
              filename: options.attachmentFilename,
              type: attachmentType,
              disposition: 'attachment',
            },
          ],
        });
      }
      console.log(`[Notification] Email with attachment sent successfully`);
      return { success: true, provider: 'sendgrid' };
    } catch (error: any) {
      console.error('[Notification] SendGrid error:', error.message);
      return { success: false, provider: 'sendgrid', error: error.message };
    }
  }

  async sendSMS(to: string, body: string) {
    console.log(`[Notification] Sending SMS to ${to}: ${body}`);
    
    if (!twilioClient) {
      console.warn('[Notification] Twilio not configured');
      return { success: false, provider: 'twilio', error: 'Twilio not configured' };
    }

    if (!process.env.TWILIO_PHONE_NUMBER) {
      console.warn('[Notification] Twilio phone number not configured');
      return { success: false, provider: 'twilio', error: 'Phone number not configured' };
    }
    
    try {
      await twilioClient.messages.create({
        body,
        from: process.env.TWILIO_PHONE_NUMBER,
        to
      });
      console.log(`[Notification] SMS sent successfully to ${to}`);
      return { success: true, provider: 'twilio' };
    } catch (error: any) {
      console.error('[Notification] Twilio error:', error.message);
      return { success: false, provider: 'twilio', error: error.message };
    }
  }

  async sendNotification(payload: NotificationPayload, userPreferences: any) {
    const results: any = {};

    // Determine channels based on severity
    const channels = payload.channels || this.getDefaultChannels(payload.severity, userPreferences);

    for (const channel of channels) {
      switch (channel) {
        case 'email':
          if (userPreferences.email && userPreferences.emailEnabled) {
            results.email = await this.sendEmail(
              userPreferences.email,
              payload.title,
              this.formatEmailHTML(payload)
            );
          }
          break;

        case 'sms':
          if (userPreferences.phoneNumber && userPreferences.smsEnabled) {
            results.sms = await this.sendSMS(
              userPreferences.phoneNumber,
              `${payload.title}: ${payload.message}`
            );
          }
          break;

        case 'push':
          // WebSocket push notification
          results.push = { success: true, provider: 'websocket' };
          break;
      }
    }

    return results;
  }

  private getDefaultChannels(severity: string, preferences: any): ('email' | 'sms' | 'push')[] {
    // Critical alerts go to all enabled channels
    if (severity === 'critical') {
      const channels: ('email' | 'sms' | 'push')[] = ['push'];
      if (preferences.emailEnabled) channels.push('email');
      if (preferences.smsEnabled) channels.push('sms');
      return channels;
    }

    // Warning alerts go to push and email
    if (severity === 'warning') {
      const channels: ('email' | 'sms' | 'push')[] = ['push'];
      if (preferences.emailEnabled) channels.push('email');
      return channels;
    }

    // Info alerts only via push
    return ['push'];
  }

  private formatEmailHTML(payload: NotificationPayload): string {
    const severityColors = {
      info: '#3b82f6',
      warning: '#f59e0b',
      critical: '#ef4444',
    };

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: ${severityColors[payload.severity]}; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
            .content { background: #f9fafb; padding: 20px; border-radius: 0 0 5px 5px; }
            .footer { margin-top: 20px; text-align: center; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>${payload.title}</h2>
            </div>
            <div class="content">
              <p>${payload.message}</p>
              <p><strong>Severity:</strong> ${payload.severity.toUpperCase()}</p>
              <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            </div>
            <div class="footer">
              <p>FarmKonnect - Agricultural Management Platform</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}

export const notificationService = new NotificationService();
