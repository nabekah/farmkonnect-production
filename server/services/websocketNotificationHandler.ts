import { WebSocket } from 'ws';
import { EventEmitter } from 'events';
import { db } from '../db';

export type NotificationType = 'weather_alert' | 'pest_warning' | 'task_update' | 'system_alert' | 'info';

export interface WebSocketNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  userId?: number;
  farmId?: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}

class WebSocketNotificationHandler extends EventEmitter {
  private connectedClients: Map<number, Set<WebSocket>> = new Map();
  private notificationQueue: WebSocketNotification[] = [];

  constructor() {
    super();
  }

  /**
   * Register a WebSocket connection for a user
   */
  registerClient(userId: number, ws: WebSocket) {
    if (!this.connectedClients.has(userId)) {
      this.connectedClients.set(userId, new Set());
    }
    this.connectedClients.get(userId)!.add(ws);

    ws.on('close', () => {
      const userClients = this.connectedClients.get(userId);
      if (userClients) {
        userClients.delete(ws);
        if (userClients.size === 0) {
          this.connectedClients.delete(userId);
        }
      }
    });
  }

  /**
   * Send a notification to a specific user
   */
  notifyUser(userId: number, notification: WebSocketNotification) {
    const userClients = this.connectedClients.get(userId);
    if (userClients && userClients.size > 0) {
      const message = JSON.stringify({
        type: 'notification',
        data: notification,
      });

      userClients.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(message);
        }
      });
    } else {
      // Queue notification if user not connected
      this.notificationQueue.push(notification);
    }

    this.emit('notification:sent', notification);
  }

  /**
   * Broadcast a notification to all connected users
   */
  broadcastNotification(notification: WebSocketNotification) {
    const message = JSON.stringify({
      type: 'notification',
      data: notification,
    });

    this.connectedClients.forEach(userClients => {
      userClients.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(message);
        }
      });
    });

    this.emit('notification:broadcast', notification);
  }

  /**
   * Send weather alert notification
   */
  sendWeatherAlert(userId: number, alert: {
    title: string;
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    farmId?: number;
  }) {
    const notification: WebSocketNotification = {
      id: `weather_${Date.now()}_${Math.random()}`,
      type: 'weather_alert',
      title: alert.title,
      message: alert.message,
      userId,
      farmId: alert.farmId,
      severity: alert.severity,
      timestamp: new Date(),
      read: false,
      actionUrl: '/weather',
    };

    this.notifyUser(userId, notification);
  }

  /**
   * Send pest warning notification
   */
  sendPestWarning(userId: number, warning: {
    title: string;
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    farmId?: number;
    cropType?: string;
  }) {
    const notification: WebSocketNotification = {
      id: `pest_${Date.now()}_${Math.random()}`,
      type: 'pest_warning',
      title: warning.title,
      message: warning.message,
      userId,
      farmId: warning.farmId,
      severity: warning.severity,
      timestamp: new Date(),
      read: false,
      actionUrl: '/pest-management',
    };

    this.notifyUser(userId, notification);
  }

  /**
   * Send task update notification
   */
  sendTaskUpdate(userId: number, update: {
    title: string;
    message: string;
    taskId: string;
    farmId?: number;
  }) {
    const notification: WebSocketNotification = {
      id: `task_${Date.now()}_${Math.random()}`,
      type: 'task_update',
      title: update.title,
      message: update.message,
      userId,
      farmId: update.farmId,
      severity: 'medium',
      timestamp: new Date(),
      read: false,
      actionUrl: `/tasks/${update.taskId}`,
    };

    this.notifyUser(userId, notification);
  }

  /**
   * Send system alert notification
   */
  sendSystemAlert(userId: number, alert: {
    title: string;
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }) {
    const notification: WebSocketNotification = {
      id: `system_${Date.now()}_${Math.random()}`,
      type: 'system_alert',
      title: alert.title,
      message: alert.message,
      userId,
      severity: alert.severity,
      timestamp: new Date(),
      read: false,
    };

    this.notifyUser(userId, notification);
  }

  /**
   * Get queued notifications for a user
   */
  getQueuedNotifications(userId: number): WebSocketNotification[] {
    return this.notificationQueue.filter(n => n.userId === userId);
  }

  /**
   * Clear queued notifications for a user
   */
  clearQueuedNotifications(userId: number) {
    this.notificationQueue = this.notificationQueue.filter(n => n.userId !== userId);
  }

  /**
   * Get connection count for a user
   */
  getUserConnectionCount(userId: number): number {
    return this.connectedClients.get(userId)?.size || 0;
  }

  /**
   * Get total connected clients
   */
  getTotalConnections(): number {
    let total = 0;
    this.connectedClients.forEach(clients => {
      total += clients.size;
    });
    return total;
  }
}

// Export singleton instance
export const wsNotificationHandler = new WebSocketNotificationHandler();
