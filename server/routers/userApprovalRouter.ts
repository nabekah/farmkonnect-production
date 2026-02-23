import { router, protectedProcedure, adminProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { sendApprovalEmail, sendRejectionEmail } from "../services/emailService";

export const userApprovalRouter = router({
  /**
   * Get all pending user registrations (admin only)
   */
  getPendingUsers: adminProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const pendingUsers = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      role: users.role,
      loginMethod: users.loginMethod,
      createdAt: users.createdAt,
      approvalStatus: users.approvalStatus,
    }).from(users).where(eq(users.approvalStatus, "pending"));

    return pendingUsers;
  }),

  /**
   * Get all approved users (admin only)
   */
  getApprovedUsers: adminProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const approvedUsers = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      role: users.role,
      loginMethod: users.loginMethod,
      createdAt: users.createdAt,
      approvalStatus: users.approvalStatus,
      lastSignedIn: users.lastSignedIn,
    }).from(users).where(eq(users.approvalStatus, "approved"));

    return approvedUsers;
  }),

  /**
   * Get all rejected users (admin only)
   */
  getRejectedUsers: adminProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const rejectedUsers = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      role: users.role,
      loginMethod: users.loginMethod,
      createdAt: users.createdAt,
      approvalStatus: users.approvalStatus,
      accountStatusReason: users.accountStatusReason,
    }).from(users).where(eq(users.approvalStatus, "rejected"));

    return rejectedUsers;
  }),

  /**
   * Get user approval statistics (admin only)
   */
  getApprovalStats: adminProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const allUsers = await db.select().from(users);
    
    const stats = {
      total: allUsers.length,
      pending: allUsers.filter(u => u.approvalStatus === "pending").length,
      approved: allUsers.filter(u => u.approvalStatus === "approved").length,
      rejected: allUsers.filter(u => u.approvalStatus === "rejected").length,
      byRole: {
        farmer: allUsers.filter(u => u.role === "farmer").length,
        agent: allUsers.filter(u => u.role === "agent").length,
        veterinarian: allUsers.filter(u => u.role === "veterinarian").length,
        buyer: allUsers.filter(u => u.role === "buyer").length,
        transporter: allUsers.filter(u => u.role === "transporter").length,
      },
    };

    return stats;
  }),

  /**
   * Approve a user registration (admin only)
   */
  approveUser: adminProcedure
    .input(z.object({
      userId: z.number(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Get user
      const [user] = await db.select().from(users).where(eq(users.id, input.userId));
      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      if (user.approvalStatus !== "pending") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User is not in pending status",
        });
      }

      // Update user approval status
      await db.update(users)
        .set({
          approvalStatus: "approved",
          accountStatusReason: input.notes || null,
        })
        .where(eq(users.id, input.userId));

      // Send approval email
      try {
        await sendApprovalEmail(user.email, user.name);
      } catch (error) {
        console.error("Failed to send approval email:", error);
        // Don't throw error - approval should succeed even if email fails
      }

      return { success: true, message: "User approved successfully" };
    }),

  /**
   * Reject a user registration (admin only)
   */
  rejectUser: adminProcedure
    .input(z.object({
      userId: z.number(),
      reason: z.string().min(10, "Rejection reason must be at least 10 characters"),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Get user
      const [user] = await db.select().from(users).where(eq(users.id, input.userId));
      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      if (user.approvalStatus !== "pending") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User is not in pending status",
        });
      }

      // Update user approval status
      await db.update(users)
        .set({
          approvalStatus: "rejected",
          accountStatusReason: input.reason,
          accountStatus: "disabled",
        })
        .where(eq(users.id, input.userId));

      // Send rejection email
      try {
        await sendRejectionEmail(user.email, user.name, input.reason);
      } catch (error) {
        console.error("Failed to send rejection email:", error);
        // Don't throw error - rejection should succeed even if email fails
      }

      return { success: true, message: "User rejected successfully" };
    }),

  /**
   * Bulk approve users (admin only)
   */
  bulkApproveUsers: adminProcedure
    .input(z.object({
      userIds: z.array(z.number()).min(1),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Get all users
      const usersToApprove = await db.select().from(users).where(
        and(
          eq(users.approvalStatus, "pending"),
          // Filter by IDs - using a workaround since Drizzle doesn't support IN directly
        )
      );

      let approved = 0;
      for (const userId of input.userIds) {
        const [user] = await db.select().from(users).where(eq(users.id, userId));
        if (user && user.approvalStatus === "pending") {
          await db.update(users)
            .set({ approvalStatus: "approved" })
            .where(eq(users.id, userId));
          
          // Send approval email
          try {
            await sendApprovalEmail(user.email, user.name);
          } catch (error) {
            console.error("Failed to send approval email:", error);
          }
          
          approved++;
        }
      }

      return { success: true, approved, message: `${approved} users approved successfully` };
    }),

  /**
   * Get user details for approval review (admin only)
   */
  getUserDetails: adminProcedure
    .input(z.object({
      userId: z.number(),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [user] = await db.select().from(users).where(eq(users.id, input.userId));
      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        loginMethod: user.loginMethod,
        approvalStatus: user.approvalStatus,
        accountStatus: user.accountStatus,
        accountStatusReason: user.accountStatusReason,
        createdAt: user.createdAt,
        emailVerified: user.emailVerified,
      };
    }),
});
