import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { animals, farms, crops, activities } from "../../drizzle/schema";
import { eq, like, and } from "drizzle-orm";

export const searchRouter = router({
  /**
   * Global search across animals, farms, crops, and activities
   */
  globalSearch: protectedProcedure
    .input(
      z.object({
        query: z.string().min(1).max(100),
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = getDb();
      const searchTerm = `%${input.query}%`;

      try {
        // Search animals
        const animalResults = await db
          .select({
            id: animals.id,
            name: animals.animalName,
            type: animals.animalType,
            status: animals.status,
            category: z.literal("animal"),
            farmId: animals.farmId,
          })
          .from(animals)
          .where(
            and(
              eq(animals.farmId, ctx.user.farmId || 0),
              like(animals.animalName, searchTerm)
            )
          )
          .limit(input.limit);

        // Search farms
        const farmResults = await db
          .select({
            id: farms.id,
            name: farms.farmName,
            location: farms.location,
            status: z.literal("active"),
            category: z.literal("farm"),
            farmId: farms.id,
          })
          .from(farms)
          .where(
            and(
              eq(farms.farmerUserId, ctx.user.id),
              like(farms.farmName, searchTerm)
            )
          )
          .limit(input.limit);

        // Search crops
        const cropResults = await db
          .select({
            id: crops.id,
            name: crops.cropName,
            variety: crops.variety,
            status: z.literal("active"),
            category: z.literal("crop"),
            farmId: z.literal(0),
          })
          .from(crops)
          .where(like(crops.cropName, searchTerm))
          .limit(input.limit);

        // Combine results
        const results = [
          ...animalResults.map((r) => ({
            ...r,
            category: "animal" as const,
            path: `/livestock-management?animal=${r.id}`,
          })),
          ...farmResults.map((r) => ({
            ...r,
            category: "farm" as const,
            path: `/farms`,
          })),
          ...cropResults.map((r) => ({
            ...r,
            category: "crop" as const,
            path: `/crops`,
          })),
        ];

        return {
          success: true,
          results: results.slice(0, input.limit),
          total: results.length,
        };
      } catch (error) {
        console.error("Search error:", error);
        return {
          success: false,
          results: [],
          total: 0,
          error: "Search failed",
        };
      }
    }),

  /**
   * Search animals by name, type, or ID
   */
  searchAnimals: protectedProcedure
    .input(
      z.object({
        query: z.string().min(1).max(100),
        farmId: z.number().optional(),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = getDb();
      const searchTerm = `%${input.query}%`;
      const farmId = input.farmId || ctx.user.farmId;

      try {
        const results = await db
          .select()
          .from(animals)
          .where(
            and(
              eq(animals.farmId, farmId || 0),
              like(animals.animalName, searchTerm)
            )
          )
          .limit(input.limit);

        return {
          success: true,
          results,
          total: results.length,
        };
      } catch (error) {
        console.error("Animal search error:", error);
        return {
          success: false,
          results: [],
          total: 0,
          error: "Animal search failed",
        };
      }
    }),

  /**
   * Search farms by name or location
   */
  searchFarms: protectedProcedure
    .input(
      z.object({
        query: z.string().min(1).max(100),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = getDb();
      const searchTerm = `%${input.query}%`;

      try {
        const results = await db
          .select()
          .from(farms)
          .where(
            and(
              eq(farms.farmerUserId, ctx.user.id),
              like(farms.farmName, searchTerm)
            )
          )
          .limit(input.limit);

        return {
          success: true,
          results,
          total: results.length,
        };
      } catch (error) {
        console.error("Farm search error:", error);
        return {
          success: false,
          results: [],
          total: 0,
          error: "Farm search failed",
        };
      }
    }),

  /**
   * Search crops by name or variety
   */
  searchCrops: protectedProcedure
    .input(
      z.object({
        query: z.string().min(1).max(100),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      const searchTerm = `%${input.query}%`;

      try {
        const results = await db
          .select()
          .from(crops)
          .where(like(crops.cropName, searchTerm))
          .limit(input.limit);

        return {
          success: true,
          results,
          total: results.length,
        };
      } catch (error) {
        console.error("Crop search error:", error);
        return {
          success: false,
          results: [],
          total: 0,
          error: "Crop search failed",
        };
      }
    }),
});
