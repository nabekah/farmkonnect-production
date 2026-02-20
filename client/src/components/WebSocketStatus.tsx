import { useState, useEffect } from 'react';
import { Wifi, WifiOff, X } from 'lucide-react';

interface WebSocketStatusProps {
  isConnected: boolean;
  isReconnecting: boolean;
  reconnectAttempt?: number;
  wsAvailable?: boolean; // Indicates if WebSocket is available
}

/**
 * Dismissible WebSocket status indicator
 * Shows connection status with ability to hide the notification
 */
export function WebSocketStatus({
  isConnected,
  isReconnecting,
  reconnectAttempt = 0,
  wsAvailable = true,
}: WebSocketStatusProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  // Auto-hide when reconnected
  useEffect(() => {
    if (isConnected && !isDismissed && wsAvailable) {
      // Auto-hide after 2 seconds when connected
      const timer = setTimeout(() => {
        setIsDismissed(true);
      }, 2000);

      return () => {
        clearTimeout(timer);
      };
    }
  }, [isConnected, wsAvailable]);

  // Reset dismissed state when connection status changes
  useEffect(() => {
    if (isReconnecting || (!isConnected && !isReconnecting) || !wsAvailable) {
      setIsDismissed(false);
    }
  }, [isReconnecting, isConnected, wsAvailable]);

  // Don't show if dismissed and connected
  if (isDismissed && isConnected) {
    return null;
  }

  // If WebSocket is not available, show a graceful message
  if (!wsAvailable) {
    return (
      <div className="fixed top-16 right-4 flex items-center gap-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg shadow-sm z-50">
        <WifiOff className="w-4 h-4 text-yellow-600" />
        <span className="text-sm text-yellow-700 font-medium">Real-time updates unavailable</span>
        <button
          onClick={() => setIsDismissed(true)}
          className="ml-2 text-yellow-600 hover:text-yellow-800 transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  if (isConnected && !isReconnecting) {
    return (
      <div className="fixed top-16 right-4 flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg shadow-sm z-50">
        <Wifi className="w-4 h-4 text-green-600" />
        <span className="text-sm text-green-700 font-medium">Connected</span>
        <button
          onClick={() => setIsDismissed(true)}
          className="ml-2 text-green-600 hover:text-green-800 transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // Don't show reconnecting toast - silently reconnect in background
  if (isReconnecting) {
    return null;
  }

  return (
    <div className="fixed top-16 right-4 flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg shadow-sm z-50">
      <WifiOff className="w-4 h-4 text-red-600" />
      <span className="text-sm text-red-700 font-medium">Disconnected</span>
      <button
        onClick={() => setIsDismissed(true)}
        className="ml-2 text-red-600 hover:text-red-800 transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
