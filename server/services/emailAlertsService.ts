import { sendEmail } from "../_core/emailNotifications";
import { getDb } from "../db";
import { securityAlertPreferences } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export type AlertEventType =
  | "ACCOUNT_LOCKED"
  | "MULTIPLE_FAILED_LOGINS"
  | "2FA_DISABLED"
  | "PASSWORD_CHANGED"
  | "SUSPICIOUS_LOGIN"
  | "NEW_DEVICE_LOGIN"
  | "RATE_LIMIT_EXCEEDED"
  | "SECURITY_BREACH";

export interface AlertConfig {
  userId: number;
  eventType: AlertEventType;
  enabled: boolean;
  emailAddress: string;
}

export interface AlertEvent {
  userId: number;
  eventType: AlertEventType;
  emailAddress: string;
  details: {
    ipAddress?: string;
    location?: string;
    deviceName?: string;
    timestamp?: string;
    reason?: string;
  };
}

// In-memory throttling store to prevent spam
const alertThrottleStore = new Map<string, number>();
const THROTTLE_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

export class EmailAlertsService {
  /**
   * Check if alert should be sent (throttling)
   */
  private static shouldSendAlert(key: string): boolean {
    const now = Date.now();
    const lastSent = alertThrottleStore.get(key);

    if (!lastSent) {
      alertThrottleStore.set(key, now);
      return true;
    }

    if (now - lastSent > THROTTLE_WINDOW_MS) {
      alertThrottleStore.set(key, now);
      return true;
    }

    return false;
  }

  /**
   * Send account locked alert
   */
  static async sendAccountLockedAlert(event: AlertEvent): Promise<void> {
    const throttleKey = `account_locked_${event.userId}`;

    if (!this.shouldSendAlert(throttleKey)) {
      console.log(`Alert throttled: ${throttleKey}`);
      return;
    }

    const html = `
      <h2 style="color: #dc2626;">⚠️ Account Locked</h2>
      <p>Your FarmKonnect account has been locked due to too many failed login attempts.</p>
      <div style="background-color: #fef2f2; padding: 12px; border-radius: 6px; margin: 16px 0;">
        <p><strong>IP Address:</strong> ${event.details.ipAddress || "Unknown"}</p>
        ${event.details.location ? `<p><strong>Location:</strong> ${event.details.location}</p>` : ""}
        <p><strong>Time:</strong> ${event.details.timestamp || new Date().toISOString()}</p>
      </div>
      <p>Your account will be automatically unlocked in 15 minutes. If this wasn't you, please change your password immediately.</p>
      <p><a href="https://farmkonnect.app/reset-password" style="color: #16a34a; text-decoration: none;">Reset Password</a></p>
    `;

    await this.sendAlert(event.emailAddress, "Account Locked - FarmKonnect", html);
  }

  /**
   * Send multiple failed logins alert
   */
  static async sendMultipleFailedLoginsAlert(event: AlertEvent): Promise<void> {
    const throttleKey = `failed_logins_${event.userId}`;

    if (!this.shouldSendAlert(throttleKey)) {
      console.log(`Alert throttled: ${throttleKey}`);
      return;
    }

    const html = `
      <h2 style="color: #ea580c;">⚠️ Multiple Failed Login Attempts</h2>
      <p>We detected multiple failed login attempts on your FarmKonnect account.</p>
      <div style="background-color: #fed7aa; padding: 12px; border-radius: 6px; margin: 16px 0;">
        <p><strong>IP Address:</strong> ${event.details.ipAddress || "Unknown"}</p>
        ${event.details.location ? `<p><strong>Location:</strong> ${event.details.location}</p>` : ""}
        <p><strong>Time:</strong> ${event.details.timestamp || new Date().toISOString()}</p>
      </div>
      <p>If this was you, you can ignore this message. If this wasn't you, please secure your account immediately.</p>
      <p><a href="https://farmkonnect.app/reset-password" style="color: #16a34a; text-decoration: none;">Reset Password</a></p>
    `;

    await this.sendAlert(event.emailAddress, "Failed Login Attempts - FarmKonnect", html);
  }

  /**
   * Send 2FA disabled alert
   */
  static async send2FADisabledAlert(event: AlertEvent): Promise<void> {
    const throttleKey = `2fa_disabled_${event.userId}`;

    if (!this.shouldSendAlert(throttleKey)) {
      console.log(`Alert throttled: ${throttleKey}`);
      return;
    }

    const html = `
      <h2 style="color: #dc2626;">🔓 Two-Factor Authentication Disabled</h2>
      <p>Two-factor authentication has been disabled on your FarmKonnect account.</p>
      <div style="background-color: #fef2f2; padding: 12px; border-radius: 6px; margin: 16px 0;">
        <p><strong>IP Address:</strong> ${event.details.ipAddress || "Unknown"}</p>
        ${event.details.location ? `<p><strong>Location:</strong> ${event.details.location}</p>` : ""}
        <p><strong>Time:</strong> ${event.details.timestamp || new Date().toISOString()}</p>
      </div>
      <p>Your account is now less secure. We recommend re-enabling 2FA immediately.</p>
      <p><a href="https://farmkonnect.app/security/2fa" style="color: #16a34a; text-decoration: none;">Re-enable 2FA</a></p>
    `;

    await this.sendAlert(event.emailAddress, "2FA Disabled - FarmKonnect", html);
  }

  /**
   * Send password changed alert
   */
  static async sendPasswordChangedAlert(event: AlertEvent): Promise<void> {
    const throttleKey = `password_changed_${event.userId}`;

    if (!this.shouldSendAlert(throttleKey)) {
      console.log(`Alert throttled: ${throttleKey}`);
      return;
    }

    const html = `
      <h2 style="color: #16a34a;">🔐 Password Changed</h2>
      <p>Your FarmKonnect password has been successfully changed.</p>
      <div style="background-color: #f0fdf4; padding: 12px; border-radius: 6px; margin: 16px 0;">
        <p><strong>IP Address:</strong> ${event.details.ipAddress || "Unknown"}</p>
        ${event.details.location ? `<p><strong>Location:</strong> ${event.details.location}</p>` : ""}
        <p><strong>Time:</strong> ${event.details.timestamp || new Date().toISOString()}</p>
      </div>
      <p>If you didn't make this change, please secure your account immediately.</p>
      <p><a href="https://farmkonnect.app/reset-password" style="color: #16a34a; text-decoration: none;">Reset Password</a></p>
    `;

    await this.sendAlert(event.emailAddress, "Password Changed - FarmKonnect", html);
  }

  /**
   * Send suspicious login alert
   */
  static async sendSuspiciousLoginAlert(event: AlertEvent): Promise<void> {
    const throttleKey = `suspicious_login_${event.userId}`;

    if (!this.shouldSendAlert(throttleKey)) {
      console.log(`Alert throttled: ${throttleKey}`);
      return;
    }

    const html = `
      <h2 style="color: #dc2626;">🚨 Suspicious Login Detected</h2>
      <p>We detected a login to your FarmKonnect account from an unusual location or device.</p>
      <div style="background-color: #fef2f2; padding: 12px; border-radius: 6px; margin: 16px 0;">
        <p><strong>IP Address:</strong> ${event.details.ipAddress || "Unknown"}</p>
        ${event.details.location ? `<p><strong>Location:</strong> ${event.details.location}</p>` : ""}
        ${event.details.deviceName ? `<p><strong>Device:</strong> ${event.details.deviceName}</p>` : ""}
        <p><strong>Time:</strong> ${event.details.timestamp || new Date().toISOString()}</p>
      </div>
      <p>If this was you, you can ignore this message. If this wasn't you, please secure your account immediately.</p>
      <p><a href="https://farmkonnect.app/security/sessions" style="color: #16a34a; text-decoration: none;">Review Active Sessions</a></p>
    `;

    await this.sendAlert(event.emailAddress, "Suspicious Login - FarmKonnect", html);
  }

  /**
   * Send new device login alert
   */
  static async sendNewDeviceLoginAlert(event: AlertEvent): Promise<void> {
    const throttleKey = `new_device_${event.userId}`;

    if (!this.shouldSendAlert(throttleKey)) {
      console.log(`Alert throttled: ${throttleKey}`);
      return;
    }

    const html = `
      <h2 style="color: #ea580c;">📱 New Device Login</h2>
      <p>Your FarmKonnect account was accessed from a new device.</p>
      <div style="background-color: #fed7aa; padding: 12px; border-radius: 6px; margin: 16px 0;">
        ${event.details.deviceName ? `<p><strong>Device:</strong> ${event.details.deviceName}</p>` : ""}
        <p><strong>IP Address:</strong> ${event.details.ipAddress || "Unknown"}</p>
        ${event.details.location ? `<p><strong>Location:</strong> ${event.details.location}</p>` : ""}
        <p><strong>Time:</strong> ${event.details.timestamp || new Date().toISOString()}</p>
      </div>
      <p>If this was you, no action is needed. If this wasn't you, please review your active sessions.</p>
      <p><a href="https://farmkonnect.app/security/sessions" style="color: #16a34a; text-decoration: none;">Review Active Sessions</a></p>
    `;

    await this.sendAlert(event.emailAddress, "New Device Login - FarmKonnect", html);
  }

  /**
   * Send rate limit exceeded alert
   */
  static async sendRateLimitExceededAlert(event: AlertEvent): Promise<void> {
    const throttleKey = `rate_limit_${event.userId}`;

    if (!this.shouldSendAlert(throttleKey)) {
      console.log(`Alert throttled: ${throttleKey}`);
      return;
    }

    const html = `
      <h2 style="color: #dc2626;">🔒 Rate Limit Exceeded</h2>
      <p>Your account has exceeded the rate limit for ${event.details.reason || "authentication attempts"}.</p>
      <div style="background-color: #fef2f2; padding: 12px; border-radius: 6px; margin: 16px 0;">
        <p><strong>IP Address:</strong> ${event.details.ipAddress || "Unknown"}</p>
        ${event.details.location ? `<p><strong>Location:</strong> ${event.details.location}</p>` : ""}
        <p><strong>Time:</strong> ${event.details.timestamp || new Date().toISOString()}</p>
      </div>
      <p>Your account has been temporarily locked for security. Please try again in 15 minutes.</p>
    `;

    await this.sendAlert(event.emailAddress, "Rate Limit Exceeded - FarmKonnect", html);
  }

  /**
   * Internal method to send email alert
   */
  private static async sendAlert(to: string, subject: string, html: string): Promise<void> {
    try {
      await sendEmail({
        to,
        subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            ${html}
            <hr style="margin-top: 32px; border: none; border-top: 1px solid #e5e7eb;">
            <p style="font-size: 12px; color: #6b7280; margin-top: 16px;">
              This is an automated security alert from FarmKonnect. If you didn't request this, please ignore it.
              <br>
              <a href="https://farmkonnect.app/security/alerts" style="color: #16a34a; text-decoration: none;">Manage Alert Preferences</a>
            </p>
          </div>
        `,
      });
    } catch (error) {
      console.error("Failed to send email alert:", error);
    }
  }

  /**
   * Get alert preferences for user
   */
  static async getAlertPreferences(userId: number): Promise<AlertConfig[]> {
    const db = getDb();

    const prefs = await db
      .select()
      .from(securityAlertPreferences)
      .where(eq(securityAlertPreferences.userId, userId));

    return prefs.map((p) => ({
      userId: p.userId,
      eventType: p.eventType as AlertEventType,
      enabled: p.enabled,
      emailAddress: p.emailAddress,
    }));
  }

  /**
   * Update alert preference
   */
  static async updateAlertPreference(
    userId: number,
    eventType: AlertEventType,
    enabled: boolean
  ): Promise<void> {
    const db = getDb();

    const existing = await db
      .select()
      .from(securityAlertPreferences)
      .where(
        and(
          eq(securityAlertPreferences.userId, userId),
          eq(securityAlertPreferences.eventType, eventType)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(securityAlertPreferences)
        .set({ enabled })
        .where(
          and(
            eq(securityAlertPreferences.userId, userId),
            eq(securityAlertPreferences.eventType, eventType)
          )
        );
    } else {
      // Get user email
      const user = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.id, userId),
      });

      if (user?.email) {
        await db.insert(securityAlertPreferences).values({
          userId,
          eventType,
          enabled,
          emailAddress: user.email,
        });
      }
    }
  }

  /**
   * Clear throttle store (for testing)
   */
  static clearThrottle(): void {
    alertThrottleStore.clear();
  }
}

// Helper import for 'and' operator
import { and } from "drizzle-orm";
