import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { bulkOperationHistory, operationFailureDetails, operationRetryLog } from "../../drizzle/schema";
import { eq, and, desc, gte, lte, like } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export const operationHistoryRouter = router({
  /**
   * Create a new operation history record
   */
  createOperation: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        operationType: z.enum(["batch-edit", "import", "export", "bulk-register"]),
        totalItems: z.number().min(1),
        details: z.record(z.any()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const operationId = uuidv4();

      const result = await db.insert(bulkOperationHistory).values({
        id: operationId,
        farmId: input.farmId,
        userId: ctx.user.id,
        operationType: input.operationType,
        totalItems: input.totalItems,
        details: input.details,
      });

      return { operationId, success: !!result };
    }),

  /**
   * Update operation progress
   */
  updateOperation: protectedProcedure
    .input(
      z.object({
        operationId: z.string(),
        status: z.enum(["pending", "in-progress", "completed", "failed", "cancelled"]),
        processedItems: z.number().optional(),
        successCount: z.number().optional(),
        failureCount: z.number().optional(),
        errorMessage: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      const updates: any = {
        status: input.status,
      };

      if (input.processedItems !== undefined) {
        updates.processedItems = input.processedItems;
      }
      if (input.successCount !== undefined) {
        updates.successCount = input.successCount;
      }
      if (input.failureCount !== undefined) {
        updates.failureCount = input.failureCount;
      }
      if (input.errorMessage !== undefined) {
        updates.errorMessage = input.errorMessage;
      }

      if (input.status === "completed" || input.status === "failed") {
        updates.completedAt = new Date();
        // Calculate duration
        const operation = await db
          .select()
          .from(bulkOperationHistory)
          .where(eq(bulkOperationHistory.id, input.operationId))
          .limit(1);

        if (operation.length > 0 && operation[0].startedAt) {
          updates.duration = Date.now() - operation[0].startedAt.getTime();
        }
      }

      const result = await db
        .update(bulkOperationHistory)
        .set(updates)
        .where(eq(bulkOperationHistory.id, input.operationId));

      return { success: !!result };
    }),

  /**
   * Get operation by ID
   */
  getOperation: protectedProcedure
    .input(z.object({ operationId: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();

      const operation = await db
        .select()
        .from(bulkOperationHistory)
        .where(eq(bulkOperationHistory.id, input.operationId))
        .limit(1);

      return operation[0] || null;
    }),

  /**
   * Get operation history for a farm
   */
  getFarmOperationHistory: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        operationType: z.enum(["batch-edit", "import", "export", "bulk-register"]).optional(),
        status: z.enum(["pending", "in-progress", "completed", "failed", "cancelled"]).optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();

      const conditions = [eq(bulkOperationHistory.farmId, input.farmId)];

      if (input.operationType) {
        conditions.push(eq(bulkOperationHistory.operationType, input.operationType));
      }
      if (input.status) {
        conditions.push(eq(bulkOperationHistory.status, input.status));
      }

      const operations = await db
        .select()
        .from(bulkOperationHistory)
        .where(and(...conditions))
        .orderBy(desc(bulkOperationHistory.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      const total = await db
        .select({ count: bulkOperationHistory.id })
        .from(bulkOperationHistory)
        .where(and(...conditions));

      return {
        operations,
        total: total.length,
      };
    }),

  /**
   * Get operation statistics for a farm
   */
  getOperationStats: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();

      const conditions = [eq(bulkOperationHistory.farmId, input.farmId)];

      if (input.startDate) {
        conditions.push(gte(bulkOperationHistory.createdAt, input.startDate));
      }
      if (input.endDate) {
        conditions.push(lte(bulkOperationHistory.createdAt, input.endDate));
      }

      const operations = await db
        .select()
        .from(bulkOperationHistory)
        .where(and(...conditions));

      const stats = {
        total: operations.length,
        completed: operations.filter((op) => op.status === "completed").length,
        failed: operations.filter((op) => op.status === "failed").length,
        inProgress: operations.filter((op) => op.status === "in-progress").length,
        totalItems: operations.reduce((sum, op) => sum + op.totalItems, 0),
        totalProcessed: operations.reduce((sum, op) => sum + op.processedItems, 0),
        totalSuccess: operations.reduce((sum, op) => sum + op.successCount, 0),
        totalFailures: operations.reduce((sum, op) => sum + op.failureCount, 0),
        averageDuration:
          operations.filter((op) => op.duration).length > 0
            ? Math.round(
                operations
                  .filter((op) => op.duration)
                  .reduce((sum, op) => sum + (op.duration || 0), 0) /
                  operations.filter((op) => op.duration).length
              )
            : 0,
        byType: {
          "batch-edit": operations.filter((op) => op.operationType === "batch-edit").length,
          import: operations.filter((op) => op.operationType === "import").length,
          export: operations.filter((op) => op.operationType === "export").length,
          "bulk-register": operations.filter((op) => op.operationType === "bulk-register").length,
        },
      };

      return stats;
    }),

  /**
   * Add failure details for an operation
   */
  addFailureDetails: protectedProcedure
    .input(
      z.object({
        operationId: z.string(),
        itemId: z.string(),
        itemType: z.string(),
        errorCode: z.string(),
        errorMessage: z.string(),
        itemData: z.record(z.any()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      const result = await db.insert(operationFailureDetails).values({
        operationId: input.operationId,
        itemId: input.itemId,
        itemType: input.itemType,
        errorCode: input.errorCode,
        errorMessage: input.errorMessage,
        itemData: input.itemData,
      });

      return { success: !!result };
    }),

  /**
   * Get failure details for an operation
   */
  getFailureDetails: protectedProcedure
    .input(z.object({ operationId: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();

      const failures = await db
        .select()
        .from(operationFailureDetails)
        .where(eq(operationFailureDetails.operationId, input.operationId));

      return failures;
    }),

  /**
   * Search operations
   */
  searchOperations: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        query: z.string().optional(),
        limit: z.number().default(20),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();

      const conditions = [eq(bulkOperationHistory.farmId, input.farmId)];

      if (input.query) {
        conditions.push(like(bulkOperationHistory.id, `%${input.query}%`));
      }

      const operations = await db
        .select()
        .from(bulkOperationHistory)
        .where(and(...conditions))
        .orderBy(desc(bulkOperationHistory.createdAt))
        .limit(input.limit);

      return operations;
    }),

  /**
   * Delete old operation history (cleanup)
   */
  deleteOldOperations: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        olderThanDays: z.number().default(90),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - input.olderThanDays);

      const result = await db
        .delete(bulkOperationHistory)
        .where(
          and(
            eq(bulkOperationHistory.farmId, input.farmId),
            lte(bulkOperationHistory.createdAt, cutoffDate)
          )
        );

      return { success: !!result };
    }),
});
