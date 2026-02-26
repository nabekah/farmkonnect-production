import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { farmExpenses, farmRevenue } from "../drizzle/schema";
import {
  getExpenses,
  getRevenue,
  getExpenseSummary,
  getRevenueSummary,
  calculateProfitLoss,
  getMonthlyTrend,
  getAllExpenses,
  getAllRevenue,
} from "./_core/financialUtils";

export const financialRouter = router({
  // ============================================================================
  // EXPENSES MANAGEMENT
  // ============================================================================
  expenses: router({
    list: protectedProcedure
      .input(
        z.object({
          farmId: z.number(),
          startDate: z.date().optional(),
          endDate: z.date().optional(),
          category: z.string().optional(),
        })
      )
      .query(async ({ input }) => {
        return await getExpenses(input.farmId, input.startDate, input.endDate, input.category);
      }),

    create: protectedProcedure
      .input(
        z.object({
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
            "other",
          ]),
          amount: z.number().positive(),
          expenseDate: z.date(),
          description: z.string().optional(),
          vendor: z.string().optional(),
          invoiceNumber: z.string().optional(),
        })
      )
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
      .input(
        z.object({
          id: z.number(),
          category: z.string().optional(),
          amount: z.number().positive().optional(),
          description: z.string().optional(),
          vendor: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const { id, amount, ...rest } = input;
        const updateData: any = rest;
        if (amount !== undefined) {
          updateData.amount = amount.toString();
        }
        return await db.update(farmExpenses).set(updateData).where(eq(farmExpenses.id, id));
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        return await db.delete(farmExpenses).where(eq(farmExpenses.id, input.id));
      }),

    summary: protectedProcedure
      .input(
        z.object({
          farmId: z.number(),
          startDate: z.date().optional(),
          endDate: z.date().optional(),
        })
      )
      .query(async ({ input }) => {
        return await getExpenseSummary(input.farmId, input.startDate, input.endDate);
      }),
  }),

  // ============================================================================
  // REVENUE MANAGEMENT
  // ============================================================================
  revenue: router({
    list: protectedProcedure
      .input(
        z.object({
          farmId: z.number(),
          startDate: z.date().optional(),
          endDate: z.date().optional(),
          source: z.string().optional(),
        })
      )
      .query(async ({ input }) => {
        return await getRevenue(input.farmId, input.startDate, input.endDate, input.source);
      }),

    create: protectedProcedure
      .input(
        z.object({
          farmId: z.number(),
          source: z.enum(["crop_sales", "livestock_sales", "fish_sales", "services", "other"]),
          amount: z.number().positive(),
          saleDate: z.date(),
          buyer: z.string().optional(),
          quantity: z.string().optional(),
          unit: z.string().optional(),
          notes: z.string().optional(),
        })
      )
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
      .input(
        z.object({
          id: z.number(),
          amount: z.number().positive().optional(),
          buyer: z.string().optional(),
          quantity: z.string().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const { id, amount, ...rest } = input;
        const updateData: any = rest;
        if (amount !== undefined) {
          updateData.amount = amount.toString();
        }
        return await db.update(farmRevenue).set(updateData).where(eq(farmRevenue.id, input.id));
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        return await db.delete(farmRevenue).where(eq(farmRevenue.id, input.id));
      }),

    summary: protectedProcedure
      .input(
        z.object({
          farmId: z.number(),
          startDate: z.date().optional(),
          endDate: z.date().optional(),
        })
      )
      .query(async ({ input }) => {
        return await getRevenueSummary(input.farmId, input.startDate, input.endDate);
      }),
  }),

  // ============================================================================
  // FINANCIAL ANALYTICS
  // ============================================================================
  analytics: router({
    profitLoss: protectedProcedure
      .input(
        z.object({
          farmId: z.number(),
          startDate: z.date(),
          endDate: z.date(),
        })
      )
      .query(async ({ input }) => {
        return await calculateProfitLoss(input.farmId, input.startDate, input.endDate);
      }),

    monthlyTrend: protectedProcedure
      .input(
        z.object({
          farmId: z.number(),
          months: z.number().default(12),
        })
      )
      .query(async ({ input }) => {
        return await getMonthlyTrend(input.farmId, input.months);
      }),
  }),

  // ============================================================================
  // ADMIN QUERIES
  // ============================================================================
  allExpenses: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can view all expenses" });
    }
    return await getAllExpenses();
  }),

  allRevenue: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can view all revenue" });
    }
    return await getAllRevenue();
  }),
});
