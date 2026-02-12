/**
 * WebSocket Service for Real-time Updates
 * Handles supply chain movements, cooperative marketplace activity, and forum updates
 */

type MessageCallback = (data: any) => void;
type ConnectionCallback = () => void;

interface WebSocketMessage {
  type: "supply_chain_update" | "marketplace_update" | "forum_update" | "notification" | "ping";
  data: any;
  timestamp: number;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private messageHandlers: Map<string, MessageCallback[]> = new Map();
  private connectionHandlers: ConnectionCallback[] = [];
  private disconnectionHandlers: ConnectionCallback[] = [];
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(url: string) {
    this.url = url;
  }

  /**
   * Connect to WebSocket server
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log("WebSocket connected");
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.connectionHandlers.forEach(handler => handler());
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error("Error parsing WebSocket message:", error);
          }
        };

        this.ws.onerror = (error) => {
          // Suppress WebSocket connection errors - they're expected when server is unavailable
          if (process.env.NODE_ENV === 'development') {
            console.debug("WebSocket connection error (expected):", error);
          }
          // Don't reject - allow reconnection attempts
        };

        this.ws.onclose = () => {
          console.log("WebSocket disconnected");
          this.stopHeartbeat();
          this.disconnectionHandlers.forEach(handler => handler());
          this.attemptReconnect();
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.ws) {
      this.stopHeartbeat();
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Send message to server
   */
  send(message: WebSocketMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn("WebSocket is not connected");
    }
  }

  /**
   * Subscribe to message type
   */
  on(messageType: string, callback: MessageCallback): () => void {
    if (!this.messageHandlers.has(messageType)) {
      this.messageHandlers.set(messageType, []);
    }
    this.messageHandlers.get(messageType)!.push(callback);

    // Return unsubscribe function
    return () => {
      const handlers = this.messageHandlers.get(messageType);
      if (handlers) {
        const index = handlers.indexOf(callback);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }

  /**
   * Subscribe to connection event
   */
  onConnect(callback: ConnectionCallback): () => void {
    this.connectionHandlers.push(callback);
    return () => {
      const index = this.connectionHandlers.indexOf(callback);
      if (index > -1) {
        this.connectionHandlers.splice(index, 1);
      }
    };
  }

  /**
   * Subscribe to disconnection event
   */
  onDisconnect(callback: ConnectionCallback): () => void {
    this.disconnectionHandlers.push(callback);
    return () => {
      const index = this.disconnectionHandlers.indexOf(callback);
      if (index > -1) {
        this.disconnectionHandlers.splice(index, 1);
      }
    };
  }

  /**
   * Emit supply chain update
   */
  emitSupplyChainUpdate(productId: string, status: string, location: string, metadata?: any): void {
    this.send({
      type: "supply_chain_update",
      data: {
        productId,
        status,
        location,
        metadata,
        timestamp: Date.now(),
      },
      timestamp: Date.now(),
    });
  }

  /**
   * Emit marketplace update
   */
  emitMarketplaceUpdate(productId: string, action: "listed" | "sold" | "updated", price?: number): void {
    this.send({
      type: "marketplace_update",
      data: {
        productId,
        action,
        price,
        timestamp: Date.now(),
      },
      timestamp: Date.now(),
    });
  }

  /**
   * Emit forum update
   */
  emitForumUpdate(postId: string, action: "created" | "replied" | "liked", data?: any): void {
    this.send({
      type: "forum_update",
      data: {
        postId,
        action,
        data,
        timestamp: Date.now(),
      },
      timestamp: Date.now(),
    });
  }

  /**
   * Handle incoming message
   */
  private handleMessage(message: WebSocketMessage): void {
    // Handle ping/pong
    if (message.type === "ping") {
      this.send({
        type: "ping",
        data: { pong: true },
        timestamp: Date.now(),
      });
      return;
    }

    // Dispatch to handlers
    const handlers = this.messageHandlers.get(message.type);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(message.data);
        } catch (error) {
          console.error("Error in message handler:", error);
        }
      });
    }
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send({
          type: "ping",
          data: {},
          timestamp: Date.now(),
        });
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Attempt to reconnect
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * this.reconnectAttempts;
      console.log(`Attempting to reconnect in ${delay}ms...`);

      setTimeout(() => {
        this.connect().catch(error => {
          console.error("Reconnection failed:", error);
        });
      }, delay);
    } else {
      console.error("Max reconnection attempts reached");
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

// Create singleton instance
const wsUrl = import.meta.env.VITE_WS_URL || `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`;
export const wsService = new WebSocketService(wsUrl);

// Auto-connect on module load (only in browser)
if (typeof window !== "undefined" && typeof document !== "undefined") {
  // Delay connection to ensure DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      wsService.connect().catch(error => {
        console.warn("WebSocket connection failed on startup:", error);
      });
    });
  } else {
    wsService.connect().catch(error => {
      console.warn("WebSocket connection failed on startup:", error);
    });
  }
}

export default wsService;
