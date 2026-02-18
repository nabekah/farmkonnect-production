import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { auditLog } from "../_core/auditLog";
import { ipManagement } from "../_core/ipManagement";
import { passwordlessAuth } from "../_core/passwordlessAuth";
import { emailNotifications } from "../_core/emailNotifications";

export const advancedSecurityRouter = router({
  // Audit Logging
  getAuditLogs: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const logs = auditLog.getUserLogs(ctx.user.id, input.limit, input.offset);
      return {
        logs,
        total: logs.length,
      };
    }),

  getAuditLogsByAction: protectedProcedure
    .input(
      z.object({
        action: z.string(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const logs = auditLog.getLogsByAction(input.action, input.limit);
      return {
        logs: logs.filter((l) => l.userId === ctx.user.id),
      };
    }),

  getAuditStatistics: protectedProcedure.query(async ({ ctx }) => {
    const stats = auditLog.getStatistics();
    return stats;
  }),

  exportAuditLogs: protectedProcedure
    .input(z.object({ format: z.enum(["json", "csv"]) }))
    .query(async ({ ctx, input }) => {
      const data = input.format === "json" ? auditLog.exportAsJson() : auditLog.exportAsCsv();
      return {
        data,
        format: input.format,
        filename: `audit-logs.${input.format}`,
      };
    }),

  // IP Management
  whitelistIp: protectedProcedure
    .input(
      z.object({
        ipAddress: z.string().ip(),
        reason: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const success = ipManagement.whitelistIp(input.ipAddress, ctx.user.id, input.reason);

      if (success) {
        auditLog.logAccountChange(
          ctx.user.id,
          "IP_WHITELIST_ADDED",
          {
            ipAddress: { before: null, after: input.ipAddress },
          },
          "127.0.0.1",
          ""
        );
      }

      return { success };
    }),

  removeFromWhitelist: protectedProcedure
    .input(z.object({ ipAddress: z.string().ip() }))
    .mutation(async ({ ctx, input }) => {
      const success = ipManagement.removeFromWhitelist(input.ipAddress);

      if (success) {
        auditLog.logAccountChange(
          ctx.user.id,
          "IP_WHITELIST_REMOVED",
          {
            ipAddress: { before: input.ipAddress, after: null },
          },
          "127.0.0.1",
          ""
        );
      }

      return { success };
    }),

  getUserWhitelist: protectedProcedure.query(async ({ ctx }) => {
    const whitelist = ipManagement.getUserWhitelist(ctx.user.id);
    return { whitelist };
  }),

  getBlacklist: protectedProcedure.query(async ({ ctx }) => {
    const blacklist = ipManagement.getBlacklist();
    return { blacklist };
  }),

  checkIpAccess: publicProcedure
    .input(z.object({ ipAddress: z.string().ip() }))
    .query(async ({ input }) => {
      const result = ipManagement.checkIpAccess(input.ipAddress);
      return result;
    }),

  getIpManagementStatistics: protectedProcedure.query(async ({ ctx }) => {
    const stats = ipManagement.getStatistics();
    return stats;
  }),

  // Passwordless Authentication - Magic Links
  requestMagicLink: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      const token = passwordlessAuth.generateMagicLinkToken(input.email);
      const magicLinkUrl = passwordlessAuth.generateMagicLinkUrl(
        token.token,
        "https://www.farmconnekt.com"
      );

      const emailContent = passwordlessAuth.generateMagicLinkEmailContent(input.email, magicLinkUrl);

      // Send email
      await emailNotifications.sendEmail(
        input.email,
        emailContent.subject,
        emailContent.html,
        emailContent.text
      );

      return {
        success: true,
        message: "Magic link sent to email",
      };
    }),

  verifyMagicLink: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const magicLink = passwordlessAuth.verifyMagicLinkToken(input.token);

      if (!magicLink) {
        return {
          valid: false,
          message: "Invalid or expired magic link",
        };
      }

      return {
        valid: true,
        email: magicLink.email,
        userId: magicLink.userId,
      };
    }),

  useMagicLink: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ input }) => {
      const success = passwordlessAuth.useMagicLinkToken(input.token);

      if (!success) {
        return {
          success: false,
          message: "Failed to use magic link",
        };
      }

      return {
        success: true,
        message: "Magic link used successfully",
      };
    }),

  // Passwordless Authentication - Biometric
  registerBiometricCredential: protectedProcedure
    .input(
      z.object({
        type: z.enum(["fingerprint", "face", "iris"]),
        credentialId: z.string(),
        publicKey: z.string(),
        transports: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const credential = passwordlessAuth.registerBiometricCredential(
        ctx.user.id,
        input.type,
        input.credentialId,
        input.publicKey,
        input.transports
      );

      auditLog.logAccountChange(
        ctx.user.id,
        "BIOMETRIC_REGISTERED",
        {
          type: { before: null, after: input.type },
        },
        "127.0.0.1",
        ""
      );

      return {
        success: true,
        credential,
      };
    }),

  getBiometricCredentials: protectedProcedure.query(async ({ ctx }) => {
    const credentials = passwordlessAuth.getUserBiometricCredentials(ctx.user.id);
    return { credentials };
  }),

  removeBiometricCredential: protectedProcedure
    .input(z.object({ credentialId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const success = passwordlessAuth.removeBiometricCredential(ctx.user.id, input.credentialId);

      if (success) {
        auditLog.logAccountChange(
          ctx.user.id,
          "BIOMETRIC_REMOVED",
          {
            credentialId: { before: input.credentialId, after: null },
          },
          "127.0.0.1",
          ""
        );
      }

      return { success };
    }),

  verifyBiometricCredential: protectedProcedure
    .input(
      z.object({
        credentialId: z.string(),
        counter: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      const result = passwordlessAuth.verifyBiometricCredential(
        ctx.user.id,
        input.credentialId,
        input.counter
      );

      if (!result.valid) {
        auditLog.log2FaEvent(ctx.user.id, "BIOMETRIC", false, "127.0.0.1", "");
      }

      return result;
    }),

  hasBiometricCredentials: protectedProcedure.query(async ({ ctx }) => {
    const has = passwordlessAuth.hasBiometricCredentials(ctx.user.id);
    return { has };
  }),

  getPasswordlessAuthStatistics: protectedProcedure.query(async ({ ctx }) => {
    const stats = passwordlessAuth.getStatistics();
    return stats;
  }),
});
