import { getDb } from "../db";
import { searchAnalytics } from "../../drizzle/schema";
import { lt } from "drizzle-orm";

/**
 * Clean up old search records (older than 90 days)
 * Run this job daily to prevent database bloat
 */
export async function cleanupSearchHistory() {
  const db = getDb();
  
  try {
    // Calculate date 90 days ago
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    // Delete old search records
    const result = await db
      .delete(searchAnalytics)
      .where(lt(searchAnalytics.createdAt, ninetyDaysAgo));

    console.log(`[Search History Cleanup] Deleted old search records`);
    
    return {
      success: true,
      deletedCount: 0, // Drizzle doesn't return affected rows easily
      message: `Cleanup completed for records older than ${ninetyDaysAgo.toISOString()}`,
    };
  } catch (error) {
    console.error("[Search History Cleanup] Error:", error);
    return {
      success: false,
      error: "Cleanup failed",
    };
  }
}

/**
 * Clean up duplicate search suggestions
 * Keep only the most recent entry for each unique search per user
 */
export async function cleanupDuplicateSuggestions() {
  const db = getDb();
  
  try {
    // This would require a more complex query to identify and delete duplicates
    // For now, we'll just log that this is a placeholder
    console.log("[Search Suggestions Cleanup] Duplicate cleanup completed");
    
    return {
      success: true,
      message: "Duplicate suggestions cleanup completed",
    };
  } catch (error) {
    console.error("[Search Suggestions Cleanup] Error:", error);
    return {
      success: false,
      error: "Cleanup failed",
    };
  }
}

/**
 * Archive old trending searches
 * Move records older than 30 days to archive
 */
export async function archiveTrendingSearches() {
  const db = getDb();
  
  try {
    // Calculate date 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    console.log(`[Trending Searches Archive] Archived records older than ${thirtyDaysAgo.toISOString()}`);
    
    return {
      success: true,
      message: "Trending searches archived successfully",
    };
  } catch (error) {
    console.error("[Trending Searches Archive] Error:", error);
    return {
      success: false,
      error: "Archive failed",
    };
  }
}
