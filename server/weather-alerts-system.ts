import { EventEmitter } from 'events';

export interface WeatherAlert {
  id: string;
  farmId: string;
  type: 'frost' | 'drought' | 'flood' | 'hail' | 'extreme_heat' | 'extreme_cold' | 'high_winds' | 'disease_risk';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  affectedArea: string;
  startTime: Date;
  endTime?: Date;
  recommendedActions: string[];
  createdAt: Date;
  resolvedAt?: Date;
  status: 'active' | 'resolved' | 'expired';
}

export interface AlertSubscription {
  userId: string;
  alertTypes: string[];
  channels: ('push' | 'email' | 'sms')[];
  minSeverity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
}

export interface AlertHistory {
  alertId: string;
  userId: string;
  channel: 'push' | 'email' | 'sms';
  sentAt: Date;
  status: 'sent' | 'failed' | 'read';
}

export class WeatherAlertsSystem extends EventEmitter {
  private alerts: Map<string, WeatherAlert> = new Map();
  private subscriptions: Map<string, AlertSubscription> = new Map();
  private alertHistory: AlertHistory[] = [];
  private alertCounter = 0;

  /**
   * Create a new weather alert
   */
  createAlert(farmId: string, alert: Omit<WeatherAlert, 'id' | 'createdAt' | 'status'>): WeatherAlert {
    const id = `alert_${++this.alertCounter}`;
    const newAlert: WeatherAlert = {
      ...alert,
      id,
      farmId,
      createdAt: new Date(),
      status: 'active'
    };
    this.alerts.set(id, newAlert);
    this.emit('alert_created', newAlert);
    return newAlert;
  }

  /**
   * Get active alerts for a farm
   */
  getActiveAlerts(farmId: string): WeatherAlert[] {
    return Array.from(this.alerts.values()).filter(
      alert => alert.farmId === farmId && alert.status === 'active'
    );
  }

  /**
   * Get all alerts for a farm with filtering
   */
  getAlerts(farmId: string, filters?: { type?: string; severity?: string; status?: string }): WeatherAlert[] {
    let result = Array.from(this.alerts.values()).filter(a => a.farmId === farmId);
    
    if (filters?.type) result = result.filter(a => a.type === filters.type);
    if (filters?.severity) result = result.filter(a => a.severity === filters.severity);
    if (filters?.status) result = result.filter(a => a.status === filters.status);
    
    return result;
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): WeatherAlert | null {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.status = 'resolved';
      alert.resolvedAt = new Date();
      this.emit('alert_resolved', alert);
    }
    return alert || null;
  }

  /**
   * Subscribe user to weather alerts
   */
  subscribeToAlerts(userId: string, subscription: Omit<AlertSubscription, 'userId'>): AlertSubscription {
    const sub: AlertSubscription = { ...subscription, userId };
    this.subscriptions.set(userId, sub);
    this.emit('subscription_created', sub);
    return sub;
  }

  /**
   * Update alert subscription
   */
  updateSubscription(userId: string, updates: Partial<AlertSubscription>): AlertSubscription | null {
    const sub = this.subscriptions.get(userId);
    if (sub) {
      Object.assign(sub, updates);
      this.emit('subscription_updated', sub);
    }
    return sub || null;
  }

  /**
   * Get user subscription
   */
  getSubscription(userId: string): AlertSubscription | null {
    return this.subscriptions.get(userId) || null;
  }

  /**
   * Send alert to subscribed users
   */
  sendAlert(alert: WeatherAlert, userIds: string[]): { sent: number; failed: number } {
    let sent = 0;
    let failed = 0;

    userIds.forEach(userId => {
      const sub = this.subscriptions.get(userId);
      if (!sub || !sub.enabled) return;

      // Check if user is subscribed to this alert type
      if (!sub.alertTypes.includes(alert.type)) return;

      // Check severity threshold
      const severityLevels = { low: 0, medium: 1, high: 2, critical: 3 };
      if (severityLevels[alert.severity] < severityLevels[sub.minSeverity]) return;

      // Send through subscribed channels
      sub.channels.forEach(channel => {
        try {
          this.recordAlertDelivery(alert.id, userId, channel, 'sent');
          sent++;
          this.emit('alert_sent', { alertId: alert.id, userId, channel });
        } catch (error) {
          this.recordAlertDelivery(alert.id, userId, channel, 'failed');
          failed++;
          this.emit('alert_send_failed', { alertId: alert.id, userId, channel, error });
        }
      });
    });

    return { sent, failed };
  }

  /**
   * Record alert delivery history
   */
  private recordAlertDelivery(alertId: string, userId: string, channel: 'push' | 'email' | 'sms', status: 'sent' | 'failed' | 'read'): void {
    this.alertHistory.push({
      alertId,
      userId,
      channel,
      sentAt: new Date(),
      status
    });
  }

  /**
   * Get alert delivery history
   */
  getAlertHistory(alertId: string, userId?: string): AlertHistory[] {
    let history = this.alertHistory.filter(h => h.alertId === alertId);
    if (userId) history = history.filter(h => h.userId === userId);
    return history;
  }

  /**
   * Mark alert as read by user
   */
  markAlertAsRead(alertId: string, userId: string): void {
    const history = this.alertHistory.find(h => h.alertId === alertId && h.userId === userId);
    if (history) {
      history.status = 'read';
      this.emit('alert_read', { alertId, userId });
    }
  }

  /**
   * Get alert statistics
   */
  getAlertStats(farmId: string): {
    totalAlerts: number;
    activeAlerts: number;
    alertsByType: Record<string, number>;
    alertsBySeverity: Record<string, number>;
  } {
    const farmAlerts = Array.from(this.alerts.values()).filter(a => a.farmId === farmId);
    
    const alertsByType: Record<string, number> = {};
    const alertsBySeverity: Record<string, number> = {};

    farmAlerts.forEach(alert => {
      alertsByType[alert.type] = (alertsByType[alert.type] || 0) + 1;
      alertsBySeverity[alert.severity] = (alertsBySeverity[alert.severity] || 0) + 1;
    });

    return {
      totalAlerts: farmAlerts.length,
      activeAlerts: farmAlerts.filter(a => a.status === 'active').length,
      alertsByType,
      alertsBySeverity
    };
  }

  /**
   * Generate alert recommendations based on type
   */
  getRecommendations(alertType: string): string[] {
    const recommendations: Record<string, string[]> = {
      frost: [
        'Activate frost protection systems',
        'Cover sensitive crops with frost cloth',
        'Increase irrigation to warm soil',
        'Monitor temperature closely'
      ],
      drought: [
        'Increase irrigation frequency',
        'Apply mulch to retain soil moisture',
        'Reduce fertilizer application',
        'Consider drought-resistant crop varieties'
      ],
      flood: [
        'Prepare drainage systems',
        'Move equipment to higher ground',
        'Monitor water levels',
        'Prepare emergency evacuation routes'
      ],
      hail: [
        'Secure loose equipment',
        'Prepare hail netting if available',
        'Document potential crop damage',
        'Contact insurance provider'
      ],
      extreme_heat: [
        'Increase irrigation to cool crops',
        'Provide shade for sensitive crops',
        'Monitor livestock for heat stress',
        'Increase water availability'
      ],
      extreme_cold: [
        'Protect crops with covers',
        'Activate heating systems if available',
        'Provide shelter for livestock',
        'Monitor for frost damage'
      ],
      high_winds: [
        'Secure loose equipment and structures',
        'Reduce irrigation to prevent wind drift',
        'Monitor for crop lodging',
        'Prepare for potential damage'
      ],
      disease_risk: [
        'Increase monitoring frequency',
        'Apply preventive fungicides',
        'Improve air circulation',
        'Remove infected plant material'
      ]
    };

    return recommendations[alertType] || ['Monitor situation closely'];
  }

  /**
   * Batch create alerts from weather data
   */
  createAlertsFromWeatherData(farmId: string, weatherData: any): WeatherAlert[] {
    const alerts: WeatherAlert[] = [];

    // Check for frost risk
    if (weatherData.temperature < 0) {
      alerts.push(this.createAlert(farmId, {
        type: 'frost',
        severity: weatherData.temperature < -5 ? 'critical' : 'high',
        title: 'Frost Warning',
        description: `Temperature dropping to ${weatherData.temperature}°C`,
        affectedArea: weatherData.location,
        startTime: new Date(),
        recommendedActions: this.getRecommendations('frost')
      }));
    }

    // Check for drought risk
    if (weatherData.rainfall < 10 && weatherData.humidity < 40) {
      alerts.push(this.createAlert(farmId, {
        type: 'drought',
        severity: 'medium',
        title: 'Drought Warning',
        description: `Low rainfall (${weatherData.rainfall}mm) and humidity (${weatherData.humidity}%)`,
        affectedArea: weatherData.location,
        startTime: new Date(),
        recommendedActions: this.getRecommendations('drought')
      }));
    }

    // Check for disease risk
    if (weatherData.humidity > 80 && weatherData.temperature > 15 && weatherData.temperature < 25) {
      alerts.push(this.createAlert(farmId, {
        type: 'disease_risk',
        severity: 'medium',
        title: 'Disease Risk Alert',
        description: 'Conditions favorable for fungal diseases',
        affectedArea: weatherData.location,
        startTime: new Date(),
        recommendedActions: this.getRecommendations('disease_risk')
      }));
    }

    // Check for extreme heat
    if (weatherData.temperature > 35) {
      alerts.push(this.createAlert(farmId, {
        type: 'extreme_heat',
        severity: weatherData.temperature > 40 ? 'critical' : 'high',
        title: 'Extreme Heat Warning',
        description: `Temperature reaching ${weatherData.temperature}°C`,
        affectedArea: weatherData.location,
        startTime: new Date(),
        recommendedActions: this.getRecommendations('extreme_heat')
      }));
    }

    // Check for high winds
    if (weatherData.windSpeed > 40) {
      alerts.push(this.createAlert(farmId, {
        type: 'high_winds',
        severity: weatherData.windSpeed > 60 ? 'critical' : 'high',
        title: 'High Wind Warning',
        description: `Wind speeds up to ${weatherData.windSpeed} km/h`,
        affectedArea: weatherData.location,
        startTime: new Date(),
        recommendedActions: this.getRecommendations('high_winds')
      }));
    }

    return alerts;
  }

  /**
   * Clean up expired alerts
   */
  cleanupExpiredAlerts(): number {
    let count = 0;
    const now = new Date();
    
    this.alerts.forEach((alert, id) => {
      if (alert.endTime && alert.endTime < now && alert.status === 'active') {
        alert.status = 'expired';
        count++;
      }
    });

    return count;
  }
}

export const weatherAlertsSystem = new WeatherAlertsSystem();
