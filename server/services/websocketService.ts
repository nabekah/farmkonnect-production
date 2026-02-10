import { Server as HTTPServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { getDb } from '../db';
import { notifications, eq } from '../../drizzle/schema';

export interface WebSocketMessage {
  type: 'notification' | 'subscribe' | 'unsubscribe' | 'ping' | 'pong';
  userId?: number;
  data?: any;
  timestamp: number;
}

export interface NotificationEvent {
  userId: number;
  type: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  relatedId?: number;
  relatedType?: string;
  actionUrl?: string;
}

class WebSocketService {
  private wss: WebSocketServer | null = null;
  private userConnections: Map<number, Set<WebSocket>> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  /**
   * Initialize WebSocket server
   */
  initialize(server: HTTPServer): void {
    this.wss = new WebSocketServer({ 
      server,
      path: '/api/ws',
      perMessageDeflate: false,
    });

    this.wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
      console.log('[WebSocket] New connection from', req.socket.remoteAddress);
      
      let userId: number | null = null;

      // Handle incoming messages
      ws.on('message', (data: Buffer) => {
        try {
          const message: WebSocketMessage = JSON.parse(data.toString());
          this.handleMessage(ws, message, (id) => { userId = id; });
        } catch (error) {
          console.error('[WebSocket] Failed to parse message:', error);
          ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
        }
      });

      // Handle disconnection
      ws.on('close', () => {
        if (userId) {
          this.removeUserConnection(userId, ws);
          console.log(`[WebSocket] User ${userId} disconnected`);
        }
      });

      // Handle errors
      ws.on('error', (error) => {
        console.error('[WebSocket] Error:', error);
      });

      // Send initial connection message
      ws.send(JSON.stringify({
        type: 'connected',
        message: 'Connected to FarmKonnect notification service',
        timestamp: Date.now(),
      }));
    });

    // Start heartbeat to keep connections alive
    this.startHeartbeat();

    console.log('[WebSocket] Server initialized');
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(
    ws: WebSocket,
    message: WebSocketMessage,
    setUserId: (id: number) => void
  ): void {
    switch (message.type) {
      case 'subscribe':
        if (message.userId) {
          setUserId(message.userId);
          this.addUserConnection(message.userId, ws);
          ws.send(JSON.stringify({
            type: 'subscribed',
            userId: message.userId,
            timestamp: Date.now(),
          }));
          console.log(`[WebSocket] User ${message.userId} subscribed`);
        }
        break;

      case 'unsubscribe':
        if (message.userId) {
          this.removeUserConnection(message.userId, ws);
          ws.send(JSON.stringify({
            type: 'unsubscribed',
            userId: message.userId,
            timestamp: Date.now(),
          }));
        }
        break;

      case 'ping':
        ws.send(JSON.stringify({
          type: 'pong',
          timestamp: Date.now(),
        }));
        break;

      default:
        console.log('[WebSocket] Unknown message type:', message.type);
    }
  }

  /**
   * Add user connection
   */
  private addUserConnection(userId: number, ws: WebSocket): void {
    if (!this.userConnections.has(userId)) {
      this.userConnections.set(userId, new Set());
    }
    this.userConnections.get(userId)!.add(ws);
  }

  /**
   * Remove user connection
   */
  private removeUserConnection(userId: number, ws: WebSocket): void {
    const connections = this.userConnections.get(userId);
    if (connections) {
      connections.delete(ws);
      if (connections.size === 0) {
        this.userConnections.delete(userId);
      }
    }
  }

  /**
   * Broadcast notification to user
   */
  async broadcastNotification(event: NotificationEvent): Promise<void> {
    const connections = this.userConnections.get(event.userId);
    if (!connections || connections.size === 0) {
      console.log(`[WebSocket] No active connections for user ${event.userId}`);
      return;
    }

    const message: WebSocketMessage = {
      type: 'notification',
      data: {
        notificationType: event.type,
        title: event.title,
        message: event.message,
        priority: event.priority,
        relatedId: event.relatedId,
        relatedType: event.relatedType,
        actionUrl: event.actionUrl,
        timestamp: Date.now(),
      },
      timestamp: Date.now(),
    };

    const payload = JSON.stringify(message);
    let successCount = 0;

    connections.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(payload, (error) => {
          if (error) {
            console.error('[WebSocket] Failed to send notification:', error);
          } else {
            successCount++;
          }
        });
      }
    });

    console.log(
      `[WebSocket] Sent notification to user ${event.userId}: ${successCount}/${connections.size} connections`
    );
  }

  /**
   * Broadcast to multiple users
   */
  async broadcastToUsers(userIds: number[], event: Omit<NotificationEvent, 'userId'>): Promise<void> {
    for (const userId of userIds) {
      await this.broadcastNotification({ ...event, userId });
    }
  }

  /**
   * Broadcast to all connected users
   */
  async broadcastToAll(event: Omit<NotificationEvent, 'userId'>): Promise<void> {
    for (const userId of this.userConnections.keys()) {
      await this.broadcastNotification({ ...event, userId });
    }
  }

  /**
   * Start heartbeat to keep connections alive
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.userConnections.forEach((connections, userId) => {
        connections.forEach((ws) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.ping((error) => {
              if (error) {
                console.error(`[WebSocket] Heartbeat failed for user ${userId}:`, error);
                this.removeUserConnection(userId, ws);
              }
            });
          }
        });
      });
    }, 30000); // Every 30 seconds
  }

  /**
   * Stop heartbeat
   */
  stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Get active connection count
   */
  getActiveConnections(): number {
    let total = 0;
    this.userConnections.forEach((connections) => {
      total += connections.size;
    });
    return total;
  }

  /**
   * Get user connection count
   */
  getUserConnectionCount(userId: number): number {
    return this.userConnections.get(userId)?.size || 0;
  }

  /**
   * Close all connections
   */
  closeAll(): void {
    this.userConnections.forEach((connections) => {
      connections.forEach((ws) => {
        ws.close(1000, 'Server shutting down');
      });
    });
    this.userConnections.clear();
    this.stopHeartbeat();
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();
