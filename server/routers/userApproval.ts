import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

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
        const result = await db
          .update(users)
          .set({ approvalStatus: "approved" })
          .where(eq(users.id, input.userId));

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
        const result = await db
          .update(users)
          .set({
            approvalStatus: "rejected",
            accountStatusReason: input.reason || "Rejected by admin"
          })
          .where(eq(users.id, input.userId));

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
        const result = await db
          .update(users)
          .set({
            accountStatus: "suspended",
            accountStatusReason: input.reason || "Suspended by admin"
          })
          .where(eq(users.id, input.userId));

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
          accountStatusReason: users.accountStatusReason
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
