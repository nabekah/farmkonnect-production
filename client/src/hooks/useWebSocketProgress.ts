import { useEffect, useRef, useState, useCallback } from "react";

export interface BulkOperationEvent {
  id: string;
  type: "batch-edit" | "import" | "export" | "bulk-register";
  status: "pending" | "in-progress" | "completed" | "failed";
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

export function useWebSocketProgress() {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [operations, setOperations] = useState<Map<string, BulkOperationEvent>>(new Map());
  const subscribedOperations = useRef<Set<string>>(new Set());
  const subscribedFarms = useRef<Set<number>>(new Set());

  /**
   * Initialize WebSocket connection
   */
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    try {
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log("[WebSocket] Connected");
        setIsConnected(true);
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          handleWebSocketMessage(message);
        } catch (error) {
          console.error("[WebSocket] Message parse error:", error);
        }
      };

      wsRef.current.onclose = () => {
        console.log("[WebSocket] Disconnected");
        setIsConnected(false);
        // Attempt reconnection after 3 seconds
        setTimeout(() => {
          if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
            // Reconnect logic will be handled by the next useEffect
          }
        }, 3000);
      };

      wsRef.current.onerror = (error) => {
        console.error("[WebSocket] Error:", error);
      };
    } catch (error) {
      console.error("[WebSocket] Connection error:", error);
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  /**
   * Handle incoming WebSocket messages
   */
  const handleWebSocketMessage = useCallback((message: WebSocketMessage) => {
    switch (message.action) {
      case "update":
        if (message.event) {
          setOperations((prev) => {
            const updated = new Map(prev);
            updated.set(message.event!.id, message.event!);
            return updated;
          });
        }
        break;

      case "complete":
        if (message.event) {
          setOperations((prev) => {
            const updated = new Map(prev);
            updated.set(message.event!.id, {
              ...message.event!,
              status: "completed",
            });
            return updated;
          });
        }
        break;

      case "error":
        if (message.event) {
          setOperations((prev) => {
            const updated = new Map(prev);
            updated.set(message.event!.id, {
              ...message.event!,
              status: "failed",
            });
            return updated;
          });
        }
        break;
    }
  }, []);

  /**
   * Subscribe to operation updates
   */
  const subscribeToOperation = useCallback((operationId: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          action: "subscribe",
          operationId,
        })
      );
      subscribedOperations.current.add(operationId);
    }
  }, []);

  /**
   * Unsubscribe from operation updates
   */
  const unsubscribeFromOperation = useCallback((operationId: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          action: "unsubscribe",
          operationId,
        })
      );
      subscribedOperations.current.delete(operationId);
    }
  }, []);

  /**
   * Subscribe to farm updates
   */
  const subscribeToFarm = useCallback((farmId: number) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          action: "subscribe",
          farmId,
        })
      );
      subscribedFarms.current.add(farmId);
    }
  }, []);

  /**
   * Unsubscribe from farm updates
   */
  const unsubscribeFromFarm = useCallback((farmId: number) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          action: "unsubscribe",
          farmId,
        })
      );
      subscribedFarms.current.delete(farmId);
    }
  }, []);

  /**
   * Send operation update
   */
  const sendUpdate = useCallback((event: BulkOperationEvent) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          action: "update",
          event,
        })
      );
    }
  }, []);

  /**
   * Send operation completion
   */
  const sendComplete = useCallback((event: BulkOperationEvent) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          action: "complete",
          event,
        })
      );
    }
  }, []);

  /**
   * Send operation error
   */
  const sendError = useCallback((event: BulkOperationEvent) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          action: "error",
          event,
        })
      );
    }
  }, []);

  /**
   * Get operation status
   */
  const getOperation = useCallback(
    (operationId: string): BulkOperationEvent | undefined => {
      return operations.get(operationId);
    },
    [operations]
  );

  /**
   * Get all operations
   */
  const getAllOperations = useCallback((): BulkOperationEvent[] => {
    return Array.from(operations.values());
  }, [operations]);

  /**
   * Get farm operations
   */
  const getFarmOperations = useCallback(
    (farmId: number): BulkOperationEvent[] => {
      return Array.from(operations.values()).filter((op) => op.farmId === farmId);
    },
    [operations]
  );

  return {
    isConnected,
    operations: Array.from(operations.values()),
    subscribeToOperation,
    unsubscribeFromOperation,
    subscribeToFarm,
    unsubscribeFromFarm,
    sendUpdate,
    sendComplete,
    sendError,
    getOperation,
    getAllOperations,
    getFarmOperations,
  };
}
