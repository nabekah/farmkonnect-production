import { z } from "zod";
import { getDb } from "./db";
import { TRPCError } from "@trpc/server";
import { eq, and, gte, lte, inArray } from "drizzle-orm";
import { animals, animalHealthRecords, breedingRecords, performanceMetrics, farms } from "../drizzle/schema";
import { router, protectedProcedure } from "./_core/trpc";

export const livestockRouter = router({
  // Consolidated data for all owner's farms
  allAnimals: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    
    // Get all farms for this owner
    const ownerFarms = await db.select().from(farms).where(eq(farms.farmerUserId, ctx.user.id));
    const farmIds = ownerFarms.map(f => f.id);
    
    if (farmIds.length === 0) return [];
    
    // Get all animals for all owner's farms
    return await db.select().from(animals).where(
      inArray(animals.farmId, farmIds)
    );
  }),

  // ============================================================================
  // FARM MANAGEMENT
  // ============================================================================
  farms: router({
    list: protectedProcedure
      .input(z.object({
        farmType: z.enum(["livestock", "mixed"]).optional(),
      }))
      .query(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) return [];

        let whereConditions = [eq(farms.farmerUserId, ctx.user?.id || 0)];
        if (input.farmType) {
          whereConditions.push(eq(farms.farmType, input.farmType));
        }

        return await db.select().from(farms).where(and(...whereConditions));
      }),
  }),

  // ============================================================================
  // ANIMAL MANAGEMENT
  // ============================================================================

  animals: router({
    create: protectedProcedure
      .input(z.object({
        farmId: z.number(),
        typeId: z.number(),
        uniqueTagId: z.string().optional(),
        birthDate: z.date().optional(),
        gender: z.enum(["male", "female", "unknown"]).optional(),
        breed: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        return await db.insert(animals).values({
          ...input,
          status: "active" as const,
        });
      }),

    list: protectedProcedure
      .input(z.object({
        farmId: z.number(),
        status: z.enum(["active", "sold", "culled", "deceased"]).optional(),
      }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];

        let whereConditions = [eq(animals.farmId, input.farmId)];
        if (input.status) {
          whereConditions.push(eq(animals.status, input.status));
        }

        return await db.select().from(animals).where(and(...whereConditions));
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["active", "sold", "culled", "deceased"]).optional(),
        gender: z.enum(["male", "female", "unknown"]).optional(),
        breed: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const { id, ...updates } = input;
        return await db.update(animals).set(updates).where(eq(animals.id, id));
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        return await db.delete(animals).where(eq(animals.id, input.id));
      }),
  }),

  // ============================================================================
  // HEALTH RECORDS
  // ============================================================================

  healthRecords: router({
    create: protectedProcedure
      .input(z.object({
        animalId: z.number(),
        recordDate: z.date(),
        eventType: z.enum(["vaccination", "treatment", "illness", "checkup", "other"]),
        details: z.string().optional(),
        veterinarianUserId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        return await db.insert(animalHealthRecords).values(input);
      }),

    list: protectedProcedure
      .input(z.object({
        animalId: z.number(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];

        let whereConditions = [eq(animalHealthRecords.animalId, input.animalId)];
        if (input.startDate && input.endDate) {
          whereConditions.push(
            gte(animalHealthRecords.recordDate, input.startDate),
            lte(animalHealthRecords.recordDate, input.endDate)
          );
        }

        return await db.select().from(animalHealthRecords).where(and(...whereConditions));
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        return await db.delete(animalHealthRecords).where(eq(animalHealthRecords.id, input.id));
      }),
  }),

  // ============================================================================
  // BREEDING RECORDS
  // ============================================================================

  breedingRecords: router({
    create: protectedProcedure
      .input(z.object({
        animalId: z.number(),
        sireId: z.number().optional(),
        damId: z.number().optional(),
        breedingDate: z.date(),
        expectedDueDate: z.date().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        return await db.insert(breedingRecords).values({
          ...input,
          outcome: "pending" as const,
        });
      }),

    list: protectedProcedure
      .input(z.object({
        farmId: z.number(),
        outcome: z.enum(["pending", "successful", "unsuccessful", "aborted"]).optional(),
      }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [] as any;

        // Get all animals for this farm first
        const farmAnimals = await db.select().from(animals).where(eq(animals.farmId, input.farmId));
        const animalIds = farmAnimals.map(a => a.id);

        let whereConditions: any[] = [];
        if (input.outcome) {
          whereConditions.push(eq(breedingRecords.outcome, input.outcome));
        }

        const records = await db.select().from(breedingRecords).where(
          whereConditions.length > 0 ? and(...whereConditions) : undefined
        ) as any;
        return records.filter((r: any) => animalIds.includes(r.animalId) || animalIds.includes(r.sireId) || animalIds.includes(r.damId));
      }),

    updateOutcome: protectedProcedure
      .input(z.object({
        id: z.number(),
        outcome: z.enum(["pending", "successful", "unsuccessful", "aborted"]),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const { id, ...updates } = input;
        return await db.update(breedingRecords).set(updates).where(eq(breedingRecords.id, id));
      }),
  }),

  // ============================================================================
  // FEEDING RECORDS
  // ============================================================================

  feedingRecords: router({
    create: protectedProcedure
      .input(z.object({
        animalId: z.number(),
        feedDate: z.date(),
        feedType: z.string(),
        quantityKg: z.union([z.number(), z.string()]),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const values = {
          ...input,
          quantityKg: input.quantityKg.toString(),
        };
        return await db.insert(feedingRecords).values(values);
      }),

    list: protectedProcedure
      .input(z.object({
        animalId: z.number(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];

        let whereConditions = [eq(feedingRecords.animalId, input.animalId)];
        if (input.startDate && input.endDate) {
          whereConditions.push(
            gte(feedingRecords.feedDate, input.startDate),
            lte(feedingRecords.feedDate, input.endDate)
          );
        }

        return await db.select().from(feedingRecords).where(and(...whereConditions));
      }),

    summary: protectedProcedure
      .input(z.object({
        animalId: z.number(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return { totalQuantity: 0, feedTypes: {} };

        let whereConditions = [eq(feedingRecords.animalId, input.animalId)];
        if (input.startDate && input.endDate) {
          whereConditions.push(
            gte(feedingRecords.feedDate, input.startDate),
            lte(feedingRecords.feedDate, input.endDate)
          );
        }

        const records = await db.select().from(feedingRecords).where(and(...whereConditions));
        
        const totalQuantity = records.reduce((sum, r) => sum + parseFloat(r.quantityKg?.toString() || "0"), 0);
        
        const feedTypes: Record<string, number> = {};
        records.forEach(r => {
          feedTypes[r.feedType] = (feedTypes[r.feedType] || 0) + parseFloat(r.quantityKg?.toString() || "0");
        });

        return { totalQuantity, feedTypes };
      }),
  }),

  // ============================================================================
  // PERFORMANCE METRICS
  // ============================================================================

  performanceMetrics: router({
    create: protectedProcedure
      .input(z.object({
        animalId: z.number(),
        metricDate: z.date(),
        weightKg: z.union([z.number(), z.string()]).optional(),
        milkYieldLiters: z.union([z.number(), z.string()]).optional(),
        eggCount: z.number().optional(),
        otherMetrics: z.any().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const values = {
          ...input,
          weightKg: input.weightKg ? input.weightKg.toString() : null,
          milkYieldLiters: input.milkYieldLiters ? input.milkYieldLiters.toString() : null,
        };
        return await db.insert(performanceMetrics).values(values);
      }),

    list: protectedProcedure
      .input(z.object({
        animalId: z.number(),
        limit: z.number().default(10),
      }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];

        return await db.select()
          .from(performanceMetrics)
          .where(eq(performanceMetrics.animalId, input.animalId))
          .limit(input.limit);
      }),

    trends: protectedProcedure
      .input(z.object({
        animalId: z.number(),
        startDate: z.date(),
        endDate: z.date(),
      }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return { weightTrend: [], productionTrend: [] };

        const metrics = await db.select()
          .from(performanceMetrics)
          .where(
            and(
              eq(performanceMetrics.animalId, input.animalId),
              gte(performanceMetrics.metricDate, input.startDate),
              lte(performanceMetrics.metricDate, input.endDate)
            )
          );

        const weightTrend = (metrics as any).map((m: any) => ({
          date: m.metricDate,
          weight: m.weightKg ? parseFloat(m.weightKg.toString()) : 0,
        }));

        const productionTrend = metrics
          .filter((m: any) => m.milkYieldLiters || m.eggCount)
          .map((m: any) => ({
            date: m.metricDate,
            production: (m.milkYieldLiters ? parseFloat(m.milkYieldLiters.toString()) : 0) + (m.eggCount || 0),
          }));

        return { weightTrend, productionTrend };
      }),
  }),
});
