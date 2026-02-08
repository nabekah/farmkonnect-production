import { getDb } from "../db";
import { searchAnalytics, searchSuggestions, trendingSearches } from "../../drizzle/schema";
import { eq, desc, and, gte, sql } from "drizzle-orm";

/**
 * Track a search query for analytics
 */
export async function trackSearch(data: {
  userId: number;
  query: string;
  resultCount: number;
  resultClicked?: boolean;
  clickedResultId?: number;
  clickedResultType?: string;
  searchDuration?: number;
  filters?: Record<string, any>;
  sessionId?: string;
}) {
  const db = getDb();
  
  try {
    await db.insert(searchAnalytics).values({
      userId: data.userId,
      query: data.query,
      resultCount: data.resultCount,
      resultClicked: data.resultClicked || false,
      clickedResultId: data.clickedResultId,
      clickedResultType: data.clickedResultType,
      searchDuration: data.searchDuration,
      filters: data.filters ? JSON.stringify(data.filters) : null,
      sessionId: data.sessionId,
    });

    // Update trending searches
    await updateTrendingSearches(data.query, data.resultCount, data.resultClicked || false);

    // Add to user suggestions if clicked
    if (data.resultClicked) {
      await addSearchSuggestion(data.userId, data.query, "recent");
    }
  } catch (error) {
    console.error("Error tracking search:", error);
  }
}

/**
 * Update trending searches based on search activity
 */
async function updateTrendingSearches(
  query: string,
  resultCount: number,
  clicked: boolean
) {
  const db = getDb();

  try {
    // Get or create trending search entry for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await db
      .select()
      .from(trendingSearches)
      .where(
        and(
          eq(trendingSearches.query, query),
          eq(trendingSearches.period, "daily"),
          gte(trendingSearches.createdAt, today)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      // Update existing entry
      const entry = existing[0];
      const newSearchCount = entry.searchCount + 1;
      const newClickThroughRate = clicked
        ? ((entry.searchCount * parseFloat(entry.clickThroughRate.toString()) + 1) / newSearchCount * 100)
        : (entry.searchCount * parseFloat(entry.clickThroughRate.toString()) / newSearchCount * 100);

      await db
        .update(trendingSearches)
        .set({
          searchCount: newSearchCount,
          clickThroughRate: newClickThroughRate.toString(),
          averageResultCount: (
            (entry.searchCount * parseFloat(entry.averageResultCount.toString()) + resultCount) /
            newSearchCount
          ).toString(),
        })
        .where(eq(trendingSearches.id, entry.id));
    } else {
      // Create new entry
      await db.insert(trendingSearches).values({
        query,
        searchCount: 1,
        clickThroughRate: clicked ? "100" : "0",
        averageResultCount: resultCount.toString(),
        period: "daily",
        rank: 0, // Will be calculated separately
      });
    }
  } catch (error) {
    console.error("Error updating trending searches:", error);
  }
}

/**
 * Add a search suggestion for a user
 */
export async function addSearchSuggestion(
  userId: number,
  suggestionText: string,
  suggestionType: "recent" | "trending" | "popular"
) {
  const db = getDb();

  try {
    const existing = await db
      .select()
      .from(searchSuggestions)
      .where(
        and(
          eq(searchSuggestions.userId, userId),
          eq(searchSuggestions.suggestionText, suggestionText),
          eq(searchSuggestions.suggestionType, suggestionType)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      // Update frequency and last used
      await db
        .update(searchSuggestions)
        .set({
          frequency: existing[0].frequency + 1,
          lastUsedAt: new Date(),
        })
        .where(eq(searchSuggestions.id, existing[0].id));
    } else {
      // Create new suggestion
      await db.insert(searchSuggestions).values({
        userId,
        suggestionText,
        suggestionType,
        frequency: 1,
      });
    }
  } catch (error) {
    console.error("Error adding search suggestion:", error);
  }
}

/**
 * Get search suggestions for a user
 */
export async function getSearchSuggestions(userId: number, limit: number = 10) {
  const db = getDb();

  try {
    const suggestions = await db
      .select()
      .from(searchSuggestions)
      .where(eq(searchSuggestions.userId, userId))
      .orderBy(desc(searchSuggestions.lastUsedAt))
      .limit(limit);

    return suggestions;
  } catch (error) {
    console.error("Error fetching search suggestions:", error);
    return [];
  }
}

/**
 * Get trending searches
 */
export async function getTrendingSearches(limit: number = 10) {
  const db = getDb();

  try {
    const trending = await db
      .select()
      .from(trendingSearches)
      .where(eq(trendingSearches.period, "daily"))
      .orderBy(desc(trendingSearches.searchCount))
      .limit(limit);

    return trending;
  } catch (error) {
    console.error("Error fetching trending searches:", error);
    return [];
  }
}

/**
 * Get search analytics for a user
 */
export async function getUserSearchAnalytics(userId: number, days: number = 30) {
  const db = getDb();

  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const analytics = await db
      .select()
      .from(searchAnalytics)
      .where(
        and(
          eq(searchAnalytics.userId, userId),
          gte(searchAnalytics.createdAt, startDate)
        )
      )
      .orderBy(desc(searchAnalytics.createdAt));

    return analytics;
  } catch (error) {
    console.error("Error fetching user search analytics:", error);
    return [];
  }
}

/**
 * Get popular searches across all users
 */
export async function getPopularSearches(limit: number = 20) {
  const db = getDb();

  try {
    const popular = await db
      .select({
        query: searchAnalytics.query,
        count: sql<number>`COUNT(*) as count`,
        avgResultCount: sql<number>`AVG(${searchAnalytics.resultCount}) as avgResultCount`,
        clickThroughRate: sql<number>`SUM(CASE WHEN ${searchAnalytics.resultClicked} = true THEN 1 ELSE 0 END) / COUNT(*) * 100 as clickThroughRate`,
      })
      .from(searchAnalytics)
      .groupBy(searchAnalytics.query)
      .orderBy(desc(sql<number>`COUNT(*)`))
      .limit(limit);

    return popular;
  } catch (error) {
    console.error("Error fetching popular searches:", error);
    return [];
  }
}
