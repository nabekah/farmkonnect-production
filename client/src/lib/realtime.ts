import { useEffect, useRef, useCallback, useState } from 'react';

export type RealtimeEventType = 'connect' | 'disconnect' | 'message' | 'error' | 'reconnect';

export interface RealtimeEvent {
  /**
   * Event type
   */
  type: RealtimeEventType;
  /**
   * Event data
   */
  data?: any;
  /**
   * Error message
   */
  error?: string;
  /**
   * Timestamp
   */
  timestamp: number;
}

export interface RealtimeOptions {
  /**
   * Reconnect on disconnect
   */
  autoReconnect?: boolean;
  /**
   * Max reconnect attempts
   */
  maxReconnectAttempts?: number;
  /**
   * Reconnect delay in ms
   */
  reconnectDelay?: number;
  /**
   * Heartbeat interval in ms
   */
  heartbeatInterval?: number;
  /**
   * Message timeout in ms
   */
  messageTimeout?: number;
}

/**
 * Realtime Manager
 * 
 * Manages WebSocket and SSE connections with reconnection logic
 */
export class RealtimeManager {
  private ws: WebSocket | null = null;
  private eventSource: EventSource | null = null;
  private listeners: Map<string, Set<(event: RealtimeEvent) => void>> = new Map();
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private messageTimeouts: Map<string, NodeJS.Timeout> = new Map();

  constructor(
    private url: string,
    private options: RealtimeOptions = {}
  ) {
    this.options = {
      autoReconnect: true,
      maxReconnectAttempts: 5,
      reconnectDelay: 1000,
      heartbeatInterval: 30000,
      messageTimeout: 5000,
      ...options,
    };
  }

  /**
   * Connect using WebSocket
   */
  connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          this.reconnectAttempts = 0;
          this.emit('connect');
          this.startHeartbeat();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.emit('message', data);
          } catch (error) {
            this.emit('message', event.data);
          }
        };

        this.ws.onerror = (error) => {
          this.emit('error', { error: 'WebSocket error' });
          reject(error);
        };

        this.ws.onclose = () => {
          this.emit('disconnect');
          this.stopHeartbeat();
          if (this.options.autoReconnect) {
            this.scheduleReconnect();
          }
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Connect using Server-Sent Events
   */
  connectSSE(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.eventSource = new EventSource(this.url);

        this.eventSource.onopen = () => {
          this.reconnectAttempts = 0;
          this.emit('connect');
          resolve();
        };

        this.eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.emit('message', data);
          } catch (error) {
            this.emit('message', event.data);
          }
        };

        this.eventSource.onerror = () => {
          this.emit('error', { error: 'SSE error' });
          if (this.options.autoReconnect) {
            this.scheduleReconnect();
          }
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Send message via WebSocket
   */
  send(data: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  /**
   * Subscribe to events
   */
  on(type: string, callback: (event: RealtimeEvent) => void): () => void {
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
   * Emit event
   */
  private emit(type: string, data?: any): void {
    const event: RealtimeEvent = {
      type: type as RealtimeEventType,
      data,
      timestamp: Date.now(),
    };

    const callbacks = this.listeners.get(type);
    if (callbacks) {
      callbacks.forEach((callback) => callback(event));
    }

    // Also emit to 'all' listeners
    const allCallbacks = this.listeners.get('*');
    if (allCallbacks) {
      allCallbacks.forEach((callback) => callback(event));
    }
  }

  /**
   * Start heartbeat
   */
  private startHeartbeat(): void {
    if (this.options.heartbeatInterval && this.options.heartbeatInterval > 0) {
      this.heartbeatTimer = setInterval(() => {
        this.send({ type: 'ping' });
      }, this.options.heartbeatInterval);
    }
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Schedule reconnect
   */
  private scheduleReconnect(): void {
    if (
      this.reconnectAttempts >= (this.options.maxReconnectAttempts || 5)
    ) {
      this.emit('error', { error: 'Max reconnect attempts reached' });
      return;
    }

    this.reconnectAttempts++;
    const delay = (this.options.reconnectDelay || 1000) * this.reconnectAttempts;

    this.reconnectTimer = setTimeout(() => {
      this.emit('reconnect');
      this.connectWebSocket().catch(() => {
        this.scheduleReconnect();
      });
    }, delay);
  }

  /**
   * Disconnect
   */
  disconnect(): void {
    this.stopHeartbeat();

    if (this.reconnectTimer) {
      clearInterval(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.messageTimeouts.forEach((timeout) => clearTimeout(timeout));
    this.messageTimeouts.clear();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    this.emit('disconnect');
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return (
      (this.ws !== null && this.ws.readyState === WebSocket.OPEN) ||
      (this.eventSource !== null && this.eventSource.readyState === EventSource.OPEN)
    );
  }
}

/**
 * useRealtime Hook
 * 
 * React hook for real-time features
 */
export function useRealtime(
  url: string,
  options: RealtimeOptions = {}
) {
  const managerRef = useRef<RealtimeManager | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastMessage, setLastMessage] = useState<any>(null);

  useEffect(() => {
    managerRef.current = new RealtimeManager(url, options);
    const manager = managerRef.current;

    // Connect
    manager.connectWebSocket().catch(() => {
      // Fallback to SSE
      manager.connectSSE().catch((err) => {
        setError(err.message);
      });
    });

    // Subscribe to events
    const unsubscribeConnect = manager.on('connect', () => {
      setIsConnected(true);
      setError(null);
    });

    const unsubscribeDisconnect = manager.on('disconnect', () => {
      setIsConnected(false);
    });

    const unsubscribeMessage = manager.on('message', (event) => {
      setLastMessage(event.data);
    });

    const unsubscribeError = manager.on('error', (event) => {
      setError(event.data?.error || 'Unknown error');
    });

    return () => {
      unsubscribeConnect();
      unsubscribeDisconnect();
      unsubscribeMessage();
      unsubscribeError();
      manager.disconnect();
    };
  }, [url, options]);

  const send = useCallback((data: any) => {
    if (managerRef.current) {
      managerRef.current.send(data);
    }
  }, []);

  const subscribe = useCallback((type: string, callback: (event: RealtimeEvent) => void) => {
    if (managerRef.current) {
      return managerRef.current.on(type, callback);
    }
    return () => {};
  }, []);

  return {
    isConnected,
    error,
    lastMessage,
    send,
    subscribe,
    disconnect: () => managerRef.current?.disconnect(),
  };
}

/**
 * useBroadcast Hook
 * 
 * Simple broadcast channel for real-time updates
 */
export function useBroadcast(channel: string) {
  const [data, setData] = useState<any>(null);
  const broadcastRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    try {
      broadcastRef.current = new BroadcastChannel(channel);

      broadcastRef.current.onmessage = (event) => {
        setData(event.data);
      };

      return () => {
        broadcastRef.current?.close();
      };
    } catch (error) {
      console.warn('BroadcastChannel not supported');
    }
  }, [channel]);

  const send = useCallback((message: any) => {
    if (broadcastRef.current) {
      broadcastRef.current.postMessage(message);
    }
  }, []);

  return {
    data,
    send,
  };
}
