/**
 * CSV Export Utility
 * Provides functions to generate CSV files for various data types
 */

interface CSVOptions {
  filename: string;
  headers: string[];
  rows: any[][];
}

/**
 * Generate CSV content from data
 */
export function generateCSV(options: CSVOptions): string {
  const { headers, rows } = options;

  // Escape CSV values
  const escapeCSVValue = (value: any): string => {
    if (value === null || value === undefined) return "";
    const stringValue = String(value);
    if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  // Create header row
  const headerRow = headers.map(escapeCSVValue).join(",");

  // Create data rows
  const dataRows = rows.map(row =>
    row.map(escapeCSVValue).join(",")
  ).join("\n");

  return `${headerRow}\n${dataRows}`;
}

/**
 * Generate audit logs CSV
 */
export function generateAuditLogsCSV(auditLogs: any[]): string {
  const headers = [
    "ID",
    "Admin ID",
    "User ID",
    "Action",
    "Reason",
    "Bulk Operation ID",
    "Created At"
  ];

  const rows = auditLogs.map(log => [
    log.id,
    log.adminId,
    log.userId,
    log.action,
    log.reason || "",
    log.bulkOperationId || "",
    new Date(log.createdAt).toLocaleString()
  ]);

  return generateCSV({
    filename: "audit-logs.csv",
    headers,
    rows
  });
}

/**
 * Generate user approvals CSV
 */
export function generateUserApprovalsCSV(users: any[]): string {
  const headers = [
    "ID",
    "Name",
    "Email",
    "Phone",
    "Role",
    "Login Method",
    "Approval Status",
    "Account Status",
    "Email Verified",
    "Created At"
  ];

  const rows = users.map(user => [
    user.id,
    user.name,
    user.email,
    user.phone || "",
    user.role,
    user.loginMethod,
    user.approvalStatus,
    user.accountStatus,
    user.emailVerified ? "Yes" : "No",
    new Date(user.createdAt).toLocaleString()
  ]);

  return generateCSV({
    filename: "user-approvals.csv",
    headers,
    rows
  });
}

/**
 * Create a downloadable blob from CSV content
 */
export function createCSVBlob(csvContent: string): Blob {
  return new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
}

/**
 * Download CSV file
 */
export function downloadCSV(csvContent: string, filename: string): void {
  const blob = createCSVBlob(csvContent);
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up
  URL.revokeObjectURL(url);
}

/**
 * Generate timestamp for filename
 */
export function getTimestampForFilename(): string {
  const now = new Date();
  return now.toISOString().replace(/[:.]/g, "-").split("T")[0];
}
