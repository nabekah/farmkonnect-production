import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { savedQueries, searchFeedback } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

export const searchEnhancementsRouter = router({
  /**
   * Save a search query for quick access
   */
  saveQuery: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        description: z.string().optional(),
        query: z.string().min(1).max(255),
        filters: z.object({
          type: z.string().optional(),
          status: z.string().optional(),
          category: z.enum(["animal", "farm", "crop"]).optional(),
        }).optional(),
        category: z.string().optional(),
        icon: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const user = ctx.user as any;

      try {
        const result = await db.insert(savedQueries).values({
          userId: user.id,
          name: input.name,
          description: input.description,
          query: input.query,
          filters: input.filters ? JSON.stringify(input.filters) : null,
          category: input.category,
          icon: input.icon,
          isPinned: false,
          usageCount: 0,
        });

        return {
          success: true,
          message: "Query saved successfully",
          queryId: result.insertId,
        };
      } catch (error) {
        console.error("Error saving query:", error);
        return {
          success: false,
          error: "Failed to save query",
        };
      }
    }),

  /**
   * Get all saved queries for the current user
   */
  getSavedQueries: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(20),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = getDb();
      const user = ctx.user as any;

      try {
        const queries = await db
          .select()
          .from(savedQueries)
          .where(eq(savedQueries.userId, user.id))
          .orderBy(desc(savedQueries.isPinned), desc(savedQueries.usageCount))
          .limit(input.limit)
          .offset(input.offset);

        return {
          success: true,
          queries: queries.map((q) => ({
            ...q,
            filters: q.filters ? JSON.parse(q.filters) : null,
          })),
        };
      } catch (error) {
        console.error("Error fetching saved queries:", error);
        return {
          success: false,
          queries: [],
          error: "Failed to fetch saved queries",
        };
      }
    }),

  /**
   * Update a saved query
   */
  updateQuery: protectedProcedure
    .input(
      z.object({
        queryId: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        isPinned: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const user = ctx.user as any;

      try {
        await db
          .update(savedQueries)
          .set({
            name: input.name,
            description: input.description,
            isPinned: input.isPinned,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(savedQueries.id, input.queryId),
              eq(savedQueries.userId, user.id)
            )
          );

        return {
          success: true,
          message: "Query updated successfully",
        };
      } catch (error) {
        console.error("Error updating query:", error);
        return {
          success: false,
          error: "Failed to update query",
        };
      }
    }),

  /**
   * Delete a saved query
   */
  deleteQuery: protectedProcedure
    .input(z.object({ queryId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const user = ctx.user as any;

      try {
        await db
          .delete(savedQueries)
          .where(
            and(
              eq(savedQueries.id, input.queryId),
              eq(savedQueries.userId, user.id)
            )
          );

        return {
          success: true,
          message: "Query deleted successfully",
        };
      } catch (error) {
        console.error("Error deleting query:", error);
        return {
          success: false,
          error: "Failed to delete query",
        };
      }
    }),

  /**
   * Record search feedback (thumbs up/down or rating)
   */
  submitFeedback: protectedProcedure
    .input(
      z.object({
        searchId: z.number().optional(),
        query: z.string(),
        resultId: z.number(),
        resultType: z.enum(["animal", "farm", "crop"]),
        resultTitle: z.string().optional(),
        feedbackType: z.enum(["thumbsUp", "thumbsDown", "rating"]),
        rating: z.number().min(1).max(5).optional(),
        comment: z.string().optional(),
        relevanceScore: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const user = ctx.user as any;

      try {
        const result = await db.insert(searchFeedback).values({
          userId: user.id,
          searchId: input.searchId,
          query: input.query,
          resultId: input.resultId,
          resultType: input.resultType,
          resultTitle: input.resultTitle,
          rating: input.rating,
          helpful:
            input.feedbackType === "thumbsUp"
              ? true
              : input.feedbackType === "thumbsDown"
              ? false
              : null,
          relevanceScore: input.relevanceScore ? String(input.relevanceScore) : null,
          feedbackType: input.feedbackType,
          comment: input.comment,
          clickedAt: new Date(),
        });

        return {
          success: true,
          message: "Feedback submitted successfully",
          feedbackId: result.insertId,
        };
      } catch (error) {
        console.error("Error submitting feedback:", error);
        return {
          success: false,
          error: "Failed to submit feedback",
        };
      }
    }),

  /**
   * Get search feedback statistics for ranking improvement
   */
  getFeedbackStats: protectedProcedure
    .input(
      z.object({
        days: z.number().default(30),
        limit: z.number().default(20),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = getDb();
      const user = ctx.user as any;

      try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - input.days);

        const feedback = await db
          .select()
          .from(searchFeedback)
          .where(
            and(
              eq(searchFeedback.userId, user.id),
              // Only get feedback from the last N days
              // Note: Drizzle doesn't have a direct gt() for dates, so we filter in JS
            )
          )
          .limit(input.limit);

        // Filter by date in JavaScript
        const recentFeedback = feedback.filter(
          (f) => f.createdAt && new Date(f.createdAt) > cutoffDate
        );

        // Calculate statistics
        const stats = {
          totalFeedback: recentFeedback.length,
          thumbsUpCount: recentFeedback.filter((f) => f.helpful === true).length,
          thumbsDownCount: recentFeedback.filter((f) => f.helpful === false).length,
          averageRating:
            recentFeedback.filter((f) => f.rating).length > 0
              ? (
                  recentFeedback
                    .filter((f) => f.rating)
                    .reduce((sum, f) => sum + (f.rating || 0), 0) /
                  recentFeedback.filter((f) => f.rating).length
                ).toFixed(2)
              : 0,
          topResults: recentFeedback
            .filter((f) => f.helpful === true)
            .slice(0, 5)
            .map((f) => ({
              resultId: f.resultId,
              resultType: f.resultType,
              resultTitle: f.resultTitle,
              helpfulCount: recentFeedback.filter(
                (rf) =>
                  rf.resultId === f.resultId &&
                  rf.resultType === f.resultType &&
                  rf.helpful === true
              ).length,
            })),
        };

        return {
          success: true,
          stats,
        };
      } catch (error) {
        console.error("Error fetching feedback stats:", error);
        return {
          success: false,
          stats: null,
          error: "Failed to fetch feedback statistics",
        };
      }
    }),

  /**
   * Increment usage count for a saved query
   */
  incrementQueryUsage: protectedProcedure
    .input(z.object({ queryId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const user = ctx.user as any;

      try {
        // Get current usage count
        const query = await db
          .select()
          .from(savedQueries)
          .where(
            and(
              eq(savedQueries.id, input.queryId),
              eq(savedQueries.userId, user.id)
            )
          );

        if (query.length === 0) {
          return {
            success: false,
            error: "Query not found",
          };
        }

        // Increment usage count
        await db
          .update(savedQueries)
          .set({
            usageCount: (query[0].usageCount || 0) + 1,
            lastUsedAt: new Date(),
          })
          .where(eq(savedQueries.id, input.queryId));

        return {
          success: true,
          message: "Usage count incremented",
        };
      } catch (error) {
        console.error("Error incrementing usage count:", error);
        return {
          success: false,
          error: "Failed to increment usage count",
        };
      }
    }),
});
