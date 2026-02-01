import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { fertilizerApplications, cropCycles } from "../drizzle/schema";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";

export const fertilizerRouter = router({
  // List fertilizer applications
  list: protectedProcedure
    .input(
      z.object({
        cycleId: z.number().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const conditions = [];

      if (input.cycleId) {
        conditions.push(eq(fertilizerApplications.cycleId, input.cycleId));
      }

      if (input.startDate) {
        conditions.push(sql`${fertilizerApplications.applicationDate} >= ${input.startDate}`);
      }

      if (input.endDate) {
        conditions.push(sql`${fertilizerApplications.applicationDate} <= ${input.endDate}`);
      }

      const applications = await db
        .select()
        .from(fertilizerApplications)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(fertilizerApplications.applicationDate))
        .limit(input.limit)
        .offset(input.offset);

      return applications;
    }),

  // Get fertilizer application by ID
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const [application] = await db
        .select()
        .from(fertilizerApplications)
        .where(eq(fertilizerApplications.id, input.id));

      return application || null;
    }),

  // Create fertilizer application
  create: protectedProcedure
    .input(
      z.object({
        cycleId: z.number(),
        applicationDate: z.string(),
        fertilizerType: z.string(),
        quantityKg: z.string(),
        appliedByUserId: z.number().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [result] = await db.insert(fertilizerApplications).values({
        cycleId: input.cycleId,
        applicationDate: new Date(input.applicationDate),
        fertilizerType: input.fertilizerType,
        quantityKg: input.quantityKg,
        appliedByUserId: input.appliedByUserId || ctx.user.id,
        notes: input.notes,
      });

      return { id: result.insertId, success: true };
    }),

  // Update fertilizer application
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        applicationDate: z.string().optional(),
        fertilizerType: z.string().optional(),
        quantityKg: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(fertilizerApplications)
        .set({
          applicationDate: input.applicationDate ? new Date(input.applicationDate) : undefined,
          fertilizerType: input.fertilizerType,
          quantityKg: input.quantityKg,
          notes: input.notes,
        })
        .where(eq(fertilizerApplications.id, input.id));

      return { success: true };
    }),

  // Delete fertilizer application
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .delete(fertilizerApplications)
        .where(eq(fertilizerApplications.id, input.id));

      return { success: true };
    }),

  // Get fertilizer usage statistics
  getUsageStats: protectedProcedure
    .input(
      z.object({
        cycleId: z.number().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { totalQuantity: 0, applicationCount: 0, typeBreakdown: [] };

      const conditions = [];

      if (input.cycleId) {
        conditions.push(eq(fertilizerApplications.cycleId, input.cycleId));
      }

      if (input.startDate) {
        conditions.push(sql`${fertilizerApplications.applicationDate} >= ${input.startDate}`);
      }

      if (input.endDate) {
        conditions.push(sql`${fertilizerApplications.applicationDate} <= ${input.endDate}`);
      }

      // Get total quantity and count
      const [stats] = await db
        .select({
          totalQuantity: sql<number>`COALESCE(SUM(CAST(${fertilizerApplications.quantityKg} AS DECIMAL(10,2))), 0)`,
          applicationCount: sql<number>`COUNT(*)`,
        })
        .from(fertilizerApplications)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      // Get breakdown by type
      const typeBreakdown = await db
        .select({
          fertilizerType: fertilizerApplications.fertilizerType,
          totalQuantity: sql<number>`SUM(CAST(${fertilizerApplications.quantityKg} AS DECIMAL(10,2)))`,
          applicationCount: sql<number>`COUNT(*)`,
        })
        .from(fertilizerApplications)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .groupBy(fertilizerApplications.fertilizerType);

      return {
        totalQuantity: stats?.totalQuantity || 0,
        applicationCount: stats?.applicationCount || 0,
        typeBreakdown,
      };
    }),
});
