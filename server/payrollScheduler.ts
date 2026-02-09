import { CronJob } from "cron";
import { getDb } from "./db";

interface PayrollSchedule {
  id: number;
  farmId: number;
  scheduleType: "weekly" | "biweekly" | "monthly";
  paymentDay: number; // 1-31 for monthly, 1-7 for weekly
  paymentTime: string; // HH:mm format
  enabled: boolean;
  notifyWorkers: boolean;
  notifyManagement: boolean;
  lastRun?: Date;
  nextRun?: Date;
}

interface PayrollJob {
  farmId: number;
  job: CronJob;
}

const payrollJobs: Map<number, PayrollJob> = new Map();

/**
 * Initialize payroll scheduler for a farm
 */
export async function initializePayrollScheduler(farmId: number) {
  try {
    const db = await getDb();
    if (!db) {
      console.error("Database unavailable");
      return;
    }

    // Get farm's payroll schedule
    const schedule = await db.query.raw(
      `SELECT * FROM payroll_schedules WHERE farmId = ? AND enabled = true`,
      [farmId]
    );

    if (!schedule || schedule.length === 0) {
      console.log(`No active payroll schedule found for farm ${farmId}`);
      return;
    }

    const payrollSchedule = schedule[0];
    const cronExpression = generateCronExpression(payrollSchedule);

    // Create and start cron job
    const job = new CronJob(cronExpression, async () => {
      await processPayroll(farmId, payrollSchedule);
    });

    job.start();
    payrollJobs.set(farmId, { farmId, job });

    console.log(`Payroll scheduler initialized for farm ${farmId}`);
    console.log(`Next payroll run: ${job.nextDate()}`);
  } catch (error) {
    console.error(`Error initializing payroll scheduler for farm ${farmId}:`, error);
  }
}

/**
 * Generate cron expression from payroll schedule
 */
function generateCronExpression(schedule: PayrollSchedule): string {
  const [hours, minutes] = schedule.paymentTime.split(":").map(Number);

  switch (schedule.scheduleType) {
    case "weekly":
      // Day of week (0-6, 0 = Sunday)
      return `${minutes} ${hours} * * ${schedule.paymentDay}`;

    case "biweekly":
      // Every 2 weeks on specified day
      return `${minutes} ${hours} * * ${schedule.paymentDay}`;

    case "monthly":
      // Specific day of month
      return `${minutes} ${hours} ${schedule.paymentDay} * *`;

    default:
      return `${minutes} ${hours} * * *`; // Default: daily
  }
}

/**
 * Process payroll for a farm
 */
async function processPayroll(farmId: number, schedule: PayrollSchedule) {
  try {
    console.log(`Processing payroll for farm ${farmId}...`);

    const db = await getDb();
    if (!db) {
      console.error("Database unavailable");
      return;
    }

    // Get pending payroll calculations
    const pendingPayrolls = await db.query.raw(
      `SELECT pc.*, w.email, w.name, w.bankAccount, w.bankName
       FROM payroll_calculations pc
       JOIN workers w ON pc.workerId = w.id
       WHERE pc.farmId = ? AND pc.paymentStatus = 'pending'
       ORDER BY pc.createdAt ASC`,
      [farmId]
    );

    if (!pendingPayrolls || pendingPayrolls.length === 0) {
      console.log(`No pending payrolls for farm ${farmId}`);
      return;
    }

    let successCount = 0;
    let failureCount = 0;

    // Process each payroll
    for (const payroll of pendingPayrolls) {
      try {
        // Record payment
        const paymentDate = new Date().toISOString().split("T")[0];
        await db.query.raw(
          `INSERT INTO payment_history (payrollCalculationId, workerId, farmId, paymentAmount, paymentDate, paymentMethod, status)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [payroll.id, payroll.workerId, farmId, payroll.netPay, paymentDate, "bank_transfer", "completed"]
        );

        // Update payroll status
        await db.query.raw(
          `UPDATE payroll_calculations SET paymentStatus = 'paid', paymentDate = ? WHERE id = ?`,
          [paymentDate, payroll.id]
        );

        // Send email notification to worker
        if (schedule.notifyWorkers) {
          await sendPaymentNotification(payroll);
        }

        successCount++;
      } catch (error) {
        console.error(`Error processing payroll ${payroll.id}:`, error);
        failureCount++;
      }
    }

    // Send summary to management
    if (schedule.notifyManagement) {
      await sendManagementSummary(farmId, successCount, failureCount, pendingPayrolls.length);
    }

    // Update last run time
    await db.query.raw(
      `UPDATE payroll_schedules SET lastRun = NOW() WHERE farmId = ?`,
      [farmId]
    );

    console.log(`Payroll processing completed for farm ${farmId}: ${successCount} success, ${failureCount} failures`);
  } catch (error) {
    console.error(`Error processing payroll for farm ${farmId}:`, error);
  }
}

/**
 * Send payment notification to worker
 */
async function sendPaymentNotification(payroll: any) {
  try {
    // In production, integrate with SendGrid or Twilio
    const emailContent = `
Dear ${payroll.name},

Your salary payment has been processed successfully.

Payment Details:
- Amount: GHS ${parseFloat(payroll.netPay).toLocaleString()}
- Payment Date: ${new Date().toLocaleDateString()}
- Bank: ${payroll.bankName}
- Account: ${payroll.bankAccount}

If you have any questions, please contact your farm manager.

Best regards,
FarmKonnect Payroll System
    `;

    console.log(`Payment notification sent to ${payroll.email}`);
    console.log(`Email content: ${emailContent}`);

    // TODO: Integrate with SendGrid
    // await sendEmail({
    //   to: payroll.email,
    //   subject: 'Salary Payment Notification',
    //   html: emailContent
    // });
  } catch (error) {
    console.error(`Error sending payment notification:`, error);
  }
}

/**
 * Send management summary
 */
async function sendManagementSummary(farmId: number, successCount: number, failureCount: number, totalCount: number) {
  try {
    const summaryContent = `
Payroll Processing Summary
Farm ID: ${farmId}
Date: ${new Date().toLocaleDateString()}

Results:
- Total Payrolls: ${totalCount}
- Successful: ${successCount}
- Failed: ${failureCount}
- Success Rate: ${((successCount / totalCount) * 100).toFixed(1)}%

Please review any failed payments and take appropriate action.

FarmKonnect Payroll System
    `;

    console.log(`Management summary: ${summaryContent}`);

    // TODO: Send to farm manager email
  } catch (error) {
    console.error(`Error sending management summary:`, error);
  }
}

/**
 * Create or update payroll schedule
 */
export async function createPayrollSchedule(
  farmId: number,
  scheduleType: "weekly" | "biweekly" | "monthly",
  paymentDay: number,
  paymentTime: string,
  notifyWorkers: boolean = true,
  notifyManagement: boolean = true
) {
  try {
    const db = await getDb();
    if (!db) {
      console.error("Database unavailable");
      return null;
    }

    // Check if schedule exists
    const existing = await db.query.raw(
      `SELECT id FROM payroll_schedules WHERE farmId = ?`,
      [farmId]
    );

    if (existing && existing.length > 0) {
      // Update existing
      await db.query.raw(
        `UPDATE payroll_schedules SET scheduleType = ?, paymentDay = ?, paymentTime = ?, notifyWorkers = ?, notifyManagement = ?, enabled = true WHERE farmId = ?`,
        [scheduleType, paymentDay, paymentTime, notifyWorkers ? 1 : 0, notifyManagement ? 1 : 0, farmId]
      );
    } else {
      // Create new
      await db.query.raw(
        `INSERT INTO payroll_schedules (farmId, scheduleType, paymentDay, paymentTime, notifyWorkers, notifyManagement, enabled)
         VALUES (?, ?, ?, ?, ?, ?, true)`,
        [farmId, scheduleType, paymentDay, paymentTime, notifyWorkers ? 1 : 0, notifyManagement ? 1 : 0]
      );
    }

    // Reinitialize scheduler
    await initializePayrollScheduler(farmId);

    return { success: true, farmId };
  } catch (error) {
    console.error(`Error creating payroll schedule:`, error);
    return null;
  }
}

/**
 * Get payroll schedule for a farm
 */
export async function getPayrollSchedule(farmId: number) {
  try {
    const db = await getDb();
    if (!db) {
      console.error("Database unavailable");
      return null;
    }

    const schedule = await db.query.raw(
      `SELECT * FROM payroll_schedules WHERE farmId = ?`,
      [farmId]
    );

    return schedule?.[0] || null;
  } catch (error) {
    console.error(`Error fetching payroll schedule:`, error);
    return null;
  }
}

/**
 * Disable payroll schedule
 */
export async function disablePayrollSchedule(farmId: number) {
  try {
    const db = await getDb();
    if (!db) {
      console.error("Database unavailable");
      return null;
    }

    await db.query.raw(
      `UPDATE payroll_schedules SET enabled = false WHERE farmId = ?`,
      [farmId]
    );

    // Stop cron job
    const job = payrollJobs.get(farmId);
    if (job) {
      job.job.stop();
      payrollJobs.delete(farmId);
    }

    return { success: true, farmId };
  } catch (error) {
    console.error(`Error disabling payroll schedule:`, error);
    return null;
  }
}

/**
 * Get next payroll run date
 */
export function getNextPayrollRunDate(farmId: number): Date | null {
  const job = payrollJobs.get(farmId);
  return job ? job.job.nextDate().toDate() : null;
}

/**
 * Manually trigger payroll processing
 */
export async function manuallyTriggerPayroll(farmId: number) {
  try {
    const schedule = await getPayrollSchedule(farmId);
    if (!schedule) {
      console.error(`No payroll schedule found for farm ${farmId}`);
      return null;
    }

    await processPayroll(farmId, schedule);
    return { success: true, farmId };
  } catch (error) {
    console.error(`Error manually triggering payroll:`, error);
    return null;
  }
}

/**
 * Initialize all active payroll schedules on startup
 */
export async function initializeAllPayrollSchedules() {
  try {
    const db = await getDb();
    if (!db) {
      console.error("Database unavailable");
      return;
    }

    const schedules = await db.query.raw(
      `SELECT DISTINCT farmId FROM payroll_schedules WHERE enabled = true`
    );

    if (!schedules) return;

    for (const schedule of schedules) {
      await initializePayrollScheduler(schedule.farmId);
    }

    console.log(`Initialized ${schedules.length} payroll schedules`);
  } catch (error) {
    console.error("Error initializing all payroll schedules:", error);
  }
}
