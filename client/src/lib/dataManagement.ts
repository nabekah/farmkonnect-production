import { useCallback, useRef, useState, useEffect } from 'react';

export interface CacheEntry<T> {
  /**
   * Cached data
   */
  data: T;
  /**
   * Cache timestamp
   */
  timestamp: number;
  /**
   * Cache TTL in ms
   */
  ttl?: number;
}

export interface SyncOptions {
  /**
   * Auto sync interval in ms
   */
  autoSyncInterval?: number;
  /**
   * Sync on focus
   */
  syncOnFocus?: boolean;
  /**
   * Sync on online
   */
  syncOnOnline?: boolean;
}

/**
 * Cache Manager
 * 
 * In-memory cache with TTL support
 */
export class CacheManager {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(private cleanupInterval: number = 60000) {
    this.startCleanup();
  }

  /**
   * Get cached data
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (entry.ttl && Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set cache data
   */
  set<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Delete cache entry
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Check if key exists
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    // Check if expired
    if (entry.ttl && Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Start cleanup timer
   */
  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.cache.entries()) {
        if (entry.ttl && now - entry.timestamp > entry.ttl) {
          this.cache.delete(key);
        }
      }
    }, this.cleanupInterval);
  }

  /**
   * Stop cleanup timer
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.cache.clear();
  }
}

/**
 * Data Sync Manager
 * 
 * Manage data synchronization with server
 */
export class DataSyncManager {
  private syncQueue: Array<{ key: string; data: any; timestamp: number }> = [];
  private syncTimer: NodeJS.Timeout | null = null;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  constructor(
    private syncFn: (data: any) => Promise<any>,
    private options: SyncOptions = {}
  ) {
    this.setupListeners();
  }

  /**
   * Queue data for sync
   */
  queue(key: string, data: any): void {
    this.syncQueue.push({
      key,
      data,
      timestamp: Date.now(),
    });

    this.scheduleSync();
  }

  /**
   * Sync immediately
   */
  async sync(): Promise<void> {
    if (this.syncQueue.length === 0) {
      return;
    }

    const items = [...this.syncQueue];
    this.syncQueue = [];

    try {
      for (const item of items) {
        const result = await this.syncFn(item.data);
        this.emit(item.key, result);
      }
    } catch (error) {
      // Re-queue on error
      this.syncQueue.push(...items);
      throw error;
    }
  }

  /**
   * Schedule sync
   */
  private scheduleSync(): void {
    if (this.syncTimer) {
      clearTimeout(this.syncTimer);
    }

    this.syncTimer = setTimeout(() => {
      this.sync().catch(console.error);
    }, 1000);
  }

  /**
   * Subscribe to sync updates
   */
  on(key: string, callback: (data: any) => void): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }

    this.listeners.get(key)!.add(callback);

    return () => {
      this.listeners.get(key)?.delete(callback);
    };
  }

  /**
   * Emit sync update
   */
  private emit(key: string, data: any): void {
    const callbacks = this.listeners.get(key);
    if (callbacks) {
      callbacks.forEach((callback) => callback(data));
    }
  }

  /**
   * Setup event listeners
   */
  private setupListeners(): void {
    if (this.options.syncOnFocus) {
      window.addEventListener('focus', () => {
        this.sync().catch(console.error);
      });
    }

    if (this.options.syncOnOnline) {
      window.addEventListener('online', () => {
        this.sync().catch(console.error);
      });
    }
  }

  /**
   * Get pending sync count
   */
  getPendingCount(): number {
    return this.syncQueue.length;
  }

  /**
   * Destroy manager
   */
  destroy(): void {
    if (this.syncTimer) {
      clearTimeout(this.syncTimer);
      this.syncTimer = null;
    }
    this.syncQueue = [];
    this.listeners.clear();
  }
}

/**
 * useCache Hook
 * 
 * React hook for cache management
 */
export function useCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: { ttl?: number; revalidateOnFocus?: boolean } = {}
) {
  const cacheRef = useRef(new CacheManager());
  const [data, setData] = useState<T | null>(() => cacheRef.current.get(key));
  const [isLoading, setIsLoading] = useState(!cacheRef.current.has(key));
  const [error, setError] = useState<Error | null>(null);

  const revalidate = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetcher();
      cacheRef.current.set(key, result, options.ttl);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [key, fetcher, options.ttl]);

  useEffect(() => {
    // Load from cache or fetch
    const cached = cacheRef.current.get(key);
    if (cached) {
      setData(cached);
      setIsLoading(false);
    } else {
      revalidate();
    }
  }, [key, revalidate]);

  useEffect(() => {
    if (options.revalidateOnFocus) {
      const handleFocus = () => revalidate();
      window.addEventListener('focus', handleFocus);
      return () => window.removeEventListener('focus', handleFocus);
    }
  }, [revalidate, options.revalidateOnFocus]);

  return {
    data,
    isLoading,
    error,
    revalidate,
  };
}

/**
 * useDataSync Hook
 * 
 * React hook for data synchronization
 */
export function useDataSync<T>(
  syncFn: (data: T) => Promise<any>,
  options: SyncOptions = {}
) {
  const managerRef = useRef(new DataSyncManager(syncFn, options));
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const queue = useCallback((key: string, data: T) => {
    managerRef.current.queue(key, data);
    setPendingCount(managerRef.current.getPendingCount());
  }, []);

  const sync = useCallback(async () => {
    setIsSyncing(true);
    setError(null);

    try {
      await managerRef.current.sync();
      setPendingCount(0);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Sync failed'));
    } finally {
      setIsSyncing(false);
    }
  }, []);

  const subscribe = useCallback((key: string, callback: (data: any) => void) => {
    return managerRef.current.on(key, callback);
  }, []);

  useEffect(() => {
    return () => {
      managerRef.current.destroy();
    };
  }, []);

  return {
    queue,
    sync,
    subscribe,
    pendingCount,
    isSyncing,
    error,
  };
}

/**
 * useOptimisticUpdate Hook
 * 
 * Optimistic UI updates with rollback
 */
export function useOptimisticUpdate<T>(
  initialData: T,
  updateFn: (data: T) => Promise<T>
) {
  const [data, setData] = useState(initialData);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const update = useCallback(
    async (newData: T) => {
      const previousData = data;
      setData(newData);
      setIsPending(true);
      setError(null);

      try {
        const result = await updateFn(newData);
        setData(result);
      } catch (err) {
        setData(previousData);
        setError(err instanceof Error ? err : new Error('Update failed'));
      } finally {
        setIsPending(false);
      }
    },
    [data, updateFn]
  );

  return {
    data,
    update,
    isPending,
    error,
  };
}
