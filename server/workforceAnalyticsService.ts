import { getDb } from "./db";

interface WorkerMetrics {
  workerId: number;
  name: string;
  tenure: number; // months
  salary: number;
  performanceScore: number; // 0-100
  attendanceRate: number; // 0-100
  turnoverRisk: number; // 0-100 (higher = more likely to leave)
  productivityScore: number; // 0-100
}

interface TurnoverPrediction {
  workerId: number;
  name: string;
  riskScore: number; // 0-100
  riskLevel: "low" | "medium" | "high" | "critical";
  riskFactors: string[];
  recommendedAction: string;
}

interface SalaryBenchmark {
  role: string;
  farmAverage: number;
  industryAverage: number;
  percentile: number;
  recommendation: string;
}

interface ProductivityMetrics {
  workerId: number;
  name: string;
  tasksCompleted: number;
  qualityScore: number;
  efficiencyScore: number;
  trend: "improving" | "stable" | "declining";
}

/**
 * Calculate turnover risk score for a worker based on multiple factors
 */
export async function calculateTurnoverRisk(workerId: number): Promise<TurnoverPrediction | null> {
  try {
    const db = await getDb();
    if (!db) return null;

    // Get worker data
    const workerData = await db.query.raw(
      `SELECT w.*, 
        AVG(a.present) as attendanceRate,
        COUNT(DISTINCT a.id) as attendanceDays,
        MAX(a.date) as lastAttendance
      FROM workers w
      LEFT JOIN attendance a ON w.id = a.workerId
      WHERE w.id = ?
      GROUP BY w.id`,
      [workerId]
    );

    if (!workerData || workerData.length === 0) return null;

    const worker = workerData[0];
    let riskScore = 0;
    const riskFactors: string[] = [];

    // Factor 1: Tenure (newer workers more likely to leave)
    const hireDate = new Date(worker.hireDate);
    const tenureMonths = (Date.now() - hireDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
    if (tenureMonths < 6) {
      riskScore += 25;
      riskFactors.push("New hire (less than 6 months)");
    } else if (tenureMonths < 12) {
      riskScore += 15;
      riskFactors.push("Relatively new (less than 1 year)");
    }

    // Factor 2: Attendance rate (low attendance = higher risk)
    const attendanceRate = worker.attendanceRate || 100;
    if (attendanceRate < 80) {
      riskScore += 20;
      riskFactors.push("Low attendance rate");
    } else if (attendanceRate < 90) {
      riskScore += 10;
      riskFactors.push("Below average attendance");
    }

    // Factor 3: Salary comparison (underpaid workers more likely to leave)
    const salaryBenchmark = await calculateSalaryBenchmark(worker.role);
    if (salaryBenchmark && worker.salary < salaryBenchmark.farmAverage * 0.85) {
      riskScore += 20;
      riskFactors.push("Below average salary for role");
    }

    // Factor 4: Recent performance (declining performance = higher risk)
    const recentPerformance = await getRecentPerformance(workerId);
    if (recentPerformance && recentPerformance.trend === "declining") {
      riskScore += 15;
      riskFactors.push("Declining performance trend");
    }

    // Factor 5: Seasonal patterns (some workers leave seasonally)
    const seasonalRisk = await calculateSeasonalRisk(workerId);
    riskScore += seasonalRisk;
    if (seasonalRisk > 0) {
      riskFactors.push("Seasonal employment pattern detected");
    }

    // Normalize score to 0-100
    riskScore = Math.min(100, Math.max(0, riskScore));

    // Determine risk level
    let riskLevel: "low" | "medium" | "high" | "critical";
    if (riskScore >= 75) {
      riskLevel = "critical";
    } else if (riskScore >= 50) {
      riskLevel = "high";
    } else if (riskScore >= 25) {
      riskLevel = "medium";
    } else {
      riskLevel = "low";
    }

    // Generate recommendation
    const recommendedAction = generateRetentionRecommendation(riskLevel, riskFactors);

    return {
      workerId,
      name: worker.name,
      riskScore,
      riskLevel,
      riskFactors,
      recommendedAction,
    };
  } catch (error) {
    console.error("Error calculating turnover risk:", error);
    return null;
  }
}

/**
 * Calculate salary benchmarking for a role
 */
export async function calculateSalaryBenchmark(role: string): Promise<SalaryBenchmark | null> {
  try {
    const db = await getDb();
    if (!db) return null;

    // Get farm average salary for role
    const farmData = await db.query.raw(
      `SELECT AVG(salary) as avgSalary, COUNT(*) as count
      FROM workers WHERE role = ?`,
      [role]
    );

    const farmAverage = farmData?.[0]?.avgSalary || 0;

    // Industry benchmarks (Ghana agricultural sector - GHS)
    const industryBenchmarks: { [key: string]: number } = {
      manager: 3500,
      supervisor: 2500,
      worker: 1500,
      technician: 2000,
      driver: 1800,
      cleaner: 1200,
    };

    const industryAverage = industryBenchmarks[role.toLowerCase()] || 1500;

    // Calculate percentile (farm vs industry)
    const percentile = farmAverage > 0 ? (farmAverage / industryAverage) * 100 : 50;

    // Generate recommendation
    let recommendation = "";
    if (percentile < 80) {
      recommendation = "Consider increasing salaries to remain competitive";
    } else if (percentile > 120) {
      recommendation = "Salaries are above market rate";
    } else {
      recommendation = "Salaries are competitive with industry standards";
    }

    return {
      role,
      farmAverage,
      industryAverage,
      percentile,
      recommendation,
    };
  } catch (error) {
    console.error("Error calculating salary benchmark:", error);
    return null;
  }
}

/**
 * Get recent performance metrics for a worker
 */
async function getRecentPerformance(workerId: number): Promise<ProductivityMetrics | null> {
  try {
    const db = await getDb();
    if (!db) return null;

    // Get worker name
    const workerData = await db.query.raw(`SELECT name FROM workers WHERE id = ?`, [workerId]);

    if (!workerData || workerData.length === 0) return null;

    // Get performance data from last 3 months
    const performanceData = await db.query.raw(
      `SELECT 
        COUNT(*) as tasksCompleted,
        AVG(quality_score) as qualityScore,
        AVG(efficiency_score) as efficiencyScore
      FROM worker_performance
      WHERE workerId = ? AND date >= DATE_SUB(NOW(), INTERVAL 3 MONTH)`,
      [workerId]
    );

    const perf = performanceData?.[0] || {};

    // Determine trend (simplified - would need historical data)
    const trend: "improving" | "stable" | "declining" = "stable";

    return {
      workerId,
      name: workerData[0].name,
      tasksCompleted: perf.tasksCompleted || 0,
      qualityScore: perf.qualityScore || 0,
      efficiencyScore: perf.efficiencyScore || 0,
      trend,
    };
  } catch (error) {
    console.error("Error getting recent performance:", error);
    return null;
  }
}

/**
 * Calculate seasonal employment risk
 */
async function calculateSeasonalRisk(workerId: number): Promise<number> {
  try {
    const db = await getDb();
    if (!db) return 0;

    // Check if worker has history of leaving in specific seasons
    const seasonalData = await db.query.raw(
      `SELECT MONTH(date) as month, COUNT(*) as count
      FROM attendance
      WHERE workerId = ?
      GROUP BY MONTH(date)
      ORDER BY count ASC`,
      [workerId]
    );

    if (!seasonalData || seasonalData.length === 0) return 0;

    // If there's a significant gap in attendance in specific months, flag as seasonal
    const counts = seasonalData.map((d: any) => d.count);
    const avgCount = counts.reduce((a: number, b: number) => a + b, 0) / counts.length;
    const minCount = Math.min(...counts);

    if (minCount < avgCount * 0.5) {
      return 10; // Seasonal pattern detected
    }

    return 0;
  } catch (error) {
    console.error("Error calculating seasonal risk:", error);
    return 0;
  }
}

/**
 * Generate retention recommendation based on risk level
 */
function generateRetentionRecommendation(riskLevel: string, riskFactors: string[]): string {
  const recommendations: { [key: string]: string } = {
    critical:
      "Immediate action required: Schedule meeting with worker, review salary, improve working conditions, or consider exit interview",
    high: "Proactive engagement: Provide career development opportunities, salary review, or mentorship program",
    medium: "Monitor closely: Regular check-ins, performance feedback, and career path discussions",
    low: "Maintain engagement: Continue regular feedback and development opportunities",
  };

  return recommendations[riskLevel] || "Monitor worker engagement";
}

/**
 * Get all worker turnover predictions for a farm
 */
export async function getWorkforceTurnoverPredictions(farmId: number): Promise<TurnoverPrediction[]> {
  try {
    const db = await getDb();
    if (!db) return [];

    const workers = await db.query.raw(`SELECT id FROM workers WHERE farmId = ?`, [farmId]);

    if (!workers) return [];

    const predictions: TurnoverPrediction[] = [];

    for (const worker of workers) {
      const prediction = await calculateTurnoverRisk(worker.id);
      if (prediction) {
        predictions.push(prediction);
      }
    }

    // Sort by risk score (highest first)
    return predictions.sort((a, b) => b.riskScore - a.riskScore);
  } catch (error) {
    console.error("Error getting workforce turnover predictions:", error);
    return [];
  }
}

/**
 * Get productivity metrics for all workers
 */
export async function getWorkforceProductivityMetrics(farmId: number): Promise<ProductivityMetrics[]> {
  try {
    const db = await getDb();
    if (!db) return [];

    const workers = await db.query.raw(
      `SELECT w.id, w.name FROM workers WHERE farmId = ? ORDER BY name`,
      [farmId]
    );

    if (!workers) return [];

    const metrics: ProductivityMetrics[] = [];

    for (const worker of workers) {
      const perf = await getRecentPerformance(worker.id);
      if (perf) {
        metrics.push(perf);
      }
    }

    return metrics;
  } catch (error) {
    console.error("Error getting workforce productivity metrics:", error);
    return [];
  }
}

/**
 * Get salary benchmarking for all roles in a farm
 */
export async function getWorkforceSalaryBenchmarks(farmId: number): Promise<SalaryBenchmark[]> {
  try {
    const db = await getDb();
    if (!db) return [];

    // Get unique roles
    const roles = await db.query.raw(`SELECT DISTINCT role FROM workers WHERE farmId = ?`, [farmId]);

    if (!roles) return [];

    const benchmarks: SalaryBenchmark[] = [];

    for (const roleData of roles) {
      const benchmark = await calculateSalaryBenchmark(roleData.role);
      if (benchmark) {
        benchmarks.push(benchmark);
      }
    }

    return benchmarks;
  } catch (error) {
    console.error("Error getting workforce salary benchmarks:", error);
    return [];
  }
}

/**
 * Get workforce analytics summary
 */
export async function getWorkforceAnalyticsSummary(farmId: number) {
  try {
    const db = await getDb();
    if (!db) return null;

    // Get basic workforce stats
    const stats = await db.query.raw(
      `SELECT 
        COUNT(*) as totalWorkers,
        AVG(salary) as avgSalary,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as activeWorkers,
        COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactiveWorkers
      FROM workers WHERE farmId = ?`,
      [farmId]
    );

    const summary = stats?.[0] || {};

    // Get turnover predictions
    const predictions = await getWorkforceTurnoverPredictions(farmId);
    const criticalRisk = predictions.filter((p) => p.riskLevel === "critical").length;
    const highRisk = predictions.filter((p) => p.riskLevel === "high").length;

    // Get productivity metrics
    const productivity = await getWorkforceProductivityMetrics(farmId);
    const avgProductivity = productivity.length > 0
      ? productivity.reduce((sum, p) => sum + p.efficiencyScore, 0) / productivity.length
      : 0;

    return {
      totalWorkers: summary.totalWorkers || 0,
      activeWorkers: summary.activeWorkers || 0,
      inactiveWorkers: summary.inactiveWorkers || 0,
      avgSalary: summary.avgSalary || 0,
      turnoverRisk: {
        critical: criticalRisk,
        high: highRisk,
        total: predictions.length,
      },
      avgProductivity: Math.round(avgProductivity),
    };
  } catch (error) {
    console.error("Error getting workforce analytics summary:", error);
    return null;
  }
}
