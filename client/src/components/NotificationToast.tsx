import React, { useEffect, useState } from 'react';
import { AlertCircle, AlertTriangle, Info, CheckCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type NotificationType = 'weather_alert' | 'pest_warning' | 'task_update' | 'system_alert' | 'info';
export type NotificationSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface NotificationToastProps {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  severity: NotificationSeverity;
  actionUrl?: string;
  onClose?: () => void;
  autoClose?: boolean;
  autoCloseDuration?: number;
}

const severityStyles: Record<NotificationSeverity, string> = {
  low: 'bg-blue-50 border-blue-200 text-blue-900',
  medium: 'bg-yellow-50 border-yellow-200 text-yellow-900',
  high: 'bg-orange-50 border-orange-200 text-orange-900',
  critical: 'bg-red-50 border-red-200 text-red-900',
};

const severityIcons: Record<NotificationSeverity, React.ReactNode> = {
  low: <Info className="h-5 w-5 text-blue-600" />,
  medium: <AlertTriangle className="h-5 w-5 text-yellow-600" />,
  high: <AlertCircle className="h-5 w-5 text-orange-600" />,
  critical: <AlertCircle className="h-5 w-5 text-red-600" />,
};

export function NotificationToast({
  id,
  type,
  title,
  message,
  severity,
  actionUrl,
  onClose,
  autoClose = true,
  autoCloseDuration = 5000,
}: NotificationToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!autoClose) return;

    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, autoCloseDuration);

    return () => clearTimeout(timer);
  }, [autoClose, autoCloseDuration, onClose]);

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 max-w-md p-4 border rounded-lg shadow-lg animate-in slide-in-from-right-full duration-300 flex gap-3',
        severityStyles[severity]
      )}
      role="alert"
    >
      <div className="flex-shrink-0 pt-0.5">{severityIcons[severity]}</div>

      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-sm">{title}</h3>
        <p className="text-sm mt-1 opacity-90">{message}</p>

        {actionUrl && (
          <a
            href={actionUrl}
            className="text-sm font-medium mt-2 inline-block underline hover:opacity-75 transition"
          >
            View Details →
          </a>
        )}
      </div>

      <button
        onClick={() => {
          setIsVisible(false);
          onClose?.();
        }}
        className="flex-shrink-0 opacity-50 hover:opacity-100 transition"
        aria-label="Close notification"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}

interface NotificationContainerProps {
  notifications: NotificationToastProps[];
  onRemove: (id: string) => void;
}

export function NotificationContainer({
  notifications,
  onRemove,
}: NotificationContainerProps) {
  return (
    <div className="fixed bottom-4 right-4 space-y-3 pointer-events-none">
      {notifications.map(notification => (
        <div key={notification.id} className="pointer-events-auto">
          <NotificationToast
            {...notification}
            onClose={() => onRemove(notification.id)}
          />
        </div>
      ))}
    </div>
  );
}
