/**
 * Enhanced Email Notification Service
 * Handles all email notifications for FarmKonnect events
 */

import { ENV } from "./env";

class EnhancedEmailNotificationService {
  private sendgridApiKey: string;
  private isConfigured: boolean;
  private fromEmail: string = "noreply@farmconnekt.com";

  constructor() {
    this.sendgridApiKey = ENV.sendgridApiKey;
    this.isConfigured = !!this.sendgridApiKey;

    if (!this.isConfigured) {
      console.warn(
        "[EmailNotifications] SendGrid not configured. Email delivery will be mocked. Set SENDGRID_API_KEY to enable real emails."
      );
    } else {
      console.log("[EmailNotifications] Initialized with SendGrid API key");
    }
  }

  /**
   * Send password change confirmation email
   */
  async sendPasswordChangeConfirmation(
    toEmail: string,
    userName: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const subject = "Your Password Has Been Changed";
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #2D5016; color: white; padding: 20px; text-align: center;">
          <h1>✓ Password Changed</h1>
        </div>
        
        <div style="padding: 20px; background-color: #f9f9f9;">
          <p>Hi ${this.escapeHtml(userName)},</p>
          
          <p>Your FarmKonnect account password has been successfully changed.</p>
          
          <div style="background-color: white; border-left: 4px solid #2D5016; padding: 15px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #2D5016;">What Changed</h3>
            <ul>
              <li>Your password was updated at ${new Date().toLocaleString()}</li>
              <li>You can now log in with your new password</li>
              <li>All other sessions remain active</li>
            </ul>
          </div>
          
          <div style="background-color: #d4edda; border: 1px solid #c3e6cb; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #155724;">
              <strong>✓ Your account is secure</strong><br>
              If you did not make this change, please contact our support team immediately.
            </p>
          </div>
          
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            This is an automated notification from FarmKonnect. Please do not reply to this email.
          </p>
        </div>
      </div>
    `;

    const textContent = `
      Password Changed
      
      Hi ${userName},
      
      Your FarmKonnect account password has been successfully changed.
      
      What Changed:
      - Your password was updated at ${new Date().toLocaleString()}
      - You can now log in with your new password
      - All other sessions remain active
      
      If you did not make this change, please contact our support team immediately.
    `;

    return this.sendEmail(toEmail, subject, htmlContent, textContent);
  }

  /**
   * Send registration confirmation email
   */
  async sendRegistrationConfirmation(
    toEmail: string,
    userName: string,
    verificationLink: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const subject = "Welcome to FarmKonnect - Verify Your Email";
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #2D5016; color: white; padding: 20px; text-align: center;">
          <h1>Welcome to FarmKonnect</h1>
        </div>
        
        <div style="padding: 20px; background-color: #f9f9f9;">
          <p>Hi ${this.escapeHtml(userName)},</p>
          
          <p>Thank you for registering with FarmKonnect! We're excited to help you manage your farm more efficiently.</p>
          
          <div style="background-color: white; border-left: 4px solid #2D5016; padding: 15px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #2D5016;">Next Steps</h3>
            <p>Please verify your email address by clicking the button below:</p>
          </div>
          
          <p style="text-align: center; margin: 20px 0;">
            <a href="${verificationLink}" style="background-color: #2D5016; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">
              Verify Email Address
            </a>
          </p>
          
          <div style="background-color: #e7f3ff; border: 1px solid #b3d9ff; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #004085;">
              <strong>💡 Getting Started</strong><br>
              After verification, you can create your first farm and start tracking your agricultural operations.
            </p>
          </div>
          
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            This link will expire in 24 hours. If you didn't create this account, please ignore this email.
          </p>
        </div>
      </div>
    `;

    const textContent = `
      Welcome to FarmKonnect
      
      Hi ${userName},
      
      Thank you for registering with FarmKonnect!
      
      Please verify your email address by clicking the link below:
      ${verificationLink}
      
      This link will expire in 24 hours.
      
      Getting Started:
      After verification, you can create your first farm and start tracking your agricultural operations.
      
      If you didn't create this account, please ignore this email.
    `;

    return this.sendEmail(toEmail, subject, htmlContent, textContent);
  }

  /**
   * Send farm activity notification
   */
  async sendFarmActivityNotification(
    toEmail: string,
    userName: string,
    farmName: string,
    activityType: string,
    details: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const subject = `Farm Activity: ${farmName} - ${activityType}`;
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #2D5016; color: white; padding: 20px; text-align: center;">
          <h1>🌾 Farm Activity Update</h1>
        </div>
        
        <div style="padding: 20px; background-color: #f9f9f9;">
          <p>Hi ${this.escapeHtml(userName)},</p>
          
          <p>There's a new activity on your farm.</p>
          
          <div style="background-color: white; border-left: 4px solid #2D5016; padding: 15px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #2D5016;">Activity Details</h3>
            <p><strong>Farm:</strong> ${this.escapeHtml(farmName)}</p>
            <p><strong>Activity Type:</strong> ${this.escapeHtml(activityType)}</p>
            <p><strong>Details:</strong> ${this.escapeHtml(details)}</p>
            <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
          </div>
          
          <p style="text-align: center; margin: 20px 0;">
            <a href="https://www.farmconnekt.com/farms" style="background-color: #2D5016; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
              View Farm Details
            </a>
          </p>
          
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            This is an automated notification from FarmKonnect.
          </p>
        </div>
      </div>
    `;

    const textContent = `
      Farm Activity Update
      
      Hi ${userName},
      
      There's a new activity on your farm.
      
      Activity Details:
      Farm: ${farmName}
      Activity Type: ${activityType}
      Details: ${details}
      Time: ${new Date().toLocaleString()}
      
      View Farm Details: https://www.farmconnekt.com/farms
    `;

    return this.sendEmail(toEmail, subject, htmlContent, textContent);
  }

  /**
   * Send alert notification
   */
  async sendAlertNotification(
    toEmail: string,
    userName: string,
    alertType: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    message: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const severityColors = {
      low: '#17a2b8',
      medium: '#ffc107',
      high: '#fd7e14',
      critical: '#dc3545',
    };

    const severityEmoji = {
      low: 'ℹ️',
      medium: '⚠️',
      high: '🔴',
      critical: '🚨',
    };

    const color = severityColors[severity];
    const emoji = severityEmoji[severity];

    const subject = `${emoji} Alert: ${alertType}`;
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: ${color}; color: white; padding: 20px; text-align: center;">
          <h1>${emoji} ${alertType}</h1>
        </div>
        
        <div style="padding: 20px; background-color: #f9f9f9;">
          <p>Hi ${this.escapeHtml(userName)},</p>
          
          <p>You have received a ${severity} severity alert:</p>
          
          <div style="background-color: white; border-left: 4px solid ${color}; padding: 15px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: ${color};">Alert Details</h3>
            <p><strong>Type:</strong> ${this.escapeHtml(alertType)}</p>
            <p><strong>Severity:</strong> <span style="text-transform: uppercase; font-weight: bold; color: ${color};">${severity}</span></p>
            <p><strong>Message:</strong> ${this.escapeHtml(message)}</p>
            <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
          </div>
          
          <p style="text-align: center; margin: 20px 0;">
            <a href="https://www.farmconnekt.com/alerts" style="background-color: ${color}; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
              View All Alerts
            </a>
          </p>
          
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            This is an automated alert from FarmKonnect.
          </p>
        </div>
      </div>
    `;

    const textContent = `
      ${emoji} Alert: ${alertType}
      
      Hi ${userName},
      
      You have received a ${severity} severity alert:
      
      Alert Details:
      Type: ${alertType}
      Severity: ${severity.toUpperCase()}
      Message: ${message}
      Time: ${new Date().toLocaleString()}
      
      View All Alerts: https://www.farmconnekt.com/alerts
    `;

    return this.sendEmail(toEmail, subject, htmlContent, textContent);
  }

  /**
   * Send marketplace notification
   */
  async sendMarketplaceNotification(
    toEmail: string,
    userName: string,
    notificationType: 'order_placed' | 'order_shipped' | 'order_delivered' | 'new_offer',
    details: Record<string, string>
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const typeInfo = {
      order_placed: { title: '📦 Order Placed', color: '#2D5016' },
      order_shipped: { title: '🚚 Order Shipped', color: '#17a2b8' },
      order_delivered: { title: '✓ Order Delivered', color: '#28a745' },
      new_offer: { title: '💰 New Offer', color: '#ffc107' },
    };

    const info = typeInfo[notificationType];
    const subject = info.title;

    let detailsHtml = '';
    for (const [key, value] of Object.entries(details)) {
      detailsHtml += `<p><strong>${this.escapeHtml(key)}:</strong> ${this.escapeHtml(value)}</p>`;
    }

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: ${info.color}; color: white; padding: 20px; text-align: center;">
          <h1>${info.title}</h1>
        </div>
        
        <div style="padding: 20px; background-color: #f9f9f9;">
          <p>Hi ${this.escapeHtml(userName)},</p>
          
          <div style="background-color: white; border-left: 4px solid ${info.color}; padding: 15px; margin: 20px 0;">
            ${detailsHtml}
          </div>
          
          <p style="text-align: center; margin: 20px 0;">
            <a href="https://www.farmconnekt.com/marketplace" style="background-color: ${info.color}; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
              View Marketplace
            </a>
          </p>
        </div>
      </div>
    `;

    const textContent = `
      ${info.title}
      
      Hi ${userName},
      
      ${Object.entries(details)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n')}
      
      View Marketplace: https://www.farmconnekt.com/marketplace
    `;

    return this.sendEmail(toEmail, subject, htmlContent, textContent);
  }

  /**
   * Send email
   */
  private async sendEmail(
    toEmail: string,
    subject: string,
    htmlContent: string,
    textContent: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.isConfigured) {
      console.log(`[EmailNotifications] Mock email sent to ${toEmail}: ${subject}`);
      return { success: true, messageId: 'mock-' + Date.now() };
    }

    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.sendgridApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [
            {
              to: [{ email: toEmail }],
              subject: subject,
            },
          ],
          from: { email: this.fromEmail },
          content: [
            { type: 'text/plain', value: textContent },
            { type: 'text/html', value: htmlContent },
          ],
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('[EmailNotifications] SendGrid error:', error);
        return { success: false, error: 'Failed to send email' };
      }

      const messageId = response.headers.get('x-message-id') || 'unknown';
      return { success: true, messageId };
    } catch (error) {
      console.error('[EmailNotifications] Error sending email:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Escape HTML special characters
   */
  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }
}

export const enhancedEmailNotifications = new EnhancedEmailNotificationService();
