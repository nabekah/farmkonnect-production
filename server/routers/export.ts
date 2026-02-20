import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getDb } from "../db";

/**
 * Escape CSV values
 */
function escapeCSVValue(value: any): string {
  if (value === null || value === undefined) return "";
  const stringValue = String(value);
  if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

/**
 * Generate CSV content
 */
function generateCSV(headers: string[], rows: any[][]): string {
  const headerRow = headers.map(escapeCSVValue).join(",");
  const dataRows = rows.map(row =>
    row.map(escapeCSVValue).join(",")
  ).join("\n");
  return `${headerRow}\n${dataRows}`;
}

export const exportRouter = router({
  // Export audit logs to CSV
  exportAuditLogs: protectedProcedure
    .input(z.object({
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      userId: z.number().optional(),
      action: z.string().optional()
    }))
    .query(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        // Verify user is admin
        if (ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only admins can export audit logs"
          });
        }

        // Build query
        let query = `SELECT * FROM auditLogs WHERE 1=1`;
        const params: any[] = [];

        if (input.startDate) {
          query += ` AND createdAt >= ?`;
          params.push(input.startDate);
        }

        if (input.endDate) {
          query += ` AND createdAt <= ?`;
          params.push(input.endDate);
        }

        if (input.userId) {
          query += ` AND userId = ?`;
          params.push(input.userId);
        }

        if (input.action) {
          query += ` AND action = ?`;
          params.push(input.action);
        }

        query += ` ORDER BY createdAt DESC`;

        const result = await db.query(query, params);
        const auditLogs = result[0] || [];

        // Generate CSV
        const headers = [
          "ID",
          "Admin ID",
          "User ID",
          "Action",
          "Reason",
          "Bulk Operation ID",
          "Metadata",
          "Created At"
        ];

        const rows = auditLogs.map((log: any) => [
          log.id,
          log.adminId,
          log.userId,
          log.action,
          log.reason || "",
          log.bulkOperationId || "",
          log.metadata || "",
          new Date(log.createdAt).toLocaleString()
        ]);

        const csvContent = generateCSV(headers, rows);

        return {
          success: true,
          csvContent,
          filename: `audit-logs-${new Date().toISOString().split("T")[0]}.csv`,
          rowCount: auditLogs.length
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Error exporting audit logs:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to export audit logs"
        });
      }
    }),

  // Export user approvals to CSV
  exportUserApprovals: protectedProcedure
    .input(z.object({
      approvalStatus: z.string().optional(),
      role: z.string().optional()
    }))
    .query(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        // Verify user is admin
        if (ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only admins can export user data"
          });
        }

        // Build query
        let query = `SELECT id, name, email, phone, role, loginMethod, approvalStatus, accountStatus, emailVerified, createdAt FROM users WHERE 1=1`;
        const params: any[] = [];

        if (input.approvalStatus) {
          query += ` AND approvalStatus = ?`;
          params.push(input.approvalStatus);
        }

        if (input.role) {
          query += ` AND role = ?`;
          params.push(input.role);
        }

        query += ` ORDER BY createdAt DESC`;

        const result = await db.query(query, params);
        const users = result[0] || [];

        // Generate CSV
        const headers = [
          "ID",
          "Name",
          "Email",
          "Phone",
          "Role",
          "Login Method",
          "Approval Status",
          "Account Status",
          "Email Verified",
          "Created At"
        ];

        const rows = users.map((user: any) => [
          user.id,
          user.name,
          user.email,
          user.phone || "",
          user.role,
          user.loginMethod,
          user.approvalStatus,
          user.accountStatus,
          user.emailVerified ? "Yes" : "No",
          new Date(user.createdAt).toLocaleString()
        ]);

        const csvContent = generateCSV(headers, rows);

        return {
          success: true,
          csvContent,
          filename: `user-approvals-${new Date().toISOString().split("T")[0]}.csv`,
          rowCount: users.length
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Error exporting user approvals:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to export user approvals"
        });
      }
    })
});
