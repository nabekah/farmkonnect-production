import { router, protectedProcedure } from "../_core/trpc";
import { getDatabaseBackupService } from "../services/databaseBackupService";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

export const backupRouter = router({
  /**
   * Create a manual database backup (admin only)
   */
  createBackup: protectedProcedure.query(async ({ ctx }) => {
    // Admin check
    if (ctx.user?.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only administrators can create backups",
      });
    }

    const backupService = getDatabaseBackupService();
    if (!backupService) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Backup service not initialized",
      });
    }

    try {
      const backup = await backupService.createBackup();
      return {
        success: true,
        backup: {
          filename: backup.filename,
          timestamp: backup.timestamp,
          size: backup.size,
          createdAt: new Date(backup.timestamp).toISOString(),
        },
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to create backup: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    }
  }),

  /**
   * Get list of available backups (admin only)
   */
  listBackups: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user?.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only administrators can view backups",
      });
    }

    const backupService = getDatabaseBackupService();
    if (!backupService) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Backup service not initialized",
      });
    }

    try {
      const backups = backupService.getAvailableBackups();
      const stats = backupService.getStatistics();

      return {
        backups: backups.map(b => ({
          filename: b.filename,
          timestamp: b.timestamp,
          size: b.size,
          createdAt: new Date(b.timestamp).toISOString(),
        })),
        statistics: {
          totalBackups: stats.totalBackups,
          totalSize: stats.totalSize,
          totalSizeMB: (stats.totalSize / (1024 * 1024)).toFixed(2),
          oldestBackup: stats.oldestBackup ? new Date(stats.oldestBackup.timestamp).toISOString() : null,
          newestBackup: stats.newestBackup ? new Date(stats.newestBackup.timestamp).toISOString() : null,
        },
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to list backups: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    }
  }),

  /**
   * Restore database from backup (admin only)
   */
  restoreBackup: protectedProcedure
    .input(z.object({ backupFile: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only administrators can restore backups",
        });
      }

      const backupService = getDatabaseBackupService();
      if (!backupService) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Backup service not initialized",
        });
      }

      try {
        const result = await backupService.restoreFromBackup(input.backupFile);
        return {
          success: result.success,
          message: result.message,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to restore backup: ${error instanceof Error ? error.message : "Unknown error"}`,
        });
      }
    }),

  /**
   * Delete a backup (admin only)
   */
  deleteBackup: protectedProcedure
    .input(z.object({ backupFile: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only administrators can delete backups",
        });
      }

      const backupService = getDatabaseBackupService();
      if (!backupService) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Backup service not initialized",
        });
      }

      try {
        const deleted = backupService.deleteBackup(input.backupFile);
        if (!deleted) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `Backup not found: ${input.backupFile}`,
          });
        }

        return {
          success: true,
          message: `Backup deleted: ${input.backupFile}`,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to delete backup: ${error instanceof Error ? error.message : "Unknown error"}`,
        });
      }
    }),
});
