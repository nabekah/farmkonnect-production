/**
 * Debug utility to trace activity data flow from database to API
 * This helps identify where data is being lost or filtered
 */

import { getDb } from './db';
import { sql } from 'drizzle-orm';

export async function debugActivityDataFlow() {
  console.log('\n=== ACTIVITY DATA DEBUG TRACE ===\n');

  const db = await getDb();
  if (!db) {
    console.error('❌ Database not available');
    return;
  }

  try {
    // Step 1: Check database connection
    console.log('✅ Step 1: Database connection established');

    // Step 2: Check table exists and has data
    console.log('\n📊 Step 2: Checking fieldWorkerActivityLogs table...');
    const countResult = await db.execute(
      sql`SELECT COUNT(*) as count FROM fieldWorkerActivityLogs`
    );
    console.log('   Raw count result:', countResult);
    const countArray = Array.isArray(countResult) ? countResult : [];
    const totalRecords = countArray[0] ? (countArray[0] as any).count : 0;
    console.log(`   Total records in table: ${totalRecords}`);

    if (totalRecords === 0) {
      console.warn('   ⚠️  No records found in fieldWorkerActivityLogs table');
      return;
    }

    // Step 3: Check sample records
    console.log('\n📝 Step 3: Fetching sample records...');
    const sampleResult = await db.execute(
      sql`SELECT id, logId, userId, farmId, activityType, title, status, createdAt FROM fieldWorkerActivityLogs LIMIT 3`
    );
    console.log('   Raw sample result:', sampleResult);
    const sampleArray = Array.isArray(sampleResult) ? sampleResult : [];
    console.log(`   Sample records fetched: ${sampleArray.length}`);
    sampleArray.forEach((record: any, index: number) => {
      console.log(`   Record ${index + 1}:`, {
        id: record.id,
        logId: record.logId,
        userId: record.userId,
        farmId: record.farmId,
        activityType: record.activityType,
        title: record.title,
        status: record.status,
        createdAt: record.createdAt,
      });
    });

    // Step 4: Check records by farmId
    console.log('\n🏘️  Step 4: Checking records filtered by farmId=1...');
    const farmResult = await db.execute(
      sql`SELECT id, logId, userId, farmId, activityType, title FROM fieldWorkerActivityLogs WHERE farmId = 1 LIMIT 5`
    );
    console.log('   Raw farm result:', farmResult);
    const farmArray = Array.isArray(farmResult) ? farmResult : [];
    console.log(`   Records for farmId=1: ${farmArray.length}`);

    // Step 5: Check records by userId
    console.log('\n👤 Step 5: Checking records filtered by userId=1...');
    const userResult = await db.execute(
      sql`SELECT id, logId, userId, farmId, activityType, title FROM fieldWorkerActivityLogs WHERE userId = 1 LIMIT 5`
    );
    console.log('   Raw user result:', userResult);
    const userArray = Array.isArray(userResult) ? userResult : [];
    console.log(`   Records for userId=1: ${userArray.length}`);

    // Step 6: Check date filtering
    console.log('\n📅 Step 6: Checking date-based filtering...');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const dateResult = await db.execute(
      sql`SELECT id, logId, userId, farmId, activityType, title, createdAt FROM fieldWorkerActivityLogs 
          WHERE createdAt >= ${today} AND createdAt < ${tomorrow} LIMIT 5`
    );
    console.log('   Raw date result:', dateResult);
    const dateArray = Array.isArray(dateResult) ? dateResult : [];
    console.log(`   Records created today: ${dateArray.length}`);

    // Step 7: Check data types
    console.log('\n🔍 Step 7: Verifying data types...');
    const firstRecord = sampleArray[0];
    if (firstRecord) {
      console.log('   First record data types:');
      Object.entries(firstRecord).forEach(([key, value]) => {
        console.log(`     ${key}: ${typeof value} = ${value}`);
      });
    }

    // Step 8: Check for NULL values
    console.log('\n❓ Step 8: Checking for NULL values...');
    const nullCheckResult = await db.execute(
      sql`SELECT 
            SUM(CASE WHEN id IS NULL THEN 1 ELSE 0 END) as null_id,
            SUM(CASE WHEN logId IS NULL THEN 1 ELSE 0 END) as null_logId,
            SUM(CASE WHEN userId IS NULL THEN 1 ELSE 0 END) as null_userId,
            SUM(CASE WHEN farmId IS NULL THEN 1 ELSE 0 END) as null_farmId,
            SUM(CASE WHEN title IS NULL THEN 1 ELSE 0 END) as null_title
          FROM fieldWorkerActivityLogs`
    );
    console.log('   NULL check result:', nullCheckResult);

    console.log('\n✅ DEBUG TRACE COMPLETE\n');

  } catch (error) {
    console.error('❌ Error during debug trace:', error);
    throw error;
  }
}

// Run debug trace if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  debugActivityDataFlow().catch(console.error);
}
