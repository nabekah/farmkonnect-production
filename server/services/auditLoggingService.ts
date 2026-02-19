import { getDb } from "../db";
import { auditLogs } from "../../drizzle/schema";

export type AuditEventType =
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILED"
  | "LOGIN_RATE_LIMITED"
  | "LOGOUT"
  | "2FA_ENABLED"
  | "2FA_DISABLED"
  | "2FA_VERIFIED"
  | "2FA_FAILED"
  | "2FA_RATE_LIMITED"
  | "PASSWORD_CHANGED"
  | "PASSWORD_RESET_REQUESTED"
  | "PASSWORD_RESET_COMPLETED"
  | "SESSION_CREATED"
  | "SESSION_TERMINATED"
  | "SESSION_REMOTE_LOGOUT"
  | "SUSPICIOUS_ACTIVITY_DETECTED"
  | "ACCOUNT_LOCKED"
  | "ACCOUNT_UNLOCKED";

export interface AuditLogEntry {
  userId: number | null;
  eventType: AuditEventType;
  email?: string;
  ipAddress: string;
  userAgent?: string;
  deviceFingerprint?: string;
  status: "success" | "failure" | "warning";
  details?: Record<string, any>;
  severity: "low" | "medium" | "high" | "critical";
}

export class AuditLoggingService {
  /**
   * Log an authentication event
   */
  static async logEvent(entry: AuditLogEntry): Promise<void> {
    try {
      const db = getDb();

      await db.insert(auditLogs).values({
        userId: entry.userId,
        eventType: entry.eventType,
        email: entry.email,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
        deviceFingerprint: entry.deviceFingerprint,
        status: entry.status,
        details: entry.details ? JSON.stringify(entry.details) : null,
        severity: entry.severity,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error("Failed to log audit event:", error);
      // Don't throw - logging failures shouldn't break the application
    }
  }

  /**
   * Log successful login
   */
  static async logLoginSuccess(userId: number, email: string, ipAddress: string, userAgent?: string): Promise<void> {
    await this.logEvent({
      userId,
      eventType: "LOGIN_SUCCESS",
      email,
      ipAddress,
      userAgent,
      status: "success",
      severity: "low",
      details: {
        loginMethod: "credentials",
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Log failed login
   */
  static async logLoginFailed(email: string, ipAddress: string, reason: string, userAgent?: string): Promise<void> {
    await this.logEvent({
      userId: null,
      eventType: "LOGIN_FAILED",
      email,
      ipAddress,
      userAgent,
      status: "failure",
      severity: "medium",
      details: {
        reason,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Log rate limited login attempt
   */
  static async logLoginRateLimited(email: string, ipAddress: string, userAgent?: string): Promise<void> {
    await this.logEvent({
      userId: null,
      eventType: "LOGIN_RATE_LIMITED",
      email,
      ipAddress,
      userAgent,
      status: "warning",
      severity: "high",
      details: {
        reason: "Too many failed login attempts",
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Log logout
   */
  static async logLogout(userId: number, ipAddress: string, userAgent?: string): Promise<void> {
    await this.logEvent({
      userId,
      eventType: "LOGOUT",
      ipAddress,
      userAgent,
      status: "success",
      severity: "low",
      details: {
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Log 2FA enabled
   */
  static async log2FAEnabled(userId: number, method: "totp" | "sms", ipAddress: string, userAgent?: string): Promise<void> {
    await this.logEvent({
      userId,
      eventType: "2FA_ENABLED",
      ipAddress,
      userAgent,
      status: "success",
      severity: "medium",
      details: {
        method,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Log 2FA disabled
   */
  static async log2FADisabled(userId: number, ipAddress: string, userAgent?: string): Promise<void> {
    await this.logEvent({
      userId,
      eventType: "2FA_DISABLED",
      ipAddress,
      userAgent,
      status: "success",
      severity: "high",
      details: {
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Log successful 2FA verification
   */
  static async log2FAVerified(userId: number, ipAddress: string, userAgent?: string): Promise<void> {
    await this.logEvent({
      userId,
      eventType: "2FA_VERIFIED",
      ipAddress,
      userAgent,
      status: "success",
      severity: "low",
      details: {
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Log failed 2FA attempt
   */
  static async log2FAFailed(userId: number, ipAddress: string, reason: string, userAgent?: string): Promise<void> {
    await this.logEvent({
      userId,
      eventType: "2FA_FAILED",
      ipAddress,
      userAgent,
      status: "failure",
      severity: "medium",
      details: {
        reason,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Log rate limited 2FA attempt
   */
  static async log2FARateLimited(userId: number, ipAddress: string, userAgent?: string): Promise<void> {
    await this.logEvent({
      userId,
      eventType: "2FA_RATE_LIMITED",
      ipAddress,
      userAgent,
      status: "warning",
      severity: "critical",
      details: {
        reason: "Too many failed 2FA attempts",
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Log password changed
   */
  static async logPasswordChanged(userId: number, ipAddress: string, userAgent?: string): Promise<void> {
    await this.logEvent({
      userId,
      eventType: "PASSWORD_CHANGED",
      ipAddress,
      userAgent,
      status: "success",
      severity: "high",
      details: {
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Log password reset requested
   */
  static async logPasswordResetRequested(email: string, ipAddress: string, userAgent?: string): Promise<void> {
    await this.logEvent({
      userId: null,
      eventType: "PASSWORD_RESET_REQUESTED",
      email,
      ipAddress,
      userAgent,
      status: "success",
      severity: "medium",
      details: {
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Log password reset completed
   */
  static async logPasswordResetCompleted(userId: number, email: string, ipAddress: string, userAgent?: string): Promise<void> {
    await this.logEvent({
      userId,
      eventType: "PASSWORD_RESET_COMPLETED",
      email,
      ipAddress,
      userAgent,
      status: "success",
      severity: "high",
      details: {
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Log session created
   */
  static async logSessionCreated(userId: number, ipAddress: string, deviceName?: string, userAgent?: string): Promise<void> {
    await this.logEvent({
      userId,
      eventType: "SESSION_CREATED",
      ipAddress,
      userAgent,
      status: "success",
      severity: "low",
      details: {
        deviceName,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Log session terminated
   */
  static async logSessionTerminated(userId: number, ipAddress: string, reason: string, userAgent?: string): Promise<void> {
    await this.logEvent({
      userId,
      eventType: "SESSION_TERMINATED",
      ipAddress,
      userAgent,
      status: "success",
      severity: "low",
      details: {
        reason,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Log remote logout
   */
  static async logRemoteLogout(userId: number, targetSessionId: number, ipAddress: string, userAgent?: string): Promise<void> {
    await this.logEvent({
      userId,
      eventType: "SESSION_REMOTE_LOGOUT",
      ipAddress,
      userAgent,
      status: "success",
      severity: "medium",
      details: {
        targetSessionId,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Log suspicious activity
   */
  static async logSuspiciousActivity(userId: number, activityType: string, ipAddress: string, userAgent?: string): Promise<void> {
    await this.logEvent({
      userId,
      eventType: "SUSPICIOUS_ACTIVITY_DETECTED",
      ipAddress,
      userAgent,
      status: "warning",
      severity: "high",
      details: {
        activityType,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Log account locked
   */
  static async logAccountLocked(email: string, ipAddress: string, reason: string, userAgent?: string): Promise<void> {
    await this.logEvent({
      userId: null,
      eventType: "ACCOUNT_LOCKED",
      email,
      ipAddress,
      userAgent,
      status: "warning",
      severity: "critical",
      details: {
        reason,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Get audit logs for a user
   */
  static async getUserAuditLogs(userId: number, limit: number = 50, offset: number = 0): Promise<any[]> {
    const db = getDb();

    const logs = await db
      .select()
      .from(auditLogs)
      .where((logs) => logs.userId === userId)
      .orderBy((logs) => logs.timestamp)
      .limit(limit)
      .offset(offset);

    return logs.map((log) => ({
      ...log,
      details: log.details ? JSON.parse(log.details) : null,
    }));
  }

  /**
   * Get audit logs by event type
   */
  static async getLogsByEventType(eventType: AuditEventType, limit: number = 50, offset: number = 0): Promise<any[]> {
    const db = getDb();

    const logs = await db
      .select()
      .from(auditLogs)
      .where((logs) => logs.eventType === eventType)
      .orderBy((logs) => logs.timestamp)
      .limit(limit)
      .offset(offset);

    return logs.map((log) => ({
      ...log,
      details: log.details ? JSON.parse(log.details) : null,
    }));
  }

  /**
   * Get recent critical events
   */
  static async getRecentCriticalEvents(limit: number = 20): Promise<any[]> {
    const db = getDb();

    const logs = await db
      .select()
      .from(auditLogs)
      .where((logs) => logs.severity === "critical")
      .orderBy((logs) => logs.timestamp)
      .limit(limit);

    return logs.map((log) => ({
      ...log,
      details: log.details ? JSON.parse(log.details) : null,
    }));
  }

  /**
   * Get audit logs by IP address
   */
  static async getLogsByIPAddress(ipAddress: string, limit: number = 50, offset: number = 0): Promise<any[]> {
    const db = getDb();

    const logs = await db
      .select()
      .from(auditLogs)
      .where((logs) => logs.ipAddress === ipAddress)
      .orderBy((logs) => logs.timestamp)
      .limit(limit)
      .offset(offset);

    return logs.map((log) => ({
      ...log,
      details: log.details ? JSON.parse(log.details) : null,
    }));
  }

  /**
   * Clean up old audit logs (older than 90 days)
   */
  static async cleanupOldLogs(): Promise<void> {
    try {
      const db = getDb();
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

      // Note: This requires a proper delete implementation in your Drizzle setup
      // For now, just log the intention
      console.log(`Audit log cleanup: Would delete logs older than ${ninetyDaysAgo.toISOString()}`);
    } catch (error) {
      console.error("Failed to cleanup audit logs:", error);
    }
  }
}
