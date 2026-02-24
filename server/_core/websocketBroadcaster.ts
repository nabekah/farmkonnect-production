import type { FarmKonnectWebSocketServer } from './websocket';
import { databaseChangeListener, type DatabaseChangeEvent } from './databaseChangeListener';

/**
 * WebSocket Broadcaster
 * Handles broadcasting database changes to connected WebSocket clients
 */

export class WebSocketBroadcaster {
  private static instance: WebSocketBroadcaster;
  private wsServer: FarmKonnectWebSocketServer | null = null;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): WebSocketBroadcaster {
    if (!WebSocketBroadcaster.instance) {
      WebSocketBroadcaster.instance = new WebSocketBroadcaster();
    }
    return WebSocketBroadcaster.instance;
  }

  /**
   * Initialize the broadcaster with WebSocket server
   */
  initialize(wsServer: FarmKonnectWebSocketServer) {
    if (this.isInitialized) {
      console.warn('[WebSocketBroadcaster] Already initialized');
      return;
    }

    this.wsServer = wsServer;
    this.setupListeners();
    this.isInitialized = true;
    console.log('[WebSocketBroadcaster] Initialized');
  }

  /**
   * Setup listeners for database changes
   */
  private setupListeners() {
    // Listen for all database changes
    databaseChangeListener.onChange((event: DatabaseChangeEvent) => {
      this.broadcastToFarm(event.farmId, {
        type: 'database_update',
        event: event.type,
        table: event.table,
        data: event.data,
        timestamp: event.timestamp,
      });
    });

    // Listen for specific table changes
    const tables = [
      'farms', 'crops', 'livestock', 'inventory', 'weather_data',
      'alerts', 'notifications', 'activities', 'reports', 'users',
      'financial_records', 'expenses', 'income', 'tasks', 'schedules'
    ];

    tables.forEach(table => {
      databaseChangeListener.onTableChange(table, (event: DatabaseChangeEvent) => {
        console.log(`[WebSocketBroadcaster] Broadcasting ${event.type} on ${table}`);
        this.broadcastToFarm(event.farmId, {
          type: `${table}_update`,
          event: event.type,
          data: event.data,
          timestamp: event.timestamp,
        });
      });
    });
  }

  /**
   * Broadcast message to all clients in a farm
   */
  private broadcastToFarm(farmId: number, message: Record<string, any>) {
    if (!this.wsServer) {
      console.warn('[WebSocketBroadcaster] WebSocket server not initialized');
      return;
    }

    this.wsServer.broadcastToFarm(farmId, message);
  }

  /**
   * Broadcast message to specific client
   */
  broadcastToClient(userId: number, message: Record<string, any>) {
    if (!this.wsServer) {
      console.warn('[WebSocketBroadcaster] WebSocket server not initialized');
      return;
    }

    this.wsServer.broadcastToClient(userId, message);
  }

  /**
   * Broadcast message to all connected clients
   */
  broadcastToAll(message: Record<string, any>) {
    if (!this.wsServer) {
      console.warn('[WebSocketBroadcaster] WebSocket server not initialized');
      return;
    }

    this.wsServer.broadcastToAll(message);
  }

  /**
   * Get broadcaster status
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      wsServerConnected: this.wsServer !== null,
      listenerCount: databaseChangeListener.getListenerCount(),
    };
  }
}

export const webSocketBroadcaster = WebSocketBroadcaster.getInstance();
