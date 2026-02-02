import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { reportAnalytics, reportHistory, reportDeliveryEvents, farms } from "../../drizzle/schema";
import { eq, and, desc, gte } from "drizzle-orm";

export const reportAnalyticsRouter = router({
  /**
   * Get analytics for a specific schedule
   */
  getScheduleAnalytics: protectedProcedure
    .input(z.object({ scheduleId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const analytics = await db
        .select()
        .from(reportAnalytics)
        .where(eq(reportAnalytics.scheduleId, input.scheduleId))
        .limit(1);

      if (!analytics.length) {
        return null;
      }

      const data = analytics[0];
      return {
        ...data,
        successRate: parseFloat(data.successRate || '0'),
        recipientEngagement: data.recipientEngagement ? JSON.parse(data.recipientEngagement) : null,
      };
    }),

  /**
   * Get analytics for all schedules in a farm
   */
  getFarmAnalytics: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ input, ctx }) => {
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

      const analytics = await db
        .select()
        .from(reportAnalytics)
        .where(eq(reportAnalytics.farmId, input.farmId))
        .orderBy(desc(reportAnalytics.updatedAt));

      return analytics.map((a) => ({
        ...a,
        successRate: parseFloat(a.successRate || '0'),
        recipientEngagement: a.recipientEngagement ? JSON.parse(a.recipientEngagement) : null,
      }));
    }),

  /**
   * Get delivery metrics for a report
   */
  getDeliveryMetrics: protectedProcedure
    .input(z.object({ reportHistoryId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const events = await db
        .select()
        .from(reportDeliveryEvents)
        .where(eq(reportDeliveryEvents.reportHistoryId, input.reportHistoryId));

      const metrics = {
        total: events.length,
        sent: events.filter((e) => e.status === "sent").length,
        delivered: events.filter((e) => e.status === "delivered").length,
        opened: events.filter((e) => e.status === "opened").length,
        failed: events.filter((e) => e.status === "failed").length,
        bounced: events.filter((e) => e.status === "bounced").length,
        events,
      };

      return metrics;
    }),

  /**
   * Get performance summary for a farm
   */
  getPerformanceSummary: protectedProcedure
    .input(z.object({ farmId: z.number(), days: z.number().default(30) }))
    .query(async ({ input, ctx }) => {
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

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);

      // Get all reports in the period
      const reports = await db
        .select()
        .from(reportHistory)
        .where(
          and(
            eq(reportHistory.farmId, input.farmId),
            gte(reportHistory.createdAt, startDate)
          )
        );

      const totalReports = reports.length;
      const successfulReports = reports.filter((r) => r.status === "success").length;
      const failedReports = reports.filter((r) => r.status === "failed").length;
      const successRate = totalReports > 0 ? (successfulReports / totalReports) * 100 : 0;

      const totalRecipients = reports.reduce((sum, r) => sum + (r.recipientCount || 0), 0);
      const totalFileSize = reports.reduce((sum, r) => sum + (r.fileSize || 0), 0);
      const averageFileSize = totalReports > 0 ? totalFileSize / totalReports : 0;

      // Get analytics data
      const analytics = await db
        .select()
        .from(reportAnalytics)
        .where(eq(reportAnalytics.farmId, input.farmId));

      const avgGenerationTime =
        analytics.length > 0
          ? Math.round(
              analytics.reduce((sum, a) => sum + (a.averageGenerationTime || 0), 0) /
                analytics.length
            )
          : 0;

      return {
        period: {
          days: input.days,
          startDate,
          endDate: new Date(),
        },
        reports: {
          total: totalReports,
          successful: successfulReports,
          failed: failedReports,
          successRate: Math.round(successRate * 100) / 100,
        },
        delivery: {
          totalRecipients,
          averageRecipientsPerReport: totalReports > 0 ? Math.round(totalRecipients / totalReports) : 0,
        },
        performance: {
          averageFileSize: Math.round(averageFileSize),
          averageGenerationTime: avgGenerationTime,
          totalFileSize,
        },
      };
    }),

  /**
   * Get report type distribution
   */
  getReportTypeDistribution: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ input, ctx }) => {
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

      const analytics = await db
        .select()
        .from(reportAnalytics)
        .where(eq(reportAnalytics.farmId, input.farmId));

      const distribution = {
        financial: analytics.filter((a) => a.reportType === "financial"),
        livestock: analytics.filter((a) => a.reportType === "livestock"),
        complete: analytics.filter((a) => a.reportType === "complete"),
      };

      return {
        financial: {
          count: distribution.financial.length,
          totalGenerated: distribution.financial.reduce((sum, a) => sum + a.totalGenerated, 0),
          totalSent: distribution.financial.reduce((sum, a) => sum + a.totalSent, 0),
          averageSuccessRate:
            distribution.financial.length > 0
              ? Math.round(
                  distribution.financial.reduce((sum, a) => sum + parseFloat(a.successRate || '0'), 0) /
                    distribution.financial.length
                )
              : 0,
        },
        livestock: {
          count: distribution.livestock.length,
          totalGenerated: distribution.livestock.reduce((sum, a) => sum + a.totalGenerated, 0),
          totalSent: distribution.livestock.reduce((sum, a) => sum + a.totalSent, 0),
          averageSuccessRate:
            distribution.livestock.length > 0
              ? Math.round(
                  distribution.livestock.reduce((sum, a) => sum + parseFloat(a.successRate || '0'), 0) /
                    distribution.livestock.length
                )
              : 0,
        },
        complete: {
          count: distribution.complete.length,
          totalGenerated: distribution.complete.reduce((sum, a) => sum + a.totalGenerated, 0),
          totalSent: distribution.complete.reduce((sum, a) => sum + a.totalSent, 0),
          averageSuccessRate:
            distribution.complete.length > 0
              ? Math.round(
                  distribution.complete.reduce((sum, a) => sum + parseFloat(a.successRate || '0'), 0) /
                    distribution.complete.length
                )
              : 0,
        },
      };
    }),

  /**
   * Get recent failures
   */
  getRecentFailures: protectedProcedure
    .input(z.object({ farmId: z.number(), limit: z.number().default(10) }))
    .query(async ({ input, ctx }) => {
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

      const failures = await db
        .select()
        .from(reportHistory)
        .where(
          and(
            eq(reportHistory.farmId, input.farmId),
            eq(reportHistory.status, "failed")
          )
        )
        .orderBy(desc(reportHistory.createdAt))
        .limit(input.limit);

      return failures;
    }),

  /**
   * Get trend data for a metric over time
   */
  getTrendData: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        metric: z.enum(["successRate", "generationTime", "fileSize"]),
        days: z.number().default(30),
      })
    )
    .query(async ({ input, ctx }) => {
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

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);

      const reports = await db
        .select()
        .from(reportHistory)
        .where(
          and(
            eq(reportHistory.farmId, input.farmId),
            gte(reportHistory.createdAt, startDate)
          )
        )
        .orderBy(desc(reportHistory.createdAt));

      // Group by day and calculate metric
      const dailyData: Record<string, any> = {};

      for (const report of reports) {
        const date = new Date(report.createdAt).toISOString().split("T")[0];

        if (!dailyData[date]) {
          dailyData[date] = {
            date,
            count: 0,
            successful: 0,
            failed: 0,
            totalGenerationTime: 0,
            totalFileSize: 0,
          };
        }

        dailyData[date].count += 1;
        if (report.status === "success") {
          dailyData[date].successful += 1;
        } else {
          dailyData[date].failed += 1;
        }
      }

      const trendData = Object.values(dailyData).map((day: any) => {
        let value = 0;

        if (input.metric === "successRate") {
          value = day.count > 0 ? (day.successful / day.count) * 100 : 0;
        } else if (input.metric === "generationTime") {
          value = day.count > 0 ? day.totalGenerationTime / day.count : 0;
        } else if (input.metric === "fileSize") {
          value = day.count > 0 ? day.totalFileSize / day.count : 0;
        }

        return {
          date: day.date,
          value: Math.round(value * 100) / 100,
          count: day.count,
        };
      });

      return trendData;
    }),
});
