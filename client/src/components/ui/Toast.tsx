import { forwardRef, useState, useCallback, useEffect, ReactNode } from 'react';
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'warning' | 'info';
export type ToastPosition = 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';

export interface ToastProps {
  /**
   * Toast ID
   */
  id: string;
  /**
   * Toast title
   */
  title: string;
  /**
   * Toast description
   */
  description?: string;
  /**
   * Toast type
   */
  type?: ToastType;
  /**
   * Auto dismiss duration in ms (0 = no auto dismiss)
   */
  duration?: number;
  /**
   * Callback when dismissed
   */
  onDismiss?: (id: string) => void;
  /**
   * Custom icon
   */
  icon?: ReactNode;
  /**
   * Action button
   */
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Toast Component
 * 
 * Individual toast notification with auto-dismiss and stacking support
 */
export const Toast = forwardRef<HTMLDivElement, ToastProps>(
  (
    {
      id,
      title,
      description,
      type = 'info',
      duration = 5000,
      onDismiss,
      icon,
      action,
    },
    ref
  ) => {
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
      if (duration === 0) return;

      const timer = setTimeout(() => {
        setIsExiting(true);
        setTimeout(() => {
          onDismiss?.(id);
        }, 300);
      }, duration);

      return () => clearTimeout(timer);
    }, [id, duration, onDismiss]);

    const getIcon = () => {
      if (icon) return icon;

      switch (type) {
        case 'success':
          return <CheckCircle className="h-5 w-5 text-green-600" />;
        case 'error':
          return <AlertCircle className="h-5 w-5 text-red-600" />;
        case 'warning':
          return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
        case 'info':
          return <Info className="h-5 w-5 text-blue-600" />;
        default:
          return null;
      }
    };

    const getBgColor = () => {
      switch (type) {
        case 'success':
          return 'bg-green-50 border-green-200';
        case 'error':
          return 'bg-red-50 border-red-200';
        case 'warning':
          return 'bg-yellow-50 border-yellow-200';
        case 'info':
          return 'bg-blue-50 border-blue-200';
        default:
          return 'bg-background border-border';
      }
    };

    return (
      <div
        ref={ref}
        className={cn(
          'flex items-start gap-3 p-4 rounded-lg border shadow-lg transition-all duration-300',
          getBgColor(),
          isExiting && 'opacity-0 translate-x-full'
        )}
        role="alert"
        aria-live="polite"
      >
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
          {action && (
            <button
              onClick={action.onClick}
              className="text-sm font-medium text-primary hover:underline mt-2"
            >
              {action.label}
            </button>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={() => {
            setIsExiting(true);
            setTimeout(() => {
              onDismiss?.(id);
            }, 300);
          }}
          className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close notification"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }
);

Toast.displayName = 'Toast';

/**
 * ToastContainer Component
 * 
 * Container for managing multiple toasts with stacking
 */
export interface ToastContainerProps {
  /**
   * Toasts to display
   */
  toasts: ToastProps[];
  /**
   * Position of the container
   */
  position?: ToastPosition;
  /**
   * Callback when toast dismissed
   */
  onDismiss?: (id: string) => void;
  /**
   * Max toasts to show
   */
  maxToasts?: number;
}

export const ToastContainer = forwardRef<HTMLDivElement, ToastContainerProps>(
  (
    {
      toasts,
      position = 'bottom-right',
      onDismiss,
      maxToasts = 3,
    },
    ref
  ) => {
    const getPositionClasses = () => {
      const baseClasses = 'fixed z-50 pointer-events-none';
      const positionMap: Record<ToastPosition, string> = {
        'top-left': 'top-4 left-4',
        'top-center': 'top-4 left-1/2 -translate-x-1/2',
        'top-right': 'top-4 right-4',
        'bottom-left': 'bottom-4 left-4',
        'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
        'bottom-right': 'bottom-4 right-4',
      };
      return `${baseClasses} ${positionMap[position]}`;
    };

    const displayedToasts = toasts.slice(0, maxToasts);

    return (
      <div
        ref={ref}
        className={getPositionClasses()}
      >
        <div className="flex flex-col gap-2 w-96 max-w-[calc(100vw-2rem)]">
          {displayedToasts.map((toast) => (
            <div key={toast.id} className="pointer-events-auto">
              <Toast
                {...toast}
                onDismiss={onDismiss}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }
);

ToastContainer.displayName = 'ToastContainer';

/**
 * Hook for managing toast notifications
 */
export function useToast() {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const addToast = useCallback(
    (options: Omit<ToastProps, 'id' | 'onDismiss'>) => {
      const id = `toast-${Date.now()}-${Math.random()}`;
      const toast: ToastProps = {
        ...options,
        id,
        onDismiss: (dismissId) => {
          setToasts((prev) => prev.filter((t) => t.id !== dismissId));
        },
      };
      setToasts((prev) => [...prev, toast]);
      return id;
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback(
    (title: string, description?: string) => {
      return addToast({ title, description, type: 'success' });
    },
    [addToast]
  );

  const error = useCallback(
    (title: string, description?: string) => {
      return addToast({ title, description, type: 'error' });
    },
    [addToast]
  );

  const warning = useCallback(
    (title: string, description?: string) => {
      return addToast({ title, description, type: 'warning' });
    },
    [addToast]
  );

  const info = useCallback(
    (title: string, description?: string) => {
      return addToast({ title, description, type: 'info' });
    },
    [addToast]
  );

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
  };
}
