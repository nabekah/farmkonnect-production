import { ENV } from "./env";

/**
 * Email Notification Service for login alerts and security notifications
 */
class EmailNotificationService {
  private sendgridApiKey: string;
  private isConfigured: boolean;
  private fromEmail: string = "noreply@farmconnekt.com";

  constructor() {
    this.sendgridApiKey = ENV.sendgridApiKey;
    this.isConfigured = !!this.sendgridApiKey;

    if (!this.isConfigured) {
      console.warn("[EmailNotifications] SendGrid not configured. Email delivery will be mocked. Set SENDGRID_API_KEY to enable real emails.");
    } else {
      console.log("[EmailNotifications] Initialized with SendGrid API key");
    }
  }

  /**
   * Send login notification email
   * @param toEmail - Recipient email address
   * @param userName - User's name
   * @param deviceInfo - Device information (e.g., "Chrome on Windows")
   * @param location - Login location (e.g., "New York, USA")
   * @param ipAddress - IP address of login
   * @returns Success status and message ID
   */
  async sendLoginNotification(
    toEmail: string,
    userName: string,
    deviceInfo: string,
    location: string,
    ipAddress: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const subject = "New Login to Your FarmKonnect Account";
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #2D5016; color: white; padding: 20px; text-align: center;">
          <h1>FarmKonnect Security Alert</h1>
        </div>
        
        <div style="padding: 20px; background-color: #f9f9f9;">
          <p>Hi ${this.escapeHtml(userName)},</p>
          
          <p>We detected a new login to your FarmKonnect account. If this was you, you can safely ignore this email.</p>
          
          <div style="background-color: white; border-left: 4px solid #2D5016; padding: 15px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #2D5016;">Login Details</h3>
            <p><strong>Device:</strong> ${this.escapeHtml(deviceInfo)}</p>
            <p><strong>Location:</strong> ${this.escapeHtml(location)}</p>
            <p><strong>IP Address:</strong> ${this.escapeHtml(ipAddress)}</p>
            <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
          </div>
          
          <div style="background-color: #fff3cd; border: 1px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #856404;">
              <strong>⚠️ Suspicious Activity?</strong><br>
              If you don't recognize this login, please <a href="https://www.farmconnekt.com/account/security" style="color: #856404; text-decoration: underline;">secure your account immediately</a>.
            </p>
          </div>
          
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            This is an automated security notification from FarmKonnect. Please do not reply to this email.
          </p>
        </div>
        
        <div style="background-color: #f0f0f0; padding: 15px; text-align: center; font-size: 12px; color: #666;">
          <p>© 2026 FarmKonnect. All rights reserved.</p>
        </div>
      </div>
    `;

    const textContent = `
      FarmKonnect Security Alert
      
      Hi ${userName},
      
      We detected a new login to your FarmKonnect account.
      
      Login Details:
      Device: ${deviceInfo}
      Location: ${location}
      IP Address: ${ipAddress}
      Time: ${new Date().toLocaleString()}
      
      If this wasn't you, please secure your account immediately at:
      https://www.farmconnekt.com/account/security
      
      This is an automated security notification from FarmKonnect.
    `;

    return this.sendEmail(toEmail, subject, htmlContent, textContent);
  }

  /**
   * Send security alert email
   * @param toEmail - Recipient email address
   * @param userName - User's name
   * @param alertType - Type of alert
   * @param details - Alert details
   * @returns Success status and message ID
   */
  async sendSecurityAlert(
    toEmail: string,
    userName: string,
    alertType: string,
    details: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const subject = `FarmKonnect Security Alert: ${alertType}`;
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #dc3545; color: white; padding: 20px; text-align: center;">
          <h1>⚠️ Security Alert</h1>
        </div>
        
        <div style="padding: 20px; background-color: #f9f9f9;">
          <p>Hi ${this.escapeHtml(userName)},</p>
          
          <p>We detected suspicious activity on your FarmKonnect account.</p>
          
          <div style="background-color: white; border-left: 4px solid #dc3545; padding: 15px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #dc3545;">Alert Details</h3>
            <p><strong>Alert Type:</strong> ${this.escapeHtml(alertType)}</p>
            <p><strong>Details:</strong> ${this.escapeHtml(details)}</p>
            <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
          </div>
          
          <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #721c24;">
              <strong>Immediate Action Required</strong><br>
              Please review your account activity and change your password immediately if you don't recognize this activity.
            </p>
          </div>
          
          <p style="text-align: center; margin: 20px 0;">
            <a href="https://www.farmconnekt.com/account/security" style="background-color: #2D5016; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Secure Your Account
            </a>
          </p>
          
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            This is an automated security notification from FarmKonnect. Please do not reply to this email.
          </p>
        </div>
      </div>
    `;

    const textContent = `
      FarmKonnect Security Alert: ${alertType}
      
      Hi ${userName},
      
      We detected suspicious activity on your account.
      
      Alert Details:
      Alert Type: ${alertType}
      Details: ${details}
      Time: ${new Date().toLocaleString()}
      
      Please review your account activity and change your password immediately if you don't recognize this activity.
      
      Secure your account: https://www.farmconnekt.com/account/security
      
      This is an automated security notification from FarmKonnect.
    `;

    return this.sendEmail(toEmail, subject, htmlContent, textContent);
  }

  /**
   * Send 2FA setup confirmation email
   * @param toEmail - Recipient email address
   * @param userName - User's name
   * @returns Success status and message ID
   */
  async send2FaSetupConfirmation(toEmail: string, userName: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const subject = "Two-Factor Authentication Enabled on Your FarmKonnect Account";
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #28a745; color: white; padding: 20px; text-align: center;">
          <h1>✓ Two-Factor Authentication Enabled</h1>
        </div>
        
        <div style="padding: 20px; background-color: #f9f9f9;">
          <p>Hi ${this.escapeHtml(userName)},</p>
          
          <p>Great! Two-factor authentication (2FA) has been successfully enabled on your FarmKonnect account.</p>
          
          <div style="background-color: white; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #28a745;">What This Means</h3>
            <ul>
              <li>Your account is now more secure</li>
              <li>You'll need to verify your identity using an authenticator app or SMS code</li>
              <li>Only you can access your account, even if someone has your password</li>
            </ul>
          </div>
          
          <div style="background-color: #d4edda; border: 1px solid #c3e6cb; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #155724;">
              <strong>💾 Save Your Backup Codes</strong><br>
              We've generated backup codes that can be used to access your account if you lose access to your 2FA device. Store them in a safe place.
            </p>
          </div>
          
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            If you did not enable 2FA, please contact our support team immediately.
          </p>
        </div>
      </div>
    `;

    const textContent = `
      Two-Factor Authentication Enabled
      
      Hi ${userName},
      
      Great! Two-factor authentication (2FA) has been successfully enabled on your FarmKonnect account.
      
      What This Means:
      - Your account is now more secure
      - You'll need to verify your identity using an authenticator app or SMS code
      - Only you can access your account, even if someone has your password
      
      Save Your Backup Codes:
      We've generated backup codes that can be used to access your account if you lose access to your 2FA device. Store them in a safe place.
      
      If you did not enable 2FA, please contact our support team immediately.
    `;

    return this.sendEmail(toEmail, subject, htmlContent, textContent);
  }

  /**
   * Send generic email
   * @param toEmail - Recipient email address
   * @param subject - Email subject
   * @param htmlContent - HTML email content
   * @param textContent - Plain text email content
   * @returns Success status and message ID
   */
  private async sendEmail(
    toEmail: string,
    subject: string,
    htmlContent: string,
    textContent: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    // Validate email address
    if (!this.isValidEmail(toEmail)) {
      return {
        success: false,
        error: "Invalid email address format",
      };
    }

    // If not configured, return mock response
    if (!this.isConfigured) {
      console.log(`[EmailNotifications] Mock email to ${toEmail}: ${subject}`);
      return {
        success: true,
        messageId: `mock_${Date.now()}`,
      };
    }

    try {
      // Use SendGrid API to send email
      const response = await this.sendViaSendGrid(toEmail, subject, htmlContent, textContent);
      return response;
    } catch (error) {
      console.error("[EmailNotifications] Failed to send email:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to send email",
      };
    }
  }

  /**
   * Send email via SendGrid API
   * @param toEmail - Recipient email address
   * @param subject - Email subject
   * @param htmlContent - HTML email content
   * @param textContent - Plain text email content
   * @returns Success status and message ID
   */
  private async sendViaSendGrid(
    toEmail: string,
    subject: string,
    htmlContent: string,
    textContent: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const url = "https://api.sendgrid.com/v3/mail/send";

    const payload = {
      personalizations: [
        {
          to: [{ email: toEmail }],
          subject: subject,
        },
      ],
      from: { email: this.fromEmail, name: "FarmKonnect" },
      content: [
        { type: "text/plain", value: textContent },
        { type: "text/html", value: htmlContent },
      ],
    };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.sendgridApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`SendGrid API error: ${JSON.stringify(error)}`);
      }

      // SendGrid returns 202 Accepted with no body
      return {
        success: true,
        messageId: response.headers.get("x-message-id") || `sendgrid_${Date.now()}`,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Validate email address format
   * @param email - Email address to validate
   * @returns True if valid, false otherwise
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Escape HTML special characters
   * @param text - Text to escape
   * @returns Escaped text
   */
  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return text.replace(/[&<>"']/g, (char) => map[char]);
  }
}

export const emailNotifications = new EmailNotificationService();
