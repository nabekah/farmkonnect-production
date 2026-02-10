import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { getDb } from '../db';

export const financialRouter = router({
  /**
   * Get financial dashboard overview
   */
  getFinancialDashboard: protectedProcedure
    .input(z.object({ farmId: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      const farmId = input.farmId || ctx.user.farmId;

      // Get income and expenses summary
      const incomeExpenses = {
        totalIncome: 450000,
        totalExpenses: 203000,
        netProfit: 247000,
        profitMargin: 54.8,
      };

      // Get monthly trends
      const monthlyTrends = [
        { month: 'Jan', income: 45000, expenses: 30000 },
        { month: 'Feb', income: 52000, expenses: 32000 },
        { month: 'Mar', income: 48000, expenses: 31000 },
        { month: 'Apr', income: 68000, expenses: 35000 },
        { month: 'May', income: 75000, expenses: 38000 },
        { month: 'Jun', income: 72000, expenses: 37000 },
      ];

      // Get expense breakdown
      const expenseBreakdown = [
        { category: 'Seeds & Fertilizer', amount: 85000, percentage: 42 },
        { category: 'Labor', amount: 60000, percentage: 30 },
        { category: 'Equipment', amount: 35000, percentage: 17 },
        { category: 'Transport', amount: 15000, percentage: 7 },
        { category: 'Other', amount: 8000, percentage: 4 },
      ];

      return {
        incomeExpenses,
        monthlyTrends,
        expenseBreakdown,
        lastUpdated: new Date(),
      };
    }),

  /**
   * Get income and expenses list with filtering
   */
  getIncomeExpenses: protectedProcedure
    .input(
      z.object({
        farmId: z.number().optional(),
        type: z.enum(['income', 'expense', 'all']).optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const farmId = input.farmId || ctx.user.farmId;

      // Mock data
      const transactions = [
        {
          id: 1,
          type: 'income',
          description: 'Tomato harvest sale',
          amount: 45000,
          date: new Date('2026-02-01'),
          category: 'Crop Sales',
          reference: 'INV-001',
        },
        {
          id: 2,
          type: 'expense',
          description: 'Fertilizer purchase',
          amount: 15000,
          date: new Date('2026-02-02'),
          category: 'Inputs',
          reference: 'EXP-001',
        },
        {
          id: 3,
          type: 'income',
          description: 'Equipment rental income',
          amount: 8000,
          date: new Date('2026-02-05'),
          category: 'Services',
          reference: 'INV-002',
        },
        {
          id: 4,
          type: 'expense',
          description: 'Labor payment',
          amount: 12000,
          date: new Date('2026-02-08'),
          category: 'Labor',
          reference: 'EXP-002',
        },
      ];

      const filtered = transactions.filter((t) => {
        if (input.type && input.type !== 'all' && t.type !== input.type) return false;
        if (input.startDate && t.date < input.startDate) return false;
        if (input.endDate && t.date > input.endDate) return false;
        return true;
      });

      return {
        transactions: filtered.slice(input.offset, input.offset + input.limit),
        total: filtered.length,
        offset: input.offset,
        limit: input.limit,
      };
    }),

  /**
   * Add income transaction
   */
  addIncome: protectedProcedure
    .input(
      z.object({
        description: z.string().min(1),
        amount: z.number().positive(),
        date: z.date(),
        category: z.string(),
        reference: z.string().optional(),
        farmId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const farmId = input.farmId || ctx.user.farmId;

      // In production, save to database
      return {
        id: Math.random(),
        type: 'income',
        ...input,
        createdAt: new Date(),
      };
    }),

  /**
   * Add expense transaction
   */
  addExpense: protectedProcedure
    .input(
      z.object({
        description: z.string().min(1),
        amount: z.number().positive(),
        date: z.date(),
        category: z.string(),
        reference: z.string().optional(),
        farmId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const farmId = input.farmId || ctx.user.farmId;

      // In production, save to database
      return {
        id: Math.random(),
        type: 'expense',
        ...input,
        createdAt: new Date(),
      };
    }),

  /**
   * Get budget planning data
   */
  getBudgetPlanning: protectedProcedure
    .input(z.object({ farmId: z.number().optional(), year: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const farmId = input.farmId || ctx.user.farmId;
      const year = input.year || new Date().getFullYear();

      const budgets = [
        {
          id: 1,
          category: 'Seeds & Fertilizer',
          budgeted: 100000,
          spent: 85000,
          remaining: 15000,
          percentage: 85,
        },
        {
          id: 2,
          category: 'Labor',
          budgeted: 80000,
          spent: 60000,
          remaining: 20000,
          percentage: 75,
        },
        {
          id: 3,
          category: 'Equipment',
          budgeted: 50000,
          spent: 35000,
          remaining: 15000,
          percentage: 70,
        },
        {
          id: 4,
          category: 'Transport',
          budgeted: 30000,
          spent: 15000,
          remaining: 15000,
          percentage: 50,
        },
      ];

      return {
        year,
        budgets,
        totalBudgeted: budgets.reduce((sum, b) => sum + b.budgeted, 0),
        totalSpent: budgets.reduce((sum, b) => sum + b.spent, 0),
        totalRemaining: budgets.reduce((sum, b) => sum + b.remaining, 0),
      };
    }),

  /**
   * Create or update budget
   */
  saveBudget: protectedProcedure
    .input(
      z.object({
        category: z.string(),
        budgeted: z.number().positive(),
        year: z.number(),
        farmId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const farmId = input.farmId || ctx.user.farmId;

      return {
        id: Math.random(),
        ...input,
        createdAt: new Date(),
      };
    }),

  /**
   * Get loan management data
   */
  getLoans: protectedProcedure
    .input(z.object({ farmId: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const farmId = input.farmId || ctx.user.farmId;

      const loans = [
        {
          id: 1,
          lender: 'Agricultural Bank',
          amount: 500000,
          interestRate: 8.5,
          term: 24,
          startDate: new Date('2025-01-15'),
          endDate: new Date('2027-01-15'),
          monthlyPayment: 22500,
          paidAmount: 45000,
          remainingAmount: 455000,
          status: 'active',
        },
        {
          id: 2,
          lender: 'Cooperative Credit Union',
          amount: 200000,
          interestRate: 6.0,
          term: 12,
          startDate: new Date('2025-06-01'),
          endDate: new Date('2026-06-01'),
          monthlyPayment: 17500,
          paidAmount: 35000,
          remainingAmount: 165000,
          status: 'active',
        },
      ];

      return {
        loans,
        totalBorrowed: loans.reduce((sum, l) => sum + l.amount, 0),
        totalRemaining: loans.reduce((sum, l) => sum + l.remainingAmount, 0),
        nextPaymentDue: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };
    }),

  /**
   * Add new loan
   */
  addLoan: protectedProcedure
    .input(
      z.object({
        lender: z.string(),
        amount: z.number().positive(),
        interestRate: z.number(),
        term: z.number(),
        startDate: z.date(),
        farmId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const farmId = input.farmId || ctx.user.farmId;

      return {
        id: Math.random(),
        ...input,
        endDate: new Date(input.startDate.getTime() + input.term * 30 * 24 * 60 * 60 * 1000),
        monthlyPayment: input.amount / input.term,
        paidAmount: 0,
        remainingAmount: input.amount,
        status: 'active',
        createdAt: new Date(),
      };
    }),

  /**
   * Get payment history
   */
  getPaymentHistory: protectedProcedure
    .input(
      z.object({
        farmId: z.number().optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const farmId = input.farmId || ctx.user.farmId;

      const payments = [
        {
          id: 1,
          type: 'loan_payment',
          description: 'Agricultural Bank - Monthly Payment',
          amount: 22500,
          date: new Date('2026-02-15'),
          status: 'completed',
          reference: 'LOAN-PAY-001',
        },
        {
          id: 2,
          type: 'expense',
          description: 'Fertilizer Supplier Payment',
          amount: 15000,
          date: new Date('2026-02-10'),
          status: 'completed',
          reference: 'INV-PAY-001',
        },
        {
          id: 3,
          type: 'loan_payment',
          description: 'Cooperative Credit Union - Monthly Payment',
          amount: 17500,
          date: new Date('2026-02-20'),
          status: 'pending',
          reference: 'LOAN-PAY-002',
        },
      ];

      return {
        payments: payments.slice(input.offset, input.offset + input.limit),
        total: payments.length,
        offset: input.offset,
        limit: input.limit,
      };
    }),

  /**
   * Get financial reports
   */
  getFinancialReports: protectedProcedure
    .input(
      z.object({
        farmId: z.number().optional(),
        reportType: z.enum(['income_statement', 'cash_flow', 'balance_sheet']).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const farmId = input.farmId || ctx.user.farmId;

      const reports = [
        {
          id: 1,
          type: 'income_statement',
          name: 'Income Statement - 2026',
          period: 'Jan - Jun 2026',
          generatedDate: new Date('2026-02-10'),
          url: '/reports/income-statement-2026.pdf',
        },
        {
          id: 2,
          type: 'cash_flow',
          name: 'Cash Flow Report - Q1 2026',
          period: 'Jan - Mar 2026',
          generatedDate: new Date('2026-02-05'),
          url: '/reports/cash-flow-q1-2026.pdf',
        },
        {
          id: 3,
          type: 'balance_sheet',
          name: 'Balance Sheet - Feb 2026',
          period: 'As of Feb 28, 2026',
          generatedDate: new Date('2026-02-28'),
          url: '/reports/balance-sheet-feb-2026.pdf',
        },
      ];

      return {
        reports: input.reportType
          ? reports.filter((r) => r.type === input.reportType)
          : reports,
      };
    }),

  /**
   * Generate financial report
   */
  generateReport: protectedProcedure
    .input(
      z.object({
        reportType: z.enum(['income_statement', 'cash_flow', 'balance_sheet']),
        startDate: z.date(),
        endDate: z.date(),
        farmId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const farmId = input.farmId || ctx.user.farmId;

      return {
        id: Math.random(),
        type: input.reportType,
        name: `${input.reportType.replace('_', ' ')} Report`,
        period: `${input.startDate.toLocaleDateString()} - ${input.endDate.toLocaleDateString()}`,
        generatedDate: new Date(),
        url: `/reports/generated-${Date.now()}.pdf`,
        status: 'generating',
      };
    }),

  /**
   * Get tax planning data
   */
  getTaxPlanning: protectedProcedure
    .input(z.object({ farmId: z.number().optional(), year: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const farmId = input.farmId || ctx.user.farmId;
      const year = input.year || new Date().getFullYear();

      return {
        year,
        grossIncome: 450000,
        deductibleExpenses: 203000,
        taxableIncome: 247000,
        estimatedTax: 37050,
        taxRate: 15,
        deductions: [
          { item: 'Seeds & Fertilizer', amount: 85000 },
          { item: 'Labor', amount: 60000 },
          { item: 'Equipment Depreciation', amount: 25000 },
          { item: 'Transport', amount: 15000 },
          { item: 'Insurance', amount: 10000 },
          { item: 'Utilities', amount: 8000 },
        ],
      };
    }),

  /**
   * Get insurance management data
   */
  getInsurance: protectedProcedure
    .input(z.object({ farmId: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const farmId = input.farmId || ctx.user.farmId;

      const policies = [
        {
          id: 1,
          type: 'crop_insurance',
          provider: 'Agricultural Insurance Co.',
          coverage: 'Crop Damage & Loss',
          premium: 25000,
          coverageAmount: 500000,
          startDate: new Date('2026-01-01'),
          endDate: new Date('2026-12-31'),
          status: 'active',
          claimsHistory: [],
        },
        {
          id: 2,
          type: 'livestock_insurance',
          provider: 'Livestock Protection Ltd.',
          coverage: 'Animal Health & Mortality',
          premium: 15000,
          coverageAmount: 300000,
          startDate: new Date('2026-01-01'),
          endDate: new Date('2026-12-31'),
          status: 'active',
          claimsHistory: [],
        },
        {
          id: 3,
          type: 'equipment_insurance',
          provider: 'Farm Equipment Insurer',
          coverage: 'Equipment Damage & Theft',
          premium: 12000,
          coverageAmount: 200000,
          startDate: new Date('2025-06-01'),
          endDate: new Date('2026-06-01'),
          status: 'active',
          claimsHistory: [],
        },
      ];

      return {
        policies,
        totalPremium: policies.reduce((sum, p) => sum + p.premium, 0),
        totalCoverage: policies.reduce((sum, p) => sum + p.coverageAmount, 0),
      };
    }),

  /**
   * File insurance claim
   */
  fileInsuranceClaim: protectedProcedure
    .input(
      z.object({
        policyId: z.number(),
        claimType: z.string(),
        description: z.string(),
        amount: z.number().positive(),
        incidentDate: z.date(),
        farmId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const farmId = input.farmId || ctx.user.farmId;

      return {
        id: Math.random(),
        claimNumber: `CLM-${Date.now()}`,
        ...input,
        status: 'submitted',
        submittedDate: new Date(),
        estimatedResolution: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      };
    }),
});
