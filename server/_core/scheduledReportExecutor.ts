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

    // Run check every minute to see if any reports need execution
    const task = cron.schedule('* * * * *', async () => {
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
    console.log('[ScheduledReportExecutor] Stopped');
  }

  /**
   * Check and execute pending reports
   */
  private async checkAndExecutePendingReports() {
    try {
      const db = await getDb();
      if (!db) {
        console.error('[ScheduledReportExecutor] Database connection failed');
        return;
      }

      const now = new Date();

      // Get all active schedules where nextRun is due
      const schedules = await db
        .select()
        .from(reportSchedules)
        .where(and(eq(reportSchedules.isActive, true), lte(reportSchedules.nextRun, now)));

      for (const schedule of schedules) {
        await this.executeReport(schedule.id);
      }
    } catch (error) {
      console.error('[ScheduledReportExecutor] Error checking pending reports:', error);
    }
  }

  /**
   * Execute a single report
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

      // Create history entry
      const [historyResult] = await db.insert(reportHistory).values({
        scheduleId,
        farmId: schedule.farmId,
        reportType: schedule.reportType,
        status: 'generating',
      });

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

        // Update history
        await db
          .update(reportHistory)
          .set({
            status: 'success',
            generatedAt: new Date(),
            sentAt: new Date(),
            recipientCount: recipients.length,
            fileSize: reportBuffer.length,
          })
          .where(eq(reportHistory.id, historyResult.insertId));

        // Update schedule's nextRun
        const nextRun = this.calculateNextRun(schedule.frequency);
        await db
          .update(reportSchedules)
          .set({ lastRun: new Date(), nextRun })
          .where(eq(reportSchedules.id, scheduleId));

        // Update analytics
        await this.updateAnalytics(scheduleId, true, executionTime, reportBuffer.length);

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

        // Update history with error
        await db
          .update(reportHistory)
          .set({
            status: 'failed',
            errorMessage,
          })
          .where(eq(reportHistory.id, historyResult.insertId));

        // Update analytics
        await this.updateAnalytics(scheduleId, false, executionTime, 0, errorMessage);

        console.error(`[ScheduledReportExecutor] Report ${scheduleId} failed:`, errorMessage);

        return {
          scheduleId,
          success: false,
          message: 'Report generation failed',
          error: errorMessage,
          executionTime,
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[ScheduledReportExecutor] Unexpected error executing report ${scheduleId}:`, errorMessage);

      return {
        scheduleId,
        success: false,
        message: 'Unexpected error during report execution',
        error: errorMessage,
        executionTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Calculate next run time based on frequency
   */
  private calculateNextRun(frequency: 'daily' | 'weekly' | 'monthly'): Date {
    const nextRun = new Date();

    if (frequency === 'daily') {
      nextRun.setDate(nextRun.getDate() + 1);
    } else if (frequency === 'weekly') {
      nextRun.setDate(nextRun.getDate() + 7);
    } else if (frequency === 'monthly') {
      nextRun.setMonth(nextRun.getMonth() + 1);
    }

    return nextRun;
  }

  /**
   * Update analytics for a report execution
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

      const schedule = await db
        .select()
        .from(reportSchedules)
        .where(eq(reportSchedules.id, scheduleId))
        .limit(1);

      if (!schedule.length) return;

      const farmId = schedule[0].farmId;
      const reportType = schedule[0].reportType;

      // Get or create analytics record
      const existingAnalytics = await db
        .select()
        .from(reportAnalytics)
        .where(and(eq(reportAnalytics.scheduleId, scheduleId), eq(reportAnalytics.farmId, farmId)))
        .limit(1);

      if (existingAnalytics.length > 0) {
        const analytics = existingAnalytics[0];
        const totalGenerated = (analytics.totalGenerated || 0) + 1;
        const totalSent = success ? (analytics.totalSent || 0) + 1 : analytics.totalSent || 0;
        const totalFailed = !success ? (analytics.totalFailed || 0) + 1 : analytics.totalFailed || 0;

        const successRate = totalGenerated > 0 ? (totalSent / totalGenerated) * 100 : 0;
        const avgGenerationTime =
          totalGenerated > 0
            ? Math.round(
                ((analytics.averageGenerationTime || 0) * (totalGenerated - 1) + executionTime) /
                  totalGenerated
              )
            : executionTime;

        const avgFileSize =
          totalSent > 0
            ? Math.round(
                ((analytics.averageFileSize || 0) * (totalSent - 1) + fileSize) / totalSent
              )
            : 0;

        await db
          .update(reportAnalytics)
          .set({
            totalGenerated,
            totalSent,
            totalFailed,
            successRate: successRate.toString(),
            averageGenerationTime: avgGenerationTime,
            averageFileSize: avgFileSize,
            lastGeneratedAt: new Date(),
            lastFailedAt: !success ? new Date() : analytics.lastFailedAt,
            lastFailureReason: errorMessage || null,
            updatedAt: new Date(),
          })
          .where(eq(reportAnalytics.id, analytics.id));
      } else {
        // Create new analytics record
        await db.insert(reportAnalytics).values({
          scheduleId,
          farmId,
          reportType,
          totalGenerated: 1,
          totalSent: success ? 1 : 0,
          totalFailed: !success ? 1 : 0,
          successRate: success ? '100.00' : '0.00',
          averageGenerationTime: executionTime,
          averageFileSize: fileSize,
          lastGeneratedAt: new Date(),
          lastFailedAt: !success ? new Date() : null,
          lastFailureReason: errorMessage || null,
        });
      }
    } catch (error) {
      console.error('[ScheduledReportExecutor] Error updating analytics:', error);
    }
  }

  /**
   * Get execution status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      activeTaskCount: this.tasks.size,
    };
  }
}

export const scheduledReportExecutor = new ScheduledReportExecutor();
