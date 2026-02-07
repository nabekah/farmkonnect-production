import { protectedProcedure } from '../_core/trpc';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { getDb } from '../db';
import { sql } from 'drizzle-orm';

/**
 * Activity Reminders Router
 * Handles scheduling and managing activity reminders
 */

export interface ActivityReminder {
  id: string;
  activityId: string;
  userId: number;
  farmId: number;
  reminderType: 'pending_approval' | 'pending_submission' | 'overdue' | 'custom';
  title: string;
  message: string;
  scheduledAt: Date;
  sentAt?: Date;
  status: 'pending' | 'sent' | 'failed';
  createdAt: Date;
}

class ReminderManager {
  private reminders: Map<string, ActivityReminder> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Schedule a reminder
   */
  scheduleReminder(reminder: ActivityReminder): void {
    const now = new Date();
    const scheduledTime = new Date(reminder.scheduledAt);
    const delayMs = scheduledTime.getTime() - now.getTime();

    if (delayMs > 0) {
      const timerId = reminder.id;
      const timer = setTimeout(() => {
        this.sendReminder(reminder);
        this.reminders.delete(reminder.id);
        this.timers.delete(timerId);
      }, delayMs);

      this.timers.set(timerId, timer);
      this.reminders.set(reminder.id, reminder);
    } else {
      // Send immediately if scheduled time is in the past
      this.sendReminder(reminder);
    }
  }

  /**
   * Send a reminder
   */
  private sendReminder(reminder: ActivityReminder): void {
    console.log(`[Reminder] Sending to user ${reminder.userId}: ${reminder.title}`);
    // TODO: Integrate with notification service (SMS, Email, Push)
    // For now, just log the reminder
  }

  /**
   * Cancel a reminder
   */
  cancelReminder(reminderId: string): boolean {
    const timer = this.timers.get(reminderId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(reminderId);
      this.reminders.delete(reminderId);
      return true;
    }
    return false;
  }

  /**
   * Get all pending reminders
   */
  getPendingReminders(): ActivityReminder[] {
    return Array.from(this.reminders.values());
  }

  /**
   * Clear all reminders
   */
  clearAll(): void {
    this.timers.forEach((timer) => clearTimeout(timer));
    this.timers.clear();
    this.reminders.clear();
  }
}

// Global reminder manager instance
const reminderManager = new ReminderManager();

export const activityRemindersRouter = {
  /**
   * Create a reminder for pending activity approval
   */
  createApprovalReminder: protectedProcedure
    .input(
      z.object({
        activityId: z.string(),
        userId: z.number(),
        farmId: z.number(),
        delayMinutes: z.number().default(24 * 60), // Default 24 hours
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const { activityId, userId, farmId, delayMinutes } = input;

        const scheduledAt = new Date(Date.now() + delayMinutes * 60 * 1000);

        const reminder: ActivityReminder = {
          id: `reminder-${Date.now()}-${Math.random()}`,
          activityId,
          userId,
          farmId,
          reminderType: 'pending_approval',
          title: 'Activity Pending Approval',
          message: `Activity ${activityId} is pending your approval. Please review and approve or reject.`,
          scheduledAt,
          status: 'pending',
          createdAt: new Date(),
        };

        reminderManager.scheduleReminder(reminder);

        return {
          success: true,
          reminderId: reminder.id,
          message: `Reminder scheduled for ${scheduledAt.toLocaleString()}`,
        };
      } catch (error) {
        console.error('Create approval reminder error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create approval reminder',
        });
      }
    }),

  /**
   * Create a reminder for pending activity submission
   */
  createSubmissionReminder: protectedProcedure
    .input(
      z.object({
        activityId: z.string(),
        userId: z.number(),
        farmId: z.number(),
        delayMinutes: z.number().default(48 * 60), // Default 48 hours
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const { activityId, userId, farmId, delayMinutes } = input;

        const scheduledAt = new Date(Date.now() + delayMinutes * 60 * 1000);

        const reminder: ActivityReminder = {
          id: `reminder-${Date.now()}-${Math.random()}`,
          activityId,
          userId,
          farmId,
          reminderType: 'pending_submission',
          title: 'Activity Pending Submission',
          message: `Activity ${activityId} is still in draft. Please submit for review.`,
          scheduledAt,
          status: 'pending',
          createdAt: new Date(),
        };

        reminderManager.scheduleReminder(reminder);

        return {
          success: true,
          reminderId: reminder.id,
          message: `Reminder scheduled for ${scheduledAt.toLocaleString()}`,
        };
      } catch (error) {
        console.error('Create submission reminder error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create submission reminder',
        });
      }
    }),

  /**
   * Create a custom reminder
   */
  createCustomReminder: protectedProcedure
    .input(
      z.object({
        activityId: z.string(),
        userId: z.number(),
        farmId: z.number(),
        title: z.string(),
        message: z.string(),
        scheduledAt: z.date(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const { activityId, userId, farmId, title, message, scheduledAt } = input;

        const reminder: ActivityReminder = {
          id: `reminder-${Date.now()}-${Math.random()}`,
          activityId,
          userId,
          farmId,
          reminderType: 'custom',
          title,
          message,
          scheduledAt,
          status: 'pending',
          createdAt: new Date(),
        };

        reminderManager.scheduleReminder(reminder);

        return {
          success: true,
          reminderId: reminder.id,
          message: `Custom reminder scheduled for ${scheduledAt.toLocaleString()}`,
        };
      } catch (error) {
        console.error('Create custom reminder error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create custom reminder',
        });
      }
    }),

  /**
   * Cancel a reminder
   */
  cancelReminder: protectedProcedure
    .input(z.object({ reminderId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const cancelled = reminderManager.cancelReminder(input.reminderId);

        if (!cancelled) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Reminder not found',
          });
        }

        return {
          success: true,
          message: 'Reminder cancelled successfully',
        };
      } catch (error) {
        console.error('Cancel reminder error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to cancel reminder',
        });
      }
    }),

  /**
   * Get all pending reminders for a user
   */
  getPendingReminders: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ ctx, input }) => {
      try {
        const reminders = reminderManager.getPendingReminders();
        return reminders.filter((r) => r.userId === input.userId);
      } catch (error) {
        console.error('Get pending reminders error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get pending reminders',
        });
      }
    }),

  /**
   * Get reminder statistics
   */
  getStats: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ ctx, input }) => {
      try {
        const reminders = reminderManager.getPendingReminders();
        const farmReminders = reminders.filter((r) => r.farmId === input.farmId);

        const stats = {
          total: farmReminders.length,
          byType: {} as Record<string, number>,
          pending: farmReminders.filter((r) => r.status === 'pending').length,
          sent: farmReminders.filter((r) => r.status === 'sent').length,
          failed: farmReminders.filter((r) => r.status === 'failed').length,
        };

        farmReminders.forEach((r) => {
          stats.byType[r.reminderType] = (stats.byType[r.reminderType] || 0) + 1;
        });

        return stats;
      } catch (error) {
        console.error('Get stats error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get reminder statistics',
        });
      }
    }),
};

// Export reminder manager for external use
export { reminderManager };
