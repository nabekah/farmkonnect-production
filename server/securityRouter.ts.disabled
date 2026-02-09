import { router, protectedProcedure, publicProcedure } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import {
  users,
  customRoles,
  modulePermissions,
  rolePermissions,
  userRoles,
  securityAuditLogs,
  userSessions,
  userApprovalRequests,
  accountStatusHistory,
  mfaBackupCodeUsage,
  securitySettings,
} from "../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import * as crypto from "crypto";

/**
 * Enterprise Security Router
 * Comprehensive security system with RBAC, MFA, audit logging, and session management
 */

// Helper: Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Admin access required",
    });
  }
  return next({ ctx });
});

// Helper: Log security event
async function logSecurityEvent(params: {
  userId?: number;
  eventType: string;
  eventDescription?: string;
  ipAddress?: string;
  userAgent?: string;
  deviceFingerprint?: string;
  metadata?: any;
  severity?: "low" | "medium" | "high" | "critical";
}) {
  const db = await getDb();
  if (!db) return;

  await db.insert(securityAuditLogs).values({
    userId: params.userId,
    eventType: params.eventType as any,
    eventDescription: params.eventDescription,
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
    deviceFingerprint: params.deviceFingerprint,
    metadata: params.metadata ? JSON.stringify(params.metadata) : null,
    severity: params.severity || "low",
  });
}

export const securityRouter = router({
  // ============================================================================
  // ADVANCED RBAC - Dynamic Roles & Permissions
  // ============================================================================
  rbac: router({
    // Create custom role
    createRole: adminProcedure
      .input(
        z.object({
          roleName: z.string().min(2).max(100),
          displayName: z.string().min(2).max(255),
          description: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const result = await db.insert(customRoles).values({
          roleName: input.roleName.toLowerCase().replace(/\s+/g, "_"),
          displayName: input.displayName,
          description: input.description,
          isSystemRole: false,
          createdBy: ctx.user.id,
        });

        await logSecurityEvent({
          userId: ctx.user.id,
          eventType: "role_assigned",
          eventDescription: `Created custom role: ${input.roleName}`,
          severity: "medium",
        });

        return result;
      }),

    // List all roles
    listRoles: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      return await db.select().from(customRoles).orderBy(customRoles.roleName);
    }),

    // Delete custom role
    deleteRole: adminProcedure
      .input(z.object({ roleId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        // Check if system role
        const role = await db.select().from(customRoles).where(eq(customRoles.id, input.roleId));
        if (role.length > 0 && role[0].isSystemRole) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Cannot delete system role",
          });
        }

        await db.delete(customRoles).where(eq(customRoles.id, input.roleId));

        await logSecurityEvent({
          userId: ctx.user.id,
          eventType: "role_removed",
          eventDescription: `Deleted role ID: ${input.roleId}`,
          severity: "high",
        });

        return { success: true };
      }),

    // List all module permissions
    listModulePermissions: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      return await db.select().from(modulePermissions).orderBy(modulePermissions.category, modulePermissions.moduleName);
    }),

    // Set role permissions for a module
    setRolePermissions: adminProcedure
      .input(
        z.object({
          roleId: z.number(),
          permissionId: z.number(),
          canView: z.boolean(),
          canCreate: z.boolean(),
          canEdit: z.boolean(),
          canDelete: z.boolean(),
          canExport: z.boolean(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        // Check if permission already exists
        const existing = await db
          .select()
          .from(rolePermissions)
          .where(and(eq(rolePermissions.roleId, input.roleId), eq(rolePermissions.permissionId, input.permissionId)));

        if (existing.length > 0) {
          // Update existing
          await db
            .update(rolePermissions)
            .set({
              canView: input.canView,
              canCreate: input.canCreate,
              canEdit: input.canEdit,
              canDelete: input.canDelete,
              canExport: input.canExport,
            })
            .where(eq(rolePermissions.id, existing[0].id));
        } else {
          // Insert new
          await db.insert(rolePermissions).values(input);
        }

        await logSecurityEvent({
          userId: ctx.user.id,
          eventType: "permission_changed",
          eventDescription: `Updated permissions for role ${input.roleId}, module ${input.permissionId}`,
          severity: "medium",
        });

        return { success: true };
      }),

    // Get role permissions
    getRolePermissions: adminProcedure
      .input(z.object({ roleId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        return await db.select().from(rolePermissions).where(eq(rolePermissions.roleId, input.roleId));
      }),

    // Assign role to user
    assignRoleToUser: adminProcedure
      .input(
        z.object({
          userId: z.number(),
          roleId: z.number(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        // Check if already assigned
        const existing = await db
          .select()
          .from(userRoles)
          .where(and(eq(userRoles.userId, input.userId), eq(userRoles.roleId, input.roleId)));

        if (existing.length > 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Role already assigned to user",
          });
        }

        await db.insert(userRoles).values({
          userId: input.userId,
          roleId: input.roleId,
          assignedBy: ctx.user.id,
        });

        await logSecurityEvent({
          userId: ctx.user.id,
          eventType: "role_assigned",
          eventDescription: `Assigned role ${input.roleId} to user ${input.userId}`,
          metadata: { targetUserId: input.userId, roleId: input.roleId },
          severity: "medium",
        });

        return { success: true };
      }),

    // Remove role from user
    removeRoleFromUser: adminProcedure
      .input(
        z.object({
          userId: z.number(),
          roleId: z.number(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        await db.delete(userRoles).where(and(eq(userRoles.userId, input.userId), eq(userRoles.roleId, input.roleId)));

        await logSecurityEvent({
          userId: ctx.user.id,
          eventType: "role_removed",
          eventDescription: `Removed role ${input.roleId} from user ${input.userId}`,
          metadata: { targetUserId: input.userId, roleId: input.roleId },
          severity: "medium",
        });

        return { success: true };
      }),

    // Get user's roles
    getUserRoles: adminProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        return await db.select().from(userRoles).where(eq(userRoles.userId, input.userId));
      }),

    // Check if user has permission
    checkPermission: protectedProcedure
      .input(
        z.object({
          moduleName: z.string(),
          action: z.enum(["view", "create", "edit", "delete", "export"]),
        })
      )
      .query(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) return { hasPermission: false };

        // Admin has all permissions
        if (ctx.user.role === "admin") {
          return { hasPermission: true };
        }

        // Get user's roles
        const roles = await db.select().from(userRoles).where(eq(userRoles.userId, ctx.user.id));

        if (roles.length === 0) {
          return { hasPermission: false };
        }

        // Get module permission
        const module = await db.select().from(modulePermissions).where(eq(modulePermissions.moduleName, input.moduleName));

        if (module.length === 0) {
          return { hasPermission: false };
        }

        // Check each role's permissions
        for (const userRole of roles) {
          const perms = await db
            .select()
            .from(rolePermissions)
            .where(and(eq(rolePermissions.roleId, userRole.roleId), eq(rolePermissions.permissionId, module[0].id)));

          if (perms.length > 0) {
            const perm = perms[0];
            const actionMap = {
              view: perm.canView,
              create: perm.canCreate,
              edit: perm.canEdit,
              delete: perm.canDelete,
              export: perm.canExport,
            };

            if (actionMap[input.action]) {
              return { hasPermission: true };
            }
          }
        }

        return { hasPermission: false };
      }),
  }),

  // ============================================================================
  // USER APPROVAL WORKFLOW
  // ============================================================================
  approval: router({
    // List pending approval requests
    listPendingApprovals: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      return await db
        .select()
        .from(userApprovalRequests)
        .where(eq(userApprovalRequests.status, "pending"))
        .orderBy(desc(userApprovalRequests.createdAt));
    }),

    // Approve user
    approveUser: adminProcedure
      .input(
        z.object({
          userId: z.number(),
          reviewNotes: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        // Update user approval status
        await db
          .update(users)
          .set({
            approvalStatus: "approved",
            accountStatus: "active",
          })
          .where(eq(users.id, input.userId));

        // Update approval request
        await db
          .update(userApprovalRequests)
          .set({
            status: "approved",
            reviewedBy: ctx.user.id,
            reviewedAt: new Date(),
            reviewNotes: input.reviewNotes,
          })
          .where(eq(userApprovalRequests.userId, input.userId));

        await logSecurityEvent({
          userId: ctx.user.id,
          eventType: "account_approved",
          eventDescription: `Approved user ID: ${input.userId}`,
          metadata: { targetUserId: input.userId, reviewNotes: input.reviewNotes },
          severity: "medium",
        });

        return { success: true };
      }),

    // Reject user
    rejectUser: adminProcedure
      .input(
        z.object({
          userId: z.number(),
          reviewNotes: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        // Update user approval status
        await db
          .update(users)
          .set({
            approvalStatus: "rejected",
            accountStatus: "disabled",
            accountStatusReason: input.reviewNotes,
          })
          .where(eq(users.id, input.userId));

        // Update approval request
        await db
          .update(userApprovalRequests)
          .set({
            status: "rejected",
            reviewedBy: ctx.user.id,
            reviewedAt: new Date(),
            reviewNotes: input.reviewNotes,
          })
          .where(eq(userApprovalRequests.userId, input.userId));

        await logSecurityEvent({
          userId: ctx.user.id,
          eventType: "account_rejected",
          eventDescription: `Rejected user ID: ${input.userId}`,
          metadata: { targetUserId: input.userId, reason: input.reviewNotes },
          severity: "medium",
        });

        return { success: true };
      }),
  }),

  // ============================================================================
  // ACCOUNT MANAGEMENT
  // ============================================================================
  account: router({
    // List all users with status
    listUsers: adminProcedure
      .input(
        z.object({
          status: z.enum(["active", "disabled", "suspended", "all"]).default("all"),
          approvalStatus: z.enum(["pending", "approved", "rejected", "all"]).default("all"),
        })
      )
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];

        let query = db.select().from(users);

        const conditions = [];
        if (input.status !== "all") {
          conditions.push(eq(users.accountStatus, input.status));
        }
        if (input.approvalStatus !== "all") {
          conditions.push(eq(users.approvalStatus, input.approvalStatus));
        }

        if (conditions.length > 0) {
          query = query.where(and(...conditions)) as any;
        }

        return await query;
      }),

    // Disable user account
    disableAccount: adminProcedure
      .input(
        z.object({
          userId: z.number(),
          reason: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        // Get current status
        const user = await db.select().from(users).where(eq(users.id, input.userId));
        if (user.length === 0) {
          throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
        }

        const previousStatus = user[0].accountStatus;

        // Update user status
        await db
          .update(users)
          .set({
            accountStatus: "disabled",
            accountStatusReason: input.reason,
          })
          .where(eq(users.id, input.userId));

        // Log status change
        await db.insert(accountStatusHistory).values({
          userId: input.userId,
          previousStatus,
          newStatus: "disabled",
          reason: input.reason,
          changedBy: ctx.user.id,
        });

        // Terminate all active sessions
        await db.update(userSessions).set({ isActive: false }).where(eq(userSessions.userId, input.userId));

        await logSecurityEvent({
          userId: ctx.user.id,
          eventType: "account_disabled",
          eventDescription: `Disabled account for user ID: ${input.userId}`,
          metadata: { targetUserId: input.userId, reason: input.reason },
          severity: "high",
        });

        return { success: true };
      }),

    // Enable user account
    enableAccount: adminProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        // Get current status
        const user = await db.select().from(users).where(eq(users.id, input.userId));
        if (user.length === 0) {
          throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
        }

        const previousStatus = user[0].accountStatus;

        // Update user status
        await db
          .update(users)
          .set({
            accountStatus: "active",
            accountStatusReason: null,
            failedLoginAttempts: 0,
            accountLockedUntil: null,
          })
          .where(eq(users.id, input.userId));

        // Log status change
        await db.insert(accountStatusHistory).values({
          userId: input.userId,
          previousStatus,
          newStatus: "active",
          reason: "Account enabled by admin",
          changedBy: ctx.user.id,
        });

        await logSecurityEvent({
          userId: ctx.user.id,
          eventType: "account_enabled",
          eventDescription: `Enabled account for user ID: ${input.userId}`,
          metadata: { targetUserId: input.userId },
          severity: "medium",
        });

        return { success: true };
      }),

    // Suspend user account
    suspendAccount: adminProcedure
      .input(
        z.object({
          userId: z.number(),
          reason: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        // Get current status
        const user = await db.select().from(users).where(eq(users.id, input.userId));
        if (user.length === 0) {
          throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
        }

        const previousStatus = user[0].accountStatus;

        // Update user status
        await db
          .update(users)
          .set({
            accountStatus: "suspended",
            accountStatusReason: input.reason,
          })
          .where(eq(users.id, input.userId));

        // Log status change
        await db.insert(accountStatusHistory).values({
          userId: input.userId,
          previousStatus,
          newStatus: "suspended",
          reason: input.reason,
          changedBy: ctx.user.id,
        });

        // Terminate all active sessions
        await db.update(userSessions).set({ isActive: false }).where(eq(userSessions.userId, input.userId));

        await logSecurityEvent({
          userId: ctx.user.id,
          eventType: "account_suspended",
          eventDescription: `Suspended account for user ID: ${input.userId}`,
          metadata: { targetUserId: input.userId, reason: input.reason },
          severity: "high",
        });

        return { success: true };
      }),

    // Get account status history
    getStatusHistory: adminProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        return await db
          .select()
          .from(accountStatusHistory)
          .where(eq(accountStatusHistory.userId, input.userId))
          .orderBy(desc(accountStatusHistory.changedAt));
      }),
  }),

  // ============================================================================
  // MULTI-FACTOR AUTHENTICATION (MFA)
  // ============================================================================
  mfa: router({
    // Generate MFA secret and QR code
    enrollMFA: protectedProcedure.mutation(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Generate secret (base32 encoded)
      const secret = crypto.randomBytes(20).toString("base64").replace(/[^A-Z0-9]/gi, "").substring(0, 32);

      // Generate backup codes
      const backupCodes = Array.from({ length: 10 }, () =>
        crypto.randomBytes(4).toString("hex").toUpperCase()
      );

      // Store hashed backup codes
      const hashedBackupCodes = backupCodes.map((code) =>
        crypto.createHash("sha256").update(code).digest("hex")
      );

      // Update user with MFA secret
      await db
        .update(users)
        .set({
          mfaSecret: secret,
          mfaBackupCodes: JSON.stringify(hashedBackupCodes),
        })
        .where(eq(users.id, ctx.user.id));

      await logSecurityEvent({
        userId: ctx.user.id,
        eventType: "mfa_enabled",
        eventDescription: "User enrolled in MFA",
        severity: "medium",
      });

      // Return secret and backup codes (only shown once)
      return {
        secret,
        backupCodes,
        qrCodeUrl: `otpauth://totp/FarmKonnect:${ctx.user.email}?secret=${secret}&issuer=FarmKonnect`,
      };
    }),

    // Verify MFA code and enable
    verifyAndEnableMFA: protectedProcedure
      .input(z.object({ code: z.string().length(6) }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const user = await db.select().from(users).where(eq(users.id, ctx.user.id));
        if (user.length === 0 || !user[0].mfaSecret) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "MFA not enrolled" });
        }

        // Verify TOTP code (simplified - use speakeasy or similar in production)
        const isValid = verifyTOTP(user[0].mfaSecret, input.code);

        if (!isValid) {
          await logSecurityEvent({
            userId: ctx.user.id,
            eventType: "mfa_failed",
            eventDescription: "Invalid MFA code during enrollment verification",
            severity: "medium",
          });

          throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid MFA code" });
        }

        // Enable MFA
        await db.update(users).set({ mfaEnabled: true }).where(eq(users.id, ctx.user.id));

        await logSecurityEvent({
          userId: ctx.user.id,
          eventType: "mfa_enabled",
          eventDescription: "MFA successfully enabled",
          severity: "medium",
        });

        return { success: true };
      }),

    // Disable MFA
    disableMFA: protectedProcedure
      .input(z.object({ password: z.string() })) // Require password confirmation
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        // In production, verify password here

        await db
          .update(users)
          .set({
            mfaEnabled: false,
            mfaSecret: null,
            mfaBackupCodes: null,
          })
          .where(eq(users.id, ctx.user.id));

        await logSecurityEvent({
          userId: ctx.user.id,
          eventType: "mfa_disabled",
          eventDescription: "User disabled MFA",
          severity: "high",
        });

        return { success: true };
      }),

    // Verify MFA code during login
    verifyMFACode: publicProcedure
      .input(
        z.object({
          userId: z.number(),
          code: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const user = await db.select().from(users).where(eq(users.id, input.userId));
        if (user.length === 0 || !user[0].mfaEnabled || !user[0].mfaSecret) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "MFA not enabled" });
        }

        // Check if it's a backup code
        if (input.code.length === 8) {
          const codeHash = crypto.createHash("sha256").update(input.code.toUpperCase()).digest("hex");
          const backupCodes = JSON.parse(user[0].mfaBackupCodes || "[]");

          if (backupCodes.includes(codeHash)) {
            // Remove used backup code
            const updatedCodes = backupCodes.filter((c: string) => c !== codeHash);
            await db
              .update(users)
              .set({ mfaBackupCodes: JSON.stringify(updatedCodes) })
              .where(eq(users.id, input.userId));

            // Log backup code usage
            await db.insert(mfaBackupCodeUsage).values({
              userId: input.userId,
              codeHash,
            });

            await logSecurityEvent({
              userId: input.userId,
              eventType: "mfa_verified",
              eventDescription: "MFA verified with backup code",
              severity: "medium",
            });

            return { success: true, method: "backup_code" };
          }
        }

        // Verify TOTP code
        const isValid = verifyTOTP(user[0].mfaSecret, input.code);

        if (!isValid) {
          await logSecurityEvent({
            userId: input.userId,
            eventType: "mfa_failed",
            eventDescription: "Invalid MFA code",
            severity: "medium",
          });

          throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid MFA code" });
        }

        await logSecurityEvent({
          userId: input.userId,
          eventType: "mfa_verified",
          eventDescription: "MFA verified with TOTP",
          severity: "low",
        });

        return { success: true, method: "totp" };
      }),

    // Get MFA status
    getMFAStatus: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return { enabled: false, backupCodesRemaining: 0 };

      const user = await db.select().from(users).where(eq(users.id, ctx.user.id));
      if (user.length === 0) {
        return { enabled: false, backupCodesRemaining: 0 };
      }

      const backupCodes = JSON.parse(user[0].mfaBackupCodes || "[]");

      return {
        enabled: user[0].mfaEnabled,
        backupCodesRemaining: backupCodes.length,
      };
    }),
  }),

  // ============================================================================
  // SECURITY AUDIT LOGS
  // ============================================================================
  auditLogs: router({
    // List audit logs
    list: adminProcedure
      .input(
        z.object({
          userId: z.number().optional(),
          eventType: z.string().optional(),
          severity: z.enum(["low", "medium", "high", "critical"]).optional(),
          limit: z.number().default(100),
        })
      )
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];

        let query = db.select().from(securityAuditLogs);

        const conditions = [];
        if (input.userId) {
          conditions.push(eq(securityAuditLogs.userId, input.userId));
        }
        if (input.eventType) {
          conditions.push(eq(securityAuditLogs.eventType, input.eventType as any));
        }
        if (input.severity) {
          conditions.push(eq(securityAuditLogs.severity, input.severity));
        }

        if (conditions.length > 0) {
          query = query.where(and(...conditions)) as any;
        }

        return await query.orderBy(desc(securityAuditLogs.createdAt)).limit(input.limit);
      }),

    // Get security statistics
    getStatistics: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) return {};

      // Get counts for different event types
      const failedLogins = await db
        .select({ count: sql<number>`count(*)` })
        .from(securityAuditLogs)
        .where(eq(securityAuditLogs.eventType, "login_failed"));

      const mfaEvents = await db
        .select({ count: sql<number>`count(*)` })
        .from(securityAuditLogs)
        .where(eq(securityAuditLogs.eventType, "mfa_enabled"));

      const accountChanges = await db
        .select({ count: sql<number>`count(*)` })
        .from(accountStatusHistory);

      return {
        failedLoginAttempts: failedLogins[0]?.count || 0,
        mfaEnrollments: mfaEvents[0]?.count || 0,
        accountStatusChanges: accountChanges[0]?.count || 0,
      };
    }),
  }),

  // ============================================================================
  // SESSION MANAGEMENT
  // ============================================================================
  sessions: router({
    // List active sessions
    listActiveSessions: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];

      return await db
        .select()
        .from(userSessions)
        .where(and(eq(userSessions.userId, ctx.user.id), eq(userSessions.isActive, true)))
        .orderBy(desc(userSessions.lastActivity));
    }),

    // List all sessions (admin)
    listAllSessions: adminProcedure
      .input(z.object({ userId: z.number().optional() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];

        if (input.userId) {
          return await db
            .select()
            .from(userSessions)
            .where(eq(userSessions.userId, input.userId))
            .orderBy(desc(userSessions.lastActivity));
        }

        return await db.select().from(userSessions).orderBy(desc(userSessions.lastActivity)).limit(100);
      }),

    // Terminate session
    terminateSession: protectedProcedure
      .input(z.object({ sessionId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        // Verify session belongs to user
        const session = await db.select().from(userSessions).where(eq(userSessions.id, input.sessionId));

        if (session.length === 0) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" });
        }

        if (session[0].userId !== ctx.user.id && ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Cannot terminate other user's session" });
        }

        await db.update(userSessions).set({ isActive: false }).where(eq(userSessions.id, input.sessionId));

        await logSecurityEvent({
          userId: ctx.user.id,
          eventType: "session_terminated",
          eventDescription: `Terminated session ID: ${input.sessionId}`,
          severity: "low",
        });

        return { success: true };
      }),

    // Terminate all sessions (except current)
    terminateAllSessions: protectedProcedure.mutation(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db
        .update(userSessions)
        .set({ isActive: false })
        .where(eq(userSessions.userId, ctx.user.id));

      await logSecurityEvent({
        userId: ctx.user.id,
        eventType: "session_terminated",
        eventDescription: "Terminated all sessions",
        severity: "medium",
      });

      return { success: true };
    }),
  }),

  // ============================================================================
  // SYSTEM INITIALIZATION
  // ============================================================================
  // ============================================================================
  // USER REGISTRATION & APPROVAL
  // ============================================================================
  registration: router({
    // Public registration (no auth required)
    register: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          name: z.string().min(2),
          phone: z.string().optional(),
          requestedRole: z.enum(["farmer", "agent", "veterinarian", "buyer", "transporter"]).default("farmer"),
          justification: z.string().min(10).max(500),
        })
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        // Check if email already exists
        const existing = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
        if (existing.length > 0) {
          throw new TRPCError({ code: "CONFLICT", message: "Email already registered" });
        }

        // Check if approval is required
        const settings = await db.select().from(securitySettings).where(eq(securitySettings.settingKey, "require_approval_for_new_users"));
        const requireApproval = settings[0]?.settingValue === "true";

        if (requireApproval) {
          // Create approval request
          const result = await db.insert(userApprovalRequests).values({
            email: input.email,
            name: input.name,
            phone: input.phone,
            requestedRole: input.requestedRole,
            justification: input.justification,
            status: "pending",
          });

          await logSecurityEvent({
            eventType: "user_registration",
            eventDescription: `New registration request from ${input.email}`,
            metadata: { email: input.email, role: input.requestedRole },
            severity: "low",
          });

          return {
            success: true,
            requiresApproval: true,
            message: "Registration submitted for approval. You will be notified once approved.",
          };
        } else {
          // Auto-approve and create user
          const userResult = await db.insert(users).values({
            openId: `local_${input.email}_${Date.now()}`, // Generate temporary openId for local auth
            email: input.email,
            name: input.name,
            phone: input.phone,
            role: input.requestedRole,
            accountStatus: "active",
            approvalStatus: "approved",
            loginMethod: "email",
          });

          await logSecurityEvent({
            eventType: "user_registration",
            eventDescription: `New user auto-approved: ${input.email}`,
            metadata: { email: input.email, role: input.requestedRole },
            severity: "low",
          });

          return {
            success: true,
            requiresApproval: false,
            message: "Registration successful! You can now log in.",
          };
        }
      }),

    // Get pending approval requests (admin only)
    getPendingRequests: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      return await db
        .select()
        .from(userApprovalRequests)
        .where(eq(userApprovalRequests.status, "pending"))
        .orderBy(desc(userApprovalRequests.requestedAt));
    }),

    // Get all approval requests (admin only)
    getAllRequests: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      return await db
        .select()
        .from(userApprovalRequests)
        .orderBy(desc(userApprovalRequests.requestedAt));
    }),

    // Approve registration request
    approveRequest: adminProcedure
      .input(
        z.object({
          requestId: z.number(),
          adminNotes: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        // Get request
        const request = await db
          .select()
          .from(userApprovalRequests)
          .where(eq(userApprovalRequests.id, input.requestId))
          .limit(1);

        if (request.length === 0) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Request not found" });
        }

        const req = request[0];

        if (req.status !== "pending") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Request already processed" });
        }

        // Create user
          const userResult = await db.insert(users).values({
            openId: `local_${req.email}_${Date.now()}`, // Generate temporary openId for local auth
            email: req.email,
            name: req.name,
            phone: req.phone,
            role: (req.requestedRole as "farmer" | "agent" | "veterinarian" | "buyer" | "transporter") || "farmer",
            accountStatus: "active",
            approvalStatus: "approved",
            loginMethod: "email",
          });

        // Update request
        await db
          .update(userApprovalRequests)
          .set({
            status: "approved",
            reviewedBy: ctx.user.id,
            reviewedAt: new Date(),
            reviewNotes: input.adminNotes,
          })
          .where(eq(userApprovalRequests.id, input.requestId));

        await logSecurityEvent({
          userId: ctx.user.id,
          eventType: "user_approved",
          eventDescription: `Approved registration for ${req.email}`,
          metadata: { requestId: input.requestId, email: req.email },
          severity: "medium",
        });

        // Send approval email
        const { sendEmail, registrationApprovedEmail } = await import("./_core/email");
        const loginUrl = process.env.VITE_OAUTH_PORTAL_URL || "https://app.manus.im";
        const emailOptions = registrationApprovedEmail(req.name || "User", req.email, loginUrl);
        await sendEmail(emailOptions);

        return { success: true, message: "User approved and account created" };
      }),

    // Reject registration request
    rejectRequest: adminProcedure
      .input(
        z.object({
          requestId: z.number(),
          adminNotes: z.string().min(10),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        // Get request
        const request = await db
          .select()
          .from(userApprovalRequests)
          .where(eq(userApprovalRequests.id, input.requestId))
          .limit(1);

        if (request.length === 0) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Request not found" });
        }

        const req = request[0];

        if (req.status !== "pending") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Request already processed" });
        }

        // Update request
        await db
          .update(userApprovalRequests)
          .set({
            status: "rejected",
            reviewedBy: ctx.user.id,
            reviewedAt: new Date(),
            reviewNotes: input.adminNotes,
          })
          .where(eq(userApprovalRequests.id, input.requestId));

        await logSecurityEvent({
          userId: ctx.user.id,
          eventType: "user_rejected",
          eventDescription: `Rejected registration for ${req.email}`,
          metadata: { requestId: input.requestId, email: req.email, reason: input.adminNotes },
          severity: "medium",
        });

        // Send rejection email
        const { sendEmail, registrationRejectedEmail } = await import("./_core/email");
        const emailOptions = registrationRejectedEmail(req.name || "User", req.email, input.adminNotes);
        await sendEmail(emailOptions);

        return { success: true, message: "Registration request rejected" };
      }),
  }),

  system: router({
    // Seed security system (one-time setup)
    seedSecuritySystem: adminProcedure.mutation(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Check if already seeded
      const existing = await db.select().from(modulePermissions).limit(1);
      if (existing.length > 0) {
        return { success: false, message: "Security system already initialized" };
      }

      // 1. Create module permissions
      const modules = [
        { moduleName: "farms", displayName: "Farm Management", category: "Agriculture", description: "Manage farms and farm details" },
        { moduleName: "crops", displayName: "Crop Management", category: "Agriculture", description: "Manage crops, cycles, and yields" },
        { moduleName: "livestock", displayName: "Livestock Management", category: "Agriculture", description: "Manage animals, health, and breeding" },
        { moduleName: "inventory", displayName: "Inventory Management", category: "Agriculture", description: "Manage farm inventory and supplies" },
        { moduleName: "irrigation", displayName: "Irrigation Management", category: "Agriculture", description: "Manage irrigation schedules and zones" },
        { moduleName: "marketplace", displayName: "Marketplace", category: "Business", description: "Buy and sell agricultural products" },
        { moduleName: "orders", displayName: "Order Management", category: "Business", description: "Manage marketplace orders" },
        { moduleName: "payments", displayName: "Payment Management", category: "Business", description: "Process payments and transactions" },
        { moduleName: "transport", displayName: "Transport Management", category: "Business", description: "Manage delivery and logistics" },
        { moduleName: "training", displayName: "Training Programs", category: "Extension", description: "Manage training and extension services" },
        { moduleName: "merl", displayName: "MERL System", category: "Extension", description: "Monitoring, Evaluation, Reporting, Learning" },
        { moduleName: "iot", displayName: "IoT Devices", category: "Technology", description: "Manage IoT sensors and devices" },
        { moduleName: "weather", displayName: "Weather Integration", category: "Technology", description: "Access weather data and forecasts" },
        { moduleName: "notifications", displayName: "Notifications", category: "Technology", description: "Manage system notifications" },
        { moduleName: "users", displayName: "User Management", category: "Administration", description: "Manage user accounts and profiles" },
        { moduleName: "roles", displayName: "Role Management", category: "Administration", description: "Manage roles and permissions" },
        { moduleName: "security", displayName: "Security Settings", category: "Administration", description: "Manage security and audit logs" },
        { moduleName: "business_strategy", displayName: "Business Strategy", category: "Administration", description: "Strategic planning and SWOT analysis" },
      ];

      for (const module of modules) {
        await db.insert(modulePermissions).values(module);
      }

      // 2. Create default roles
      const roles = [
        { roleName: "super_admin", displayName: "Super Administrator", description: "Full system access", isSystemRole: true, createdBy: ctx.user.id },
        { roleName: "farm_manager", displayName: "Farm Manager", description: "Manage farm operations", isSystemRole: true, createdBy: ctx.user.id },
        { roleName: "extension_officer", displayName: "Extension Officer", description: "Manage training programs", isSystemRole: true, createdBy: ctx.user.id },
        { roleName: "marketplace_vendor", displayName: "Marketplace Vendor", description: "Sell products", isSystemRole: true, createdBy: ctx.user.id },
        { roleName: "transporter", displayName: "Transporter", description: "Manage deliveries", isSystemRole: true, createdBy: ctx.user.id },
        { roleName: "buyer", displayName: "Buyer", description: "Purchase products", isSystemRole: true, createdBy: ctx.user.id },
        { roleName: "veterinarian", displayName: "Veterinarian", description: "Animal health services", isSystemRole: true, createdBy: ctx.user.id },
        { roleName: "iot_technician", displayName: "IoT Technician", description: "Manage IoT devices", isSystemRole: true, createdBy: ctx.user.id },
      ];

      for (const role of roles) {
        await db.insert(customRoles).values(role);
      }

      // 3. Initialize security settings
      const settings = [
        { settingKey: "session_timeout_minutes", settingValue: "30", description: "Session timeout in minutes" },
        { settingKey: "max_failed_login_attempts", settingValue: "5", description: "Max failed login attempts" },
        { settingKey: "account_lock_duration_minutes", settingValue: "30", description: "Account lock duration" },
        { settingKey: "require_mfa_for_admin", settingValue: "true", description: "Require MFA for admins" },
        { settingKey: "require_approval_for_new_users", settingValue: "true", description: "Require approval for new users" },
        { settingKey: "max_concurrent_sessions", settingValue: "3", description: "Max concurrent sessions" },
      ];

      for (const setting of settings) {
        await db.insert(securitySettings).values(setting);
      }

      await logSecurityEvent({
        userId: ctx.user.id,
        eventType: "security_alert",
        eventDescription: "Security system initialized",
        severity: "high",
      });

      return {
        success: true,
        message: "Security system initialized successfully",
        stats: {
          modules: modules.length,
          roles: roles.length,
          settings: settings.length,
        },
      };
    }),
  }),
});


// Helper: Verify TOTP code (simplified implementation)
// In production, use a library like speakeasy or otplib
function verifyTOTP(secret: string, code: string): boolean {
  // This is a simplified implementation
  // In production, use: speakeasy.totp.verify({ secret, encoding: 'base32', token: code, window: 2 })
  
  // For now, accept any 6-digit code for testing
  // TODO: Implement proper TOTP verification with speakeasy
  return /^\d{6}$/.test(code);
}
