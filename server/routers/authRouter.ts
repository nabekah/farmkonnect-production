import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { users, userAuthProviders } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";
import crypto from "crypto";

/**
 * Password validation schema
 * Requirements:
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, "Password must contain at least one special character");

/**
 * Hash password using bcrypt
 */
async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Verify password against hash
 */
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate email verification token
 */
function generateVerificationToken(): { token: string; expiresAt: Date } {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  return { token, expiresAt };
}

export const authRouter = router({
  /**
   * Register a new user with username and password
   */
  registerWithPassword: publicProcedure
    .input(
      z.object({
        username: z
          .string()
          .min(3, "Username must be at least 3 characters")
          .max(100, "Username must be at most 100 characters")
          .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens"),
        email: z.string().email("Invalid email address"),
        password: passwordSchema,
        confirmPassword: z.string(),
        name: z.string().min(2, "Name must be at least 2 characters"),
        role: z.enum(["farmer", "agent", "veterinarian", "buyer", "transporter", "user"]).default("farmer"),
      })
    )
    .mutation(async ({ input }) => {
      // Validate password confirmation
      if (input.password !== input.confirmPassword) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Passwords don't match",
        });
      }

      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      // Check if username already exists
      const existingUsername = await db
        .select()
        .from(users)
        .where(eq(users.username, input.username))
        .limit(1);

      if (existingUsername.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Username already taken. Please choose a different username.",
        });
      }

      // Check if email already exists
      const existingEmail = await db
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);

      if (existingEmail.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Email already registered. Please sign in or use a different email.",
        });
      }

      try {
        // Hash password
        const passwordHash = await hashPassword(input.password);

        // Generate email verification token
        const { token: verificationToken, expiresAt: verificationTokenExpiresAt } = generateVerificationToken();

        // Create user account
        const result = await db.insert(users).values({
          username: input.username,
          email: input.email,
          passwordHash,
          name: input.name,
          role: input.role,
          loginMethod: "local",
          approvalStatus: "pending",
          accountStatus: "active",
          emailVerified: false,
          emailVerificationToken: verificationToken,
          emailVerificationTokenExpiresAt: verificationTokenExpiresAt,
        });

        return {
          success: true,
          message: "Registration successful! Please check your email to verify your account.",
          userId: result.insertId,
        };
      } catch (error: any) {
        console.error("Registration error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create account. Please try again.",
        });
      }
    }),

  /**
   * Login with username/email and password
   */
  loginWithPassword: publicProcedure
    .input(
      z.object({
        usernameOrEmail: z.string().min(1, "Username or email is required"),
        password: z.string().min(1, "Password is required"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      // Find user by username or email
      const user = await db
        .select()
        .from(users)
        .where(
          input.usernameOrEmail.includes("@")
            ? eq(users.email, input.usernameOrEmail)
            : eq(users.username, input.usernameOrEmail)
        )
        .limit(1);

      if (user.length === 0) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid username/email or password.",
        });
      }

      const userRecord = user[0];

      // Check if account is locked
      if (userRecord.accountLockedUntil && new Date() < userRecord.accountLockedUntil) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Account is temporarily locked. Please try again later.",
        });
      }

      // Verify password
      if (!userRecord.passwordHash) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "This account was not created with a password. Please use OAuth to sign in.",
        });
      }

      const passwordValid = await verifyPassword(input.password, userRecord.passwordHash);

      if (!passwordValid) {
        // Increment failed login attempts
        const failedAttempts = (userRecord.failedLoginAttempts || 0) + 1;
        const lockUntil = failedAttempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null; // Lock for 15 minutes after 5 attempts

        await db
          .update(users)
          .set({
            failedLoginAttempts: failedAttempts,
            lastFailedLoginAt: new Date(),
            accountLockedUntil: lockUntil,
          })
          .where(eq(users.id, userRecord.id));

        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid username/email or password.",
        });
      }

      // Check if email is verified
      if (!userRecord.emailVerified) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Please verify your email before signing in.",
        });
      }

      // Check if account is approved
      if (userRecord.approvalStatus !== "approved") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Your account is pending approval. Please wait for admin approval.",
        });
      }

      // Check if account is active
      if (userRecord.accountStatus !== "active") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Your account is ${userRecord.accountStatus}. ${userRecord.accountStatusReason || ""}`,
        });
      }

      // Reset failed login attempts on successful login
      await db
        .update(users)
        .set({
          failedLoginAttempts: 0,
          lastFailedLoginAt: null,
          accountLockedUntil: null,
          lastSignedIn: new Date(),
        })
        .where(eq(users.id, userRecord.id));

      return {
        success: true,
        message: "Login successful!",
        user: {
          id: userRecord.id,
          username: userRecord.username,
          email: userRecord.email,
          name: userRecord.name,
          role: userRecord.role,
        },
      };
    }),

  /**
   * Verify email with token
   */
  verifyEmail: publicProcedure
    .input(
      z.object({
        token: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      // Find user with verification token
      const user = await db
        .select()
        .from(users)
        .where(eq(users.emailVerificationToken, input.token))
        .limit(1);

      if (user.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invalid verification token.",
        });
      }

      const userRecord = user[0];

      // Check if token has expired
      if (userRecord.emailVerificationTokenExpiresAt && new Date() > userRecord.emailVerificationTokenExpiresAt) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Verification token has expired. Please request a new one.",
        });
      }

      // Mark email as verified
      await db
        .update(users)
        .set({
          emailVerified: true,
          emailVerificationToken: null,
          emailVerificationTokenExpiresAt: null,
        })
        .where(eq(users.id, userRecord.id));

      return {
        success: true,
        message: "Email verified successfully!",
      };
    }),

  /**
   * Request email verification token
   */
  requestEmailVerification: publicProcedure
    .input(
      z.object({
        email: z.string().email("Invalid email address"),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      // Find user by email
      const user = await db
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);

      if (user.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found.",
        });
      }

      const userRecord = user[0];

      // Check if email is already verified
      if (userRecord.emailVerified) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Email is already verified.",
        });
      }

      // Generate new verification token
      const { token: verificationToken, expiresAt: verificationTokenExpiresAt } = generateVerificationToken();

      // Update user with new token
      await db
        .update(users)
        .set({
          emailVerificationToken: verificationToken,
          emailVerificationTokenExpiresAt: verificationTokenExpiresAt,
        })
        .where(eq(users.id, userRecord.id));

      return {
        success: true,
        message: "Verification email sent. Please check your inbox.",
        // In production, you would send an email here
        verificationToken, // For testing only
      };
    }),

  /**
   * Change password for authenticated users
   */
  changePassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string().min(1, "Current password is required"),
        newPassword: passwordSchema,
        confirmPassword: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Validate password confirmation
      if (input.newPassword !== input.confirmPassword) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Passwords don't match",
        });
      }

      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to change your password.",
        });
      }

      // Get current user
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1);

      if (user.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found.",
        });
      }

      const userRecord = user[0];

      // Verify current password
      if (!userRecord.passwordHash) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "This account was not created with a password.",
        });
      }

      const passwordValid = await verifyPassword(input.currentPassword, userRecord.passwordHash);

      if (!passwordValid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Current password is incorrect.",
        });
      }

      // Hash new password
      const newPasswordHash = await hashPassword(input.newPassword);

      // Update password
      await db
        .update(users)
        .set({
          passwordHash: newPasswordHash,
        })
        .where(eq(users.id, ctx.user.id));

      return {
        success: true,
        message: "Password changed successfully!",
      };
    }),

  /**
   * Get authentication providers for a user
   */
  getAuthProviders: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    if (!ctx.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "You must be logged in.",
      });
    }

    const providers = await db
      .select()
      .from(userAuthProviders)
      .where(eq(userAuthProviders.userId, ctx.user.id));

    return providers;
  }),

  /**
   * Link OAuth provider to existing account
   */
  linkOAuthProvider: protectedProcedure
    .input(
      z.object({
        provider: z.enum(["manus", "google"]),
        providerId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in.",
        });
      }

      // Check if provider is already linked to another account
      const existingProvider = await db
        .select()
        .from(userAuthProviders)
        .where(
          and(
            eq(userAuthProviders.provider, input.provider),
            eq(userAuthProviders.providerId, input.providerId)
          )
        )
        .limit(1);

      if (existingProvider.length > 0 && existingProvider[0].userId !== ctx.user.id) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "This OAuth provider is already linked to another account.",
        });
      }

      // Link provider
      await db.insert(userAuthProviders).values({
        userId: ctx.user.id,
        provider: input.provider,
        providerId: input.providerId,
      });

      return {
        success: true,
        message: `${input.provider} account linked successfully!`,
      };
    }),

  /**
   * Unlink OAuth provider from account
   */
  unlinkOAuthProvider: protectedProcedure
    .input(
      z.object({
        provider: z.enum(["manus", "google"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in.",
        });
      }

      // Check if user has other authentication methods
      const providers = await db
        .select()
        .from(userAuthProviders)
        .where(eq(userAuthProviders.userId, ctx.user.id));

      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1);

      const userRecord = user[0];
      const hasPassword = !!userRecord.passwordHash;
      const otherProviders = providers.filter((p) => p.provider !== input.provider);

      if (!hasPassword && otherProviders.length === 0) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You must have at least one authentication method.",
        });
      }

      // Unlink provider
      await db
        .delete(userAuthProviders)
        .where(
          and(
            eq(userAuthProviders.userId, ctx.user.id),
            eq(userAuthProviders.provider, input.provider)
          )
        );

      return {
        success: true,
        message: `${input.provider} account unlinked successfully!`,
      };
    }),
});
