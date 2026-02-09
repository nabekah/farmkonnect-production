import { TRPCError } from '@trpc/server';
import { getDb } from '../db';
import { farms, medicationCompliance } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';
import { checkAndSendComplianceAlerts } from './notificationService';

interface ComplianceThresholdConfig {
  farmId: number;
  warningThreshold: number; // 80% - send warning
  criticalThreshold: number; // 50% - send critical alert
  escalationThreshold: number; // 30% - escalate to farm owner
  checkFrequency: 'daily' | 'weekly' | 'hourly'; // How often to check
  enabled: boolean;
}

interface ComplianceCheckResult {
  farmId: number;
  farmName: string;
  timestamp: Date;
  animalsChecked: number;
  alertsSent: number;
  warningCount: number;
  criticalCount: number;
  escalatedCount: number;
}

// In-memory storage for scheduled jobs (in production, use database)
const scheduledJobs: Map<number, NodeJS.Timeout> = new Map();
const thresholdConfigs: Map<number, ComplianceThresholdConfig> = new Map();
const checkHistory: ComplianceCheckResult[] = [];

/**
 * Set compliance threshold configuration for a farm
 */
export async function setComplianceThresholdConfig(
  config: ComplianceThresholdConfig
): Promise<{ success: boolean; message: string }> {
  try {
    // Validate thresholds
    if (config.warningThreshold <= config.criticalThreshold) {
      throw new Error('Warning threshold must be higher than critical threshold');
    }

    if (config.criticalThreshold <= config.escalationThreshold) {
      throw new Error('Critical threshold must be higher than escalation threshold');
    }

    thresholdConfigs.set(config.farmId, config);

    // If enabled, schedule the job
    if (config.enabled) {
      await scheduleComplianceCheck(config);
    } else {
      // Cancel existing job if disabled
      const existingJob = scheduledJobs.get(config.farmId);
      if (existingJob) {
        clearInterval(existingJob);
        scheduledJobs.delete(config.farmId);
      }
    }

    return {
      success: true,
      message: `Compliance threshold configuration updated for farm ${config.farmId}`,
    };
  } catch (error) {
    console.error('Error setting compliance threshold config:', error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: error instanceof Error ? error.message : 'Failed to set configuration',
    });
  }
}

/**
 * Get compliance threshold configuration for a farm
 */
export function getComplianceThresholdConfig(farmId: number): ComplianceThresholdConfig | null {
  return thresholdConfigs.get(farmId) || null;
}

/**
 * Schedule compliance check for a farm
 */
export async function scheduleComplianceCheck(
  config: ComplianceThresholdConfig
): Promise<{ success: boolean; message: string; jobId?: string }> {
  try {
    // Cancel existing job if any
    const existingJob = scheduledJobs.get(config.farmId);
    if (existingJob) {
      clearInterval(existingJob);
    }

    // Determine interval based on frequency
    let intervalMs: number;
    switch (config.checkFrequency) {
      case 'hourly':
        intervalMs = 60 * 60 * 1000; // 1 hour
        break;
      case 'daily':
        intervalMs = 24 * 60 * 60 * 1000; // 24 hours
        break;
      case 'weekly':
        intervalMs = 7 * 24 * 60 * 60 * 1000; // 7 days
        break;
      default:
        intervalMs = 24 * 60 * 60 * 1000;
    }

    // Schedule the job
    const job = setInterval(async () => {
      await performComplianceCheck(config);
    }, intervalMs);

    scheduledJobs.set(config.farmId, job);

    console.log(
      `Compliance check scheduled for farm ${config.farmId} with frequency: ${config.checkFrequency}`
    );

    return {
      success: true,
      message: `Compliance check scheduled for farm ${config.farmId}`,
      jobId: `job-${config.farmId}`,
    };
  } catch (error) {
    console.error('Error scheduling compliance check:', error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to schedule compliance check',
    });
  }
}

/**
 * Perform compliance check for a farm
 */
export async function performComplianceCheck(
  config: ComplianceThresholdConfig
): Promise<ComplianceCheckResult> {
  try {
    const db = getDb();

    // Get farm details
    const farm = await db.select().from(farms).where(eq(farms.id, config.farmId)).limit(1);

    if (!farm || farm.length === 0) {
      throw new Error(`Farm ${config.farmId} not found`);
    }

    // Get all medication compliance records for this farm
    const records = await db
      .select()
      .from(medicationCompliance)
      .where(eq(medicationCompliance.farmId, config.farmId));

    // Calculate compliance per animal
    const animalCompliance: Record<
      number,
      { total: number; administered: number; percentage: number }
    > = {};

    for (const record of records) {
      if (!animalCompliance[record.animalId]) {
        animalCompliance[record.animalId] = { total: 0, administered: 0, percentage: 0 };
      }
      animalCompliance[record.animalId].total += 1;
      if (record.status === 'administered') {
        animalCompliance[record.animalId].administered += 1;
      }
    }

    // Calculate percentages and categorize
    let warningCount = 0;
    let criticalCount = 0;
    let escalatedCount = 0;
    let alertsSent = 0;

    for (const [animalId, compliance] of Object.entries(animalCompliance)) {
      compliance.percentage = (compliance.administered / compliance.total) * 100;

      if (compliance.percentage < config.escalationThreshold) {
        escalatedCount += 1;
        // Send escalation alert to farm owner
        console.log(
          `[ESCALATION] Farm ${config.farmId}, Animal ${animalId}: ${compliance.percentage.toFixed(1)}% compliance`
        );
        alertsSent += 1;
      } else if (compliance.percentage < config.criticalThreshold) {
        criticalCount += 1;
        // Send critical alert
        console.log(
          `[CRITICAL] Farm ${config.farmId}, Animal ${animalId}: ${compliance.percentage.toFixed(1)}% compliance`
        );
        alertsSent += 1;
      } else if (compliance.percentage < config.warningThreshold) {
        warningCount += 1;
        // Send warning alert
        console.log(
          `[WARNING] Farm ${config.farmId}, Animal ${animalId}: ${compliance.percentage.toFixed(1)}% compliance`
        );
        alertsSent += 1;
      }
    }

    // Send alerts if any issues found
    if (warningCount > 0 || criticalCount > 0 || escalatedCount > 0) {
      await checkAndSendComplianceAlerts(config.farmId, config.warningThreshold);
    }

    const result: ComplianceCheckResult = {
      farmId: config.farmId,
      farmName: farm[0].farmName,
      timestamp: new Date(),
      animalsChecked: Object.keys(animalCompliance).length,
      alertsSent,
      warningCount,
      criticalCount,
      escalatedCount,
    };

    // Store in history
    checkHistory.push(result);
    // Keep only last 1000 records
    if (checkHistory.length > 1000) {
      checkHistory.shift();
    }

    console.log(`Compliance check completed for farm ${config.farmId}:`, result);

    return result;
  } catch (error) {
    console.error('Error performing compliance check:', error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to perform compliance check',
    });
  }
}

/**
 * Perform manual compliance check
 */
export async function manualComplianceCheck(
  farmId: number
): Promise<ComplianceCheckResult> {
  try {
    const config = thresholdConfigs.get(farmId);

    if (!config) {
      throw new Error(`No threshold configuration found for farm ${farmId}`);
    }

    return await performComplianceCheck(config);
  } catch (error) {
    console.error('Error performing manual compliance check:', error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to perform compliance check',
    });
  }
}

/**
 * Get compliance check history for a farm
 */
export function getComplianceCheckHistory(
  farmId: number,
  limit: number = 50
): ComplianceCheckResult[] {
  return checkHistory.filter((result) => result.farmId === farmId).slice(-limit);
}

/**
 * Get all scheduled jobs status
 */
export function getScheduledJobsStatus(): Array<{
  farmId: number;
  status: string;
  frequency: string;
  enabled: boolean;
}> {
  const jobs: Array<{
    farmId: number;
    status: string;
    frequency: string;
    enabled: boolean;
  }> = [];

  for (const [farmId, config] of thresholdConfigs.entries()) {
    const isRunning = scheduledJobs.has(farmId);
    jobs.push({
      farmId,
      status: isRunning ? 'running' : 'stopped',
      frequency: config.checkFrequency,
      enabled: config.enabled,
    });
  }

  return jobs;
}

/**
 * Cancel compliance check for a farm
 */
export function cancelComplianceCheck(farmId: number): { success: boolean; message: string } {
  try {
    const job = scheduledJobs.get(farmId);

    if (!job) {
      return {
        success: false,
        message: `No scheduled job found for farm ${farmId}`,
      };
    }

    clearInterval(job);
    scheduledJobs.delete(farmId);

    // Update config to disabled
    const config = thresholdConfigs.get(farmId);
    if (config) {
      config.enabled = false;
    }

    console.log(`Compliance check cancelled for farm ${farmId}`);

    return {
      success: true,
      message: `Compliance check cancelled for farm ${farmId}`,
    };
  } catch (error) {
    console.error('Error cancelling compliance check:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to cancel compliance check',
    };
  }
}

/**
 * Initialize all scheduled compliance checks (call on server startup)
 */
export async function initializeScheduledChecks(): Promise<{ initialized: number }> {
  try {
    const db = getDb();

    // In production, fetch configurations from database
    // For now, we'll initialize with default configs for all farms
    const allFarms = await db.select().from(farms);

    let initialized = 0;

    for (const farm of allFarms) {
      const config: ComplianceThresholdConfig = {
        farmId: farm.id,
        warningThreshold: 80,
        criticalThreshold: 50,
        escalationThreshold: 30,
        checkFrequency: 'daily',
        enabled: true,
      };

      await setComplianceThresholdConfig(config);
      initialized += 1;
    }

    console.log(`Initialized ${initialized} compliance check schedules`);

    return { initialized };
  } catch (error) {
    console.error('Error initializing scheduled checks:', error);
    return { initialized: 0 };
  }
}

/**
 * Get compliance statistics
 */
export function getComplianceStatistics(): {
  totalChecks: number;
  totalAlertsSent: number;
  averageWarnings: number;
  averageCritical: number;
  averageEscalated: number;
  lastCheckTime?: Date;
} {
  if (checkHistory.length === 0) {
    return {
      totalChecks: 0,
      totalAlertsSent: 0,
      averageWarnings: 0,
      averageCritical: 0,
      averageEscalated: 0,
    };
  }

  const totalAlertsSent = checkHistory.reduce((sum, result) => sum + result.alertsSent, 0);
  const totalWarnings = checkHistory.reduce((sum, result) => sum + result.warningCount, 0);
  const totalCritical = checkHistory.reduce((sum, result) => sum + result.criticalCount, 0);
  const totalEscalated = checkHistory.reduce((sum, result) => sum + result.escalatedCount, 0);

  return {
    totalChecks: checkHistory.length,
    totalAlertsSent,
    averageWarnings: totalWarnings / checkHistory.length,
    averageCritical: totalCritical / checkHistory.length,
    averageEscalated: totalEscalated / checkHistory.length,
    lastCheckTime: checkHistory[checkHistory.length - 1]?.timestamp,
  };
}
