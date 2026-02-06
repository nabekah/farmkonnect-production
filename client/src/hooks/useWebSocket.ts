import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';

export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

interface UseWebSocketOptions {
  onTaskCreated?: (data: any) => void;
  onTaskUpdated?: (data: any) => void;
  onActivityCreated?: (data: any) => void;
  onActivityUpdated?: (data: any) => void;
  onMessage?: (message: WebSocketMessage) => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { user } = useAuth();
  const { onTaskCreated, onTaskUpdated, onActivityCreated, onActivityUpdated, onMessage } = options;
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const reconnectAttemptsRef = useRef<number>(0);

  const connect = useCallback(() => {
    if (!user) {
      console.log('[WebSocket] No user, skipping connection');
      return;
    }

    // Get token from cookie or localStorage
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('auth_token='))
      ?.split('=')[1] || localStorage.getItem('auth_token') || 'demo_token';

    // Determine WebSocket URL
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws?token=${token}`;

    console.log('[WebSocket] Connecting to:', wsUrl);

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('[WebSocket] Connected');
      setIsConnected(true);
      reconnectAttemptsRef.current = 0;
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('[WebSocket] Received:', message);
        setLastMessage(message);

        // Call generic message handler if provided
        if (onMessage) {
          onMessage(message);
        }

        // Handle specific event types
        if (message.type === 'task_created' && onTaskCreated) {
          onTaskCreated(message.data);
        } else if (message.type === 'task_updated' && onTaskUpdated) {
          onTaskUpdated(message.data);
        } else if (message.type === 'activity_created' && onActivityCreated) {
          onActivityCreated(message.data);
        } else if (message.type === 'activity_updated' && onActivityUpdated) {
          onActivityUpdated(message.data);
        }
      } catch (error) {
        console.error('[WebSocket] Error parsing message:', error);
      }
    };

    ws.onclose = (event) => {
      console.log('[WebSocket] Disconnected:', event.code, event.reason);
      setIsConnected(false);
      wsRef.current = null;

      // Don't reconnect if closed intentionally (code 1000)
      if (event.code === 1000) {
        setIsReconnecting(false);
        return;
      }

      // Exponential backoff reconnection
      const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
      reconnectAttemptsRef.current++;

      console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current})`);
      setIsReconnecting(true);

      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, delay);
    };

    ws.onerror = (error) => {
      console.error('[WebSocket] Error:', error);
    };

    wsRef.current = ws;
  }, [user]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounted');
      }
    };
  }, [connect]);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      console.log('[WebSocket] Sent:', message);
    } else {
      console.warn('[WebSocket] Not connected, cannot send message');
    }
  }, []);

  return {
    isConnected,
    isReconnecting,
    lastMessage,
    sendMessage,
  };
}
