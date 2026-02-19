import { router, protectedProcedure, adminProcedure } from "../_core/trpc";
import { z } from "zod";
import { IPManagementService } from "../services/ipManagementService";
import { EmailAlertsService } from "../services/emailAlertsService";
import { GeoIPDetectionService } from "../services/geoIPDetectionService";
import { TRPCError } from "@trpc/server";

export const securityManagementRouter = router({
  // ==================== IP MANAGEMENT ====================

  // Add IP to whitelist
  addToWhitelist: protectedProcedure
    .input(
      z.object({
        ipAddress: z.string().ip(),
        reason: z.enum(["trusted_partner", "known_attacker", "vpn_provider", "corporate_network", "manual", "auto_blocked"]),
        description: z.string().optional(),
        expiresAt: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can manage IP lists" });
      }

      await IPManagementService.addToWhitelist(
        input.ipAddress,
        input.reason,
        input.description,
        ctx.user.id,
        input.expiresAt
      );

      return { success: true, message: `IP ${input.ipAddress} added to whitelist` };
    }),

  // Add IP to blacklist
  addToBlacklist: protectedProcedure
    .input(
      z.object({
        ipAddress: z.string().ip(),
        reason: z.enum(["trusted_partner", "known_attacker", "vpn_provider", "corporate_network", "manual", "auto_blocked"]),
        description: z.string().optional(),
        expiresAt: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can manage IP lists" });
      }

      await IPManagementService.addToBlacklist(
        input.ipAddress,
        input.reason,
        input.description,
        ctx.user.id,
        input.expiresAt
      );

      return { success: true, message: `IP ${input.ipAddress} added to blacklist` };
    }),

  // Remove IP from lists
  removeIP: protectedProcedure
    .input(z.object({ ipAddress: z.string().ip() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can manage IP lists" });
      }

      await IPManagementService.removeIP(input.ipAddress);
      return { success: true, message: `IP ${input.ipAddress} removed from lists` };
    }),

  // Get IP status
  getIPStatus: protectedProcedure
    .input(z.object({ ipAddress: z.string().ip() }))
    .query(async ({ input }) => {
      return await IPManagementService.getIPStatus(input.ipAddress);
    }),

  // Get whitelist
  getWhitelist: protectedProcedure
    .input(z.object({ limit: z.number().default(100), offset: z.number().default(0) }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can view IP lists" });
      }

      return await IPManagementService.getWhitelist(input.limit, input.offset);
    }),

  // Get blacklist
  getBlacklist: protectedProcedure
    .input(z.object({ limit: z.number().default(100), offset: z.number().default(0) }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can view IP lists" });
      }

      return await IPManagementService.getBlacklist(input.limit, input.offset);
    }),

  // Search IPs
  searchIPs: protectedProcedure
    .input(z.object({ query: z.string(), limit: z.number().default(50) }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can search IP lists" });
      }

      return await IPManagementService.searchIPs(input.query, input.limit);
    }),

  // Get IP statistics
  getIPStatistics: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can view statistics" });
    }

    return await IPManagementService.getStatistics();
  }),

  // Bulk import IPs
  bulkImportIPs: protectedProcedure
    .input(
      z.object({
        ips: z.array(
          z.object({
            ipAddress: z.string().ip(),
            listType: z.enum(["whitelist", "blacklist"]),
            reason: z.enum(["trusted_partner", "known_attacker", "vpn_provider", "corporate_network", "manual", "auto_blocked"]),
            description: z.string().optional(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can import IPs" });
      }

      const result = await IPManagementService.bulkImport(input.ips, ctx.user.id);
      return result;
    }),

  // Export IPs as CSV
  exportIPs: protectedProcedure
    .input(z.object({ listType: z.enum(["whitelist", "blacklist"]).optional() }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can export IPs" });
      }

      const csv = await IPManagementService.exportAsCSV(input.listType);
      return {
        csv,
        fileName: `ip-${input.listType || "all"}-${new Date().toISOString().split("T")[0]}.csv`,
      };
    }),

  // ==================== EMAIL ALERTS ====================

  // Get alert preferences
  getAlertPreferences: protectedProcedure.query(async ({ ctx }) => {
    return await EmailAlertsService.getAlertPreferences(ctx.user.id);
  }),

  // Update alert preference
  updateAlertPreference: protectedProcedure
    .input(
      z.object({
        eventType: z.enum([
          "ACCOUNT_LOCKED",
          "MULTIPLE_FAILED_LOGINS",
          "2FA_DISABLED",
          "PASSWORD_CHANGED",
          "SUSPICIOUS_LOGIN",
          "NEW_DEVICE_LOGIN",
          "RATE_LIMIT_EXCEEDED",
          "SECURITY_BREACH",
        ]),
        enabled: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await EmailAlertsService.updateAlertPreference(ctx.user.id, input.eventType, input.enabled);
      return { success: true, message: "Alert preference updated" };
    }),

  // ==================== GEO-IP DETECTION ====================

  // Get user login history
  getLoginHistory: protectedProcedure
    .input(z.object({ limit: z.number().default(50) }))
    .query(async ({ ctx, input }) => {
      return await GeoIPDetectionService.getUserLoginHistory(ctx.user.id, input.limit);
    }),

  // Get unique locations
  getUniqueLocations: protectedProcedure.query(async ({ ctx }) => {
    return await GeoIPDetectionService.getUniqueLocations(ctx.user.id);
  }),

  // Get geo-IP statistics
  getGeoIPStatistics: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can view geo-IP statistics" });
    }

    return await GeoIPDetectionService.getStatistics();
  }),

  // Get GeoIP data for IP
  getGeoIPData: protectedProcedure
    .input(z.object({ ipAddress: z.string().ip() }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can view geo-IP data" });
      }

      return await GeoIPDetectionService.getGeoIPData(input.ipAddress);
    }),
});
