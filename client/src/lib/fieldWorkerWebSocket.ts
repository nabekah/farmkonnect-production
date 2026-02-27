/**
 * WebSocket service for real-time field worker notifications
 * Handles task assignments, activity approvals, and urgent alerts
 */

import { FieldWorkerNotification } from './fieldWorkerNotifications';
import { getWebSocketConfig } from './railwayWebSocketConfig';

export type WebSocketEventType =
  | 'task_assigned'
  | 'activity_approved'
  | 'urgent_alert'
  | 'weather_alert'
  | 'equipment_alert'
  | 'worker_online'
  | 'worker_offline'
  | 'connection_established'
  | 'connection_closed';

export interface WebSocketMessage {
  type: WebSocketEventType;
  data: any;
  timestamp: string;
  workerId?: number;
  farmId?: number;
}

class FieldWorkerWebSocketService {
  private ws: WebSocket | null = null;
  private url: string;
  private workerId: number | null = null;
  private farmId: number | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private listeners: Map<WebSocketEventType, Set<(data: any) => void>> = new Map();
  private isConnecting = false;
  private config = getWebSocketConfig();

  constructor(url: string = '') {
    this.url = url || this.getWebSocketURL();
  }

  /**
   * Get WebSocket URL based on current location
   */
  private getWebSocketURL(): string {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${protocol}//${host}/api/ws`;
  }

  /**
   * Connect to WebSocket server
   */
  public connect(workerId: number, farmId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      // Skip WebSocket on Railway if disabled
      if (!this.config.enabled) {
        console.log('[WebSocket] Disabled on this environment, using polling instead');
        this.workerId = workerId;
        this.farmId = farmId;
        resolve();
        return;
      }

      if (this.isConnecting) {
        reject(new Error('Connection already in progress'));
        return;
      }

      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      this.isConnecting = true;
      this.workerId = workerId;
      this.farmId = farmId;

      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.isConnecting = false;
          this.reconnectAttempts = 0;

          // Send authentication message
          this.send({
            type: 'worker_online',
            data: { workerId, farmId },
            timestamp: new Date().toISOString(),
          });

          this.emit('connection_established', { workerId, farmId });
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.isConnecting = false;
          // Don't reject immediately, allow fallback to polling
          if (!this.config.blockOnFailure) {
            resolve(); // Resolve with fallback instead of blocking
          }
          this.attemptReconnect();
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket disconnected', event.code, event.reason);
          this.isConnecting = false;
          this.emit('connection_closed', { code: event.code, reason: event.reason });
          // Only attempt reconnect if it wasn't a normal closure
          if (event.code !== 1000 && event.code !== 1001) {
            this.attemptReconnect();
          }
        };
      } catch (error) {
        this.isConnecting = false;
        console.error('Failed to create WebSocket:', error);
        // Attempt to recover with fallback
        if (!this.config.blockOnFailure) {
          resolve(); // Resolve with fallback instead of blocking
        }
        this.attemptReconnect();
        if (this.config.blockOnFailure) {
          reject(error);
        }
      }
    });
  }

  /**
   * Send message to WebSocket server
   */
  private send(message: WebSocketMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, attempting to reconnect...');
      // Attempt to reconnect if not already connecting
      if (!this.isConnecting && this.workerId && this.farmId) {
        this.connect(this.workerId, this.farmId).catch(err => {
          console.error('Reconnection failed:', err);
        });
      }
    }
  }

  /**
   * Handle incoming WebSocket message
   */
  private handleMessage(message: WebSocketMessage): void {
    console.log('Received WebSocket message:', message.type);

    // Emit event to listeners
    this.emit(message.type, message.data);

    // Create notification if applicable
    if (this.isNotificationEvent(message.type)) {
      this.createNotificationFromMessage(message);
    }
  }

  /**
   * Check if message type should create a notification
   */
  private isNotificationEvent(type: WebSocketEventType): boolean {
    return [
      'task_assigned',
      'activity_approved',
      'urgent_alert',
      'weather_alert',
      'equipment_alert',
    ].includes(type);
  }

  /**
   * Create notification from WebSocket message
   */
  private createNotificationFromMessage(message: WebSocketMessage): void {
    const notification: FieldWorkerNotification = {
      id: `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: message.type as any,
      title: message.data.title || 'Notification',
      message: message.data.message || '',
      farmId: message.farmId || this.farmId || 0,
      workerId: message.workerId || this.workerId || 0,
      priority: message.data.priority || 'medium',
      read: false,
      createdAt: new Date(message.timestamp),
      actionUrl: message.data.actionUrl,
      actionLabel: message.data.actionLabel,
      taskId: message.data.taskId,
      activityId: message.data.activityId,
    };

    // Dispatch custom event for notification
    window.dispatchEvent(
      new CustomEvent('fieldWorkerNotification', { detail: notification })
    );
  }

  /**
   * Attempt to reconnect to WebSocket
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      if (this.workerId && this.farmId) {
        this.connect(this.workerId, this.farmId).catch((error) => {
          console.error('Reconnection failed:', error);
        });
      }
    }, delay);
  }

  /**
   * Register event listener
   */
  public on(type: WebSocketEventType, callback: (data: any) => void): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }

    this.listeners.get(type)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(type)?.delete(callback);
    };
  }

  /**
   * Emit event to listeners
   */
  private emit(type: WebSocketEventType, data: any): void {
    const callbacks = this.listeners.get(type);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in listener for ${type}:`, error);
        }
      });
    }
  }

  /**
   * Disconnect WebSocket
   */
  public disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.listeners.clear();
  }

  /**
   * Check if connected
   */
  public isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Send task assignment acknowledgment
   */
  public acknowledgeTaskAssignment(taskId: number): void {
    this.send({
      type: 'task_assigned',
      data: { taskId, acknowledged: true },
      timestamp: new Date().toISOString(),
      workerId: this.workerId || undefined,
      farmId: this.farmId || undefined,
    });
  }

  /**
   * Send activity approval request
   */
  public requestActivityApproval(activityId: number): void {
    this.send({
      type: 'activity_approved',
      data: { activityId, status: 'pending_review' },
      timestamp: new Date().toISOString(),
      workerId: this.workerId || undefined,
      farmId: this.farmId || undefined,
    });
  }
}

// Create singleton instance
let wsService: FieldWorkerWebSocketService | null = null;

export function getFieldWorkerWebSocketService(): FieldWorkerWebSocketService {
  if (!wsService) {
    wsService = new FieldWorkerWebSocketService();
  }
  return wsService;
}

export function createFieldWorkerWebSocketService(
  url?: string
): FieldWorkerWebSocketService {
  return new FieldWorkerWebSocketService(url);
}
