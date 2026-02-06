import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { TRPCError } from "@trpc/server";
import { eq, and, gte, lte } from "drizzle-orm";
import { farmExpenses, farmRevenue, farmWorkers, farmAssets, fishPonds, fishStockingRecords, fishPondActivities } from "../drizzle/schema";

export const financialRouter = router({
  // ============================================================================
  // EXPENSES MANAGEMENT
  // ============================================================================
  expenses: router({
    list: protectedProcedure
      .input(z.object({
        farmId: z.number(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        category: z.string().optional(),
      }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];

        let whereConditions = [eq(farmExpenses.farmId, input.farmId)];
        
        if (input.startDate && input.endDate) {
          whereConditions.push(
            gte(farmExpenses.expenseDate, input.startDate),
            lte(farmExpenses.expenseDate, input.endDate)
          );
        }

        const expenses = await db.select().from(farmExpenses).where(and(...whereConditions));
        if (input.category) {
          return expenses.filter(e => e.category === input.category);
        }
        return expenses;
      }),

    create: protectedProcedure
      .input(z.object({
        farmId: z.number(),
        category: z.enum([
          "seeds",
          "fertilizers",
          "pesticides",
          "labor",
          "equipment",
          "fuel",
          "utilities",
          "maintenance",
          "feed",
          "veterinary",
          "other"
        ]),
        amount: z.number().positive(),
        expenseDate: z.date(),
        description: z.string().optional(),
        vendor: z.string().optional(),
        invoiceNumber: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        return await db.insert(farmExpenses).values({
          farmId: input.farmId,
          category: input.category,
          amount: input.amount.toString(),
          expenseDate: input.expenseDate,
          description: input.description,
          vendor: input.vendor,
          invoiceNumber: input.invoiceNumber,
        });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        category: z.string().optional(),
        amount: z.number().positive().optional(),
        description: z.string().optional(),
        vendor: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const { id, amount, ...rest } = input;
        const updateData: any = rest;
        if (amount !== undefined) {
          updateData.amount = amount.toString();
        }
        return await db.update(farmExpenses)
          .set(updateData)
          .where(eq(farmExpenses.id, id));
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        return await db.delete(farmExpenses).where(eq(farmExpenses.id, input.id));
      }),

    summary: protectedProcedure
      .input(z.object({
        farmId: z.number(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return { totalExpenses: 0, byCategory: {} };

        let whereConditions = [eq(farmExpenses.farmId, input.farmId)];
        
        if (input.startDate && input.endDate) {
          whereConditions.push(
            gte(farmExpenses.expenseDate, input.startDate),
            lte(farmExpenses.expenseDate, input.endDate)
          );
        }

        const expenses = await db.select().from(farmExpenses).where(and(...whereConditions));
        const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount || "0"), 0);
        
        const byCategory: Record<string, number> = {};
        expenses.forEach(e => {
          if (!byCategory[e.category]) byCategory[e.category] = 0;
          byCategory[e.category] += parseFloat(e.amount || "0");
        });

        return { totalExpenses, byCategory };
      }),
  }),

  // ============================================================================
  // REVENUE MANAGEMENT
  // ============================================================================
  revenue: router({
    list: protectedProcedure
      .input(z.object({
        farmId: z.number(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        source: z.string().optional(),
      }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];

        let whereConditions = [eq(farmRevenue.farmId, input.farmId)];
        
        if (input.startDate && input.endDate) {
          whereConditions.push(
            gte(farmRevenue.saleDate, input.startDate),
            lte(farmRevenue.saleDate, input.endDate)
          );
        }

        const revenues = await db.select().from(farmRevenue).where(and(...whereConditions));
        if (input.source) {
          return revenues.filter(r => r.source === input.source);
        }
        return revenues;
      }),

    create: protectedProcedure
      .input(z.object({
        farmId: z.number(),
        source: z.enum(["crop_sales", "livestock_sales", "fish_sales", "services", "other"]),
        amount: z.number().positive(),
        saleDate: z.date(),
        buyer: z.string().optional(),
        quantity: z.string().optional(),
        unit: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        return await db.insert(farmRevenue).values({
          farmId: input.farmId,
          source: input.source,
          amount: input.amount.toString(),
          saleDate: input.saleDate,
          buyer: input.buyer,
          quantity: input.quantity,
          unit: input.unit,
          notes: input.notes,
        });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        amount: z.number().positive().optional(),
        buyer: z.string().optional(),
        quantity: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const { id, amount, ...rest } = input;
        const updateData: any = rest;
        if (amount !== undefined) {
          updateData.amount = amount.toString();
        }
        return await db.update(farmRevenue)
          .set(updateData)
          .where(eq(farmRevenue.id, input.id));
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        return await db.delete(farmRevenue).where(eq(farmRevenue.id, input.id));
      }),

    summary: protectedProcedure
      .input(z.object({
        farmId: z.number(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return { totalRevenue: 0, bySource: {} };

        let whereConditions = [eq(farmRevenue.farmId, input.farmId)];
        
        if (input.startDate && input.endDate) {
          whereConditions.push(
            gte(farmRevenue.saleDate, input.startDate),
            lte(farmRevenue.saleDate, input.endDate)
          );
        }

        const revenues = await db.select().from(farmRevenue).where(and(...whereConditions));
        const totalRevenue = revenues.reduce((sum, r) => sum + parseFloat(r.amount || "0"), 0);
        
        const bySource: Record<string, number> = {};
        revenues.forEach(r => {
          if (!bySource[r.source]) bySource[r.source] = 0;
          bySource[r.source] += parseFloat(r.amount || "0");
        });

        return { totalRevenue, bySource };
      }),
  }),

  // ============================================================================
  // FINANCIAL ANALYTICS
  // ============================================================================
  analytics: router({
    profitLoss: protectedProcedure
      .input(z.object({
        farmId: z.number(),
        startDate: z.date(),
        endDate: z.date(),
      }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return { revenue: 0, expenses: 0, profit: 0, profitMargin: 0 };

        const expenseQuery = db.select().from(farmExpenses).where(
          and(
            eq(farmExpenses.farmId, input.farmId),
            gte(farmExpenses.expenseDate, input.startDate),
            lte(farmExpenses.expenseDate, input.endDate)
          )
        );

        const revenueQuery = db.select().from(farmRevenue).where(
          and(
            eq(farmRevenue.farmId, input.farmId),
            gte(farmRevenue.saleDate, input.startDate),
            lte(farmRevenue.saleDate, input.endDate)
          )
        );

        const [expenses, revenues] = await Promise.all([expenseQuery, revenueQuery]);

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
      }),

    monthlyTrend: protectedProcedure
      .input(z.object({
        farmId: z.number(),
        months: z.number().default(12),
      }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];

        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - input.months);

        const expenseQuery = db.select().from(farmExpenses).where(
          and(
            eq(farmExpenses.farmId, input.farmId),
            gte(farmExpenses.expenseDate, startDate),
            lte(farmExpenses.expenseDate, endDate)
          )
        );

        const revenueQuery = db.select().from(farmRevenue).where(
          and(
            eq(farmRevenue.farmId, input.farmId),
            gte(farmRevenue.saleDate, startDate),
            lte(farmRevenue.saleDate, endDate)
          )
        );

        const [expenses, revenues] = await Promise.all([expenseQuery, revenueQuery]);

        const monthlyData: Record<string, { revenue: number; expenses: number; profit: number }> = {};

        expenses.forEach(e => {
          const monthKey = new Date(e.expenseDate).toISOString().slice(0, 7);
          if (!monthlyData[monthKey]) monthlyData[monthKey] = { revenue: 0, expenses: 0, profit: 0 };
          monthlyData[monthKey].expenses += parseFloat(e.amount || "0");
        });

        revenues.forEach(r => {
          const monthKey = new Date(r.saleDate).toISOString().slice(0, 7);
          if (!monthlyData[monthKey]) monthlyData[monthKey] = { revenue: 0, expenses: 0, profit: 0 };
          monthlyData[monthKey].revenue += parseFloat(r.amount || "0");
        });

        return Object.entries(monthlyData)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([month, data]) => ({
            month,
            ...data,
            profit: data.revenue - data.expenses,
          }));
      }),
  }),

  // Consolidated data for all owner's farms
  allExpenses: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    
    // Get all farms for this owner
    const ownerFarms = await db.select().from(farms).where(eq(farms.farmerUserId, ctx.user.id));
    const farmIds = ownerFarms.map(f => f.id);
    
    if (farmIds.length === 0) return [];
    
    // Get all expenses for all owner's farms
    return await db.select().from(farmExpenses).where(
      farmExpenses.farmId.inArray(farmIds)
    );
  }),

  allRevenue: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    
    // Get all farms for this owner
    const ownerFarms = await db.select().from(farms).where(eq(farms.farmerUserId, ctx.user.id));
    const farmIds = ownerFarms.map(f => f.id);
    
    if (farmIds.length === 0) return [];
    
    // Get all revenue for all owner's farms
    return await db.select().from(farmRevenue).where(
      farmRevenue.farmId.inArray(farmIds)
    );
  }),
});
