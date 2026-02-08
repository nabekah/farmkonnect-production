import cron from "node-cron";
import { getDb } from "../db";
import { searchAnalytics } from "../../drizzle/schema";
import { lt } from "drizzle-orm";

export class SearchHistoryCleanupScheduler {
  private static instance: SearchHistoryCleanupScheduler;
  private job: cron.ScheduledTask | null = null;

  private constructor() {}

  static getInstance(): SearchHistoryCleanupScheduler {
    if (!SearchHistoryCleanupScheduler.instance) {
      SearchHistoryCleanupScheduler.instance = new SearchHistoryCleanupScheduler();
    }
    return SearchHistoryCleanupScheduler.instance;
  }

  start(): void {
    if (this.job) {
      console.log("[SearchHistoryCleanupScheduler] Already running");
      return;
    }

    // Run daily at 2:00 AM (off-peak hours)
    this.job = cron.schedule("0 2 * * *", async () => {
      console.log("[SearchHistoryCleanupScheduler] Running search history cleanup...");
      await this.cleanup();
    });

    console.log("[SearchHistoryCleanupScheduler] Started - runs daily at 2:00 AM");
  }

  stop(): void {
    if (this.job) {
      this.job.stop();
      this.job = null;
      console.log("[SearchHistoryCleanupScheduler] Stopped");
    }
  }

  private async cleanup(): Promise<void> {
    try {
      const db = getDb();
      if (!db) {
        console.error("[SearchHistoryCleanupScheduler] Database connection failed");
        return;
      }

      // Calculate date 90 days ago
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      console.log(
        `[SearchHistoryCleanupScheduler] Deleting search records older than ${ninetyDaysAgo.toISOString()}`
      );

      // Delete old search records
      const result = await db
        .delete(searchAnalytics)
        .where(lt(searchAnalytics.createdAt, ninetyDaysAgo));

      console.log(
        `[SearchHistoryCleanupScheduler] Cleanup completed - deleted old search records`
      );

      // Log cleanup metrics
      const stats = {
        timestamp: new Date().toISOString(),
        cutoffDate: ninetyDaysAgo.toISOString(),
        operation: "search_history_cleanup",
        status: "completed",
      };

      console.log("[SearchHistoryCleanupScheduler] Cleanup stats:", stats);
    } catch (error) {
      console.error("[SearchHistoryCleanupScheduler] Error:", error);
    }
  }

  // Manual trigger for testing
  async triggerNow(): Promise<void> {
    console.log("[SearchHistoryCleanupScheduler] Manually triggered");
    await this.cleanup();
  }
}

// Export singleton instance
export const searchHistoryCleanupScheduler = SearchHistoryCleanupScheduler.getInstance();
