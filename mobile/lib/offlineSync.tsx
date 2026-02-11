import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";

interface SyncItem {
  id: string;
  action: "create" | "update" | "delete";
  resource: string;
  data: any;
  timestamp: number;
  synced: boolean;
}

interface OfflineSyncContextType {
  isOnline: boolean;
  syncQueue: SyncItem[];
  addToQueue: (item: Omit<SyncItem, "id" | "timestamp" | "synced">) => Promise<void>;
  syncData: () => Promise<void>;
  clearQueue: () => Promise<void>;
  isSyncing: boolean;
}

const OfflineSyncContext = createContext<OfflineSyncContextType | undefined>(undefined);

export const OfflineSyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(true);
  const [syncQueue, setSyncQueue] = useState<SyncItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Monitor network connectivity
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected ?? false);
      if (state.isConnected) {
        syncData();
      }
    });

    return () => unsubscribe();
  }, []);

  // Load sync queue from storage on mount
  useEffect(() => {
    loadSyncQueue();
  }, []);

  const loadSyncQueue = async () => {
    try {
      const stored = await AsyncStorage.getItem("syncQueue");
      if (stored) {
        setSyncQueue(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Error loading sync queue:", error);
    }
  };

  const saveSyncQueue = async (queue: SyncItem[]) => {
    try {
      await AsyncStorage.setItem("syncQueue", JSON.stringify(queue));
      setSyncQueue(queue);
    } catch (error) {
      console.error("Error saving sync queue:", error);
    }
  };

  const addToQueue = async (item: Omit<SyncItem, "id" | "timestamp" | "synced">) => {
    const newItem: SyncItem = {
      ...item,
      id: `${item.resource}-${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      synced: false,
    };

    const updatedQueue = [...syncQueue, newItem];
    await saveSyncQueue(updatedQueue);

    // Try to sync immediately if online
    if (isOnline) {
      await syncData();
    }
  };

  const syncData = async () => {
    if (isSyncing || !isOnline || syncQueue.length === 0) {
      return;
    }

    setIsSyncing(true);
    try {
      const unsynced = syncQueue.filter((item) => !item.synced);

      for (const item of unsynced) {
        try {
          // In a real app, you would call your API here
          // await api.sync(item);

          // Mark as synced
          item.synced = true;
        } catch (error) {
          console.error(`Error syncing ${item.resource}:`, error);
          // Keep in queue for retry
        }
      }

      // Remove synced items
      const remaining = syncQueue.filter((item) => !item.synced);
      await saveSyncQueue(remaining);
    } finally {
      setIsSyncing(false);
    }
  };

  const clearQueue = async () => {
    await saveSyncQueue([]);
  };

  return (
    <OfflineSyncContext.Provider
      value={{
        isOnline,
        syncQueue,
        addToQueue,
        syncData,
        clearQueue,
        isSyncing,
      }}
    >
      {children}
    </OfflineSyncContext.Provider>
  );
};

export const useOfflineSync = () => {
  const context = useContext(OfflineSyncContext);
  if (!context) {
    throw new Error("useOfflineSync must be used within OfflineSyncProvider");
  }
  return context;
};

// Hook for managing offline-first data
export const useOfflineData = <T,>(
  key: string,
  fetchFn: () => Promise<T>,
  defaultValue: T
) => {
  const [data, setData] = useState<T>(defaultValue);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { isOnline } = useOfflineSync();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);

      if (isOnline) {
        // Fetch from server
        const result = await fetchFn();
        setData(result);

        // Cache locally
        await AsyncStorage.setItem(key, JSON.stringify(result));
      } else {
        // Load from cache
        const cached = await AsyncStorage.getItem(key);
        if (cached) {
          setData(JSON.parse(cached));
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));

      // Try to load from cache on error
      try {
        const cached = await AsyncStorage.getItem(key);
        if (cached) {
          setData(JSON.parse(cached));
        }
      } catch (cacheError) {
        console.error("Error loading from cache:", cacheError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const refresh = async () => {
    await loadData();
  };

  return { data, isLoading, error, refresh, isOnline };
};

// Hook for managing offline-first mutations
export const useOfflineMutation = (resource: string) => {
  const { addToQueue, isOnline } = useOfflineSync();
  const [isLoading, setIsLoading] = useState(false);

  const mutate = async (
    action: "create" | "update" | "delete",
    data: any
  ) => {
    try {
      setIsLoading(true);

      if (isOnline) {
        // Perform mutation on server immediately
        // In a real app: await api.mutate(resource, action, data);
      }

      // Add to sync queue
      await addToQueue({
        action,
        resource,
        data,
      });

      return { success: true };
    } catch (error) {
      console.error("Error in mutation:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return { mutate, isLoading };
};
