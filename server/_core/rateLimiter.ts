import { Request, Response, NextFunction } from "express";

/**
 * Rate Limiter Configuration
 */
interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  message: string; // Error message
  statusCode: number; // HTTP status code
}

/**
 * Rate Limiter Store
 */
interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

/**
 * Rate Limiter Service
 * Prevents brute force attacks and API abuse
 */
class RateLimiterService {
  private store: RateLimitStore = {};
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  /**
   * Create a rate limiter middleware
   * @param config - Rate limiter configuration
   * @returns Express middleware function
   */
  middleware(config: RateLimitConfig) {
    return (req: Request, res: Response, next: NextFunction) => {
      const key = this.getKey(req);
      const now = Date.now();

      if (!this.store[key]) {
        this.store[key] = {
          count: 1,
          resetTime: now + config.windowMs,
        };
        return next();
      }

      const entry = this.store[key];

      // Check if window has expired
      if (now > entry.resetTime) {
        entry.count = 1;
        entry.resetTime = now + config.windowMs;
        return next();
      }

      // Increment request count
      entry.count++;

      // Check if limit exceeded
      if (entry.count > config.maxRequests) {
        const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
        res.set("Retry-After", retryAfter.toString());
        return res.status(config.statusCode).json({
          error: config.message,
          retryAfter,
        });
      }

      next();
    };
  }

  /**
   * Create a login attempt limiter
   * Prevents brute force login attacks
   * @returns Express middleware function
   */
  loginLimiter() {
    return this.middleware({
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5, // 5 attempts per 15 minutes
      message: "Too many login attempts. Please try again later.",
      statusCode: 429,
    });
  }

  /**
   * Create a password reset limiter
   * Prevents password reset abuse
   * @returns Express middleware function
   */
  passwordResetLimiter() {
    return this.middleware({
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 3, // 3 attempts per hour
      message: "Too many password reset attempts. Please try again later.",
      statusCode: 429,
    });
  }

  /**
   * Create a 2FA attempt limiter
   * Prevents 2FA brute force attacks
   * @returns Express middleware function
   */
  twoFactorLimiter() {
    return this.middleware({
      windowMs: 10 * 60 * 1000, // 10 minutes
      maxRequests: 10, // 10 attempts per 10 minutes
      message: "Too many 2FA attempts. Please try again later.",
      statusCode: 429,
    });
  }

  /**
   * Create an API rate limiter
   * General API rate limiting
   * @returns Express middleware function
   */
  apiLimiter() {
    return this.middleware({
      windowMs: 1 * 60 * 1000, // 1 minute
      maxRequests: 100, // 100 requests per minute
      message: "Too many requests. Please try again later.",
      statusCode: 429,
    });
  }

  /**
   * Get rate limit key from request
   * Uses IP address and endpoint
   * @param req - Express request object
   * @returns Rate limit key
   */
  private getKey(req: Request): string {
    const ip = this.getClientIp(req);
    const endpoint = req.path;
    return `${ip}:${endpoint}`;
  }

  /**
   * Get client IP address from request
   * Handles proxies and load balancers
   * @param req - Express request object
   * @returns Client IP address
   */
  private getClientIp(req: Request): string {
    const forwarded = req.headers["x-forwarded-for"];
    if (typeof forwarded === "string") {
      return forwarded.split(",")[0].trim();
    }
    return req.socket.remoteAddress || "unknown";
  }

  /**
   * Clean up expired entries from store
   */
  private cleanup() {
    const now = Date.now();
    for (const key in this.store) {
      if (now > this.store[key].resetTime) {
        delete this.store[key];
      }
    }
  }

  /**
   * Reset rate limit for a specific key
   * @param key - Rate limit key
   */
  reset(key: string) {
    delete this.store[key];
  }

  /**
   * Reset all rate limits
   */
  resetAll() {
    this.store = {};
  }

  /**
   * Get rate limit status for a key
   * @param key - Rate limit key
   * @returns Rate limit status
   */
  getStatus(key: string) {
    return this.store[key] || null;
  }

  /**
   * Destroy rate limiter
   */
  destroy() {
    clearInterval(this.cleanupInterval);
    this.store = {};
  }
}

export const rateLimiter = new RateLimiterService();

/**
 * Brute Force Detection Service
 * Detects and blocks suspicious patterns
 */
class BruteForceDetectionService {
  private failedAttempts: Map<string, { count: number; lastAttempt: number }> = new Map();
  private blockedIps: Map<string, number> = new Map();
  private readonly maxAttempts = 5;
  private readonly lockoutDuration = 30 * 60 * 1000; // 30 minutes
  private readonly attemptWindow = 15 * 60 * 1000; // 15 minutes

  /**
   * Record a failed login attempt
   * @param identifier - User identifier (email, username, or IP)
   * @returns Whether the user/IP should be blocked
   */
  recordFailedAttempt(identifier: string): boolean {
    const now = Date.now();
    const attempt = this.failedAttempts.get(identifier);

    if (!attempt) {
      this.failedAttempts.set(identifier, { count: 1, lastAttempt: now });
      return false;
    }

    // Reset if outside attempt window
    if (now - attempt.lastAttempt > this.attemptWindow) {
      this.failedAttempts.set(identifier, { count: 1, lastAttempt: now });
      return false;
    }

    // Increment attempt count
    attempt.count++;
    attempt.lastAttempt = now;

    // Block if max attempts exceeded
    if (attempt.count >= this.maxAttempts) {
      this.blockedIps.set(identifier, now + this.lockoutDuration);
      return true;
    }

    return false;
  }

  /**
   * Record a successful login
   * @param identifier - User identifier
   */
  recordSuccessfulAttempt(identifier: string) {
    this.failedAttempts.delete(identifier);
  }

  /**
   * Check if identifier is blocked
   * @param identifier - User identifier
   * @returns Whether the identifier is blocked
   */
  isBlocked(identifier: string): boolean {
    const blockTime = this.blockedIps.get(identifier);
    if (!blockTime) {
      return false;
    }

    const now = Date.now();
    if (now > blockTime) {
      this.blockedIps.delete(identifier);
      return false;
    }

    return true;
  }

  /**
   * Get remaining lockout time
   * @param identifier - User identifier
   * @returns Remaining lockout time in seconds, or 0 if not blocked
   */
  getRemainingLockoutTime(identifier: string): number {
    const blockTime = this.blockedIps.get(identifier);
    if (!blockTime) {
      return 0;
    }

    const remaining = blockTime - Date.now();
    return Math.max(0, Math.ceil(remaining / 1000));
  }

  /**
   * Unblock an identifier
   * @param identifier - User identifier
   */
  unblock(identifier: string) {
    this.blockedIps.delete(identifier);
    this.failedAttempts.delete(identifier);
  }

  /**
   * Get failed attempt count
   * @param identifier - User identifier
   * @returns Number of failed attempts
   */
  getFailedAttemptCount(identifier: string): number {
    const attempt = this.failedAttempts.get(identifier);
    if (!attempt) {
      return 0;
    }

    const now = Date.now();
    if (now - attempt.lastAttempt > this.attemptWindow) {
      return 0;
    }

    return attempt.count;
  }
}

export const bruteForceDetection = new BruteForceDetectionService();
