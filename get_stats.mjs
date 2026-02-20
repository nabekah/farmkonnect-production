import { getDb } from './server/db.js';
import { farms, cropCycles, alerts, animals } from './drizzle/schema.js';
import { count, sql } from 'drizzle-orm';

const db = await getDb();

console.log('\n=== DATABASE QUICK STATS ===\n');

// Total Farms
const [farmResult] = await db.select({ value: count() }).from(farms);
console.log(`Total Farms: ${farmResult.value}`);

// Farm Area
const [areaResult] = await db.select({ value: sql`COALESCE(SUM(CAST(sizeHectares AS DECIMAL(10,2))), 0)` }).from(farms);
console.log(`Farm Area (ha): ${areaResult.value}`);

// Active Crops
const [cropsResult] = await db.select({ value: count() }).from(cropCycles).where(sql`status = 'active'`);
console.log(`Active Crops: ${cropsResult.value}`);

// Pending Alerts
const [alertsResult] = await db.select({ value: count() }).from(alerts).where(sql`isResolved = false`);
console.log(`Pending Alerts: ${alertsResult.value}`);

// Weather Alerts
const [weatherResult] = await db.select({ value: count() }).from(alerts).where(sql`alertType = 'weather' AND isResolved = false`);
console.log(`Weather Alerts: ${weatherResult.value}`);

// Livestock
const [livestockResult] = await db.select({ value: count() }).from(animals);
console.log(`Livestock: ${livestockResult.value}`);

console.log('\n');
