/**
 * Offline Data Sync Queue Service
 * Manages pending mutations when offline and syncs them when connection is restored
 */

export interface QueuedMutation {
  id: string;
  timestamp: number;
  endpoint: string;
  method: 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  data: any;
  retries: number;
  maxRetries: number;
  status: 'pending' | 'syncing' | 'failed' | 'completed';
  error?: string;
}

const DB_NAME = 'farmkonnect_offline';
const STORE_NAME = 'mutations';
const DB_VERSION = 1;

class OfflineQueueService {
  private db: IDBDatabase | null = null;
  private isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  /**
   * Initialize IndexedDB
   */
  async init(): Promise<void> {
    if (!this.supportsIndexedDB()) {
      console.warn('IndexedDB not supported');
      return;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
    });
  }

  /**
   * Check if IndexedDB is supported
   */
  private supportsIndexedDB(): boolean {
    return typeof indexedDB !== 'undefined';
  }

  /**
   * Add mutation to queue
   */
  async addMutation(
    endpoint: string,
    method: 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    data: any,
    maxRetries: number = 3
  ): Promise<string> {
    if (!this.db) {
      throw new Error('OfflineQueue not initialized');
    }

    const id = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const mutation: QueuedMutation = {
      id,
      timestamp: Date.now(),
      endpoint,
      method,
      data,
      retries: 0,
      maxRetries,
      status: 'pending',
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(mutation);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(id);
    });
  }

  /**
   * Get all pending mutations
   */
  async getPendingMutations(): Promise<QueuedMutation[]> {
    if (!this.db) {
      throw new Error('OfflineQueue not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const mutations = request.result as QueuedMutation[];
        resolve(mutations.filter((m) => m.status === 'pending'));
      };
    });
  }

  /**
   * Update mutation status
   */
  async updateMutation(
    id: string,
    updates: Partial<QueuedMutation>
  ): Promise<void> {
    if (!this.db) {
      throw new Error('OfflineQueue not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const getRequest = store.get(id);

      getRequest.onerror = () => reject(getRequest.error);
      getRequest.onsuccess = () => {
        const mutation = getRequest.result as QueuedMutation;
        const updated = { ...mutation, ...updates };
        const updateRequest = store.put(updated);

        updateRequest.onerror = () => reject(updateRequest.error);
        updateRequest.onsuccess = () => resolve();
      };
    });
  }

  /**
   * Remove mutation from queue
   */
  async removeMutation(id: string): Promise<void> {
    if (!this.db) {
      throw new Error('OfflineQueue not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Sync all pending mutations
   */
  async syncAll(onProgress?: (completed: number, total: number) => void): Promise<void> {
    const mutations = await this.getPendingMutations();
    let completed = 0;

    for (const mutation of mutations) {
      await this.syncMutation(mutation);
      completed++;
      onProgress?.(completed, mutations.length);
    }
  }

  /**
   * Sync a single mutation
   */
  private async syncMutation(mutation: QueuedMutation): Promise<void> {
    try {
      await this.updateMutation(mutation.id, { status: 'syncing' });

      const response = await fetch(mutation.endpoint, {
        method: mutation.method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mutation.data),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      await this.removeMutation(mutation.id);
      console.log(`[OfflineQueue] Synced mutation ${mutation.id}`);
    } catch (error) {
      const retries = mutation.retries + 1;

      if (retries >= mutation.maxRetries) {
        await this.updateMutation(mutation.id, {
          status: 'failed',
          retries,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        console.error(`[OfflineQueue] Failed to sync mutation ${mutation.id}:`, error);
      } else {
        await this.updateMutation(mutation.id, {
          status: 'pending',
          retries,
        });
        console.warn(
          `[OfflineQueue] Retry ${retries}/${mutation.maxRetries} for mutation ${mutation.id}`
        );
      }
    }
  }

  /**
   * Get queue statistics
   */
  async getStats(): Promise<{
    total: number;
    pending: number;
    syncing: number;
    failed: number;
  }> {
    if (!this.db) {
      throw new Error('OfflineQueue not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const mutations = request.result as QueuedMutation[];
        resolve({
          total: mutations.length,
          pending: mutations.filter((m) => m.status === 'pending').length,
          syncing: mutations.filter((m) => m.status === 'syncing').length,
          failed: mutations.filter((m) => m.status === 'failed').length,
        });
      };
    });
  }

  /**
   * Clear all failed mutations
   */
  async clearFailed(): Promise<void> {
    if (!this.db) {
      throw new Error('OfflineQueue not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const mutations = request.result as QueuedMutation[];
        const failed = mutations.filter((m) => m.status === 'failed');

        failed.forEach((mutation) => {
          store.delete(mutation.id);
        });

        resolve();
      };
    });
  }

  /**
   * Listen for online/offline events
   */
  setupListeners(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('[OfflineQueue] Online - syncing mutations');
      this.syncAll().catch((error) => {
        console.error('[OfflineQueue] Sync failed:', error);
      });
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('[OfflineQueue] Offline - queuing mutations');
    });
  }

  /**
   * Check if currently online
   */
  getOnlineStatus(): boolean {
    return this.isOnline;
  }
}

// Export singleton instance
export const offlineQueue = new OfflineQueueService();
