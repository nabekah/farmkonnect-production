import cron from "node-cron";
import { runNotificationChecks } from "./notificationService";

/**
 * Notification Cron Jobs
 * 
 * Schedules periodic checks for critical events that require notifications:
 * - Breeding due dates
 * - Low stock levels
 * - Weather alerts
 * - IoT sensor alerts
 */

let notificationCronJob: any | null = null;

/**
 * Initialize notification cron jobs
 * Runs every hour to check for critical events
 */
export function initializeNotificationCron() {
  if (notificationCronJob) {
    console.log("[Notification Cron] Already initialized");
    return;
  }

  // Run notification checks every hour at minute 0
  notificationCronJob = cron.schedule(
    "0 * * * *", // Every hour
    async () => {
      try {
        console.log("[Notification Cron] Running scheduled notification checks...");
        const results = await runNotificationChecks();
        console.log("[Notification Cron] Checks completed:", results);
      } catch (error) {
        console.error("[Notification Cron] Error running notification checks:", error);
      }
    },
    {
      timezone: "Africa/Accra",
    }
  );

  console.log("[Notification Cron] Initialized - Running every hour");

  // Run immediately on startup
  runNotificationChecks()
    .then((results) => {
      console.log("[Notification Cron] Initial check completed:", results);
    })
    .catch((error) => {
      console.error("[Notification Cron] Initial check failed:", error);
    });
}

/**
 * Stop notification cron jobs
 */
export function stopNotificationCron() {
  if (notificationCronJob) {
    notificationCronJob.stop();
    notificationCronJob = null;
    console.log("[Notification Cron] Stopped");
  }
}
