import { z } from "zod";
import { getDb } from "./db";
import { TRPCError } from "@trpc/server";
import { eq, and, inArray } from "drizzle-orm";
import { farmPermissions, farms } from "../drizzle/schema";
import { router, protectedProcedure } from "./_core/trpc";

export const farmPermissionsRouter = router({
  // Get all permissions for a farm
  list: protectedProcedure
    .input(z.object({
      farmId: z.number(),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return [];

      // Verify user owns the farm
      const farm = await db.select().from(farms).where(eq(farms.id, input.farmId));
      if (farm.length === 0 || farm[0].farmerUserId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return await db.select().from(farmPermissions).where(
        eq(farmPermissions.farmId, input.farmId)
      );
    }),

  // Get all farms user has access to
  myFarms: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    // Get farms owned by user
    const ownedFarms = await db.select().from(farms).where(
      eq(farms.farmerUserId, ctx.user.id)
    );

    // Get farms shared with user
    const sharedPermissions = await db.select().from(farmPermissions).where(
      eq(farmPermissions.userId, ctx.user.id)
    );

    const sharedFarmIds = sharedPermissions.map(p => p.farmId);
    let sharedFarms: typeof farms.$inferSelect[] = [];
    if (sharedFarmIds.length > 0) {
      sharedFarms = await db.select().from(farms).where(
        inArray(farms.id, sharedFarmIds)
      );
    }

    return {
      owned: ownedFarms,
      shared: sharedFarms.map((farm, index) => ({
        ...farm,
        permission: sharedPermissions[index],
      })),
    };
  }),

  // Grant permission to a user
  grant: protectedProcedure
    .input(z.object({
      farmId: z.number(),
      userId: z.number(),
      role: z.enum(["viewer", "editor", "admin"]),
      expiresAt: z.date().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Verify user owns the farm
      const farm = await db.select().from(farms).where(eq(farms.id, input.farmId));
      if (farm.length === 0 || farm[0].farmerUserId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      // Check if permission already exists
      const existing = await db.select().from(farmPermissions).where(
        and(
          eq(farmPermissions.farmId, input.farmId),
          eq(farmPermissions.userId, input.userId)
        )
      );

      if (existing.length > 0) {
        // Update existing permission
        return await db.update(farmPermissions)
          .set({
            role: input.role,
            expiresAt: input.expiresAt,
            notes: input.notes,
          })
          .where(eq(farmPermissions.id, existing[0].id));
      }

      // Create new permission
      return await db.insert(farmPermissions).values({
        farmId: input.farmId,
        userId: input.userId,
        role: input.role,
        grantedBy: ctx.user.id,
        expiresAt: input.expiresAt,
        notes: input.notes,
      });
    }),

  // Update permission
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      role: z.enum(["viewer", "editor", "admin"]).optional(),
      expiresAt: z.date().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Verify user owns the farm
      const permission = await db.select().from(farmPermissions).where(
        eq(farmPermissions.id, input.id)
      );
      if (permission.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const farm = await db.select().from(farms).where(
        eq(farms.id, permission[0].farmId)
      );
      if (farm.length === 0 || farm[0].farmerUserId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const { id, ...updates } = input;
      return await db.update(farmPermissions).set(updates).where(
        eq(farmPermissions.id, id)
      );
    }),

  // Revoke permission
  revoke: protectedProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Verify user owns the farm
      const permission = await db.select().from(farmPermissions).where(
        eq(farmPermissions.id, input.id)
      );
      if (permission.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const farm = await db.select().from(farms).where(
        eq(farms.id, permission[0].farmId)
      );
      if (farm.length === 0 || farm[0].farmerUserId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return await db.delete(farmPermissions).where(
        eq(farmPermissions.id, input.id)
      );
    }),
});
