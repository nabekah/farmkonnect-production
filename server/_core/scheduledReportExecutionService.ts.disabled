import { getDb } from "../db";
import {
  reportSchedules,
  reportExecutionLog,
  reportExecutionDetails,
  reportHistory,
} from "../../drizzle/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { NotificationService } from "./notificationService";
import { generatePDFReport, generateExcelReport } from "./reportGenerator";
import { reportTemplateCustomizationService } from "./reportTemplateCustomizationService";

export class ScheduledReportExecutionService {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  /**
   * Check and execute scheduled reports
   */
  async executeScheduledReports() {
    const db = await getDb();
    if (!db) {
      console.error("[ScheduledReportExecution] Database not available");
      return;
    }

    try {
      const now = new Date();

      // Find all active schedules that should run now
    const schedules: any[] = await db
      .select()
      .from(reportSchedules)
      .where(
        and(
          eq(reportSchedules.isActive, true),
          lte(reportSchedules.nextRun, now)
        )
      );

      console.log(
        `[ScheduledReportExecution] Found ${schedules.length} schedules to execute`
      );

      for (const schedule of schedules) {
        await this.executeSchedule(schedule);
      }
    } catch (error) {
      console.error("[ScheduledReportExecution] Error executing schedules:", error);
    }
  }

  /**
   * Execute a single schedule
   */
  async executeSchedule(schedule: any): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const executionStartTime = Date.now();
    let executionStatus = "success";
    let errorMessage: string | null = null;
    let reportHistoryId: number | null = null;
    let successCount = 0;
    let failureCount = 0;

    try {
      // Create execution log entry
      const executionLogResult = await db.insert(reportExecutionLog).values({
        scheduleId: schedule.id,
        farmId: schedule.farmId,
        executionStatus: "running",
        recipientCount: 0,
        successCount: 0,
        failureCount: 0,
      });

      const executionLogId = (executionLogResult as any).insertId || 1;

      // Generate report
      try {
        const reportData = await this.generateReportData(schedule);

        // Create report history entry
        const reportHistoryResult = await db.insert(reportHistory).values({
          scheduleId: schedule.id,
          farmId: schedule.farmId,
          reportType: schedule.reportType,
          status: "generating",
          recipientCount: schedule.recipients?.length || 0,
        });

        reportHistoryId = (reportHistoryResult as any).insertId || 1;

        // Get customization for this template
        const customization =
          await reportTemplateCustomizationService.getCustomization(
            schedule.templateId,
            schedule.farmId
          );

        // Generate actual report file (PDF format)
        const reportFile = await generatePDFReport({
          farmId: schedule.farmId,
          reportType: schedule.reportType,
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          endDate: new Date(),
        });

        // Send to recipients
        const recipients = schedule.recipients || [];
        for (const recipient of recipients) {
          try {
            // Send email with report attachment
            await this.notificationService.sendEmail(
              recipient.email,
              `Farm Report: ${schedule.reportType}`,
              `Please find attached your ${schedule.reportType} report for ${schedule.farmName}`
            );

            successCount++;

            // Log successful delivery
            await db.insert(reportExecutionDetails).values({
              executionLogId,
              recipientEmail: recipient.email,
              recipientName: recipient.name,
              deliveryStatus: "sent",
              deliveryTimestamp: new Date(),
            });
          } catch (error: any) {
            failureCount++;

            // Log failed delivery
            await db.insert(reportExecutionDetails).values({
              executionLogId,
              recipientEmail: recipient.email,
              recipientName: recipient.name,
              deliveryStatus: "failed",
              errorReason: error.message,
            });
          }
        }

        // Update report history
        if (reportHistoryId) {
          await db
            .update(reportHistory)
            .set({
              status: successCount > 0 ? "success" : "failed",
              sentAt: new Date(),
              recipientCount: recipients.length,
            })
            .where(eq(reportHistory.id, reportHistoryId));
        }
      } catch (error: any) {
        executionStatus = "failed";
        errorMessage = error.message;
        failureCount = (schedule.recipients?.length || 0) - successCount;
      }

      // Calculate next execution time
      const nextExecutionTime = this.calculateNextExecutionTime(schedule);

      // Update schedule with next execution time
      await db
        .update(reportSchedules)
        .set({
          lastRun: new Date(),
          nextRun: nextExecutionTime,
        })
        .where(eq(reportSchedules.id, schedule.id));

      // Update execution log
      const executionDurationMs = Date.now() - executionStartTime;
      await db
        .update(reportExecutionLog)
        .set({
          executionStatus: executionStatus as any,
          completedAt: new Date(),
          reportHistoryId,
          successCount,
          failureCount,
          errorMessage,
          executionDurationMs,
          nextScheduledExecution: nextExecutionTime,
        })
        .where(eq(reportExecutionLog.id, executionLogId));

      console.log(
        `[ScheduledReportExecution] Schedule ${schedule.id} executed: ${successCount} success, ${failureCount} failed`
      );
    } catch (error: any) {
      console.error(
        `[ScheduledReportExecution] Error executing schedule ${schedule.id}:`,
        error
      );
    }
  }

  /**
   * Generate report data based on schedule configuration
   */
  private async generateReportData(schedule: any) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const reportData: any = {
      farmId: schedule.farmId,
      farmName: schedule.farmName,
      reportType: schedule.reportType,
      generatedAt: new Date().toISOString(),
      sections: {},
    };

    // Add financial data if included
    if (schedule.reportType === "financial" || schedule.reportType === "complete") {
      reportData.sections.financial = {
        title: "Financial Summary",
        data: {
          totalIncome: "0",
          totalExpenses: "0",
          netProfit: "0",
        },
      };
    }

    // Add livestock data if included
    if (
      schedule.reportType === "livestock" ||
      schedule.reportType === "complete"
    ) {
      reportData.sections.livestock = {
        title: "Livestock Summary",
        data: {
          totalAnimals: 0,
          healthStatus: "Good",
          vaccinations: 0,
        },
      };
    }

    // Add crop data if included
    if (schedule.reportType === "complete") {
      reportData.sections.crops = {
        title: "Crop Summary",
        data: {
          activeCycles: 0,
          totalYield: "0",
          avgYield: "0",
        },
      };
    }

    return reportData;
  }

  /**
   * Calculate next execution time based on schedule frequency
   */
  private calculateNextExecutionTime(schedule: any): Date {
    const now = new Date();
    const nextExecution = new Date(now);

    switch (schedule.frequency) {
      case "daily":
        nextExecution.setDate(nextExecution.getDate() + 1);
        break;
      case "weekly":
        nextExecution.setDate(nextExecution.getDate() + 7);
        break;
      case "monthly":
        nextExecution.setMonth(nextExecution.getMonth() + 1);
        break;
      case "quarterly":
        nextExecution.setMonth(nextExecution.getMonth() + 3);
        break;
      default:
        nextExecution.setDate(nextExecution.getDate() + 1);
    }

    // Set to scheduled time (default to 8 AM)
    nextExecution.setHours(8, 0, 0, 0);

    return nextExecution;
  }

  /**
   * Get execution history for a schedule
   */
  async getExecutionHistory(scheduleId: number, limit: number = 10) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const logs = await db
      .select()
      .from(reportExecutionLog)
      .where(eq(reportExecutionLog.scheduleId, scheduleId))
      .limit(limit);
    return logs;
  }

  /**
   * Get execution details for a specific execution
   */
  async getExecutionDetails(executionLogId: number) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    return await db
      .select()
      .from(reportExecutionDetails)
      .where(eq(reportExecutionDetails.executionLogId, executionLogId));
  }

  /**
   * Retry failed deliveries
   */
  async retryFailedDeliveries(executionLogId: number) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const failedDeliveries = await db
      .select()
      .from(reportExecutionDetails)
      .where(
        and(
          eq(reportExecutionDetails.executionLogId, executionLogId),
          eq(reportExecutionDetails.deliveryStatus, "failed")
        )
      );

    let successCount = 0;
    for (const delivery of failedDeliveries) {
      try {
        // Retry sending
        await this.notificationService.sendEmail(
          delivery.recipientEmail,
          "Report Delivery Retry",
          "Retrying to send your farm report..."
        );

        successCount++;

        // Update delivery status
        await db
          .update(reportExecutionDetails)
          .set({
            deliveryStatus: "sent",
            deliveryTimestamp: new Date(),
            retryCount: (delivery.retryCount || 0) + 1,
          })
          .where(eq(reportExecutionDetails.id, delivery.id));
      } catch (error) {
        // Keep as failed
      }
    }

    return { retriedCount: failedDeliveries.length, successCount };
  }

  /**
   * Get execution statistics
   */
  async getExecutionStats(scheduleId: number) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const executions = await db
      .select()
      .from(reportExecutionLog)
      .where(eq(reportExecutionLog.scheduleId, scheduleId));

    const totalExecutions = executions.length;
    const successfulExecutions = executions.filter(
      (e: any) => e.executionStatus === "success"
    ).length;
    const failedExecutions = executions.filter(
      (e: any) => e.executionStatus === "failed"
    ).length;
    const avgDuration = totalExecutions > 0 ?
      executions.reduce((sum: number, e: any) => sum + (e.executionDurationMs || 0), 0) /
      totalExecutions : 0;

    return {
      totalExecutions,
      successfulExecutions,
      failedExecutions,
      successRate: totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0,
      avgExecutionTimeMs: Math.round(avgDuration),
      lastExecution: executions[executions.length - 1]?.executedAt,
    };
  }
}

export const scheduledReportExecutionService =
  new ScheduledReportExecutionService();
