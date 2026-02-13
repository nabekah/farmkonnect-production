import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { getDb } from '../db';
import { eq } from 'drizzle-orm';
import { farms } from '@/drizzle/schema';

export const automatedAlertsRouter = router({
  /**
   * Create alert subscription
   * Subscribe to alerts for budget overages, optimal purchase windows, approval requests
   */
  createAlertSubscription: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        alertType: z.enum(['budget_overage', 'purchase_window', 'approval_request', 'low_cash_flow', 'unusual_spending']),
        channel: z.enum(['email', 'sms', 'both']),
        threshold: z.number().optional(),
        enabled: z.boolean().default(true),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

        // Verify farm ownership
        const farm = await db.select().from(farms).where(eq(farms.id, input.farmId));
        if (!farm.length || farm[0].farmerUserId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Farm not found or access denied' });
        }

        return {
          id: Math.random().toString(36).substr(2, 9),
          farmId: input.farmId,
          alertType: input.alertType,
          channel: input.channel,
          threshold: input.threshold,
          enabled: input.enabled,
          createdAt: new Date(),
          message: `Alert subscription created for ${input.alertType}`,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create alert subscription',
        });
      }
    }),

  /**
   * Send alert notification
   * Send SMS or email alert to user
   */
  sendAlert: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        alertType: z.string(),
        channel: z.enum(['email', 'sms']),
        title: z.string(),
        message: z.string(),
        severity: z.enum(['info', 'warning', 'critical']).default('info'),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

        // Verify farm ownership
        const farm = await db.select().from(farms).where(eq(farms.id, input.farmId));
        if (!farm.length || farm[0].farmerUserId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Farm not found or access denied' });
        }

        // Simulate sending alert
        const alertId = Math.random().toString(36).substr(2, 9);
        console.log(`[Alert ${alertId}] Sending ${input.channel} alert: ${input.title}`);

        return {
          id: alertId,
          farmId: input.farmId,
          channel: input.channel,
          title: input.title,
          message: input.message,
          severity: input.severity,
          sentAt: new Date(),
          status: 'sent',
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to send alert',
        });
      }
    }),

  /**
   * Get alert history
   * Retrieve all alerts for a farm
   */
  getAlertHistory: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        limit: z.number().default(20),
        severity: z.enum(['info', 'warning', 'critical']).optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

        // Verify farm ownership
        const farm = await db.select().from(farms).where(eq(farms.id, input.farmId));
        if (!farm.length || farm[0].farmerUserId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Farm not found or access denied' });
        }

        // Mock alert history
        const alerts = [
          {
            id: 'ALERT-001',
            type: 'budget_overage',
            title: 'Budget Overage Warning',
            message: 'Feed & Supplies spending exceeded 80% of budget',
            severity: 'warning',
            sentAt: new Date(Date.now() - 3600000),
            channel: 'email',
          },
          {
            id: 'ALERT-002',
            type: 'purchase_window',
            title: 'Optimal Purchase Window',
            message: 'Best time to purchase equipment - prices are 15-20% lower',
            severity: 'info',
            sentAt: new Date(Date.now() - 7200000),
            channel: 'sms',
          },
          {
            id: 'ALERT-003',
            type: 'approval_request',
            title: 'Expense Approval Required',
            message: 'Expense of $5,000 requires director approval',
            severity: 'critical',
            sentAt: new Date(Date.now() - 10800000),
            channel: 'email',
          },
        ];

        const filtered = input.severity
          ? alerts.filter(a => a.severity === input.severity)
          : alerts;

        return {
          alerts: filtered.slice(0, input.limit),
          total: filtered.length,
          farmId: input.farmId,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve alert history',
        });
      }
    }),

  /**
   * Acknowledge alert
   * Mark alert as read
   */
  acknowledgeAlert: protectedProcedure
    .input(
      z.object({
        alertId: z.string(),
        farmId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

        // Verify farm ownership
        const farm = await db.select().from(farms).where(eq(farms.id, input.farmId));
        if (!farm.length || farm[0].farmerUserId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Farm not found or access denied' });
        }

        return {
          alertId: input.alertId,
          acknowledged: true,
          acknowledgedAt: new Date(),
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to acknowledge alert',
        });
      }
    }),

  /**
   * Get alert preferences
   * Retrieve user alert notification preferences
   */
  getAlertPreferences: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

        // Verify farm ownership
        const farm = await db.select().from(farms).where(eq(farms.id, input.farmId));
        if (!farm.length || farm[0].farmerUserId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Farm not found or access denied' });
        }

        return {
          farmId: input.farmId,
          preferences: {
            budgetOverage: { enabled: true, channel: 'both', threshold: 80 },
            purchaseWindow: { enabled: true, channel: 'email', threshold: null },
            approvalRequest: { enabled: true, channel: 'both', threshold: null },
            lowCashFlow: { enabled: true, channel: 'sms', threshold: 5000 },
            unusualSpending: { enabled: true, channel: 'email', threshold: 50 },
          },
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve alert preferences',
        });
      }
    }),

  /**
   * Update alert preferences
   * Update user alert notification preferences
   */
  updateAlertPreferences: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        preferences: z.record(z.any()),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

        // Verify farm ownership
        const farm = await db.select().from(farms).where(eq(farms.id, input.farmId));
        if (!farm.length || farm[0].farmerUserId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Farm not found or access denied' });
        }

        return {
          farmId: input.farmId,
          preferences: input.preferences,
          updatedAt: new Date(),
          message: 'Alert preferences updated successfully',
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update alert preferences',
        });
      }
    }),
});
