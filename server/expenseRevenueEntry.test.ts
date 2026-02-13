import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb } from './db';
import { expenses, revenue, farms } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

describe('Expense and Revenue Entry', () => {
  let testFarmId: number;
  let db: any;

  beforeAll(async () => {
    // Initialize database
    db = await getDb();
    
    // Create a test farm for testing
    const farmResult = await db
      .insert(farms)
      .values({
        name: 'Test Farm for Entry',
        type: 'mixed',
        location: 'Test Location',
        sizeHectares: 10,
        farmerUserId: 'test-user-123',
      });
    testFarmId = farmResult.insertId || 1;
  });

  afterAll(async () => {
    // Clean up test data
    if (testFarmId) {
      await db.delete(expenses).where(eq(expenses.farmId, testFarmId));
      await db.delete(revenue).where(eq(revenue.farmId, testFarmId));
      await db.delete(farms).where(eq(farms.id, testFarmId));
    }
  });

  describe('Expense Entry', () => {
    it('should successfully add expense with valid data', async () => {
      const expenseData = {
        farmId: testFarmId,
        category: 'Feed',
        description: 'Cattle feed purchase',
        amount: 500,
        date: new Date('2026-02-01'),
        quantity: 100,
        notes: 'Ordered from vendor ABC',
      };

      const result = await db
        .insert(expenses)
        .values(expenseData);

      expect(result.insertId).toBeDefined();
      
      // Verify the inserted expense
      const inserted = await db.select().from(expenses).where(eq(expenses.farmId, testFarmId));
      expect(inserted.length).toBeGreaterThan(0);
    });

    it('should add multiple expenses with different categories', async () => {
      const expensesData = [
        {
          farmId: testFarmId,
          category: 'Labor',
          description: 'Worker wages',
          amount: 300,
          date: new Date('2026-02-02'),
        },
        {
          farmId: testFarmId,
          category: 'Equipment',
          description: 'Tractor maintenance',
          amount: 1500,
          date: new Date('2026-02-03'),
        },
        {
          farmId: testFarmId,
          category: 'Utilities',
          description: 'Water bill',
          amount: 150,
          date: new Date('2026-02-04'),
        },
      ];

      const results = await db
        .insert(expenses)
        .values(expensesData);

      expect(results.insertId).toBeDefined();
      
      // Verify the inserted expenses
      const inserted = await db.select().from(expenses).where(eq(expenses.farmId, testFarmId));
      expect(inserted.length).toBeGreaterThanOrEqual(3);
    });

    it('should store expense with optional quantity and notes', async () => {
      const expenseData = {
        farmId: testFarmId,
        category: 'Fertilizer',
        description: 'Nitrogen fertilizer',
        amount: 800,
        date: new Date('2026-02-05'),
        quantity: 50,
        notes: 'Applied to north field',
      };

      const result = await db
        .insert(expenses)
        .values(expenseData);

      expect(result.insertId).toBeDefined();
    });

    it('should retrieve expenses for a farm', async () => {
      const farmExpenses = await db
        .select()
        .from(expenses)
        .where(eq(expenses.farmId, testFarmId));

      expect(farmExpenses.length).toBeGreaterThan(0);
      expect(farmExpenses.every((e: any) => e.farmId === testFarmId)).toBe(true);
    });

    it('should calculate total expenses for a farm', async () => {
      const farmExpenses = await db
        .select()
        .from(expenses)
        .where(eq(expenses.farmId, testFarmId));

      const totalExpenses = farmExpenses.reduce((sum: number, e: any) => sum + e.amount, 0);
      expect(totalExpenses).toBeGreaterThan(0);
    });
  });

  describe('Revenue Entry', () => {
    it('should successfully add revenue with valid data', async () => {
      const revenueData = {
        farmId: testFarmId,
        source: 'Crop Sales',
        description: 'Sold maize harvest',
        amount: 2000,
        date: new Date('2026-02-06'),
        quantity: 500,
        buyer: 'Local Market',
        invoiceNumber: 'INV-001',
        paymentStatus: 'paid',
      };

      const result = await db
        .insert(revenue)
        .values(revenueData);

      expect(result.insertId).toBeDefined();
      
      // Verify the inserted revenue
      const inserted = await db.select().from(revenue).where(eq(revenue.farmId, testFarmId));
      expect(inserted.length).toBeGreaterThan(0);
    });

    it('should add multiple revenue entries with different sources', async () => {
      const revenueData = [
        {
          farmId: testFarmId,
          source: 'Livestock Sales',
          description: 'Sold 3 cattle',
          amount: 5000,
          date: new Date('2026-02-07'),
          quantity: 3,
          paymentStatus: 'paid',
        },
        {
          farmId: testFarmId,
          source: 'Dairy Products',
          description: 'Milk sales',
          amount: 1500,
          date: new Date('2026-02-08'),
          quantity: 300,
          paymentStatus: 'pending',
        },
      ];

      const results = await db
        .insert(revenue)
        .values(revenueData);

      expect(results.insertId).toBeDefined();
      
      // Verify the inserted revenue
      const inserted = await db.select().from(revenue).where(eq(revenue.farmId, testFarmId));
      expect(inserted.length).toBeGreaterThanOrEqual(2);
    });

    it('should store revenue with optional buyer and invoice', async () => {
      const revenueData = {
        farmId: testFarmId,
        source: 'Crop Sales',
        description: 'Rice harvest',
        amount: 3000,
        date: new Date('2026-02-09'),
        quantity: 600,
        buyer: 'Agro Traders Ltd',
        invoiceNumber: 'INV-002',
        paymentStatus: 'partial',
      };

      const result = await db
        .insert(revenue)
        .values(revenueData);

      expect(result.insertId).toBeDefined();
    });

    it('should track payment status for revenue', async () => {
      const revenueData = {
        farmId: testFarmId,
        source: 'Vegetable Sales',
        description: 'Tomato sales',
        amount: 800,
        date: new Date('2026-02-10'),
        paymentStatus: 'pending',
      };

      const result = await db
        .insert(revenue)
        .values(revenueData);

      expect(result.insertId).toBeDefined();
    });

    it('should retrieve revenue for a farm', async () => {
      const farmRevenue = await db
        .select()
        .from(revenue)
        .where(eq(revenue.farmId, testFarmId));

      expect(farmRevenue.length).toBeGreaterThan(0);
      expect(farmRevenue.every((r: any) => r.farmId === testFarmId)).toBe(true);
    });

    it('should calculate total revenue for a farm', async () => {
      const farmRevenue = await db
        .select()
        .from(revenue)
        .where(eq(revenue.farmId, testFarmId));

      const totalRevenue = farmRevenue.reduce((sum: number, r: any) => sum + r.amount, 0);
      expect(totalRevenue).toBeGreaterThan(0);
    });
  });

  describe('Financial Summary', () => {
    it('should calculate net profit (revenue - expenses)', async () => {
      const farmExpenses = await db
        .select()
        .from(expenses)
        .where(eq(expenses.farmId, testFarmId));

      const farmRevenue = await db
        .select()
        .from(revenue)
        .where(eq(revenue.farmId, testFarmId));

      const totalExpenses = farmExpenses.reduce((sum: number, e: any) => sum + e.amount, 0);
      const totalRevenue = farmRevenue.reduce((sum: number, r: any) => sum + r.amount, 0);
      const netProfit = totalRevenue - totalExpenses;

      expect(typeof netProfit).toBe('number');
      expect(netProfit).toBeDefined();
    });

    it('should calculate profit margin', async () => {
      const farmExpenses = await db
        .select()
        .from(expenses)
        .where(eq(expenses.farmId, testFarmId));

      const farmRevenue = await db
        .select()
        .from(revenue)
        .where(eq(revenue.farmId, testFarmId));

      const totalExpenses = farmExpenses.reduce((sum: number, e: any) => sum + e.amount, 0);
      const totalRevenue = farmRevenue.reduce((sum: number, r: any) => sum + r.amount, 0);
      const profitMargin = totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0;

      expect(typeof profitMargin).toBe('number');
      expect(profitMargin).toBeDefined();
    });
  });
});
