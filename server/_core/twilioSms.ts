import { ENV } from "./env";

/**
 * Twilio SMS Service for sending OTP and notifications
 */
class TwilioSmsService {
  private accountSid: string;
  private authToken: string;
  private phoneNumber: string;
  private isConfigured: boolean;

  constructor() {
    this.accountSid = ENV.twilioAccountSid;
    this.authToken = ENV.twilioAuthToken;
    this.phoneNumber = ENV.twilioPhoneNumber;

    this.isConfigured = !!(this.accountSid && this.authToken && this.phoneNumber);

    if (!this.isConfigured) {
      console.warn(
        "[TwilioSMS] Not configured. SMS delivery will be mocked. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER to enable real SMS."
      );
    } else {
      console.log("[TwilioSMS] Initialized with account:", this.accountSid);
    }
  }

  /**
   * Send OTP via SMS
   * @param phoneNumber - Recipient phone number (E.164 format: +1234567890)
   * @param otp - One-time password to send
   * @returns Success status and message ID
   */
  async sendOtp(phoneNumber: string, otp: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const message = `Your FarmKonnect OTP is: ${otp}. Valid for 10 minutes. Do not share this code.`;
    return this.sendSms(phoneNumber, message);
  }

  /**
   * Send login notification via SMS
   * @param phoneNumber - Recipient phone number
   * @param deviceInfo - Device information (e.g., "Chrome on Windows")
   * @param location - Location of login (e.g., "New York, USA")
   * @returns Success status and message ID
   */
  async sendLoginNotification(
    phoneNumber: string,
    deviceInfo: string,
    location: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const message = `New login to your FarmKonnect account from ${deviceInfo} in ${location}. If this wasn't you, secure your account immediately.`;
    return this.sendSms(phoneNumber, message);
  }

  /**
   * Send security alert via SMS
   * @param phoneNumber - Recipient phone number
   * @param alertType - Type of alert (e.g., "suspicious_activity", "failed_attempts")
   * @param details - Additional details about the alert
   * @returns Success status and message ID
   */
  async sendSecurityAlert(
    phoneNumber: string,
    alertType: string,
    details: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const message = `FarmKonnect Security Alert: ${alertType}. ${details}. Review your account activity immediately.`;
    return this.sendSms(phoneNumber, message);
  }

  /**
   * Send generic SMS message
   * @param phoneNumber - Recipient phone number (E.164 format)
   * @param message - Message content
   * @returns Success status and message ID
   */
  private async sendSms(
    phoneNumber: string,
    message: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    // Validate phone number format
    if (!this.isValidPhoneNumber(phoneNumber)) {
      return {
        success: false,
        error: "Invalid phone number format. Use E.164 format: +1234567890",
      };
    }

    // If not configured, return mock response
    if (!this.isConfigured) {
      console.log(`[TwilioSMS] Mock SMS to ${phoneNumber}: ${message}`);
      return {
        success: true,
        messageId: `mock_${Date.now()}`,
      };
    }

    try {
      // Use Twilio API to send SMS
      const response = await this.sendViaTwilio(phoneNumber, message);
      return response;
    } catch (error) {
      console.error("[TwilioSMS] Failed to send SMS:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to send SMS",
      };
    }
  }

  /**
   * Send SMS via Twilio API
   * @param phoneNumber - Recipient phone number
   * @param message - Message content
   * @returns Success status and message ID
   */
  private async sendViaTwilio(
    phoneNumber: string,
    message: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;

    const params = new URLSearchParams();
    params.append("From", this.phoneNumber);
    params.append("To", phoneNumber);
    params.append("Body", message);

    const auth = Buffer.from(`${this.accountSid}:${this.authToken}`).toString("base64");

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Twilio API error: ${error.message}`);
      }

      const data = await response.json();
      return {
        success: true,
        messageId: data.sid,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Validate phone number format (E.164)
   * @param phoneNumber - Phone number to validate
   * @returns True if valid, false otherwise
   */
  private isValidPhoneNumber(phoneNumber: string): boolean {
    // E.164 format: +[1-9]{1}[0-9]{1,14}
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    return e164Regex.test(phoneNumber);
  }

  /**
   * Format phone number to E.164 format
   * @param phoneNumber - Phone number to format
   * @param countryCode - Country code (default: +1 for US)
   * @returns Formatted phone number or null if invalid
   */
  static formatPhoneNumber(phoneNumber: string, countryCode: string = "+1"): string | null {
    // Remove all non-digit characters
    const digits = phoneNumber.replace(/\D/g, "");

    // If already has country code, use as-is
    if (phoneNumber.startsWith("+")) {
      return this.isValidPhoneNumber(phoneNumber) ? phoneNumber : null;
    }

    // Add country code if not present
    const formatted = countryCode + digits;
    return this.isValidPhoneNumber(formatted) ? formatted : null;
  }
}

export const twilioSms = new TwilioSmsService();
