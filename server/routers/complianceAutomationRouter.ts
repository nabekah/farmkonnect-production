import { router, protectedProcedure, adminProcedure } from '../_core/trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import {
  setComplianceThresholdConfig,
  getComplianceThresholdConfig,
  scheduleComplianceCheck,
  performComplianceCheck,
  manualComplianceCheck,
  getComplianceCheckHistory,
  getScheduledJobsStatus,
  cancelComplianceCheck,
  initializeScheduledChecks,
  getComplianceStatistics,
} from '../services/complianceAutomationService';

export const complianceAutomationRouter = router({
  /**
   * Set compliance threshold configuration for a farm (admin only)
   */
  setThresholdConfig: adminProcedure
    .input(
      z.object({
        farmId: z.number(),
        warningThreshold: z.number().min(0).max(100),
        criticalThreshold: z.number().min(0).max(100),
        escalationThreshold: z.number().min(0).max(100),
        checkFrequency: z.enum(['daily', 'weekly', 'hourly']),
        enabled: z.boolean(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const result = await setComplianceThresholdConfig({
          farmId: input.farmId,
          warningThreshold: input.warningThreshold,
          criticalThreshold: input.criticalThreshold,
          escalationThreshold: input.escalationThreshold,
          checkFrequency: input.checkFrequency,
          enabled: input.enabled,
        });

        return {
          success: result.success,
          message: result.message,
        };
      } catch (error) {
        console.error('Error setting threshold config:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to set threshold configuration',
        });
      }
    }),

  /**
   * Get compliance threshold configuration for a farm
   */
  getThresholdConfig: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ input }) => {
      try {
        const config = getComplianceThresholdConfig(input.farmId);

        if (!config) {
          return {
            farmId: input.farmId,
            warningThreshold: 80,
            criticalThreshold: 50,
            escalationThreshold: 30,
            checkFrequency: 'daily',
            enabled: false,
          };
        }

        return config;
      } catch (error) {
        console.error('Error getting threshold config:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get threshold configuration',
        });
      }
    }),

  /**
   * Schedule compliance check for a farm (admin only)
   */
  scheduleCheck: adminProcedure
    .input(
      z.object({
        farmId: z.number(),
        frequency: z.enum(['daily', 'weekly', 'hourly']),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const config = getComplianceThresholdConfig(input.farmId);

        if (!config) {
          throw new Error('Threshold configuration not found for this farm');
        }

        config.checkFrequency = input.frequency;

        const result = await scheduleComplianceCheck(config);

        return {
          success: result.success,
          message: result.message,
          jobId: result.jobId,
        };
      } catch (error) {
        console.error('Error scheduling check:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to schedule compliance check',
        });
      }
    }),

  /**
   * Perform manual compliance check for a farm
   */
  performManualCheck: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .mutation(async ({ input }) => {
      try {
        const result = await manualComplianceCheck(input.farmId);

        return {
          success: true,
          farmId: result.farmId,
          farmName: result.farmName,
          animalsChecked: result.animalsChecked,
          alertsSent: result.alertsSent,
          warningCount: result.warningCount,
          criticalCount: result.criticalCount,
          escalatedCount: result.escalatedCount,
          timestamp: result.timestamp,
        };
      } catch (error) {
        console.error('Error performing manual check:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to perform compliance check',
        });
      }
    }),

  /**
   * Get compliance check history for a farm
   */
  getCheckHistory: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        limit: z.number().default(50),
      })
    )
    .query(async ({ input }) => {
      try {
        const history = getComplianceCheckHistory(input.farmId, input.limit);

        return {
          farmId: input.farmId,
          history,
          total: history.length,
        };
      } catch (error) {
        console.error('Error getting check history:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get check history',
        });
      }
    }),

  /**
   * Get all scheduled jobs status (admin only)
   */
  getScheduledJobsStatus: adminProcedure.query(async () => {
    try {
      const jobs = getScheduledJobsStatus();

      return {
        total: jobs.length,
        running: jobs.filter((j) => j.status === 'running').length,
        stopped: jobs.filter((j) => j.status === 'stopped').length,
        jobs,
      };
    } catch (error) {
      console.error('Error getting scheduled jobs status:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get scheduled jobs status',
      });
    }
  }),

  /**
   * Cancel compliance check for a farm (admin only)
   */
  cancelCheck: adminProcedure
    .input(z.object({ farmId: z.number() }))
    .mutation(async ({ input }) => {
      try {
        const result = cancelComplianceCheck(input.farmId);

        return {
          success: result.success,
          message: result.message,
        };
      } catch (error) {
        console.error('Error cancelling check:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to cancel compliance check',
        });
      }
    }),

  /**
   * Initialize all scheduled compliance checks (admin only)
   */
  initializeSchedules: adminProcedure.mutation(async () => {
    try {
      const result = await initializeScheduledChecks();

      return {
        success: true,
        initialized: result.initialized,
        message: `Initialized ${result.initialized} compliance check schedules`,
      };
    } catch (error) {
      console.error('Error initializing schedules:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to initialize schedules',
      });
    }
  }),

  /**
   * Get compliance automation statistics (admin only)
   */
  getStatistics: adminProcedure.query(async () => {
    try {
      const stats = getComplianceStatistics();

      return {
        totalChecks: stats.totalChecks,
        totalAlertsSent: stats.totalAlertsSent,
        averageWarnings: Math.round(stats.averageWarnings * 100) / 100,
        averageCritical: Math.round(stats.averageCritical * 100) / 100,
        averageEscalated: Math.round(stats.averageEscalated * 100) / 100,
        lastCheckTime: stats.lastCheckTime,
      };
    } catch (error) {
      console.error('Error getting statistics:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get statistics',
      });
    }
  }),
});
