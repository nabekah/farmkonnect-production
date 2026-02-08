import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { animals, farms, crops } from "../../drizzle/schema";
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
      const user = ctx.user as any;

      try {
        // Search animals - search across all farms for the user
        const animalResults = await db
          .select({
            id: animals.id,
            name: animals.animalName,
            type: animals.animalType,
            status: animals.status,
            farmId: animals.farmId,
          })
          .from(animals)
          .where(
            like(animals.animalName, searchTerm)
          )
          .limit(input.limit);

        // Search farms
        const farmResults = await db
          .select({
            id: farms.id,
            name: farms.farmName,
            location: farms.location,
            farmId: farms.id,
          })
          .from(farms)
          .where(
            like(farms.farmName, searchTerm)
          )
          .limit(input.limit);

        // Search crops
        const cropResults = await db
          .select({
            id: crops.id,
            name: crops.cropName,
            variety: crops.variety,
          })
          .from(crops)
          .where(like(crops.cropName, searchTerm))
          .limit(input.limit);

        // Combine results
        const results = [
          ...animalResults.map((r) => ({
            id: r.id,
            name: r.name,
            category: "animal" as const,
            path: `/livestock-management?animal=${r.id}`,
            type: r.type,
          })),
          ...farmResults.map((r) => ({
            id: r.id,
            name: r.name,
            category: "farm" as const,
            path: `/farms`,
            location: r.location,
          })),
          ...cropResults.map((r) => ({
            id: r.id,
            name: r.name,
            category: "crop" as const,
            path: `/crops`,
            variety: r.variety,
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
      const user = ctx.user as any;
      const farmId = input.farmId || user.farmId;

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
      const user = ctx.user as any;

      try {
        const results = await db
          .select()
          .from(farms)
          .where(
            and(
              eq(farms.farmerUserId, user.id),
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
