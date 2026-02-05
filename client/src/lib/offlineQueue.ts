/**
 * Offline Queue System
 * Stores user actions while offline and syncs them when connection is restored
 */

export type QueuedActionType = 'mutation' | 'form_submission' | 'data_update';

export interface QueuedAction {
  id: string;
  type: QueuedActionType;
  timestamp: number;
  procedure: string;
  data: unknown;
  metadata?: {
    description?: string;
    retryCount?: number;
    lastRetryTime?: number;
  };
}

export interface OfflineQueueState {
  actions: QueuedAction[];
  isSyncing: boolean;
  syncErrors: Map<string, string>;
}

const QUEUE_STORAGE_KEY = 'offline-queue';
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

/**
 * Get the offline queue from localStorage
 */
export function getOfflineQueue(): QueuedAction[] {
  try {
    const stored = localStorage.getItem(QUEUE_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    console.error('Failed to parse offline queue from storage');
    return [];
  }
}

/**
 * Save the offline queue to localStorage
 */
export function saveOfflineQueue(actions: QueuedAction[]): void {
  try {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(actions));
  } catch {
    console.error('Failed to save offline queue to storage');
  }
}

/**
 * Add an action to the offline queue
 */
export function addToOfflineQueue(action: Omit<QueuedAction, 'id' | 'timestamp'>): QueuedAction {
  const queue = getOfflineQueue();
  const newAction: QueuedAction = {
    ...action,
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
  };
  queue.push(newAction);
  saveOfflineQueue(queue);
  return newAction;
}

/**
 * Remove an action from the offline queue
 */
export function removeFromOfflineQueue(actionId: string): void {
  const queue = getOfflineQueue();
  const filtered = queue.filter(action => action.id !== actionId);
  saveOfflineQueue(filtered);
}

/**
 * Clear the entire offline queue
 */
export function clearOfflineQueue(): void {
  localStorage.removeItem(QUEUE_STORAGE_KEY);
}

/**
 * Get the number of queued actions
 */
export function getQueuedActionCount(): number {
  return getOfflineQueue().length;
}

/**
 * Update retry metadata for an action
 */
export function updateActionRetryMetadata(actionId: string, retryCount: number): void {
  const queue = getOfflineQueue();
  const action = queue.find(a => a.id === actionId);
  if (action) {
    action.metadata = {
      ...action.metadata,
      retryCount,
      lastRetryTime: Date.now(),
    };
    saveOfflineQueue(queue);
  }
}

/**
 * Check if an action has exceeded max retries
 */
export function hasExceededMaxRetries(action: QueuedAction): boolean {
  return (action.metadata?.retryCount ?? 0) >= MAX_RETRIES;
}

/**
 * Get actions that are ready to retry
 */
export function getRetryableActions(): QueuedAction[] {
  const queue = getOfflineQueue();
  const now = Date.now();
  
  return queue.filter(action => {
    if (hasExceededMaxRetries(action)) return false;
    
    const lastRetryTime = action.metadata?.lastRetryTime ?? 0;
    const retryCount = action.metadata?.retryCount ?? 0;
    
    // Exponential backoff: 2s, 4s, 8s
    const backoffDelay = RETRY_DELAY * Math.pow(2, retryCount);
    return now - lastRetryTime >= backoffDelay;
  });
}
