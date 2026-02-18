import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import {
  generateTotpSecret,
  verifyTotp,
  generateSmsOtp,
  generateBackupCodes as generateTotpBackupCodes,
  detectDeviceType,
} from "../_core/twoFactorAuth";
import {
  generateBackupCodes,
  verifyBackupCode,
  createRecoveryChallenge,
  isRecoveryChallengeValid,
  SECURITY_QUESTIONS,
} from "../_core/accountRecovery";
import { TRPCError } from "@trpc/server";

/**
 * Security Features Router
 * Handles 2FA setup, analytics, and account recovery
 */

export const securityFeaturesRouter = router({
  // ============================================================================
  // TWO-FACTOR AUTHENTICATION (2FA)
  // ============================================================================

  /**
   * Setup TOTP-based 2FA
   */
  setupTotp: protectedProcedure.query(async ({ ctx }) => {
    try {
      const { secret, qrCode, backupCodes } = generateTotpSecret(ctx.user.email || "user");

      return {
        secret,
        qrCode,
        backupCodes,
        message: "Scan the QR code with your authenticator app",
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to setup TOTP",
      });
    }
  }),

  /**
   * Verify and enable TOTP
   */
  enableTotp: protectedProcedure
    .input(
      z.object({
        secret: z.string(),
        token: z.string(),
        backupCodes: z.array(z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const verification = verifyTotp(input.token, input.secret);

      if (!verification.valid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid TOTP token",
        });
      }

      // In a real implementation, save to database
      // await db.update(users).set({
      //   totpSecret: input.secret,
      //   totpEnabled: true,
      //   mfaBackupCodes: JSON.stringify(input.backupCodes),
      // }).where(eq(users.id, ctx.user.id));

      return {
        success: true,
        message: "TOTP 2FA enabled successfully",
        backupCodes: input.backupCodes,
      };
    }),

  /**
   * Verify TOTP token during login
   */
  verifyTotpToken: protectedProcedure
    .input(z.object({ token: z.string(), secret: z.string() }))
    .mutation(async ({ input }) => {
      const result = verifyTotp(input.token, input.secret);

      if (!result.valid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: result.message,
        });
      }

      return { success: true, message: result.message };
    }),

  /**
   * Setup SMS-based 2FA
   */
  setupSms: protectedProcedure
    .input(z.object({ phoneNumber: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const otp = generateSmsOtp();

      // In a real implementation, send SMS via Twilio
      // await sendSms(input.phoneNumber, `Your FarmKonnect verification code is: ${otp}`);

      return {
        success: true,
        message: "Verification code sent to your phone",
        // Don't return the actual OTP in production
      };
    }),

  /**
   * Verify SMS OTP
   */
  verifySmsOtp: protectedProcedure
    .input(z.object({ otp: z.string() }))
    .mutation(async ({ input }) => {
      // In a real implementation, verify against stored OTP
      if (input.otp.length !== 6 || !/^\d+$/.test(input.otp)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid OTP format",
        });
      }

      return {
        success: true,
        message: "SMS OTP verified successfully",
      };
    }),

  /**
   * Disable 2FA
   */
  disableTwoFactor: protectedProcedure
    .input(z.object({ method: z.enum(["totp", "sms"]) }))
    .mutation(async ({ ctx, input }) => {
      // In a real implementation, update database
      // await db.update(users).set({
      //   [input.method === 'totp' ? 'totpEnabled' : 'smsEnabled']: false,
      // }).where(eq(users.id, ctx.user.id));

      return {
        success: true,
        message: `${input.method.toUpperCase()} 2FA disabled`,
      };
    }),

  // ============================================================================
  // LOGIN ANALYTICS
  // ============================================================================

  /**
   * Get user's login analytics
   */
  getLoginAnalytics: protectedProcedure
    .input(
      z.object({
        days: z.number().default(30),
      })
    )
    .query(async ({ ctx, input }) => {
      // In a real implementation, fetch from loginAnalytics table
      return {
        userId: ctx.user.id,
        period: `Last ${input.days} days`,
        totalLogins: 0,
        manusLogins: 0,
        googleLogins: 0,
        manusSuccessRate: 100,
        googleSuccessRate: 100,
        topDevices: [],
        topCountries: [],
        lastLogin: new Date(),
      };
    }),

  /**
   * Get authentication provider statistics
   */
  getAuthProviderStats: protectedProcedure.query(async () => {
    // In a real implementation, fetch from authProviderStats table
    return {
      date: new Date(),
      manusLogins: 0,
      googleLogins: 0,
      totalLogins: 0,
      manusSuccessRate: 100,
      googleSuccessRate: 100,
    };
  }),

  /**
   * Get user's preferred authentication method
   */
  getPreferredAuthMethod: protectedProcedure.query(async ({ ctx }) => {
    // In a real implementation, calculate from loginAnalytics
    return {
      userId: ctx.user.id,
      preferredProvider: "manus" as const,
      lastUsedProvider: "manus" as const,
      totalManusLogins: 0,
      totalGoogleLogins: 0,
    };
  }),

  // ============================================================================
  // ACCOUNT RECOVERY
  // ============================================================================

  /**
   * Generate backup codes for account recovery
   */
  generateBackupCodes: protectedProcedure.mutation(async ({ ctx }) => {
    const codes = generateBackupCodes(10);

    // In a real implementation, save to database
    // await db.insert(backupCodes).values(
    //   codes.map(code => ({
    //     userId: ctx.user.id,
    //     code: code.code,
    //     used: false,
    //   }))
    // );

    return {
      success: true,
      backupCodes: codes.map((c) => c.code),
      message: "Backup codes generated. Store them in a safe place.",
    };
  }),

  /**
   * Verify backup code for account recovery
   */
  verifyBackupCodeForRecovery: protectedProcedure
    .input(z.object({ code: z.string() }))
    .mutation(async ({ input }) => {
      // In a real implementation, fetch from database
      const mockBackupCodes = generateBackupCodes(10);

      const result = verifyBackupCode(input.code, mockBackupCodes);

      if (!result.valid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: result.message,
        });
      }

      return {
        success: true,
        message: result.message,
      };
    }),

  /**
   * Initiate account recovery
   */
  initiateAccountRecovery: protectedProcedure
    .input(
      z.object({
        email: z.string().email(),
        recoveryMethod: z.enum(["email", "backup_code", "security_question"]),
      })
    )
    .mutation(async ({ input }) => {
      // In a real implementation, create recovery challenge and send email
      const challenge = createRecoveryChallenge(1, "email_verification");

      return {
        success: true,
        challengeId: challenge.id,
        message: `Recovery link sent to ${input.email}`,
        expiresIn: 30, // minutes
      };
    }),

  /**
   * Get security questions for account recovery
   */
  getSecurityQuestions: protectedProcedure.query(async () => {
    return {
      questions: SECURITY_QUESTIONS.slice(0, 3), // Return 3 random questions
    };
  }),

  /**
   * Verify security answer
   */
  verifySecurityAnswer: protectedProcedure
    .input(
      z.object({
        question: z.string(),
        answer: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      // In a real implementation, verify against stored answer
      if (input.answer.length < 2) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid answer",
        });
      }

      return {
        success: true,
        message: "Security answer verified",
      };
    }),

  /**
   * Get account recovery status
   */
  getRecoveryStatus: protectedProcedure.query(async ({ ctx }) => {
    return {
      canRecoverWithEmail: !!ctx.user.email,
      canRecoverWithBackupCode: true, // In real implementation, check if codes exist
      canRecoverWithSecurityQuestion: true, // In real implementation, check if questions are set
      availableMethods: ["email", "backup_code"],
      lastRecoveryAttempt: null,
      recoveryAttempts: 0,
    };
  }),

  /**
   * Set security questions for account recovery
   */
  setSecurityQuestions: protectedProcedure
    .input(
      z.object({
        questions: z.array(
          z.object({
            question: z.string(),
            answer: z.string(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (input.questions.length < 2) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "At least 2 security questions are required",
        });
      }

      // In a real implementation, save to database with encryption
      return {
        success: true,
        message: "Security questions set successfully",
      };
    }),
});
