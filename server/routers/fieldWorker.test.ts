import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb } from '../db';
import { sql } from 'drizzle-orm';

describe('Field Worker Activity Data Tests', () => {
  let db: any;

  beforeAll(async () => {
    db = await getDb();
    if (!db) {
      throw new Error('Database not available');
    }
  });

  it('should fetch activity logs from database', async () => {
    if (!db) {
      console.log('Skipping test: database not available');
      return;
    }

    try {
      // Test raw SQL query
      const result = await db.execute(
        sql`SELECT COUNT(*) as count FROM fieldWorkerActivityLogs`
      );
      console.log('Raw SQL result:', result);
      expect(result).toBeDefined();
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      throw error;
    }
  });

  it('should fetch activity logs with farmId filter', async () => {
    if (!db) {
      console.log('Skipping test: database not available');
      return;
    }

    try {
      const farmId = 1;
      const result = await db.execute(
        sql`SELECT * FROM fieldWorkerActivityLogs WHERE farmId = ${farmId} LIMIT 5`
      );
      console.log('Filtered result:', result);
      expect(result).toBeDefined();
    } catch (error) {
      console.error('Error fetching filtered activity logs:', error);
      throw error;
    }
  });

  it('should verify activity log table structure', async () => {
    if (!db) {
      console.log('Skipping test: database not available');
      return;
    }

    try {
      const result = await db.execute(
        sql`DESCRIBE fieldWorkerActivityLogs`
      );
      console.log('Table structure:', result);
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    } catch (error) {
      console.error('Error describing table:', error);
      throw error;
    }
  });
});
