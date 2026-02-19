import { router, protectedProcedure, adminProcedure } from "../_core/trpc";
import { z } from "zod";
import { AuditLoggingService, AuditEventType } from "../services/auditLoggingService";
import { TRPCError } from "@trpc/server";

export const auditLoggingRouter = router({
  // Get audit logs for current user
  getUserLogs: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      return await AuditLoggingService.getUserAuditLogs(ctx.user.id, input.limit, input.offset);
    }),

  // Get logs by event type (admin only)
  getLogsByEventType: protectedProcedure
    .input(
      z.object({
        eventType: z.string() as z.ZodType<AuditEventType>,
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can view logs by event type",
        });
      }

      return await AuditLoggingService.getLogsByEventType(input.eventType, input.limit, input.offset);
    }),

  // Get logs by IP address (admin only)
  getLogsByIPAddress: protectedProcedure
    .input(
      z.object({
        ipAddress: z.string(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can view logs by IP address",
        });
      }

      return await AuditLoggingService.getLogsByIPAddress(input.ipAddress, input.limit, input.offset);
    }),

  // Get recent critical events (admin only)
  getRecentCriticalEvents: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can view critical events",
        });
      }

      return await AuditLoggingService.getRecentCriticalEvents(input.limit);
    }),

  // Get audit log statistics (admin only)
  getStatistics: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only admins can view audit statistics",
      });
    }

    // Get recent critical events count
    const criticalEvents = await AuditLoggingService.getRecentCriticalEvents(1000);
    const criticalCount = criticalEvents.length;

    // Get user's own logs
    const userLogs = await AuditLoggingService.getUserAuditLogs(ctx.user.id, 1000);

    return {
      totalCriticalEvents: criticalCount,
      userLogsCount: userLogs.length,
      eventTypes: {
        loginSuccess: criticalEvents.filter((e) => e.eventType === "LOGIN_SUCCESS").length,
        loginFailed: criticalEvents.filter((e) => e.eventType === "LOGIN_FAILED").length,
        loginRateLimited: criticalEvents.filter((e) => e.eventType === "LOGIN_RATE_LIMITED").length,
        twoFAEnabled: criticalEvents.filter((e) => e.eventType === "2FA_ENABLED").length,
        twoFADisabled: criticalEvents.filter((e) => e.eventType === "2FA_DISABLED").length,
        twoFAFailed: criticalEvents.filter((e) => e.eventType === "2FA_FAILED").length,
        passwordChanged: criticalEvents.filter((e) => e.eventType === "PASSWORD_CHANGED").length,
        passwordResetRequested: criticalEvents.filter((e) => e.eventType === "PASSWORD_RESET_REQUESTED").length,
        suspiciousActivity: criticalEvents.filter((e) => e.eventType === "SUSPICIOUS_ACTIVITY_DETECTED").length,
        accountLocked: criticalEvents.filter((e) => e.eventType === "ACCOUNT_LOCKED").length,
      },
    };
  }),

  // Cleanup old logs (admin only)
  cleanupOldLogs: protectedProcedure.mutation(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only admins can cleanup audit logs",
      });
    }

    await AuditLoggingService.cleanupOldLogs();
    return { success: true, message: "Old audit logs cleaned up" };
  }),

  // Export logs as CSV (admin only)
  exportLogs: protectedProcedure
    .input(
      z.object({
        eventType: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can export audit logs",
        });
      }

      // Get logs based on filters
      let logs: any[] = [];

      if (input.eventType) {
        logs = await AuditLoggingService.getLogsByEventType(input.eventType as AuditEventType, 10000);
      } else {
        logs = await AuditLoggingService.getRecentCriticalEvents(10000);
      }

      // Filter by date if provided
      if (input.startDate || input.endDate) {
        logs = logs.filter((log) => {
          const logDate = new Date(log.timestamp);
          if (input.startDate && logDate < input.startDate) return false;
          if (input.endDate && logDate > input.endDate) return false;
          return true;
        });
      }

      // Convert to CSV format
      const headers = ["Timestamp", "Event Type", "User ID", "Email", "IP Address", "Status", "Severity", "Details"];
      const rows = logs.map((log) => [
        new Date(log.timestamp).toISOString(),
        log.eventType,
        log.userId || "N/A",
        log.email || "N/A",
        log.ipAddress,
        log.status,
        log.severity,
        log.details ? JSON.stringify(log.details) : "",
      ]);

      const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");

      return {
        success: true,
        csv,
        fileName: `audit-logs-${new Date().toISOString().split("T")[0]}.csv`,
      };
    }),
});
