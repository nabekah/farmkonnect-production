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
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const reconnectAttemptsRef = useRef<number>(0);
  const maxReconnectAttemptsRef = useRef<number>(3);
  const wsFailedRef = useRef<boolean>(false);
  
  // Store options in a ref to avoid stale closures
  const optionsRef = useRef(options);
  
  // Update options ref when options change
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  // Get WebSocket token from backend
  const { data: tokenData, isLoading: isLoadingToken } = trpc.websocketToken.getToken.useQuery(
    undefined,
    {
      enabled: !!user,
      staleTime: 50 * 60 * 1000,
      refetchInterval: 50 * 60 * 1000,
    }
  );

  const connect = useCallback(() => {
    if (!user) {
      console.log('[WebSocket] No user, skipping connection');
      return;
    }

    if (wsFailedRef.current) {
      console.log('[WebSocket] WebSocket unavailable, skipping connection attempt');
      return;
    }

    const token = tokenData?.token;
    if (!token) {
      console.log('[WebSocket] Waiting for token from backend...');
      return;
    }

    // Use current domain for WebSocket connection (works with custom domains)
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws?token=${token}`;
    
    // Log for debugging
    console.log('[WebSocket] Current location:', window.location.href);
    console.log('[WebSocket] WebSocket URL:', wsUrl);

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

        const opts = optionsRef.current;
        
        if (opts.onMessage) {
          opts.onMessage(message);
        }

        if (message.type === 'task_created' && opts.onTaskCreated) {
          opts.onTaskCreated(message.data);
        } else if (message.type === 'task_updated' && opts.onTaskUpdated) {
          opts.onTaskUpdated(message.data);
        } else if (message.type === 'activity_created' && opts.onActivityCreated) {
          opts.onActivityCreated(message.data);
        } else if (message.type === 'activity_updated' && opts.onActivityUpdated) {
          opts.onActivityUpdated(message.data);
        } else if (message.type === 'expense_created' && opts.onExpenseCreated) {
          opts.onExpenseCreated(message.data);
        } else if (message.type === 'revenue_created' && opts.onRevenueCreated) {
          opts.onRevenueCreated(message.data);
        } else if (message.type === 'expense_updated' && opts.onExpenseUpdated) {
          opts.onExpenseUpdated(message.data);
        } else if (message.type === 'revenue_updated' && opts.onRevenueUpdated) {
          opts.onRevenueUpdated(message.data);
        } else if (message.type === 'financial_data_refresh' && opts.onFinancialDataRefresh) {
          opts.onFinancialDataRefresh(message.data);
        }
      } catch (error) {
        console.error('[WebSocket] Error parsing message:', error);
      }
    };

    ws.onclose = (event) => {
      console.log('[WebSocket] Disconnected:', event.code, event.reason);
      setIsConnected(false);
      wsRef.current = null;

      if (event.code === 1000) {
        setIsReconnecting(false);
        return;
      }

      if (reconnectAttemptsRef.current >= maxReconnectAttemptsRef.current) {
        console.warn('[WebSocket] Max reconnection attempts reached. Application will continue without real-time updates.');
        wsFailedRef.current = true;
        setIsReconnecting(false);
        return;
      }

      const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
      reconnectAttemptsRef.current++;

      console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttemptsRef.current})`);
      setIsReconnecting(true);

      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, delay);
    };

    ws.onerror = (event) => {
      if (process.env.NODE_ENV === 'development') {
        const errorMsg = event instanceof Event ? `WebSocket error: ${event.type}` : String(event);
        console.debug('[WebSocket] Connection error (expected):', errorMsg);
      }
      if (reconnectAttemptsRef.current === 0) {
        wsFailedRef.current = true;
      }
    };

    wsRef.current = ws;
  }, [user, tokenData?.token]);

  useEffect(() => {
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
    wsAvailable: !wsFailedRef.current,
  };
}
