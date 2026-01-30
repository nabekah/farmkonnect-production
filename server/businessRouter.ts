import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { strategicGoals, swotAnalysis } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

export const businessRouter = router({
  // Strategic Goals
  goals: router({
    list: protectedProcedure
      .input(z.object({
        farmId: z.number().optional(),
        status: z.enum(["planning", "in_progress", "completed", "abandoned"]).optional(),
      }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        
        const conditions = [];
        if (input.farmId) conditions.push(eq(strategicGoals.farmId, input.farmId));
        if (input.status) conditions.push(eq(strategicGoals.status, input.status));
        
        if (conditions.length > 0) {
          return await db.select().from(strategicGoals).where(and(...conditions));
        }
        return await db.select().from(strategicGoals);
      }),

    create: protectedProcedure
      .input(z.object({
        farmId: z.number(),
        goalDescription: z.string(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        status: z.enum(["planning", "in_progress", "completed", "abandoned"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        
        return await db.insert(strategicGoals).values({
          farmId: input.farmId,
          goalDescription: input.goalDescription,
          startDate: input.startDate,
          endDate: input.endDate,
          status: input.status || "planning",
        });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        goalDescription: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        status: z.enum(["planning", "in_progress", "completed", "abandoned"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        
        const { id, ...updateData } = input;
        return await db.update(strategicGoals)
          .set(updateData)
          .where(eq(strategicGoals.id, id));
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        
        return await db.delete(strategicGoals)
          .where(eq(strategicGoals.id, input.id));
      }),
  }),

  // SWOT Analysis
  swot: router({
    list: protectedProcedure
      .input(z.object({ farmId: z.number().optional() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        
        if (input.farmId) {
          return await db.select().from(swotAnalysis)
            .where(eq(swotAnalysis.farmId, input.farmId));
        }
        return await db.select().from(swotAnalysis);
      }),

    create: protectedProcedure
      .input(z.object({
        farmId: z.number(),
        analysisDate: z.date(),
        strengths: z.string().optional(),
        weaknesses: z.string().optional(),
        opportunities: z.string().optional(),
        threats: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        
        return await db.insert(swotAnalysis).values({
          farmId: input.farmId,
          analysisDate: input.analysisDate,
          strengths: input.strengths,
          weaknesses: input.weaknesses,
          opportunities: input.opportunities,
          threats: input.threats,
        });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        analysisDate: z.date().optional(),
        strengths: z.string().optional(),
        weaknesses: z.string().optional(),
        opportunities: z.string().optional(),
        threats: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        
        const { id, ...updateData } = input;
        return await db.update(swotAnalysis)
          .set(updateData)
          .where(eq(swotAnalysis.id, id));
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        
        return await db.delete(swotAnalysis)
          .where(eq(swotAnalysis.id, input.id));
      }),

    // Get latest SWOT analysis for a farm
    latest: protectedProcedure
      .input(z.object({ farmId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return null;
        
        const analyses = await db.select().from(swotAnalysis)
          .where(eq(swotAnalysis.farmId, input.farmId))
          .orderBy(swotAnalysis.analysisDate)
          .limit(1);
        
        return analyses[0] || null;
      }),
  }),
});
