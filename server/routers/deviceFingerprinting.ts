import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getDb } from "../db";
import crypto from "crypto";

const generateDeviceHash = (deviceInfo: {
  userAgent: string;
  browserType: string;
  osType: string;
  screenResolution?: string;
}): string => {
  const hashInput = `${deviceInfo.userAgent}|${deviceInfo.browserType}|${deviceInfo.osType}|${deviceInfo.screenResolution || ""}`;
  return crypto.createHash("sha256").update(hashInput).digest("hex");
};

export const deviceFingerprintingRouter = router({
  // Register device fingerprint
  registerDevice: protectedProcedure
    .input(z.object({
      farmId: z.string(),
      deviceName: z.string(),
      browserType: z.string(),
      osType: z.string(),
      ipAddress: z.string(),
      userAgent: z.string(),
      screenResolution: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        const deviceHash = generateDeviceHash({
          userAgent: input.userAgent,
          browserType: input.browserType,
          osType: input.osType,
          screenResolution: input.screenResolution
        });

        // Check if device already exists
        const existingDevice = await db.query.raw(
          `SELECT id, isVerified FROM device_fingerprints WHERE deviceHash = ? AND userId = ? AND farmId = ?`,
          [deviceHash, ctx.user.id, parseInt(input.farmId)]
        );

        if (existingDevice && existingDevice.length > 0) {
          // Update last seen
          await db.query.raw(
            `UPDATE device_fingerprints SET lastSeenAt = NOW() WHERE id = ?`,
            [existingDevice[0].id]
          );
          return {
            success: true,
            isNewDevice: false,
            isVerified: existingDevice[0].isVerified,
            message: "Device recognized"
          };
        }

        // Register new device
        await db.query.raw(
          `INSERT INTO device_fingerprints (userId, farmId, deviceHash, deviceName, browserType, osType, ipAddress, userAgent)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [ctx.user.id, parseInt(input.farmId), deviceHash, input.deviceName, input.browserType, input.osType, input.ipAddress, input.userAgent]
        );

        // Log security event
        await db.query.raw(
          `INSERT INTO compliance_logs (userId, farmId, eventType, eventCategory, description, severity)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [ctx.user.id, parseInt(input.farmId), "new_device_detected", "security", `New device registered: ${input.deviceName}`, "low"]
        );

        return {
          success: true,
          isNewDevice: true,
          isVerified: false,
          message: "New device registered - requires verification"
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Error registering device:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to register device"
        });
      }
    }),

  // Get user's trusted devices
  getTrustedDevices: protectedProcedure
    .input(z.object({ farmId: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        const devices = await db.query.raw(
          `SELECT id, deviceName, browserType, osType, ipAddress, isVerified, lastSeenAt, createdAt
           FROM device_fingerprints
           WHERE userId = ? AND farmId = ?
           ORDER BY lastSeenAt DESC`,
          [ctx.user.id, parseInt(input.farmId)]
        );

        return devices || [];
      } catch (error) {
        console.error("Error fetching trusted devices:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch trusted devices"
        });
      }
    }),

  // Verify device (approve new device)
  verifyDevice: protectedProcedure
    .input(z.object({
      deviceId: z.number(),
      verificationCode: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        // Verify device belongs to user
        const device = await db.query.raw(
          `SELECT id, userId FROM device_fingerprints WHERE id = ?`,
          [input.deviceId]
        );

        if (!device || device.length === 0 || device[0].userId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have permission to verify this device"
          });
        }

        await db.query.raw(
          `UPDATE device_fingerprints SET isVerified = TRUE WHERE id = ?`,
          [input.deviceId]
        );

        // Log verification event
        await db.query.raw(
          `INSERT INTO compliance_logs (userId, eventType, eventCategory, description, severity)
           VALUES (?, ?, ?, ?, ?)`,
          [ctx.user.id, "device_verified", "security", "Device verified and trusted", "low"]
        );

        return { success: true, message: "Device verified successfully" };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Error verifying device:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to verify device"
        });
      }
    }),

  // Remove device
  removeDevice: protectedProcedure
    .input(z.object({ deviceId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        // Verify device belongs to user
        const device = await db.query.raw(
          `SELECT userId FROM device_fingerprints WHERE id = ?`,
          [input.deviceId]
        );

        if (!device || device.length === 0 || device[0].userId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have permission to remove this device"
          });
        }

        await db.query.raw(
          `DELETE FROM device_fingerprints WHERE id = ?`,
          [input.deviceId]
        );

        // Log removal event
        await db.query.raw(
          `INSERT INTO compliance_logs (userId, eventType, eventCategory, description, severity)
           VALUES (?, ?, ?, ?, ?)`,
          [ctx.user.id, "device_removed", "security", "Device removed from trusted list", "low"]
        );

        return { success: true, message: "Device removed successfully" };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Error removing device:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to remove device"
        });
      }
    }),

  // Detect suspicious device activity
  detectSuspiciousActivity: protectedProcedure
    .input(z.object({
      farmId: z.string(),
      deviceHash: z.string(),
      ipAddress: z.string(),
      userAgent: z.string()
    }))
    .query(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        // Check if device is known and verified
        const device = await db.query.raw(
          `SELECT id, isVerified, ipAddress FROM device_fingerprints 
           WHERE deviceHash = ? AND userId = ? AND farmId = ?`,
          [input.deviceHash, ctx.user.id, parseInt(input.farmId)]
        );

        const suspiciousFlags: string[] = [];
        let riskScore = 0;

        if (!device || device.length === 0) {
          suspiciousFlags.push("Unknown device");
          riskScore += 40;
        } else if (!device[0].isVerified) {
          suspiciousFlags.push("Unverified device");
          riskScore += 30;
        }

        // Check for IP mismatch
        if (device && device.length > 0 && device[0].ipAddress !== input.ipAddress) {
          suspiciousFlags.push("IP address changed");
          riskScore += 20;
        }

        // Check for unusual access time
        const lastAccess = device && device.length > 0 ? new Date(device[0].lastSeenAt) : null;
        if (lastAccess) {
          const hoursSinceLastAccess = (Date.now() - lastAccess.getTime()) / (1000 * 60 * 60);
          if (hoursSinceLastAccess > 48) {
            suspiciousFlags.push("Unusual access time");
            riskScore += 15;
          }
        }

        // Check for multiple failed logins
        const recentFailedLogins = await db.query.raw(
          `SELECT COUNT(*) as count FROM compliance_logs
           WHERE userId = ? AND eventType = 'failed_login' AND createdAt > DATE_SUB(NOW(), INTERVAL 1 HOUR)`,
          [ctx.user.id]
        );

        if (recentFailedLogins && recentFailedLogins[0]?.count > 3) {
          suspiciousFlags.push("Multiple failed login attempts");
          riskScore += 25;
        }

        return {
          isSuspicious: riskScore >= 50,
          riskScore: Math.min(riskScore, 100),
          suspiciousFlags,
          requiresMFA: riskScore >= 50,
          requiresVerification: riskScore >= 70
        };
      } catch (error) {
        console.error("Error detecting suspicious activity:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to detect suspicious activity"
        });
      }
    })
});
