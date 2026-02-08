import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { eq, and, gte, lte, sum } from "drizzle-orm";
import {
  expenses,
  revenue,
  budgets,
  invoices
} from "../../drizzle/schema";

export const financialManagementRouter = router({
  /**
   * Create a new expense record
   */
  createExpense: protectedProcedure
    .input(z.object({
      farmId: z.string(),
      category: z.enum(["feed", "medication", "labor", "equipment", "utilities", "transport", "other"]),
      description: z.string(),
      amount: z.number().positive(),
      date: z.date(),
      animalId: z.string().optional(),
      notes: z.string().optional()
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const result = await db.insert(expenses).values({
        farmId: input.farmId,
        userId: ctx.user.id,
        category: input.category,
        description: input.description,
        amount: input.amount,
        date: input.date,
        animalId: input.animalId,
        notes: input.notes,
        createdAt: new Date()
      }).returning();

      return result[0];
    }),

  /**
   * Get expenses for a farm with filtering
   */
  getExpenses: protectedProcedure
    .input(z.object({
      farmId: z.string(),
      category: z.string().optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      limit: z.number().default(50),
      offset: z.number().default(0)
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const conditions = [eq(expenses.farmId, input.farmId)];
      
      if (input.category) {
        conditions.push(eq(expenses.category, input.category as any));
      }
      if (input.startDate) {
        conditions.push(gte(expenses.date, input.startDate));
      }
      if (input.endDate) {
        conditions.push(lte(expenses.date, input.endDate));
      }

      const results = await db
        .select()
        .from(expenses)
        .where(and(...conditions))
        .limit(input.limit)
        .offset(input.offset);

      return results;
    }),

  /**
   * Create a new revenue record
   */
  createRevenue: protectedProcedure
    .input(z.object({
      farmId: z.string(),
      source: z.enum(["animal_sales", "milk", "eggs", "meat", "breeding", "other"]),
      description: z.string(),
      amount: z.number().positive(),
      date: z.date(),
      animalId: z.string().optional(),
      quantity: z.number().optional(),
      unit: z.string().optional(),
      notes: z.string().optional()
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const result = await db.insert(revenue).values({
        farmId: input.farmId,
        userId: ctx.user.id,
        source: input.source,
        description: input.description,
        amount: input.amount,
        date: input.date,
        animalId: input.animalId,
        quantity: input.quantity,
        unit: input.unit,
        notes: input.notes,
        createdAt: new Date()
      }).returning();

      return result[0];
    }),

  /**
   * Get revenue records for a farm
   */
  getRevenue: protectedProcedure
    .input(z.object({
      farmId: z.string(),
      source: z.string().optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      limit: z.number().default(50),
      offset: z.number().default(0)
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const conditions = [eq(revenue.farmId, input.farmId)];
      
      if (input.source) {
        conditions.push(eq(revenue.source, input.source as any));
      }
      if (input.startDate) {
        conditions.push(gte(revenue.date, input.startDate));
      }
      if (input.endDate) {
        conditions.push(lte(revenue.date, input.endDate));
      }

      const results = await db
        .select()
        .from(revenue)
        .where(and(...conditions))
        .limit(input.limit)
        .offset(input.offset);

      return results;
    }),

  /**
   * Get financial summary for a farm
   */
  getFinancialSummary: protectedProcedure
    .input(z.object({
      farmId: z.string(),
      startDate: z.date().optional(),
      endDate: z.date().optional()
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const conditions = [eq(expenses.farmId, input.farmId)];
      const revenuConditions = [eq(revenue.farmId, input.farmId)];
      
      if (input.startDate) {
        conditions.push(gte(expenses.date, input.startDate));
        revenuConditions.push(gte(revenue.date, input.startDate));
      }
      if (input.endDate) {
        conditions.push(lte(expenses.date, input.endDate));
        revenuConditions.push(lte(revenue.date, input.endDate));
      }

      // Get total expenses
      const expenseResult = await db
        .select({ total: sum(expenses.amount) })
        .from(expenses)
        .where(and(...conditions));

      // Get total revenue
      const revenueResult = await db
        .select({ total: sum(revenue.amount) })
        .from(revenue)
        .where(and(...revenuConditions));

      const totalExpenses = Number(expenseResult[0]?.total || 0);
      const totalRevenue = Number(revenueResult[0]?.total || 0);
      const profit = totalRevenue - totalExpenses;
      const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

      return {
        totalExpenses,
        totalRevenue,
        profit,
        profitMargin,
        period: {
          startDate: input.startDate,
          endDate: input.endDate
        }
      };
    }),

  /**
   * Calculate cost per animal
   */
  calculateCostPerAnimal: protectedProcedure
    .input(z.object({
      farmId: z.string(),
      animalId: z.string().optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional()
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const conditions = [eq(expenses.farmId, input.farmId)];
      
      if (input.animalId) {
        conditions.push(eq(expenses.animalId, input.animalId));
      }
      if (input.startDate) {
        conditions.push(gte(expenses.date, input.startDate));
      }
      if (input.endDate) {
        conditions.push(lte(expenses.date, input.endDate));
      }

      const results = await db
        .select()
        .from(expenses)
        .where(and(...conditions));

      // Group by animal and calculate totals
      const costByAnimal: Record<string, number> = {};
      results.forEach(exp => {
        if (exp.animalId) {
          costByAnimal[exp.animalId] = (costByAnimal[exp.animalId] || 0) + exp.amount;
        }
      });

      return {
        costByAnimal,
        totalAnimals: Object.keys(costByAnimal).length,
        averageCostPerAnimal: Object.values(costByAnimal).length > 0
          ? Object.values(costByAnimal).reduce((a, b) => a + b, 0) / Object.values(costByAnimal).length
          : 0
      };
    }),

  /**
   * Create a budget
   */
  createBudget: protectedProcedure
    .input(z.object({
      farmId: z.string(),
      name: z.string(),
      category: z.string(),
      allocatedAmount: z.number().positive(),
      startDate: z.date(),
      endDate: z.date(),
      notes: z.string().optional()
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const result = await db.insert(budgets).values({
        farmId: input.farmId,
        userId: ctx.user.id,
        name: input.name,
        category: input.category,
        allocatedAmount: input.allocatedAmount,
        startDate: input.startDate,
        endDate: input.endDate,
        notes: input.notes,
        createdAt: new Date()
      }).returning();

      return result[0];
    }),

  /**
   * Get budgets for a farm
   */
  getBudgets: protectedProcedure
    .input(z.object({
      farmId: z.string()
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const results = await db
        .select()
        .from(budgets)
        .where(eq(budgets.farmId, input.farmId));

      return results;
    }),

  /**
   * Get budget vs actual spending
   */
  getBudgetVsActual: protectedProcedure
    .input(z.object({
      farmId: z.string(),
      budgetId: z.string()
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const budget = await db
        .select()
        .from(budgets)
        .where(eq(budgets.id, input.budgetId))
        .limit(1);

      if (!budget.length) {
        throw new Error("Budget not found");
      }

      const b = budget[0];
      const conditions = [
        eq(expenses.farmId, input.farmId),
        eq(expenses.category, b.category),
        gte(expenses.date, b.startDate),
        lte(expenses.date, b.endDate)
      ];

      const expenseResult = await db
        .select({ total: sum(expenses.amount) })
        .from(expenses)
        .where(and(...conditions));

      const spent = Number(expenseResult[0]?.total || 0);
      const remaining = b.allocatedAmount - spent;
      const percentageUsed = (spent / b.allocatedAmount) * 100;

      return {
        budgetId: input.budgetId,
        budgetName: b.name,
        allocatedAmount: b.allocatedAmount,
        spent,
        remaining,
        percentageUsed,
        status: percentageUsed > 100 ? "over_budget" : percentageUsed > 80 ? "warning" : "on_track"
      };
    }),

  /**
   * Create an invoice
   */
  createInvoice: protectedProcedure
    .input(z.object({
      farmId: z.string(),
      invoiceNumber: z.string(),
      clientName: z.string(),
      items: z.array(z.object({
        description: z.string(),
        quantity: z.number(),
        unitPrice: z.number(),
        amount: z.number()
      })),
      totalAmount: z.number(),
      dueDate: z.date(),
      notes: z.string().optional()
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const result = await db.insert(invoices).values({
        farmId: input.farmId,
        userId: ctx.user.id,
        invoiceNumber: input.invoiceNumber,
        clientName: input.clientName,
        items: input.items,
        totalAmount: input.totalAmount,
        dueDate: input.dueDate,
        status: "draft",
        notes: input.notes,
        createdAt: new Date()
      }).returning();

      return result[0];
    }),

  /**
   * Get invoices for a farm
   */
  getInvoices: protectedProcedure
    .input(z.object({
      farmId: z.string(),
      status: z.string().optional()
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const conditions = [eq(invoices.farmId, input.farmId)];
      
      if (input.status) {
        conditions.push(eq(invoices.status, input.status as any));
      }

      const results = await db
        .select()
        .from(invoices)
        .where(and(...conditions));

      return results;
    }),

  /**
   * Update invoice status
   */
  updateInvoiceStatus: protectedProcedure
    .input(z.object({
      invoiceId: z.string(),
      status: z.enum(["draft", "sent", "paid", "overdue", "cancelled"])
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const result = await db
        .update(invoices)
        .set({ status: input.status })
        .where(eq(invoices.id, input.invoiceId))
        .returning();

      return result[0];
    }),

  /**
   * Get expense breakdown by category
   */
  getExpenseBreakdown: protectedProcedure
    .input(z.object({
      farmId: z.string(),
      startDate: z.date().optional(),
      endDate: z.date().optional()
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const conditions = [eq(expenses.farmId, input.farmId)];
      
      if (input.startDate) {
        conditions.push(gte(expenses.date, input.startDate));
      }
      if (input.endDate) {
        conditions.push(lte(expenses.date, input.endDate));
      }

      const results = await db
        .select()
        .from(expenses)
        .where(and(...conditions));

      // Group by category
      const breakdown: Record<string, number> = {};
      results.forEach(exp => {
        breakdown[exp.category] = (breakdown[exp.category] || 0) + exp.amount;
      });

      const total = Object.values(breakdown).reduce((a, b) => a + b, 0);
      const percentages: Record<string, number> = {};
      
      Object.entries(breakdown).forEach(([category, amount]) => {
        percentages[category] = total > 0 ? (amount / total) * 100 : 0;
      });

      return {
        breakdown,
        percentages,
        total,
        categories: Object.keys(breakdown)
      };
    }),

  /**
   * Get revenue breakdown by source
   */
  getRevenueBreakdown: protectedProcedure
    .input(z.object({
      farmId: z.string(),
      startDate: z.date().optional(),
      endDate: z.date().optional()
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const conditions = [eq(revenue.farmId, input.farmId)];
      
      if (input.startDate) {
        conditions.push(gte(revenue.date, input.startDate));
      }
      if (input.endDate) {
        conditions.push(lte(revenue.date, input.endDate));
      }

      const results = await db
        .select()
        .from(revenue)
        .where(and(...conditions));

      // Group by source
      const breakdown: Record<string, number> = {};
      results.forEach(rev => {
        breakdown[rev.source] = (breakdown[rev.source] || 0) + rev.amount;
      });

      const total = Object.values(breakdown).reduce((a, b) => a + b, 0);
      const percentages: Record<string, number> = {};
      
      Object.entries(breakdown).forEach(([source, amount]) => {
        percentages[source] = total > 0 ? (amount / total) * 100 : 0;
      });

      return {
        breakdown,
        percentages,
        total,
        sources: Object.keys(breakdown)
      };
    })
});
