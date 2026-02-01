import { getDb } from "../db";
import { broadcastToUser } from "./websocket";
import { animalHealthRecords, fishPonds, notificationPreferences } from "../../drizzle/schema";
import { eq, desc, gte } from "drizzle-orm";

interface AlertConfig {
  type: 'health' | 'water_quality';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  userId: number;
  farmId: number;
}

/**
 * Log alert to console (can be extended to send via WebSocket/Email/SMS)
 */
async function sendAlert(config: AlertConfig) {
  console.log(`[ALERT] ${config.severity.toUpperCase()} - ${config.title}: ${config.message}`);
  
  // Broadcast real-time alert via WebSocket
  broadcastToUser(config.userId, {
    type: "alert",
    severity: config.severity,
    alertType: config.type,
    title: config.title,
    message: config.message,
    farmId: config.farmId,
    timestamp: new Date().toISOString(),
  });
  
  // Future: Add email notification via SendGrid
  // Future: Add SMS notification via Twilio
}

/**
 * Check animal health records for critical conditions
 */
export async function checkAnimalHealthAlerts(farmId: number, userId: number) {
  const db = await getDb();
  if (!db) return;

  // Get recent health records (last 24 hours)
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);

  const recentRecords = await db
    .select()
    .from(animalHealthRecords)
    .where(
      gte(animalHealthRecords.recordDate, oneDayAgo)
    )
    .orderBy(desc(animalHealthRecords.recordDate));

  for (const record of recentRecords) {
    // Check for critical events in details
    if (record.details) {
      const criticalKeywords = ['critical', 'emergency', 'severe', 'fever', 'bleeding', 'seizure', 'collapse', 'respiratory distress'];
      const hasCriticalIssue = criticalKeywords.some(keyword =>
        record.details!.toLowerCase().includes(keyword)
      );
      
      if (hasCriticalIssue) {
        await sendAlert({
          type: 'health',
          severity: record.eventType === 'illness' ? 'critical' : 'warning',
          title: 'Animal Health Alert',
          message: `Animal ID ${record.animalId} has a health event (${record.eventType}): ${record.details}. Please review and take appropriate action.`,
          userId,
          farmId,
        });
      }
    }
  }
}

/**
 * Check fish pond conditions (simplified version)
 */
export async function checkWaterQualityAlerts(farmId: number, userId: number) {
  const db = await getDb();
  if (!db) return;

  // Get ponds for this farm
  const ponds = await db
    .select()
    .from(fishPonds)
    .where(eq(fishPonds.farmId, farmId));

  // Log pond count for monitoring
  if (ponds.length > 0) {
    console.log(`[MONITORING] Checking ${ponds.length} ponds for farm ${farmId}`);
  }
  
  // Future: Add water quality monitoring when water quality table is available
}

/**
 * Run all alert checks for a farm
 */
export async function runAlertChecks(farmId: number, userId: number) {
  await Promise.all([
    checkAnimalHealthAlerts(farmId, userId),
    checkWaterQualityAlerts(farmId, userId),
  ]);
}
