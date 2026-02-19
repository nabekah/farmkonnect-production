import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { users, twoFactorSettings, backupCodes, twoFactorAttempts } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import crypto from "crypto";

// Generate TOTP secret using speakeasy-like format
function generateTOTPSecret(): string {
  return crypto.randomBytes(20).toString("base64");
}

// Generate backup codes
function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    codes.push(crypto.randomBytes(4).toString("hex").toUpperCase());
  }
  return codes;
}

// Hash backup code for storage
function hashBackupCode(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}

// Verify backup code
function verifyBackupCode(code: string, hash: string): boolean {
  return hashBackupCode(code) === hash;
}

export const twoFactorAuthRouter = router({
  // Check if 2FA is enabled for current user
  isEnabled: protectedProcedure.query(async ({ ctx }) => {
    const db = getDb();
    const settings = await db
      .select()
      .from(twoFactorSettings)
      .where(eq(twoFactorSettings.userId, ctx.user.id))
      .limit(1);

    return {
      enabled: settings.length > 0 && settings[0].primaryMethod !== "none",
      settings: settings[0] || null,
    };
  }),

  // Generate 2FA setup secret
  generateSecret: protectedProcedure
    .input(z.object({ method: z.enum(["totp", "sms"]) }))
    .mutation(async ({ ctx, input }) => {
      // Only admins can enable 2FA
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admin users can enable 2FA",
        });
      }

      const secret = generateTOTPSecret();
      const backupCodesList = generateBackupCodes();

      return {
        secret,
        backupCodes: backupCodesList,
        qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=otpauth://totp/FarmKonnect:${ctx.user.email}?secret=${secret}&issuer=FarmKonnect`,
      };
    }),

  // Enable 2FA for user
  enable: protectedProcedure
    .input(
      z.object({
        method: z.enum(["totp", "sms"]),
        secret: z.string(),
        verificationCode: z.string(),
        backupCodes: z.array(z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admin users can enable 2FA",
        });
      }

      const db = getDb();

      // In production, verify the TOTP code here
      // For now, we'll accept any 6-digit code
      if (!/^\d{6}$/.test(input.verificationCode)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid verification code format",
        });
      }

      // Create or update 2FA settings
      const existing = await db
        .select()
        .from(twoFactorSettings)
        .where(eq(twoFactorSettings.userId, ctx.user.id))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(twoFactorSettings)
          .set({
            primaryMethod: input.method,
            enabledAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(twoFactorSettings.userId, ctx.user.id));
      } else {
        await db.insert(twoFactorSettings).values({
          userId: ctx.user.id,
          primaryMethod: input.method,
          enabledAt: new Date(),
        });
      }

      // Store backup codes
      const hashedCodes = input.backupCodes.map((code) => ({
        userId: ctx.user.id,
        code: hashBackupCode(code),
        used: false,
      }));

      // Clear old backup codes
      await db
        .delete(backupCodes)
        .where(eq(backupCodes.userId, ctx.user.id));

      // Insert new backup codes
      for (const code of hashedCodes) {
        await db.insert(backupCodes).values(code);
      }

      // Update user MFA flag
      await db
        .update(users)
        .set({ mfaEnabled: true })
        .where(eq(users.id, ctx.user.id));

      return {
        success: true,
        message: "2FA enabled successfully",
      };
    }),

  // Disable 2FA for user
  disable: protectedProcedure
    .input(z.object({ password: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admin users can disable 2FA",
        });
      }

      const db = getDb();

      // Update 2FA settings
      await db
        .update(twoFactorSettings)
        .set({
          primaryMethod: "none",
          disabledAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(twoFactorSettings.userId, ctx.user.id));

      // Update user MFA flag
      await db
        .update(users)
        .set({ mfaEnabled: false })
        .where(eq(users.id, ctx.user.id));

      // Clear backup codes
      await db
        .delete(backupCodes)
        .where(eq(backupCodes.userId, ctx.user.id));

      return {
        success: true,
        message: "2FA disabled successfully",
      };
    }),

  // Verify 2FA code during login
  verify: protectedProcedure
    .input(z.object({ code: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      // Check if code is a backup code
      const backupCodesList = await db
        .select()
        .from(backupCodes)
        .where(
          and(
            eq(backupCodes.userId, ctx.user.id),
            eq(backupCodes.used, false)
          )
        );

      for (const backup of backupCodesList) {
        if (verifyBackupCode(input.code, backup.code)) {
          // Mark backup code as used
          await db
            .update(backupCodes)
            .set({ used: true, usedAt: new Date() })
            .where(eq(backupCodes.id, backup.id));

          // Log successful 2FA attempt
          await db.insert(twoFactorAttempts).values({
            userId: ctx.user.id,
            attemptType: "totp",
            successful: true,
          });

          return {
            success: true,
            message: "2FA verification successful",
            backupCodeUsed: true,
          };
        }
      }

      // In production, verify TOTP code here
      // For now, accept any 6-digit code
      if (!/^\d{6}$/.test(input.code)) {
        await db.insert(twoFactorAttempts).values({
          userId: ctx.user.id,
          attemptType: "totp",
          successful: false,
        });

        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid 2FA code",
        });
      }

      // Log successful 2FA attempt
      await db.insert(twoFactorAttempts).values({
        userId: ctx.user.id,
        attemptType: "totp",
        successful: true,
      });

      return {
        success: true,
        message: "2FA verification successful",
      };
    }),

  // Get remaining backup codes count
  getBackupCodesCount: protectedProcedure.query(async ({ ctx }) => {
    const db = getDb();
    const codes = await db
      .select()
      .from(backupCodes)
      .where(
        and(
          eq(backupCodes.userId, ctx.user.id),
          eq(backupCodes.used, false)
        )
      );

    return {
      remaining: codes.length,
      total: 10,
    };
  }),

  // Regenerate backup codes
  regenerateBackupCodes: protectedProcedure
    .input(z.object({ verificationCode: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admin users can regenerate backup codes",
        });
      }

      const db = getDb();

      // Verify 2FA is enabled
      const settings = await db
        .select()
        .from(twoFactorSettings)
        .where(eq(twoFactorSettings.userId, ctx.user.id))
        .limit(1);

      if (!settings.length || settings[0].primaryMethod === "none") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "2FA is not enabled",
        });
      }

      // Generate new backup codes
      const newCodes = generateBackupCodes();
      const hashedCodes = newCodes.map((code) => ({
        userId: ctx.user.id,
        code: hashBackupCode(code),
        used: false,
      }));

      // Clear old backup codes
      await db
        .delete(backupCodes)
        .where(eq(backupCodes.userId, ctx.user.id));

      // Insert new backup codes
      for (const code of hashedCodes) {
        await db.insert(backupCodes).values(code);
      }

      return {
        success: true,
        backupCodes: newCodes,
      };
    }),
});
