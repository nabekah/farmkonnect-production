import { z } from 'zod';
import { protectedProcedure, publicProcedure, router } from '../_core/trpc';
import {
  sendMultiChannelNotification,
  sendAppointmentReminder,
  sendComplianceAlert,
  sendPrescriptionExpiryAlert,
  sendHealthAlert,
  retryNotificationDelivery,
  logNotificationDelivery,
} from '../services/notificationService';

export const notificationServicesRouter = router({
  /**
   * Send multi-channel notification (SMS + Email)
   */
  sendNotification: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        recipientPhone: z.string().optional(),
        recipientEmail: z.string().email().optional(),
        type: z.enum(['appointment', 'prescription', 'health_alert', 'compliance', 'refill']),
        subject: z.string(),
        message: z.string(),
        animalName: z.string(),
        farmName: z.string(),
        urgency: z.enum(['low', 'medium', 'high']),
        metadata: z.record(z.any()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const result = await sendMultiChannelNotification({
          recipientPhone: input.recipientPhone,
          recipientEmail: input.recipientEmail,
          type: input.type,
          subject: input.subject,
          message: input.message,
          animalName: input.animalName,
          farmName: input.farmName,
          urgency: input.urgency,
          metadata: input.metadata,
        });

        // Log notification delivery
        await logNotificationDelivery(input.farmId, result, {
          recipientPhone: input.recipientPhone,
          recipientEmail: input.recipientEmail,
          type: input.type,
          subject: input.subject,
          message: input.message,
          animalName: input.animalName,
          farmName: input.farmName,
          urgency: input.urgency,
          metadata: input.metadata,
        });

        return {
          success: result.success,
          messageId: result.messageId,
          channel: result.channel,
          timestamp: result.timestamp,
          error: result.error,
        };
      } catch (error) {
        console.error('Failed to send notification:', error);
        throw new Error('Failed to send notification');
      }
    }),

  /**
   * Send appointment reminder
   */
  sendAppointmentReminder: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        recipientPhone: z.string().optional(),
        recipientEmail: z.string().email().optional(),
        animalName: z.string(),
        farmName: z.string(),
        appointmentDate: z.date(),
        veterinarianName: z.string(),
        clinicLocation: z.string(),
        urgency: z.enum(['low', 'medium', 'high']).default('medium'),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const result = await sendAppointmentReminder({
          recipientPhone: input.recipientPhone,
          recipientEmail: input.recipientEmail,
          type: 'appointment',
          subject: `Appointment Reminder: ${input.animalName}`,
          message: `Reminder for your veterinary appointment`,
          animalName: input.animalName,
          farmName: input.farmName,
          urgency: input.urgency,
          appointmentDate: input.appointmentDate,
          veterinarianName: input.veterinarianName,
          clinicLocation: input.clinicLocation,
        });

        return {
          success: result.success,
          messageId: result.messageId,
          channel: result.channel,
          error: result.error,
        };
      } catch (error) {
        console.error('Failed to send appointment reminder:', error);
        throw new Error('Failed to send appointment reminder');
      }
    }),

  /**
   * Send medication compliance alert
   */
  sendComplianceAlert: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        recipientPhone: z.string().optional(),
        recipientEmail: z.string().email().optional(),
        animalName: z.string(),
        farmName: z.string(),
        medicationName: z.string(),
        compliancePercentage: z.number().min(0).max(100),
        dosage: z.string(),
        frequency: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const result = await sendComplianceAlert({
          recipientPhone: input.recipientPhone,
          recipientEmail: input.recipientEmail,
          type: 'compliance',
          subject: `Medication Compliance Alert: ${input.animalName}`,
          message: `Compliance alert for ${input.medicationName}`,
          animalName: input.animalName,
          farmName: input.farmName,
          urgency: input.compliancePercentage < 50 ? 'high' : 'medium',
          medicationName: input.medicationName,
          compliancePercentage: input.compliancePercentage,
          dosage: input.dosage,
          frequency: input.frequency,
        });

        return {
          success: result.success,
          messageId: result.messageId,
          channel: result.channel,
          error: result.error,
        };
      } catch (error) {
        console.error('Failed to send compliance alert:', error);
        throw new Error('Failed to send compliance alert');
      }
    }),

  /**
   * Send prescription expiry alert
   */
  sendPrescriptionExpiryAlert: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        recipientPhone: z.string().optional(),
        recipientEmail: z.string().email().optional(),
        animalName: z.string(),
        farmName: z.string(),
        medicationName: z.string(),
        expiryDate: z.date(),
        daysUntilExpiry: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const result = await sendPrescriptionExpiryAlert({
          recipientPhone: input.recipientPhone,
          recipientEmail: input.recipientEmail,
          type: 'refill',
          subject: `Prescription Expiry Alert: ${input.animalName}`,
          message: `Your prescription for ${input.medicationName} will expire soon`,
          animalName: input.animalName,
          farmName: input.farmName,
          urgency: input.daysUntilExpiry <= 3 ? 'high' : 'medium',
          medicationName: input.medicationName,
          expiryDate: input.expiryDate,
          daysUntilExpiry: input.daysUntilExpiry,
        });

        return {
          success: result.success,
          messageId: result.messageId,
          channel: result.channel,
          error: result.error,
        };
      } catch (error) {
        console.error('Failed to send prescription expiry alert:', error);
        throw new Error('Failed to send prescription expiry alert');
      }
    }),

  /**
   * Send health alert
   */
  sendHealthAlert: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        recipientPhone: z.string().optional(),
        recipientEmail: z.string().email().optional(),
        animalName: z.string(),
        farmName: z.string(),
        healthIssue: z.string(),
        recommendedAction: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const result = await sendHealthAlert({
          recipientPhone: input.recipientPhone,
          recipientEmail: input.recipientEmail,
          type: 'health_alert',
          subject: `Health Alert: ${input.animalName}`,
          message: `Health issue detected: ${input.healthIssue}`,
          animalName: input.animalName,
          farmName: input.farmName,
          urgency: 'high',
          healthIssue: input.healthIssue,
          recommendedAction: input.recommendedAction,
        });

        return {
          success: result.success,
          messageId: result.messageId,
          channel: result.channel,
          error: result.error,
        };
      } catch (error) {
        console.error('Failed to send health alert:', error);
        throw new Error('Failed to send health alert');
      }
    }),

  /**
   * Retry notification delivery
   */
  retryNotification: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        recipientPhone: z.string().optional(),
        recipientEmail: z.string().email().optional(),
        type: z.enum(['appointment', 'prescription', 'health_alert', 'compliance', 'refill']),
        subject: z.string(),
        message: z.string(),
        animalName: z.string(),
        farmName: z.string(),
        urgency: z.enum(['low', 'medium', 'high']),
        maxRetries: z.number().default(3),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const result = await retryNotificationDelivery(
          {
            recipientPhone: input.recipientPhone,
            recipientEmail: input.recipientEmail,
            type: input.type,
            subject: input.subject,
            message: input.message,
            animalName: input.animalName,
            farmName: input.farmName,
            urgency: input.urgency,
          },
          input.maxRetries
        );

        return {
          success: result.success,
          messageId: result.messageId,
          channel: result.channel,
          error: result.error,
        };
      } catch (error) {
        console.error('Failed to retry notification:', error);
        throw new Error('Failed to retry notification');
      }
    }),

  /**
   * Get notification status
   */
  getNotificationStatus: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        messageId: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        // In a real implementation, this would query the database
        return {
          messageId: input.messageId,
          status: 'delivered',
          timestamp: new Date(),
          channel: 'both',
        };
      } catch (error) {
        console.error('Failed to get notification status:', error);
        throw new Error('Failed to get notification status');
      }
    }),

  /**
   * Get notification history
   */
  getNotificationHistory: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        limit: z.number().default(20),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        // In a real implementation, this would query the database
        return {
          notifications: [],
          total: 0,
          limit: input.limit,
          offset: input.offset,
        };
      } catch (error) {
        console.error('Failed to get notification history:', error);
        throw new Error('Failed to get notification history');
      }
    }),
});
