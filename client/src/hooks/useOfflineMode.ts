import { useEffect, useState, useCallback, useRef } from 'react';

interface OfflineData {
  key: string;
  data: any;
  timestamp: number;
}

/**
 * Hook for managing offline mode with IndexedDB persistence
 */
export function useOfflineMode() {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [offlineData, setOfflineData] = useState<OfflineData[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const dbRef = useRef<IDBDatabase | null>(null);

  // Initialize IndexedDB
  useEffect(() => {
    const initDB = async () => {
      try {
        const db = await openIndexedDB();
        dbRef.current = db;
        console.log('[Offline Mode] IndexedDB initialized');
      } catch (error) {
        console.error('[Offline Mode] Failed to initialize IndexedDB:', error);
      }
    };

    initDB();
  }, []);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      console.log('[Offline Mode] Connection restored');
      setIsOnline(true);
      // Trigger sync when connection is restored
      syncOfflineData();
    };

    const handleOffline = () => {
      console.log('[Offline Mode] Connection lost');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  /**
   * Save data for offline use
   */
  const saveOfflineData = useCallback(async (key: string, data: any) => {
    if (!dbRef.current) {
      console.warn('[Offline Mode] Database not initialized');
      return;
    }

    try {
      const transaction = dbRef.current.transaction('offlineData', 'readwrite');
      const store = transaction.objectStore('offlineData');

      const offlineItem: OfflineData = {
        key,
        data,
        timestamp: Date.now(),
      };

      await new Promise((resolve, reject) => {
        const request = store.put(offlineItem);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(undefined);
      });

      console.log('[Offline Mode] Data saved:', key);
    } catch (error) {
      console.error('[Offline Mode] Failed to save data:', error);
    }
  }, []);

  /**
   * Get offline data
   */
  const getOfflineData = useCallback(async (key: string): Promise<any | null> => {
    if (!dbRef.current) {
      return null;
    }

    try {
      const transaction = dbRef.current.transaction('offlineData', 'readonly');
      const store = transaction.objectStore('offlineData');

      return new Promise((resolve, reject) => {
        const request = store.get(key);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const result = request.result;
          resolve(result ? result.data : null);
        };
      });
    } catch (error) {
      console.error('[Offline Mode] Failed to get data:', error);
      return null;
    }
  }, []);

  /**
   * Clear offline data
   */
  const clearOfflineData = useCallback(async (key?: string) => {
    if (!dbRef.current) {
      return;
    }

    try {
      const transaction = dbRef.current.transaction('offlineData', 'readwrite');
      const store = transaction.objectStore('offlineData');

      if (key) {
        await new Promise((resolve, reject) => {
          const request = store.delete(key);
          request.onerror = () => reject(request.error);
          request.onsuccess = () => resolve(undefined);
        });
        console.log('[Offline Mode] Data cleared:', key);
      } else {
        await new Promise((resolve, reject) => {
          const request = store.clear();
          request.onerror = () => reject(request.error);
          request.onsuccess = () => resolve(undefined);
        });
        console.log('[Offline Mode] All data cleared');
      }
    } catch (error) {
      console.error('[Offline Mode] Failed to clear data:', error);
    }
  }, []);

  /**
   * Sync offline data when connection is restored
   */
  const syncOfflineData = useCallback(async () => {
    if (isOnline && dbRef.current) {
      setIsSyncing(true);
      try {
        const transaction = dbRef.current.transaction('offlineData', 'readonly');
        const store = transaction.objectStore('offlineData');

        const allData = await new Promise<OfflineData[]>((resolve, reject) => {
          const request = store.getAll();
          request.onerror = () => reject(request.error);
          request.onsuccess = () => resolve(request.result);
        });

        setOfflineData(allData);
        console.log('[Offline Mode] Sync complete, found', allData.length, 'items');
      } catch (error) {
        console.error('[Offline Mode] Sync error:', error);
      } finally {
        setIsSyncing(false);
      }
    }
  }, [isOnline]);

  /**
   * Register Service Worker
   */
  const registerServiceWorker = useCallback(async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });
        console.log('[Offline Mode] Service Worker registered:', registration);

        // Check for updates periodically
        setInterval(() => {
          registration.update();
        }, 60000); // Check every minute

        return registration;
      } catch (error) {
        console.error('[Offline Mode] Service Worker registration failed:', error);
      }
    }
  }, []);

  /**
   * Unregister Service Worker
   */
  const unregisterServiceWorker = useCallback(async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
        console.log('[Offline Mode] Service Worker unregistered');
      } catch (error) {
        console.error('[Offline Mode] Service Worker unregistration failed:', error);
      }
    }
  }, []);

  return {
    isOnline,
    offlineData,
    isSyncing,
    saveOfflineData,
    getOfflineData,
    clearOfflineData,
    syncOfflineData,
    registerServiceWorker,
    unregisterServiceWorker,
  };
}

/**
 * Open IndexedDB database
 */
function openIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('FarmKonnectDB', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains('offlineData')) {
        db.createObjectStore('offlineData', { keyPath: 'key' });
      }

      if (!db.objectStoreNames.contains('pendingRequests')) {
        db.createObjectStore('pendingRequests', { keyPath: 'id', autoIncrement: true });
      }

      if (!db.objectStoreNames.contains('syncQueue')) {
        db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}
