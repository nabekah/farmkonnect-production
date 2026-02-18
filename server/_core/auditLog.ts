import crypto from "crypto";

/**
 * Audit Log Entry
 */
export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  changes?: Record<string, { before: any; after: any }>;
  ipAddress: string;
  userAgent: string;
  status: "success" | "failure";
  errorMessage?: string;
  metadata?: Record<string, any>;
  hash: string;
  previousHash: string;
}

/**
 * Audit Log Service
 * Maintains immutable audit trail for compliance and forensics
 */
class AuditLogService {
  private logs: AuditLogEntry[] = [];
  private lastHash: string = this.calculateHash("");

  /**
   * Log an audit event
   * @param entry - Audit log entry data
   * @returns Created audit log entry
   */
  log(entry: Omit<AuditLogEntry, "id" | "hash" | "previousHash">): AuditLogEntry {
    const id = this.generateId();
    const timestamp = new Date();
    const previousHash = this.lastHash;

    const auditEntry: AuditLogEntry = {
      ...entry,
      id,
      timestamp,
      previousHash,
      hash: "", // Will be calculated below
    };

    // Calculate hash for immutability
    auditEntry.hash = this.calculateEntryHash(auditEntry);
    this.lastHash = auditEntry.hash;

    // Store in memory (in production, use database)
    this.logs.push(auditEntry);

    return auditEntry;
  }

  /**
   * Log a login event
   * @param userId - User ID
   * @param ipAddress - IP address
   * @param userAgent - User agent
   * @param success - Whether login was successful
   * @param errorMessage - Error message if failed
   * @returns Audit log entry
   */
  logLogin(userId: string, ipAddress: string, userAgent: string, success: boolean, errorMessage?: string) {
    return this.log({
      userId,
      action: "LOGIN",
      resourceType: "AUTH",
      resourceId: userId,
      ipAddress,
      userAgent,
      status: success ? "success" : "failure",
      errorMessage,
      metadata: {
        authMethod: "password",
      },
    });
  }

  /**
   * Log a failed login attempt
   * @param identifier - Email or username
   * @param ipAddress - IP address
   * @param userAgent - User agent
   * @param reason - Reason for failure
   * @returns Audit log entry
   */
  logFailedLoginAttempt(identifier: string, ipAddress: string, userAgent: string, reason: string) {
    return this.log({
      userId: "UNKNOWN",
      action: "LOGIN_FAILED",
      resourceType: "AUTH",
      resourceId: identifier,
      ipAddress,
      userAgent,
      status: "failure",
      errorMessage: reason,
      metadata: {
        identifier,
      },
    });
  }

  /**
   * Log a 2FA event
   * @param userId - User ID
   * @param method - 2FA method (TOTP, SMS, etc.)
   * @param success - Whether 2FA was successful
   * @param ipAddress - IP address
   * @param userAgent - User agent
   * @returns Audit log entry
   */
  log2FaEvent(userId: string, method: string, success: boolean, ipAddress: string, userAgent: string) {
    return this.log({
      userId,
      action: success ? "2FA_SUCCESS" : "2FA_FAILED",
      resourceType: "AUTH",
      resourceId: userId,
      ipAddress,
      userAgent,
      status: success ? "success" : "failure",
      metadata: {
        method,
      },
    });
  }

  /**
   * Log a device trust event
   * @param userId - User ID
   * @param action - Action (TRUST, UNTRUST, REMOVE)
   * @param deviceId - Device ID
   * @param ipAddress - IP address
   * @param userAgent - User agent
   * @returns Audit log entry
   */
  logDeviceTrustEvent(userId: string, action: string, deviceId: string, ipAddress: string, userAgent: string) {
    return this.log({
      userId,
      action: `DEVICE_${action}`,
      resourceType: "DEVICE",
      resourceId: deviceId,
      ipAddress,
      userAgent,
      status: "success",
      metadata: {
        action,
      },
    });
  }

  /**
   * Log an account change event
   * @param userId - User ID
   * @param action - Action (PASSWORD_CHANGE, EMAIL_CHANGE, etc.)
   * @param changes - Changes made
   * @param ipAddress - IP address
   * @param userAgent - User agent
   * @returns Audit log entry
   */
  logAccountChange(
    userId: string,
    action: string,
    changes: Record<string, { before: any; after: any }>,
    ipAddress: string,
    userAgent: string
  ) {
    return this.log({
      userId,
      action,
      resourceType: "ACCOUNT",
      resourceId: userId,
      changes,
      ipAddress,
      userAgent,
      status: "success",
    });
  }

  /**
   * Log a security alert event
   * @param userId - User ID
   * @param alertType - Type of alert
   * @param details - Alert details
   * @param ipAddress - IP address
   * @param userAgent - User agent
   * @returns Audit log entry
   */
  logSecurityAlert(userId: string, alertType: string, details: string, ipAddress: string, userAgent: string) {
    return this.log({
      userId,
      action: "SECURITY_ALERT",
      resourceType: "SECURITY",
      resourceId: userId,
      ipAddress,
      userAgent,
      status: "success",
      metadata: {
        alertType,
        details,
      },
    });
  }

  /**
   * Get audit logs for a user
   * @param userId - User ID
   * @param limit - Maximum number of logs to return
   * @param offset - Offset for pagination
   * @returns Array of audit logs
   */
  getUserLogs(userId: string, limit: number = 100, offset: number = 0): AuditLogEntry[] {
    return this.logs.filter((log) => log.userId === userId).slice(offset, offset + limit);
  }

  /**
   * Get audit logs by action
   * @param action - Action to filter by
   * @param limit - Maximum number of logs to return
   * @returns Array of audit logs
   */
  getLogsByAction(action: string, limit: number = 100): AuditLogEntry[] {
    return this.logs.filter((log) => log.action === action).slice(0, limit);
  }

  /**
   * Get audit logs by IP address
   * @param ipAddress - IP address to filter by
   * @param limit - Maximum number of logs to return
   * @returns Array of audit logs
   */
  getLogsByIpAddress(ipAddress: string, limit: number = 100): AuditLogEntry[] {
    return this.logs.filter((log) => log.ipAddress === ipAddress).slice(0, limit);
  }

  /**
   * Verify audit log integrity
   * @param entry - Audit log entry to verify
   * @returns True if entry is valid, false otherwise
   */
  verifyIntegrity(entry: AuditLogEntry): boolean {
    const calculatedHash = this.calculateEntryHash(entry);
    return calculatedHash === entry.hash;
  }

  /**
   * Verify entire audit chain
   * @returns True if entire chain is valid, false otherwise
   */
  verifyChain(): boolean {
    let previousHash = this.calculateHash("");

    for (const entry of this.logs) {
      // Check if previous hash matches
      if (entry.previousHash !== previousHash) {
        return false;
      }

      // Check if entry hash is valid
      if (!this.verifyIntegrity(entry)) {
        return false;
      }

      previousHash = entry.hash;
    }

    return true;
  }

  /**
   * Get audit log statistics
   * @returns Statistics object
   */
  getStatistics() {
    const loginSuccesses = this.logs.filter((l) => l.action === "LOGIN" && l.status === "success").length;
    const loginFailures = this.logs.filter((l) => l.action === "LOGIN_FAILED").length;
    const securityAlerts = this.logs.filter((l) => l.action === "SECURITY_ALERT").length;
    const accountChanges = this.logs.filter((l) => l.resourceType === "ACCOUNT").length;

    return {
      totalEntries: this.logs.length,
      loginSuccesses,
      loginFailures,
      securityAlerts,
      accountChanges,
      chainValid: this.verifyChain(),
    };
  }

  /**
   * Export audit logs as JSON
   * @returns JSON string
   */
  exportAsJson(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Export audit logs as CSV
   * @returns CSV string
   */
  exportAsCsv(): string {
    const headers = [
      "ID",
      "Timestamp",
      "User ID",
      "Action",
      "Resource Type",
      "Resource ID",
      "IP Address",
      "Status",
      "Error Message",
    ];

    const rows = this.logs.map((log) => [
      log.id,
      log.timestamp.toISOString(),
      log.userId,
      log.action,
      log.resourceType,
      log.resourceId,
      log.ipAddress,
      log.status,
      log.errorMessage || "",
    ]);

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");

    return csv;
  }

  /**
   * Calculate hash for an entry
   * @param entry - Audit log entry
   * @returns SHA-256 hash
   */
  private calculateEntryHash(entry: Omit<AuditLogEntry, "hash">): string {
    const data = JSON.stringify({
      id: entry.id,
      timestamp: entry.timestamp,
      userId: entry.userId,
      action: entry.action,
      resourceType: entry.resourceType,
      resourceId: entry.resourceId,
      ipAddress: entry.ipAddress,
      status: entry.status,
      previousHash: entry.previousHash,
    });

    return crypto.createHash("sha256").update(data).digest("hex");
  }

  /**
   * Calculate hash for a string
   * @param data - Data to hash
   * @returns SHA-256 hash
   */
  private calculateHash(data: string): string {
    return crypto.createHash("sha256").update(data).digest("hex");
  }

  /**
   * Generate unique ID
   * @returns Unique ID
   */
  private generateId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const auditLog = new AuditLogService();
