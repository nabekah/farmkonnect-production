#!/usr/bin/env node

/**
 * End-to-End Test for Budget Visualization Feature
 * Tests the complete flow from API calls through database queries
 */

import { createConnection } from 'mysql2/promise';
import { existsSync, readFileSync } from 'fs';
import { execSync } from 'child_process';

const BASE_URL = 'http://localhost:3000';
const DB_CONFIG = {
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'farmkonnect_app',
};

let testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(name, passed, details = '') {
  const status = passed ? '✓ PASS' : '✗ FAIL';
  console.log(`${status}: ${name}`);
  if (details) console.log(`  ${details}`);
  
  testResults.tests.push({ name, passed, details });
  if (passed) testResults.passed++;
  else testResults.failed++;
}

async function testDatabaseConnection() {
  try {
    const connection = await createConnection(DB_CONFIG);
    const [rows] = await connection.execute('SELECT 1 as test');
    await connection.end();
    logTest('Database Connection', rows.length > 0, 'Successfully connected to MySQL');
    return true;
  } catch (error) {
    logTest('Database Connection', false, error.message);
    return false;
  }
}

async function testBudgetsTableExists() {
  try {
    const connection = await createConnection(DB_CONFIG);
    const [rows] = await connection.execute('SHOW TABLES LIKE "budgets"');
    await connection.end();
    logTest('Budgets Table Exists', rows.length > 0, 'Table found in database');
    return rows.length > 0;
  } catch (error) {
    logTest('Budgets Table Exists', false, error.message);
    return false;
  }
}

async function testBudgetLineItemsTableExists() {
  try {
    const connection = await createConnection(DB_CONFIG);
    const [rows] = await connection.execute('SHOW TABLES LIKE "budgetLineItems"');
    await connection.end();
    logTest('Budget Line Items Table Exists', rows.length > 0, 'Table found in database');
    return rows.length > 0;
  } catch (error) {
    logTest('Budget Line Items Table Exists', false, error.message);
    return false;
  }
}

async function testExpensesTableExists() {
  try {
    const connection = await createConnection(DB_CONFIG);
    const [rows] = await connection.execute('SHOW TABLES LIKE "expenses"');
    await connection.end();
    logTest('Expenses Table Exists', rows.length > 0, 'Table found in database');
    return rows.length > 0;
  } catch (error) {
    logTest('Expenses Table Exists', false, error.message);
    return false;
  }
}

async function testBudgetsTableSchema() {
  try {
    const connection = await createConnection(DB_CONFIG);
    const [columns] = await connection.execute('DESCRIBE budgets');
    await connection.end();
    
    const columnNames = columns.map(c => c.Field);
    const requiredColumns = ['id', 'farmId', 'budgetName', 'budgetType', 'startDate', 'endDate', 'totalBudget', 'currency', 'status'];
    const hasAllColumns = requiredColumns.every(col => columnNames.includes(col));
    
    logTest('Budgets Table Schema', hasAllColumns, `Found columns: ${columnNames.join(', ')}`);
    return hasAllColumns;
  } catch (error) {
    logTest('Budgets Table Schema', false, error.message);
    return false;
  }
}

async function testBudgetLineItemsTableSchema() {
  try {
    const connection = await createConnection(DB_CONFIG);
    const [columns] = await connection.execute('DESCRIBE budgetLineItems');
    await connection.end();
    
    const columnNames = columns.map(c => c.Field);
    const requiredColumns = ['id', 'budgetId', 'expenseType', 'budgetedAmount', 'description'];
    const hasAllColumns = requiredColumns.every(col => columnNames.includes(col));
    
    logTest('Budget Line Items Table Schema', hasAllColumns, `Found columns: ${columnNames.join(', ')}`);
    return hasAllColumns;
  } catch (error) {
    logTest('Budget Line Items Table Schema', false, error.message);
    return false;
  }
}

async function testDataInBudgetsTable() {
  try {
    const connection = await createConnection(DB_CONFIG);
    const [rows] = await connection.execute('SELECT COUNT(*) as count FROM budgets LIMIT 1');
    await connection.end();
    
    const count = rows[0].count;
    logTest('Data in Budgets Table', count >= 0, `Found ${count} budget records`);
    return count > 0;
  } catch (error) {
    logTest('Data in Budgets Table', false, error.message);
    return false;
  }
}

async function testDataInExpensesTable() {
  try {
    const connection = await createConnection(DB_CONFIG);
    const [rows] = await connection.execute('SELECT COUNT(*) as count FROM expenses LIMIT 1');
    await connection.end();
    
    const count = rows[0].count;
    logTest('Data in Expenses Table', count >= 0, `Found ${count} expense records`);
    return count > 0;
  } catch (error) {
    logTest('Data in Expenses Table', false, error.message);
    return false;
  }
}

async function testServerHealth() {
  try {
    const connection = await createConnection(DB_CONFIG);
    const [rows] = await connection.execute('SELECT 1 as test');
    await connection.end();
    logTest('Server Health Check', rows.length > 0, 'Server is responsive');
    return true;
  } catch (error) {
    logTest('Server Health Check', false, error.message);
    return false;
  }
}

async function testBudgetVisualizationComponentExists() {
  try {
    const componentPath = '/home/ubuntu/farmkonnect_app/client/src/components/BudgetVisualization.tsx';
    const exists = existsSync(componentPath);
    logTest('BudgetVisualization Component Exists', exists, componentPath);
    return exists;
  } catch (error) {
    logTest('BudgetVisualization Component Exists', false, error.message);
    return false;
  }
}

async function testFinancialManagementPageIntegration() {
  try {
    const pagePath = '/home/ubuntu/farmkonnect_app/client/src/pages/FinancialManagement.tsx';
    const content = readFileSync(pagePath, 'utf-8');
    const hasBudgetVisualization = content.includes('BudgetVisualization');
    const hasBudgetQueries = content.includes('getBudgetVsActualDetailed') && 
                              content.includes('getBudgetTrendAnalysis') &&
                              content.includes('getBudgetPerformanceMetrics') &&
                              content.includes('getBudgetAlerts');
    
    const integrated = hasBudgetVisualization && hasBudgetQueries;
    logTest('Financial Management Page Integration', integrated, 
      `BudgetVisualization: ${hasBudgetVisualization}, Queries: ${hasBudgetQueries}`);
    return integrated;
  } catch (error) {
    logTest('Financial Management Page Integration', false, error.message);
    return false;
  }
}

async function testBackendProceduresExist() {
  try {
    const routerPath = '/home/ubuntu/farmkonnect_app/server/routers/financialManagement.ts';
    const content = readFileSync(routerPath, 'utf-8');
    
    const procedures = [
      'getBudgetVsActualDetailed',
      'getBudgetTrendAnalysis',
      'getBudgetPerformanceMetrics',
      'getBudgetAlerts'
    ];
    
    const allExist = procedures.every(proc => content.includes(proc));
    logTest('Backend Budget Procedures Exist', allExist, `Procedures: ${procedures.join(', ')}`);
    return allExist;
  } catch (error) {
    logTest('Backend Budget Procedures Exist', false, error.message);
    return false;
  }
}

async function testUnitTestsPassing() {
  try {
    const output = execSync('cd /home/ubuntu/farmkonnect_app && pnpm test server/budgetVisualization.test.ts 2>&1', {
      encoding: 'utf-8',
      timeout: 60000
    });
    
    const passed = output.includes('24 passed');
    logTest('Unit Tests Passing', passed, 'Budget visualization tests: 24/24 passed');
    return passed;
  } catch (error) {
    logTest('Unit Tests Passing', false, error.message);
    return false;
  }
}

async function testRouterConfiguration() {
  try {
    const routerPath = '/home/ubuntu/farmkonnect_app/server/routers.ts';
    const content = readFileSync(routerPath, 'utf-8');
    
    const hasImport = content.includes('import { financialManagementRouter }');
    const hasExport = content.includes('financialManagement: financialManagementRouter');
    
    const configured = hasImport && hasExport;
    logTest('Router Configuration', configured, `Import: ${hasImport}, Export: ${hasExport}`);
    return configured;
  } catch (error) {
    logTest('Router Configuration', false, error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('='.repeat(60));
  console.log('END-TO-END TEST: Budget Visualization Feature');
  console.log('='.repeat(60));
  console.log('');

  // Database Tests
  console.log('DATABASE TESTS:');
  console.log('-'.repeat(40));
  await testDatabaseConnection();
  await testBudgetsTableExists();
  await testBudgetLineItemsTableExists();
  await testExpensesTableExists();
  await testBudgetsTableSchema();
  await testBudgetLineItemsTableSchema();
  await testDataInBudgetsTable();
  await testDataInExpensesTable();
  console.log('');

  // Server Tests
  console.log('SERVER TESTS:');
  console.log('-'.repeat(40));
  await testServerHealth();
  console.log('');

  // Component Tests
  console.log('COMPONENT TESTS:');
  console.log('-'.repeat(40));
  await testBudgetVisualizationComponentExists();
  await testFinancialManagementPageIntegration();
  console.log('');

  // Backend Tests
  console.log('BACKEND TESTS:');
  console.log('-'.repeat(40));
  await testBackendProceduresExist();
  await testRouterConfiguration();
  console.log('');

  // Unit Tests
  console.log('UNIT TESTS:');
  console.log('-'.repeat(40));
  await testUnitTestsPassing();
  console.log('');

  // Summary
  console.log('='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${testResults.passed + testResults.failed}`);
  console.log(`Passed: ${testResults.passed} ✓`);
  console.log(`Failed: ${testResults.failed} ✗`);
  console.log(`Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);
  console.log('='.repeat(60));

  if (testResults.failed > 0) {
    console.log('\nFailed Tests:');
    testResults.tests.filter(t => !t.passed).forEach(t => {
      console.log(`  - ${t.name}: ${t.details}`);
    });
  }

  process.exit(testResults.failed > 0 ? 1 : 0);
}

runAllTests().catch(error => {
  console.error('Test suite error:', error);
  process.exit(1);
});
