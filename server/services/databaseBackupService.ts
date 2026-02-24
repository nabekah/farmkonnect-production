import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { CronJob } from 'cron';

const BACKUP_DIR = process.env.BACKUP_DIR || '/tmp/farmkonnect-backups';
const BACKUP_RETENTION_DAYS = parseInt(process.env.BACKUP_RETENTION_DAYS || '30', 10);

interface BackupInfo {
  filename: string;
  timestamp: number;
  size: number;
  path: string;
}

class DatabaseBackupService {
  private cronJob: CronJob | null = null;
  private backups: Map<string, BackupInfo> = new Map();

  constructor() {
    this.ensureBackupDir();
    this.loadExistingBackups();
  }

  /**
   * Initialize the backup service with scheduled backups
   */
  public initialize(): void {
    // Schedule daily backup at 2 AM UTC
    this.cronJob = new CronJob('0 2 * * *', () => {
      console.log('[Backup] Running scheduled backup at 2 AM UTC');
      this.createBackup().catch(err => {
        console.error('[Backup] Scheduled backup failed:', err);
      });
    });

    this.cronJob.start();
    console.log('[Backup] Service initialized - daily backups scheduled at 2 AM UTC');
  }

  /**
   * Stop the backup service
   */
  public stop(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      console.log('[Backup] Service stopped');
    }
  }

  /**
   * Create a manual backup
   */
  public async createBackup(): Promise<BackupInfo> {
    try {
      const timestamp = Date.now();
      const filename = `backup-${timestamp}.sql`;
      const filepath = path.join(BACKUP_DIR, filename);

      const dbUrl = process.env.DATABASE_URL;
      if (!dbUrl) {
        throw new Error('DATABASE_URL not set');
      }

      // Parse MySQL connection string
      // Format: mysql://user:password@host:port/database
      const urlMatch = dbUrl.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
      if (!urlMatch) {
        throw new Error('Invalid DATABASE_URL format');
      }

      const [, user, password, host, port, database] = urlMatch;

      // Execute mysqldump
      const command = `mysqldump -h ${host} -P ${port} -u ${user} -p${password} ${database} > ${filepath}`;
      execSync(command, { stdio: 'pipe' });

      const stats = fs.statSync(filepath);
      const backupInfo: BackupInfo = {
        filename,
        timestamp,
        size: stats.size,
        path: filepath,
      };

      this.backups.set(filename, backupInfo);
      console.log(`[Backup] Backup created: ${filename} (${stats.size} bytes)`);

      // Clean up old backups
      this.cleanupOldBackups();

      return backupInfo;
    } catch (error) {
      console.error('[Backup] Failed to create backup:', error);
      throw error;
    }
  }

  /**
   * Get list of available backups
   */
  public getAvailableBackups(): BackupInfo[] {
    return Array.from(this.backups.values()).sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Restore database from a backup
   */
  public async restoreFromBackup(backupFile: string): Promise<{ success: boolean; message: string }> {
    try {
      const backup = this.backups.get(backupFile);
      if (!backup) {
        throw new Error(`Backup not found: ${backupFile}`);
      }

      const dbUrl = process.env.DATABASE_URL;
      if (!dbUrl) {
        throw new Error('DATABASE_URL not set');
      }

      // Parse MySQL connection string
      const urlMatch = dbUrl.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
      if (!urlMatch) {
        throw new Error('Invalid DATABASE_URL format');
      }

      const [, user, password, host, port, database] = urlMatch;

      // Execute mysql restore
      const command = `mysql -h ${host} -P ${port} -u ${user} -p${password} ${database} < ${backup.path}`;
      execSync(command, { stdio: 'pipe' });

      console.log(`[Backup] Database restored from: ${backupFile}`);
      return {
        success: true,
        message: `Database successfully restored from backup: ${backupFile}`,
      };
    } catch (error) {
      console.error('[Backup] Failed to restore backup:', error);
      throw error;
    }
  }

  /**
   * Delete a backup
   */
  public deleteBackup(backupFile: string): boolean {
    try {
      const backup = this.backups.get(backupFile);
      if (!backup) {
        return false;
      }

      fs.unlinkSync(backup.path);
      this.backups.delete(backupFile);
      console.log(`[Backup] Backup deleted: ${backupFile}`);
      return true;
    } catch (error) {
      console.error('[Backup] Failed to delete backup:', error);
      return false;
    }
  }

  /**
   * Get backup statistics
   */
  public getStatistics(): {
    totalBackups: number;
    totalSize: number;
    oldestBackup: BackupInfo | null;
    newestBackup: BackupInfo | null;
  } {
    const backups = this.getAvailableBackups();
    const totalSize = backups.reduce((sum, b) => sum + b.size, 0);

    return {
      totalBackups: backups.length,
      totalSize,
      oldestBackup: backups[backups.length - 1] || null,
      newestBackup: backups[0] || null,
    };
  }

  /**
   * Ensure backup directory exists
   */
  private ensureBackupDir(): void {
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
      console.log(`[Backup] Created backup directory: ${BACKUP_DIR}`);
    }
  }

  /**
   * Load existing backups from directory
   */
  private loadExistingBackups(): void {
    try {
      const files = fs.readdirSync(BACKUP_DIR);
      files.forEach(filename => {
        if (filename.startsWith('backup-') && filename.endsWith('.sql')) {
          const filepath = path.join(BACKUP_DIR, filename);
          const stats = fs.statSync(filepath);
          const timestamp = parseInt(filename.match(/\d+/)![0], 10);

          this.backups.set(filename, {
            filename,
            timestamp,
            size: stats.size,
            path: filepath,
          });
        }
      });

      console.log(`[Backup] Loaded ${this.backups.size} existing backups`);
    } catch (error) {
      console.error('[Backup] Failed to load existing backups:', error);
    }
  }

  /**
   * Clean up backups older than retention period
   */
  private cleanupOldBackups(): void {
    const now = Date.now();
    const retentionMs = BACKUP_RETENTION_DAYS * 24 * 60 * 60 * 1000;

    Array.from(this.backups.entries()).forEach(([filename, backup]) => {
      if (now - backup.timestamp > retentionMs) {
        this.deleteBackup(filename);
        console.log(`[Backup] Cleaned up old backup: ${filename}`);
      }
    });
  }
}

let backupServiceInstance: DatabaseBackupService | null = null;

export function getDatabaseBackupService(): DatabaseBackupService | null {
  return backupServiceInstance;
}

export function initializeDatabaseBackupService(): DatabaseBackupService {
  if (!backupServiceInstance) {
    backupServiceInstance = new DatabaseBackupService();
    backupServiceInstance.initialize();
  }
  return backupServiceInstance;
}

export function stopDatabaseBackupService(): void {
  if (backupServiceInstance) {
    backupServiceInstance.stop();
    backupServiceInstance = null;
  }
}
