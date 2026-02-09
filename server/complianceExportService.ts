import { getDb } from "./db";

interface ComplianceReport {
  reportType: "ssnit" | "gra" | "payroll_summary" | "annual_tax";
  year: number;
  farmId: number;
  generatedDate: Date;
  fileName: string;
  data: any;
}

/**
 * Generate SSNIT Compliance Report for Ghana
 * SSNIT (Social Security and National Insurance Trust) contributions
 */
export async function generateSSNITReport(farmId: number, year: number) {
  try {
    const db = await getDb();
    if (!db) {
      console.error("Database unavailable");
      return null;
    }

    // Get all workers and their payroll data for the year
    const payrollData = await db.query.raw(
      `SELECT 
        w.id, w.name, w.workerId, w.email,
        SUM(pc.grossPay) as totalGrossPay,
        SUM(pc.ssnitEmployeeContribution) as employeeContribution,
        SUM(pc.ssnitEmployerContribution) as employerContribution,
        COUNT(pc.id) as payrollCount
      FROM workers w
      LEFT JOIN payroll_calculations pc ON w.id = pc.workerId
      WHERE w.farmId = ? AND YEAR(pc.paymentDate) = ?
      GROUP BY w.id, w.name, w.workerId, w.email`,
      [farmId, year]
    );

    if (!payrollData) {
      return null;
    }

    const report: ComplianceReport = {
      reportType: "ssnit",
      year,
      farmId,
      generatedDate: new Date(),
      fileName: `SSNIT_Report_${farmId}_${year}.csv`,
      data: {
        reportTitle: "SSNIT Contribution Report",
        reportYear: year,
        generatedDate: new Date().toISOString().split("T")[0],
        workers: payrollData,
        summary: {
          totalWorkers: payrollData.length,
          totalGrossPay: payrollData.reduce((sum: number, w: any) => sum + (w.totalGrossPay || 0), 0),
          totalEmployeeContribution: payrollData.reduce((sum: number, w: any) => sum + (w.employeeContribution || 0), 0),
          totalEmployerContribution: payrollData.reduce((sum: number, w: any) => sum + (w.employerContribution || 0), 0),
        },
      },
    };

    return report;
  } catch (error) {
    console.error("Error generating SSNIT report:", error);
    return null;
  }
}

/**
 * Generate GRA (Ghana Revenue Authority) Tax Report
 */
export async function generateGRATaxReport(farmId: number, year: number) {
  try {
    const db = await getDb();
    if (!db) {
      console.error("Database unavailable");
      return null;
    }

    // Get all workers and their tax data for the year
    const taxData = await db.query.raw(
      `SELECT 
        w.id, w.name, w.workerId, w.email,
        SUM(pc.grossPay) as totalGrossPay,
        SUM(pc.incomeTax) as totalIncomeTax,
        SUM(pc.netPay) as totalNetPay,
        COUNT(pc.id) as payrollCount
      FROM workers w
      LEFT JOIN payroll_calculations pc ON w.id = pc.workerId
      WHERE w.farmId = ? AND YEAR(pc.paymentDate) = ?
      GROUP BY w.id, w.name, w.workerId, w.email`,
      [farmId, year]
    );

    if (!taxData) {
      return null;
    }

    const report: ComplianceReport = {
      reportType: "gra",
      year,
      farmId,
      generatedDate: new Date(),
      fileName: `GRA_Tax_Report_${farmId}_${year}.csv`,
      data: {
        reportTitle: "Ghana Revenue Authority (GRA) Tax Report",
        reportYear: year,
        generatedDate: new Date().toISOString().split("T")[0],
        workers: taxData,
        summary: {
          totalWorkers: taxData.length,
          totalGrossPay: taxData.reduce((sum: number, w: any) => sum + (w.totalGrossPay || 0), 0),
          totalIncomeTax: taxData.reduce((sum: number, w: any) => sum + (w.totalIncomeTax || 0), 0),
          totalNetPay: taxData.reduce((sum: number, w: any) => sum + (w.totalNetPay || 0), 0),
          averageTaxRate: 0, // Will be calculated
        },
      },
    };

    // Calculate average tax rate
    const totalGrossPay = report.data.summary.totalGrossPay;
    const totalTax = report.data.summary.totalIncomeTax;
    report.data.summary.averageTaxRate = totalGrossPay > 0 ? ((totalTax / totalGrossPay) * 100).toFixed(2) : 0;

    return report;
  } catch (error) {
    console.error("Error generating GRA tax report:", error);
    return null;
  }
}

/**
 * Generate Annual Tax Certificate for Individual Worker
 */
export async function generateAnnualTaxCertificate(workerId: number, year: number) {
  try {
    const db = await getDb();
    if (!db) {
      console.error("Database unavailable");
      return null;
    }

    // Get worker details
    const worker = await db.query.raw(
      `SELECT * FROM workers WHERE id = ?`,
      [workerId]
    );

    if (!worker || worker.length === 0) {
      return null;
    }

    const workerData = worker[0];

    // Get payroll data for the year
    const payrollData = await db.query.raw(
      `SELECT 
        SUM(grossPay) as totalGrossPay,
        SUM(incomeTax) as totalIncomeTax,
        SUM(ssnitEmployeeContribution) as ssnitContribution,
        SUM(netPay) as totalNetPay,
        COUNT(id) as payrollCount
      FROM payroll_calculations
      WHERE workerId = ? AND YEAR(paymentDate) = ?`,
      [workerId, year]
    );

    const payroll = payrollData?.[0] || {};

    const certificate = {
      certificateType: "annual_tax_certificate",
      year,
      generatedDate: new Date().toISOString().split("T")[0],
      fileName: `Tax_Certificate_${workerId}_${year}.pdf`,
      data: {
        certificateTitle: "Annual Tax Certificate",
        certificateYear: year,
        worker: {
          name: workerData.name,
          workerId: workerData.workerId,
          email: workerData.email,
          phone: workerData.contact,
        },
        taxSummary: {
          totalGrossPay: payroll.totalGrossPay || 0,
          totalIncomeTax: payroll.totalIncomeTax || 0,
          ssnitContribution: payroll.ssnitContribution || 0,
          totalNetPay: payroll.totalNetPay || 0,
          payrollCycles: payroll.payrollCount || 0,
        },
        certificateStatement: `This is to certify that ${workerData.name} (ID: ${workerData.workerId}) earned a gross income of GHS ${(payroll.totalGrossPay || 0).toLocaleString()} during the year ${year}. Total income tax withheld was GHS ${(payroll.totalIncomeTax || 0).toLocaleString()}.`,
        issuedDate: new Date().toISOString().split("T")[0],
      },
    };

    return certificate;
  } catch (error) {
    console.error("Error generating annual tax certificate:", error);
    return null;
  }
}

/**
 * Generate Payroll Summary Report for Compliance
 */
export async function generatePayrollSummaryReport(farmId: number, year: number) {
  try {
    const db = await getDb();
    if (!db) {
      console.error("Database unavailable");
      return null;
    }

    // Get monthly payroll summary
    const monthlySummary = await db.query.raw(
      `SELECT 
        MONTH(pc.paymentDate) as month,
        COUNT(DISTINCT pc.workerId) as workerCount,
        SUM(pc.grossPay) as totalGrossPay,
        SUM(pc.incomeTax) as totalIncomeTax,
        SUM(pc.ssnitEmployeeContribution) as ssnitEmployee,
        SUM(pc.ssnitEmployerContribution) as ssnitEmployer,
        SUM(pc.netPay) as totalNetPay
      FROM payroll_calculations pc
      WHERE pc.farmId = ? AND YEAR(pc.paymentDate) = ?
      GROUP BY MONTH(pc.paymentDate)
      ORDER BY MONTH(pc.paymentDate)`,
      [farmId, year]
    );

    const report: ComplianceReport = {
      reportType: "payroll_summary",
      year,
      farmId,
      generatedDate: new Date(),
      fileName: `Payroll_Summary_${farmId}_${year}.csv`,
      data: {
        reportTitle: "Annual Payroll Summary Report",
        reportYear: year,
        generatedDate: new Date().toISOString().split("T")[0],
        monthlySummary: monthlySummary || [],
        annualSummary: {
          totalWorkers: 0,
          totalGrossPay: 0,
          totalIncomeTax: 0,
          totalSSNITEmployee: 0,
          totalSSNITEmployer: 0,
          totalNetPay: 0,
        },
      },
    };

    // Calculate annual totals
    if (monthlySummary && monthlySummary.length > 0) {
      report.data.annualSummary.totalWorkers = monthlySummary[0]?.workerCount || 0;
      report.data.annualSummary.totalGrossPay = monthlySummary.reduce((sum: number, m: any) => sum + (m.totalGrossPay || 0), 0);
      report.data.annualSummary.totalIncomeTax = monthlySummary.reduce((sum: number, m: any) => sum + (m.totalIncomeTax || 0), 0);
      report.data.annualSummary.totalSSNITEmployee = monthlySummary.reduce((sum: number, m: any) => sum + (m.ssnitEmployee || 0), 0);
      report.data.annualSummary.totalSSNITEmployer = monthlySummary.reduce((sum: number, m: any) => sum + (m.ssnitEmployer || 0), 0);
      report.data.annualSummary.totalNetPay = monthlySummary.reduce((sum: number, m: any) => sum + (m.totalNetPay || 0), 0);
    }

    return report;
  } catch (error) {
    console.error("Error generating payroll summary report:", error);
    return null;
  }
}

/**
 * Export report as CSV format
 */
export function exportReportAsCSV(report: ComplianceReport): string {
  let csv = "";

  // Add header information
  csv += `${report.data.reportTitle}\n`;
  csv += `Year: ${report.year}\n`;
  csv += `Generated: ${report.data.generatedDate}\n\n`;

  // Add worker data if available
  if (report.data.workers && report.data.workers.length > 0) {
    csv += "Worker ID,Name,Email,Gross Pay,Tax/Contribution,Net Pay\n";
    report.data.workers.forEach((worker: any) => {
      csv += `${worker.workerId},${worker.name},${worker.email},${worker.totalGrossPay || 0},${worker.totalIncomeTax || worker.employeeContribution || 0},${worker.totalNetPay || 0}\n`;
    });
  }

  // Add summary
  csv += "\nSummary\n";
  Object.entries(report.data.summary).forEach(([key, value]) => {
    csv += `${key},${value}\n`;
  });

  return csv;
}

/**
 * Export report as JSON format
 */
export function exportReportAsJSON(report: ComplianceReport): string {
  return JSON.stringify(report.data, null, 2);
}

/**
 * Save compliance report to database
 */
export async function saveComplianceReport(report: ComplianceReport) {
  try {
    const db = await getDb();
    if (!db) {
      console.error("Database unavailable");
      return null;
    }

    await db.query.raw(
      `INSERT INTO compliance_reports (farmId, reportType, year, reportData, fileName, generatedDate)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [report.farmId, report.reportType, report.year, JSON.stringify(report.data), report.fileName, report.generatedDate]
    );

    return { success: true, reportId: report.fileName };
  } catch (error) {
    console.error("Error saving compliance report:", error);
    return null;
  }
}

/**
 * Get all compliance reports for a farm
 */
export async function getComplianceReports(farmId: number) {
  try {
    const db = await getDb();
    if (!db) {
      console.error("Database unavailable");
      return null;
    }

    const reports = await db.query.raw(
      `SELECT id, reportType, year, fileName, generatedDate FROM compliance_reports 
       WHERE farmId = ? ORDER BY generatedDate DESC`,
      [farmId]
    );

    return reports || [];
  } catch (error) {
    console.error("Error fetching compliance reports:", error);
    return null;
  }
}
