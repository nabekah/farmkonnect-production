import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';

export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

interface UseWebSocketOptions {
  onTaskCreated?: (data: any) => void;
  onTaskUpdated?: (data: any) => void;
  onActivityCreated?: (data: any) => void;
  onActivityUpdated?: (data: any) => void;
  onExpenseCreated?: (data: any) => void;
  onRevenueCreated?: (data: any) => void;
  onExpenseUpdated?: (data: any) => void;
  onRevenueUpdated?: (data: any) => void;
  onFinancialDataRefresh?: (data: any) => void;
  onMessage?: (message: WebSocketMessage) => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { user } = useAuth();
  const { onTaskCreated, onTaskUpdated, onActivityCreated, onActivityUpdated, onExpenseCreated, onRevenueCreated, onExpenseUpdated, onRevenueUpdated, onFinancialDataRefresh, onMessage } = options;
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const reconnectAttemptsRef = useRef<number>(0);
  const maxReconnectAttemptsRef = useRef<number>(3); // Reduced from 10 to 3 attempts
  const wsFailedRef = useRef<boolean>(false); // Track if WebSocket has permanently failed

  // Get WebSocket token from backend
  const { data: tokenData, isLoading: isLoadingToken } = trpc.websocketToken.getToken.useQuery(
    undefined,
    {
      enabled: !!user, // Only fetch token if user is authenticated
      staleTime: 50 * 60 * 1000, // Cache token for 50 minutes (expires in 60)
      refetchInterval: 50 * 60 * 1000, // Refresh token every 50 minutes
    }
  );

  const connect = useCallback(() => {
    if (!user) {
      console.log('[WebSocket] No user, skipping connection');
      return;
    }

    // Skip connection if WebSocket has permanently failed
    if (wsFailedRef.current) {
      console.log('[WebSocket] WebSocket unavailable, skipping connection attempt');
      return;
    }

    // Use JWT token from backend
    const token = tokenData?.token;
    if (!token) {
      console.log('[WebSocket] Waiting for token from backend...');
      return;
    }

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
        } else if (message.type === 'expense_created' && onExpenseCreated) {
          onExpenseCreated(message.data);
        } else if (message.type === 'revenue_created' && onRevenueCreated) {
          onRevenueCreated(message.data);
        } else if (message.type === 'expense_updated' && onExpenseUpdated) {
          onExpenseUpdated(message.data);
        } else if (message.type === 'revenue_updated' && onRevenueUpdated) {
          onRevenueUpdated(message.data);
        } else if (message.type === 'financial_data_refresh' && onFinancialDataRefresh) {
          onFinancialDataRefresh(message.data);
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

      // Check max reconnection attempts
      if (reconnectAttemptsRef.current >= maxReconnectAttemptsRef.current) {
        console.warn('[WebSocket] Max reconnection attempts reached. Application will continue without real-time updates.');
        wsFailedRef.current = true; // Mark WebSocket as permanently failed
        setIsReconnecting(false);
        return;
      }

      // Exponential backoff reconnection
      const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
      reconnectAttemptsRef.current++;

      console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttemptsRef.current})`);
      setIsReconnecting(true);

      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, delay);
    };

    ws.onerror = (event) => {
      // Suppress WebSocket connection errors - they're expected when server is unavailable
      // Only log in debug mode
      if (process.env.NODE_ENV === 'development') {
        const errorMsg = event instanceof Event ? `WebSocket error: ${event.type}` : String(event);
        console.debug('[WebSocket] Connection error (expected):', errorMsg);
      }
      // Mark as failed after first error
      if (reconnectAttemptsRef.current === 0) {
        wsFailedRef.current = true;
      }
    };

    wsRef.current = ws;
  }, [user]);

  useEffect(() => {
    // Only connect if token is available and not loading
    if (!isLoadingToken && tokenData?.token) {
      connect();
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounted');
      }
    };
  }, [connect, isLoadingToken, tokenData?.token]);

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
    wsAvailable: !wsFailedRef.current, // Indicate if WebSocket is available
  };
}
