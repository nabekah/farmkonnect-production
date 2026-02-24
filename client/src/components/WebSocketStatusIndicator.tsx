import React, { useEffect, useState } from 'react';
import { AlertCircle, Wifi, WifiOff, Loader } from 'lucide-react';

interface WebSocketStatusIndicatorProps {
  connected: boolean;
  reconnecting?: boolean;
  className?: string;
  showLabel?: boolean;
  position?: 'fixed' | 'absolute' | 'relative';
}

export function WebSocketStatusIndicator({
  connected,
  reconnecting = false,
  className = '',
  showLabel = false,
  position = 'fixed',
}: WebSocketStatusIndicatorProps) {
  const [isVisible, setIsVisible] = useState(!connected);

  useEffect(() => {
    // Only show indicator when disconnected or reconnecting
    setIsVisible(!connected || reconnecting);
  }, [connected, reconnecting]);

  if (isVisible && connected && !reconnecting) {
    // Hide after 2 seconds when reconnected
    const timer = setTimeout(() => setIsVisible(false), 2000);
    return () => clearTimeout(timer);
  }

  if (!isVisible && connected && !reconnecting) {
    return null;
  }

  const statusConfig = {
    connected: {
      icon: Wifi,
      color: 'text-green-500',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      label: 'Connected',
      borderColor: 'border-green-200 dark:border-green-800',
    },
    reconnecting: {
      icon: Loader,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      label: 'Reconnecting...',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
      animate: true,
    },
    disconnected: {
      icon: WifiOff,
      color: 'text-red-500',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      label: 'Disconnected',
      borderColor: 'border-red-200 dark:border-red-800',
    },
  };

  const status = reconnecting ? 'reconnecting' : connected ? 'connected' : 'disconnected';
  const config = statusConfig[status];
  const Icon = config.icon;

  const positionClasses = {
    fixed: 'fixed bottom-4 right-4 z-50',
    absolute: 'absolute bottom-4 right-4',
    relative: 'relative',
  };

  return (
    <div
      className={`
        ${positionClasses[position]}
        flex items-center gap-2 px-3 py-2 rounded-lg border
        ${config.bgColor} ${config.borderColor}
        transition-all duration-300
        ${className}
      `}
    >
      <Icon
        className={`h-4 w-4 ${config.color} ${config.animate ? 'animate-spin' : ''}`}
      />
      {showLabel && (
        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
          {config.label}
        </span>
      )}
    </div>
  );
}

interface WebSocketStatusBannerProps {
  connected: boolean;
  reconnecting?: boolean;
  onDismiss?: () => void;
}

export function WebSocketStatusBanner({
  connected,
  reconnecting = false,
  onDismiss,
}: WebSocketStatusBannerProps) {
  const [isVisible, setIsVisible] = useState(!connected || reconnecting);

  useEffect(() => {
    setIsVisible(!connected || reconnecting);
  }, [connected, reconnecting]);

  if (!isVisible) return null;

  const isError = !connected && !reconnecting;

  return (
    <div
      className={`
        w-full px-4 py-3 flex items-center justify-between
        ${isError ? 'bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800' : 'bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800'}
      `}
    >
      <div className="flex items-center gap-2">
        {reconnecting ? (
          <>
            <Loader className="h-4 w-4 text-yellow-500 animate-spin" />
            <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              Reconnecting to server...
            </span>
          </>
        ) : isError ? (
          <>
            <AlertCircle className="h-4 w-4 text-red-500" />
            <span className="text-sm font-medium text-red-800 dark:text-red-200">
              Connection lost. Attempting to reconnect...
            </span>
          </>
        ) : (
          <>
            <Wifi className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium text-green-800 dark:text-green-200">
              Connected to server
            </span>
          </>
        )}
      </div>
      {onDismiss && (
        <button
          onClick={() => {
            setIsVisible(false);
            onDismiss();
          }}
          className="text-xs font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          Dismiss
        </button>
      )}
    </div>
  );
}
