import cron from 'node-cron';
import { getDb } from '../db';
import { reportSchedules, reportHistory } from '../../drizzle/schema';
import { eq, and, lte } from 'drizzle-orm';
import { generatePDFReport, getReportFilename } from './reportGenerator';
import { NotificationService } from './notificationService';
import { reportAnalytics } from '../../drizzle/schema';

export interface ScheduledReportExecutionResult {
  scheduleId: number;
  success: boolean;
  message: string;
  executionTime?: number;
  error?: string;
}

export class ScheduledReportExecutor {
  private tasks: Map<number, any> = new Map();
  private isRunning = false;
  private failedSchedules: Map<number, number> = new Map(); // Track failed attempts
  private maxRetries = 3;
  private retryDelayMs = 5000; // 5 seconds between retries
  private isProcessing = false; // Prevent concurrent processing

  /**
   * Start the scheduled report executor
   */
  async start() {
    if (this.isRunning) {
      console.log('[ScheduledReportExecutor] Already running');
      return;
    }

    console.log('[ScheduledReportExecutor] Starting...');
    this.isRunning = true;

    // Run check every 5 minutes instead of every minute to reduce load
    const task = cron.schedule('*/5 * * * *', async () => {
      await this.checkAndExecutePendingReports();
    });
    this.tasks.set(0, task);

    console.log('[ScheduledReportExecutor] Started successfully');
  }

  /**
   * Stop the scheduled report executor
   */
  stop() {
    console.log('[ScheduledReportExecutor] Stopping...');
    this.tasks.forEach((task: any) => {
      if (task && typeof task.stop === 'function') {
        task.stop();
      }
    });
    this.tasks.clear();
    this.isRunning = false;
    this.failedSchedules.clear();
    console.log('[ScheduledReportExecutor] Stopped');
  }

  /**
   * Check and execute pending reports with rate limiting
   */
  private async checkAndExecutePendingReports() {
    // Prevent concurrent processing
    if (this.isProcessing) {
      console.log('[ScheduledReportExecutor] Already processing, skipping this cycle');
      return;
    }

    this.isProcessing = true;

    try {
      const db = await getDb();
      if (!db) {
        console.error('[ScheduledReportExecutor] Database connection failed');
        this.isProcessing = false;
        return;
      }

      const now = new Date();

      // Get all active schedules where nextRun is due
      const schedules = await db
        .select()
        .from(reportSchedules)
        .where(and(eq(reportSchedules.isActive, true), lte(reportSchedules.nextRun, now)))
        .limit(5); // Process max 5 reports per cycle to reduce load

      console.log(`[ScheduledReportExecutor] Found ${schedules.length} pending reports`);

      // Process reports sequentially with delays to avoid overwhelming the system
      for (const schedule of schedules) {
        const failureCount = this.failedSchedules.get(schedule.id) || 0;

        // Skip if exceeded max retries
        if (failureCount >= this.maxRetries) {
          console.warn(
            `[ScheduledReportExecutor] Schedule ${schedule.id} exceeded max retries (${failureCount}/${this.maxRetries})`
          );
          this.failedSchedules.delete(schedule.id);
          continue;
        }

        const result = await this.executeReport(schedule.id);

        if (!result.success) {
          // Increment failure count
          this.failedSchedules.set(schedule.id, failureCount + 1);
          console.warn(
            `[ScheduledReportExecutor] Schedule ${schedule.id} failed (${failureCount + 1}/${this.maxRetries})`
          );
        } else {
          // Clear failure count on success
          this.failedSchedules.delete(schedule.id);
        }

        // Add delay between reports to prevent overwhelming the system
        await this.delay(this.retryDelayMs);
      }
    } catch (error) {
      console.error('[ScheduledReportExecutor] Error checking pending reports:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Execute a single report with error handling
   */
  async executeReport(scheduleId: number): Promise<ScheduledReportExecutionResult> {
    const startTime = Date.now();

    try {
      const db = await getDb();
      if (!db) throw new Error('Database connection failed');

      // Get schedule
      const schedules = await db
        .select()
        .from(reportSchedules)
        .where(eq(reportSchedules.id, scheduleId))
        .limit(1);

      if (!schedules.length) {
        return {
          scheduleId,
          success: false,
          message: 'Schedule not found',
          error: 'Schedule not found',
        };
      }

      const schedule = schedules[0];

      // Create history entry with error handling
      let historyId: number;
      try {
        const result = await db.insert(reportHistory).values({
          scheduleId,
          farmId: schedule.farmId,
          reportType: schedule.reportType,
          status: 'generating',
        });
        historyId = result[0].insertId;
      } catch (error) {
        console.error('[ScheduledReportExecutor] Failed to create history entry:', error);
        return {
          scheduleId,
          success: false,
          message: 'Failed to create history entry',
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }

      try {
        // Generate report
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
        const endDate = new Date();

        const reportBuffer = await generatePDFReport({
          farmId: schedule.farmId,
          reportType: schedule.reportType,
          startDate,
          endDate,
        });

        const recipients = JSON.parse(schedule.recipients as string);
        const filename = getReportFilename(schedule.reportType, 'pdf');

        // Send email with attachment
        const notificationService = new NotificationService();
        await notificationService.sendEmailWithAttachment({
          to: recipients,
          subject: `FarmKonnect ${schedule.reportType} Report - ${new Date().toLocaleDateString()}`,
          html: `<p>Your scheduled ${schedule.reportType} report is attached.</p>`,
          attachmentBuffer: reportBuffer,
          attachmentFilename: filename,
        });

        const executionTime = Date.now() - startTime;

        // Update history with error handling
        try {
          await db
            .update(reportHistory)
            .set({
              status: 'success',
              generatedAt: new Date(),
              sentAt: new Date(),
              recipientCount: recipients.length,
              fileSize: reportBuffer.length,
            })
            .where(eq(reportHistory.id, historyId));
        } catch (error) {
          console.error('[ScheduledReportExecutor] Failed to update history:', error);
        }

        // Update schedule's nextRun
        const nextRun = this.calculateNextRun(schedule.frequency);
        try {
          await db
            .update(reportSchedules)
            .set({ lastRun: new Date(), nextRun })
            .where(eq(reportSchedules.id, scheduleId));
        } catch (error) {
          console.error('[ScheduledReportExecutor] Failed to update schedule:', error);
        }

        // Update analytics with error handling
        try {
          await this.updateAnalytics(scheduleId, true, executionTime, reportBuffer.length);
        } catch (error) {
          console.error('[ScheduledReportExecutor] Failed to update analytics:', error);
        }

        console.log(
          `[ScheduledReportExecutor] Report ${scheduleId} executed successfully in ${executionTime}ms`
        );

        return {
          scheduleId,
          success: true,
          message: 'Report generated and sent successfully',
          executionTime,
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const executionTime = Date.now() - startTime;

        // Update history with error handling
        try {
          await db
            .update(reportHistory)
            .set({
              status: 'failed',
              errorMessage,
            })
            .where(eq(reportHistory.id, historyId));
        } catch (updateError) {
          console.error('[ScheduledReportExecutor] Failed to update history with error:', updateError);
        }

        // Update analytics with error handling
        try {
          await this.updateAnalytics(scheduleId, false, executionTime, 0, errorMessage);
        } catch (analyticsError) {
          console.error('[ScheduledReportExecutor] Failed to update analytics with error:', analyticsError);
        }

        console.error(`[ScheduledReportExecutor] Report ${scheduleId} failed:`, errorMessage);

        return {
          scheduleId,
          success: false,
          message: 'Report generation failed',
          error: errorMessage,
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[ScheduledReportExecutor] Unexpected error executing report ${scheduleId}:`, errorMessage);

      return {
        scheduleId,
        success: false,
        message: 'Unexpected error',
        error: errorMessage,
      };
    }
  }

  /**
   * Calculate next run time based on frequency
   */
  private calculateNextRun(frequency: string): Date {
    const now = new Date();

    switch (frequency) {
      case 'daily':
        now.setDate(now.getDate() + 1);
        break;
      case 'weekly':
        now.setDate(now.getDate() + 7);
        break;
      case 'monthly':
        now.setMonth(now.getMonth() + 1);
        break;
      default:
        now.setDate(now.getDate() + 1);
    }

    return now;
  }

  /**
   * Update analytics with error handling
   */
  private async updateAnalytics(
    scheduleId: number,
    success: boolean,
    executionTime: number,
    fileSize: number,
    errorMessage?: string
  ) {
    try {
      const db = await getDb();
      if (!db) return;

      await db.insert(reportAnalytics).values({
        scheduleId,
        success,
        executionTime,
        fileSize,
        errorMessage,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('[ScheduledReportExecutor] Error updating analytics:', error);
    }
  }

  /**
   * Utility function to add delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const scheduledReportExecutor = new ScheduledReportExecutor();
