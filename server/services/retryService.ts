import { getDb } from "../db";
import { bulkOperationHistory, operationRetryLog } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 5000, // 5 seconds
  maxDelayMs: 300000, // 5 minutes
  backoffMultiplier: 2,
};

export class RetryService {
  private config: RetryConfig;

  constructor(config: Partial<RetryConfig> = {}) {
    this.config = { ...DEFAULT_RETRY_CONFIG, ...config };
  }

  /**
   * Calculate delay for next retry with exponential backoff
   */
  calculateNextRetryDelay(retryAttempt: number, backoffMultiplier: number = this.config.backoffMultiplier): number {
    const delay = this.config.initialDelayMs * Math.pow(backoffMultiplier, retryAttempt - 1);
    return Math.min(delay, this.config.maxDelayMs);
  }

  /**
   * Create a retry log entry
   */
  async createRetryLog(
    operationId: string,
    retryAttempt: number,
    errorMessage: string,
    backoffMultiplier: number = this.config.backoffMultiplier
  ) {
    const db = await getDb();
    if (!db) {
      return { success: false, nextRetryAt: new Date(), delayMs: 0 };
    }
    const delay = this.calculateNextRetryDelay(retryAttempt, backoffMultiplier);
    const nextRetryAt = new Date(Date.now() + delay);

    const result = await db.insert(operationRetryLog).values({
      operationId,
      retryAttempt,
      status: "pending",
      errorMessage,
      nextRetryAt,
      backoffMultiplier: backoffMultiplier.toString(),
    });

    return { success: !!result, nextRetryAt, delayMs: delay };
  }

  /**
   * Check if an operation should be retried
   */
  async shouldRetry(operationId: string): Promise<boolean> {
    const db = await getDb();
    if (!db) return false;

    const operation = await db
      .select()
      .from(bulkOperationHistory)
      .where(eq(bulkOperationHistory.id, operationId))
      .limit(1);

    if (!operation.length || operation[0].status !== "failed") {
      return false;
    }

    const retryCount = operation[0].retryCount || 0;
    return retryCount < this.config.maxRetries;
  }

  /**
   * Get pending retries
   */
  async getPendingRetries() {
    const db = await getDb();
    if (!db) return [];
    const now = new Date();

    const pendingRetries = await db
      .select()
      .from(operationRetryLog)
      .where(
        and(
          eq(operationRetryLog.status, "pending"),
          // nextRetryAt is in the past or null (should retry immediately)
          // This is a simplified check - in production, use proper date comparison
        )
      );

    return pendingRetries.filter((retry) => {
      if (!retry.nextRetryAt) return true;
      return new Date(retry.nextRetryAt) <= now;
    });
  }

  /**
   * Mark retry as in-progress
   */
  async markRetryInProgress(retryLogId: number) {
    const db = await getDb();
    if (!db) return { success: false };

    const result = await db
      .update(operationRetryLog)
      .set({ status: "in-progress" })
      .where(eq(operationRetryLog.id, retryLogId));

    return { success: !!result };
  }

  /**
   * Mark retry as completed
   */
  async markRetryCompleted(retryLogId: number, operationId: string) {
    const db = await getDb();
    if (!db) return { success: false };

    // Update retry log
    await db
      .update(operationRetryLog)
      .set({ status: "completed", completedAt: new Date() })
      .where(eq(operationRetryLog.id, retryLogId));

    // Update operation status
    const result = await db
      .update(bulkOperationHistory)
      .set({ status: "completed" })
      .where(eq(bulkOperationHistory.id, operationId));

    return { success: !!result };
  }

  /**
   * Mark retry as failed
   */
  async markRetryFailed(retryLogId: number, operationId: string, errorMessage: string) {
    const db = await getDb();
    if (!db) return { success: false };

    // Update retry log
    const retryLog = await db
      .select()
      .from(operationRetryLog)
      .where(eq(operationRetryLog.id, retryLogId))
      .limit(1);

    if (!retryLog.length) {
      return { success: false };
    }

    const currentRetry = retryLog[0];
    const nextRetryAttempt = currentRetry.retryAttempt + 1;

    // Check if we should retry again
    if (nextRetryAttempt <= this.config.maxRetries) {
      // Create next retry
      const multiplier = currentRetry.backoffMultiplier ? parseFloat(currentRetry.backoffMultiplier.toString()) : 1.5;
      const delay = this.calculateNextRetryDelay(nextRetryAttempt, multiplier);
      const nextRetryAt = new Date(Date.now() + delay);

      await db.insert(operationRetryLog).values({
        operationId,
        retryAttempt: nextRetryAttempt,
        status: "pending",
        errorMessage,
        nextRetryAt,
        backoffMultiplier: (currentRetry.backoffMultiplier || 1.5).toString(),
      });

      // Update operation retry count
      await db
        .update(bulkOperationHistory)
        .set({ retryCount: nextRetryAttempt })
        .where(eq(bulkOperationHistory.id, operationId));
    } else {
      // Max retries exceeded, mark as failed
      await db
        .update(bulkOperationHistory)
        .set({ status: "failed", errorMessage })
        .where(eq(bulkOperationHistory.id, operationId));
    }

    // Mark current retry as failed
    const result = await db
      .update(operationRetryLog)
      .set({ status: "failed", completedAt: new Date() })
      .where(eq(operationRetryLog.id, retryLogId));

    return { success: !!result };
  }

  /**
   * Get retry history for an operation
   */
  async getRetryHistory(operationId: string) {
    const db = await getDb();
    if (!db) return [];

    const retries = await db
      .select()
      .from(operationRetryLog)
      .where(eq(operationRetryLog.operationId, operationId));

    return retries;
  }

  /**
   * Get operation retry status
   */
  async getRetryStatus(operationId: string) {
    const db = await getDb();
    if (!db) return null;

    const operation = await db
      .select()
      .from(bulkOperationHistory)
      .where(eq(bulkOperationHistory.id, operationId))
      .limit(1);

    if (!operation.length) {
      return null;
    }

    const op = operation[0];
    const retries = await this.getRetryHistory(operationId);

    return {
      operationId,
      status: op.status,
      retryCount: op.retryCount,
      maxRetries: this.config.maxRetries,
      canRetry: op.status === "failed" && op.retryCount < this.config.maxRetries,
      retries,
      lastRetry: retries.length > 0 ? retries[retries.length - 1] : null,
    };
  }

  /**
   * Manually retry a failed operation
   */
  async manualRetry(operationId: string) {
    const db = await getDb();
    if (!db) {
      return { success: false, error: "Database not available" };
    }

    const operation = await db
      .select()
      .from(bulkOperationHistory)
      .where(eq(bulkOperationHistory.id, operationId))
      .limit(1);

    if (!operation.length || operation[0].status !== "failed") {
      return { success: false, error: "Operation not found or not in failed state" };
    }

    const op = operation[0];

    // Reset operation to pending
    await db
      .update(bulkOperationHistory)
      .set({
        status: "pending",
        processedItems: 0,
        successCount: 0,
        failureCount: 0,
        errorMessage: null,
      })
      .where(eq(bulkOperationHistory.id, operationId));

    // Create retry log
    const retryAttempt = (op.retryCount || 0) + 1;
    const delay = this.calculateNextRetryDelay(retryAttempt);
    const nextRetryAt = new Date(Date.now() + delay);

    const result = await db.insert(operationRetryLog).values({
      operationId,
      retryAttempt,
      status: "pending",
      errorMessage: "Manual retry initiated",
      nextRetryAt,
      backoffMultiplier: this.config.backoffMultiplier.toString(),
    });

    return { success: !!result, nextRetryAt, delayMs: delay };
  }
}

export const retryService = new RetryService();
