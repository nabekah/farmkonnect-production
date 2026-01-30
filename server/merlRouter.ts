import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { kpis, kpiValues, monitoringVisits, challenges } from "../drizzle/schema";
import { eq, and, gte, lte } from "drizzle-orm";

export const merlRouter = router({
  // KPIs
  kpis: router({
    list: protectedProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      return await db.select().from(kpis);
    }),

    create: protectedProcedure
      .input(z.object({
        kpiName: z.string(),
        description: z.string().optional(),
        targetValue: z.string().optional(),
        unitOfMeasure: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        
        return await db.insert(kpis).values({
          kpiName: input.kpiName,
          description: input.description,
          targetValue: input.targetValue as any,
          unitOfMeasure: input.unitOfMeasure,
        });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        kpiName: z.string().optional(),
        description: z.string().optional(),
        targetValue: z.string().optional(),
        unitOfMeasure: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        
        const { id, ...updateData } = input;
        return await db.update(kpis)
          .set({ ...updateData, targetValue: updateData.targetValue as any })
          .where(eq(kpis.id, id));
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        
        return await db.delete(kpis).where(eq(kpis.id, input.id));
      }),
  }),

  // KPI Values
  kpiValues: router({
    list: protectedProcedure
      .input(z.object({
        kpiId: z.number().optional(),
        farmId: z.number().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        
        let query = db.select().from(kpiValues);
        const conditions = [];
        
        if (input.kpiId) conditions.push(eq(kpiValues.kpiId, input.kpiId));
        if (input.farmId) conditions.push(eq(kpiValues.farmId, input.farmId));
        if (input.startDate) conditions.push(gte(kpiValues.measurementDate, input.startDate));
        if (input.endDate) conditions.push(lte(kpiValues.measurementDate, input.endDate));
        
        if (conditions.length > 0) {
          return await query.where(and(...conditions));
        }
        return await query;
      }),

    create: protectedProcedure
      .input(z.object({
        kpiId: z.number(),
        farmId: z.number().optional(),
        measurementDate: z.date(),
        actualValue: z.string(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        
        return await db.insert(kpiValues).values({
          kpiId: input.kpiId,
          farmId: input.farmId,
          measurementDate: input.measurementDate,
          actualValue: input.actualValue as any,
        });
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        
        return await db.delete(kpiValues).where(eq(kpiValues.id, input.id));
      }),
  }),

  // Monitoring Visits
  visits: router({
    list: protectedProcedure
      .input(z.object({ farmId: z.number().optional() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        
        if (input.farmId) {
          return await db.select().from(monitoringVisits)
            .where(eq(monitoringVisits.farmId, input.farmId));
        }
        return await db.select().from(monitoringVisits);
      }),

    create: protectedProcedure
      .input(z.object({
        farmId: z.number(),
        visitDate: z.date(),
        observations: z.string().optional(),
        photoEvidenceUrl: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        
        return await db.insert(monitoringVisits).values({
          farmId: input.farmId,
          visitorUserId: ctx.user.id,
          visitDate: input.visitDate,
          observations: input.observations,
          photoEvidenceUrl: input.photoEvidenceUrl,
        });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        visitDate: z.date().optional(),
        observations: z.string().optional(),
        photoEvidenceUrl: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        
        const { id, ...updateData } = input;
        return await db.update(monitoringVisits)
          .set(updateData)
          .where(eq(monitoringVisits.id, id));
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        
        return await db.delete(monitoringVisits)
          .where(eq(monitoringVisits.id, input.id));
      }),
  }),

  // Challenges
  challenges: router({
    list: protectedProcedure
      .input(z.object({
        farmId: z.number().optional(),
        status: z.enum(["open", "in_progress", "resolved", "closed"]).optional(),
      }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        
        const conditions = [];
        if (input.farmId) conditions.push(eq(challenges.farmId, input.farmId));
        if (input.status) conditions.push(eq(challenges.status, input.status));
        
        if (conditions.length > 0) {
          return await db.select().from(challenges).where(and(...conditions));
        }
        return await db.select().from(challenges);
      }),

    create: protectedProcedure
      .input(z.object({
        farmId: z.number(),
        challengeDescription: z.string(),
        category: z.string().optional(),
        severity: z.enum(["low", "medium", "high", "critical"]).optional(),
        reportedDate: z.date(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        
        return await db.insert(challenges).values({
          farmId: input.farmId,
          reportedByUserId: ctx.user.id,
          challengeDescription: input.challengeDescription,
          category: input.category,
          severity: input.severity || "medium",
          reportedDate: input.reportedDate,
          status: "open",
        });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["open", "in_progress", "resolved", "closed"]).optional(),
        severity: z.enum(["low", "medium", "high", "critical"]).optional(),
        challengeDescription: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        
        const { id, ...updateData } = input;
        return await db.update(challenges)
          .set(updateData)
          .where(eq(challenges.id, id));
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        
        return await db.delete(challenges).where(eq(challenges.id, input.id));
      }),
  }),
});
