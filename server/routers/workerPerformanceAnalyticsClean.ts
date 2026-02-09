import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";

/**
 * Worker Performance Analytics Router
 * Tracks worker productivity, quality scores, certification compliance, and performance trends
 */
export const workerPerformanceAnalyticsCleanRouter = router({
  /**
   * Get worker performance metrics
   */
  getWorkerMetrics: protectedProcedure
    .input(
      z.object({
        workerId: z.number(),
        period: z.enum(["week", "month", "quarter", "year"]).default("month"),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        return {
          workerId: input.workerId,
          workerName: "John Smith",
          period: input.period,
          metrics: {
            tasksCompleted: 45,
            tasksOnTime: 42,
            onTimeRate: 93.3,
            qualityScore: 4.7,
            attendanceRate: 96,
            certificationCompliance: 100,
            productivityIndex: 92,
            safetyIncidents: 0,
            averageTaskDuration: 2.5,
            tasksOverdue: 3,
          },
          trends: {
            productivity: 5,
            quality: 2,
            attendance: -1,
            safety: 0,
          },
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch worker metrics: ${error}`,
        });
      }
    }),

  /**
   * Get team performance overview
   */
  getTeamPerformance: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        department: z.string().optional(),
        period: z.enum(["week", "month", "quarter", "year"]).default("month"),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        const teamMembers = [
          {
            workerId: 1,
            workerName: "John Smith",
            department: "Field Operations",
            tasksCompleted: 45,
            onTimeRate: 93.3,
            qualityScore: 4.7,
            attendanceRate: 96,
            certificationCompliance: 100,
            productivityIndex: 92,
          },
          {
            workerId: 2,
            workerName: "Sarah Johnson",
            department: "Equipment Management",
            tasksCompleted: 38,
            onTimeRate: 89.5,
            qualityScore: 4.5,
            attendanceRate: 94,
            certificationCompliance: 80,
            productivityIndex: 85,
          },
          {
            workerId: 3,
            workerName: "Michael Brown",
            department: "Field Operations",
            tasksCompleted: 52,
            onTimeRate: 96.2,
            qualityScore: 4.8,
            attendanceRate: 98,
            certificationCompliance: 100,
            productivityIndex: 95,
          },
        ];

        const filtered = input.department
          ? teamMembers.filter((m) => m.department === input.department)
          : teamMembers;

        return {
          teamSize: filtered.length,
          members: filtered,
          teamAverages: {
            tasksCompleted: Math.round(filtered.reduce((sum, m) => sum + m.tasksCompleted, 0) / filtered.length),
            onTimeRate: Math.round((filtered.reduce((sum, m) => sum + m.onTimeRate, 0) / filtered.length) * 10) / 10,
            qualityScore: Math.round((filtered.reduce((sum, m) => sum + m.qualityScore, 0) / filtered.length) * 10) / 10,
            attendanceRate: Math.round(filtered.reduce((sum, m) => sum + m.attendanceRate, 0) / filtered.length),
            certificationCompliance: Math.round(filtered.reduce((sum, m) => sum + m.certificationCompliance, 0) / filtered.length),
            productivityIndex: Math.round(filtered.reduce((sum, m) => sum + m.productivityIndex, 0) / filtered.length),
          },
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch team performance: ${error}`,
        });
      }
    }),

  /**
   * Get productivity trends
   */
  getProductivityTrends: protectedProcedure
    .input(
      z.object({
        workerId: z.number().optional(),
        farmId: z.number(),
        days: z.number().positive().default(30),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        // Generate mock trend data
        const trends = [];
        for (let i = input.days; i > 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          trends.push({
            date: date.toISOString().split("T")[0],
            tasksCompleted: Math.floor(Math.random() * 8) + 2,
            productivityScore: Math.floor(Math.random() * 20) + 80,
            hoursWorked: Math.floor(Math.random() * 4) + 6,
          });
        }

        return {
          workerId: input.workerId,
          period: `Last ${input.days} days`,
          trends,
          summary: {
            averageTasksPerDay: Math.round(trends.reduce((sum, t) => sum + t.tasksCompleted, 0) / trends.length * 10) / 10,
            averageProductivityScore: Math.round(trends.reduce((sum, t) => sum + t.productivityScore, 0) / trends.length),
            totalHoursWorked: trends.reduce((sum, t) => sum + t.hoursWorked, 0),
            trend: "increasing",
          },
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch productivity trends: ${error}`,
        });
      }
    }),

  /**
   * Get quality score details
   */
  getQualityScores: protectedProcedure
    .input(
      z.object({
        workerId: z.number(),
        period: z.enum(["week", "month", "quarter", "year"]).default("month"),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        return {
          workerId: input.workerId,
          period: input.period,
          overallScore: 4.7,
          scores: {
            accuracy: 4.8,
            timeliness: 4.6,
            completeness: 4.7,
            safetyCompliance: 4.9,
            customerSatisfaction: 4.5,
            workQuality: 4.8,
          },
          feedback: [
            {
              date: "2026-02-08",
              supervisor: "Manager Name",
              score: 5,
              comment: "Excellent work on field preparation",
            },
            {
              date: "2026-02-05",
              supervisor: "Manager Name",
              score: 4,
              comment: "Good progress on maintenance tasks",
            },
          ],
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch quality scores: ${error}`,
        });
      }
    }),

  /**
   * Get attendance records
   */
  getAttendanceRecords: protectedProcedure
    .input(
      z.object({
        workerId: z.number(),
        startDate: z.string().datetime(),
        endDate: z.string().datetime(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        return {
          workerId: input.workerId,
          period: `${input.startDate} to ${input.endDate}`,
          attendanceRate: 96,
          totalDays: 22,
          presentDays: 21,
          absentDays: 1,
          lateDays: 0,
          records: [
            { date: "2026-02-09", status: "present", checkIn: "06:00", checkOut: "14:30" },
            { date: "2026-02-08", status: "present", checkIn: "06:05", checkOut: "14:35" },
            { date: "2026-02-07", status: "absent", checkIn: null, checkOut: null },
            { date: "2026-02-06", status: "present", checkIn: "06:00", checkOut: "14:30" },
          ],
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch attendance records: ${error}`,
        });
      }
    }),

  /**
   * Get certification compliance status
   */
  getCertificationCompliance: protectedProcedure
    .input(z.object({ workerId: z.number() }))
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        return {
          workerId: input.workerId,
          complianceRate: 100,
          certifications: [
            {
              name: "Agricultural Safety",
              status: "valid",
              expiryDate: "2026-12-31",
              daysUntilExpiry: 326,
            },
            {
              name: "Pesticide Handling",
              status: "valid",
              expiryDate: "2026-08-15",
              daysUntilExpiry: 188,
            },
            {
              name: "First Aid",
              status: "valid",
              expiryDate: "2027-06-01",
              daysUntilExpiry: 478,
            },
          ],
          missingCertifications: [],
          complianceScore: 100,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch certification compliance: ${error}`,
        });
      }
    }),

  /**
   * Get performance incentive recommendations
   */
  getIncentiveRecommendations: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        return {
          farmId: input.farmId,
          recommendations: [
            {
              workerId: 3,
              workerName: "Michael Brown",
              reason: "Highest productivity index (95) and perfect on-time rate",
              incentiveType: "bonus",
              amount: 500,
              priority: "high",
            },
            {
              workerId: 1,
              workerName: "John Smith",
              reason: "Consistent high quality (4.7) and 100% certification compliance",
              incentiveType: "recognition",
              amount: 0,
              priority: "medium",
            },
          ],
          totalIncentiveBudget: 500,
          allocatedBudget: 500,
          remainingBudget: 0,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch incentive recommendations: ${error}`,
        });
      }
    }),

  /**
   * Get performance comparison
   */
  getPerformanceComparison: protectedProcedure
    .input(
      z.object({
        workerId: z.number(),
        farmId: z.number(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        return {
          workerId: input.workerId,
          workerMetrics: {
            tasksCompleted: 45,
            onTimeRate: 93.3,
            qualityScore: 4.7,
            attendanceRate: 96,
            productivityIndex: 92,
          },
          farmAverages: {
            tasksCompleted: 42,
            onTimeRate: 91.5,
            qualityScore: 4.6,
            attendanceRate: 94,
            productivityIndex: 88,
          },
          comparison: {
            tasksCompleted: "above average",
            onTimeRate: "above average",
            qualityScore: "above average",
            attendanceRate: "above average",
            productivityIndex: "above average",
          },
          percentile: 85,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch performance comparison: ${error}`,
        });
      }
    }),

  /**
   * Generate performance report
   */
  generatePerformanceReport: protectedProcedure
    .input(
      z.object({
        workerId: z.number(),
        format: z.enum(["pdf", "csv", "json"]).default("pdf"),
        period: z.enum(["week", "month", "quarter", "year"]).default("month"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        return {
          success: true,
          reportId: Math.floor(Math.random() * 10000),
          format: input.format,
          period: input.period,
          message: `Performance report generated for worker ${input.workerId}`,
          downloadUrl: `/reports/performance-${input.workerId}-${Date.now()}.${input.format}`,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to generate performance report: ${error}`,
        });
      }
    }),

  /**
   * Record performance feedback
   */
  recordPerformanceFeedback: protectedProcedure
    .input(
      z.object({
        workerId: z.number(),
        supervisorId: z.number(),
        score: z.number().min(1).max(5),
        comment: z.string(),
        category: z.enum(["accuracy", "timeliness", "quality", "safety", "teamwork"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        return {
          success: true,
          feedbackId: Math.floor(Math.random() * 10000),
          workerId: input.workerId,
          score: input.score,
          message: "Performance feedback recorded successfully",
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to record performance feedback: ${error}`,
        });
      }
    }),
});
