import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { eq, and, gte, lte, sum, inArray } from "drizzle-orm";
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
      expenseType: z.enum(["feed", "medication", "labor", "equipment", "utilities", "transport", "veterinary", "fertilizer", "seeds", "pesticides", "water", "rent", "insurance", "maintenance", "other"]),
      description: z.string(),
      amount: z.number().positive(),
      expenseDate: z.date(),
      animalId: z.string().optional(),
      quantity: z.number().optional(),
      unitCost: z.number().optional(),
      vendor: z.string().optional(),
      invoiceNumber: z.string().optional(),
      paymentStatus: z.enum(["pending", "paid", "partial"]).optional(),
      paymentDate: z.date().optional(),
      notes: z.string().optional()
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // DEBUG: Log the input received by the router
      console.log("DEBUG: Router received input:", input);
      console.log("DEBUG: expenseType in router:", input.expenseType);
      console.log("DEBUG: expenseType type in router:", typeof input.expenseType);
      
      const expenseDateStr = input.expenseDate instanceof Date 
        ? input.expenseDate.toISOString().split('T')[0]
        : input.expenseDate.toString();
      
      const paymentDateStr = input.paymentDate && input.paymentDate instanceof Date
        ? input.paymentDate.toISOString().split('T')[0]
        : input.paymentDate?.toString();
      
      const [result] = await db.insert(expenses).values({
        farmId: parseInt(input.farmId),
        expenseType: input.expenseType,
        description: input.description,
        amount: input.amount,
        expenseDate: expenseDateStr,
        animalId: input.animalId ? parseInt(input.animalId) : undefined,
        quantity: input.quantity,
        unitCost: input.unitCost,
        vendor: input.vendor,
        invoiceNumber: input.invoiceNumber,
        paymentStatus: input.paymentStatus || "pending",
        paymentDate: paymentDateStr,
        notes: input.notes
      });

      return result;
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
      
      const farmIds = input.farmId.split(",").map(id => parseInt(id.trim()));
      const conditions = [farmIds.length > 1 ? inArray(expenses.farmId, farmIds) : eq(expenses.farmId, farmIds[0])];
      if (input.category) conditions.push(eq(expenses.expenseType, input.category));
      if (input.startDate) conditions.push(gte(expenses.expenseDate, input.startDate));
      if (input.endDate) conditions.push(lte(expenses.expenseDate, input.endDate));

      const result = await db
        .select()
        .from(expenses)
        .where(and(...conditions))
        .limit(input.limit)
        .offset(input.offset);

      return result;
    }),

  /**
   * Create a new revenue record
   */
  createRevenue: protectedProcedure
    .input(z.object({
      farmId: z.string(),
      revenueType: z.enum(["animal_sale", "milk_production", "egg_production", "wool_production", "meat_sale", "crop_sale", "produce_sale", "breeding_service", "other"]),
      description: z.string(),
      amount: z.number().positive(),
      revenueDate: z.date(),
      animalId: z.string().optional(),
      cropId: z.string().optional(),
      quantity: z.number().optional(),
      unitPrice: z.number().optional(),
      buyer: z.string().optional(),
      invoiceNumber: z.string().optional(),
      paymentStatus: z.enum(["pending", "paid", "partial"]).optional(),
      paymentDate: z.date().optional(),
      notes: z.string().optional()
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const revenueDateStr = input.revenueDate instanceof Date 
        ? input.revenueDate.toISOString().split('T')[0]
        : input.revenueDate.toString();
      
      const paymentDateStr = input.paymentDate && input.paymentDate instanceof Date
        ? input.paymentDate.toISOString().split('T')[0]
        : input.paymentDate?.toString();
      
      const [result] = await db.insert(revenue).values({
        farmId: parseInt(input.farmId),
        revenueType: input.revenueType,
        description: input.description,
        amount: input.amount,
        revenueDate: revenueDateStr,
        animalId: input.animalId ? parseInt(input.animalId) : undefined,
        cropId: input.cropId ? parseInt(input.cropId) : undefined,
        quantity: input.quantity,
        unitPrice: input.unitPrice,
        buyer: input.buyer,
        invoiceNumber: input.invoiceNumber,
        paymentStatus: input.paymentStatus || "pending",
        paymentDate: paymentDateStr,
        notes: input.notes
      });

      return result;
    }),

  /**
   * Get revenue records for a farm
   */
  getRevenue: protectedProcedure
    .input(z.object({
      farmId: z.string(),
      revenueType: z.string().optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      limit: z.number().default(50),
      offset: z.number().default(0)
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const farmIds = input.farmId.split(",").map(id => parseInt(id.trim()));
      const conditions = [farmIds.length > 1 ? inArray(revenue.farmId, farmIds) : eq(revenue.farmId, farmIds[0])];
      if (input.revenueType) conditions.push(eq(revenue.revenueType, input.revenueType));
      if (input.startDate) conditions.push(gte(revenue.revenueDate, input.startDate));
      if (input.endDate) conditions.push(lte(revenue.revenueDate, input.endDate));

      const result = await db
        .select()
        .from(revenue)
        .where(and(...conditions))
        .limit(input.limit)
        .offset(input.offset);

      return result;
    }),

  /**
   * Get financial summary (total revenue, expenses, profit, margin)
   * Supports single farm or multiple farms (comma-separated)
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

      // Support multiple farms (comma-separated)
      const farmIds = input.farmId.split(",").map(id => parseInt(id.trim()));
      const expenseConditions = [farmIds.length > 1 ? inArray(expenses.farmId, farmIds) : eq(expenses.farmId, farmIds[0])];
      const revenueConditions = [farmIds.length > 1 ? inArray(revenue.farmId, farmIds) : eq(revenue.farmId, farmIds[0])];

      if (input.startDate) {
        expenseConditions.push(gte(expenses.expenseDate, input.startDate));
        revenueConditions.push(gte(revenue.revenueDate, input.startDate));
      }
      if (input.endDate) {
        expenseConditions.push(lte(expenses.expenseDate, input.endDate));
        revenueConditions.push(lte(revenue.revenueDate, input.endDate));
      }

      const expenseResult = await db
        .select({ total: sum(expenses.amount) })
        .from(expenses)
        .where(and(...expenseConditions));

      const revenueResult = await db
        .select({ total: sum(revenue.amount) })
        .from(revenue)
        .where(and(...revenueConditions));

      const totalExpenses = parseFloat(expenseResult[0]?.total || 0);
      const totalRevenue = parseFloat(revenueResult[0]?.total || 0);
      const profit = totalRevenue - totalExpenses;
      const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

      return {
        totalRevenue,
        totalExpenses,
        profit,
        profitMargin
      };
    }),

  /**
   * Calculate cost per animal
   */
  calculateCostPerAnimal: protectedProcedure
    .input(z.object({
      farmId: z.string(),
      startDate: z.date().optional(),
      endDate: z.date().optional()
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const farmIds = input.farmId.split(",").map(id => parseInt(id.trim()));
      const conditions = [farmIds.length > 1 ? inArray(expenses.farmId, farmIds) : eq(expenses.farmId, farmIds[0])];
      if (input.startDate) conditions.push(gte(expenses.expenseDate, input.startDate));
      if (input.endDate) conditions.push(lte(expenses.expenseDate, input.endDate));

      const expenseResult = await db
        .select({ total: sum(expenses.amount) })
        .from(expenses)
        .where(and(...conditions));

      const totalExpenses = parseFloat(expenseResult[0]?.total || 0);
      
      // Get count of unique animals
      const animalCount = 0; // Placeholder - would need animals table
      const costPerAnimal = animalCount > 0 ? totalExpenses / animalCount : 0;

      return {
        totalExpenses,
        totalAnimals: animalCount,
        averageCostPerAnimal: costPerAnimal
      };
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

      const farmIds = input.farmId.split(",").map(id => parseInt(id.trim()));
      const conditions = [farmIds.length > 1 ? inArray(expenses.farmId, farmIds) : eq(expenses.farmId, farmIds[0])];
      if (input.startDate) conditions.push(gte(expenses.expenseDate, input.startDate));
      if (input.endDate) conditions.push(lte(expenses.expenseDate, input.endDate));

      const result = await db
        .select()
        .from(expenses)
        .where(and(...conditions));

      const breakdown: Record<string, number> = {};
      let total = 0;

      result.forEach(exp => {
        const amount = parseFloat(exp.amount);
        breakdown[exp.category] = (breakdown[exp.category] || 0) + amount;
        total += amount;
      });

      const percentages: Record<string, number> = {};
      Object.keys(breakdown).forEach(cat => {
        percentages[cat] = total > 0 ? (breakdown[cat] / total) * 100 : 0;
      });

      return { breakdown, percentages, total };
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

      const farmIds = input.farmId.split(",").map(id => parseInt(id.trim()));
      const conditions = [farmIds.length > 1 ? inArray(revenue.farmId, farmIds) : eq(revenue.farmId, farmIds[0])];
      if (input.startDate) conditions.push(gte(revenue.revenueDate, input.startDate));
      if (input.endDate) conditions.push(lte(revenue.revenueDate, input.endDate));

      const result = await db
        .select()
        .from(revenue)
        .where(and(...conditions));

      const breakdown: Record<string, number> = {};
      let total = 0;

      result.forEach(rev => {
        const amount = parseFloat(rev.amount);
        breakdown[rev.revenueType] = (breakdown[rev.revenueType] || 0) + amount;
        total += amount;
      });

      const percentages: Record<string, number> = {};
      Object.keys(breakdown).forEach(src => {
        percentages[src] = total > 0 ? (breakdown[src] / total) * 100 : 0;
      });

      return { breakdown, percentages, total };
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
      
      const [result] = await db.insert(budgets).values({
        farmId: parseInt(input.farmId),
        name: input.name,
        category: input.category,
        allocatedAmount: input.allocatedAmount,
        startDate: input.startDate,
        endDate: input.endDate,
        notes: input.notes
      });

      return result;
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
      
      const result = await db
        .select()
        .from(budgets)
        .where(eq(budgets.farmId, parseInt(input.farmId)));

      return result;
    }),

  /**
   * Get budget vs actual spending
   */
  getBudgetVsActual: protectedProcedure
    .input(z.object({
      farmId: z.string(),
      startDate: z.date().optional(),
      endDate: z.date().optional()
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const budgetList = await db
        .select()
        .from(budgets)
        .where(eq(budgets.farmId, parseInt(input.farmId)));

      const expenseConditions = [eq(expenses.farmId, parseInt(input.farmId))];
      if (input.startDate) expenseConditions.push(gte(expenses.expenseDate, input.startDate));
      if (input.endDate) expenseConditions.push(lte(expenses.expenseDate, input.endDate));

      const expenseList = await db
        .select()
        .from(expenses)
        .where(and(...expenseConditions));

      const comparison = budgetList.map(budget => {
        const spent = expenseList
          .filter(exp => exp.category === budget.category)
          .reduce((sum, exp) => sum + parseFloat(exp.amount), 0);

        const allocated = parseFloat(budget.allocatedAmount);
        const variance = allocated - spent;
        const variancePercent = allocated > 0 ? (variance / allocated) * 100 : 0;

        return {
          category: budget.category,
          allocated,
          spent,
          remaining: variance,
          variancePercent
        };
      });

      return comparison;
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
      
      const [result] = await db.insert(invoices).values({
        farmId: parseInt(input.farmId),
        invoiceNumber: input.invoiceNumber,
        clientName: input.clientName,
        items: JSON.stringify(input.items),
        totalAmount: input.totalAmount,
        dueDate: input.dueDate,
        status: "draft",
        notes: input.notes
      });

      return result;
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
      
      const conditions = [eq(invoices.farmId, parseInt(input.farmId))];
      if (input.status) conditions.push(eq(invoices.status, input.status));

      const result = await db
        .select()
        .from(invoices)
        .where(and(...conditions));

      return result;
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
      
      const [result] = await db
        .update(invoices)
        .set({ status: input.status })
        .where(eq(invoices.id, parseInt(input.invoiceId)));

      return result;
    })
});
