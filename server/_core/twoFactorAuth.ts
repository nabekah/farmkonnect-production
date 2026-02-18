import { randomBytes } from "crypto";
import { authenticator } from "otplib";

/**
 * Two-Factor Authentication Service
 * Supports TOTP (Time-based One-Time Password) and SMS-based 2FA
 */

export interface TwoFactorSetupResponse {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export interface VerifyTotpResponse {
  valid: boolean;
  message: string;
}

/**
 * Generate TOTP secret and QR code for authenticator apps
 */
export function generateTotpSecret(email: string, appName: string = "FarmKonnect"): TwoFactorSetupResponse {
  // Generate a random secret
  const secret = authenticator.generateSecret();

  // Generate QR code URI for authenticator apps
  const otpauth_url = authenticator.keyuri(email, appName, secret);

  // Generate backup codes for account recovery
  const backupCodes = generateBackupCodes(10);

  return {
    secret,
    qrCode: otpauth_url,
    backupCodes,
  };
}

/**
 * Verify TOTP token
 */
export function verifyTotp(token: string, secret: string): VerifyTotpResponse {
  try {
    const isValid = authenticator.check(token, secret);
    return {
      valid: isValid,
      message: isValid ? "TOTP verification successful" : "Invalid TOTP token",
    };
  } catch (error) {
    return {
      valid: false,
      message: "Error verifying TOTP token",
    };
  }
}

/**
 * Generate backup codes for account recovery
 */
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    // Generate 8-character alphanumeric codes
    const code = randomBytes(4).toString("hex").toUpperCase();
    codes.push(code);
  }
  return codes;
}

/**
 * Verify backup code
 */
export function verifyBackupCode(code: string, backupCodes: string[]): boolean {
  return backupCodes.includes(code.toUpperCase());
}

/**
 * Generate SMS OTP (6-digit code)
 */
export function generateSmsOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Rate limiting for 2FA attempts
 */
export interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number; // Time window in milliseconds
}

export const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
};

/**
 * Check if user has exceeded rate limit for 2FA attempts
 */
export function checkRateLimit(
  attempts: Array<{ attemptTime: Date }>,
  config: RateLimitConfig = DEFAULT_RATE_LIMIT
): { allowed: boolean; remainingAttempts: number; resetTime: Date } {
  const now = new Date();
  const windowStart = new Date(now.getTime() - config.windowMs);

  // Filter attempts within the current window
  const recentAttempts = attempts.filter((a) => a.attemptTime > windowStart);

  const allowed = recentAttempts.length < config.maxAttempts;
  const remainingAttempts = Math.max(0, config.maxAttempts - recentAttempts.length);
  const resetTime = new Date(
    (recentAttempts[0]?.attemptTime.getTime() || now.getTime()) + config.windowMs
  );

  return {
    allowed,
    remainingAttempts,
    resetTime,
  };
}

/**
 * Generate device fingerprint for tracking login devices
 */
export function generateDeviceFingerprint(userAgent: string, ipAddress: string): string {
  const crypto = require("crypto");
  const hash = crypto.createHash("sha256");
  hash.update(`${userAgent}:${ipAddress}`);
  return hash.digest("hex");
}

/**
 * Detect device type from user agent
 */
export function detectDeviceType(userAgent: string): "mobile" | "tablet" | "desktop" {
  const ua = userAgent.toLowerCase();

  if (/mobile|android|iphone|ipod/.test(ua)) {
    return "mobile";
  } else if (/ipad|tablet|kindle/.test(ua)) {
    return "tablet";
  } else {
    return "desktop";
  }
}
