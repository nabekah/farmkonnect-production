import { useEffect, useState, useCallback } from "react";

interface SyncQueue {
  id: string;
  action: string;
  data: any;
  timestamp: number;
  retries: number;
}

interface OfflineState {
  isOnline: boolean;
  isSyncing: boolean;
  syncQueue: SyncQueue[];
  lastSyncTime: number | null;
}

/**
 * Mobile optimization hook for offline-first architecture
 * Handles local caching, background sync, and offline data persistence
 */
export function useMobileOptimization() {
  const [offlineState, setOfflineState] = useState<OfflineState>({
    isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
    isSyncing: false,
    syncQueue: [],
    lastSyncTime: null,
  });

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setOfflineState((prev) => ({ ...prev, isOnline: true }));
      // Trigger sync when coming back online
      syncPendingData();
    };

    const handleOffline = () => {
      setOfflineState((prev) => ({ ...prev, isOnline: false }));
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Load sync queue from localStorage
  useEffect(() => {
    const savedQueue = localStorage.getItem("syncQueue");
    if (savedQueue) {
      try {
        const queue = JSON.parse(savedQueue);
        setOfflineState((prev) => ({ ...prev, syncQueue: queue }));
      } catch (error) {
        console.error("Failed to load sync queue:", error);
      }
    }
  }, []);

  // Save sync queue to localStorage
  const saveSyncQueue = useCallback((queue: SyncQueue[]) => {
    localStorage.setItem("syncQueue", JSON.stringify(queue));
  }, []);

  // Add action to sync queue
  const queueAction = useCallback(
    (action: string, data: any) => {
      const newAction: SyncQueue = {
        id: `${Date.now()}-${Math.random()}`,
        action,
        data,
        timestamp: Date.now(),
        retries: 0,
      };

      setOfflineState((prev) => {
        const newQueue = [...prev.syncQueue, newAction];
        saveSyncQueue(newQueue);
        return { ...prev, syncQueue: newQueue };
      });

      return newAction.id;
    },
    [saveSyncQueue]
  );

  // Process sync queue
  const syncPendingData = useCallback(async () => {
    if (!offlineState.isOnline || offlineState.isSyncing) return;

    setOfflineState((prev) => ({ ...prev, isSyncing: true }));

    try {
      const queue = [...offlineState.syncQueue];
      const failedItems: SyncQueue[] = [];

      for (const item of queue) {
        try {
          // Simulate API call - replace with actual API calls
          await new Promise((resolve) => setTimeout(resolve, 500));

          // Remove from queue on success
          const index = offlineState.syncQueue.findIndex((q) => q.id === item.id);
          if (index > -1) {
            const newQueue = offlineState.syncQueue.filter((_, i) => i !== index);
            saveSyncQueue(newQueue);
            setOfflineState((prev) => ({ ...prev, syncQueue: newQueue }));
          }
        } catch (error) {
          console.error(`Failed to sync ${item.action}:`, error);
          item.retries++;
          if (item.retries < 3) {
            failedItems.push(item);
          }
        }
      }

      setOfflineState((prev) => ({
        ...prev,
        isSyncing: false,
        syncQueue: failedItems,
        lastSyncTime: Date.now(),
      }));

      saveSyncQueue(failedItems);
    } catch (error) {
      console.error("Sync failed:", error);
      setOfflineState((prev) => ({ ...prev, isSyncing: false }));
    }
  }, [offlineState, saveSyncQueue]);

  // Cache data locally
  const cacheData = useCallback((key: string, data: any, ttl: number = 3600000) => {
    const cacheEntry = {
      data,
      timestamp: Date.now(),
      ttl,
    };
    localStorage.setItem(`cache_${key}`, JSON.stringify(cacheEntry));
  }, []);

  // Get cached data
  const getCachedData = useCallback((key: string) => {
    const cached = localStorage.getItem(`cache_${key}`);
    if (!cached) return null;

    try {
      const entry = JSON.parse(cached);
      const isExpired = Date.now() - entry.timestamp > entry.ttl;

      if (isExpired) {
        localStorage.removeItem(`cache_${key}`);
        return null;
      }

      return entry.data;
    } catch (error) {
      console.error("Failed to parse cached data:", error);
      return null;
    }
  }, []);

  // Clear cache
  const clearCache = useCallback((key?: string) => {
    if (key) {
      localStorage.removeItem(`cache_${key}`);
    } else {
      // Clear all cache entries
      Object.keys(localStorage).forEach((k) => {
        if (k.startsWith("cache_")) {
          localStorage.removeItem(k);
        }
      });
    }
  }, []);

  // Optimize images for mobile
  const optimizeImage = useCallback((imageUrl: string, maxWidth: number = 800) => {
    // Add image optimization parameters
    const url = new URL(imageUrl, window.location.origin);
    url.searchParams.set("w", maxWidth.toString());
    url.searchParams.set("q", "80"); // 80% quality
    url.searchParams.set("f", "webp"); // WebP format
    return url.toString();
  }, []);

  // Lazy load images
  const lazyLoadImage = useCallback((imageElement: HTMLImageElement) => {
    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            img.src = img.dataset.src || "";
            img.classList.remove("lazy");
            observer.unobserve(img);
          }
        });
      });

      observer.observe(imageElement);
    } else {
      // Fallback for browsers without IntersectionObserver
      imageElement.src = imageElement.dataset.src || "";
    }
  }, []);

  // Batch API requests
  const batchRequests = useCallback(async (requests: Array<{ url: string; method: string; data?: any }>) => {
    const results = [];

    for (const request of requests) {
      try {
        const response = await fetch(request.url, {
          method: request.method,
          headers: { "Content-Type": "application/json" },
          body: request.data ? JSON.stringify(request.data) : undefined,
        });

        results.push({
          url: request.url,
          status: response.status,
          data: await response.json(),
        });
      } catch (error) {
        results.push({
          url: request.url,
          status: 0,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return results;
  }, []);

  // Compress data
  const compressData = useCallback((data: any): string => {
    return btoa(JSON.stringify(data)); // Simple base64 compression
  }, []);

  // Decompress data
  const decompressData = useCallback((compressed: string): any => {
    try {
      return JSON.parse(atob(compressed));
    } catch (error) {
      console.error("Failed to decompress data:", error);
      return null;
    }
  }, []);

  return {
    // State
    isOnline: offlineState.isOnline,
    isSyncing: offlineState.isSyncing,
    syncQueue: offlineState.syncQueue,
    lastSyncTime: offlineState.lastSyncTime,

    // Methods
    queueAction,
    syncPendingData,
    cacheData,
    getCachedData,
    clearCache,
    optimizeImage,
    lazyLoadImage,
    batchRequests,
    compressData,
    decompressData,
  };
}
