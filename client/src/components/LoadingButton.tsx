import { forwardRef, useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { Button, ButtonProps } from '@/components/ui/button';

export interface LoadingButtonProps extends Omit<ButtonProps, 'onClick'> {
  /**
   * Async function to execute on button click
   */
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => Promise<void> | void;
  /**
   * Text to display while loading
   */
  loadingText?: string;
  /**
   * Show spinner icon while loading
   */
  showSpinner?: boolean;
  /**
   * Disable button while loading
   */
  disableWhileLoading?: boolean;
  /**
   * Callback when loading starts
   */
  onLoadingStart?: () => void;
  /**
   * Callback when loading ends
   */
  onLoadingEnd?: () => void;
  /**
   * Callback when error occurs
   */
  onError?: (error: Error) => void;
}

/**
 * LoadingButton Component
 * 
 * Button that shows loading state during async operations
 * Prevents duplicate submissions and provides visual feedback
 */
export const LoadingButton = forwardRef<HTMLButtonElement, LoadingButtonProps>(
  (
    {
      onClick,
      loadingText = 'Loading...',
      showSpinner = true,
      disableWhileLoading = true,
      onLoadingStart,
      onLoadingEnd,
      onError,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const [isLoading, setIsLoading] = useState(false);

    const handleClick = useCallback(
      async (e: React.MouseEvent<HTMLButtonElement>) => {
        if (isLoading) return;

        try {
          setIsLoading(true);
          onLoadingStart?.();

          if (onClick) {
            await onClick(e);
          }
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          onError?.(err);
        } finally {
          setIsLoading(false);
          onLoadingEnd?.();
        }
      },
      [isLoading, onClick, onLoadingStart, onLoadingEnd, onError]
    );

    return (
      <Button
        ref={ref}
        onClick={handleClick}
        disabled={disabled || (disableWhileLoading && isLoading)}
        {...props}
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            {showSpinner && <Loader2 className="h-4 w-4 animate-spin" />}
            {loadingText}
          </div>
        ) : (
          children
        )}
      </Button>
    );
  }
);

LoadingButton.displayName = 'LoadingButton';

/**
 * Hook for managing loading state in custom components
 */
export function useLoading() {
  const [isLoading, setIsLoading] = useState(false);

  const executeAsync = useCallback(
    async (fn: () => Promise<void>) => {
      try {
        setIsLoading(true);
        await fn();
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    isLoading,
    setIsLoading,
    executeAsync,
  };
}
