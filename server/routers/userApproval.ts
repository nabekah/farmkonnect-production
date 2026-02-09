import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getDb } from "../db";

export const userApprovalRouter = router({
  // Create approval request (called on user signup)
  createApprovalRequest: publicProcedure
    .input(z.object({
      userId: z.string(),
      email: z.string().email(),
      fullName: z.string()
    }))
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        // Check if request already exists
        const existing = await db.query.raw(
          `SELECT id FROM user_approval_requests WHERE userId = ?`,
          [input.userId]
        );

        if (existing && existing.length > 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Approval request already exists for this user"
          });
        }

        // Create approval request
        await db.query.raw(
          `INSERT INTO user_approval_requests (userId, email, fullName, status)
           VALUES (?, ?, ?, 'pending')`,
          [input.userId, input.email, input.fullName]
        );

        return {
          success: true,
          message: "Approval request created. Awaiting admin approval."
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Error creating approval request:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create approval request"
        });
      }
    }),

  // Get pending approval requests (admin only)
  getPendingRequests: protectedProcedure.query(async ({ ctx }) => {
    try {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Verify user is admin
      const isAdmin = await db.query.raw(
        `SELECT fw.role FROM farm_workers fw
         WHERE fw.userId = ? AND fw.role = 'admin'`,
        [ctx.user.id]
      );

      if (!isAdmin || isAdmin.length === 0) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can view approval requests"
        });
      }

      const requests = await db.query.raw(
        `SELECT id, userId, email, fullName, status, requestedAt, rejectionReason
         FROM user_approval_requests
         WHERE status IN ('pending', 'suspended')
         ORDER BY requestedAt ASC`
      );

      return requests || [];
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
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        // Verify user is admin
        const isAdmin = await db.query.raw(
          `SELECT fw.role FROM farm_workers fw
           WHERE fw.userId = ? AND fw.role = 'admin'`,
          [ctx.user.id]
        );

        if (!isAdmin || isAdmin.length === 0) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only admins can approve users"
          });
        }

        // Update approval request
        await db.query.raw(
          `UPDATE user_approval_requests 
           SET status = 'approved', approvedAt = NOW(), approvedBy = ?
           WHERE userId = ?`,
          [ctx.user.id, input.userId]
        );

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
      userId: z.string(),
      reason: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        // Verify user is admin
        const isAdmin = await db.query.raw(
          `SELECT fw.role FROM farm_workers fw
           WHERE fw.userId = ? AND fw.role = 'admin'`,
          [ctx.user.id]
        );

        if (!isAdmin || isAdmin.length === 0) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only admins can reject users"
          });
        }

        // Update approval request
        await db.query.raw(
          `UPDATE user_approval_requests 
           SET status = 'rejected', rejectionReason = ?, approvedBy = ?
           WHERE userId = ?`,
          [input.reason, ctx.user.id, input.userId]
        );

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
      userId: z.string(),
      reason: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        // Verify user is admin
        const isAdmin = await db.query.raw(
          `SELECT fw.role FROM farm_workers fw
           WHERE fw.userId = ? AND fw.role = 'admin'`,
          [ctx.user.id]
        );

        if (!isAdmin || isAdmin.length === 0) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only admins can suspend users"
          });
        }

        // Update approval request
        await db.query.raw(
          `UPDATE user_approval_requests 
           SET status = 'suspended', suspensionReason = ?
           WHERE userId = ?`,
          [input.reason, input.userId]
        );

        // Disable all farm worker access
        await db.query.raw(
          `UPDATE farm_workers SET status = 'suspended' WHERE userId = ?`,
          [input.userId]
        );

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

  // Get approval status
  getApprovalStatus: protectedProcedure.query(async ({ ctx }) => {
    try {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const status = await db.query.raw(
        `SELECT status, approvedAt, rejectionReason, suspensionReason
         FROM user_approval_requests
         WHERE userId = ?`,
        [ctx.user.id]
      );

      if (!status || status.length === 0) {
        return {
          status: "not_requested",
          message: "No approval request found"
        };
      }

      return status[0];
    } catch (error) {
      console.error("Error fetching approval status:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch approval status"
      });
    }
  })
});
