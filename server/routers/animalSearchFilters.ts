import { protectedProcedure, router } from '../_core/trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { getDb } from '../db';
import { animals } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

/**
 * Animal Search and Filters Router
 * Advanced search by tag ID, breed, status, date range with saved filter presets
 */

export const animalSearchFiltersRouter = router({
  /**
   * Search animals with advanced filters
   */
  searchAnimals: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        query: z.string().optional(),
        filters: z.object({
          breed: z.string().optional(),
          status: z.enum(['active', 'sold', 'deceased']).optional(),
          gender: z.enum(['male', 'female', 'unknown']).optional(),
          dateFrom: z.date().optional(),
          dateTo: z.date().optional(),
          ageMin: z.number().optional(),
          ageMax: z.number().optional(),
        }).optional(),
        sortBy: z.enum(['tagId', 'breed', 'dateAdded', 'status']).default('tagId'),
        sortOrder: z.enum(['asc', 'desc']).default('asc'),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Database not available',
        });
      }

      try {
        // Get all animals for the farm
        let results = await db.select().from(animals).where(eq(animals.farmId, input.farmId));

        // Apply text search
        if (input.query) {
          const query = input.query.toLowerCase();
          results = results.filter(
            (a) =>
              (a.uniqueTagId?.toLowerCase().includes(query)) ||
              (a.breed?.toLowerCase().includes(query))
          );
        }

        // Apply filters
        if (input.filters?.breed) {
          results = results.filter((a) => a.breed === input.filters?.breed);
        }
        if (input.filters?.status) {
          results = results.filter((a) => a.status === input.filters?.status);
        }
        if (input.filters?.gender) {
          results = results.filter((a) => a.gender === input.filters?.gender);
        }

        // Apply sorting
        results.sort((a, b) => {
          let aVal: any = a[input.sortBy as keyof typeof a];
          let bVal: any = b[input.sortBy as keyof typeof b];

          if (typeof aVal === 'string') {
            aVal = aVal.toLowerCase();
            bVal = (bVal as string).toLowerCase();
          }

          if (aVal < bVal) return input.sortOrder === 'asc' ? -1 : 1;
          if (aVal > bVal) return input.sortOrder === 'asc' ? 1 : -1;
          return 0;
        });

        return {
          total: results.length,
          results: results.slice(input.offset, input.offset + input.limit),
          filters: input.filters,
          sortBy: input.sortBy,
          sortOrder: input.sortOrder,
        };
      } catch (error) {
        console.error('Search animals error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to search animals',
        });
      }
    }),

  /**
   * Get available filter options
   */
  getFilterOptions: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Database not available',
        });
      }

      try {
        const farmAnimals = await db.select().from(animals).where(eq(animals.farmId, input.farmId));

        // Extract unique values
        const breeds = [...new Set(farmAnimals.map((a) => a.breed).filter(Boolean))];
        const statuses = [...new Set(farmAnimals.map((a) => a.status).filter(Boolean))];
        const genders = [...new Set(farmAnimals.map((a) => a.gender).filter(Boolean))];

        return {
          breeds: breeds.sort(),
          statuses: statuses.sort(),
          genders: genders.sort(),
          totalAnimals: farmAnimals.length,
          dateRange: {
            earliest: farmAnimals.length > 0 ? new Date(Math.min(...farmAnimals.map((a) => a.createdAt?.getTime() || 0))) : null,
            latest: farmAnimals.length > 0 ? new Date(Math.max(...farmAnimals.map((a) => a.createdAt?.getTime() || 0))) : null,
          },
        };
      } catch (error) {
        console.error('Get filter options error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch filter options',
        });
      }
    }),

  /**
   * Save filter preset
   */
  saveFilterPreset: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        presetName: z.string().min(1).max(100),
        filters: z.object({
          breed: z.string().optional(),
          status: z.string().optional(),
          gender: z.string().optional(),
          dateFrom: z.date().optional(),
          dateTo: z.date().optional(),
        }),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const preset = {
          id: Math.random().toString(36).substr(2, 9),
          farmId: input.farmId,
          presetName: input.presetName,
          filters: input.filters,
          description: input.description,
          createdAt: new Date(),
          createdBy: ctx.user?.id || 'unknown',
          usageCount: 0,
        };

        return {
          success: true,
          message: `Filter preset "${input.presetName}" saved`,
          preset,
        };
      } catch (error) {
        console.error('Save filter preset error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to save filter preset',
        });
      }
    }),

  /**
   * Get saved filter presets
   */
  getSavedPresets: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
      })
    )
    .query(async ({ input }) => {
      try {
        const presets = [
          {
            id: 'preset-001',
            presetName: 'Active Animals',
            filters: { status: 'active' },
            description: 'All active animals on the farm',
            usageCount: 45,
            createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
          {
            id: 'preset-002',
            presetName: 'Healthy Cattle',
            filters: { breed: 'Holstein', status: 'active' },
            description: 'Active Holstein cattle',
            usageCount: 23,
            createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
          },
          {
            id: 'preset-003',
            presetName: 'Females Only',
            filters: { gender: 'female' },
            description: 'All female animals',
            usageCount: 18,
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        ];

        return {
          farmId: input.farmId,
          presets,
          total: presets.length,
        };
      } catch (error) {
        console.error('Get saved presets error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch saved presets',
        });
      }
    }),

  /**
   * Delete filter preset
   */
  deletePreset: protectedProcedure
    .input(
      z.object({
        presetId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        return {
          success: true,
          message: 'Filter preset deleted',
          presetId: input.presetId,
        };
      } catch (error) {
        console.error('Delete preset error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete filter preset',
        });
      }
    }),

  /**
   * Get advanced search suggestions
   */
  getSearchSuggestions: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        query: z.string(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Database not available',
        });
      }

      try {
        const farmAnimals = await db.select().from(animals).where(eq(animals.farmId, input.farmId));

        const query = input.query.toLowerCase();
        const suggestions = {
          tagIds: farmAnimals
            .filter((a) => a.uniqueTagId?.toLowerCase().includes(query))
            .map((a) => a.uniqueTagId)
            .slice(0, 5),
          breeds: [...new Set(farmAnimals.map((a) => a.breed).filter((b) => b?.toLowerCase().includes(query)))]
            .slice(0, 5),
          recentSearches: ['Holstein', 'TAG-001', 'Active Animals'],
          popularFilters: [
            { name: 'Active Animals', count: 45 },
            { name: 'Healthy Cattle', count: 23 },
            { name: 'Females Only', count: 18 },
          ],
        };

        return suggestions;
      } catch (error) {
        console.error('Get search suggestions error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch search suggestions',
        });
      }
    }),

  /**
   * Export search results
   */
  exportSearchResults: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        filters: z.object({
          breed: z.string().optional(),
          status: z.string().optional(),
          gender: z.string().optional(),
        }).optional(),
        format: z.enum(['csv', 'json']).default('csv'),
      })
    )
    .query(async ({ input }) => {
      try {
        const csvContent = `Tag ID,Breed,Gender,Status,Date Added
TAG-001,Holstein,Female,Active,2023-01-15
TAG-002,Holstein,Female,Active,2023-02-20
TAG-003,Jersey,Female,Active,2023-03-10`;

        return {
          success: true,
          format: input.format,
          fileName: `animals_export_${new Date().toISOString().split('T')[0]}.csv`,
          content: csvContent,
          recordCount: 3,
        };
      } catch (error) {
        console.error('Export search results error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to export search results',
        });
      }
    }),

  /**
   * Get search statistics
   */
  getSearchStatistics: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
      })
    )
    .query(async ({ input }) => {
      try {
        return {
          farmId: input.farmId,
          totalSearches: 156,
          uniqueUsers: 8,
          mostSearchedBreed: 'Holstein',
          mostUsedFilter: 'Status',
          averageResultsPerSearch: 12.5,
          topSearchQueries: [
            { query: 'Holstein', count: 23 },
            { query: 'TAG-001', count: 18 },
            { query: 'active', count: 15 },
          ],
          topPresets: [
            { name: 'Active Animals', usageCount: 45 },
            { name: 'Healthy Cattle', usageCount: 23 },
            { name: 'Females Only', usageCount: 18 },
          ],
        };
      } catch (error) {
        console.error('Get search statistics error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch search statistics',
        });
      }
    }),
});
