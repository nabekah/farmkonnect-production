import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { DeviceTrustManager } from "../_core/deviceTrust";
import { twilioSms } from "../_core/twilioSms";
import { emailNotifications } from "../_core/emailNotifications";

export const deviceAndNotificationsRouter = router({
  // Device Trust Management
  trustDevice: protectedProcedure
    .input(
      z.object({
        deviceFingerprint: z.string(),
        userAgent: z.string(),
        ipAddress: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const deviceIdentifier = DeviceTrustManager.generateDeviceIdentifier(input.userAgent);
      const deviceType = DeviceTrustManager.getDeviceType(input.userAgent);

      // In production, save to database
      // For now, return success
      return {
        success: true,
        message: `Device "${deviceIdentifier}" marked as trusted`,
        device: {
          identifier: deviceIdentifier,
          type: deviceType,
          trustedAt: new Date(),
        },
      };
    }),

  getTrustedDevices: protectedProcedure.query(async ({ ctx }) => {
    // In production, fetch from database
    // For now, return mock data
    return {
      devices: [
        {
          id: "device_1",
          identifier: "Chrome on Windows",
          type: "Desktop",
          lastUsedAt: new Date(),
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      ],
    };
  }),

  removeTrustedDevice: protectedProcedure
    .input(z.object({ deviceId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // In production, delete from database
      return {
        success: true,
        message: "Device removed from trusted devices",
      };
    }),

  // SMS Notifications
  sendOtpSms: protectedProcedure
    .input(
      z.object({
        phoneNumber: z.string(),
        otp: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await twilioSms.sendOtp(input.phoneNumber, input.otp);
      return result;
    }),

  sendLoginAlertSms: protectedProcedure
    .input(
      z.object({
        phoneNumber: z.string(),
        deviceInfo: z.string(),
        location: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await twilioSms.sendLoginNotification(input.phoneNumber, input.deviceInfo, input.location);
      return result;
    }),

  sendSecurityAlertSms: protectedProcedure
    .input(
      z.object({
        phoneNumber: z.string(),
        alertType: z.string(),
        details: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await twilioSms.sendSecurityAlert(input.phoneNumber, input.alertType, input.details);
      return result;
    }),

  // Email Notifications
  sendLoginAlertEmail: protectedProcedure
    .input(
      z.object({
        email: z.string().email(),
        deviceInfo: z.string(),
        location: z.string(),
        ipAddress: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await emailNotifications.sendLoginNotification(
        input.email,
        ctx.user.name || "User",
        input.deviceInfo,
        input.location,
        input.ipAddress
      );
      return result;
    }),

  sendSecurityAlertEmail: protectedProcedure
    .input(
      z.object({
        email: z.string().email(),
        alertType: z.string(),
        details: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await emailNotifications.sendSecurityAlert(input.email, ctx.user.name || "User", input.alertType, input.details);
      return result;
    }),

  send2FaSetupConfirmationEmail: protectedProcedure
    .input(
      z.object({
        email: z.string().email(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await emailNotifications.send2FaSetupConfirmation(input.email, ctx.user.name || "User");
      return result;
    }),

  // Device Information
  getDeviceInfo: protectedProcedure
    .input(
      z.object({
        userAgent: z.string(),
        ipAddress: z.string(),
      })
    )
    .query(async ({ input }) => {
      const deviceIdentifier = DeviceTrustManager.generateDeviceIdentifier(input.userAgent);
      const deviceType = DeviceTrustManager.getDeviceType(input.userAgent);
      const location = await DeviceTrustManager.getLocationFromIp(input.ipAddress);

      return {
        deviceIdentifier,
        deviceType,
        location,
      };
    }),

  // Suspicious Activity Detection
  checkSuspiciousLogin: protectedProcedure
    .input(
      z.object({
        lastLoginLocation: z.object({
          latitude: z.number(),
          longitude: z.number(),
        }),
        currentLoginLocation: z.object({
          latitude: z.number(),
          longitude: z.number(),
        }),
        timeSinceLastLogin: z.number(), // in seconds
      })
    )
    .query(async ({ input }) => {
      const isSuspicious = DeviceTrustManager.isSuspiciousLogin(
        input.lastLoginLocation,
        input.currentLoginLocation,
        input.timeSinceLastLogin
      );

      const distance = DeviceTrustManager.calculateDistance(
        input.lastLoginLocation.latitude,
        input.lastLoginLocation.longitude,
        input.currentLoginLocation.latitude,
        input.currentLoginLocation.longitude
      );

      return {
        isSuspicious,
        distance,
        message: isSuspicious ? "Suspicious login detected. Additional verification required." : "Login appears legitimate.",
      };
    }),
});
