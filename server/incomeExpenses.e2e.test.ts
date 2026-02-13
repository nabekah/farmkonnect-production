import { describe, it, expect, beforeAll } from 'vitest';
import { getDb } from './db';
import { expenses, revenue } from '../drizzle/schema';

describe('Income & Expenses End-to-End Tests', () => {
  let db: any;

  beforeAll(async () => {
    db = await getDb();
  });

  describe('Database Connectivity', () => {
    it('should connect to database successfully', async () => {
      expect(db).toBeDefined();
    });

    it('should have expenses table with data', async () => {
      const expenseRecords = await db.select().from(expenses).limit(1);
      expect(Array.isArray(expenseRecords)).toBe(true);
      expect(expenseRecords.length).toBeGreaterThan(0);
    });

    it('should have revenue table with data', async () => {
      const revenueRecords = await db.select().from(revenue).limit(1);
      expect(Array.isArray(revenueRecords)).toBe(true);
      expect(revenueRecords.length).toBeGreaterThan(0);
    });
  });

  describe('Expense Data Retrieval', () => {
    it('should retrieve all expenses', async () => {
      const allExpenses = await db.select().from(expenses);
      expect(Array.isArray(allExpenses)).toBe(true);
      expect(allExpenses.length).toBeGreaterThan(0);
    });

    it('should retrieve expenses with valid structure', async () => {
      const expenseRecords = await db.select().from(expenses).limit(1);
      if (expenseRecords.length > 0) {
        const expense = expenseRecords[0];
        expect(expense).toHaveProperty('id');
        expect(expense).toHaveProperty('farmId');
        expect(expense).toHaveProperty('amount');
        expect(expense).toHaveProperty('description');
      }
    });

    it('should calculate total expenses correctly', async () => {
      const allExpenses = await db.select().from(expenses);
      const totalExpenses = allExpenses.reduce((sum: number, exp: any) => {
        const amount = typeof exp.amount === 'string' ? parseFloat(exp.amount) : exp.amount;
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);
      
      expect(typeof totalExpenses).toBe('number');
      expect(totalExpenses).toBeGreaterThanOrEqual(0);
    });

    it('should have valid expense amounts', async () => {
      const allExpenses = await db.select().from(expenses);
      allExpenses.forEach((exp: any) => {
        const amount = typeof exp.amount === 'string' ? parseFloat(exp.amount) : exp.amount;
        expect(isNaN(amount)).toBe(false);
        expect(amount).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Revenue Data Retrieval', () => {
    it('should retrieve all revenue records', async () => {
      const allRevenue = await db.select().from(revenue);
      expect(Array.isArray(allRevenue)).toBe(true);
      expect(allRevenue.length).toBeGreaterThan(0);
    });

    it('should retrieve revenue with valid structure', async () => {
      const revenueRecords = await db.select().from(revenue).limit(1);
      if (revenueRecords.length > 0) {
        const rev = revenueRecords[0];
        expect(rev).toHaveProperty('id');
        expect(rev).toHaveProperty('farmId');
        expect(rev).toHaveProperty('amount');
        expect(rev).toHaveProperty('description');
      }
    });

    it('should calculate total revenue correctly', async () => {
      const allRevenue = await db.select().from(revenue);
      const totalRevenue = allRevenue.reduce((sum: number, rev: any) => {
        const amount = typeof rev.amount === 'string' ? parseFloat(rev.amount) : rev.amount;
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);
      
      expect(typeof totalRevenue).toBe('number');
      expect(totalRevenue).toBeGreaterThanOrEqual(0);
    });

    it('should have valid revenue amounts', async () => {
      const allRevenue = await db.select().from(revenue);
      allRevenue.forEach((rev: any) => {
        const amount = typeof rev.amount === 'string' ? parseFloat(rev.amount) : rev.amount;
        expect(isNaN(amount)).toBe(false);
        expect(amount).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Financial Calculations', () => {
    it('should calculate net income (revenue - expenses)', async () => {
      const allExpenses = await db.select().from(expenses);
      const allRevenue = await db.select().from(revenue);
      
      const totalExpenses = allExpenses.reduce((sum: number, exp: any) => {
        const amount = typeof exp.amount === 'string' ? parseFloat(exp.amount) : exp.amount;
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);
      
      const totalRevenue = allRevenue.reduce((sum: number, rev: any) => {
        const amount = typeof rev.amount === 'string' ? parseFloat(rev.amount) : rev.amount;
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);
      
      const netIncome = totalRevenue - totalExpenses;
      
      expect(typeof netIncome).toBe('number');
    });

    it('should calculate profit margin correctly', async () => {
      const allExpenses = await db.select().from(expenses);
      const allRevenue = await db.select().from(revenue);
      
      const totalExpenses = allExpenses.reduce((sum: number, exp: any) => {
        const amount = typeof exp.amount === 'string' ? parseFloat(exp.amount) : exp.amount;
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);
      
      const totalRevenue = allRevenue.reduce((sum: number, rev: any) => {
        const amount = typeof rev.amount === 'string' ? parseFloat(rev.amount) : rev.amount;
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);
      
      const netIncome = totalRevenue - totalExpenses;
      const profitMargin = totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0;
      
      expect(typeof profitMargin).toBe('number');
      expect(profitMargin).toBeGreaterThanOrEqual(-100);
      expect(profitMargin).toBeLessThanOrEqual(100);
    });

    it('should calculate expense ratio correctly', async () => {
      const allExpenses = await db.select().from(expenses);
      const allRevenue = await db.select().from(revenue);
      
      const totalExpenses = allExpenses.reduce((sum: number, exp: any) => {
        const amount = typeof exp.amount === 'string' ? parseFloat(exp.amount) : exp.amount;
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);
      
      const totalRevenue = allRevenue.reduce((sum: number, rev: any) => {
        const amount = typeof rev.amount === 'string' ? parseFloat(rev.amount) : rev.amount;
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);
      
      const expenseRatio = totalRevenue > 0 ? (totalExpenses / totalRevenue) * 100 : 0;
      
      expect(typeof expenseRatio).toBe('number');
      expect(expenseRatio).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Data Integrity', () => {
    it('should not have duplicate expense records', async () => {
      const allExpenses = await db.select().from(expenses);
      const ids = allExpenses.map((exp: any) => exp.id);
      const uniqueIds = new Set(ids);
      
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should not have duplicate revenue records', async () => {
      const allRevenue = await db.select().from(revenue);
      const ids = allRevenue.map((rev: any) => rev.id);
      const uniqueIds = new Set(ids);
      
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have expense records with required fields', async () => {
      const allExpenses = await db.select().from(expenses);
      allExpenses.forEach((exp: any) => {
        expect(exp.id).toBeDefined();
        expect(exp.farmId).toBeDefined();
        expect(exp.amount).toBeDefined();
        expect(exp.description).toBeDefined();
      });
    });

    it('should have revenue records with required fields', async () => {
      const allRevenue = await db.select().from(revenue);
      allRevenue.forEach((rev: any) => {
        expect(rev.id).toBeDefined();
        expect(rev.farmId).toBeDefined();
        expect(rev.amount).toBeDefined();
        expect(rev.description).toBeDefined();
      });
    });
  });

  describe('Performance', () => {
    it('should retrieve all expenses within reasonable time', async () => {
      const startTime = Date.now();
      await db.select().from(expenses);
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should retrieve all revenue within reasonable time', async () => {
      const startTime = Date.now();
      await db.select().from(revenue);
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });

  describe('Summary Statistics', () => {
    it('should generate complete financial summary', async () => {
      const allExpenses = await db.select().from(expenses);
      const allRevenue = await db.select().from(revenue);
      
      const totalExpenses = allExpenses.reduce((sum: number, exp: any) => {
        const amount = typeof exp.amount === 'string' ? parseFloat(exp.amount) : exp.amount;
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);
      
      const totalRevenue = allRevenue.reduce((sum: number, rev: any) => {
        const amount = typeof rev.amount === 'string' ? parseFloat(rev.amount) : rev.amount;
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);
      
      const netIncome = totalRevenue - totalExpenses;
      const profitMargin = totalRevenue > 0 ? ((netIncome / totalRevenue) * 100).toFixed(2) : '0.00';
      
      const summary = {
        totalExpenses,
        totalRevenue,
        netIncome,
        profitMargin: Number(profitMargin),
        expenseCount: allExpenses.length,
        revenueCount: allRevenue.length,
      };
      
      expect(summary.totalExpenses).toBeGreaterThanOrEqual(0);
      expect(summary.totalRevenue).toBeGreaterThanOrEqual(0);
      expect(summary.expenseCount).toBeGreaterThan(0);
      expect(summary.revenueCount).toBeGreaterThan(0);
      
      console.log('Financial Summary:', summary);
    });
  });
});
