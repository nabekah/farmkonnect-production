import { useEffect, useState } from 'react';

/**
 * Hook to track the application's connection status
 * Returns true when online, false when offline
 */
export function useConnectionStatus() {
  const [isOnline, setIsOnline] = useState(() => {
    // Initialize with current online status
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
