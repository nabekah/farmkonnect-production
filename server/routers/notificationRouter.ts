import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import {
  sendComplianceAlert,
  sendDoseReminder,
  sendAppointmentReminder,
  checkAndSendComplianceAlerts,
  sendBulkComplianceNotifications,
} from '../services/notificationService';

export const notificationRouter = router({
  /**
   * Send compliance alert manually
   */
  sendComplianceAlert: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        animalId: z.number(),
        animalName: z.string(),
        compliancePercentage: z.number(),
        missedDoses: z.number(),
        phoneNumber: z.string().optional(),
        email: z.string().email().optional(),
        farmName: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const result = await sendComplianceAlert(input);
        return {
          success: result.success,
          method: result.method,
          message: result.success
            ? `Alert sent via ${result.method}`
            : `Failed to send alert: ${result.error}`,
        };
      } catch (error) {
        console.error('Error sending compliance alert:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to send compliance alert',
        });
      }
    }),

  /**
   * Send dose reminder
   */
  sendDoseReminder: protectedProcedure
    .input(
      z.object({
        animalId: z.number(),
        medicationName: z.string(),
        scheduledTime: z.string(),
        phoneNumber: z.string().optional(),
        email: z.string().email().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const result = await sendDoseReminder(
          input.animalId,
          input.medicationName,
          input.scheduledTime,
          input.phoneNumber,
          input.email
        );
        return {
          success: result.success,
          method: result.method,
          message: result.success
            ? `Reminder sent via ${result.method}`
            : `Failed to send reminder: ${result.error}`,
        };
      } catch (error) {
        console.error('Error sending dose reminder:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to send dose reminder',
        });
      }
    }),

  /**
   * Send appointment reminder
   */
  sendAppointmentReminder: protectedProcedure
    .input(
      z.object({
        appointmentDate: z.string(),
        appointmentTime: z.string(),
        vetName: z.string(),
        animalName: z.string(),
        phoneNumber: z.string().optional(),
        email: z.string().email().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const result = await sendAppointmentReminder(
          input.appointmentDate,
          input.appointmentTime,
          input.vetName,
          input.animalName,
          input.phoneNumber,
          input.email
        );
        return {
          success: result.success,
          method: result.method,
          message: result.success
            ? `Reminder sent via ${result.method}`
            : `Failed to send reminder: ${result.error}`,
        };
      } catch (error) {
        console.error('Error sending appointment reminder:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to send appointment reminder',
        });
      }
    }),

  /**
   * Check compliance and send alerts for a farm
   */
  checkAndSendComplianceAlerts: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        complianceThreshold: z.number().min(0).max(100).default(80),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const alerts = await checkAndSendComplianceAlerts(
          input.farmId,
          input.complianceThreshold
        );
        return {
          success: true,
          alertsSent: alerts.length,
          alerts,
          message: `${alerts.length} compliance alerts sent`,
        };
      } catch (error) {
        console.error('Error checking and sending compliance alerts:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to check and send compliance alerts',
        });
      }
    }),

  /**
   * Send bulk compliance notifications to all farms
   */
  sendBulkComplianceNotifications: protectedProcedure
    .input(
      z.object({
        complianceThreshold: z.number().min(0).max(100).default(80),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const result = await sendBulkComplianceNotifications(input.complianceThreshold);
        return {
          success: true,
          farmsNotified: result.farmsNotified,
          alertsSent: result.alertsSent,
          message: `Notified ${result.farmsNotified} farms with ${result.alertsSent} alerts`,
        };
      } catch (error) {
        console.error('Error sending bulk notifications:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to send bulk notifications',
        });
      }
    }),

  /**
   * Get notification preferences for a farm
   */
  getPreferences: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ input }) => {
      try {
        // In production, fetch from database
        return {
          farmId: input.farmId,
          complianceAlerts: {
            enabled: true,
            threshold: 80,
            methods: ['sms', 'email'],
          },
          doseReminders: {
            enabled: true,
            reminderTime: '08:00',
            methods: ['sms'],
          },
          appointmentReminders: {
            enabled: true,
            reminderHoursBefore: 24,
            methods: ['email'],
          },
          contactInfo: {
            phoneNumber: '+233XXXXXXXXX',
            email: 'farmer@example.com',
          },
        };
      } catch (error) {
        console.error('Error fetching notification preferences:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch notification preferences',
        });
      }
    }),

  /**
   * Update notification preferences
   */
  updatePreferences: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        complianceThreshold: z.number().min(0).max(100).optional(),
        enableComplianceAlerts: z.boolean().optional(),
        enableDoseReminders: z.boolean().optional(),
        enableAppointmentReminders: z.boolean().optional(),
        phoneNumber: z.string().optional(),
        email: z.string().email().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // In production, update database
        return {
          success: true,
          message: 'Notification preferences updated successfully',
          preferences: {
            farmId: input.farmId,
            complianceThreshold: input.complianceThreshold || 80,
            enableComplianceAlerts: input.enableComplianceAlerts !== false,
            enableDoseReminders: input.enableDoseReminders !== false,
            enableAppointmentReminders: input.enableAppointmentReminders !== false,
            phoneNumber: input.phoneNumber,
            email: input.email,
          },
        };
      } catch (error) {
        console.error('Error updating notification preferences:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update notification preferences',
        });
      }
    }),

  /**
   * Get notification history
   */
  getHistory: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      try {
        // In production, fetch from database
        const mockHistory = [
          {
            id: 1,
            farmId: input.farmId,
            type: 'compliance_alert',
            animalId: 1,
            animalName: 'Animal 1',
            message: 'Low medication compliance detected',
            method: 'sms',
            status: 'sent',
            sentAt: new Date(Date.now() - 3600000),
          },
          {
            id: 2,
            farmId: input.farmId,
            type: 'dose_reminder',
            animalId: 2,
            animalName: 'Animal 2',
            message: 'Time to administer Amoxicillin',
            method: 'email',
            status: 'sent',
            sentAt: new Date(Date.now() - 7200000),
          },
        ];

        return {
          data: mockHistory.slice(input.offset, input.offset + input.limit),
          total: mockHistory.length,
          limit: input.limit,
          offset: input.offset,
          hasMore: input.offset + input.limit < mockHistory.length,
        };
      } catch (error) {
        console.error('Error fetching notification history:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch notification history',
        });
      }
    }),
});
