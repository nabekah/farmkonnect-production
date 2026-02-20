import { useEffect, useRef, useState } from 'react';

interface PollingOptions {
  interval?: number; // milliseconds, default 30000 (30 seconds)
  enabled?: boolean; // default true
  pauseWhenInactive?: boolean; // default true - pause polling when tab is inactive
  onError?: (error: Error) => void;
}

/**
 * Hook for polling-based data refresh
 * Automatically pauses when tab is inactive to save resources
 */
export function usePollingRefresh(
  callback: () => Promise<void>,
  options: PollingOptions = {}
) {
  const {
    interval = 30000,
    enabled = true,
    pauseWhenInactive = true,
    onError,
  } = options;

  const [isPolling, setIsPolling] = useState(enabled);
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(Date.now());
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const visibilityListenerRef = useRef<(() => void) | null>(null);

  // Handle visibility change
  useEffect(() => {
    if (!pauseWhenInactive) return;

    visibilityListenerRef.current = () => {
      if (document.hidden) {
        // Tab is inactive - pause polling
        setIsPolling(false);
        console.log('[Polling] Tab inactive, pausing polling');
      } else {
        // Tab is active - resume polling
        setIsPolling(true);
        console.log('[Polling] Tab active, resuming polling');
      }
    };

    document.addEventListener('visibilitychange', visibilityListenerRef.current);

    return () => {
      if (visibilityListenerRef.current) {
        document.removeEventListener('visibilitychange', visibilityListenerRef.current);
      }
    };
  }, [pauseWhenInactive]);

  // Main polling effect
  useEffect(() => {
    if (!enabled || !isPolling) {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      return;
    }

    // Initial call
    (async () => {
      try {
        setIsLoading(true);
        setError(null);
        await callback();
        setLastRefreshTime(Date.now());
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        if (onError) {
          onError(error);
        }
        console.error('[Polling] Error during refresh:', error);
      } finally {
        setIsLoading(false);
      }
    })();

    // Set up polling interval
    pollingIntervalRef.current = setInterval(async () => {
      try {
        setIsLoading(true);
        setError(null);
        await callback();
        setLastRefreshTime(Date.now());
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        if (onError) {
          onError(error);
        }
        console.error('[Polling] Error during refresh:', error);
      } finally {
        setIsLoading(false);
      }
    }, interval);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [enabled, isPolling, interval, callback, onError]);

  const manualRefresh = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await callback();
      setLastRefreshTime(Date.now());
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      if (onError) {
        onError(error);
      }
      console.error('[Polling] Error during manual refresh:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePolling = () => {
    setIsPolling(!isPolling);
  };

  const setPollingInterval = (newInterval: number) => {
    // Restart polling with new interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    pollingIntervalRef.current = setInterval(async () => {
      try {
        setIsLoading(true);
        setError(null);
        await callback();
        setLastRefreshTime(Date.now());
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        if (onError) {
          onError(error);
        }
      } finally {
        setIsLoading(false);
      }
    }, newInterval);
  };

  return {
    isPolling,
    isLoading,
    error,
    lastRefreshTime,
    manualRefresh,
    togglePolling,
    setPollingInterval,
  };
}

/**
 * Hook for polling multiple data sources
 */
export function useMultiPolling(
  callbacks: Record<string, () => Promise<void>>,
  options: PollingOptions = {}
) {
  const [results, setResults] = useState<Record<string, { isLoading: boolean; error: Error | null; lastRefreshTime: number }>>({});

  const pollingState = usePollingRefresh(async () => {
    const newResults: typeof results = {};

    for (const [key, callback] of Object.entries(callbacks)) {
      try {
        newResults[key] = {
          isLoading: false,
          error: null,
          lastRefreshTime: Date.now(),
        };
        await callback();
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        newResults[key] = {
          isLoading: false,
          error,
          lastRefreshTime: Date.now(),
        };
      }
    }

    setResults(newResults);
  }, options);

  return {
    ...pollingState,
    results,
  };
}
