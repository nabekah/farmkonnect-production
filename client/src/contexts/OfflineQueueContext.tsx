import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { QueuedAction, getOfflineQueue, saveOfflineQueue, removeFromOfflineQueue, getRetryableActions, updateActionRetryMetadata } from '@/lib/offlineQueue';
import { useConnectionStatus } from '@/hooks/useConnectionStatus';

interface OfflineQueueContextType {
  queuedActions: QueuedAction[];
  isSyncing: boolean;
  syncErrors: Map<string, string>;
  addAction: (action: Omit<QueuedAction, 'id' | 'timestamp'>) => QueuedAction;
  removeAction: (actionId: string) => void;
  clearQueue: () => void;
  retryAction: (actionId: string) => Promise<void>;
  syncQueue: () => Promise<void>;
}

const OfflineQueueContext = createContext<OfflineQueueContextType | undefined>(undefined);

export function OfflineQueueProvider({ children }: { children: React.ReactNode }) {
  const [queuedActions, setQueuedActions] = useState<QueuedAction[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncErrors, setSyncErrors] = useState<Map<string, string>>(new Map());
  const isOnline = useConnectionStatus();

  // Load queue from localStorage on mount
  useEffect(() => {
    const queue = getOfflineQueue();
    setQueuedActions(queue);
  }, []);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && queuedActions.length > 0) {
      syncQueue();
    }
  }, [isOnline]);

  const addAction = useCallback((action: Omit<QueuedAction, 'id' | 'timestamp'>) => {
    const newAction: QueuedAction = {
      ...action,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };
    
    const updatedQueue = [...queuedActions, newAction];
    setQueuedActions(updatedQueue);
    saveOfflineQueue(updatedQueue);
    
    return newAction;
  }, [queuedActions]);

  const removeAction = useCallback((actionId: string) => {
    const updatedQueue = queuedActions.filter(a => a.id !== actionId);
    setQueuedActions(updatedQueue);
    removeFromOfflineQueue(actionId);
    
    // Clear error for this action
    const newErrors = new Map(syncErrors);
    newErrors.delete(actionId);
    setSyncErrors(newErrors);
  }, [queuedActions, syncErrors]);

  const clearQueue = useCallback(() => {
    setQueuedActions([]);
    localStorage.removeItem('offline-queue');
    setSyncErrors(new Map());
  }, []);

  const retryAction = useCallback(async (actionId: string) => {
    const action = queuedActions.find(a => a.id === actionId);
    if (!action) return;

    try {
      // Simulate retry - in real implementation, this would call the actual API
      const retryCount = (action.metadata?.retryCount ?? 0) + 1;
      updateActionRetryMetadata(actionId, retryCount);
      
      // If successful, remove from queue
      removeAction(actionId);
    } catch (error) {
      const newErrors = new Map(syncErrors);
      newErrors.set(actionId, error instanceof Error ? error.message : 'Retry failed');
      setSyncErrors(newErrors);
    }
  }, [queuedActions, syncErrors, removeAction]);

  const syncQueue = useCallback(async () => {
    if (isSyncing || queuedActions.length === 0) return;

    setIsSyncing(true);
    const retryableActions = getRetryableActions();

    for (const action of retryableActions) {
      try {
        // In a real implementation, this would call the actual tRPC procedures
        // For now, we simulate successful sync
        await new Promise(resolve => setTimeout(resolve, 500));
        
        removeAction(action.id);
      } catch (error) {
        const newErrors = new Map(syncErrors);
        newErrors.set(action.id, error instanceof Error ? error.message : 'Sync failed');
        setSyncErrors(newErrors);
      }
    }

    setIsSyncing(false);
  }, [isSyncing, queuedActions, syncErrors, removeAction]);

  return (
    <OfflineQueueContext.Provider
      value={{
        queuedActions,
        isSyncing,
        syncErrors,
        addAction,
        removeAction,
        clearQueue,
        retryAction,
        syncQueue,
      }}
    >
      {children}
    </OfflineQueueContext.Provider>
  );
}

export function useOfflineQueue() {
  const context = useContext(OfflineQueueContext);
  if (!context) {
    throw new Error('useOfflineQueue must be used within OfflineQueueProvider');
  }
  return context;
}
