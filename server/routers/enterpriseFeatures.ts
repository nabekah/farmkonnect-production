import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { ssoProvider } from "../_core/ssoProvider";
import { complianceDashboard } from "../_core/complianceDashboard";
import { apiKeyManagement } from "../_core/apiKeyManagement";

export const enterpriseFeaturesRouter = router({
  // SSO Management
  getEnabledSsoProviders: publicProcedure.query(async () => {
    const providers = ssoProvider.getEnabledProviders();
    return {
      providers: providers.map((p) => ({
        id: p.id,
        name: p.name,
        type: p.type,
      })),
    };
  }),

  getSsoProvider: protectedProcedure
    .input(z.object({ providerId: z.string() }))
    .query(async ({ input }) => {
      const provider = ssoProvider.getProvider(input.providerId);
      return { provider };
    }),

  generateSamlRequest: publicProcedure
    .input(z.object({ providerId: z.string() }))
    .query(async ({ input }) => {
      const samlRequest = ssoProvider.generateSamlRequest(input.providerId);
      return { samlRequest };
    }),

  generateOidcAuthorizationUrl: publicProcedure
    .input(
      z.object({
        providerId: z.string(),
        state: z.string(),
        nonce: z.string(),
      })
    )
    .query(async ({ input }) => {
      const url = ssoProvider.generateOidcAuthorizationUrl(input.providerId, input.state, input.nonce);
      return { url };
    }),

  connectSsoProvider: protectedProcedure
    .input(
      z.object({
        providerId: z.string(),
        providerUserId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const success = ssoProvider.mapSsoUser(ctx.user.id, input.providerId, input.providerUserId);
      return { success };
    }),

  getUserSsoProviders: protectedProcedure.query(async ({ ctx }) => {
    const providers = ssoProvider.getUserSsoProviders(ctx.user.id);
    return { providers };
  }),

  disconnectSsoProvider: protectedProcedure
    .input(z.object({ providerId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const success = ssoProvider.disconnectSsoProvider(ctx.user.id, input.providerId);
      return { success };
    }),

  getSsoStatistics: protectedProcedure.query(async () => {
    const stats = ssoProvider.getStatistics();
    return { stats };
  }),

  // Compliance Dashboard
  getComplianceDashboard: protectedProcedure.query(async () => {
    const summary = complianceDashboard.getDashboardSummary();
    return { summary };
  }),

  getComplianceMetrics: protectedProcedure
    .input(z.object({ framework: z.enum(["gdpr", "hipaa", "soc2", "pci-dss", "iso27001"]) }))
    .query(async ({ input }) => {
      const metrics = complianceDashboard.getComplianceMetrics(input.framework);
      return { metrics };
    }),

  getComplianceReport: protectedProcedure
    .input(z.object({ framework: z.enum(["gdpr", "hipaa", "soc2", "pci-dss", "iso27001"]) }))
    .query(async ({ input }) => {
      const report = complianceDashboard.generateComplianceReport(input.framework);
      return { report };
    }),

  getDataRetentionPolicies: protectedProcedure.query(async () => {
    const policies = complianceDashboard.getAllDataRetentionPolicies();
    return { policies };
  }),

  updateDataRetentionPolicy: protectedProcedure
    .input(
      z.object({
        dataType: z.string(),
        retentionPeriod: z.number(),
        autoDelete: z.boolean(),
      })
    )
    .mutation(async ({ input }) => {
      complianceDashboard.setDataRetentionPolicy({
        dataType: input.dataType,
        retentionPeriod: input.retentionPeriod,
        autoDelete: input.autoDelete,
        lastReviewDate: new Date(),
        nextReviewDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      });

      return { success: true };
    }),

  getComplianceAuditLogs: protectedProcedure
    .input(z.object({ limit: z.number().default(50) }))
    .query(async ({ input }) => {
      const logs = complianceDashboard.getAuditLogs(input.limit);
      return { logs };
    }),

  // API Key Management
  createApiKey: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        permissions: z.array(
          z.enum([
            "read:farms",
            "write:farms",
            "read:crops",
            "write:crops",
            "read:livestock",
            "write:livestock",
            "read:marketplace",
            "write:marketplace",
            "read:analytics",
            "write:analytics",
            "read:iot",
            "write:iot",
            "admin:all",
          ])
        ),
        expiresAt: z.date().optional(),
        ipWhitelist: z.array(z.string().ip()).optional(),
        rateLimit: z.number().default(100),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const apiKey = apiKeyManagement.createApiKey(
        ctx.user.id,
        input.name,
        input.permissions,
        input.expiresAt,
        input.ipWhitelist,
        input.rateLimit
      );

      return { apiKey };
    }),

  getApiKeys: protectedProcedure.query(async ({ ctx }) => {
    const keys = apiKeyManagement.getUserApiKeys(ctx.user.id);
    return { keys };
  }),

  getApiKey: protectedProcedure
    .input(z.object({ keyId: z.string() }))
    .query(async ({ ctx, input }) => {
      const apiKey = apiKeyManagement.getApiKey(input.keyId);

      if (!apiKey || apiKey.userId !== ctx.user.id) {
        return { apiKey: null };
      }

      const { key, ...keyWithoutSecret } = apiKey;
      return { apiKey: keyWithoutSecret };
    }),

  updateApiKeyPermissions: protectedProcedure
    .input(
      z.object({
        keyId: z.string(),
        permissions: z.array(z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const apiKey = apiKeyManagement.getApiKey(input.keyId);

      if (!apiKey || apiKey.userId !== ctx.user.id) {
        return { success: false };
      }

      const success = apiKeyManagement.updateApiKeyPermissions(
        input.keyId,
        input.permissions as any
      );

      return { success };
    }),

  rotateApiKey: protectedProcedure
    .input(z.object({ keyId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const apiKey = apiKeyManagement.getApiKey(input.keyId);

      if (!apiKey || apiKey.userId !== ctx.user.id) {
        return { success: false };
      }

      const rotated = apiKeyManagement.rotateApiKey(input.keyId);
      return { success: !!rotated, apiKey: rotated };
    }),

  revokeApiKey: protectedProcedure
    .input(z.object({ keyId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const apiKey = apiKeyManagement.getApiKey(input.keyId);

      if (!apiKey || apiKey.userId !== ctx.user.id) {
        return { success: false };
      }

      const success = apiKeyManagement.revokeApiKey(input.keyId);
      return { success };
    }),

  deleteApiKey: protectedProcedure
    .input(z.object({ keyId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const apiKey = apiKeyManagement.getApiKey(input.keyId);

      if (!apiKey || apiKey.userId !== ctx.user.id) {
        return { success: false };
      }

      const success = apiKeyManagement.deleteApiKey(input.keyId);
      return { success };
    }),

  getApiKeyUsage: protectedProcedure
    .input(z.object({ keyId: z.string(), limit: z.number().default(100) }))
    .query(async ({ ctx, input }) => {
      const apiKey = apiKeyManagement.getApiKey(input.keyId);

      if (!apiKey || apiKey.userId !== ctx.user.id) {
        return { usage: [] };
      }

      const usage = apiKeyManagement.getApiKeyUsage(input.keyId, input.limit);
      return { usage };
    }),

  getApiKeyStatistics: protectedProcedure
    .input(z.object({ keyId: z.string() }))
    .query(async ({ ctx, input }) => {
      const apiKey = apiKeyManagement.getApiKey(input.keyId);

      if (!apiKey || apiKey.userId !== ctx.user.id) {
        return { statistics: null };
      }

      const statistics = apiKeyManagement.getApiKeyStatistics(input.keyId);
      return { statistics };
    }),

  checkApiKeyRateLimit: protectedProcedure
    .input(z.object({ keyId: z.string() }))
    .query(async ({ ctx, input }) => {
      const apiKey = apiKeyManagement.getApiKey(input.keyId);

      if (!apiKey || apiKey.userId !== ctx.user.id) {
        return { remaining: 0 };
      }

      const remaining = apiKeyManagement.checkRateLimit(input.keyId);
      return { remaining };
    }),

  getApiKeyManagementStatistics: protectedProcedure.query(async () => {
    const stats = apiKeyManagement.getStatistics();
    return { stats };
  }),
});
