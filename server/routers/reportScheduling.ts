import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { reportSchedules, reportHistory, farms } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { generatePDFReport, generateExcelReport, getReportFilename } from "../_core/reportGenerator";
import { NotificationService } from "../_core/notificationService";

export const reportSchedulingRouter = router({
  /**
   * Create a new report schedule
   */
  createSchedule: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        reportType: z.enum(["financial", "livestock", "complete"]),
        frequency: z.enum(["daily", "weekly", "monthly"]),
        recipients: z.array(z.string().email()),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      // Verify farm ownership
      const farm = await db
        .select()
        .from(farms)
        .where(and(eq(farms.id, input.farmId), eq(farms.farmerUserId, ctx.user.id)))
        .limit(1);

      if (!farm.length) {
        throw new Error("Farm not found or you don't have permission to access it");
      }

      // Calculate next run date
      const now = new Date();
      let nextRun = new Date(now);
      if (input.frequency === "daily") {
        nextRun.setDate(nextRun.getDate() + 1);
      } else if (input.frequency === "weekly") {
        nextRun.setDate(nextRun.getDate() + 7);
      } else if (input.frequency === "monthly") {
        nextRun.setMonth(nextRun.getMonth() + 1);
      }

      const [result] = await db.insert(reportSchedules).values({
        userId: ctx.user.id,
        farmId: input.farmId,
        reportType: input.reportType,
        frequency: input.frequency,
        recipients: JSON.stringify(input.recipients),
        isActive: true,
        nextRun,
      });

      return {
        success: true,
        scheduleId: result.insertId,
        message: "Report schedule created successfully",
      };
    }),

  /**
   * Get all schedules for user's farms
   */
  getSchedules: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    // Get user's farms
    const userFarms = await db
      .select({ id: farms.id })
      .from(farms)
      .where(eq(farms.farmerUserId, ctx.user.id));

    const farmIds = userFarms.map((f) => f.id);
    if (farmIds.length === 0) return [];

    // Get schedules for user's farms
    const schedules = await db
      .select()
      .from(reportSchedules)
      .where(eq(reportSchedules.farmId, farmIds[0]));

    return schedules.map((s) => ({
      ...s,
      recipients: JSON.parse(s.recipients as string),
    }));
  }),

  /**
   * Update schedule (toggle active/pause)
   */
  updateSchedule: protectedProcedure
    .input(
      z.object({
        scheduleId: z.number(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      // Verify ownership
      const schedule = await db
        .select()
        .from(reportSchedules)
        .where(eq(reportSchedules.id, input.scheduleId))
        .limit(1);

      if (!schedule.length) {
        throw new Error("Schedule not found");
      }

      const farm = await db
        .select()
        .from(farms)
        .where(and(eq(farms.id, schedule[0].farmId), eq(farms.farmerUserId, ctx.user.id)))
        .limit(1);

      if (!farm.length) {
        throw new Error("You don't have permission to modify this schedule");
      }

      await db
        .update(reportSchedules)
        .set({
          isActive: input.isActive !== undefined ? input.isActive : schedule[0].isActive,
          updatedAt: new Date(),
        })
        .where(eq(reportSchedules.id, input.scheduleId));

      return {
        success: true,
        message: "Schedule updated successfully",
      };
    }),

  /**
   * Delete a schedule
   */
  deleteSchedule: protectedProcedure
    .input(z.object({ scheduleId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      // Verify ownership
      const schedule = await db
        .select()
        .from(reportSchedules)
        .where(eq(reportSchedules.id, input.scheduleId))
        .limit(1);

      if (!schedule.length) {
        throw new Error("Schedule not found");
      }

      const farm = await db
        .select()
        .from(farms)
        .where(and(eq(farms.id, schedule[0].farmId), eq(farms.farmerUserId, ctx.user.id)))
        .limit(1);

      if (!farm.length) {
        throw new Error("You don't have permission to delete this schedule");
      }

      await db.delete(reportSchedules).where(eq(reportSchedules.id, input.scheduleId));

      return {
        success: true,
        message: "Schedule deleted successfully",
      };
    }),

  /**
   * Trigger manual report generation
   */
  triggerManualReport: protectedProcedure
    .input(z.object({ scheduleId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      // Get schedule
      const schedule = await db
        .select()
        .from(reportSchedules)
        .where(eq(reportSchedules.id, input.scheduleId))
        .limit(1);

      if (!schedule.length) {
        throw new Error("Schedule not found");
      }

      // Verify ownership
      const farm = await db
        .select()
        .from(farms)
        .where(and(eq(farms.id, schedule[0].farmId), eq(farms.farmerUserId, ctx.user.id)))
        .limit(1);

      if (!farm.length) {
        throw new Error("You don't have permission to trigger this report");
      }

      // Create report history entry
      const [historyResult] = await db.insert(reportHistory).values({
        scheduleId: input.scheduleId,
        farmId: schedule[0].farmId,
        reportType: schedule[0].reportType,
        status: "generating",
      });

      try {
        // Generate report
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
        const endDate = new Date();

        const reportBuffer = await generatePDFReport({
          farmId: schedule[0].farmId,
          reportType: schedule[0].reportType,
          startDate,
          endDate,
        });

        const recipients = JSON.parse(schedule[0].recipients as string);
        const filename = getReportFilename(schedule[0].reportType, "pdf");

        // Send email with attachment
        const notificationService = new NotificationService();
        await notificationService.sendEmailWithAttachment({
          to: recipients,
          subject: `FarmKonnect ${schedule[0].reportType} Report - ${new Date().toLocaleDateString()}`,
          html: `<p>Your scheduled ${schedule[0].reportType} report is attached.</p>`,
          attachmentBuffer: reportBuffer,
          attachmentFilename: filename,
        });

        // Update history
        await db
          .update(reportHistory)
          .set({
            status: "success",
            generatedAt: new Date(),
            sentAt: new Date(),
            recipientCount: recipients.length,
            fileSize: reportBuffer.length,
          })
          .where(eq(reportHistory.id, historyResult.insertId));

        // Update schedule's lastRun
        await db
          .update(reportSchedules)
          .set({ lastRun: new Date() })
          .where(eq(reportSchedules.id, input.scheduleId));

        return {
          success: true,
          message: "Report generated and sent successfully",
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";

        // Update history with error
        await db
          .update(reportHistory)
          .set({
            status: "failed",
            errorMessage,
          })
          .where(eq(reportHistory.id, historyResult.insertId));

        throw new Error(`Report generation failed: ${errorMessage}`);
      }
    }),

  /**
   * Get report history
   */
  getReportHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(20),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      // Get user's farms
      const userFarms = await db
        .select({ id: farms.id })
        .from(farms)
        .where(eq(farms.farmerUserId, ctx.user.id));

      const farmIds = userFarms.map((f) => f.id);
      if (farmIds.length === 0) return [];

      // Get history for user's farms
      const history = await db
        .select()
        .from(reportHistory)
        .where(eq(reportHistory.farmId, farmIds[0]))
        .orderBy(desc(reportHistory.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return history;
    }),

  /**
   * Get schedule statistics
   */
  getScheduleStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    // Get user's farms
    const userFarms = await db
      .select({ id: farms.id })
      .from(farms)
      .where(eq(farms.farmerUserId, ctx.user.id));

    const farmIds = userFarms.map((f) => f.id);
    if (farmIds.length === 0) {
      return {
        totalSchedules: 0,
        activeSchedules: 0,
        recentReports: 0,
        successRate: 0,
      };
    }

    // Get schedules
    const schedules = await db
      .select()
      .from(reportSchedules)
      .where(eq(reportSchedules.farmId, farmIds[0]));

    const activeSchedules = schedules.filter((s) => s.isActive).length;

    // Get recent reports (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentReports = await db
      .select()
      .from(reportHistory)
      .where(eq(reportHistory.farmId, farmIds[0]));

    const filteredReports = recentReports.filter(
      (r) => new Date(r.createdAt) >= thirtyDaysAgo
    );

    const successfulReports = filteredReports.filter((r) => r.status === "success").length;
    const successRate =
      filteredReports.length > 0 ? Math.round((successfulReports / filteredReports.length) * 100) : 0;

    return {
      totalSchedules: schedules.length,
      activeSchedules,
      recentReports: recentReports.length,
      successRate,
    };
  }),
});
