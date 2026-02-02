import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { reportExportService } from "../_core/reportExportService";
import { TRPCError } from "@trpc/server";

export const reportExportRouter = router({
  // ============================================================================
  // EXPORT OPERATIONS
  // ============================================================================

  exportReport: protectedProcedure
    .input(
      z.object({
        reportHistoryId: z.number(),
        farmId: z.number(),
        format: z.enum(["pdf", "excel", "csv"]),
        reportData: z.any(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const result = await reportExportService.exportReport(
          input.reportHistoryId,
          input.farmId,
          ctx.user.id,
          input.format,
          input.reportData
        );

        return {
          success: true,
          ...result,
          message: `Report exported as ${input.format.toUpperCase()} successfully`,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to export report: ${error}`,
        });
      }
    }),

  trackDownload: protectedProcedure
    .input(z.object({ exportId: z.number() }))
    .mutation(async ({ input }) => {
      try {
        await reportExportService.trackDownload(input.exportId);

        return {
          success: true,
          message: "Download tracked successfully",
        };
      } catch (error: any) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error.message || `Failed to track download: ${error}`,
        });
      }
    }),

  // ============================================================================
  // ARCHIVAL OPERATIONS
  // ============================================================================

  archiveReport: protectedProcedure
    .input(
      z.object({
        reportHistoryId: z.number(),
        farmId: z.number(),
        reportData: z.any(),
        retentionDays: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const result = await reportExportService.archiveReport(
          input.reportHistoryId,
          input.farmId,
          input.reportData,
          input.retentionDays
        );

        return {
          success: true,
          ...result,
          message: "Report archived successfully",
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to archive report: ${error}`,
        });
      }
    }),

  getArchivedReport: protectedProcedure
    .input(z.object({ archivalId: z.number() }))
    .query(async ({ input }) => {
      try {
        const archive = await reportExportService.getArchivedReport(input.archivalId);
        return archive;
      } catch (error: any) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: error.message || `Failed to fetch archived report: ${error}`,
        });
      }
    }),

  restoreArchive: protectedProcedure
    .input(z.object({ archivalId: z.number() }))
    .mutation(async ({ input }) => {
      try {
        await reportExportService.restoreArchive(input.archivalId);

        return {
          success: true,
          message: "Archive restored successfully",
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to restore archive: ${error}`,
        });
      }
    }),

  getFarmArchives: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ input }) => {
      try {
        const archives = await reportExportService.getFarmArchives(input.farmId);
        return archives;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch farm archives: ${error}`,
        });
      }
    }),

  deleteExpiredArchives: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .mutation(async ({ input }) => {
      try {
        const deletedCount = await reportExportService.deleteExpiredArchives();

        return {
          success: true,
          deletedCount,
          message: `${deletedCount} expired archives deleted`,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to delete expired archives: ${error}`,
        });
      }
    }),

  // ============================================================================
  // STATISTICS
  // ============================================================================

  getExportStats: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ input }) => {
      try {
        const stats = await reportExportService.getExportStats(input.farmId);
        return stats;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch export statistics: ${error}`,
        });
      }
    }),
});
