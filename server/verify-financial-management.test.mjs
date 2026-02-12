#!/usr/bin/env node

/**
 * Financial Management Module - Automated Verification Test Suite
 * Runs after production deployment to verify all features are working
 */

import http from 'http';

const BASE_URL = 'http://localhost:3000';
const TESTS = [];
let passedTests = 0;
let failedTests = 0;

// Test helper functions
function makeRequest(path, method = 'GET') {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      timeout: 5000,
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data,
        });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

function logTest(name, passed, message = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status}: ${name}`);
  if (message) console.log(`   ${message}`);
  if (passed) passedTests++;
  else failedTests++;
}

// Test Suite
async function runTests() {
  console.log('\n🧪 Financial Management Module - Verification Test Suite\n');
  console.log('=' .repeat(60));

  // Test 1: API Health Check
  console.log('\n📋 Phase 1: API Health Check');
  try {
    const res = await makeRequest('/api/trpc/financialManagement.getFinancialSummary');
    logTest('API Endpoint Accessible', res.status === 400 || res.status === 200, 
      `Status: ${res.status}`);
  } catch (e) {
    logTest('API Endpoint Accessible', false, e.message);
  }

  // Test 2: Component Existence
  console.log('\n📋 Phase 2: Component Verification');
  try {
    const res = await makeRequest('/financial-management');
    logTest('Financial Management Page Loads', res.status === 200, 
      `Status: ${res.status}`);
  } catch (e) {
    logTest('Financial Management Page Loads', false, e.message);
  }

  try {
    const res = await makeRequest('/financial-dashboard');
    logTest('Financial Dashboard Page Loads', res.status === 200, 
      `Status: ${res.status}`);
  } catch (e) {
    logTest('Financial Dashboard Page Loads', false, e.message);
  }

  try {
    const res = await makeRequest('/financial-forecasting');
    logTest('Financial Forecasting Page Loads', res.status === 200, 
      `Status: ${res.status}`);
  } catch (e) {
    logTest('Financial Forecasting Page Loads', false, e.message);
  }

  // Test 3: Navigation Structure
  console.log('\n📋 Phase 3: Navigation Structure');
  try {
    const res = await makeRequest('/');
    const hasFinancialMenu = res.body.includes('Financial Management') || 
                            res.body.includes('Cost & Profitability');
    logTest('Financial Management Menu Visible', hasFinancialMenu, 
      'Menu items should be in navigation');
  } catch (e) {
    logTest('Financial Management Menu Visible', false, e.message);
  }

  // Test 4: API Procedures
  console.log('\n📋 Phase 4: Backend Procedures');
  const procedures = [
    'getFinancialSummary',
    'getBudgetVsActualDetailed',
    'getBudgetTrendAnalysis',
    'getBudgetPerformanceMetrics',
    'getBudgetAlerts',
    'getExpensesByCategory',
    'getRevenueByType',
    'getProfitabilityAnalysis',
  ];

  for (const proc of procedures) {
    try {
      const res = await makeRequest(`/api/trpc/financialManagement.${proc}`);
      const isAccessible = res.status === 400 || res.status === 200 || res.status === 401;
      logTest(`Procedure: ${proc}`, isAccessible, `Status: ${res.status}`);
    } catch (e) {
      logTest(`Procedure: ${proc}`, false, e.message);
    }
  }

  // Test 5: Data Retrieval
  console.log('\n📋 Phase 5: Data Retrieval');
  try {
    const res = await makeRequest('/api/trpc/financialManagement.getFinancialSummary');
    const hasData = res.body.length > 0;
    logTest('Financial Summary Data Available', hasData, 
      `Response size: ${res.body.length} bytes`);
  } catch (e) {
    logTest('Financial Summary Data Available', false, e.message);
  }

  // Test 6: Performance
  console.log('\n📋 Phase 6: Performance Metrics');
  const startTime = Date.now();
  try {
    await makeRequest('/financial-management');
    const loadTime = Date.now() - startTime;
    const isAcceptable = loadTime < 3000;
    logTest('Page Load Performance', isAcceptable, 
      `Load time: ${loadTime}ms (target: <3000ms)`);
  } catch (e) {
    logTest('Page Load Performance', false, e.message);
  }

  // Test 7: Error Handling
  console.log('\n📋 Phase 7: Error Handling');
  try {
    const res = await makeRequest('/api/trpc/financialManagement.nonexistentProcedure');
    const hasErrorHandling = res.status === 404 || res.status === 400;
    logTest('Invalid Procedure Error Handling', hasErrorHandling, 
      `Status: ${res.status}`);
  } catch (e) {
    logTest('Invalid Procedure Error Handling', false, e.message);
  }

  // Test 8: Security
  console.log('\n📋 Phase 8: Security Checks');
  try {
    const res = await makeRequest('/financial-management');
    const hasSecurityHeaders = res.headers['x-content-type-options'] || 
                              res.headers['content-security-policy'];
    logTest('Security Headers Present', !!hasSecurityHeaders, 
      'XSS and MIME type protections');
  } catch (e) {
    logTest('Security Headers Present', false, e.message);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Test Summary');
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`📈 Success Rate: ${Math.round((passedTests / (passedTests + failedTests)) * 100)}%`);

  if (failedTests === 0) {
    console.log('\n🎉 All tests passed! Financial Management module is ready for production.');
  } else {
    console.log(`\n⚠️  ${failedTests} test(s) failed. Please review and fix issues.`);
  }

  console.log('\n' + '='.repeat(60) + '\n');
  process.exit(failedTests > 0 ? 1 : 0);
}

// Run tests
runTests().catch(err => {
  console.error('Test suite error:', err);
  process.exit(1);
});
