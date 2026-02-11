import { useState, useEffect, useCallback } from 'react';

interface OnlineStatusCallbacks {
  onOnline?: () => void;
  onOffline?: () => void;
}

/**
 * useOnlineStatus Hook
 * Detects network connectivity changes and provides online/offline status
 */
export function useOnlineStatus(callbacks?: OnlineStatusCallbacks) {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      callbacks?.onOnline?.();
      console.log('[Online Status] Connection restored');
    };

    const handleOffline = () => {
      setIsOnline(false);
      callbacks?.onOffline?.();
      console.log('[Online Status] Connection lost');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [callbacks]);

  return isOnline;
}

/**
 * Utility function to check online status
 */
export function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

/**
 * Utility function to wait for online status
 */
export function waitForOnline(timeout = 30000): Promise<void> {
  return new Promise((resolve, reject) => {
    if (navigator.onLine) {
      resolve();
      return;
    }

    const handleOnline = () => {
      window.removeEventListener('online', handleOnline);
      clearTimeout(timeoutId);
      resolve();
    };

    const timeoutId = setTimeout(() => {
      window.removeEventListener('online', handleOnline);
      reject(new Error('Timeout waiting for online status'));
    }, timeout);

    window.addEventListener('online', handleOnline);
  });
}
