import { WebSocketServer, WebSocket } from "ws";
import { IncomingMessage } from "http";

export type BulkOperationType = "batch-edit" | "import" | "export" | "bulk-register";
export type OperationStatus = "pending" | "in-progress" | "completed" | "failed";

export interface BulkOperationEvent {
  id: string;
  type: BulkOperationType;
  status: OperationStatus;
  farmId: number;
  userId: number;
  current: number;
  total: number;
  message?: string;
  timestamp: number;
  successCount?: number;
  failureCount?: number;
}

export interface WebSocketMessage {
  action: "subscribe" | "unsubscribe" | "update" | "complete" | "error";
  operationId?: string;
  farmId?: number;
  event?: BulkOperationEvent;
  error?: string;
}

class BulkOperationWebSocketManager {
  private wss: WebSocketServer;
  private operationSubscribers = new Map<string, Set<WebSocket>>();
  private farmSubscribers = new Map<number, Set<WebSocket>>();
  private userOperations = new Map<number, Set<string>>();
  private activeOperations = new Map<string, BulkOperationEvent>();

  constructor(wss: WebSocketServer) {
    this.wss = wss;
  }

  /**
   * Handle new WebSocket connection
   */
  handleConnection(ws: WebSocket, req: IncomingMessage) {
    console.log(`[WebSocket] New connection from ${req.socket.remoteAddress}`);

    ws.on("message", (data: Buffer) => {
      try {
        const message: WebSocketMessage = JSON.parse(data.toString());
        this.handleMessage(ws, message);
      } catch (error) {
        console.error("[WebSocket] Message parse error:", error);
        ws.send(JSON.stringify({
          action: "error",
          error: "Invalid message format",
        }));
      }
    });

    ws.on("close", () => {
      this.handleDisconnection(ws);
    });

    ws.on("error", (error) => {
      console.error("[WebSocket] Connection error:", error);
    });
  }

  /**
   * Handle incoming WebSocket message
   */
  private handleMessage(ws: WebSocket, message: WebSocketMessage) {
    switch (message.action) {
      case "subscribe":
        if (message.operationId) {
          this.subscribeToOperation(ws, message.operationId);
        }
        if (message.farmId) {
          this.subscribeToFarm(ws, message.farmId);
        }
        break;

      case "unsubscribe":
        if (message.operationId) {
          this.unsubscribeFromOperation(ws, message.operationId);
        }
        if (message.farmId) {
          this.unsubscribeFromFarm(ws, message.farmId);
        }
        break;

      case "update":
        if (message.event) {
          this.broadcastOperationUpdate(message.event);
        }
        break;

      case "complete":
        if (message.event) {
          this.broadcastOperationComplete(message.event);
        }
        break;

      case "error":
        if (message.event) {
          this.broadcastOperationError(message.event);
        }
        break;
    }
  }

  /**
   * Subscribe to operation updates
   */
  private subscribeToOperation(ws: WebSocket, operationId: string) {
    if (!this.operationSubscribers.has(operationId)) {
      this.operationSubscribers.set(operationId, new Set());
    }
    this.operationSubscribers.get(operationId)!.add(ws);

    // Send current operation state if exists
    const operation = this.activeOperations.get(operationId);
    if (operation) {
      ws.send(JSON.stringify({
        action: "update",
        event: operation,
      }));
    }

    console.log(`[WebSocket] Subscribed to operation: ${operationId}`);
  }

  /**
   * Unsubscribe from operation updates
   */
  private unsubscribeFromOperation(ws: WebSocket, operationId: string) {
    const subscribers = this.operationSubscribers.get(operationId);
    if (subscribers) {
      subscribers.delete(ws);
      if (subscribers.size === 0) {
        this.operationSubscribers.delete(operationId);
      }
    }
  }

  /**
   * Subscribe to farm updates
   */
  private subscribeToFarm(ws: WebSocket, farmId: number) {
    if (!this.farmSubscribers.has(farmId)) {
      this.farmSubscribers.set(farmId, new Set());
    }
    this.farmSubscribers.get(farmId)!.add(ws);

    console.log(`[WebSocket] Subscribed to farm: ${farmId}`);
  }

  /**
   * Unsubscribe from farm updates
   */
  private unsubscribeFromFarm(ws: WebSocket, farmId: number) {
    const subscribers = this.farmSubscribers.get(farmId);
    if (subscribers) {
      subscribers.delete(ws);
      if (subscribers.size === 0) {
        this.farmSubscribers.delete(farmId);
      }
    }
  }

  /**
   * Handle client disconnection
   */
  private handleDisconnection(ws: WebSocket) {
    // Remove from all subscriptions
    for (const [, subscribers] of this.operationSubscribers) {
      subscribers.delete(ws);
    }
    for (const [, subscribers] of this.farmSubscribers) {
      subscribers.delete(ws);
    }
    console.log("[WebSocket] Client disconnected");
  }

  /**
   * Broadcast operation progress update
   */
  broadcastOperationUpdate(event: BulkOperationEvent) {
    this.activeOperations.set(event.id, event);

    // Send to operation subscribers
    const operationSubscribers = this.operationSubscribers.get(event.id);
    if (operationSubscribers) {
      const message = JSON.stringify({
        action: "update",
        event,
      });
      operationSubscribers.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(message);
        }
      });
    }

    // Send to farm subscribers
    const farmSubscribers = this.farmSubscribers.get(event.farmId);
    if (farmSubscribers) {
      const message = JSON.stringify({
        action: "update",
        event,
      });
      farmSubscribers.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(message);
        }
      });
    }
  }

  /**
   * Broadcast operation completion
   */
  broadcastOperationComplete(event: BulkOperationEvent) {
    event.status = "completed";
    this.activeOperations.set(event.id, event);

    // Send to operation subscribers
    const operationSubscribers = this.operationSubscribers.get(event.id);
    if (operationSubscribers) {
      const message = JSON.stringify({
        action: "complete",
        event,
      });
      operationSubscribers.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(message);
        }
      });
    }

    // Send to farm subscribers
    const farmSubscribers = this.farmSubscribers.get(event.farmId);
    if (farmSubscribers) {
      const message = JSON.stringify({
        action: "complete",
        event,
      });
      farmSubscribers.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(message);
        }
      });
    }

    // Clean up after 1 minute
    setTimeout(() => {
      this.activeOperations.delete(event.id);
    }, 60000);
  }

  /**
   * Broadcast operation error
   */
  broadcastOperationError(event: BulkOperationEvent) {
    event.status = "failed";
    this.activeOperations.set(event.id, event);

    // Send to operation subscribers
    const operationSubscribers = this.operationSubscribers.get(event.id);
    if (operationSubscribers) {
      const message = JSON.stringify({
        action: "error",
        event,
      });
      operationSubscribers.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(message);
        }
      });
    }

    // Send to farm subscribers
    const farmSubscribers = this.farmSubscribers.get(event.farmId);
    if (farmSubscribers) {
      const message = JSON.stringify({
        action: "error",
        event,
      });
      farmSubscribers.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(message);
        }
      });
    }
  }

  /**
   * Get active operations for a farm
   */
  getActiveOperations(farmId: number): BulkOperationEvent[] {
    return Array.from(this.activeOperations.values()).filter(
      (op) => op.farmId === farmId
    );
  }

  /**
   * Get operation status
   */
  getOperationStatus(operationId: string): BulkOperationEvent | undefined {
    return this.activeOperations.get(operationId);
  }
}

export let bulkOperationManager: BulkOperationWebSocketManager;

export function initializeBulkOperationWebSocket(wss: WebSocketServer) {
  bulkOperationManager = new BulkOperationWebSocketManager(wss);
  return bulkOperationManager;
}
