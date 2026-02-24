import { useEffect, useRef, useState } from 'react';
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
