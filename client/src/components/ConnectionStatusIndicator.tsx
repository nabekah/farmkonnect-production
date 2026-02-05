import { WifiOff, Wifi } from 'lucide-react';
import { useConnectionStatus } from '@/hooks/useConnectionStatus';
import { useEffect, useState } from 'react';

/**
 * Connection Status Indicator Component
 * Displays a banner in the header when the application is offline
 * Shows auto-reconnect status when connection is restored
 */
export function ConnectionStatusIndicator() {
  const isOnline = useConnectionStatus();
  const [showReconnecting, setShowReconnecting] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
      setShowReconnecting(false);
    } else if (wasOffline) {
      // Show reconnecting status briefly when coming back online
      setShowReconnecting(true);
      const timer = setTimeout(() => {
        setShowReconnecting(false);
        setWasOffline(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  // Only show when offline or reconnecting
  if (isOnline && !showReconnecting) {
    return null;
  }

  return (
    <div
      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-300 ${
        showReconnecting
          ? 'bg-amber-50 text-amber-800 border-b border-amber-200'
          : 'bg-red-50 text-red-800 border-b border-red-200'
      }`}
      role="status"
      aria-live="polite"
      aria-label={showReconnecting ? 'Reconnecting to server' : 'Connection lost'}
    >
      {showReconnecting ? (
        <>
          <div className="flex items-center gap-1.5">
            <Wifi className="h-4 w-4 animate-pulse" />
            <span>Reconnecting...</span>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center gap-1.5">
            <WifiOff className="h-4 w-4" />
            <span>You are offline</span>
          </div>
          <span className="text-xs opacity-75 ml-auto">Check your connection</span>
        </>
      )}
    </div>
  );
}
