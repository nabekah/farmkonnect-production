import { useEffect, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";

const TOKEN_REFRESH_INTERVAL = 5 * 60 * 1000; // Refresh every 5 minutes
const TOKEN_EXPIRY_BUFFER = 10 * 60 * 1000; // Refresh 10 minutes before expiry

export function useTokenRefresh() {
  const refreshMutation = trpc.tokenRefresh.refreshToken.useMutation();
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastRefreshRef = useRef<number>(0);

  const refreshToken = useCallback(async () => {
    try {
      const now = Date.now();
      
      // Prevent too frequent refresh attempts (at least 1 minute apart)
      if (now - lastRefreshRef.current < 60 * 1000) {
        return;
      }

      lastRefreshRef.current = now;
      
      const result = await refreshMutation.mutateAsync({});
      
      if (result.success) {
        console.log("Token refreshed successfully");
        // Reset interval on successful refresh
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
        startRefreshInterval();
      }
    } catch (error) {
      console.error("Token refresh failed:", error);
      // On refresh failure, try again in 1 minute
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      refreshIntervalRef.current = setTimeout(() => {
        refreshToken();
      }, 60 * 1000);
    }
  }, [refreshMutation]);

  const startRefreshInterval = useCallback(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }
    
    refreshIntervalRef.current = setInterval(() => {
      refreshToken();
    }, TOKEN_REFRESH_INTERVAL);
  }, [refreshToken]);

  const stopRefreshInterval = useCallback(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    // Start token refresh on mount
    startRefreshInterval();
    
    // Also refresh immediately on mount
    refreshToken();

    // Cleanup on unmount
    return () => {
      stopRefreshInterval();
    };
  }, [startRefreshInterval, stopRefreshInterval, refreshToken]);

  return {
    refreshToken,
    isRefreshing: refreshMutation.isPending,
    error: refreshMutation.error,
  };
}
