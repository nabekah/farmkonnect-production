import { getDb } from '../db';
import { reportArchival, reportExportLog, reportHistory } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';
import { storagePut, storageGet } from '../storage';

export interface ArchivalPolicy {
  retentionDays: number;
  autoArchive: boolean;
  archiveAfterDays: number;
}

export class ReportExportService {
  private defaultRetentionDays = 365; // 1 year

  /**
   * Export report and create download link
   */
  async exportReport(
    reportHistoryId: number,
    farmId: number,
    exportedBy: number,
    format: 'pdf' | 'excel' | 'csv',
    reportData: any
  ) {
    const db = await getDb();
    if (!db) throw new Error('Database connection failed');

    try {
      // Generate file content based on format
      const fileContent = this.generateFileContent(reportData, format);
      const fileName = `report-${reportHistoryId}-${Date.now()}.${this.getFileExtension(format)}`;
      const s3Key = `reports/${farmId}/${fileName}`;

      // Upload to S3
      const { url } = await storagePut(s3Key, fileContent, this.getMimeType(format));

      // Create export log
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // 30-day download link expiry

      const [result] = await db.insert(reportExportLog).values({
        reportHistoryId,
        farmId,
        exportedBy,
        exportFormat: format,
        downloadUrl: url,
        expiresAt,
        downloadCount: 0,
      });

      return {
        exportId: result.insertId,
        downloadUrl: url,
        expiresAt,
        format,
      };
    } catch (error) {
      throw new Error(`Failed to export report: ${error}`);
    }
  }

  /**
   * Archive report to S3 for long-term storage
   */
  async archiveReport(
    reportHistoryId: number,
    farmId: number,
    reportData: any,
    retentionDays: number = this.defaultRetentionDays
  ) {
    const db = await getDb();
    if (!db) throw new Error('Database connection failed');

    try {
      // Generate PDF for archival (standard format)
      const fileContent = this.generateFileContent(reportData, 'pdf');
      const fileName = `archived-report-${reportHistoryId}-${Date.now()}.pdf`;
      const s3Key = `report-archives/${farmId}/${fileName}`;

      // Upload to S3
      const { url } = await storagePut(s3Key, fileContent, 'application/pdf');

      // Calculate expiry date based on retention policy
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + retentionDays);

      // Create archival record
      const [result] = await db.insert(reportArchival).values({
        reportHistoryId,
        farmId,
        s3Key,
        s3Url: url,
        retentionDays,
        expiresAt,
        isRestored: false,
      });

      return {
        archivalId: result.insertId,
        s3Url: url,
        expiresAt,
        retentionDays,
      };
    } catch (error) {
      throw new Error(`Failed to archive report: ${error}`);
    }
  }

  /**
   * Get archived report
   */
  async getArchivedReport(archivalId: number) {
    const db = await getDb();
    if (!db) throw new Error('Database connection failed');

    const archives = await db
      .select()
      .from(reportArchival)
      .where(eq(reportArchival.id, archivalId))
      .limit(1);

    if (!archives.length) {
      throw new Error('Archived report not found');
    }

    const archive = archives[0];

    // Check if expired
    if (archive.expiresAt && new Date() > archive.expiresAt) {
      throw new Error('Archived report has expired');
    }

    // Get presigned URL for download
    const presignedUrl = await storageGet(archive.s3Key); // Get download URL

    return {
      ...archive,
      downloadUrl: presignedUrl.url,
    };
  }

  /**
   * Restore archived report (mark as restored)
   */
  async restoreArchive(archivalId: number) {
    const db = await getDb();
    if (!db) throw new Error('Database connection failed');

    await db
      .update(reportArchival)
      .set({
        isRestored: true,
        restoredAt: new Date(),
      })
      .where(eq(reportArchival.id, archivalId));

    return true;
  }

  /**
   * Get all archives for a farm
   */
  async getFarmArchives(farmId: number) {
    const db = await getDb();
    if (!db) throw new Error('Database connection failed');

    const archives = await db
      .select()
      .from(reportArchival)
      .where(eq(reportArchival.farmId, farmId));

    return archives;
  }

  /**
   * Delete expired archives
   */
  async deleteExpiredArchives() {
    const db = await getDb();
    if (!db) throw new Error('Database connection failed');

    const now = new Date();

    const expiredArchives = await db
      .select()
      .from(reportArchival)
      .where(eq(reportArchival.isRestored, false));

    let deletedCount = 0;

    for (const archive of expiredArchives) {
      if (archive.expiresAt && archive.expiresAt < now) {
        // Delete from S3 would go here (if implemented)
        await db
          .delete(reportArchival)
          .where(eq(reportArchival.id, archive.id));
        deletedCount++;
      }
    }

    return deletedCount;
  }

  /**
   * Track export download
   */
  async trackDownload(exportId: number) {
    const db = await getDb();
    if (!db) throw new Error('Database connection failed');

    const exports = await db
      .select()
      .from(reportExportLog)
      .where(eq(reportExportLog.id, exportId))
      .limit(1);

    if (!exports.length) {
      throw new Error('Export not found');
    }

    const exportLog = exports[0];

    // Check if expired
    if (exportLog.expiresAt && new Date() > exportLog.expiresAt) {
      throw new Error('Download link has expired');
    }

    // Update download count and last download time
    await db
      .update(reportExportLog)
      .set({
        downloadCount: (exportLog.downloadCount || 0) + 1,
        lastDownloadedAt: new Date(),
      })
      .where(eq(reportExportLog.id, exportId));

    return true;
  }

  /**
   * Get export statistics for a farm
   */
  async getExportStats(farmId: number) {
    const db = await getDb();
    if (!db) throw new Error('Database connection failed');

    const exports = await db
      .select()
      .from(reportExportLog)
      .where(eq(reportExportLog.farmId, farmId));

    const archives = await db
      .select()
      .from(reportArchival)
      .where(eq(reportArchival.farmId, farmId));

    const totalDownloads = exports.reduce((sum, e) => sum + (e.downloadCount || 0), 0);
    const expiredExports = exports.filter((e) => e.expiresAt && new Date() > e.expiresAt).length;
    const expiredArchives = archives.filter((a) => a.expiresAt && new Date() > a.expiresAt).length;

    return {
      totalExports: exports.length,
      totalDownloads,
      expiredExports,
      totalArchives: archives.length,
      expiredArchives,
      activeArchives: archives.length - expiredArchives,
      averageDownloadsPerExport: exports.length > 0 ? totalDownloads / exports.length : 0,
    };
  }

  /**
   * Generate file content based on format
   */
  private generateFileContent(reportData: any, format: 'pdf' | 'excel' | 'csv'): Buffer {
    // This is a placeholder - actual implementation would use libraries like pdf-lib, xlsx, etc.
    const content = JSON.stringify(reportData, null, 2);

    if (format === 'csv') {
      return Buffer.from(this.jsonToCsv(reportData));
    }

    // For PDF and Excel, return placeholder
    return Buffer.from(content);
  }

  /**
   * Convert JSON to CSV
   */
  private jsonToCsv(data: any): string {
    if (!Array.isArray(data)) {
      data = [data];
    }

    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(','),
      ...data.map((row: any) =>
        headers.map((header) => {
          const value = row[header];
          // Escape quotes and wrap in quotes if contains comma
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      ),
    ].join('\n');

    return csv;
  }

  /**
   * Get file extension for format
   */
  private getFileExtension(format: string): string {
    const extensions: Record<string, string> = {
      pdf: 'pdf',
      excel: 'xlsx',
      csv: 'csv',
    };
    return extensions[format] || 'bin';
  }

  /**
   * Get MIME type for format
   */
  private getMimeType(format: string): string {
    const mimeTypes: Record<string, string> = {
      pdf: 'application/pdf',
      excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      csv: 'text/csv',
    };
    return mimeTypes[format] || 'application/octet-stream';
  }

  /**
   * Cleanup old export logs (keep last 90 days)
   */
  async cleanupOldExports(daysToKeep: number = 90) {
    const db = await getDb();
    if (!db) throw new Error('Database connection failed');

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    // This would require a more complex query with date comparison
    // For now, return placeholder
    return { deletedCount: 0 };
  }
}

export const reportExportService = new ReportExportService();
