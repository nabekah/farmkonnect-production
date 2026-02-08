import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { animals, farms, crops } from "../../drizzle/schema";
import { eq, like, and } from "drizzle-orm";
import {
  trackSearch,
  getSearchSuggestions,
  getTrendingSearches,
  getPopularSearches,
  getUserSearchAnalytics,
} from "../db/searchAnalytics";
import { cacheService } from "../services/cacheService";

export const searchRouter = router({
  /**
   * Global search across animals, farms, crops with filters and analytics
   */
  globalSearch: protectedProcedure
    .input(
      z.object({
        query: z.string().min(1).max(100),
        limit: z.number().min(1).max(50).default(10),
        filters: z.object({
          type: z.string().optional(),
          status: z.string().optional(),
          category: z.enum(["animal", "farm", "crop"]).optional(),
        }).optional(),
        sessionId: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = getDb();
      const searchTerm = `%${input.query}%`;
      const user = ctx.user as any;
      const startTime = Date.now();
      
      // Check cache first
      const cacheKey = cacheService.generateKey(input.query, input.filters, "search");
      const cachedResults = cacheService.get(cacheKey);
      if (cachedResults) {
        return cachedResults;
      }

      try {
        // Search animals - build where conditions dynamically
        const animalConditions: any[] = [like(animals.animalName, searchTerm)];
        
        if (input.filters?.type) {
          animalConditions.push(eq(animals.animalType, input.filters.type));
        }
        
        if (input.filters?.status) {
          animalConditions.push(eq(animals.status, input.filters.status));
        }

        const animalResults = await db
          .select({
            id: animals.id,
            name: animals.animalName,
            type: animals.animalType,
            status: animals.status,
            farmId: animals.farmId,
          })
          .from(animals)
          .where(animalConditions.length > 1 ? and(...animalConditions) : animalConditions[0])
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
          .where(like(farms.farmName, searchTerm))
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

        const finalResults = results.slice(0, input.limit);
        const searchDuration = Date.now() - startTime;

        const response = {
          success: true,
          results: finalResults,
          total: finalResults.length,
          searchDuration,
        };

        // Cache results for 5 minutes (300 seconds)
        cacheService.set(cacheKey, response, 300);

        // Track search asynchronously (don't wait for it)
        trackSearch({
          userId: user.id,
          query: input.query,
          resultCount: finalResults.length,
          searchDuration,
          filters: input.filters,
          sessionId: input.sessionId,
        }).catch((err) => console.error("Error tracking search:", err));

        return response;
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
   * Get search suggestions for the current user
   */
  getSuggestions: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ input, ctx }) => {
      const user = ctx.user as any;

      try {
        const suggestions = await getSearchSuggestions(user.id, input.limit);
        const trending = await getTrendingSearches(5);

        return {
          success: true,
          recent: suggestions.filter((s) => s.suggestionType === "recent"),
          trending: trending.map((t) => ({
            text: t.query,
            count: t.searchCount,
          })),
          popular: suggestions.filter((s) => s.suggestionType === "popular"),
        };
      } catch (error) {
        console.error("Error fetching suggestions:", error);
        return {
          success: false,
          recent: [],
          trending: [],
          popular: [],
          error: "Failed to fetch suggestions",
        };
      }
    }),

  /**
   * Get trending searches globally
   */
  getTrendingSearches: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ input }) => {
      try {
        const trending = await getTrendingSearches(input.limit);

        return {
          success: true,
          trending: trending.map((t) => ({
            query: t.query,
            searchCount: t.searchCount,
            clickThroughRate: parseFloat(t.clickThroughRate.toString()),
            avgResultCount: parseFloat(t.averageResultCount.toString()),
          })),
        };
      } catch (error) {
        console.error("Error fetching trending searches:", error);
        return {
          success: false,
          trending: [],
          error: "Failed to fetch trending searches",
        };
      }
    }),

  /**
   * Get popular searches across all users
   */
  getPopularSearches: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ input }) => {
      try {
        const popular = await getPopularSearches(input.limit);

        return {
          success: true,
          popular: popular.map((p) => ({
            query: p.query,
            count: p.count,
            avgResultCount: p.avgResultCount,
            clickThroughRate: p.clickThroughRate,
          })),
        };
      } catch (error) {
        console.error("Error fetching popular searches:", error);
        return {
          success: false,
          popular: [],
          error: "Failed to fetch popular searches",
        };
      }
    }),

  /**
   * Get user's search analytics
   */
  getAnalytics: protectedProcedure
    .input(
      z.object({
        days: z.number().min(1).max(365).default(30),
      })
    )
    .query(async ({ input, ctx }) => {
      const user = ctx.user as any;

      try {
        const analytics = await getUserSearchAnalytics(user.id, input.days);

        // Calculate metrics
        const totalSearches = analytics.length;
        const totalClicks = analytics.filter((a) => a.resultClicked).length;
        const avgResultCount =
          analytics.reduce((sum, a) => sum + a.resultCount, 0) / totalSearches || 0;
        const avgSearchDuration =
          analytics.reduce((sum, a) => sum + (a.searchDuration || 0), 0) / totalSearches || 0;

        return {
          success: true,
          metrics: {
            totalSearches,
            totalClicks,
            clickThroughRate: (totalClicks / totalSearches) * 100 || 0,
            avgResultCount,
            avgSearchDuration,
          },
          recentSearches: analytics.slice(0, 10),
        };
      } catch (error) {
        console.error("Error fetching analytics:", error);
        return {
          success: false,
          metrics: {
            totalSearches: 0,
            totalClicks: 0,
            clickThroughRate: 0,
            avgResultCount: 0,
            avgSearchDuration: 0,
          },
          recentSearches: [],
          error: "Failed to fetch analytics",
        };
      }
    }),

  /**
   * Lightweight autocomplete API - returns only text suggestions
   */
  autocomplete: protectedProcedure
    .input(
      z.object({
        query: z.string().min(1).max(50),
        limit: z.number().min(1).max(20).default(10),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = getDb();
      const searchTerm = `%${input.query}%`;

      // Check cache first (shorter TTL for autocomplete - 2 minutes)
      const cacheKey = cacheService.generateKey(input.query, {}, "autocomplete");
      const cachedSuggestions = cacheService.get(cacheKey);
      if (cachedSuggestions) {
        return cachedSuggestions;
      }

      try {
        // Get distinct animal names
        const animalNames = await db
          .selectDistinct({ name: animals.animalName })
          .from(animals)
          .where(like(animals.animalName, searchTerm))
          .limit(input.limit);

        // Get distinct farm names
        const farmNames = await db
          .selectDistinct({ name: farms.farmName })
          .from(farms)
          .where(like(farms.farmName, searchTerm))
          .limit(input.limit);

        // Get distinct crop names
        const cropNames = await db
          .selectDistinct({ name: crops.cropName })
          .from(crops)
          .where(like(crops.cropName, searchTerm))
          .limit(input.limit);

        // Combine and deduplicate
        const suggestions = [
          ...animalNames.map((a) => ({ text: a.name, category: "animal" })),
          ...farmNames.map((f) => ({ text: f.name, category: "farm" })),
          ...cropNames.map((c) => ({ text: c.name, category: "crop" })),
        ]
          .filter((item, index, self) => self.findIndex((t) => t.text === item.text) === index)
          .slice(0, input.limit);

        const response = {
          success: true,
          suggestions,
        };

        // Cache for 2 minutes
        cacheService.set(cacheKey, response, 120);

        return response;
      } catch (error) {
        console.error("Autocomplete error:", error);
        return {
          success: false,
          suggestions: [],
          error: "Autocomplete failed",
        };
      }
    }),

  /**
   * Search animals by name, type, or ID with filters
   */
  searchAnimals: protectedProcedure
    .input(
      z.object({
        query: z.string().min(1).max(100),
        farmId: z.number().optional(),
        type: z.string().optional(),
        status: z.string().optional(),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = getDb();
      const searchTerm = `%${input.query}%`;
      const user = ctx.user as any;
      const farmId = input.farmId || user.farmId;

      try {
        const conditions: any[] = [like(animals.animalName, searchTerm)];

        if (farmId) {
          conditions.push(eq(animals.farmId, farmId));
        }

        if (input.type) {
          conditions.push(eq(animals.animalType, input.type));
        }

        if (input.status) {
          conditions.push(eq(animals.status, input.status));
        }

        const results = await db
          .select()
          .from(animals)
          .where(conditions.length > 1 ? and(...conditions) : conditions[0])
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
          .where(like(farms.farmName, searchTerm))
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

  /**
   * Get cache statistics (for monitoring)
   */
  getCacheStats: protectedProcedure
    .query(async ({ ctx }) => {
      const user = ctx.user as any;
      
      // Only admins can view cache stats
      if (user.role !== "admin") {
        return {
          success: false,
          error: "Unauthorized",
        };
      }

      try {
        const stats = cacheService.getStats();
        return {
          success: true,
          stats,
        };
      } catch (error) {
        console.error("Error getting cache stats:", error);
        return {
          success: false,
          error: "Failed to get cache stats",
        };
      }
    }),

  /**
   * Clear search cache (for admins)
   */
  clearCache: protectedProcedure
    .input(
      z.object({
        pattern: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const user = ctx.user as any;
      
      // Only admins can clear cache
      if (user.role !== "admin") {
        return {
          success: false,
          error: "Unauthorized",
        };
      }

      try {
        let cleared = 0;
        if (input.pattern) {
          cleared = cacheService.deletePattern(input.pattern);
        } else {
          cacheService.clear();
          cleared = -1; // Indicates full clear
        }

        return {
          success: true,
          cleared,
          message: cleared === -1 ? "Cache cleared" : `Cleared ${cleared} entries`,
        };
      } catch (error) {
        console.error("Error clearing cache:", error);
        return {
          success: false,
          error: "Failed to clear cache",
        };
      }
    }),
});
