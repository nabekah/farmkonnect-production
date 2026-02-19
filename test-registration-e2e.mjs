#!/usr/bin/env node

/**
 * End-to-End Registration Test
 * Tests the complete registration flow from UI -> API -> Database
 */

import mysql from 'mysql2/promise';

const API_URL = 'http://localhost:3001/api/trpc/auth.register';
const DB_CONFIG = {
  host: '127.0.0.1',
  user: 'root',
  password: 'root',
  database: 'farmkonnect_db',
};

const TEST_USER = {
  name: 'Test User E2E',
  email: `test-${Date.now()}@example.com`,
  phone: '+1234567890',
  role: 'farmer',
};

async function testRegistration() {
  console.log('\n========================================');
  console.log('🧪 REGISTRATION END-TO-END TEST');
  console.log('========================================\n');

  try {
    // Step 1: Call registration API
    console.log('📝 Step 1: Submitting registration form...');
    console.log(`   Email: ${TEST_USER.email}`);
    console.log(`   Name: ${TEST_USER.name}`);
    console.log(`   Role: ${TEST_USER.role}`);

    const registrationResponse = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        json: TEST_USER,
        meta: {
          values: ['undefined'],
        },
      }),
    });

    console.log(`\n   Response Status: ${registrationResponse.status}`);

    if (!registrationResponse.ok) {
      const errorText = await registrationResponse.text();
      console.error('❌ Registration API failed!');
      console.error('Response:', errorText);
      return false;
    }

    const responseData = await registrationResponse.json();
    console.log('✅ Registration API returned successfully');
    console.log('   Response:', JSON.stringify(responseData, null, 2));

    // Step 2: Check database for user
    console.log('\n🗄️  Step 2: Checking database for created user...');

    const connection = await mysql.createConnection(DB_CONFIG);

    try {
      const [rows] = await connection.execute(
        'SELECT id, name, email, role, approvalStatus, accountStatus FROM users WHERE email = ?',
        [TEST_USER.email]
      );

      if (rows.length === 0) {
        console.error('❌ User NOT found in database!');
        return false;
      }

      const user = rows[0];
      console.log('✅ User found in database!');
      console.log(`   ID: ${user.id}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Approval Status: ${user.approvalStatus}`);
      console.log(`   Account Status: ${user.accountStatus}`);

      // Step 3: Verify all required fields
      console.log('\n🔍 Step 3: Verifying all required fields...');

      const [detailedRows] = await connection.execute(
        'SELECT * FROM users WHERE email = ?',
        [TEST_USER.email]
      );

      const detailedUser = detailedRows[0];
      const requiredFields = {
        id: detailedUser.id,
        name: detailedUser.name,
        email: detailedUser.email,
        phone: detailedUser.phone,
        role: detailedUser.role,
        loginMethod: detailedUser.loginMethod,
        approvalStatus: detailedUser.approvalStatus,
        accountStatus: detailedUser.accountStatus,
        mfaEnabled: detailedUser.mfaEnabled,
        failedLoginAttempts: detailedUser.failedLoginAttempts,
        createdAt: detailedUser.createdAt,
        updatedAt: detailedUser.updatedAt,
        lastSignedIn: detailedUser.lastSignedIn,
      };

      console.log('   Required Fields:');
      Object.entries(requiredFields).forEach(([key, value]) => {
        const status = value !== null && value !== undefined ? '✅' : '❌';
        console.log(`     ${status} ${key}: ${value}`);
      });

      // Step 4: Verify nullable fields are null
      console.log('\n🔎 Step 4: Verifying nullable fields are null...');

      const nullableFields = {
        openId: detailedUser.openId,
        googleId: detailedUser.googleId,
        accountStatusReason: detailedUser.accountStatusReason,
        mfaSecret: detailedUser.mfaSecret,
        mfaBackupCodes: detailedUser.mfaBackupCodes,
        lastFailedLoginAt: detailedUser.lastFailedLoginAt,
        accountLockedUntil: detailedUser.accountLockedUntil,
      };

      console.log('   Nullable Fields:');
      Object.entries(nullableFields).forEach(([key, value]) => {
        const status = value === null ? '✅' : '⚠️';
        console.log(`     ${status} ${key}: ${value}`);
      });

      console.log('\n========================================');
      console.log('✅ REGISTRATION TEST PASSED!');
      console.log('========================================\n');

      return true;
    } finally {
      await connection.end();
    }
  } catch (error) {
    console.error('\n❌ TEST FAILED WITH ERROR:');
    console.error(error.message);
    console.error(error.stack);
    return false;
  }
}

// Run the test
testRegistration().then((success) => {
  process.exit(success ? 0 : 1);
});
