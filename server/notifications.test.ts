import { describe, it, expect } from 'vitest';
import { sendEmailNotification, sendSMSNotification } from './_core/notificationService';

describe('Notification Service - API Validation', () => {
  it('should validate SendGrid API key format', () => {
    const apiKey = process.env.SENDGRID_API_KEY;
    expect(apiKey).toBeDefined();
    expect(apiKey).toMatch(/^SG\./); // SendGrid keys start with "SG."
  });

  it('should validate Twilio credentials format', () => {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

    expect(accountSid).toBeDefined();
    expect(authToken).toBeDefined();
    expect(phoneNumber).toBeDefined();

    // Twilio Account SIDs start with "AC" or API Keys start with "SK"
    expect(accountSid).toMatch(/^(AC|SK)[a-f0-9]{32}$/i);
    
    // Phone number should be in E.164 format
    expect(phoneNumber).toMatch(/^\+[1-9]\d{1,14}$/);
  });

  it('should have valid environment configuration', () => {
    // Verify all required environment variables are set
    expect(process.env.SENDGRID_API_KEY).toBeTruthy();
    expect(process.env.TWILIO_ACCOUNT_SID).toBeTruthy();
    expect(process.env.TWILIO_AUTH_TOKEN).toBeTruthy();
    expect(process.env.TWILIO_PHONE_NUMBER).toBeTruthy();
  });
});
