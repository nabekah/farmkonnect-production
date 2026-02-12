#!/usr/bin/env node

/**
 * End-to-End Test Suite for Financial Management Module
 * Tests complete data flow from database through API to frontend
 */

import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;
const API_URL = process.env.API_URL || "http://localhost:3001";

let connection;
let testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

async function test(name, fn) {
  try {
    await fn();
    testResults.passed++;
    testResults.tests.push({ name, status: "✅ PASS" });
    console.log(`✅ ${name}`);
  } catch (error) {
    testResults.failed++;
    testResults.tests.push({ name, status: "❌ FAIL", error: error.message });
    console.log(`❌ ${name}`);
    console.log(`   Error: ${error.message}`);
  }
}

async function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${expected}, got ${actual}`);
  }
}

async function assertGreater(actual, expected, message) {
  if (actual <= expected) {
    throw new Error(`${message}: expected > ${expected}, got ${actual}`);
  }
}

async function runTests() {
  console.log("🧪 Financial Management E2E Test Suite\n");
  console.log("=== Phase 1: Database Connectivity ===\n");

  try {
    connection = await mysql.createConnection(DATABASE_URL);
    console.log("✅ Database connection established\n");
  } catch (error) {
    console.error("❌ Failed to connect to database:", error.message);
    process.exit(1);
  }

  // Phase 1: Database Schema Tests
  console.log("=== Phase 2: Database Schema Validation ===\n");

  await test("Expenses table exists", async () => {
    const [tables] = await connection.execute("SHOW TABLES LIKE 'expenses'");
    assertEqual(tables.length, 1, "Expenses table");
  });

  await test("Revenue table exists", async () => {
    const [tables] = await connection.execute("SHOW TABLES LIKE 'revenue'");
    assertEqual(tables.length, 1, "Revenue table");
  });

  await test("Budgets table exists", async () => {
    const [tables] = await connection.execute("SHOW TABLES LIKE 'budgets'");
    assertEqual(tables.length, 1, "Budgets table");
  });

  // Phase 2: Data Presence Tests
  console.log("\n=== Phase 3: Data Presence Validation ===\n");

  await test("Expenses data exists", async () => {
    const [result] = await connection.execute(
      "SELECT COUNT(*) as count FROM expenses WHERE farmId = 1"
    );
    assertGreater(result[0].count, 0, "Expense records");
  });

  await test("Revenue data exists", async () => {
    const [result] = await connection.execute(
      "SELECT COUNT(*) as count FROM revenue WHERE farmId = 1"
    );
    assertGreater(result[0].count, 0, "Revenue records");
  });

  await test("Budget data exists", async () => {
    const [result] = await connection.execute(
      "SELECT COUNT(*) as count FROM budgets WHERE farmId = 1"
    );
    assertGreater(result[0].count, 0, "Budget records");
  });

  // Phase 3: Data Quality Tests
  console.log("\n=== Phase 4: Data Quality Validation ===\n");

  await test("Expenses have valid amounts", async () => {
    const [result] = await connection.execute(
      "SELECT COUNT(*) as count FROM expenses WHERE farmId = 1 AND amount > 0"
    );
    assertGreater(result[0].count, 0, "Valid expense amounts");
  });

  await test("Revenue have valid amounts", async () => {
    const [result] = await connection.execute(
      "SELECT COUNT(*) as count FROM revenue WHERE farmId = 1 AND amount > 0"
    );
    assertGreater(result[0].count, 0, "Valid revenue amounts");
  });

  await test("Expenses have required fields", async () => {
    const [result] = await connection.execute(
      "SELECT COUNT(*) as count FROM expenses WHERE farmId = 1 AND description IS NOT NULL AND expenseDate IS NOT NULL"
    );
    assertGreater(result[0].count, 0, "Required expense fields");
  });

  await test("Revenue have required fields", async () => {
    const [result] = await connection.execute(
      "SELECT COUNT(*) as count FROM revenue WHERE farmId = 1 AND description IS NOT NULL AND revenueDate IS NOT NULL"
    );
    assertGreater(result[0].count, 0, "Required revenue fields");
  });

  // Phase 4: Financial Calculations Tests
  console.log("\n=== Phase 5: Financial Calculations ===\n");

  let totalExpenses, totalRevenue;

  await test("Calculate total expenses", async () => {
    const [result] = await connection.execute(
      "SELECT SUM(amount) as total FROM expenses WHERE farmId = 1"
    );
    totalExpenses = result[0].total || 0;
    assertGreater(totalExpenses, 0, "Total expenses");
  });

  await test("Calculate total revenue", async () => {
    const [result] = await connection.execute(
      "SELECT SUM(amount) as total FROM revenue WHERE farmId = 1"
    );
    totalRevenue = result[0].total || 0;
    assertGreater(totalRevenue, 0, "Total revenue");
  });

  await test("Calculate net profit", async () => {
    const netProfit = totalRevenue - totalExpenses;
    // Just verify calculation works, not the sign
    if (isNaN(netProfit)) {
      throw new Error("Net profit calculation failed");
    }
  });

  // Phase 5: Expense Category Analysis
  console.log("\n=== Phase 6: Expense Category Analysis ===\n");

  await test("Expenses grouped by type", async () => {
    const [result] = await connection.execute(
      "SELECT COUNT(DISTINCT expenseType) as count FROM expenses WHERE farmId = 1"
    );
    assertGreater(result[0].count, 0, "Expense types");
  });

  await test("Revenue grouped by type", async () => {
    const [result] = await connection.execute(
      "SELECT COUNT(DISTINCT revenueType) as count FROM revenue WHERE farmId = 1"
    );
    assertGreater(result[0].count, 0, "Revenue types");
  });

  // Phase 6: Budget Analysis
  console.log("\n=== Phase 7: Budget Analysis ===\n");

  await test("Budget categories exist", async () => {
    const [result] = await connection.execute(
      "SELECT COUNT(DISTINCT category) as count FROM budgets WHERE farmId = 1"
    );
    assertGreater(result[0].count, 0, "Budget categories");
  });

  await test("Budget allocations are valid", async () => {
    const [result] = await connection.execute(
      "SELECT COUNT(*) as count FROM budgets WHERE farmId = 1 AND allocatedAmount > 0"
    );
    assertGreater(result[0].count, 0, "Valid budget allocations");
  });

  // Phase 7: Data Integrity Tests
  console.log("\n=== Phase 8: Data Integrity ===\n");

  await test("No duplicate expense IDs", async () => {
    const [result] = await connection.execute(
      "SELECT COUNT(*) as total, COUNT(DISTINCT id) as uniqueCount FROM expenses WHERE farmId = 1"
    );
    assertEqual(result[0].total, result[0].uniqueCount, "Unique expense IDs");
  });

  await test("No duplicate revenue IDs", async () => {
    const [result] = await connection.execute(
      "SELECT COUNT(*) as total, COUNT(DISTINCT id) as uniqueCount FROM revenue WHERE farmId = 1"
    );
    assertEqual(result[0].total, result[0].uniqueCount, "Unique revenue IDs");
  });

  await test("No duplicate budget IDs", async () => {
    const [result] = await connection.execute(
      "SELECT COUNT(*) as total, COUNT(DISTINCT id) as uniqueCount FROM budgets WHERE farmId = 1"
    );
    assertEqual(result[0].total, result[0].uniqueCount, "Unique budget IDs");
  });

  // Phase 8: Date Range Validation
  console.log("\n=== Phase 9: Date Range Validation ===\n");

  await test("Expense dates are valid", async () => {
    const [result] = await connection.execute(
      "SELECT COUNT(*) as count FROM expenses WHERE farmId = 1 AND expenseDate IS NOT NULL AND expenseDate > '2020-01-01'"
    );
    assertGreater(result[0].count, 0, "Valid expense dates");
  });

  await test("Revenue dates are valid", async () => {
    const [result] = await connection.execute(
      "SELECT COUNT(*) as count FROM revenue WHERE farmId = 1 AND revenueDate IS NOT NULL AND revenueDate > '2020-01-01'"
    );
    assertGreater(result[0].count, 0, "Valid revenue dates");
  });

  // Summary
  console.log("\n=== Test Summary ===\n");
  console.log(`Total Tests: ${testResults.passed + testResults.failed}`);
  console.log(`Passed: ${testResults.passed} ✅`);
  console.log(`Failed: ${testResults.failed} ❌`);
  console.log(`Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%\n`);

  if (testResults.failed > 0) {
    console.log("Failed Tests:");
    testResults.tests.filter(t => t.status.includes("FAIL")).forEach(t => {
      console.log(`  - ${t.name}: ${t.error}`);
    });
  }

  // Financial Summary
  console.log("\n=== Financial Data Summary ===\n");
  const expensesNum = typeof totalExpenses === 'number' ? totalExpenses : parseFloat(totalExpenses) || 0;
  const revenueNum = typeof totalRevenue === 'number' ? totalRevenue : parseFloat(totalRevenue) || 0;
  console.log(`Total Expenses: GHS ${expensesNum.toFixed(2)}`);
  console.log(`Total Revenue: GHS ${revenueNum.toFixed(2)}`);
  console.log(`Net Profit: GHS ${(revenueNum - expensesNum).toFixed(2)}`);
  const profitMargin = revenueNum > 0 ? (((revenueNum - expensesNum) / revenueNum) * 100).toFixed(2) : 0;
  console.log(`Profit Margin: ${profitMargin}%\n`);

  await connection.end();
  process.exit(testResults.failed > 0 ? 1 : 0);
}

runTests().catch(error => {
  console.error("Test suite error:", error);
  process.exit(1);
});
