import { AlertCircle, CheckCircle2, RotateCcw, X } from 'lucide-react';
import { Button } from './ui/button';
import { useOfflineQueue } from '@/contexts/OfflineQueueContext';
import { useEffect, useState } from 'react';

interface RetryNotificationProps {
  actionId: string;
  description: string;
  onDismiss: () => void;
}

/**
 * Individual Retry Notification Component
 * Shows a notification for a failed API request with retry button
 */
export function RetryNotification({
  actionId,
  description,
  onDismiss,
}: RetryNotificationProps) {
  const { syncErrors, retryAction } = useOfflineQueue();
  const [isRetrying, setIsRetrying] = useState(false);
  const error = syncErrors.get(actionId);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await retryAction(actionId);
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 border border-red-200 text-red-900">
      <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{description}</p>
        {error && (
          <p className="text-xs text-red-700 mt-1 opacity-75">{error}</p>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Button
          size="sm"
          variant="outline"
          onClick={handleRetry}
          disabled={isRetrying}
          className="h-8"
        >
          <RotateCcw className="h-3.5 w-3.5 mr-1" />
          {isRetrying ? 'Retrying...' : 'Retry'}
        </Button>
        <button
          onClick={onDismiss}
          className="p-1 hover:bg-red-100 rounded transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/**
 * Retry Notifications Container
 * Displays all active retry notifications
 */
export function RetryNotificationsContainer() {
  const { queuedActions, syncErrors } = useOfflineQueue();
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  // Auto-dismiss successful syncs
  useEffect(() => {
    const syncedIds = queuedActions
      .filter(action => !syncErrors.has(action.id))
      .map(action => action.id);

    if (syncedIds.length > 0) {
      const timer = setTimeout(() => {
        setDismissedIds(prev => {
          const newSet = new Set(prev);
          syncedIds.forEach(id => newSet.add(id));
          return newSet;
        });
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [queuedActions, syncErrors]);

  const visibleErrors = Array.from(syncErrors.entries())
    .filter(([id]) => !dismissedIds.has(id))
    .map(([id, error]) => {
      const action = queuedActions.find(a => a.id === id);
      return { id, error, action };
    }) as Array<{ id: string; error: string; action: any }>;

  if (visibleErrors.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-md">
      {visibleErrors.map(({ id, action }) => (
        <RetryNotification
          key={id}
          actionId={id}
          description={action?.metadata?.description || 'Failed to sync data'}
          onDismiss={() => {
            setDismissedIds(prev => {
              const newSet = new Set(prev);
              newSet.add(id);
              return newSet;
            });
          }}
        />
      ))}
    </div>
  );
}

/**
 * Offline Queue Status Indicator
 * Shows count of queued actions waiting to sync
 */
export function OfflineQueueStatus() {
  const { queuedActions, isSyncing } = useOfflineQueue();

  if (queuedActions.length === 0) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-sm">
      {isSyncing ? (
        <>
          <div className="h-2 w-2 bg-amber-600 rounded-full animate-pulse" />
          <span>Syncing {queuedActions.length} action{queuedActions.length !== 1 ? 's' : ''}...</span>
        </>
      ) : (
        <>
          <AlertCircle className="h-4 w-4" />
          <span>{queuedActions.length} action{queuedActions.length !== 1 ? 's' : ''} waiting to sync</span>
        </>
      )}
    </div>
  );
}
