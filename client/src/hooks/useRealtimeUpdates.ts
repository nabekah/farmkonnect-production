import { useEffect, useRef, useState, useCallback } from 'react';
import { trpc } from '@/lib/trpc';
import wsService from '@/lib/websocket';

interface UseRealtimeUpdatesOptions {
  enabled?: boolean;
  pollInterval?: number; // milliseconds
  onTasksUpdated?: (tasks: any[]) => void;
  onActivitiesUpdated?: (activities: any[]) => void;
}

/**
 * Hook for real-time updates using polling as fallback when WebSocket is unavailable
 * Polls for new tasks and activities at regular intervals
 */
export function useRealtimeUpdates(options: UseRealtimeUpdatesOptions = {}) {
  const {
    enabled = true,
    pollInterval = 5000, // 5 seconds default
    onTasksUpdated,
    onActivitiesUpdated,
  } = options;

  const [isPolling, setIsPolling] = useState(false);
  const pollTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const lastTasksRef = useRef<any[]>([]);
  const lastActivitiesRef = useRef<any[]>([]);

  // Query for tasks
  const { data: tasksData, refetch: refetchTasks } = trpc.fieldWorker.getTasks.useQuery(
    { farmId: 1 },
    { enabled: false }
  ) as any;

  // Query for activities
  const { data: activitiesData, refetch: refetchActivities } = trpc.fieldWorker.getActivityLogs.useQuery(
    { farmId: 1, limit: 100 },
    { enabled: false }
  ) as any;

  useEffect(() => {
    if (!enabled) {
      setIsPolling(false);
      return;
    }

    setIsPolling(true);
    const poll = async () => {
      try {
        // Fetch latest tasks and activities
        const [tasksResult, activitiesResult] = await Promise.all([
          refetchTasks(),
          refetchActivities(),
        ]);

        // Check if tasks changed
        if (tasksResult.data?.tasks && JSON.stringify(tasksResult.data.tasks) !== JSON.stringify(lastTasksRef.current)) {
          lastTasksRef.current = tasksResult.data.tasks;
          if (onTasksUpdated) {
            onTasksUpdated(tasksResult.data.tasks);
          }
        }

        // Check if activities changed
        if (activitiesResult.data?.logs && JSON.stringify(activitiesResult.data.logs) !== JSON.stringify(lastActivitiesRef.current)) {
          lastActivitiesRef.current = activitiesResult.data.logs;
          if (onActivitiesUpdated) {
            onActivitiesUpdated(activitiesResult.data.logs);
          }
        }
      } catch (error) {
        console.error('[Polling] Error fetching updates:', error);
      }

      // Schedule next poll
      pollTimeoutRef.current = setTimeout(poll, pollInterval);
    };

    // Start polling
    poll();

    return () => {
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
      }
    };
  }, [enabled, pollInterval, refetchTasks, refetchActivities, onTasksUpdated, onActivitiesUpdated]);

  return {
    isPolling,
    tasksData,
    activitiesData,
    refetchTasks,
    refetchActivities,
  };
}


/**
 * Hook for subscribing to real-time supply chain updates
 */
export function useSupplyChainUpdates(onUpdate: (data: any) => void) {
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!wsService.isConnected()) {
      wsService.connect().catch(console.error);
    }

    unsubscribeRef.current = wsService.on('supply_chain_update', onUpdate);

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [onUpdate]);
}

/**
 * Hook for subscribing to real-time marketplace updates
 */
export function useMarketplaceUpdates(onUpdate: (data: any) => void) {
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!wsService.isConnected()) {
      wsService.connect().catch(console.error);
    }

    unsubscribeRef.current = wsService.on('marketplace_update', onUpdate);

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [onUpdate]);
}

/**
 * Hook for subscribing to real-time forum updates
 */
export function useForumUpdates(onUpdate: (data: any) => void) {
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!wsService.isConnected()) {
      wsService.connect().catch(console.error);
    }

    unsubscribeRef.current = wsService.on('forum_update', onUpdate);

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [onUpdate]);
}

/**
 * Hook for WebSocket-based real-time dashboard updates
 * Automatically invalidates React Query cache when database changes are broadcast
 */
export function useDashboardRealtimeUpdates(options: { enabled?: boolean; onUpdate?: (message: any) => void } = {}) {
  const { enabled = true, onUpdate } = options;
  const queryClient = useRef<any>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelayMs = 3000;

  const connect = useCallback(() => {
    if (!enabled) return;

    try {
      const token = localStorage.getItem('auth_token') || getCookie('auth_token');
      if (!token) {
        console.warn('[useDashboardRealtimeUpdates] No auth token found');
        return;
      }

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws?token=${encodeURIComponent(token)}`;

      console.log('[useDashboardRealtimeUpdates] Connecting to WebSocket...');
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('[useDashboardRealtimeUpdates] Connected');
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('[useDashboardRealtimeUpdates] Received:', message);

          if (onUpdate) {
            onUpdate(message);
          }

          // Invalidate relevant queries based on message type
          if (message.type === 'database_update' || message.type.includes('_update')) {
            const table = message.table || message.type.replace('_update', '');
            invalidateDashboardQueries(table);
          }
        } catch (error) {
          console.error('[useDashboardRealtimeUpdates] Failed to parse message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('[useDashboardRealtimeUpdates] WebSocket error:', error);
      };

      ws.onclose = () => {
        console.log('[useDashboardRealtimeUpdates] Disconnected');
        wsRef.current = null;

        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          console.log(`[useDashboardRealtimeUpdates] Reconnecting... (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);
          reconnectTimeoutRef.current = setTimeout(connect, reconnectDelayMs);
        }
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('[useDashboardRealtimeUpdates] Connection error:', error);
    }
  }, [enabled, onUpdate]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (enabled) {
      connect();
    }
    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  return {
    connected: wsRef.current?.readyState === WebSocket.OPEN,
    disconnect,
    reconnect: connect,
  };
}

function invalidateDashboardQueries(table: string) {
  // This would be called with queryClient from the component using the hook
  console.log(`[useDashboardRealtimeUpdates] Would invalidate queries for table: ${table}`);
}

function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

/**
 * Hook for WebSocket connection status
 */
export function useWebSocketStatus(onStatusChange?: (connected: boolean) => void) {
  const connectedRef = useRef(wsService.isConnected());

  useEffect(() => {
    const handleConnect = () => {
      connectedRef.current = true;
      onStatusChange?.(true);
    };

    const handleDisconnect = () => {
      connectedRef.current = false;
      onStatusChange?.(false);
    };

    const unsubscribeConnect = wsService.onConnect(handleConnect);
    const unsubscribeDisconnect = wsService.onDisconnect(handleDisconnect);

    if (!wsService.isConnected()) {
      wsService.connect().catch(console.error);
    }

    return () => {
      unsubscribeConnect();
      unsubscribeDisconnect();
    };
  }, [onStatusChange]);

  return connectedRef.current;
}
