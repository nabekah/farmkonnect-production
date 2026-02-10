import { useEffect, useRef, useState, useCallback } from 'react';

export interface WebSocketNotification {
  notificationType: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  relatedId?: number;
  relatedType?: string;
  actionUrl?: string;
  timestamp: number;
}

interface WebSocketMessage {
  type: string;
  data?: any;
  message?: string;
  userId?: number;
  timestamp?: number;
}

export function useWebSocketNotifications(userId: number | null) {
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<WebSocketNotification[]>([]);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = useRef(1000);

  const connect = useCallback(() => {
    if (!userId) return;

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/ws`;
      
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log('[WebSocket] Connected');
        setIsConnected(true);
        reconnectAttempts.current = 0;
        reconnectDelay.current = 1000;

        // Subscribe to user notifications
        if (ws.current) {
          ws.current.send(JSON.stringify({
            type: 'subscribe',
            userId,
            timestamp: Date.now(),
          }));
        }
      };

      ws.current.onmessage = (event: MessageEvent) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);

          switch (message.type) {
            case 'notification':
              if (message.data) {
                setNotifications((prev) => [
                  ...prev,
                  message.data as WebSocketNotification,
                ]);
              }
              break;

            case 'subscribed':
              console.log('[WebSocket] Successfully subscribed to notifications');
              break;

            case 'pong':
              // Heartbeat response
              break;

            case 'error':
              console.error('[WebSocket] Server error:', message.message);
              break;

            default:
              console.log('[WebSocket] Unknown message type:', message.type);
          }
        } catch (error) {
          console.error('[WebSocket] Failed to parse message:', error);
        }
      };

      ws.current.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
        setIsConnected(false);
      };

      ws.current.onclose = () => {
        console.log('[WebSocket] Disconnected');
        setIsConnected(false);

        // Attempt to reconnect
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          console.log(
            `[WebSocket] Reconnecting in ${reconnectDelay.current}ms (attempt ${reconnectAttempts.current}/${maxReconnectAttempts})`
          );
          setTimeout(() => {
            connect();
          }, reconnectDelay.current);
          reconnectDelay.current = Math.min(reconnectDelay.current * 2, 30000);
        } else {
          console.error('[WebSocket] Max reconnection attempts reached');
        }
      };
    } catch (error) {
      console.error('[WebSocket] Failed to connect:', error);
      setIsConnected(false);
    }
  }, [userId]);

  const disconnect = useCallback(() => {
    if (ws.current) {
      ws.current.close(1000, 'Client disconnecting');
      ws.current = null;
    }
    setIsConnected(false);
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const removeNotification = useCallback((index: number) => {
    setNotifications((prev) => prev.filter((_, i) => i !== index));
  }, []);

  useEffect(() => {
    if (userId) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [userId, connect, disconnect]);

  return {
    isConnected,
    notifications,
    clearNotifications,
    removeNotification,
    connect,
    disconnect,
  };
}
