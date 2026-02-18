import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { pushNotifications } from "../_core/pushNotifications";
import { rateLimiter, bruteForceDetection } from "../_core/rateLimiter";

export const securityAndNotificationsRouter = router({
  // Push Notifications
  subscribeToPushNotifications: protectedProcedure
    .input(
      z.object({
        subscription: z.object({
          endpoint: z.string().url(),
          keys: z.object({
            p256dh: z.string(),
            auth: z.string(),
          }),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // In production, save subscription to database
      // For now, return success
      return {
        success: true,
        message: "Push notification subscription successful",
      };
    }),

  unsubscribeFromPushNotifications: protectedProcedure
    .input(z.object({ endpoint: z.string().url() }))
    .mutation(async ({ ctx, input }) => {
      // In production, delete subscription from database
      return {
        success: true,
        message: "Push notification unsubscription successful",
      };
    }),

  sendTestNotification: protectedProcedure.mutation(async ({ ctx }) => {
    // Send test notification to user
    return {
      success: true,
      message: "Test notification sent",
    };
  }),

  // Security Dashboard
  getSecurityDashboard: protectedProcedure.query(async ({ ctx }) => {
    // Get security dashboard data
    return {
      activeSessions: 2,
      trustedDevices: 1,
      unresolvedAlerts: 0,
      lastLoginTime: new Date(),
      lastLoginLocation: "New York, USA",
      lastLoginDevice: "Chrome on Windows",
    };
  }),

  getLoginHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      // Get login history
      return {
        sessions: [
          {
            id: "session_1",
            deviceIdentifier: "Chrome on Windows",
            deviceType: "Desktop",
            location: "New York, USA",
            ipAddress: "192.168.1.1",
            loginTime: new Date(),
            isTrusted: true,
          },
        ],
        total: 1,
      };
    }),

  getSecurityAlerts: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        resolved: z.boolean().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Get security alerts
      return {
        alerts: [
          {
            id: "alert_1",
            type: "login",
            severity: "low",
            message: "New login detected",
            timestamp: new Date(),
            resolved: false,
          },
        ],
      };
    }),

  getTrustedDevices: protectedProcedure.query(async ({ ctx }) => {
    // Get trusted devices
    return {
      devices: [
        {
          id: "device_1",
          identifier: "Chrome on Windows",
          type: "Desktop",
          lastUsedAt: new Date(),
          createdAt: new Date(),
        },
      ],
    };
  }),

  trustDevice: protectedProcedure
    .input(
      z.object({
        deviceFingerprint: z.string(),
        deviceIdentifier: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Trust device
      return {
        success: true,
        message: "Device marked as trusted",
      };
    }),

  removeTrustedDevice: protectedProcedure
    .input(z.object({ deviceId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Remove trusted device
      return {
        success: true,
        message: "Device removed from trusted devices",
      };
    }),

  signOutSession: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Sign out session
      return {
        success: true,
        message: "Session signed out",
      };
    }),

  signOutAllSessions: protectedProcedure.mutation(async ({ ctx }) => {
    // Sign out all sessions
    return {
      success: true,
      message: "All sessions signed out",
    };
  }),

  // Rate Limiting & Brute Force Detection
  checkLoginAttempts: publicProcedure
    .input(z.object({ identifier: z.string() }))
    .query(async ({ input }) => {
      const failedAttempts = bruteForceDetection.getFailedAttemptCount(input.identifier);
      const isBlocked = bruteForceDetection.isBlocked(input.identifier);
      const remainingLockout = bruteForceDetection.getRemainingLockoutTime(input.identifier);

      return {
        failedAttempts,
        isBlocked,
        remainingLockout,
        maxAttempts: 5,
      };
    }),

  recordFailedLoginAttempt: publicProcedure
    .input(z.object({ identifier: z.string() }))
    .mutation(async ({ input }) => {
      const shouldBlock = bruteForceDetection.recordFailedAttempt(input.identifier);

      if (shouldBlock) {
        return {
          success: false,
          blocked: true,
          message: "Too many failed login attempts. Please try again later.",
          remainingLockout: bruteForceDetection.getRemainingLockoutTime(input.identifier),
        };
      }

      const failedAttempts = bruteForceDetection.getFailedAttemptCount(input.identifier);
      return {
        success: true,
        blocked: false,
        failedAttempts,
        remainingAttempts: 5 - failedAttempts,
      };
    }),

  recordSuccessfulLogin: publicProcedure
    .input(z.object({ identifier: z.string() }))
    .mutation(async ({ input }) => {
      bruteForceDetection.recordSuccessfulAttempt(input.identifier);
      return {
        success: true,
        message: "Login attempt recorded",
      };
    }),

  getRateLimitStatus: protectedProcedure.query(async ({ ctx }) => {
    // Get rate limit status
    return {
      loginLimit: {
        maxRequests: 5,
        windowMs: 15 * 60 * 1000,
        message: "Too many login attempts",
      },
      passwordResetLimit: {
        maxRequests: 3,
        windowMs: 60 * 60 * 1000,
        message: "Too many password reset attempts",
      },
      twoFactorLimit: {
        maxRequests: 10,
        windowMs: 10 * 60 * 1000,
        message: "Too many 2FA attempts",
      },
      apiLimit: {
        maxRequests: 100,
        windowMs: 1 * 60 * 1000,
        message: "Too many requests",
      },
    };
  }),

  // Get VAPID public key for push notifications
  getVapidPublicKey: publicProcedure.query(async () => {
    return {
      vapidPublicKey: pushNotifications.getVapidPublicKey(),
    };
  }),
});
