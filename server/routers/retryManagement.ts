import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { retryService } from "../services/retryService";

export const retryManagementRouter = router({
  /**
   * Check if an operation can be retried
   */
  canRetry: protectedProcedure
    .input(z.object({ operationId: z.string() }))
    .query(async ({ input }) => {
      const canRetry = await retryService.shouldRetry(input.operationId);
      const status = await retryService.getRetryStatus(input.operationId);
      return { canRetry, status };
    }),

  /**
   * Get retry status for an operation
   */
  getRetryStatus: protectedProcedure
    .input(z.object({ operationId: z.string() }))
    .query(async ({ input }) => {
      const status = await retryService.getRetryStatus(input.operationId);
      return status;
    }),

  /**
   * Get retry history for an operation
   */
  getRetryHistory: protectedProcedure
    .input(z.object({ operationId: z.string() }))
    .query(async ({ input }) => {
      const history = await retryService.getRetryHistory(input.operationId);
      return history;
    }),

  /**
   * Manually retry a failed operation
   */
  manualRetry: protectedProcedure
    .input(z.object({ operationId: z.string() }))
    .mutation(async ({ input }) => {
      const result = await retryService.manualRetry(input.operationId);
      return result;
    }),

  /**
   * Get pending retries (for background job)
   */
  getPendingRetries: protectedProcedure.query(async () => {
    const pendingRetries = await retryService.getPendingRetries();
    return pendingRetries;
  }),

  /**
   * Mark retry as in-progress
   */
  markRetryInProgress: protectedProcedure
    .input(z.object({ retryLogId: z.number() }))
    .mutation(async ({ input }) => {
      const result = await retryService.markRetryInProgress(input.retryLogId);
      return result;
    }),

  /**
   * Mark retry as completed
   */
  markRetryCompleted: protectedProcedure
    .input(
      z.object({
        retryLogId: z.number(),
        operationId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await retryService.markRetryCompleted(input.retryLogId, input.operationId);
      return result;
    }),

  /**
   * Mark retry as failed
   */
  markRetryFailed: protectedProcedure
    .input(
      z.object({
        retryLogId: z.number(),
        operationId: z.string(),
        errorMessage: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await retryService.markRetryFailed(
        input.retryLogId,
        input.operationId,
        input.errorMessage
      );
      return result;
    }),

  /**
   * Get retry configuration
   */
  getRetryConfig: protectedProcedure.query(async () => {
    return {
      maxRetries: retryService["config"].maxRetries,
      initialDelayMs: retryService["config"].initialDelayMs,
      maxDelayMs: retryService["config"].maxDelayMs,
      backoffMultiplier: retryService["config"].backoffMultiplier,
    };
  }),
});
