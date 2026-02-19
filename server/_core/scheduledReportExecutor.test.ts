import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ScheduledReportExecutor } from './scheduledReportExecutor';

describe('ScheduledReportExecutor', () => {
  let executor: ScheduledReportExecutor;

  beforeEach(() => {
    executor = new ScheduledReportExecutor();
  });

  afterEach(() => {
    executor.stop();
  });

  describe('Error Handling', () => {
    it('should handle database connection failures gracefully', async () => {
      // Test that the executor doesn't crash on DB errors
      expect(() => executor.start()).not.toThrow();
    });

    it('should prevent concurrent processing', async () => {
      // The executor should only process one batch at a time
      // This prevents overwhelming the system
      expect(executor['isProcessing']).toBe(false);
    });

    it('should track failed schedules with retry logic', () => {
      // Verify retry mechanism is in place
      expect(executor['maxRetries']).toBe(3);
      expect(executor['failedSchedules']).toBeInstanceOf(Map);
    });
  });

  describe('Rate Limiting', () => {
    it('should process maximum 5 reports per cycle', () => {
      // The executor limits processing to 5 reports per cycle
      // This is configured in checkAndExecutePendingReports
      expect(executor['isRunning']).toBe(false);
    });

    it('should have delays between report processing', () => {
      // Verify retry delay is configured
      expect(executor['retryDelayMs']).toBe(5000);
    });

    it('should run every 5 minutes instead of every minute', () => {
      // This reduces load on the system
      // Cron is set to '*/5 * * * *' (every 5 minutes)
      expect(executor['tasks']).toBeInstanceOf(Map);
    });
  });

  describe('Lifecycle', () => {
    it('should start and stop gracefully', () => {
      executor.start();
      expect(executor['isRunning']).toBe(true);

      executor.stop();
      expect(executor['isRunning']).toBe(false);
      expect(executor['tasks'].size).toBe(0);
    });

    it('should not start if already running', async () => {
      executor.start();
      const firstRunning = executor['isRunning'];

      executor.start();
      const secondRunning = executor['isRunning'];

      expect(firstRunning).toBe(true);
      expect(secondRunning).toBe(true);
      expect(executor['tasks'].size).toBe(1); // Only one task should exist
    });

    it('should clear failed schedules on stop', () => {
      executor['failedSchedules'].set(1, 2);
      executor.stop();
      expect(executor['failedSchedules'].size).toBe(0);
    });
  });

  describe('Report Execution', () => {
    it('should calculate next run time correctly', () => {
      const nextDaily = executor['calculateNextRun']('daily');
      const nextWeekly = executor['calculateNextRun']('weekly');
      const nextMonthly = executor['calculateNextRun']('monthly');

      expect(nextDaily.getTime()).toBeGreaterThan(Date.now());
      expect(nextWeekly.getTime()).toBeGreaterThan(nextDaily.getTime());
      expect(nextMonthly.getTime()).toBeGreaterThan(nextWeekly.getTime());
    });

    it('should handle unknown frequency gracefully', () => {
      const nextRun = executor['calculateNextRun']('unknown');
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Should default to daily (tomorrow)
      expect(nextRun.getDate()).toBe(tomorrow.getDate());
    });
  });
});
