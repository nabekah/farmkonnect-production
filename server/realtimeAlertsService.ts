import { EventEmitter } from "events";

export interface AlertMessage {
  id: string;
  type: "turnover_risk" | "salary_anomaly" | "attendance_alert" | "performance_alert" | "system_alert";
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  message: string;
  workerId?: number;
  workerName?: string;
  farmId: number;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}

export interface AlertSubscriber {
  farmId: number;
  userId: number;
  callback: (alert: AlertMessage) => void;
}

/**
 * Real-time Alerts Service using EventEmitter
 * In production, this would use WebSocket or Socket.io
 */
class RealtimeAlertsService extends EventEmitter {
  private subscribers: Map<string, AlertSubscriber[]> = new Map();
  private alertHistory: Map<number, AlertMessage[]> = new Map();
  private maxHistorySize = 100;

  /**
   * Subscribe to alerts for a specific farm
   */
  subscribe(farmId: number, userId: number, callback: (alert: AlertMessage) => void): () => void {
    const key = `${farmId}:${userId}`;

    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, []);
    }

    const subscriber: AlertSubscriber = { farmId, userId, callback };
    this.subscribers.get(key)!.push(subscriber);

    // Return unsubscribe function
    return () => {
      const subs = this.subscribers.get(key);
      if (subs) {
        const index = subs.indexOf(subscriber);
        if (index > -1) {
          subs.splice(index, 1);
        }
      }
    };
  }

  /**
   * Broadcast alert to all subscribers of a farm
   */
  broadcastAlert(alert: AlertMessage): void {
    // Store in history
    if (!this.alertHistory.has(alert.farmId)) {
      this.alertHistory.set(alert.farmId, []);
    }

    const history = this.alertHistory.get(alert.farmId)!;
    history.unshift(alert);

    // Keep only last 100 alerts
    if (history.length > this.maxHistorySize) {
      history.pop();
    }

    // Notify all subscribers of this farm
    for (const [key, subscribers] of this.subscribers) {
      const [farmId] = key.split(":").map(Number);
      if (farmId === alert.farmId) {
        subscribers.forEach((sub) => {
          try {
            sub.callback(alert);
          } catch (error) {
            console.error("Error notifying subscriber:", error);
          }
        });
      }
    }

    // Emit event for logging/monitoring
    this.emit("alert", alert);
  }

  /**
   * Get alert history for a farm
   */
  getAlertHistory(farmId: number, limit: number = 50): AlertMessage[] {
    const history = this.alertHistory.get(farmId) || [];
    return history.slice(0, limit);
  }

  /**
   * Mark alert as read
   */
  markAsRead(alertId: string, farmId: number): void {
    const history = this.alertHistory.get(farmId);
    if (history) {
      const alert = history.find((a) => a.id === alertId);
      if (alert) {
        alert.read = true;
      }
    }
  }

  /**
   * Clear all alerts for a farm
   */
  clearAlerts(farmId: number): void {
    this.alertHistory.delete(farmId);
  }
}

// Singleton instance
const alertsService = new RealtimeAlertsService();

/**
 * Create a turnover risk alert
 */
export function createTurnoverRiskAlert(
  farmId: number,
  workerId: number,
  workerName: string,
  riskScore: number,
  riskLevel: string
): AlertMessage {
  const severity = riskLevel === "critical" ? "critical" : riskLevel === "high" ? "high" : "medium";

  return {
    id: `turnover_${workerId}_${Date.now()}`,
    type: "turnover_risk",
    severity,
    title: `High Turnover Risk: ${workerName}`,
    message: `${workerName} has a ${riskScore}% turnover risk. Immediate intervention recommended.`,
    workerId,
    workerName,
    farmId,
    timestamp: new Date(),
    read: false,
    actionUrl: `/workforce-analytics?tab=turnover&workerId=${workerId}`,
  };
}

/**
 * Create a salary anomaly alert
 */
export function createSalaryAnomalyAlert(
  farmId: number,
  role: string,
  farmAverage: number,
  industryAverage: number
): AlertMessage {
  const percentile = (farmAverage / industryAverage) * 100;
  const isUnderPaid = percentile < 85;

  return {
    id: `salary_${role}_${Date.now()}`,
    type: "salary_anomaly",
    severity: isUnderPaid ? "high" : "medium",
    title: `Salary Alert: ${role}`,
    message: isUnderPaid
      ? `${role} salaries are ${percentile.toFixed(0)}% of industry average. Consider salary adjustments.`
      : `${role} salaries are above industry average (${percentile.toFixed(0)}%).`,
    farmId,
    timestamp: new Date(),
    read: false,
    actionUrl: `/workforce-analytics?tab=salary`,
  };
}

/**
 * Create an attendance alert
 */
export function createAttendanceAlert(
  farmId: number,
  workerId: number,
  workerName: string,
  attendanceRate: number
): AlertMessage {
  return {
    id: `attendance_${workerId}_${Date.now()}`,
    type: "attendance_alert",
    severity: attendanceRate < 75 ? "high" : "medium",
    title: `Attendance Alert: ${workerName}`,
    message: `${workerName}'s attendance rate is ${attendanceRate.toFixed(0)}%. Below target of 90%.`,
    workerId,
    workerName,
    farmId,
    timestamp: new Date(),
    read: false,
    actionUrl: `/attendance-kiosk`,
  };
}

/**
 * Create a performance alert
 */
export function createPerformanceAlert(
  farmId: number,
  workerId: number,
  workerName: string,
  performanceScore: number,
  trend: string
): AlertMessage {
  return {
    id: `performance_${workerId}_${Date.now()}`,
    type: "performance_alert",
    severity: trend === "declining" ? "high" : "medium",
    title: `Performance Alert: ${workerName}`,
    message:
      trend === "declining"
        ? `${workerName}'s performance is declining. Score: ${performanceScore.toFixed(0)}%. Intervention needed.`
        : `${workerName}'s performance is improving. Score: ${performanceScore.toFixed(0)}%.`,
    workerId,
    workerName,
    farmId,
    timestamp: new Date(),
    read: false,
    actionUrl: `/workforce-analytics?tab=productivity`,
  };
}

/**
 * Create a system alert
 */
export function createSystemAlert(
  farmId: number,
  title: string,
  message: string,
  severity: "critical" | "high" | "medium" | "low" = "medium"
): AlertMessage {
  return {
    id: `system_${Date.now()}`,
    type: "system_alert",
    severity,
    title,
    message,
    farmId,
    timestamp: new Date(),
    read: false,
  };
}

/**
 * Get the alerts service instance
 */
export function getAlertsService() {
  return alertsService;
}

/**
 * Trigger a turnover risk alert
 */
export function triggerTurnoverRiskAlert(
  farmId: number,
  workerId: number,
  workerName: string,
  riskScore: number,
  riskLevel: string
): void {
  const alert = createTurnoverRiskAlert(farmId, workerId, workerName, riskScore, riskLevel);
  alertsService.broadcastAlert(alert);
}

/**
 * Trigger a salary anomaly alert
 */
export function triggerSalaryAnomalyAlert(
  farmId: number,
  role: string,
  farmAverage: number,
  industryAverage: number
): void {
  const alert = createSalaryAnomalyAlert(farmId, role, farmAverage, industryAverage);
  alertsService.broadcastAlert(alert);
}

/**
 * Trigger an attendance alert
 */
export function triggerAttendanceAlert(
  farmId: number,
  workerId: number,
  workerName: string,
  attendanceRate: number
): void {
  const alert = createAttendanceAlert(farmId, workerId, workerName, attendanceRate);
  alertsService.broadcastAlert(alert);
}

/**
 * Trigger a performance alert
 */
export function triggerPerformanceAlert(
  farmId: number,
  workerId: number,
  workerName: string,
  performanceScore: number,
  trend: string
): void {
  const alert = createPerformanceAlert(farmId, workerId, workerName, performanceScore, trend);
  alertsService.broadcastAlert(alert);
}

/**
 * Trigger a system alert
 */
export function triggerSystemAlert(
  farmId: number,
  title: string,
  message: string,
  severity?: "critical" | "high" | "medium" | "low"
): void {
  const alert = createSystemAlert(farmId, title, message, severity);
  alertsService.broadcastAlert(alert);
}
