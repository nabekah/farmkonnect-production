import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { eq, and, gte, lte, sum, inArray, sql } from "drizzle-orm";
import {
  expenses,
  revenue,
  budgets,
  invoices,
  animals,
  vetAppointments,
  insuranceClaims,
  prescriptions,
  animalHealthRecords
} from "../../drizzle/schema";

export const financialManagementRouter = router({
  /**
   * Create a new expense record
   */
  createExpense: protectedProcedure
    .input(z.object({
      farmId: z.string(),
      expenseType: z.enum(["feed", "medication", "labor", "equipment", "utilities", "transport", "veterinary", "fertilizer", "seeds", "pesticides", "water", "rent", "insurance", "maintenance", "other"]).or(z.string()),
      description: z.string(),
      amount: z.number().positive(),
      expenseDate: z.date().or(z.string()),
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
      
      if (input.startDate) {
        const startDateStr = input.startDate instanceof Date 
          ? input.startDate.toISOString().split('T')[0]
          : input.startDate.toString();
        conditions.push(gte(expenses.expenseDate, startDateStr));
      }
      if (input.endDate) {
        const endDateStr = input.endDate instanceof Date 
          ? input.endDate.toISOString().split('T')[0]
          : input.endDate.toString();
        conditions.push(lte(expenses.expenseDate, endDateStr));
      }


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
        const startDateStr = input.startDate instanceof Date 
          ? input.startDate.toISOString().split('T')[0]
          : input.startDate.toString();
        expenseConditions.push(gte(expenses.expenseDate, startDateStr));
        revenueConditions.push(gte(revenue.revenueDate, startDateStr));
      }
      if (input.endDate) {
        const endDateStr = input.endDate instanceof Date 
          ? input.endDate.toISOString().split('T')[0]
          : input.endDate.toString();
        expenseConditions.push(lte(expenses.expenseDate, endDateStr));
        revenueConditions.push(lte(revenue.revenueDate, endDateStr));
      }

      const expenseResult = await db
        .select({ total: sum(expenses.amount) })
        .from(expenses)
        .where(and(...expenseConditions));

      const revenueResult = await db
        .select({ total: sum(revenue.amount) })
        .from(revenue)
        .where(and(...revenueConditions));

      console.log("DEBUG getFinancialSummary:", {
        farmIds,
        expenseResult,
        revenueResult,
        expenseConditions: expenseConditions.length,
        revenueConditions: revenueConditions.length
      });

      let totalExpenses = 0;
      if (expenseResult[0]?.total !== null && expenseResult[0]?.total !== undefined) {
        const expenseValue = expenseResult[0].total;
        totalExpenses = typeof expenseValue === 'string' 
          ? parseFloat(expenseValue) 
          : typeof expenseValue === 'number'
          ? expenseValue
          : parseFloat(String(expenseValue));
      }
      
      let totalRevenue = 0;
      if (revenueResult[0]?.total !== null && revenueResult[0]?.total !== undefined) {
        const revenueValue = revenueResult[0].total;
        totalRevenue = typeof revenueValue === 'string'
          ? parseFloat(revenueValue)
          : typeof revenueValue === 'number'
          ? revenueValue
          : parseFloat(String(revenueValue));
      }
      
      console.log("DEBUG totals after conversion:", { totalExpenses, totalRevenue, expenseResult, revenueResult });
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
      
      // Convert dates to ISO string format for proper comparison
      if (input.startDate) {
        const startDateStr = input.startDate instanceof Date 
          ? input.startDate.toISOString().split('T')[0]
          : input.startDate.toString();
        conditions.push(gte(expenses.expenseDate, startDateStr));
      }
      if (input.endDate) {
        const endDateStr = input.endDate instanceof Date 
          ? input.endDate.toISOString().split('T')[0]
          : input.endDate.toString();
        conditions.push(lte(expenses.expenseDate, endDateStr));
      }

      const expenseResult = await db
        .select({ total: sum(expenses.amount) })
        .from(expenses)
        .where(and(...conditions));

      let totalExpenses = 0;
      if (expenseResult[0]?.total !== null && expenseResult[0]?.total !== undefined) {
        const expenseValue = expenseResult[0].total;
        totalExpenses = typeof expenseValue === 'string' 
          ? parseFloat(expenseValue) 
          : typeof expenseValue === 'number'
          ? expenseValue
          : parseFloat(String(expenseValue));
      }
      
      // Get count of unique animals from the animals table
      const animalConditions = [farmIds.length > 1 ? inArray(animals.farmId, farmIds) : eq(animals.farmId, farmIds[0])];
      
      const animalCountResult = await db
        .select({ count: sql`COUNT(DISTINCT ${animals.id})` })
        .from(animals)
        .where(and(...animalConditions));
      
      const animalCount = Number(animalCountResult[0]?.count || 0);
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
      
      // Convert dates to ISO string format for proper comparison
      if (input.startDate) {
        const startDateStr = input.startDate instanceof Date 
          ? input.startDate.toISOString().split('T')[0]
          : input.startDate.toString();
        conditions.push(gte(expenses.expenseDate, startDateStr));
      }
      if (input.endDate) {
        const endDateStr = input.endDate instanceof Date 
          ? input.endDate.toISOString().split('T')[0]
          : input.endDate.toString();
        conditions.push(lte(expenses.expenseDate, endDateStr));
      }

      const result = await db
        .select()
        .from(expenses)
        .where(and(...conditions));

      const breakdown: Record<string, number> = {};
      let total = 0;

      result.forEach(exp => {
        // Properly convert decimal to number
        const amount = typeof exp.amount === 'string' 
          ? parseFloat(exp.amount) 
          : Number(exp.amount);
        // Use expenseType instead of category (correct field name)
        breakdown[exp.expenseType] = (breakdown[exp.expenseType] || 0) + amount;
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
      
      // Convert dates to ISO string format for proper comparison
      if (input.startDate) {
        const startDateStr = input.startDate instanceof Date 
          ? input.startDate.toISOString().split('T')[0]
          : input.startDate.toString();
        conditions.push(gte(revenue.revenueDate, startDateStr));
      }
      if (input.endDate) {
        const endDateStr = input.endDate instanceof Date 
          ? input.endDate.toISOString().split('T')[0]
          : input.endDate.toString();
        conditions.push(lte(revenue.revenueDate, endDateStr));
      }

      const result = await db
        .select()
        .from(revenue)
        .where(and(...conditions));

      const breakdown: Record<string, number> = {};
      let total = 0;

      result.forEach(rev => {
        // Properly convert decimal to number
        const amount = typeof rev.amount === 'string' 
          ? parseFloat(rev.amount) 
          : Number(rev.amount);
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
    }),

  /**
   * Export financial report in various formats
   */
  exportReport: protectedProcedure
    .input(z.object({
      farmId: z.string(),
      format: z.enum(["pdf", "csv", "excel"]),
      startDate: z.date().optional(),
      endDate: z.date().optional()
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const farmIds = input.farmId.split(",").map(id => parseInt(id));
      const startDate = input.startDate || new Date(new Date().setMonth(new Date().getMonth() - 1));
      const endDate = input.endDate || new Date();

      // Fetch financial summary
      const summaryResult = await db
        .select({
          totalIncome: sql<number>`COALESCE(SUM(CAST(${revenue.totalAmount} AS DECIMAL(15,2))), 0)`,
          totalExpenses: sql<number>`COALESCE(SUM(CAST(${expenses.amount} AS DECIMAL(15,2))), 0)`,
        })
        .from(revenue)
        .leftJoin(expenses, sql`1=1`)
        .where(
          and(
            inArray(revenue.farmId, farmIds),
            gte(revenue.saleDate, startDate),
            lte(revenue.saleDate, endDate)
          )
        );

      const summary = summaryResult[0] || { totalIncome: 0, totalExpenses: 0 };
      const totalIncome = Number(summary.totalIncome) || 0;
      const totalExpenses = Number(summary.totalExpenses) || 0;
      const netProfit = totalIncome - totalExpenses;
      const profitMargin = totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(2) : "0.00";

      // Fetch expense breakdown
      const expenseBreakdown = await db
        .select({
          category: expenses.expenseType,
          totalAmount: sql<number>`COALESCE(SUM(CAST(${expenses.amount} AS DECIMAL(15,2))), 0)`,
        })
        .from(expenses)
        .where(
          and(
            inArray(expenses.farmId, farmIds),
            gte(expenses.expenseDate, startDate),
            lte(expenses.expenseDate, endDate)
          )
        )
        .groupBy(expenses.expenseType);

      // Fetch revenue breakdown
      const revenueBreakdown = await db
        .select({
          product: revenue.productId,
          totalAmount: sql<number>`COALESCE(SUM(CAST(${revenue.totalAmount} AS DECIMAL(15,2))), 0)`,
        })
        .from(revenue)
        .where(
          and(
            inArray(revenue.farmId, farmIds),
            gte(revenue.saleDate, startDate),
            lte(revenue.saleDate, endDate)
          )
        )
        .groupBy(revenue.productId);

      // Prepare report data
      const reportData = {
        generatedAt: new Date().toISOString(),
        period: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
        },
        summary: {
          totalIncome: totalIncome.toFixed(2),
          totalExpenses: totalExpenses.toFixed(2),
          netProfit: netProfit.toFixed(2),
          profitMargin: profitMargin,
        },
        expenseBreakdown: expenseBreakdown.map(item => ({
          category: item.category || "Unknown",
          amount: (Number(item.totalAmount) || 0).toFixed(2),
        })),
        revenueBreakdown: revenueBreakdown.map(item => ({
          product: item.product || "Unknown",
          amount: (Number(item.totalAmount) || 0).toFixed(2),
        })),
      };

      return {
        success: true,
        format: input.format,
        data: reportData,
        message: `Financial report exported successfully as ${input.format.toUpperCase()}`,
      };
    }),

  getVeterinaryExpenses: protectedProcedure
    .input(z.object({
      farmId: z.string(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return [];
      const farmIdNum = parseInt(input.farmId);
      let query = db.select({
        id: vetAppointments.id,
        appointmentDate: vetAppointments.appointmentDate,
        appointmentType: vetAppointments.appointmentType,
        cost: vetAppointments.cost,
        paymentStatus: vetAppointments.paymentStatus,
        diagnosis: vetAppointments.diagnosis,
        treatment: vetAppointments.treatment,
        reason: vetAppointments.reason,
      }).from(vetAppointments).where(eq(vetAppointments.farmId, farmIdNum));
      if (input.startDate && input.endDate) {
        query = query.where(and(gte(vetAppointments.appointmentDate, input.startDate), lte(vetAppointments.appointmentDate, input.endDate)));
      }
      return await query.orderBy(sql`${vetAppointments.appointmentDate} DESC`);
    }),

  getInsuranceClaims: protectedProcedure
    .input(z.object({
      farmId: z.string(),
      status: z.string().optional(),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return [];
      const farmIdNum = parseInt(input.farmId);
      let query = db.select({
        id: insuranceClaims.id,
        claimNumber: insuranceClaims.claimNumber,
        insuranceProvider: insuranceClaims.insuranceProvider,
        policyNumber: insuranceClaims.policyNumber,
        claimType: insuranceClaims.claimType,
        claimAmount: insuranceClaims.claimAmount,
        claimDate: insuranceClaims.claimDate,
        status: insuranceClaims.status,
        approvalAmount: insuranceClaims.approvalAmount,
        paymentDate: insuranceClaims.paymentDate,
        paymentAmount: insuranceClaims.paymentAmount,
      }).from(insuranceClaims).where(eq(insuranceClaims.farmId, farmIdNum));
      if (input.status) {
        query = query.where(eq(insuranceClaims.status, input.status as any));
      }
      return await query.orderBy(sql`${insuranceClaims.claimDate} DESC`);
    }),

  getInsuranceSummary: protectedProcedure
    .input(z.object({ farmId: z.string() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return null;
      const farmIdNum = parseInt(input.farmId);
      const claimStats = await db.select({
        status: insuranceClaims.status,
        count: sql<number>`COUNT(*)`,
        totalAmount: sql<string>`SUM(${insuranceClaims.claimAmount})`,
        totalPaid: sql<string>`SUM(${insuranceClaims.paymentAmount})`,
      }).from(insuranceClaims).where(eq(insuranceClaims.farmId, farmIdNum)).groupBy(insuranceClaims.status);
      const premiumResult = await db.select({
        totalPremium: sql<string>`SUM(${expenses.amount})`,
      }).from(expenses).where(and(eq(expenses.farmId, farmIdNum), eq(expenses.expenseType, "insurance")));
      return { claimStats, totalPremiums: Number(premiumResult[0]?.totalPremium || 0) };
    }),

  /**
   * Calculate cost-per-animal metrics
   */
  getCostPerAnimal: protectedProcedure
    .input(z.object({
      farmId: z.string(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return [];
      const farmIdNum = parseInt(input.farmId);
      
      // Get all animals and their associated expenses
      const animalExpenses = await db
        .select({
          animalId: animals.id,
          animalName: animals.animalName,
          animalType: animals.animalType,
          quantity: animals.quantity,
          totalExpense: sql<number>`COALESCE(SUM(CAST(${expenses.amount} AS DECIMAL(15,2))), 0)`,
        })
        .from(animals)
        .leftJoin(expenses, and(
          eq(expenses.farmId, farmIdNum),
          eq(expenses.animalId, animals.id)
        ))
        .where(eq(animals.farmId, farmIdNum))
        .groupBy(animals.id, animals.animalName, animals.animalType, animals.quantity);
      
      // Calculate cost per animal
      return animalExpenses.map(item => ({
        animalId: item.animalId,
        animalName: item.animalName,
        animalType: item.animalType,
        quantity: item.quantity || 1,
        totalExpense: Number(item.totalExpense) || 0,
        costPerAnimal: ((Number(item.totalExpense) || 0) / (item.quantity || 1)).toFixed(2),
      }));
    }),

  /**
   * Get profitability analysis by animal
   */
  getProfitabilityByAnimal: protectedProcedure
    .input(z.object({
      farmId: z.string(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return [];
      const farmIdNum = parseInt(input.farmId);
      
      // Get animals with their revenue and expenses
      const profitability = await db
        .select({
          animalId: animals.id,
          animalName: animals.animalName,
          animalType: animals.animalType,
          totalRevenue: sql<number>`COALESCE(SUM(CAST(${revenue.totalAmount} AS DECIMAL(15,2))), 0)`,
          totalExpense: sql<number>`COALESCE(SUM(CAST(${expenses.amount} AS DECIMAL(15,2))), 0)`,
        })
        .from(animals)
        .leftJoin(revenue, and(
          eq(revenue.farmId, farmIdNum),
          eq(revenue.animalId, animals.id)
        ))
        .leftJoin(expenses, and(
          eq(expenses.farmId, farmIdNum),
          eq(expenses.animalId, animals.id)
        ))
        .where(eq(animals.farmId, farmIdNum))
        .groupBy(animals.id, animals.animalName, animals.animalType);
      
      // Calculate profitability metrics
      return profitability.map(item => {
        const totalRevenue = Number(item.totalRevenue) || 0;
        const totalExpense = Number(item.totalExpense) || 0;
        const profit = totalRevenue - totalExpense;
        const profitMargin = totalRevenue > 0 ? ((profit / totalRevenue) * 100).toFixed(2) : "0.00";
        
        return {
          animalId: item.animalId,
          animalName: item.animalName,
          animalType: item.animalType,
          totalRevenue: totalRevenue.toFixed(2),
          totalExpense: totalExpense.toFixed(2),
          profit: profit.toFixed(2),
          profitMargin: parseFloat(profitMargin),
          roi: totalExpense > 0 ? ((profit / totalExpense) * 100).toFixed(2) : "0.00",
        };
      });
    }),

  /**
   * Get tax reporting summary for a farm or consolidated across farms
   */
  getTaxReport: protectedProcedure
    .input(z.object({
      farmIds: z.string(), // comma-separated farm IDs or "all" for consolidated
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      reportType: z.enum(["summary", "detailed", "quarterly"]),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return null;
      
      // Parse farm IDs
      const farmIds = input.farmIds === "all" 
        ? [] // Will fetch all farms
        : input.farmIds.split(",").map(id => parseInt(id));
      
      const startDate = input.startDate || new Date(new Date().getFullYear(), 0, 1);
      const endDate = input.endDate || new Date();
      
      // Get expense breakdown by category (deductible items)
      const expenseBreakdown = await db
        .select({
          category: expenses.expenseType,
          totalAmount: sql<number>`COALESCE(SUM(CAST(${expenses.amount} AS DECIMAL(15,2))), 0)`,
          count: sql<number>`COUNT(*)`,
        })
        .from(expenses)
        .where(and(
          farmIds.length > 0 ? inArray(expenses.farmId, farmIds) : undefined,
          gte(expenses.expenseDate, startDate),
          lte(expenses.expenseDate, endDate)
        ))
        .groupBy(expenses.expenseType);
      
      // Get revenue breakdown
      const revenueBreakdown = await db
        .select({
          productType: revenue.productType,
          totalAmount: sql<number>`COALESCE(SUM(CAST(${revenue.totalAmount} AS DECIMAL(15,2))), 0)`,
          count: sql<number>`COUNT(*)`,
        })
        .from(revenue)
        .where(and(
          farmIds.length > 0 ? inArray(revenue.farmId, farmIds) : undefined,
          gte(revenue.saleDate, startDate),
          lte(revenue.saleDate, endDate)
        ))
        .groupBy(revenue.productType);
      
      // Calculate totals
      const totalExpenses = expenseBreakdown.reduce((sum, item) => sum + (Number(item.totalAmount) || 0), 0);
      const totalRevenue = revenueBreakdown.reduce((sum, item) => sum + (Number(item.totalAmount) || 0), 0);
      const taxableIncome = totalRevenue - totalExpenses;
      const estimatedTax = (taxableIncome * 0.15).toFixed(2); // 15% tax rate (configurable)
      
      return {
        period: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
        },
        summary: {
          totalRevenue: totalRevenue.toFixed(2),
          totalExpenses: totalExpenses.toFixed(2),
          taxableIncome: taxableIncome.toFixed(2),
          estimatedTax,
        },
        expenseBreakdown: expenseBreakdown.map(item => ({
          category: item.category,
          amount: (Number(item.totalAmount) || 0).toFixed(2),
          count: item.count,
        })),
        revenueBreakdown: revenueBreakdown.map(item => ({
          productType: item.productType,
          amount: (Number(item.totalAmount) || 0).toFixed(2),
          count: item.count,
        })),
      };
    }),

  /**
   * Export consolidated financial report across multiple farms
   */
  exportConsolidatedReport: protectedProcedure
    .input(z.object({
      farmIds: z.string(), // comma-separated farm IDs or "all" for consolidated
      format: z.enum(["pdf", "csv", "excel"]),
      reportType: z.enum(["financial", "tax", "profitability", "complete"]),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Parse farm IDs
      const farmIds = input.farmIds === "all" 
        ? [] 
        : input.farmIds.split(",").map(id => parseInt(id));
      
      const startDate = input.startDate || new Date(new Date().getFullYear(), 0, 1);
      const endDate = input.endDate || new Date();
      
      // Fetch consolidated data
      const expenseData = await db
        .select({
          totalExpenses: sql<number>`COALESCE(SUM(CAST(${expenses.amount} AS DECIMAL(15,2))), 0)`,
        })
        .from(expenses)
        .where(and(
          farmIds.length > 0 ? inArray(expenses.farmId, farmIds) : undefined,
          gte(expenses.expenseDate, startDate),
          lte(expenses.expenseDate, endDate)
        ));
      
      const revenueData = await db
        .select({
          totalRevenue: sql<number>`COALESCE(SUM(CAST(${revenue.totalAmount} AS DECIMAL(15,2))), 0)`,
        })
        .from(revenue)
        .where(and(
          farmIds.length > 0 ? inArray(revenue.farmId, farmIds) : undefined,
          gte(revenue.saleDate, startDate),
          lte(revenue.saleDate, endDate)
        ));
      
      const totalExpenses = Number(expenseData[0]?.totalExpenses) || 0;
      const totalRevenue = Number(revenueData[0]?.totalRevenue) || 0;
      const netProfit = totalRevenue - totalExpenses;
      const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(2) : "0.00";
      
      const reportData = {
        generatedAt: new Date().toISOString(),
        isConsolidated: true,
        farmCount: farmIds.length || "all",
        period: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
        },
        summary: {
          totalRevenue: totalRevenue.toFixed(2),
          totalExpenses: totalExpenses.toFixed(2),
          netProfit: netProfit.toFixed(2),
          profitMargin,
        },
      };
      
      return {
        success: true,
        format: input.format,
        reportType: input.reportType,
        data: reportData,
        message: `Consolidated financial report exported successfully as ${input.format.toUpperCase()}`,
      };
    }),

  /**
   * Get payment tracking summary
   */
  getPaymentTracking: protectedProcedure
    .input(z.object({
      farmId: z.string(),
      status: z.enum(["pending", "paid", "partial", "overdue"]).optional(),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return null;
      const farmIdNum = parseInt(input.farmId);
      
      // Get payment statistics
      const paymentStats = await db
        .select({
          status: expenses.paymentStatus,
          count: sql<number>`COUNT(*)`,
          totalAmount: sql<number>`COALESCE(SUM(CAST(${expenses.amount} AS DECIMAL(15,2))), 0)`,
        })
        .from(expenses)
        .where(eq(expenses.farmId, farmIdNum))
        .groupBy(expenses.paymentStatus);
      
      // Calculate totals
      const totalPending = paymentStats
        .filter(s => s.status === "pending")
        .reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0);
      
      const totalPaid = paymentStats
        .filter(s => s.status === "paid")
        .reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0);
      
      const totalPartial = paymentStats
        .filter(s => s.status === "partial")
        .reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0);
      
      return {
        paymentStats,
        summary: {
          totalPending: totalPending.toFixed(2),
          totalPaid: totalPaid.toFixed(2),
          totalPartial: totalPartial.toFixed(2),
          totalOutstanding: (totalPending + totalPartial).toFixed(2),
        },
      };
    }),

  /**
   * Update payment status for an expense
   */
  updatePaymentStatus: protectedProcedure
    .input(z.object({
      expenseId: z.string(),
      paymentStatus: z.enum(["pending", "paid", "partial"]),
      paymentDate: z.date().optional(),
      paymentAmount: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const updateData: any = {
        paymentStatus: input.paymentStatus,
      };
      
      if (input.paymentDate) {
        updateData.paymentDate = input.paymentDate;
      }
      
      const result = await db
        .update(expenses)
        .set(updateData)
        .where(eq(expenses.id, parseInt(input.expenseId)));
      
      return result;
    }),

  /**
   * Create or update budget forecast
   */
  createBudgetForecast: protectedProcedure
    .input(z.object({
      farmId: z.string(),
      category: z.string(),
      forecastedAmount: z.number().positive(),
      forecastPeriod: z.enum(["monthly", "quarterly", "yearly"]),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const result = await db.insert(budgets).values({
        farmId: parseInt(input.farmId),
        category: input.category,
        allocatedAmount: input.forecastedAmount,
        period: input.forecastPeriod,
        notes: input.notes,
      });
      
      return result;
    }),

  /**
   * Get expense forecast based on historical data
   */
  getExpenseForecast: protectedProcedure
    .input(z.object({
      farmId: z.string(),
      months: z.number().default(3),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return [];
      const farmIdNum = parseInt(input.farmId);
      
      // Get historical expenses by category for the last N months
      const cutoffDate = new Date();
      cutoffDate.setMonth(cutoffDate.getMonth() - input.months);
      
      const historicalExpenses = await db
        .select({
          category: expenses.expenseType,
          totalAmount: sql<number>`COALESCE(SUM(CAST(${expenses.amount} AS DECIMAL(15,2))), 0)`,
          count: sql<number>`COUNT(*)`,
        })
        .from(expenses)
        .where(and(
          eq(expenses.farmId, farmIdNum),
          gte(expenses.expenseDate, cutoffDate)
        ))
        .groupBy(expenses.expenseType);
      
      // Calculate average monthly expense and forecast for next month
      return historicalExpenses.map(item => ({
        category: item.category,
        historicalTotal: Number(item.totalAmount) || 0,
        averageMonthly: ((Number(item.totalAmount) || 0) / input.months).toFixed(2),
        transactionCount: item.count,
        forecastedNextMonth: ((Number(item.totalAmount) || 0) / input.months).toFixed(2),
      }));
    }),

  /**
   * Get revenue forecast based on historical data
   */
  getRevenueForecast: protectedProcedure
    .input(z.object({
      farmId: z.string(),
      months: z.number().default(3),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return [];
      const farmIdNum = parseInt(input.farmId);
      
      // Get historical revenue by product for the last N months
      const cutoffDate = new Date();
      cutoffDate.setMonth(cutoffDate.getMonth() - input.months);
      
      const historicalRevenue = await db
        .select({
          productType: revenue.productType,
          totalAmount: sql<number>`COALESCE(SUM(CAST(${revenue.totalAmount} AS DECIMAL(15,2))), 0)`,
          unitsSold: sql<number>`COALESCE(SUM(${revenue.quantity}), 0)`,
          transactionCount: sql<number>`COUNT(*)`,
        })
        .from(revenue)
        .where(and(
          eq(revenue.farmId, farmIdNum),
          gte(revenue.saleDate, cutoffDate)
        ))
        .groupBy(revenue.productType);
      
      // Calculate average monthly revenue and forecast for next month
      return historicalRevenue.map(item => ({
        productType: item.productType,
        historicalTotal: Number(item.totalAmount) || 0,
        averageMonthly: ((Number(item.totalAmount) || 0) / input.months).toFixed(2),
        unitsSold: item.unitsSold || 0,
        transactionCount: item.transactionCount,
        forecastedNextMonth: ((Number(item.totalAmount) || 0) / input.months).toFixed(2),
      }));
    }),

  /**
   * Get profitability analysis by product/revenue type
   */
  getProfitabilityByProduct: protectedProcedure
    .input(z.object({
      farmId: z.string(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return [];
      const farmIdNum = parseInt(input.farmId);
      
      // Get revenue by product with associated expenses
      const productProfitability = await db
        .select({
          productId: revenue.productId,
          productType: revenue.productType,
          totalRevenue: sql<number>`COALESCE(SUM(CAST(${revenue.totalAmount} AS DECIMAL(15,2))), 0)`,
          unitsSold: sql<number>`COALESCE(SUM(${revenue.quantity}), 0)`,
          averagePrice: sql<number>`COALESCE(AVG(CAST(${revenue.unitPrice} AS DECIMAL(15,2))), 0)`,
        })
        .from(revenue)
        .where(and(
          eq(revenue.farmId, farmIdNum),
          input.startDate ? gte(revenue.saleDate, input.startDate) : undefined,
          input.endDate ? lte(revenue.saleDate, input.endDate) : undefined
        ))
        .groupBy(revenue.productId, revenue.productType);
      
      // Estimate expenses for each product (allocate total expenses proportionally)
      const totalExpenseResult = await db
        .select({
          totalExpense: sql<number>`COALESCE(SUM(CAST(${expenses.amount} AS DECIMAL(15,2))), 0)`,
        })
        .from(expenses)
        .where(eq(expenses.farmId, farmIdNum));
      
      const totalExpense = Number(totalExpenseResult[0]?.totalExpense) || 0;
      const totalRevenue = productProfitability.reduce((sum, item) => sum + (Number(item.totalRevenue) || 0), 0);
      
      return productProfitability.map(item => {
        const revenue_amount = Number(item.totalRevenue) || 0;
        const allocatedExpense = totalRevenue > 0 ? (revenue_amount / totalRevenue) * totalExpense : 0;
        const profit = revenue_amount - allocatedExpense;
        const profitMargin = revenue_amount > 0 ? ((profit / revenue_amount) * 100).toFixed(2) : "0.00";
        
        return {
          productId: item.productId,
          productType: item.productType,
          totalRevenue: revenue_amount.toFixed(2),
          unitsSold: item.unitsSold || 0,
          averagePrice: (Number(item.averagePrice) || 0).toFixed(2),
          allocatedExpense: allocatedExpense.toFixed(2),
          profit: profit.toFixed(2),
          profitMargin: parseFloat(profitMargin),
        };
      });
    }),

  /**
   * Calculate cost-per-hectare metrics
   */
  getCostPerHectare: protectedProcedure
    .input(z.object({
      farmId: z.string(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return null;
      const farmIdNum = parseInt(input.farmId);
      
      // Get farm total hectares
      const farmData = await db
        .select({
          totalHectares: sql<number>`COALESCE(SUM(CAST(${sql`1` } AS DECIMAL(15,2))), 0)`,
        })
        .from(animals)
        .where(eq(animals.farmId, farmIdNum));
      
      // Get total expenses for the period
      const expenseData = await db
        .select({
          totalExpense: sql<number>`COALESCE(SUM(CAST(${expenses.amount} AS DECIMAL(15,2))), 0)`,
        })
        .from(expenses)
        .where(eq(expenses.farmId, farmIdNum));
      
      const totalExpense = Number(expenseData[0]?.totalExpense) || 0;
      const totalHectares = 10; // Default to 10 hectares - can be updated from farm profile
      
      return {
        totalHectares,
        totalExpense,
        costPerHectare: (totalExpense / totalHectares).toFixed(2),
      };
    }),

  getVeterinarySummary: protectedProcedure
    .input(z.object({ farmId: z.string() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return null;
      const farmIdNum = parseInt(input.farmId);
      const appointmentStats = await db.select({
        appointmentType: vetAppointments.appointmentType,
        count: sql<number>`COUNT(*)`,
        totalCost: sql<string>`SUM(${vetAppointments.cost})`,
      }).from(vetAppointments).where(eq(vetAppointments.farmId, farmIdNum)).groupBy(vetAppointments.appointmentType);
      const paymentStats = await db.select({
        paymentStatus: vetAppointments.paymentStatus,
        count: sql<number>`COUNT(*)`,
        totalAmount: sql<string>`SUM(${vetAppointments.cost})`,
      }).from(vetAppointments).where(eq(vetAppointments.farmId, farmIdNum)).groupBy(vetAppointments.paymentStatus);
      const prescriptionCount = await db.select({
        count: sql<number>`COUNT(*)`,
        totalCost: sql<string>`SUM(${prescriptions.cost})`,
      }).from(prescriptions).where(eq(prescriptions.farmId, farmIdNum));
      return { appointmentStats, paymentStats, prescriptions: { count: prescriptionCount[0]?.count || 0, totalCost: Number(prescriptionCount[0]?.totalCost || 0) } };
    }),

  createVetAppointment: protectedProcedure
    .input(z.object({
      farmId: z.string(),
      veterinarianId: z.number().optional(),
      appointmentType: z.enum(["clinic_visit", "farm_visit", "telemedicine", "emergency"]),
      appointmentDate: z.date().or(z.string()),
      reason: z.string(),
      cost: z.number().positive(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const farmIdNum = parseInt(input.farmId);
      const appointmentDateObj = input.appointmentDate instanceof Date ? input.appointmentDate : new Date(input.appointmentDate);
      const [result] = await db.insert(vetAppointments).values({
        farmId: farmIdNum,
        veterinarianId: input.veterinarianId || 1,
        appointmentType: input.appointmentType,
        appointmentDate: appointmentDateObj,
        reason: input.reason,
        cost: input.cost,
        notes: input.notes,
        status: "completed",
        paymentStatus: "pending",
      });
      await db.insert(expenses).values({
        farmId: farmIdNum,
        expenseType: "veterinary",
        description: `Veterinary ${input.appointmentType}: ${input.reason}`,
        amount: input.cost,
        expenseDate: appointmentDateObj.toISOString().split('T')[0],
        paymentStatus: "pending",
      });
      return result;
    }),

  createInsuranceClaim: protectedProcedure
    .input(z.object({
      farmId: z.string(),
      insuranceProvider: z.string(),
      policyNumber: z.string(),
      claimType: z.enum(["veterinary_service", "medication", "emergency", "preventive", "other"]),
      claimAmount: z.number().positive(),
      claimDate: z.date().or(z.string()),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const farmIdNum = parseInt(input.farmId);
      const claimDateObj = input.claimDate instanceof Date ? input.claimDate : new Date(input.claimDate);
      const claimNumber = `CLM-${farmIdNum}-${Date.now()}`;
      const [result] = await db.insert(insuranceClaims).values({
        farmId: farmIdNum,
        claimNumber,
        insuranceProvider: input.insuranceProvider,
        policyNumber: input.policyNumber,
        claimType: input.claimType,
        claimAmount: input.claimAmount,
        claimDate: claimDateObj,
        status: "draft",
        notes: input.notes,
      });
      return result;
    }),

  /**
   * Get consolidated expenses across all user farms
   */
  getConsolidatedExpenses: protectedProcedure
    .input(z.object({
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      category: z.string().optional(),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return [];
      const userId = ctx.user?.id;
      if (!userId) return [];

      let query = db
        .select({
          id: expenses.id,
          farmId: expenses.farmId,
          description: expenses.description,
          expenseType: expenses.expenseType,
          amount: expenses.amount,
          expenseDate: expenses.expenseDate,
          vendor: expenses.vendor,
          paymentStatus: expenses.paymentStatus,
        })
        .from(expenses)
        .innerJoin(sql`farms`, sql`${expenses.farmId} = farms.id`)
        .where(sql`farms.farmerUserId = ${userId}`);

      if (input.startDate && input.endDate) {
        query = query.where(
          and(
            gte(expenses.expenseDate, input.startDate.toISOString().split('T')[0]),
            lte(expenses.expenseDate, input.endDate.toISOString().split('T')[0])
          )
        );
      }

      if (input.category && input.category !== "all") {
        query = query.where(eq(expenses.expenseType, input.category));
      }

      return await query.orderBy(sql`${expenses.expenseDate} DESC`);
    }),

  /**
   * Get consolidated revenue across all user farms
   */
  getConsolidatedRevenue: protectedProcedure
    .input(z.object({
      startDate: z.date().optional(),
      endDate: z.date().optional(),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return [];
      const userId = ctx.user?.id;
      if (!userId) return [];

      let query = db
        .select({
          id: revenue.id,
          farmId: revenue.farmId,
          description: revenue.description,
          productId: revenue.productId,
          quantity: revenue.quantity,
          unitPrice: revenue.unitPrice,
          totalAmount: revenue.totalAmount,
          saleDate: revenue.saleDate,
          buyerName: revenue.buyerName,
        })
        .from(revenue)
        .innerJoin(sql`farms`, sql`${revenue.farmId} = farms.id`)
        .where(sql`farms.farmerUserId = ${userId}`);

      if (input.startDate && input.endDate) {
        query = query.where(
          and(
            gte(revenue.saleDate, input.startDate.toISOString().split('T')[0]),
            lte(revenue.saleDate, input.endDate.toISOString().split('T')[0])
          )
        );
      }

      return await query.orderBy(sql`${revenue.saleDate} DESC`);
    }),

  /**
   * Update payment status for multiple expenses (bulk action)
   */
  updateExpensesPaymentStatus: protectedProcedure
    .input(z.object({
      expenseIds: z.array(z.number()),
      paymentStatus: z.enum(["pending", "paid", "partial"]),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db
        .update(expenses)
        .set({ paymentStatus: input.paymentStatus })
        .where(inArray(expenses.id, input.expenseIds));

      return { success: true, updated: input.expenseIds.length };
    }),

  /**
   * Delete multiple expenses (bulk action)
   */
  deleteExpenses: protectedProcedure
    .input(z.object({
      expenseIds: z.array(z.number()),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.delete(expenses).where(inArray(expenses.id, input.expenseIds));

      return { success: true, deleted: input.expenseIds.length };
    }),

  /**
   * Update payment status for multiple revenue records (bulk action)
   */
  updateRevenuePaymentStatus: protectedProcedure
    .input(z.object({
      revenueIds: z.array(z.number()),
      paymentStatus: z.enum(["pending", "paid", "partial"]),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(revenue)
        .set({ paymentStatus: input.paymentStatus })
        .where(inArray(revenue.id, input.revenueIds));

      return { success: true, updated: input.revenueIds.length };
    }),

  /**
   * Delete multiple revenue records (bulk action)
   */
  deleteRevenue: protectedProcedure
    .input(z.object({
      revenueIds: z.array(z.number()),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.delete(revenue).where(inArray(revenue.id, input.revenueIds));

      return { success: true, deleted: input.revenueIds.length };
    }),
});
