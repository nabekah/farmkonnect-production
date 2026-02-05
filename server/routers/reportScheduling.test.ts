import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb } from '../db';
import { reportSchedules, reportHistory, farms, users } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

describe('Report Scheduling Router', () => {
  let db: any;
  let testUserId: number;
  let testFarmId: number;
  let testScheduleId: number;

  beforeAll(async () => {
    db = await getDb();
    if (!db) throw new Error('Database connection failed');

    // Create test user
    const [userResult] = await db.insert(users).values({
      openId: `test-report-${Date.now()}`,
      email: `test-report-${Date.now()}@example.com`,
      name: 'Test Report User',
      role: 'user',
    });
    testUserId = userResult.insertId;

    // Create test farm
    const [farmResult] = await db.insert(farms).values({
      farmName: 'Test Report Farm',
      farmerUserId: testUserId,
      location: 'Test Location',
      farmType: 'mixed',
      totalArea: '100',
    });
    testFarmId = farmResult.insertId;
  });

  afterAll(async () => {
    if (db && testFarmId) {
      try {
        await db.delete(reportSchedules).where(eq(reportSchedules.farmId, testFarmId));
        await db.delete(farms).where(eq(farms.id, testFarmId));
      } catch (e) {
        console.log('Cleanup error:', e);
      }
    }
  });

  it('should create a report schedule', async () => {
    const [result] = await db.insert(reportSchedules).values({
      userId: testUserId,
      farmId: testFarmId,
      reportType: 'financial',
      frequency: 'weekly',
      recipients: JSON.stringify(['test@example.com']),
      isActive: true,
    });

    testScheduleId = result.insertId;

    expect(result.insertId).toBeGreaterThan(0);

    // Verify schedule was created
    const schedule = await db
      .select()
      .from(reportSchedules)
      .where(eq(reportSchedules.id, testScheduleId))
      .limit(1);

    expect(schedule).toHaveLength(1);
    expect(schedule[0].reportType).toBe('financial');
    expect(schedule[0].frequency).toBe('weekly');
    expect(schedule[0].isActive).toBe(true);
  });

  it('should update a report schedule', async () => {
    await db
      .update(reportSchedules)
      .set({ isActive: false })
      .where(eq(reportSchedules.id, testScheduleId));

    const schedule = await db
      .select()
      .from(reportSchedules)
      .where(eq(reportSchedules.id, testScheduleId))
      .limit(1);

    expect(schedule[0].isActive).toBe(false);
  });

  it('should retrieve report schedules for a farm', async () => {
    const schedules = await db
      .select()
      .from(reportSchedules)
      .where(eq(reportSchedules.farmId, testFarmId));

    expect(schedules.length).toBeGreaterThan(0);
    expect(schedules[0].farmId).toBe(testFarmId);
  });

  it('should create a report history entry', async () => {
    const [result] = await db.insert(reportHistory).values({
      scheduleId: testScheduleId,
      farmId: testFarmId,
      reportType: 'financial',
      status: 'success',
      generatedAt: new Date(),
      sentAt: new Date(),
      recipientCount: 1,
      fileSize: 5000,
    });

    expect(result.insertId).toBeGreaterThan(0);

    // Verify history was created
    const history = await db
      .select()
      .from(reportHistory)
      .where(eq(reportHistory.id, result.insertId))
      .limit(1);

    expect(history).toHaveLength(1);
    expect(history[0].status).toBe('success');
    expect(history[0].recipientCount).toBe(1);
  });

  it('should retrieve report history for a farm', async () => {
    const history = await db
      .select()
      .from(reportHistory)
      .where(eq(reportHistory.farmId, testFarmId));

    expect(history.length).toBeGreaterThan(0);
    expect(history[0].farmId).toBe(testFarmId);
  });

  it('should calculate success rate correctly', async () => {
    // Create multiple history entries
    const statuses = ['success', 'success', 'failed'];

    for (const status of statuses) {
      await db.insert(reportHistory).values({
        scheduleId: testScheduleId,
        farmId: testFarmId,
        reportType: 'financial',
        status,
        generatedAt: new Date(),
      });
    }

    // Retrieve all history for this farm
    const allHistory = await db
      .select()
      .from(reportHistory)
      .where(eq(reportHistory.farmId, testFarmId));

    const successCount = allHistory.filter((h) => h.status === 'success').length;
    const successRate = Math.round((successCount / allHistory.length) * 100);

    expect(successRate).toBeGreaterThan(0);
    expect(successRate).toBeLessThanOrEqual(100);
  });

  it('should handle different report types', async () => {
    const reportTypes = ['financial', 'livestock', 'complete'];

    for (const type of reportTypes) {
      const [result] = await db.insert(reportSchedules).values({
        userId: testUserId,
        farmId: testFarmId,
        reportType: type,
        frequency: 'monthly',
        recipients: JSON.stringify(['test@example.com']),
        isActive: true,
      });

      expect(result.insertId).toBeGreaterThan(0);
    }

    const schedules = await db
      .select()
      .from(reportSchedules)
      .where(eq(reportSchedules.farmId, testFarmId));

    const types = schedules.map((s) => s.reportType);
    expect(types).toContain('financial');
    expect(types).toContain('livestock');
    expect(types).toContain('complete');
  });

  it('should handle different frequencies', async () => {
    const frequencies = ['daily', 'weekly', 'monthly'];

    for (const freq of frequencies) {
      const [result] = await db.insert(reportSchedules).values({
        userId: testUserId,
        farmId: testFarmId,
        reportType: 'financial',
        frequency: freq,
        recipients: JSON.stringify(['test@example.com']),
        isActive: true,
      });

      expect(result.insertId).toBeGreaterThan(0);
    }

    const schedules = await db
      .select()
      .from(reportSchedules)
      .where(eq(reportSchedules.farmId, testFarmId));

    const freqs = schedules.map((s) => s.frequency);
    expect(freqs).toContain('daily');
    expect(freqs).toContain('weekly');
    expect(freqs).toContain('monthly');
  });

  it('should parse recipients correctly', async () => {
    const recipients = ['email1@example.com', 'email2@example.com', 'email3@example.com'];
    const [result] = await db.insert(reportSchedules).values({
      userId: testUserId,
      farmId: testFarmId,
      reportType: 'financial',
      frequency: 'weekly',
      recipients: JSON.stringify(recipients),
      isActive: true,
    });

    const schedule = await db
      .select()
      .from(reportSchedules)
      .where(eq(reportSchedules.id, result.insertId))
      .limit(1);

    const parsedRecipients = JSON.parse(schedule[0].recipients);
    expect(parsedRecipients).toHaveLength(3);
    expect(parsedRecipients).toContain('email1@example.com');
  });
});
