import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { farmExpenses, farmRevenue, animals, farmWorkers, fishPonds, farmAssets } from "../drizzle/schema";
import { and, gte, lte, eq, sql } from "drizzle-orm";
import * as XLSX from 'xlsx';

export const exportRouter = router({
  // Export financial data to Excel
  exportFinancialExcel: protectedProcedure
    .input(z.object({
      startDate: z.string(),
      endDate: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error('Database connection failed');
      const { startDate, endDate } = input;

      // Fetch expenses
      const expenses = await db
        .select()
        .from(farmExpenses)
        .where(
          and(
            eq(farmExpenses.farmId, ctx.user.id),
            gte(farmExpenses.expenseDate, new Date(startDate)),
            lte(farmExpenses.expenseDate, new Date(endDate))
          )
        );

      // Fetch revenue
      const revenue = await db
        .select()
        .from(farmRevenue)
        .where(
          and(
            eq(farmRevenue.farmId, ctx.user.id),
            gte(farmRevenue.saleDate, new Date(startDate)),
            lte(farmRevenue.saleDate, new Date(endDate))
          )
        );

      // Create workbook
      const wb = XLSX.utils.book_new();

      // Expenses sheet
      const expensesData = expenses.map(e => ({
        Date: e.expenseDate.toISOString().split('T')[0],
        Category: e.category,
        Description: e.description || '',
        Amount: e.amount,
        Vendor: e.vendor || '',
        'Invoice Number': e.invoiceNumber || '',
      }));
      const expensesSheet = XLSX.utils.json_to_sheet(expensesData);
      XLSX.utils.book_append_sheet(wb, expensesSheet, 'Expenses');

      // Revenue sheet
      const revenueData = revenue.map(r => ({
        Date: r.saleDate.toISOString().split('T')[0],
        Source: r.source,
        Amount: r.amount,
        Buyer: r.buyer || '',
        Quantity: r.quantity || '',
        Unit: r.unit || '',
        Notes: r.notes || '',
      }));
      const revenueSheet = XLSX.utils.json_to_sheet(revenueData);
      XLSX.utils.book_append_sheet(wb, revenueSheet, 'Revenue');

      // Summary sheet
      const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
      const totalRevenue = revenue.reduce((sum, r) => sum + parseFloat(r.amount), 0);
      const netProfit = totalRevenue - totalExpenses;

      const summaryData = [
        { Metric: 'Total Revenue', Value: totalRevenue.toFixed(2) },
        { Metric: 'Total Expenses', Value: totalExpenses.toFixed(2) },
        { Metric: 'Net Profit', Value: netProfit.toFixed(2) },
      ];
      const summarySheet = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

      // Generate buffer
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      const base64 = buffer.toString('base64');

      return {
        success: true,
        data: base64,
        filename: `financial-report-${startDate}-to-${endDate}.xlsx`,
      };
    }),

  // Export livestock data to Excel
  exportLivestockExcel: protectedProcedure
    .input(z.object({
      farmId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database connection failed');

      // Fetch animals
      const animalsList = await db
        .select()
        .from(animals)
        .where(eq(animals.farmId, input.farmId));

      // Create workbook
      const wb = XLSX.utils.book_new();

      // Animals sheet
      const animalsData = animalsList.map(a => ({
        'Tag ID': a.uniqueTagId || '',
        'Type ID': a.typeId,
        Breed: a.breed || '',
        'Birth Date': a.birthDate ? a.birthDate.toISOString().split('T')[0] : '',
        Gender: a.gender || '',
        Status: a.status || '',
        'Created At': a.createdAt.toISOString().split('T')[0],
      }));
      const animalsSheet = XLSX.utils.json_to_sheet(animalsData);
      XLSX.utils.book_append_sheet(wb, animalsSheet, 'Animals');

      // Summary sheet
      const summaryData = [
        { Metric: 'Total Animals', Value: animalsList.length },
        { Metric: 'Active Animals', Value: animalsList.filter(a => a.status === 'active').length },
        { Metric: 'Sold Animals', Value: animalsList.filter(a => a.status === 'sold').length },
        { Metric: 'Deceased Animals', Value: animalsList.filter(a => a.status === 'deceased').length },
      ];
      const summarySheet = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

      // Generate buffer
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      const base64 = buffer.toString('base64');

      return {
        success: true,
        data: base64,
        filename: `livestock-report-${Date.now()}.xlsx`,
      };
    }),

  // Export all farm data to Excel
  exportAllDataExcel: protectedProcedure
    .input(z.object({
      farmId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database connection failed');

      // Fetch all data
      const [expensesList, revenueList, animalsList, workersList, pondsList, assetsList] = await Promise.all([
        db.select().from(farmExpenses).where(eq(farmExpenses.farmId, input.farmId)),
        db.select().from(farmRevenue).where(eq(farmRevenue.farmId, input.farmId)),
        db.select().from(animals).where(eq(animals.farmId, input.farmId)),
        db.select().from(farmWorkers).where(eq(farmWorkers.farmId, input.farmId)),
        db.select().from(fishPonds).where(eq(fishPonds.farmId, input.farmId)),
        db.select().from(farmAssets).where(eq(farmAssets.farmId, input.farmId)),
      ]);

      // Create workbook
      const wb = XLSX.utils.book_new();

      // Expenses sheet
      if (expensesList.length > 0) {
        const expensesSheet = XLSX.utils.json_to_sheet(expensesList);
        XLSX.utils.book_append_sheet(wb, expensesSheet, 'Expenses');
      }

      // Revenue sheet
      if (revenueList.length > 0) {
        const revenueSheet = XLSX.utils.json_to_sheet(revenueList);
        XLSX.utils.book_append_sheet(wb, revenueSheet, 'Revenue');
      }

      // Animals sheet
      if (animalsList.length > 0) {
        const animalsSheet = XLSX.utils.json_to_sheet(animalsList);
        XLSX.utils.book_append_sheet(wb, animalsSheet, 'Animals');
      }

      // Workers sheet
      if (workersList.length > 0) {
        const workersSheet = XLSX.utils.json_to_sheet(workersList);
        XLSX.utils.book_append_sheet(wb, workersSheet, 'Workers');
      }

      // Ponds sheet
      if (pondsList.length > 0) {
        const pondsSheet = XLSX.utils.json_to_sheet(pondsList);
        XLSX.utils.book_append_sheet(wb, pondsSheet, 'Fish Ponds');
      }

      // Assets sheet
      if (assetsList.length > 0) {
        const assetsSheet = XLSX.utils.json_to_sheet(assetsList);
        XLSX.utils.book_append_sheet(wb, assetsSheet, 'Assets');
      }

      // Generate buffer
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      const base64 = buffer.toString('base64');

      return {
        success: true,
        data: base64,
        filename: `farm-complete-data-${Date.now()}.xlsx`,
      };
    }),

  // Generate PDF report (simplified version - returns HTML that can be printed to PDF)
  generatePDFReport: protectedProcedure
    .input(z.object({
      startDate: z.string(),
      endDate: z.string(),
      farmId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database connection failed');
      const { startDate, endDate, farmId } = input;

      // Fetch financial data
      const [expenses, revenue] = await Promise.all([
        db.select().from(farmExpenses).where(
          and(
            eq(farmExpenses.farmId, farmId),
            gte(farmExpenses.expenseDate, new Date(startDate)),
            lte(farmExpenses.expenseDate, new Date(endDate))
          )
        ),
        db.select().from(farmRevenue).where(
          and(
            eq(farmRevenue.farmId, farmId),
            gte(farmRevenue.saleDate, new Date(startDate)),
            lte(farmRevenue.saleDate, new Date(endDate))
          )
        ),
      ]);

      const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
      const totalRevenue = revenue.reduce((sum, r) => sum + parseFloat(r.amount), 0);
      const netProfit = totalRevenue - totalExpenses;

      // Generate HTML report
      const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Farm Financial Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    h1 { color: #2563eb; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
    th { background-color: #2563eb; color: white; }
    .summary { background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .summary h2 { margin-top: 0; }
    .metric { display: flex; justify-content: space-between; margin: 10px 0; }
    .metric-label { font-weight: bold; }
    .metric-value { color: #2563eb; font-size: 1.2em; }
  </style>
</head>
<body>
  <h1>Farm Financial Report</h1>
  <p><strong>Period:</strong> ${startDate} to ${endDate}</p>
  <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>

  <div class="summary">
    <h2>Financial Summary</h2>
    <div class="metric">
      <span class="metric-label">Total Revenue:</span>
      <span class="metric-value">$${totalRevenue.toFixed(2)}</span>
    </div>
    <div class="metric">
      <span class="metric-label">Total Expenses:</span>
      <span class="metric-value">$${totalExpenses.toFixed(2)}</span>
    </div>
    <div class="metric">
      <span class="metric-label">Net Profit:</span>
      <span class="metric-value" style="color: ${netProfit >= 0 ? '#10b981' : '#ef4444'}">$${netProfit.toFixed(2)}</span>
    </div>
  </div>

  <h2>Revenue Details</h2>
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Source</th>
        <th>Description</th>
        <th>Amount</th>
      </tr>
    </thead>
    <tbody>
      ${revenue.map(r => `
        <tr>
          <td>${r.saleDate.toISOString().split('T')[0]}</td>
          <td>${r.source}</td>
          <td>${r.notes || '-'}</td>
          <td>$${parseFloat(r.amount).toFixed(2)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <h2>Expense Details</h2>
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Category</th>
        <th>Description</th>
        <th>Amount</th>
      </tr>
    </thead>
    <tbody>
      ${expenses.map(e => `
        <tr>
          <td>${e.expenseDate.toISOString().split('T')[0]}</td>
          <td>${e.category}</td>
          <td>${e.description || '-'}</td>
          <td>$${parseFloat(e.amount).toFixed(2)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
</body>
</html>
      `;

      return {
        success: true,
        html,
        filename: `farm-report-${startDate}-to-${endDate}.pdf`,
      };
    }),
});
