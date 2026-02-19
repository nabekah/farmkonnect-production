import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { users, passwordResetRequests } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import crypto from "crypto";
import { sendEmail } from "../_core/emailNotifications";

// Generate secure reset token
function generateResetToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

// Hash password (in production, use bcrypt)
function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export const passwordResetRouter = router({
  // Request password reset
  requestReset: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      const db = getDb();

      // Find user by email
      const userList = await db
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);

      if (!userList.length) {
        // Don't reveal if email exists (security best practice)
        return {
          success: true,
          message: "If an account exists with this email, a password reset link has been sent",
        };
      }

      const user = userList[0];

      // Generate reset token
      const token = generateResetToken();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Create password reset request
      await db.insert(passwordResetRequests).values({
        userId: user.id,
        email: user.email!,
        token,
        expiresAt,
        used: false,
      });

      // Send reset email
      const resetUrl = `${process.env.VITE_FRONTEND_URL || "http://localhost:3000"}/reset-password?token=${token}`;

      try {
        await sendEmail({
          to: user.email!,
          subject: "FarmKonnect Password Reset Request",
          html: `
            <h2>Password Reset Request</h2>
            <p>You requested to reset your FarmKonnect password. Click the link below to proceed:</p>
            <p>
              <a href="${resetUrl}" style="background-color: #16a34a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Reset Password
              </a>
            </p>
            <p>Or copy and paste this link: ${resetUrl}</p>
            <p>This link will expire in 24 hours.</p>
            <p>If you didn't request this, please ignore this email.</p>
          `,
        });
      } catch (error) {
        console.error("Failed to send reset email:", error);
        // Don't fail the request, just log the error
      }

      return {
        success: true,
        message: "If an account exists with this email, a password reset link has been sent",
      };
    }),

  // Verify reset token
  verifyToken: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();

      const request = await db
        .select()
        .from(passwordResetRequests)
        .where(
          and(
            eq(passwordResetRequests.token, input.token),
            eq(passwordResetRequests.used, false)
          )
        )
        .limit(1);

      if (!request.length) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invalid or expired reset token",
        });
      }

      const resetRequest = request[0];

      // Check if token has expired
      if (new Date() > resetRequest.expiresAt) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Reset token has expired",
        });
      }

      return {
        valid: true,
        email: resetRequest.email,
      };
    }),

  // Reset password with token
  resetPassword: publicProcedure
    .input(
      z.object({
        token: z.string(),
        newPassword: z.string().min(8, "Password must be at least 8 characters"),
        confirmPassword: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      if (input.newPassword !== input.confirmPassword) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Passwords do not match",
        });
      }

      const db = getDb();

      // Find reset request
      const request = await db
        .select()
        .from(passwordResetRequests)
        .where(
          and(
            eq(passwordResetRequests.token, input.token),
            eq(passwordResetRequests.used, false)
          )
        )
        .limit(1);

      if (!request.length) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invalid or expired reset token",
        });
      }

      const resetRequest = request[0];

      // Check if token has expired
      if (new Date() > resetRequest.expiresAt) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Reset token has expired",
        });
      }

      // Update user password (in production, use bcrypt)
      const hashedPassword = hashPassword(input.newPassword);

      await db
        .update(users)
        .set({
          // Store hashed password - in production use bcrypt
          // For now, we'll store it in a custom field
          mfaSecret: hashedPassword, // Temporary storage - use proper password field in production
        })
        .where(eq(users.id, resetRequest.userId));

      // Mark reset request as used
      await db
        .update(passwordResetRequests)
        .set({
          used: true,
          usedAt: new Date(),
        })
        .where(eq(passwordResetRequests.id, resetRequest.id));

      // Send confirmation email
      try {
        await sendEmail({
          to: resetRequest.email,
          subject: "FarmKonnect Password Reset Successful",
          html: `
            <h2>Password Reset Successful</h2>
            <p>Your FarmKonnect password has been successfully reset.</p>
            <p>You can now sign in with your new password.</p>
            <p>If you didn't make this change, please contact support immediately.</p>
          `,
        });
      } catch (error) {
        console.error("Failed to send confirmation email:", error);
      }

      return {
        success: true,
        message: "Password reset successfully. You can now sign in with your new password.",
      };
    }),

  // Change password (for authenticated users)
  changePassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string(),
        newPassword: z.string().min(8, "Password must be at least 8 characters"),
        confirmPassword: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (input.newPassword !== input.confirmPassword) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Passwords do not match",
        });
      }

      const db = getDb();

      // Get user
      const userList = await db
        .select()
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1);

      if (!userList.length) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      const user = userList[0];

      // Verify current password (in production, use bcrypt compare)
      const hashedCurrentPassword = hashPassword(input.currentPassword);
      if (hashedCurrentPassword !== user.mfaSecret) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Current password is incorrect",
        });
      }

      // Update password
      const hashedNewPassword = hashPassword(input.newPassword);

      await db
        .update(users)
        .set({
          mfaSecret: hashedNewPassword,
          updatedAt: new Date(),
        })
        .where(eq(users.id, ctx.user.id));

      // Send confirmation email
      try {
        await sendEmail({
          to: user.email!,
          subject: "FarmKonnect Password Changed",
          html: `
            <h2>Password Changed Successfully</h2>
            <p>Your FarmKonnect password has been changed.</p>
            <p>If you didn't make this change, please reset your password immediately.</p>
          `,
        });
      } catch (error) {
        console.error("Failed to send confirmation email:", error);
      }

      return {
        success: true,
        message: "Password changed successfully",
      };
    }),

  // Get password reset history
  getResetHistory: protectedProcedure.query(async ({ ctx }) => {
    const db = getDb();

    const requests = await db
      .select()
      .from(passwordResetRequests)
      .where(eq(passwordResetRequests.userId, ctx.user.id));

    return requests.map((req) => ({
      id: req.id,
      email: req.email,
      createdAt: req.createdAt,
      used: req.used,
      usedAt: req.usedAt,
      expiresAt: req.expiresAt,
    }));
  }),
});
