import { AlertCircle, X, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ErrorToastProps {
  id: string;
  message: string;
  error?: Error;
  onRetry?: () => void;
  onDismiss: (id: string) => void;
  autoClose?: boolean;
  autoCloseDuration?: number;
}

export function ErrorToast({
  id,
  message,
  error,
  onRetry,
  onDismiss,
  autoClose = true,
  autoCloseDuration = 5000,
}: ErrorToastProps) {
  // Auto-dismiss after duration
  if (autoClose) {
    setTimeout(() => {
      onDismiss(id);
    }, autoCloseDuration);
  }

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg shadow-lg',
        'bg-red-50 border border-red-200',
        'animate-in slide-in-from-right-full duration-300'
      )}
      role="alert"
    >
      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-red-900">{message}</p>
        {error && process.env.NODE_ENV === 'development' && (
          <p className="text-xs text-red-700 mt-1 truncate">{error.message}</p>
        )}
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {onRetry && (
          <button
            onClick={onRetry}
            className={cn(
              'inline-flex items-center gap-1 px-2 py-1 rounded',
              'text-xs font-medium text-red-700 hover:bg-red-100',
              'transition-colors'
            )}
            title="Retry"
          >
            <RotateCcw className="w-3 h-3" />
            Retry
          </button>
        )}

        <button
          onClick={() => onDismiss(id)}
          className={cn(
            'inline-flex items-center justify-center p-1 rounded',
            'text-red-600 hover:bg-red-100',
            'transition-colors'
          )}
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
