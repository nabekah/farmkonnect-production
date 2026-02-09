import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import {
  calculateTurnoverRisk,
  calculateSalaryBenchmark,
  getWorkforceTurnoverPredictions,
  getWorkforceProductivityMetrics,
  getWorkforceSalaryBenchmarks,
  getWorkforceAnalyticsSummary,
} from "../workforceAnalyticsService";

export const workforceAnalyticsRouter = router({
  /**
   * Get turnover risk prediction for a specific worker
   */
  getTurnoverRisk: protectedProcedure
    .input(z.object({ workerId: z.number() }))
    .query(async ({ input }) => {
      return await calculateTurnoverRisk(input.workerId);
    }),

  /**
   * Get all turnover predictions for a farm
   */
  getWorkforceTurnoverPredictions: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ input }) => {
      return await getWorkforceTurnoverPredictions(input.farmId);
    }),

  /**
   * Get salary benchmarking for a role
   */
  getSalaryBenchmark: protectedProcedure
    .input(z.object({ role: z.string() }))
    .query(async ({ input }) => {
      return await calculateSalaryBenchmark(input.role);
    }),

  /**
   * Get all salary benchmarks for a farm
   */
  getWorkforceSalaryBenchmarks: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ input }) => {
      return await getWorkforceSalaryBenchmarks(input.farmId);
    }),

  /**
   * Get productivity metrics for all workers
   */
  getWorkforceProductivityMetrics: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ input }) => {
      return await getWorkforceProductivityMetrics(input.farmId);
    }),

  /**
   * Get comprehensive workforce analytics summary
   */
  getWorkforceAnalyticsSummary: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ input }) => {
      return await getWorkforceAnalyticsSummary(input.farmId);
    }),

  /**
   * Get high-risk workers requiring intervention
   */
  getHighRiskWorkers: protectedProcedure
    .input(z.object({ farmId: z.number(), riskLevel: z.enum(["high", "critical"]).optional() }))
    .query(async ({ input }) => {
      const predictions = await getWorkforceTurnoverPredictions(input.farmId);
      const riskLevel = input.riskLevel || "high";

      return predictions.filter((p) => {
        if (riskLevel === "critical") {
          return p.riskLevel === "critical";
        }
        return p.riskLevel === "high" || p.riskLevel === "critical";
      });
    }),

  /**
   * Get workforce planning recommendations
   */
  getWorkforcePlanningRecommendations: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ input }) => {
      const summary = await getWorkforceAnalyticsSummary(input.farmId);
      const benchmarks = await getWorkforceSalaryBenchmarks(input.farmId);

      if (!summary) return null;

      const recommendations = [];

      // Turnover risk recommendations
      if (summary.turnoverRisk.critical > 0) {
        recommendations.push({
          priority: "critical",
          category: "Turnover Risk",
          message: `${summary.turnoverRisk.critical} workers at critical risk of leaving. Immediate intervention required.`,
          action: "Schedule meetings with high-risk workers and review retention strategies",
        });
      }

      if (summary.turnoverRisk.high > 0) {
        recommendations.push({
          priority: "high",
          category: "Turnover Risk",
          message: `${summary.turnoverRisk.high} workers at high risk of leaving.`,
          action: "Provide career development opportunities and conduct stay interviews",
        });
      }

      // Salary recommendations
      const underpaidRoles = benchmarks.filter((b) => b.percentile < 85);
      if (underpaidRoles.length > 0) {
        recommendations.push({
          priority: "high",
          category: "Compensation",
          message: `${underpaidRoles.length} roles are below market rate (${underpaidRoles.map((r) => r.role).join(", ")})`,
          action: "Consider salary adjustments to improve competitiveness",
        });
      }

      // Productivity recommendations
      if (summary.avgProductivity < 70) {
        recommendations.push({
          priority: "medium",
          category: "Productivity",
          message: `Average workforce productivity is ${summary.avgProductivity}%. Below target of 80%.`,
          action: "Implement training programs and performance improvement plans",
        });
      }

      // Workforce planning recommendations
      if (summary.inactiveWorkers > summary.activeWorkers * 0.2) {
        recommendations.push({
          priority: "medium",
          category: "Workforce Planning",
          message: `${summary.inactiveWorkers} inactive workers. Consider workforce optimization.`,
          action: "Review inactive worker status and update employment records",
        });
      }

      return {
        summary,
        recommendations: recommendations.sort((a, b) => {
          const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
          return priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder];
        }),
      };
    }),

  /**
   * Export workforce analytics report
   */
  exportWorkforceAnalyticsReport: protectedProcedure
    .input(z.object({ farmId: z.number(), format: z.enum(["csv", "json"]) }))
    .query(async ({ input }) => {
      const summary = await getWorkforceAnalyticsSummary(input.farmId);
      const predictions = await getWorkforceTurnoverPredictions(input.farmId);
      const benchmarks = await getWorkforceSalaryBenchmarks(input.farmId);
      const productivity = await getWorkforceProductivityMetrics(input.farmId);

      const report = {
        generatedDate: new Date().toISOString(),
        farmId: input.farmId,
        summary,
        turnoverPredictions: predictions,
        salaryBenchmarks: benchmarks,
        productivityMetrics: productivity,
      };

      if (input.format === "json") {
        return {
          format: "json",
          data: JSON.stringify(report, null, 2),
          fileName: `workforce_analytics_${input.farmId}_${new Date().toISOString().split("T")[0]}.json`,
        };
      }

      // CSV format
      let csv = "Workforce Analytics Report\n";
      csv += `Generated: ${new Date().toISOString()}\n`;
      csv += `Farm ID: ${input.farmId}\n\n`;

      csv += "SUMMARY\n";
      csv += `Total Workers,${summary?.totalWorkers}\n`;
      csv += `Active Workers,${summary?.activeWorkers}\n`;
      csv += `Average Salary,${summary?.avgSalary}\n`;
      csv += `Average Productivity,${summary?.avgProductivity}%\n\n`;

      csv += "TURNOVER RISK\n";
      csv += `Critical Risk,${summary?.turnoverRisk.critical}\n`;
      csv += `High Risk,${summary?.turnoverRisk.high}\n\n`;

      csv += "TURNOVER PREDICTIONS\n";
      csv += "Worker ID,Name,Risk Score,Risk Level\n";
      predictions.forEach((p) => {
        csv += `${p.workerId},${p.name},${p.riskScore},${p.riskLevel}\n`;
      });

      return {
        format: "csv",
        data: csv,
        fileName: `workforce_analytics_${input.farmId}_${new Date().toISOString().split("T")[0]}.csv`,
      };
    }),
});
