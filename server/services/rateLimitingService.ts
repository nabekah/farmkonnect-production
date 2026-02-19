import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

// In-memory rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { attempts: number; firstAttempt: number; locked: boolean; lockedUntil: number }>();

const FAILED_LOGIN_MAX_ATTEMPTS = 5;
const FAILED_LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const ACCOUNT_LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

const TWO_FA_MAX_ATTEMPTS = 5;
const TWO_FA_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const TWO_FA_LOCKOUT_DURATION_MS = 10 * 60 * 1000; // 10 minutes

export interface RateLimitStatus {
  isLimited: boolean;
  remainingAttempts: number;
  resetTime: number;
  isLocked: boolean;
  lockExpiresAt: number | null;
  message: string;
}

export class RateLimitingService {
  /**
   * Check rate limit for login attempts
   * Returns true if request is allowed, false if rate limited
   */
  static checkLoginRateLimit(email: string, ipAddress: string): RateLimitStatus {
    const key = `login:${email}:${ipAddress}`;
    return this.checkRateLimit(key, FAILED_LOGIN_MAX_ATTEMPTS, FAILED_LOGIN_WINDOW_MS);
  }

  /**
   * Check rate limit for 2FA attempts
   */
  static check2FARateLimit(userId: number, ipAddress: string): RateLimitStatus {
    const key = `2fa:${userId}:${ipAddress}`;
    return this.checkRateLimit(key, TWO_FA_MAX_ATTEMPTS, TWO_FA_WINDOW_MS);
  }

  /**
   * Record a failed login attempt
   */
  static recordFailedLogin(email: string, ipAddress: string): RateLimitStatus {
    const key = `login:${email}:${ipAddress}`;
    return this.recordAttempt(key, FAILED_LOGIN_MAX_ATTEMPTS, FAILED_LOGIN_WINDOW_MS, ACCOUNT_LOCKOUT_DURATION_MS);
  }

  /**
   * Record a failed 2FA attempt
   */
  static recordFailed2FA(userId: number, ipAddress: string): RateLimitStatus {
    const key = `2fa:${userId}:${ipAddress}`;
    return this.recordAttempt(key, TWO_FA_MAX_ATTEMPTS, TWO_FA_WINDOW_MS, TWO_FA_LOCKOUT_DURATION_MS);
  }

  /**
   * Reset rate limit for successful login
   */
  static resetLoginRateLimit(email: string, ipAddress: string): void {
    const key = `login:${email}:${ipAddress}`;
    rateLimitStore.delete(key);
  }

  /**
   * Reset rate limit for successful 2FA
   */
  static reset2FARateLimit(userId: number, ipAddress: string): void {
    const key = `2fa:${userId}:${ipAddress}`;
    rateLimitStore.delete(key);
  }

  /**
   * Get current rate limit status
   */
  static getStatus(key: string, maxAttempts: number, windowMs: number): RateLimitStatus {
    const now = Date.now();
    const record = rateLimitStore.get(key);

    if (!record) {
      return {
        isLimited: false,
        remainingAttempts: maxAttempts,
        resetTime: now + windowMs,
        isLocked: false,
        lockExpiresAt: null,
        message: "No rate limit",
      };
    }

    // Check if account is locked
    if (record.locked && record.lockedUntil > now) {
      const secondsRemaining = Math.ceil((record.lockedUntil - now) / 1000);
      return {
        isLimited: true,
        remainingAttempts: 0,
        resetTime: record.lockedUntil,
        isLocked: true,
        lockExpiresAt: record.lockedUntil,
        message: `Account locked. Try again in ${secondsRemaining} seconds`,
      };
    }

    // Check if window has expired
    if (now - record.firstAttempt > windowMs) {
      rateLimitStore.delete(key);
      return {
        isLimited: false,
        remainingAttempts: maxAttempts,
        resetTime: now + windowMs,
        isLocked: false,
        lockExpiresAt: null,
        message: "Rate limit window expired",
      };
    }

    const remainingAttempts = Math.max(0, maxAttempts - record.attempts);
    const isLimited = remainingAttempts === 0;

    return {
      isLimited,
      remainingAttempts,
      resetTime: record.firstAttempt + windowMs,
      isLocked: false,
      lockExpiresAt: null,
      message: isLimited ? "Too many attempts. Please try again later." : `${remainingAttempts} attempts remaining`,
    };
  }

  /**
   * Internal method to check rate limit
   */
  private static checkRateLimit(key: string, maxAttempts: number, windowMs: number): RateLimitStatus {
    const now = Date.now();
    const record = rateLimitStore.get(key);

    if (!record) {
      return {
        isLimited: false,
        remainingAttempts: maxAttempts,
        resetTime: now + windowMs,
        isLocked: false,
        lockExpiresAt: null,
        message: "No rate limit",
      };
    }

    // Check if account is locked
    if (record.locked && record.lockedUntil > now) {
      const secondsRemaining = Math.ceil((record.lockedUntil - now) / 1000);
      return {
        isLimited: true,
        remainingAttempts: 0,
        resetTime: record.lockedUntil,
        isLocked: true,
        lockExpiresAt: record.lockedUntil,
        message: `Too many attempts. Try again in ${secondsRemaining} seconds`,
      };
    }

    // Check if window has expired
    if (now - record.firstAttempt > windowMs) {
      rateLimitStore.delete(key);
      return {
        isLimited: false,
        remainingAttempts: maxAttempts,
        resetTime: now + windowMs,
        isLocked: false,
        lockExpiresAt: null,
        message: "Rate limit window expired",
      };
    }

    const remainingAttempts = Math.max(0, maxAttempts - record.attempts);
    const isLimited = remainingAttempts === 0;

    return {
      isLimited,
      remainingAttempts,
      resetTime: record.firstAttempt + windowMs,
      isLocked: false,
      lockExpiresAt: null,
      message: isLimited ? "Too many attempts. Please try again later." : `${remainingAttempts} attempts remaining`,
    };
  }

  /**
   * Internal method to record an attempt
   */
  private static recordAttempt(key: string, maxAttempts: number, windowMs: number, lockoutDurationMs: number): RateLimitStatus {
    const now = Date.now();
    let record = rateLimitStore.get(key);

    if (!record) {
      record = {
        attempts: 1,
        firstAttempt: now,
        locked: false,
        lockedUntil: 0,
      };
      rateLimitStore.set(key, record);
    } else {
      // Check if window has expired
      if (now - record.firstAttempt > windowMs) {
        record.attempts = 1;
        record.firstAttempt = now;
        record.locked = false;
        record.lockedUntil = 0;
      } else {
        record.attempts++;
      }
    }

    // Lock account if max attempts reached
    if (record.attempts >= maxAttempts) {
      record.locked = true;
      record.lockedUntil = now + lockoutDurationMs;
    }

    rateLimitStore.set(key, record);

    return this.getStatus(key, maxAttempts, windowMs);
  }

  /**
   * Clear all rate limit records (for testing)
   */
  static clearAll(): void {
    rateLimitStore.clear();
  }

  /**
   * Get rate limit statistics
   */
  static getStats(): { totalKeys: number; lockedAccounts: number } {
    const now = Date.now();
    let lockedCount = 0;

    rateLimitStore.forEach((record) => {
      if (record.locked && record.lockedUntil > now) {
        lockedCount++;
      }
    });

    return {
      totalKeys: rateLimitStore.size,
      lockedAccounts: lockedCount,
    };
  }
}
