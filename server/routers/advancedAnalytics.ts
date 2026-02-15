import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import {
  workerPerformance,
  workerShifts,
  timeOffRequests,
  payrollRecords,
  complianceLogs,
  farmWorkers,
} from "../../drizzle/schema";
import { eq, and, gte, lte, desc, count, sum, avg } from "drizzle-orm";

/**
 * Advanced Analytics Router
 * Provides comprehensive analytics and insights for Labor Management
 */
export const advancedAnalyticsRouter = router({
  /**
   * Get worker productivity analytics
   */
  getProductivityAnalytics: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();

      // Fetch performance data
      let query = db.select().from(workerPerformance).where(eq(workerPerformance.farmId, input.farmId));

      if (input.startDate) {
        query = query.where(gte(workerPerformance.date, input.startDate));
      }

      if (input.endDate) {
        query = query.where(lte(workerPerformance.date, input.endDate));
      }

      const performanceData = await query.orderBy(desc(workerPerformance.date));

      // Calculate metrics
      const metrics = {
        averageProductivity: performanceData.reduce((sum: number, p: any) => sum + (p.performanceScore || 0), 0) / performanceData.length || 0,
        topPerformers: performanceData
          .sort((a: any, b: any) => (b.performanceScore || 0) - (a.performanceScore || 0))
          .slice(0, 5),
        bottomPerformers: performanceData
          .sort((a: any, b: any) => (a.performanceScore || 0) - (b.performanceScore || 0))
          .slice(0, 5),
        trend: calculateTrend(performanceData),
      };

      return metrics;
    }),

  /**
   * Get labor cost analytics
   */
  getLaborCostAnalytics: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        startDate: z.string(),
        endDate: z.string(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();

      // Fetch payroll data
      const payrollData = await db
        .select()
        .from(payrollRecords)
        .where(
          and(
            eq(payrollRecords.farmId, input.farmId),
            gte(payrollRecords.payrollPeriodStart, input.startDate),
            lte(payrollRecords.payrollPeriodEnd, input.endDate)
          )
        );

      // Calculate costs
      const totalCost = payrollData.reduce((sum: number, p: any) => sum + (p.totalAmount || 0), 0);
      const averageCostPerWorker = payrollData.length > 0 ? totalCost / payrollData.length : 0;
      const costByStatus = {
        draft: payrollData.filter((p: any) => p.status === "draft").reduce((sum: number, p: any) => sum + (p.totalAmount || 0), 0),
        approved: payrollData.filter((p: any) => p.status === "approved").reduce((sum: number, p: any) => sum + (p.totalAmount || 0), 0),
        paid: payrollData.filter((p: any) => p.status === "paid").reduce((sum: number, p: any) => sum + (p.totalAmount || 0), 0),
      };

      return {
        totalCost,
        averageCostPerWorker,
        costByStatus,
        recordCount: payrollData.length,
      };
    }),

  /**
   * Get workforce utilization analytics
   */
  getWorkforceUtilization: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        startDate: z.string(),
        endDate: z.string(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();

      // Fetch shift data
      const shiftData = await db
        .select()
        .from(workerShifts)
        .where(
          and(
            eq(workerShifts.farmId, input.farmId),
            gte(workerShifts.shiftDate, input.startDate),
            lte(workerShifts.shiftDate, input.endDate)
          )
        );

      // Fetch worker data
      const workers = await db.select().from(farmWorkers).where(eq(farmWorkers.farmId, input.farmId));

      // Calculate utilization
      const totalPossibleShifts = workers.length * Math.ceil((new Date(input.endDate).getTime() - new Date(input.startDate).getTime()) / (1000 * 60 * 60 * 24));
      const utilizationRate = totalPossibleShifts > 0 ? (shiftData.length / totalPossibleShifts) * 100 : 0;

      const shiftsByWorker = workers.map((w: any) => ({
        workerId: w.id,
        workerName: w.name,
        shiftsWorked: shiftData.filter((s: any) => s.workerId === w.id).length,
        totalHours: shiftData
          .filter((s: any) => s.workerId === w.id)
          .reduce((sum: number, s: any) => sum + (s.hoursWorked || 0), 0),
      }));

      return {
        utilizationRate: Math.round(utilizationRate),
        totalShifts: shiftData.length,
        totalWorkers: workers.length,
        shiftsByWorker,
      };
    }),

  /**
   * Get compliance analytics
   */
  getComplianceAnalytics: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();

      // Fetch compliance data
      let query = db.select().from(complianceLogs).where(eq(complianceLogs.farmId, input.farmId));

      if (input.startDate) {
        query = query.where(gte(complianceLogs.date, input.startDate));
      }

      if (input.endDate) {
        query = query.where(lte(complianceLogs.date, input.endDate));
      }

      const complianceData = await query;

      // Calculate metrics
      const totalChecks = complianceData.length;
      const violations = complianceData.filter((c: any) => c.complianceStatus === "violation").length;
      const warnings = complianceData.filter((c: any) => c.complianceStatus === "warning").length;
      const compliant = complianceData.filter((c: any) => c.complianceStatus === "compliant").length;

      const complianceRate = totalChecks > 0 ? ((compliant / totalChecks) * 100).toFixed(2) : 100;

      // Violations by type
      const violationsByType = complianceData
        .filter((c: any) => c.complianceStatus === "violation")
        .reduce((acc: any, c: any) => {
          acc[c.violationType] = (acc[c.violationType] || 0) + 1;
          return acc;
        }, {});

      return {
        totalChecks,
        complianceRate: parseFloat(complianceRate as string),
        violations,
        warnings,
        compliant,
        violationsByType,
      };
    }),

  /**
   * Get predictive analytics
   * Predicts future trends and issues
   */
  getPredictiveAnalytics: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        forecastDays: z.number().default(30),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();

      // Fetch historical data
      const performanceData = await db
        .select()
        .from(workerPerformance)
        .where(eq(workerPerformance.farmId, input.farmId))
        .orderBy(desc(workerPerformance.date))
        .limit(90);

      const timeOffData = await db
        .select()
        .from(timeOffRequests)
        .where(eq(timeOffRequests.farmId, input.farmId))
        .orderBy(desc(timeOffRequests.requestDate));

      // Simple trend analysis
      const recentPerformance = performanceData.slice(0, 30);
      const olderPerformance = performanceData.slice(30, 60);

      const recentAvg = recentPerformance.reduce((sum: number, p: any) => sum + (p.performanceScore || 0), 0) / recentPerformance.length || 0;
      const olderAvg = olderPerformance.reduce((sum: number, p: any) => sum + (p.performanceScore || 0), 0) / olderPerformance.length || 0;

      const performanceTrend = recentAvg > olderAvg ? "improving" : "declining";
      const performanceChange = ((recentAvg - olderAvg) / olderAvg) * 100;

      // Predict staffing needs
      const approvedTimeOff = timeOffData.filter((t: any) => t.status === "approved").length;
      const predictedStaffingNeeds = Math.ceil(approvedTimeOff * 0.8); // Rough estimate

      return {
        performanceTrend,
        performanceChange: performanceChange.toFixed(2),
        predictedStaffingNeeds,
        forecastPeriod: `${input.forecastDays} days`,
        recommendations: generateRecommendations(performanceTrend, predictedStaffingNeeds),
      };
    }),

  /**
   * Get worker comparison analytics
   */
  getWorkerComparison: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        workerIds: z.array(z.number()),
        metric: z.enum(["productivity", "attendance", "compliance", "cost"]),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();

      const comparisons = await Promise.all(
        input.workerIds.map(async (workerId) => {
          const performance = await db
            .select()
            .from(workerPerformance)
            .where(eq(workerPerformance.workerId, workerId))
            .orderBy(desc(workerPerformance.date))
            .limit(30);

          const shifts = await db
            .select()
            .from(workerShifts)
            .where(eq(workerShifts.workerId, workerId));

          const avgProductivity = performance.reduce((sum: number, p: any) => sum + (p.performanceScore || 0), 0) / performance.length || 0;
          const totalHours = shifts.reduce((sum: number, s: any) => sum + (s.hoursWorked || 0), 0);

          return {
            workerId,
            productivity: avgProductivity.toFixed(2),
            totalHours,
            shiftsWorked: shifts.length,
          };
        })
      );

      return comparisons;
    }),
});

// Helper functions
function calculateTrend(data: any[]): string {
  if (data.length < 2) return "insufficient_data";

  const recent = data.slice(0, Math.ceil(data.length / 2));
  const older = data.slice(Math.ceil(data.length / 2));

  const recentAvg = recent.reduce((sum: number, d: any) => sum + (d.performanceScore || 0), 0) / recent.length || 0;
  const olderAvg = older.reduce((sum: number, d: any) => sum + (d.performanceScore || 0), 0) / older.length || 0;

  if (recentAvg > olderAvg * 1.05) return "improving";
  if (recentAvg < olderAvg * 0.95) return "declining";
  return "stable";
}

function generateRecommendations(trend: string, staffingNeeds: number): string[] {
  const recommendations = [];

  if (trend === "declining") {
    recommendations.push("Performance is declining. Consider implementing training programs.");
    recommendations.push("Review workload distribution and worker schedules.");
  }

  if (staffingNeeds > 5) {
    recommendations.push(`Plan to hire ${staffingNeeds} additional workers for upcoming period.`);
  }

  recommendations.push("Monitor compliance metrics closely.");

  return recommendations;
}
