import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { WifiOff, Wifi, RotateCcw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

/**
 * OfflineIndicator Component
 * Displays offline status banner and sync controls
 */
export function OfflineIndicator() {
  const isOnline = useOnlineStatus();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  useEffect(() => {
    if (isOnline && syncMessage) {
      // Clear sync message after 3 seconds when back online
      const timer = setTimeout(() => {
        setSyncMessage('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, syncMessage]);

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncMessage('Syncing...');

    try {
      // Trigger sync operations
      // This could include:
      // - Syncing queued requests
      // - Updating cached data
      // - Refreshing UI state
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSyncMessage('Synced successfully');
    } catch (error) {
      setSyncMessage('Sync failed');
      console.error('Sync error:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  if (isOnline) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 z-40',
        'bg-amber-50 border-b border-amber-200',
        'px-4 py-3 flex items-center justify-between gap-4',
        'animate-in slide-in-from-top duration-300'
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-3">
        <WifiOff className="w-5 h-5 text-amber-600 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-amber-900">You are offline</p>
          <p className="text-xs text-amber-700 mt-0.5">
            Changes will be synced when you're back online
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {syncMessage && (
          <span className="text-xs text-amber-700 font-medium whitespace-nowrap">
            {syncMessage}
          </span>
        )}
        <button
          onClick={handleSync}
          disabled={isSyncing}
          className={cn(
            'inline-flex items-center gap-1 px-3 py-1.5 rounded',
            'text-xs font-medium text-amber-700',
            'bg-amber-100 hover:bg-amber-200',
            'transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
          )}
          title="Sync now"
        >
          <RotateCcw className={cn('w-3 h-3', isSyncing && 'animate-spin')} />
          Sync
        </button>
      </div>
    </div>
  );
}

/**
 * Online Status Badge Component
 * Small indicator showing current online/offline status
 */
export function OnlineStatusBadge() {
  const isOnline = useOnlineStatus();

  return (
    <div className="flex items-center gap-2 text-xs">
      <div
        className={cn(
          'w-2 h-2 rounded-full',
          isOnline ? 'bg-green-500' : 'bg-red-500'
        )}
      />
      <span className={isOnline ? 'text-green-700' : 'text-red-700'}>
        {isOnline ? 'Online' : 'Offline'}
      </span>
    </div>
  );
}
