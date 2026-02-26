import { getDb } from "../db";
import { farmExpenses, farmRevenue } from "../../drizzle/schema";
import { eq, and, gte, lte } from "drizzle-orm";

/**
 * Shared financial management utilities
 * Consolidates common functions from financialRouter and paymentRouter
 */

export interface ExpenseRecord {
  id: number;
  farmId: number;
  category: string;
  amount: string;
  expenseDate: Date;
  description?: string;
  vendor?: string;
  invoiceNumber?: string;
}

export interface RevenueRecord {
  id: number;
  farmId: number;
  source: string;
  amount: string;
  saleDate: Date;
  buyer?: string;
  quantity?: string;
  unit?: string;
  notes?: string;
}

export interface FinancialSummary {
  totalAmount: number;
  byCategory: Record<string, number>;
}

export interface ProfitLossStatement {
  revenue: number;
  expenses: number;
  profit: number;
  profitMargin: number;
}

/**
 * Get expenses for a farm with optional filtering
 */
export async function getExpenses(
  farmId: number,
  startDate?: Date,
  endDate?: Date,
  category?: string
): Promise<ExpenseRecord[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    let whereConditions = [eq(farmExpenses.farmId, farmId)];

    if (startDate && endDate) {
      whereConditions.push(gte(farmExpenses.expenseDate, startDate), lte(farmExpenses.expenseDate, endDate));
    }

    const expenses = await db.select().from(farmExpenses).where(and(...whereConditions));

    if (category) {
      return expenses.filter((e) => e.category === category);
    }
    return expenses;
  } catch (error) {
    console.error("[financialUtils] Error fetching expenses:", error);
    return [];
  }
}

/**
 * Get revenue records for a farm with optional filtering
 */
export async function getRevenue(
  farmId: number,
  startDate?: Date,
  endDate?: Date,
  source?: string
): Promise<RevenueRecord[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    let whereConditions = [eq(farmRevenue.farmId, farmId)];

    if (startDate && endDate) {
      whereConditions.push(gte(farmRevenue.saleDate, startDate), lte(farmRevenue.saleDate, endDate));
    }

    const revenues = await db.select().from(farmRevenue).where(and(...whereConditions));

    if (source) {
      return revenues.filter((r) => r.source === source);
    }
    return revenues;
  } catch (error) {
    console.error("[financialUtils] Error fetching revenue:", error);
    return [];
  }
}

/**
 * Calculate expense summary for a farm
 */
export async function getExpenseSummary(
  farmId: number,
  startDate?: Date,
  endDate?: Date
): Promise<FinancialSummary> {
  const db = await getDb();
  if (!db) return { totalAmount: 0, byCategory: {} };

  try {
    const expenses = await getExpenses(farmId, startDate, endDate);

    const totalAmount = expenses.reduce((sum, e) => sum + parseFloat(e.amount || "0"), 0);

    const byCategory: Record<string, number> = {};
    expenses.forEach((e) => {
      if (!byCategory[e.category]) byCategory[e.category] = 0;
      byCategory[e.category] += parseFloat(e.amount || "0");
    });

    return { totalAmount, byCategory };
  } catch (error) {
    console.error("[financialUtils] Error calculating expense summary:", error);
    return { totalAmount: 0, byCategory: {} };
  }
}

/**
 * Calculate revenue summary for a farm
 */
export async function getRevenueSummary(
  farmId: number,
  startDate?: Date,
  endDate?: Date
): Promise<FinancialSummary> {
  const db = await getDb();
  if (!db) return { totalAmount: 0, byCategory: {} };

  try {
    const revenues = await getRevenue(farmId, startDate, endDate);

    const totalAmount = revenues.reduce((sum, r) => sum + parseFloat(r.amount || "0"), 0);

    const byCategory: Record<string, number> = {};
    revenues.forEach((r) => {
      if (!byCategory[r.source]) byCategory[r.source] = 0;
      byCategory[r.source] += parseFloat(r.amount || "0");
    });

    return { totalAmount, byCategory };
  } catch (error) {
    console.error("[financialUtils] Error calculating revenue summary:", error);
    return { totalAmount: 0, byCategory: {} };
  }
}

/**
 * Calculate profit/loss statement for a farm
 */
export async function calculateProfitLoss(
  farmId: number,
  startDate: Date,
  endDate: Date
): Promise<ProfitLossStatement> {
  const db = await getDb();
  if (!db) return { revenue: 0, expenses: 0, profit: 0, profitMargin: 0 };

  try {
    const [expenses, revenues] = await Promise.all([
      getExpenses(farmId, startDate, endDate),
      getRevenue(farmId, startDate, endDate),
    ]);

    const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount || "0"), 0);
    const totalRevenue = revenues.reduce((sum, r) => sum + parseFloat(r.amount || "0"), 0);
    const profit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

    return {
      revenue: totalRevenue,
      expenses: totalExpenses,
      profit,
      profitMargin: parseFloat(profitMargin.toFixed(2)),
    };
  } catch (error) {
    console.error("[financialUtils] Error calculating profit/loss:", error);
    return { revenue: 0, expenses: 0, profit: 0, profitMargin: 0 };
  }
}

/**
 * Calculate monthly financial trend
 */
export async function getMonthlyTrend(
  farmId: number,
  months: number = 12
): Promise<
  Array<{
    month: string;
    revenue: number;
    expenses: number;
    profit: number;
  }>
> {
  const db = await getDb();
  if (!db) return [];

  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const [expenses, revenues] = await Promise.all([
      getExpenses(farmId, startDate, endDate),
      getRevenue(farmId, startDate, endDate),
    ]);

    // Group by month
    const monthlyData: Record<string, { revenue: number; expenses: number }> = {};

    expenses.forEach((e) => {
      const date = new Date(e.expenseDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { revenue: 0, expenses: 0 };
      }
      monthlyData[monthKey].expenses += parseFloat(e.amount || "0");
    });

    revenues.forEach((r) => {
      const date = new Date(r.saleDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { revenue: 0, expenses: 0 };
      }
      monthlyData[monthKey].revenue += parseFloat(r.amount || "0");
    });

    // Convert to array and sort
    return Object.entries(monthlyData)
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
      .map(([month, data]) => ({
        month,
        revenue: data.revenue,
        expenses: data.expenses,
        profit: data.revenue - data.expenses,
      }));
  } catch (error) {
    console.error("[financialUtils] Error calculating monthly trend:", error);
    return [];
  }
}

/**
 * Get all expenses across all farms (admin only)
 */
export async function getAllExpenses(): Promise<ExpenseRecord[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db.select().from(farmExpenses);
  } catch (error) {
    console.error("[financialUtils] Error fetching all expenses:", error);
    return [];
  }
}

/**
 * Get all revenue across all farms (admin only)
 */
export async function getAllRevenue(): Promise<RevenueRecord[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db.select().from(farmRevenue);
  } catch (error) {
    console.error("[financialUtils] Error fetching all revenue:", error);
    return [];
  }
}
