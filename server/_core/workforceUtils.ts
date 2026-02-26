import { getDb } from "../db";
import { farmWorkers } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

/**
 * Shared workforce management utilities
 * Consolidates common functions from workforceRouter and workerRouter
 */

export interface WorkerQueryOptions {
  farmId?: number;
  status?: string;
  searchQuery?: string;
}

export interface WorkerWithStats extends Record<string, any> {
  id: number;
  name: string;
  email?: string;
  contact?: string;
  role: string;
  status: string;
  salary?: string | number;
}

/**
 * Get all workers for a farm with optional filtering
 */
export async function getWorkersByFarm(farmId: number, status?: string): Promise<WorkerWithStats[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    let whereConditions = [eq(farmWorkers.farmId, farmId)];
    if (status) {
      whereConditions.push(eq(farmWorkers.status, status));
    }

    const result = await db
      .select()
      .from(farmWorkers)
      .where(and(...whereConditions));

    return result;
  } catch (error) {
    console.error("[workforceUtils] Error fetching workers by farm:", error);
    return [];
  }
}

/**
 * Get a specific worker by ID
 */
export async function getWorkerById(workerId: number): Promise<WorkerWithStats | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.select().from(farmWorkers).where(eq(farmWorkers.id, workerId));
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[workforceUtils] Error fetching worker by ID:", error);
    return null;
  }
}

/**
 * Get available workers (active status only)
 */
export async function getAvailableWorkers(farmId: number): Promise<WorkerWithStats[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    const result = await db
      .select()
      .from(farmWorkers)
      .where(and(eq(farmWorkers.farmId, farmId), eq(farmWorkers.status, "active")));

    return result;
  } catch (error) {
    console.error("[workforceUtils] Error fetching available workers:", error);
    return [];
  }
}

/**
 * Search workers by name or email
 */
export async function searchWorkers(farmId: number, query: string): Promise<WorkerWithStats[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    const result = await db
      .select()
      .from(farmWorkers)
      .where(eq(farmWorkers.farmId, farmId));

    const lowerQuery = query.toLowerCase();
    return result.filter(
      (w) =>
        (w.name?.toLowerCase().includes(lowerQuery) || false) ||
        (w.email?.toLowerCase().includes(lowerQuery) || false)
    );
  } catch (error) {
    console.error("[workforceUtils] Error searching workers:", error);
    return [];
  }
}

/**
 * Get worker count statistics for a farm
 */
export async function getWorkerCount(farmId: number): Promise<{
  total: number;
  active: number;
  inactive: number;
}> {
  const db = await getDb();
  if (!db) return { total: 0, active: 0, inactive: 0 };

  try {
    const result = await db.select().from(farmWorkers).where(eq(farmWorkers.farmId, farmId));

    return {
      total: result.length,
      active: result.filter((w) => w.status === "active").length,
      inactive: result.filter((w) => w.status !== "active").length,
    };
  } catch (error) {
    console.error("[workforceUtils] Error getting worker count:", error);
    return { total: 0, active: 0, inactive: 0 };
  }
}

/**
 * Get team statistics for a farm
 */
export async function getTeamStats(farmId: number): Promise<{
  totalWorkers: number;
  activeWorkers: number;
  totalPayroll: number;
  averageSalary: number;
  workersByRole: Record<string, number>;
}> {
  const db = await getDb();
  if (!db) return { totalWorkers: 0, activeWorkers: 0, totalPayroll: 0, averageSalary: 0, workersByRole: {} };

  try {
    const workers = await db.select().from(farmWorkers).where(eq(farmWorkers.farmId, farmId));

    const totalPayroll = workers.reduce((sum, w) => sum + parseFloat(w.salary?.toString() || "0"), 0);
    const averageSalary = workers.length > 0 ? totalPayroll / workers.length : 0;

    return {
      totalWorkers: workers.length,
      activeWorkers: workers.filter((w) => w.status === "active").length,
      totalPayroll,
      averageSalary,
      workersByRole: workers.reduce(
        (acc, w) => {
          acc[w.role] = (acc[w.role] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ),
    };
  } catch (error) {
    console.error("[workforceUtils] Error getting team stats:", error);
    return { totalWorkers: 0, activeWorkers: 0, totalPayroll: 0, averageSalary: 0, workersByRole: {} };
  }
}

/**
 * Get team grouped by role for a farm
 */
export async function getTeamByRole(farmId: number): Promise<{
  totalWorkers: number;
  activeWorkers: number;
  teamByRole: Record<string, WorkerWithStats[]>;
}> {
  const db = await getDb();
  if (!db) return { totalWorkers: 0, activeWorkers: 0, teamByRole: {} };

  try {
    const workers = await db
      .select()
      .from(farmWorkers)
      .where(and(eq(farmWorkers.farmId, farmId), eq(farmWorkers.status, "active")));

    const teamByRole: Record<string, WorkerWithStats[]> = {};
    workers.forEach((w) => {
      if (!teamByRole[w.role]) {
        teamByRole[w.role] = [];
      }
      teamByRole[w.role].push(w);
    });

    return {
      totalWorkers: workers.length,
      activeWorkers: workers.filter((w) => w.status === "active").length,
      teamByRole,
    };
  } catch (error) {
    console.error("[workforceUtils] Error getting team by role:", error);
    return { totalWorkers: 0, activeWorkers: 0, teamByRole: {} };
  }
}

/**
 * Calculate salary for a worker
 */
export async function calculateWorkerSalary(
  workerId: number,
  daysWorked?: number,
  deductions?: number,
  bonuses?: number
): Promise<{
  workerId: number;
  grossSalary: number;
  deductions: number;
  bonuses: number;
  netSalary: number;
}> {
  const db = await getDb();
  if (!db) return { workerId, grossSalary: 0, deductions: 0, bonuses: 0, netSalary: 0 };

  try {
    const worker = await db.select().from(farmWorkers).where(eq(farmWorkers.id, workerId));
    if (worker.length === 0) {
      throw new Error("Worker not found");
    }

    const baseSalary = parseFloat(worker[0].salary?.toString() || "0");
    const deductionsAmount = deductions || 0;
    const bonusesAmount = bonuses || 0;

    let grossSalary = baseSalary;
    if (daysWorked && worker[0].salaryFrequency === "daily") {
      grossSalary = baseSalary * daysWorked;
    }

    const netSalary = grossSalary + bonusesAmount - deductionsAmount;

    return {
      workerId,
      grossSalary,
      deductions: deductionsAmount,
      bonuses: bonusesAmount,
      netSalary,
    };
  } catch (error) {
    console.error("[workforceUtils] Error calculating salary:", error);
    return { workerId, grossSalary: 0, deductions: 0, bonuses: 0, netSalary: 0 };
  }
}
