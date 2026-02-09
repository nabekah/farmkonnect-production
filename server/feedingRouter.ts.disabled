import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { TRPCError } from "@trpc/server";
import { feedingRecords } from "../drizzle/schema";
import { eq, and, gte, lte } from "drizzle-orm";

export const feedingRouter = router({
  listByAnimal: protectedProcedure
    .input(z.object({ animalId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return await db.select().from(feedingRecords)
        .where(eq(feedingRecords.animalId, input.animalId))
        .orderBy((r: any) => [r.feedDate]);
    }),

  listByFarm: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      // This would require a join with animals table
      // For now, return empty array
      return [];
    }),

  record: protectedProcedure
    .input(z.object({
      animalId: z.number(),
      feedDate: z.date(),
      feedType: z.string(),
      quantityKg: z.number().positive(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      return await db.insert(feedingRecords).values({
        animalId: input.animalId,
        feedDate: input.feedDate,
        feedType: input.feedType,
        quantityKg: input.quantityKg.toString(),
        notes: input.notes,
      });
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      feedDate: z.date().optional(),
      feedType: z.string().optional(),
      quantityKg: z.number().positive().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      
      const updates: any = {};
      if (input.feedDate) updates.feedDate = input.feedDate;
      if (input.feedType) updates.feedType = input.feedType;
      if (input.quantityKg) updates.quantityKg = input.quantityKg.toString();
      if (input.notes) updates.notes = input.notes;

      return await db.update(feedingRecords)
        .set(updates)
        .where(eq(feedingRecords.id, input.id));
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      return await db.delete(feedingRecords).where(eq(feedingRecords.id, input.id));
    }),

  getCostAnalysis: protectedProcedure
    .input(z.object({ animalId: z.number(), startDate: z.date(), endDate: z.date() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const records = await db.select().from(feedingRecords)
        .where(and(
          eq(feedingRecords.animalId, input.animalId),
          gte(feedingRecords.feedDate, input.startDate),
          lte(feedingRecords.feedDate, input.endDate)
        ));

      if (records.length === 0) return null;

      const totalQuantity = records.reduce((sum: number, r: any) => sum + parseFloat(r.quantityKg), 0);
      const feedTypes = Array.from(new Set(records.map((r: any) => r.feedType)));
      const avgCostPerKg = 5; // Placeholder

      return {
        totalQuantity,
        totalCost: totalQuantity * avgCostPerKg,
        costPerDay: (totalQuantity * avgCostPerKg) / Math.ceil((input.endDate.getTime() - input.startDate.getTime()) / (1000 * 60 * 60 * 24)),
        feedTypes,
        recordCount: records.length,
      };
    }),

  getNutritionalSummary: protectedProcedure
    .input(z.object({ animalId: z.number(), days: z.number().default(30) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);

      const records = await db.select().from(feedingRecords)
        .where(and(
          eq(feedingRecords.animalId, input.animalId),
          gte(feedingRecords.feedDate, startDate)
        ));

      if (records.length === 0) return null;

      const totalQuantity = records.reduce((sum: number, r: any) => sum + parseFloat(r.quantityKg), 0);
      const avgDailyIntake = totalQuantity / input.days;
      const feedTypeBreakdown: Record<string, number> = {};

      records.forEach((r: any) => {
        feedTypeBreakdown[r.feedType] = (feedTypeBreakdown[r.feedType] || 0) + parseFloat(r.quantityKg);
      });

      return {
        totalQuantity,
        avgDailyIntake,
        feedTypeBreakdown,
        recordCount: records.length,
        periodDays: input.days,
      };
    }),
});
