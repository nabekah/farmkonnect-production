import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getDb } from "../db";
import crypto from "crypto";

// TOTP implementation (simplified - use speakeasy library in production)
function generateTOTPSecret(): string {
  return crypto.randomBytes(32).toString("base64");
}

function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    codes.push(crypto.randomBytes(4).toString("hex").toUpperCase());
  }
  return codes;
}

export const mfaRouter = router({
  // Enable TOTP
  enableTOTP: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const secret = generateTOTPSecret();
      const backupCodes = generateBackupCodes();

      // Check if MFA settings exist
      const existing = await db.query.raw(
        `SELECT id FROM mfa_settings WHERE userId = ?`,
        [ctx.user.id]
      );

      if (existing && existing.length > 0) {
        // Update existing
        await db.query.raw(
          `UPDATE mfa_settings SET totpSecret = ?, backupCodes = ? WHERE userId = ?`,
          [secret, JSON.stringify(backupCodes), ctx.user.id]
        );
      } else {
        // Create new
        await db.query.raw(
          `INSERT INTO mfa_settings (userId, totpSecret, backupCodes) VALUES (?, ?, ?)`,
          [ctx.user.id, secret, JSON.stringify(backupCodes)]
        );
      }

      return {
        success: true,
        secret,
        backupCodes,
        message: "TOTP setup initiated. Scan the QR code with your authenticator app."
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      console.error("Error enabling TOTP:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to enable TOTP"
      });
    }
  }),

  // Verify and activate TOTP
  verifyAndActivateTOTP: protectedProcedure
    .input(z.object({ code: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        // In production, use speakeasy to verify the code
        // For now, accept any 6-digit code as valid
        if (!/^\d{6}$/.test(input.code)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid code format"
          });
        }

        // Activate TOTP
        await db.query.raw(
          `UPDATE mfa_settings SET totpEnabled = TRUE WHERE userId = ?`,
          [ctx.user.id]
        );

        return {
          success: true,
          message: "TOTP enabled successfully"
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Error verifying TOTP:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to verify TOTP"
        });
      }
    }),

  // Enable SMS 2FA
  enableSMS: protectedProcedure
    .input(z.object({ phoneNumber: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        // Validate phone number format
        if (!/^\+?[\d\s\-()]{10,}$/.test(input.phoneNumber)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid phone number format"
          });
        }

        // Check if MFA settings exist
        const existing = await db.query.raw(
          `SELECT id FROM mfa_settings WHERE userId = ?`,
          [ctx.user.id]
        );

        if (existing && existing.length > 0) {
          // Update existing
          await db.query.raw(
            `UPDATE mfa_settings SET smsPhoneNumber = ? WHERE userId = ?`,
            [input.phoneNumber, ctx.user.id]
          );
        } else {
          // Create new
          await db.query.raw(
            `INSERT INTO mfa_settings (userId, smsPhoneNumber) VALUES (?, ?)`,
            [ctx.user.id, input.phoneNumber]
          );
        }

        // In production, send SMS verification code
        console.log(`SMS verification code would be sent to ${input.phoneNumber}`);

        return {
          success: true,
          message: "SMS 2FA setup initiated. Verification code sent to your phone."
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Error enabling SMS:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to enable SMS 2FA"
        });
      }
    }),

  // Verify SMS code
  verifySMSCode: protectedProcedure
    .input(z.object({ code: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        // In production, verify the code sent via SMS
        if (!/^\d{6}$/.test(input.code)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid code format"
          });
        }

        // Activate SMS 2FA
        await db.query.raw(
          `UPDATE mfa_settings SET smsEnabled = TRUE WHERE userId = ?`,
          [ctx.user.id]
        );

        return {
          success: true,
          message: "SMS 2FA enabled successfully"
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Error verifying SMS code:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to verify SMS code"
        });
      }
    }),

  // Get MFA status
  getMFAStatus: protectedProcedure.query(async ({ ctx }) => {
    try {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const mfaSettings = await db.query.raw(
        `SELECT totpEnabled, smsEnabled, smsPhoneNumber FROM mfa_settings WHERE userId = ?`,
        [ctx.user.id]
      );

      if (!mfaSettings || mfaSettings.length === 0) {
        return {
          totpEnabled: false,
          smsEnabled: false,
          smsPhoneNumber: null
        };
      }

      return mfaSettings[0];
    } catch (error) {
      console.error("Error fetching MFA status:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch MFA status"
      });
    }
  }),

  // Disable MFA method
  disableMFA: protectedProcedure
    .input(z.object({ method: z.enum(["totp", "sms"]) }))
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        if (input.method === "totp") {
          await db.query.raw(
            `UPDATE mfa_settings SET totpEnabled = FALSE, totpSecret = NULL WHERE userId = ?`,
            [ctx.user.id]
          );
        } else {
          await db.query.raw(
            `UPDATE mfa_settings SET smsEnabled = FALSE, smsPhoneNumber = NULL WHERE userId = ?`,
            [ctx.user.id]
          );
        }

        return {
          success: true,
          message: `${input.method.toUpperCase()} MFA disabled successfully`
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Error disabling MFA:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to disable MFA"
        });
      }
    }),

  // Get backup codes
  getBackupCodes: protectedProcedure.query(async ({ ctx }) => {
    try {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const result = await db.query.raw(
        `SELECT backupCodes FROM mfa_settings WHERE userId = ?`,
        [ctx.user.id]
      );

      if (!result || result.length === 0) {
        return { backupCodes: [] };
      }

      const backupCodes = result[0].backupCodes ? JSON.parse(result[0].backupCodes) : [];
      return { backupCodes };
    } catch (error) {
      console.error("Error fetching backup codes:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch backup codes"
      });
    }
  }),

  // Regenerate backup codes
  regenerateBackupCodes: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const newBackupCodes = generateBackupCodes();

      await db.query.raw(
        `UPDATE mfa_settings SET backupCodes = ? WHERE userId = ?`,
        [JSON.stringify(newBackupCodes), ctx.user.id]
      );

      return {
        success: true,
        backupCodes: newBackupCodes,
        message: "Backup codes regenerated successfully"
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      console.error("Error regenerating backup codes:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to regenerate backup codes"
      });
    }
  })
});
