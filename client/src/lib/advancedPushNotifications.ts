/**
 * Advanced Push Notifications Service
 * Enhanced notification types: emergency alerts, weather warnings, equipment failures
 */

export type NotificationType = 'task' | 'emergency' | 'weather' | 'equipment' | 'reminder' | 'system'

export type PriorityLevel = 'low' | 'medium' | 'high' | 'critical'

export interface AdvancedNotificationPayload {
  id: string
  type: NotificationType
  priority: PriorityLevel
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  requireInteraction?: boolean
  actions?: NotificationAction[]
  data?: Record<string, any>
  timestamp?: number
  expiresAt?: number
}

export interface NotificationAction {
  action: string
  title: string
  icon?: string
}

export interface EmergencyAlert {
  alertId: string
  severity: 'warning' | 'critical'
  location?: { lat: number; lng: number }
  affectedWorkers?: number[]
  description: string
  actionRequired: boolean
  estimatedDuration?: number
}

export interface WeatherWarning {
  warningId: string
  weatherType: 'rain' | 'wind' | 'heat' | 'cold' | 'storm' | 'flood'
  severity: 'minor' | 'moderate' | 'severe'
  affectedArea: { lat: number; lng: number; radius: number }
  startTime: number
  endTime: number
  recommendations: string[]
}

export interface EquipmentFailure {
  failureId: string
  equipmentId: string
  equipmentName: string
  failureType: 'breakdown' | 'maintenance' | 'low_fuel' | 'low_battery' | 'malfunction'
  severity: 'minor' | 'major' | 'critical'
  location?: { lat: number; lng: number }
  estimatedRepairTime?: number
  actionRequired: boolean
}

export interface NotificationDeliveryStatus {
  notificationId: string
  userId: number
  status: 'pending' | 'delivered' | 'failed' | 'read'
  deliveredAt?: number
  readAt?: number
  error?: string
}

class AdvancedPushNotificationService {
  private notificationHistory: AdvancedNotificationPayload[] = []
  private deliveryStatus: Map<string, NotificationDeliveryStatus> = new Map()
  private priorityQueue: AdvancedNotificationPayload[] = []
  private listeners: Set<(notification: AdvancedNotificationPayload) => void> = new Set()

  /**
   * Send emergency alert notification
   */
  async sendEmergencyAlert(alert: EmergencyAlert): Promise<string> {
    const notificationId = `emergency-${alert.alertId}-${Date.now()}`

    const notification: AdvancedNotificationPayload = {
      id: notificationId,
      type: 'emergency',
      priority: alert.severity === 'critical' ? 'critical' : 'high',
      title: `🚨 Emergency Alert: ${alert.description.substring(0, 30)}...`,
      body: alert.description,
      icon: '/emergency-icon.png',
      requireInteraction: true,
      data: {
        type: 'emergency',
        alertId: alert.alertId,
        severity: alert.severity,
        location: alert.location,
        affectedWorkers: alert.affectedWorkers,
        actionRequired: alert.actionRequired,
      },
      actions: [
        { action: 'acknowledge', title: 'Acknowledge' },
        { action: 'view_details', title: 'View Details' },
      ],
      timestamp: Date.now(),
    }

    await this.queueNotification(notification)
    return notificationId
  }

  /**
   * Send weather warning notification
   */
  async sendWeatherWarning(warning: WeatherWarning): Promise<string> {
    const notificationId = `weather-${warning.warningId}-${Date.now()}`

    const weatherEmoji: Record<string, string> = {
      rain: '🌧️',
      wind: '💨',
      heat: '🌡️',
      cold: '❄️',
      storm: '⛈️',
      flood: '🌊',
    }

    const notification: AdvancedNotificationPayload = {
      id: notificationId,
      type: 'weather',
      priority: warning.severity === 'severe' ? 'high' : 'medium',
      title: `${weatherEmoji[warning.weatherType]} Weather Warning: ${warning.weatherType}`,
      body: `${warning.severity} ${warning.weatherType} warning in effect. ${warning.recommendations.join(' ')}`,
      icon: '/weather-icon.png',
      data: {
        type: 'weather',
        warningId: warning.warningId,
        weatherType: warning.weatherType,
        severity: warning.severity,
        affectedArea: warning.affectedArea,
        startTime: warning.startTime,
        endTime: warning.endTime,
        recommendations: warning.recommendations,
      },
      actions: [
        { action: 'view_map', title: 'View on Map' },
        { action: 'acknowledge', title: 'Acknowledge' },
      ],
      timestamp: Date.now(),
      expiresAt: warning.endTime,
    }

    await this.queueNotification(notification)
    return notificationId
  }

  /**
   * Send equipment failure notification
   */
  async sendEquipmentFailure(failure: EquipmentFailure): Promise<string> {
    const notificationId = `equipment-${failure.failureId}-${Date.now()}`

    const failureEmoji: Record<string, string> = {
      breakdown: '🔧',
      maintenance: '🛠️',
      low_fuel: '⛽',
      low_battery: '🔋',
      malfunction: '⚠️',
    }

    const notification: AdvancedNotificationPayload = {
      id: notificationId,
      type: 'equipment',
      priority: failure.severity === 'critical' ? 'critical' : failure.severity === 'major' ? 'high' : 'medium',
      title: `${failureEmoji[failure.failureType]} Equipment Alert: ${failure.equipmentName}`,
      body: `${failure.equipmentName} has a ${failure.failureType} issue. ${failure.actionRequired ? 'Immediate action required.' : 'Monitor situation.'}`,
      icon: '/equipment-icon.png',
      requireInteraction: failure.actionRequired,
      data: {
        type: 'equipment',
        failureId: failure.failureId,
        equipmentId: failure.equipmentId,
        equipmentName: failure.equipmentName,
        failureType: failure.failureType,
        severity: failure.severity,
        location: failure.location,
        estimatedRepairTime: failure.estimatedRepairTime,
        actionRequired: failure.actionRequired,
      },
      actions: [
        { action: 'report_repair', title: 'Report Repair' },
        { action: 'view_details', title: 'View Details' },
      ],
      timestamp: Date.now(),
    }

    await this.queueNotification(notification)
    return notificationId
  }

  /**
   * Queue notification for delivery
   */
  private async queueNotification(notification: AdvancedNotificationPayload): Promise<void> {
    this.priorityQueue.push(notification)
    this.notificationHistory.push(notification)

    // Sort by priority
    this.priorityQueue.sort((a, b) => {
      const priorityOrder: Record<PriorityLevel, number> = {
        critical: 0,
        high: 1,
        medium: 2,
        low: 3,
      }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })

    // Process queue
    await this.processNotificationQueue()

    // Notify listeners
    this.listeners.forEach((listener) => listener(notification))
  }

  /**
   * Process notification queue
   */
  private async processNotificationQueue(): Promise<void> {
    while (this.priorityQueue.length > 0) {
      const notification = this.priorityQueue.shift()
      if (notification) {
        await this.deliverNotification(notification)
      }
    }
  }

  /**
   * Deliver notification
   */
  private async deliverNotification(notification: AdvancedNotificationPayload): Promise<void> {
    try {
      // Check if service worker is available
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SEND_NOTIFICATION',
          notification,
        })
      }

      // Track delivery status
      const status: NotificationDeliveryStatus = {
        notificationId: notification.id,
        userId: 0, // Will be set by backend
        status: 'delivered',
        deliveredAt: Date.now(),
      }

      this.deliveryStatus.set(notification.id, status)
    } catch (error) {
      console.error('Failed to deliver notification:', error)

      const status: NotificationDeliveryStatus = {
        notificationId: notification.id,
        userId: 0,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      }

      this.deliveryStatus.set(notification.id, status)
    }
  }

  /**
   * Get notification history
   */
  getNotificationHistory(type?: NotificationType, limit: number = 50): AdvancedNotificationPayload[] {
    let history = this.notificationHistory.slice(-limit)

    if (type) {
      history = history.filter((n) => n.type === type)
    }

    return history
  }

  /**
   * Get delivery status
   */
  getDeliveryStatus(notificationId: string): NotificationDeliveryStatus | null {
    return this.deliveryStatus.get(notificationId) || null
  }

  /**
   * Mark notification as read
   */
  markAsRead(notificationId: string): void {
    const status = this.deliveryStatus.get(notificationId)
    if (status) {
      status.status = 'read'
      status.readAt = Date.now()
    }
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    total: number
    byType: Record<NotificationType, number>
    byPriority: Record<PriorityLevel, number>
    deliveryRate: number
  } {
    const total = this.notificationHistory.length
    const byType: Record<NotificationType, number> = {
      task: 0,
      emergency: 0,
      weather: 0,
      equipment: 0,
      reminder: 0,
      system: 0,
    }

    const byPriority: Record<PriorityLevel, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    }

    this.notificationHistory.forEach((n) => {
      byType[n.type]++
      byPriority[n.priority]++
    })

    const delivered = Array.from(this.deliveryStatus.values()).filter((s) => s.status === 'delivered').length
    const deliveryRate = total > 0 ? (delivered / total) * 100 : 0

    return {
      total,
      byType,
      byPriority,
      deliveryRate,
    }
  }

  /**
   * Subscribe to notifications
   */
  subscribe(callback: (notification: AdvancedNotificationPayload) => void): () => void {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  /**
   * Clear history
   */
  clearHistory(): void {
    this.notificationHistory = []
    this.deliveryStatus.clear()
  }
}

export const advancedPushNotificationService = new AdvancedPushNotificationService()
