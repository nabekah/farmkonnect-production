import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getDb } from "../db";
import { users, auditLogs } from "../../drizzle/schema";
import { eq, inArray } from "drizzle-orm";
import crypto from "crypto";

// Helper function to generate verification token
function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

// Helper function to log audit action
async function logAuditAction(
  db: any,
  adminId: number,
  userId: number,
  action: "approve" | "reject" | "suspend" | "unsuspend" | "bulk_approve" | "bulk_reject" | "bulk_suspend",
  reason?: string,
  bulkOperationId?: string
) {
  try {
    await db.insert(auditLogs).values({
      adminId,
      userId,
      action,
      reason,
      bulkOperationId,
      metadata: JSON.stringify({ timestamp: new Date().toISOString() })
    });
  } catch (error) {
    console.error("Error logging audit action:", error);
    // Don't throw - audit logging shouldn't block the main operation
  }
}

export const userApprovalRouter = router({
  // Get pending approval requests (admin only)
  getPendingRequests: protectedProcedure.query(async ({ ctx }) => {
    try {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Verify user is admin
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can view approval requests"
        });
      }

      // Get pending users from users table
      const pendingUsers = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          phone: users.phone,
          role: users.role,
          loginMethod: users.loginMethod,
          approvalStatus: users.approvalStatus,
          emailVerified: users.emailVerified,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(eq(users.approvalStatus, "pending"));

      return pendingUsers || [];
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      console.error("Error fetching pending requests:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch pending requests"
      });
    }
  }),

  // Approve user
  approveUser: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        // Verify user is admin
        if (ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only admins can approve users"
          });
        }

        // Update user approval status
        await db
          .update(users)
          .set({ approvalStatus: "approved" })
          .where(eq(users.id, input.userId));

        // Log audit action
        await logAuditAction(db, ctx.user.id, input.userId, "approve");

        return {
          success: true,
          message: "User approved successfully"
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Error approving user:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to approve user"
        });
      }
    }),

  // Reject user
  rejectUser: protectedProcedure
    .input(z.object({
      userId: z.number(),
      reason: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        // Verify user is admin
        if (ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only admins can reject users"
          });
        }

        // Update user approval status
        await db
          .update(users)
          .set({
            approvalStatus: "rejected",
            accountStatusReason: input.reason || "Rejected by admin"
          })
          .where(eq(users.id, input.userId));

        // Log audit action
        await logAuditAction(db, ctx.user.id, input.userId, "reject", input.reason);

        return {
          success: true,
          message: "User rejected successfully"
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Error rejecting user:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to reject user"
        });
      }
    }),

  // Suspend user
  suspendUser: protectedProcedure
    .input(z.object({
      userId: z.number(),
      reason: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        // Verify user is admin
        if (ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only admins can suspend users"
          });
        }

        // Update user account status
        await db
          .update(users)
          .set({
            accountStatus: "suspended",
            accountStatusReason: input.reason || "Suspended by admin"
          })
          .where(eq(users.id, input.userId));

        // Log audit action
        await logAuditAction(db, ctx.user.id, input.userId, "suspend", input.reason);

        return {
          success: true,
          message: "User suspended successfully"
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Error suspending user:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to suspend user"
        });
      }
    }),

  // Bulk approve users
  bulkApproveUsers: protectedProcedure
    .input(z.object({
      userIds: z.array(z.number()).min(1),
      reason: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        // Verify user is admin
        if (ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only admins can approve users"
          });
        }

        const bulkOperationId = crypto.randomUUID();

        // Update users approval status
        await db
          .update(users)
          .set({ approvalStatus: "approved" })
          .where(inArray(users.id, input.userIds));

        // Log audit actions for each user
        for (const userId of input.userIds) {
          await logAuditAction(db, ctx.user.id, userId, "bulk_approve", input.reason, bulkOperationId);
        }

        return {
          success: true,
          message: `${input.userIds.length} users approved successfully`,
          bulkOperationId
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Error bulk approving users:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to bulk approve users"
        });
      }
    }),

  // Bulk reject users
  bulkRejectUsers: protectedProcedure
    .input(z.object({
      userIds: z.array(z.number()).min(1),
      reason: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        // Verify user is admin
        if (ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only admins can reject users"
          });
        }

        const bulkOperationId = crypto.randomUUID();

        // Update users approval status
        await db
          .update(users)
          .set({
            approvalStatus: "rejected",
            accountStatusReason: input.reason || "Rejected by admin"
          })
          .where(inArray(users.id, input.userIds));

        // Log audit actions for each user
        for (const userId of input.userIds) {
          await logAuditAction(db, ctx.user.id, userId, "bulk_reject", input.reason, bulkOperationId);
        }

        return {
          success: true,
          message: `${input.userIds.length} users rejected successfully`,
          bulkOperationId
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Error bulk rejecting users:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to bulk reject users"
        });
      }
    }),

  // Bulk suspend users
  bulkSuspendUsers: protectedProcedure
    .input(z.object({
      userIds: z.array(z.number()).min(1),
      reason: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        // Verify user is admin
        if (ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only admins can suspend users"
          });
        }

        const bulkOperationId = crypto.randomUUID();

        // Update users account status
        await db
          .update(users)
          .set({
            accountStatus: "suspended",
            accountStatusReason: input.reason || "Suspended by admin"
          })
          .where(inArray(users.id, input.userIds));

        // Log audit actions for each user
        for (const userId of input.userIds) {
          await logAuditAction(db, ctx.user.id, userId, "bulk_suspend", input.reason, bulkOperationId);
        }

        return {
          success: true,
          message: `${input.userIds.length} users suspended successfully`,
          bulkOperationId
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Error bulk suspending users:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to bulk suspend users"
        });
      }
    }),

  // Send verification email
  sendVerificationEmail: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        // Verify user is admin
        if (ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only admins can send verification emails"
          });
        }

        const token = generateVerificationToken();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Update user with verification token
        await db
          .update(users)
          .set({
            emailVerificationToken: token,
            emailVerificationTokenExpiresAt: expiresAt
          })
          .where(eq(users.id, input.userId));

        // TODO: Send email with verification link
        // const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
        // await sendEmail(user.email, "Verify Your Email", verificationUrl);

        return {
          success: true,
          message: "Verification email sent successfully"
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Error sending verification email:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send verification email"
        });
      }
    }),

  // Verify email token
  verifyEmail: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        // Find user with matching token
        const userRecord = await db
          .select()
          .from(users)
          .where(eq(users.emailVerificationToken, input.token));

        if (!userRecord || userRecord.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Invalid verification token"
          });
        }

        const user = userRecord[0];

        // Check if token is expired
        if (user.emailVerificationTokenExpiresAt && new Date() > user.emailVerificationTokenExpiresAt) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Verification token has expired"
          });
        }

        // Mark email as verified
        await db
          .update(users)
          .set({
            emailVerified: true,
            emailVerificationToken: null,
            emailVerificationTokenExpiresAt: null
          })
          .where(eq(users.id, user.id));

        return {
          success: true,
          message: "Email verified successfully"
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Error verifying email:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to verify email"
        });
      }
    }),

  // Get audit logs (admin only)
  getAuditLogs: protectedProcedure
    .input(z.object({
      limit: z.number().default(50),
      offset: z.number().default(0),
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
            message: "Only admins can view audit logs"
          });
        }

        // Build query
        let query = db.select().from(auditLogs);

        if (input.userId) {
          query = query.where(eq(auditLogs.userId, input.userId));
        }

        // Get logs with limit and offset
        const logs = await query.limit(input.limit).offset(input.offset);

        return logs || [];
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Error fetching audit logs:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch audit logs"
        });
      }
    }),

  // Get approval status for current user
  getApprovalStatus: protectedProcedure.query(async ({ ctx }) => {
    try {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const userRecord = await db
        .select({
          id: users.id,
          approvalStatus: users.approvalStatus,
          accountStatus: users.accountStatus,
          accountStatusReason: users.accountStatusReason,
          emailVerified: users.emailVerified
        })
        .from(users)
        .where(eq(users.id, ctx.user.id));

      if (!userRecord || userRecord.length === 0) {
        return {
          status: "not_found",
          message: "User not found"
        };
      }

      return userRecord[0];
    } catch (error) {
      console.error("Error fetching approval status:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch approval status"
      });
    }
  }),

  // Get all users (admin only)
  getAllUsers: protectedProcedure.query(async ({ ctx }) => {
    try {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Verify user is admin
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can view all users"
        });
      }

      const allUsers = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          phone: users.phone,
          role: users.role,
          loginMethod: users.loginMethod,
          approvalStatus: users.approvalStatus,
          accountStatus: users.accountStatus,
          emailVerified: users.emailVerified,
          createdAt: users.createdAt,
        })
        .from(users);

      return allUsers || [];
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      console.error("Error fetching all users:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch users"
      });
    }
  })
});
