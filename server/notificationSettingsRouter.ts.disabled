import { z } from 'zod';
import { protectedProcedure, router } from './_core/trpc';
import { getDb } from './db';
import { notificationPreferences } from '../drizzle/schema';
import { eq } from 'drizzle-orm';
import { notificationService } from './_core/notificationService';

export const notificationSettingsRouter = router({
  // Get user's notification preferences
  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;

    const prefs = await db.select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, ctx.user.id))
      .limit(1);

    return prefs[0] || null;
  }),

  // Update notification preferences
  updatePreferences: protectedProcedure
    .input(z.object({
      emailEnabled: z.boolean().optional(),
      smsEnabled: z.boolean().optional(),
      pushEnabled: z.boolean().optional(),
      phoneNumber: z.string().optional(),
      criticalAlerts: z.boolean().optional(),
      warningAlerts: z.boolean().optional(),
      infoAlerts: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      // Check if preferences exist
      const existing = await db.select()
        .from(notificationPreferences)
        .where(eq(notificationPreferences.userId, ctx.user.id))
        .limit(1);

      if (existing.length > 0) {
        // Update existing
        await db.update(notificationPreferences)
          .set(input)
          .where(eq(notificationPreferences.userId, ctx.user.id));
      } else {
        // Create new
        await db.insert(notificationPreferences).values({
          userId: ctx.user.id,
          ...input,
        });
      }

      return { success: true };
    }),

  // Send test notification
  sendTestNotification: protectedProcedure
    .input(z.object({
      channel: z.enum(['email', 'sms', 'push']),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      // Get user preferences
      const prefs = await db.select()
        .from(notificationPreferences)
        .where(eq(notificationPreferences.userId, ctx.user.id))
        .limit(1);

      const userPrefs = prefs[0] || null;

      // Send test notification
      const result = await notificationService.sendNotification(
        {
          userId: ctx.user.id,
          title: 'Test Notification',
          message: 'This is a test notification from FarmKonnect. Your notification system is working correctly!',
          severity: 'info',
          channels: [input.channel],
        },
        {
          email: ctx.user.email || '',
          emailEnabled: userPrefs?.emailEnabled ?? true,
          phoneNumber: userPrefs?.phoneNumber || null,
          smsEnabled: userPrefs?.smsEnabled ?? false,
        }
      );

      return result;
    }),
});
