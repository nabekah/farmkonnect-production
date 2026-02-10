import { notifyOwner } from "../_core/notification";
import { generatePDFReport, generateCSVReport, generateExcelReport, ExportOptions, FinancialReportData } from "./financialExportService";
import { sendEmail } from "./emailSmsService";

export interface ScheduledReport {
  id: string;
  farmId: number;
  userId: number;
  reportType: "financial" | "inventory" | "livestock" | "health";
  frequency: "weekly" | "biweekly" | "monthly" | "quarterly";
  format: "pdf" | "csv" | "excel";
  recipients: string[];
  sections?: any;
  enabled: boolean;
  nextRunDate: Date;
  lastRunDate?: Date;
  createdAt: Date;
}

export interface ReportScheduleConfig {
  farmId: number;
  userId: number;
  reportType: "financial" | "inventory" | "livestock" | "health";
  frequency: "weekly" | "biweekly" | "monthly" | "quarterly";
  format: "pdf" | "csv" | "excel";
  recipients: string[];
  sections?: any;
}

/**
 * Calculate next run date based on frequency
 */
export function calculateNextRunDate(frequency: string, lastRun?: Date): Date {
  const now = lastRun || new Date();
  const next = new Date(now);

  switch (frequency) {
    case "weekly":
      next.setDate(next.getDate() + 7);
      break;
    case "biweekly":
      next.setDate(next.getDate() + 14);
      break;
    case "monthly":
      next.setMonth(next.getMonth() + 1);
      break;
    case "quarterly":
      next.setMonth(next.getMonth() + 3);
      break;
    default:
      next.setDate(next.getDate() + 7);
  }

  return next;
}

/**
 * Create a scheduled report
 */
export function createScheduledReport(config: ReportScheduleConfig): ScheduledReport {
  return {
    id: `report_${Date.now()}`,
    farmId: config.farmId,
    userId: config.userId,
    reportType: config.reportType,
    frequency: config.frequency,
    format: config.format,
    recipients: config.recipients,
    sections: config.sections,
    enabled: true,
    nextRunDate: calculateNextRunDate(config.frequency),
    createdAt: new Date(),
  };
}

/**
 * Generate and send scheduled financial report
 */
export async function generateAndSendFinancialReport(
  farmId: number,
  userId: number,
  recipients: string[],
  format: "pdf" | "csv" | "excel",
  sections?: any
): Promise<boolean> {
  try {
    // Mock financial report data
    const reportData: FinancialReportData = {
      farmName: `Farm ${farmId}`,
      reportDate: new Date().toLocaleDateString(),
      totalIncome: 150000,
      totalExpenses: 85000,
      netProfit: 65000,
      profitMargin: 43.3,
      expenses: [
        { description: "Fertilizer", category: "Inputs", amount: 15000, date: new Date().toISOString() },
        { description: "Labor", category: "Labor", amount: 25000, date: new Date().toISOString() },
        { description: "Equipment Maintenance", category: "Equipment", amount: 20000, date: new Date().toISOString() },
        { description: "Utilities", category: "Utilities", amount: 10000, date: new Date().toISOString() },
        { description: "Veterinary Care", category: "Veterinary", amount: 15000, date: new Date().toISOString() },
      ],
      revenue: [
        { product: "Maize", quantity: 500, unitPrice: 200, totalAmount: 100000, date: new Date().toISOString() },
        { product: "Tomatoes", quantity: 300, unitPrice: 167, totalAmount: 50000, date: new Date().toISOString() },
      ],
      budgetData: [
        { category: "Inputs", budgeted: 20000, actual: 15000, variance: 5000 },
        { category: "Labor", budgeted: 30000, actual: 25000, variance: 5000 },
        { category: "Equipment", budgeted: 25000, actual: 20000, variance: 5000 },
      ],
      veterinaryExpenses: [
        { animal: "Cattle", treatment: "Vaccination", cost: 5000, date: new Date().toISOString() },
        { animal: "Poultry", treatment: "Deworming", cost: 3000, date: new Date().toISOString() },
      ],
      insuranceClaims: [
        { type: "Crop Insurance", amount: 10000, status: "Approved", date: new Date().toISOString() },
      ],
    };

    const exportOptions: ExportOptions = {
      farmId,
      format,
      sections: sections || {
        incomeExpenses: true,
        budgetAnalysis: true,
        veterinaryCosts: true,
        insuranceClaims: true,
      },
    };

    let fileBuffer: Buffer;
    let filename: string;
    let mimeType: string;

    // Generate report in requested format
    switch (format) {
      case "pdf":
        fileBuffer = await generatePDFReport(reportData, exportOptions);
        filename = `financial-report-${farmId}-${Date.now()}.pdf`;
        mimeType = "application/pdf";
        break;
      case "csv":
        const csvContent = await generateCSVReport(reportData, exportOptions);
        fileBuffer = Buffer.from(csvContent);
        filename = `financial-report-${farmId}-${Date.now()}.csv`;
        mimeType = "text/csv";
        break;
      case "excel":
        fileBuffer = await generateExcelReport(reportData, exportOptions);
        filename = `financial-report-${farmId}-${Date.now()}.xlsx`;
        mimeType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        break;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }

    // Send email to recipients
    for (const recipient of recipients) {
      await sendEmail({
        to: recipient,
        subject: `Financial Report - Farm ${farmId} - ${new Date().toLocaleDateString()}`,
        html: `
          <h2>Financial Report</h2>
          <p>Dear Farmer,</p>
          <p>Please find attached your scheduled financial report for Farm ${farmId}.</p>
          <h3>Summary</h3>
          <ul>
            <li>Total Income: ₵${reportData.totalIncome.toLocaleString()}</li>
            <li>Total Expenses: ₵${reportData.totalExpenses.toLocaleString()}</li>
            <li>Net Profit: ₵${reportData.netProfit.toLocaleString()}</li>
            <li>Profit Margin: ${reportData.profitMargin}%</li>
          </ul>
          <p>Best regards,<br/>FarmKonnect Team</p>
        `,
        attachments: [
          {
            filename,
            content: fileBuffer,
            contentType: mimeType,
          },
        ],
      });
    }

    // Notify owner
    await notifyOwner({
      title: "Scheduled Report Sent",
      content: `Financial report for Farm ${farmId} has been generated and sent to ${recipients.length} recipient(s)`,
    });

    return true;
  } catch (error) {
    console.error("Error generating scheduled report:", error);
    return false;
  }
}

/**
 * Get all scheduled reports for a user
 */
export function getScheduledReports(userId: number): ScheduledReport[] {
  // Mock data - in production, fetch from database
  return [
    {
      id: "report_1",
      farmId: 1,
      userId,
      reportType: "financial",
      frequency: "monthly",
      format: "pdf",
      recipients: ["farmer@example.com"],
      enabled: true,
      nextRunDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      lastRunDate: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    },
  ];
}

/**
 * Update scheduled report
 */
export function updateScheduledReport(
  reportId: string,
  updates: Partial<ScheduledReport>
): ScheduledReport {
  // In production, update in database
  return {
    id: reportId,
    farmId: updates.farmId || 0,
    userId: updates.userId || 0,
    reportType: updates.reportType || "financial",
    frequency: updates.frequency || "monthly",
    format: updates.format || "pdf",
    recipients: updates.recipients || [],
    sections: updates.sections,
    enabled: updates.enabled !== undefined ? updates.enabled : true,
    nextRunDate: updates.nextRunDate || new Date(),
    lastRunDate: updates.lastRunDate,
    createdAt: updates.createdAt || new Date(),
  };
}

/**
 * Delete scheduled report
 */
export function deleteScheduledReport(reportId: string): boolean {
  // In production, delete from database
  return true;
}

/**
 * Check and execute due scheduled reports
 */
export async function checkAndExecuteScheduledReports(): Promise<void> {
  try {
    // In production, fetch all due reports from database
    const now = new Date();
    const dueReports: ScheduledReport[] = [];

    for (const report of dueReports) {
      if (report.enabled && report.nextRunDate <= now) {
        // Generate and send report
        const success = await generateAndSendFinancialReport(
          report.farmId,
          report.userId,
          report.recipients,
          report.format,
          report.sections
        );

        if (success) {
          // Update last run date and next run date
          updateScheduledReport(report.id, {
            lastRunDate: now,
            nextRunDate: calculateNextRunDate(report.frequency, now),
          });
        }
      }
    }
  } catch (error) {
    console.error("Error executing scheduled reports:", error);
  }
}

/**
 * Format report frequency for display
 */
export function formatFrequency(frequency: string): string {
  const map: Record<string, string> = {
    weekly: "Every Week",
    biweekly: "Every 2 Weeks",
    monthly: "Every Month",
    quarterly: "Every 3 Months",
  };
  return map[frequency] || frequency;
}

/**
 * Get report type display name
 */
export function getReportTypeName(type: string): string {
  const map: Record<string, string> = {
    financial: "Financial Report",
    inventory: "Inventory Report",
    livestock: "Livestock Report",
    health: "Health Report",
  };
  return map[type] || type;
}
