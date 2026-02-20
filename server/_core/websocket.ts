import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { verifyWebSocketToken } from '../routers/websocketToken';

interface AuthenticatedWebSocket extends WebSocket {
  userId?: number;
  farmId?: number;
  isAlive?: boolean;
}

export class FarmKonnectWebSocketServer {
  private wss: WebSocketServer;
  private clients: Map<number, Set<AuthenticatedWebSocket>> = new Map();
  private heartbeatInterval!: NodeJS.Timeout;

  constructor(server: any) {
    this.wss = new WebSocketServer({ server, path: '/ws' });
    this.setupConnectionHandler();
    this.startHeartbeat();
  }

  private setupConnectionHandler() {
    this.wss.on('connection', async (ws: AuthenticatedWebSocket, req: IncomingMessage) => {
      try {
        // Extract token from query string or headers
        const token = this.extractToken(req);
        if (!token) {
          ws.close(4001, 'Authentication required');
          return;
        }

        // Verify JWT token
        try {
          const decoded = verifyWebSocketToken(token);
          ws.userId = decoded.userId;
          // Extract farmId from token if available, otherwise use default
          ws.farmId = (decoded as any).farmId || 1;
          console.log(`[WebSocket] Token verified for user ${ws.userId}`);
        } catch (error) {
          console.error('[WebSocket] Token verification failed:', error);
          ws.close(4001, 'Invalid or expired token');
          return;
        }
        ws.isAlive = true;

        // Add to clients map
        if (!this.clients.has(ws.farmId!)) {
          this.clients.set(ws.farmId!, new Set());
        }
        this.clients.get(ws.farmId!)!.add(ws);

        console.log(`[WebSocket] Connected: User ${ws.userId}, Farm ${ws.farmId}`);

        // Send welcome message
        ws.send(JSON.stringify({
          type: 'connected',
          message: 'Connected to FarmKonnect real-time updates',
          timestamp: new Date().toISOString(),
        }));

        // Handle pong responses for heartbeat
        ws.on('pong', () => {
          ws.isAlive = true;
        });

        // Handle incoming messages
        ws.on('message', (data: Buffer) => {
          this.handleMessage(ws, data);
        });

        // Handle disconnection
        ws.on('close', () => {
          this.handleDisconnect(ws);
        });

        // Handle errors
        ws.on('error', (error) => {
          console.error('[WebSocket] Error:', error);
        });

      } catch (error) {
        console.error('[WebSocket] Authentication failed:', error);
        ws.close(4001, 'Authentication failed');
      }
    });
  }

  private extractToken(req: IncomingMessage): string | null {
    try {
      // Try query string first
      const url = new URL(req.url!, `http://${req.headers.host}`);
      const tokenFromQuery = url.searchParams.get('token');
      if (tokenFromQuery) return tokenFromQuery;

      // Try Authorization header
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        return authHeader.substring(7);
      }
    } catch (error) {
      console.error('[WebSocket] Error extracting token:', error);
    }

    return null;
  }

  private handleMessage(ws: AuthenticatedWebSocket, data: Buffer) {
    try {
      const message = JSON.parse(data.toString());
      console.log('[WebSocket] Received message:', message);

      // Handle different message types
      switch (message.type) {
        case 'ping':
          ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
          break;
        case 'subscribe':
          // Handle subscription to specific event types
          console.log(`[WebSocket] User ${ws.userId} subscribed to:`, message.events);
          break;
        default:
          console.log('[WebSocket] Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('[WebSocket] Error handling message:', error);
    }
  }

  private handleDisconnect(ws: AuthenticatedWebSocket) {
    if (ws.farmId && this.clients.has(ws.farmId)) {
      this.clients.get(ws.farmId)!.delete(ws);
      if (this.clients.get(ws.farmId)!.size === 0) {
        this.clients.delete(ws.farmId);
      }
    }
    console.log(`[WebSocket] Disconnected: User ${ws.userId}`);
  }

  private startHeartbeat() {
    // Ping clients every 30 seconds to detect dead connections
    this.heartbeatInterval = setInterval(() => {
      this.wss.clients.forEach((ws: AuthenticatedWebSocket) => {
        if (ws.isAlive === false) {
          console.log(`[WebSocket] Terminating dead connection: User ${ws.userId}`);
          return ws.terminate();
        }

        ws.isAlive = false;
        ws.ping();
      });
    }, 30000);
  }

  // Broadcast to all clients in a farm
  public broadcastToFarm(farmId: number, message: any) {
    const clients = this.clients.get(farmId);
    if (!clients) {
      console.log(`[WebSocket] No clients connected for farm ${farmId}`);
      return;
    }

    const payload = JSON.stringify(message);
    let sentCount = 0;

    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
        sentCount++;
      }
    });

    console.log(`[WebSocket] Broadcast to farm ${farmId}: ${sentCount} clients`);
  }

  // Broadcast to specific user
  public broadcastToUser(userId: number, message: any) {
    const payload = JSON.stringify(message);
    let sentCount = 0;

    this.clients.forEach((clients) => {
      clients.forEach((client) => {
        if (client.userId === userId && client.readyState === WebSocket.OPEN) {
          client.send(payload);
          sentCount++;
        }
      });
    });

    console.log(`[WebSocket] Broadcast to user ${userId}: ${sentCount} clients`);
  }

  // Broadcast to all connected clients
  public broadcastToAll(message: any) {
    const payload = JSON.stringify(message);
    let sentCount = 0;

    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
        sentCount++;
      }
    });

    console.log(`[WebSocket] Broadcast to all: ${sentCount} clients`);
  }

  // Get connection statistics
  public getStats() {
    const stats = {
      totalClients: this.wss.clients.size,
      farmConnections: {} as Record<number, number>,
    };

    this.clients.forEach((clients, farmId) => {
      stats.farmConnections[farmId] = clients.size;
    });

    return stats;
  }

  // Cleanup
  public close() {
    clearInterval(this.heartbeatInterval);
    this.wss.close();
    console.log('[WebSocket] Server closed');
  }
}

// Export singleton instance
let wsServer: FarmKonnectWebSocketServer | null = null;

export function initializeWebSocketServer(server: any) {
  if (!wsServer) {
    wsServer = new FarmKonnectWebSocketServer(server);
    console.log('[WebSocket] Server initialized');
  }
  return wsServer;
}

export function getWebSocketServer(): FarmKonnectWebSocketServer | null {
  return wsServer;
}

// Helper function to broadcast to a specific user
export function broadcastToUser(userId: number, message: any) {
  if (wsServer) {
    wsServer.broadcastToUser(userId, message);
  } else {
    console.warn('[WebSocket] Server not initialized, cannot broadcast to user');
  }
}

// Helper function to broadcast to a specific farm
export function broadcastToFarm(farmId: number, message: any) {
  if (wsServer) {
    wsServer.broadcastToFarm(farmId, message);
  } else {
    console.warn('[WebSocket] Server not initialized, cannot broadcast to farm');
  }
}

// Real-time update functions
export function broadcastSupplyChainUpdate(productId: string, status: string, location: string, metadata?: any) {
  const message = {
    type: 'supply_chain_update',
    data: {
      productId,
      status,
      location,
      metadata,
      timestamp: new Date().toISOString(),
    },
  };
  if (wsServer) {
    wsServer.broadcastToAll(message);
  }
}

export function broadcastMarketplaceUpdate(productId: string, action: string, price?: number) {
  const message = {
    type: 'marketplace_update',
    data: {
      productId,
      action,
      price,
      timestamp: new Date().toISOString(),
    },
  };
  if (wsServer) {
    wsServer.broadcastToAll(message);
  }
}

export function broadcastForumUpdate(postId: string, action: string, data?: any) {
  const message = {
    type: 'forum_update',
    data: {
      postId,
      action,
      data,
      timestamp: new Date().toISOString(),
    },
  };
  if (wsServer) {
    wsServer.broadcastToAll(message);
  }
}

export function broadcastCooperativeUpdate(cooperativeId: number, action: string, data?: any) {
  const message = {
    type: 'cooperative_update',
    data: {
      cooperativeId,
      action,
      data,
      timestamp: new Date().toISOString(),
    },
  };
  if (wsServer) {
    wsServer.broadcastToAll(message);
  }
}

// Real-time task and shift updates
export function broadcastTaskUpdate(farmId: number, taskId: number, action: string, data?: any) {
  const message = {
    type: 'task_update',
    data: {
      taskId,
      action,
      data,
      timestamp: new Date().toISOString(),
    },
  };
  if (wsServer) {
    wsServer.broadcastToFarm(farmId, message);
  }
}

export function broadcastShiftUpdate(farmId: number, shiftId: number, action: string, data?: any) {
  const message = {
    type: 'shift_update',
    data: {
      shiftId,
      action,
      data,
      timestamp: new Date().toISOString(),
    },
  };
  if (wsServer) {
    wsServer.broadcastToFarm(farmId, message);
  }
}

export function broadcastWorkerAvailabilityUpdate(farmId: number, workerId: number, availability: any) {
  const message = {
    type: 'worker_availability_update',
    data: {
      workerId,
      availability,
      timestamp: new Date().toISOString(),
    },
  };
  if (wsServer) {
    wsServer.broadcastToFarm(farmId, message);
  }
}

export function broadcastTaskStatusChange(farmId: number, taskId: number, workerId: number, oldStatus: string, newStatus: string) {
  const message = {
    type: 'task_status_change',
    data: {
      taskId,
      workerId,
      oldStatus,
      newStatus,
      timestamp: new Date().toISOString(),
    },
  };
  if (wsServer) {
    wsServer.broadcastToFarm(farmId, message);
  }
}

export function broadcastShiftAssignment(farmId: number, shiftId: number, workerId: number, workerName: string) {
  const message = {
    type: 'shift_assigned',
    data: {
      shiftId,
      workerId,
      workerName,
      timestamp: new Date().toISOString(),
    },
  };
  if (wsServer) {
    wsServer.broadcastToFarm(farmId, message);
    wsServer.broadcastToUser(workerId, message);
  }
}
