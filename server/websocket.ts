import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

interface WebSocketClient {
  ws: WebSocket;
  userId: number;
  farmId: number;
  isAlive: boolean;
}

interface NotificationMessage {
  type: 'task_assigned' | 'activity_approved' | 'activity_rejected' | 'urgent_alert' | 'weather_alert' | 'equipment_alert' | 'connection_established' | 'activity_update' | 'location_update' | 'pong' | 'expense_created' | 'revenue_created' | 'expense_updated' | 'revenue_updated' | 'financial_data_refresh';
  data: Record<string, any>;
  timestamp: number;
}

class FieldWorkerWebSocketServer {
  private wss: WebSocketServer;
  private clients: Map<string, WebSocketClient> = new Map();
  private userSessions: Map<number, string[]> = new Map(); // userId -> connectionIds

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server, path: '/api/ws' });
    this.setupServer();
  }

  private setupServer() {
    this.wss.on('connection', (ws: WebSocket, req) => {
      const token = this.extractToken(req.url || '');
      
      if (!token) {
        ws.close(1008, 'Unauthorized');
        return;
      }

      try {
        // Decode token without verification (in production, verify properly)
        const parts = token.split('.');
        if (parts.length !== 3) {
          ws.close(1008, 'Invalid token format');
          return;
        }
        
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        const userId = payload.sub as number;
        const farmId = payload.farmId as number || 1;
        const connectionId = `${userId}-${Date.now()}-${Math.random()}`;

        const client: WebSocketClient = {
          ws,
          userId,
          farmId,
          isAlive: true,
        };

        this.clients.set(connectionId, client);
        
        // Track user sessions
        if (!this.userSessions.has(userId)) {
          this.userSessions.set(userId, []);
        }
        this.userSessions.get(userId)!.push(connectionId);

        console.log(`[WebSocket] User ${userId} connected (${connectionId})`);

        // Setup handlers
        ws.on('message', (data) => this.handleMessage(connectionId, data));
        ws.on('pong', () => {
          const client = this.clients.get(connectionId);
          if (client) client.isAlive = true;
        });
        ws.on('close', () => this.handleDisconnect(connectionId));
        ws.on('error', (error) => console.error(`[WebSocket] Error: ${error.message}`));

        // Send connection confirmation
        this.sendToClient(connectionId, {
          type: 'connection_established',
          data: { userId, farmId },
          timestamp: Date.now(),
        });
      } catch (error) {
        console.error('[WebSocket] Authentication failed:', error);
        ws.close(1008, 'Authentication failed');
        return;
      }
    });

    // Heartbeat interval
    setInterval(() => this.heartbeat(), 30000);
  }

  private extractToken(url: string): string | null {
    const match = url.match(/token=([^&]+)/);
    return match ? match[1] : null;
  }

  private handleMessage(connectionId: string, data: any) {
    try {
      const message = JSON.parse(data instanceof Buffer ? data.toString() : data.toString());
      const client = this.clients.get(connectionId);

      if (!client) return;

      switch (message.type) {
        case 'acknowledge_task':
          this.handleTaskAcknowledgment(client.userId, message.data);
          break;
        case 'activity_update':
          this.broadcastToFarm(client.farmId, {
            type: 'activity_update',
            data: { ...message.data, workerId: client.userId },
            timestamp: Date.now(),
          });
          break;
        case 'location_update':
          this.broadcastToFarm(client.farmId, {
            type: 'location_update',
            data: { ...message.data, workerId: client.userId },
            timestamp: Date.now(),
          });
          break;
        case 'ping':
          this.sendToClient(connectionId, { type: 'pong', data: {}, timestamp: Date.now() });
          break;
      }
    } catch (error) {
      console.error('[WebSocket] Message parsing error:', error);
    }
  }

  private handleTaskAcknowledgment(userId: number, data: any) {
    console.log(`[WebSocket] Task acknowledged by user ${userId}:`, data);
    // Store acknowledgment in database
  }

  private handleDisconnect(connectionId: string) {
    const client = this.clients.get(connectionId);
    if (client) {
      console.log(`[WebSocket] User ${client.userId} disconnected (${connectionId})`);
      
      // Remove from user sessions
      const sessions = this.userSessions.get(client.userId);
      if (sessions) {
        const index = sessions.indexOf(connectionId);
        if (index > -1) sessions.splice(index, 1);
        if (sessions.length === 0) {
          this.userSessions.delete(client.userId);
        }
      }
      
      this.clients.delete(connectionId);
    }
  }

  private heartbeat() {
    this.clients.forEach((client, connectionId) => {
      if (!client.isAlive) {
        console.log(`[WebSocket] Terminating inactive connection: ${connectionId}`);
        client.ws.terminate();
        this.handleDisconnect(connectionId);
        return;
      }

      client.isAlive = false;
      client.ws.ping();
    });
  }

  private sendToClient(connectionId: string, message: NotificationMessage) {
    const client = this.clients.get(connectionId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message));
    }
  }

  public sendToUser(userId: number, message: NotificationMessage) {
    const connectionIds = this.userSessions.get(userId) || [];
    connectionIds.forEach((connectionId) => this.sendToClient(connectionId, message));
  }

  private broadcastToFarm(farmId: number, message: NotificationMessage) {
    this.clients.forEach((client) => {
      if (client.farmId === farmId && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(message));
      }
    });
  }

  // Public methods for sending notifications from server
  public notifyTaskAssigned(userId: number, taskId: number, taskData: any) {
    this.sendToUser(userId, {
      type: 'task_assigned',
      data: { taskId, ...taskData },
      timestamp: Date.now(),
    });
  }

  public notifyActivityApproved(userId: number, activityId: number) {
    this.sendToUser(userId, {
      type: 'activity_approved',
      data: { activityId },
      timestamp: Date.now(),
    });
  }

  public notifyActivityRejected(userId: number, activityId: number, reason: string) {
    this.sendToUser(userId, {
      type: 'activity_rejected',
      data: { activityId, reason },
      timestamp: Date.now(),
    });
  }

  public notifyUrgentAlert(farmId: number, alert: any) {
    this.broadcastToFarm(farmId, {
      type: 'urgent_alert',
      data: alert,
      timestamp: Date.now(),
    });
  }

  public notifyWeatherAlert(farmId: number, alert: any) {
    this.broadcastToFarm(farmId, {
      type: 'weather_alert',
      data: alert,
      timestamp: Date.now(),
    });
  }

  public notifyEquipmentAlert(farmId: number, alert: any) {
    this.broadcastToFarm(farmId, {
      type: 'equipment_alert',
      data: alert,
      timestamp: Date.now(),
    });
  }

  public notifyExpenseCreated(farmId: number, expense: any) {
    this.broadcastToFarm(farmId, {
      type: 'expense_created',
      data: { ...expense, eventType: 'expense_created' },
      timestamp: Date.now(),
    });
  }

  public notifyRevenueCreated(farmId: number, revenue: any) {
    this.broadcastToFarm(farmId, {
      type: 'revenue_created',
      data: { ...revenue, eventType: 'revenue_created' },
      timestamp: Date.now(),
    });
  }

  public notifyExpenseUpdated(farmId: number, expenseId: number, expense: any) {
    this.broadcastToFarm(farmId, {
      type: 'expense_updated',
      data: { expenseId, ...expense, eventType: 'expense_updated' },
      timestamp: Date.now(),
    });
  }

  public notifyRevenueUpdated(farmId: number, revenueId: number, revenue: any) {
    this.broadcastToFarm(farmId, {
      type: 'revenue_updated',
      data: { revenueId, ...revenue, eventType: 'revenue_updated' },
      timestamp: Date.now(),
    });
  }

  public notifyFinancialDataRefresh(farmId: number, refreshData: any) {
    this.broadcastToFarm(farmId, {
      type: 'financial_data_refresh',
      data: { ...refreshData, eventType: 'financial_data_refresh' },
      timestamp: Date.now(),
    });
  }

  public getConnectedUsers(): number {
    return this.clients.size;
  }

  public getConnectedUserIds(): number[] {
    return Array.from(new Set(this.clients.values().map((c) => c.userId)));
  }
}

/**
 * Extended WebSocket Manager for room-based communication
 */
export class WebSocketRoomManager {
  private wsServer: FieldWorkerWebSocketServer;
  private rooms: Map<string, Set<number>> = new Map(); // room -> userIds
  private messageHandlers: Map<string, (msg: any, userId: number, farmId: number) => void> = new Map();

  constructor(wsServer: FieldWorkerWebSocketServer) {
    this.wsServer = wsServer;
  }

  /**
   * Join room
   */
  joinRoom(roomId: string, userId: number): void {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }
    this.rooms.get(roomId)!.add(userId);
  }

  /**
   * Leave room
   */
  leaveRoom(roomId: string, userId: number): void {
    const room = this.rooms.get(roomId);
    if (room) {
      room.delete(userId);
      if (room.size === 0) {
        this.rooms.delete(roomId);
      }
    }
  }

  /**
   * Broadcast to room
   */
  broadcastToRoom(roomId: string, message: NotificationMessage): void {
    const room = this.rooms.get(roomId);
    if (room) {
      room.forEach((userId) => {
        this.wsServer.sendToUser(userId, message);
      });
    }
  }

  /**
   * Register message handler
   */
  registerHandler(type: string, handler: (msg: any, userId: number, farmId: number) => void): void {
    this.messageHandlers.set(type, handler);
  }

  /**
   * Get room info
   */
  getRoomInfo(roomId: string): { room: string; members: number } | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    return { room: roomId, members: room.size };
  }

  /**
   * Get all rooms
   */
  getAllRooms(): Array<{ room: string; members: number }> {
    return Array.from(this.rooms.entries()).map(([room, members]) => ({
      room,
      members: members.size,
    }));
  }
}

export default FieldWorkerWebSocketServer;
