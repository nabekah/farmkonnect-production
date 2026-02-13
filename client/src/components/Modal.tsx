import { forwardRef, useEffect, useRef, useCallback, ReactNode } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface ModalProps {
  /**
   * Whether the modal is open
   */
  isOpen: boolean;
  /**
   * Callback when modal should close
   */
  onClose: () => void;
  /**
   * Modal title
   */
  title?: string;
  /**
   * Modal content
   */
  children: ReactNode;
  /**
   * Modal footer content
   */
  footer?: ReactNode;
  /**
   * Allow closing by clicking backdrop
   */
  closeOnBackdropClick?: boolean;
  /**
   * Allow closing with Escape key
   */
  closeOnEscape?: boolean;
  /**
   * Modal size
   */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /**
   * Custom className for modal
   */
  className?: string;
  /**
   * Custom className for backdrop
   */
  backdropClassName?: string;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-full mx-4',
};

/**
 * Modal Component
 * 
 * Accessible modal dialog with focus management, keyboard support, and backdrop interaction
 */
export const Modal = forwardRef<HTMLDivElement, ModalProps>(
  (
    {
      isOpen,
      onClose,
      title,
      children,
      footer,
      closeOnBackdropClick = true,
      closeOnEscape = true,
      size = 'md',
      className = '',
      backdropClassName = '',
    },
    ref
  ) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const previousActiveElement = useRef<HTMLElement | null>(null);

    // Handle focus management
    useEffect(() => {
      if (!isOpen) return;

      // Save the currently focused element
      previousActiveElement.current = document.activeElement as HTMLElement;

      // Focus the modal
      const timer = setTimeout(() => {
        const focusableElements = modalRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements && focusableElements.length > 0) {
          (focusableElements[0] as HTMLElement).focus();
        } else {
          modalRef.current?.focus();
        }
      }, 0);

      return () => clearTimeout(timer);
    }, [isOpen]);

    // Handle keyboard events
    useEffect(() => {
      if (!isOpen) return;

      const handleKeyDown = (e: KeyboardEvent) => {
        // Close on Escape
        if (closeOnEscape && e.key === 'Escape') {
          onClose();
        }

        // Trap focus within modal (Tab key)
        if (e.key === 'Tab') {
          const focusableElements = modalRef.current?.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );

          if (!focusableElements || focusableElements.length === 0) return;

          const firstElement = focusableElements[0] as HTMLElement;
          const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

          if (e.shiftKey) {
            // Shift + Tab
            if (document.activeElement === firstElement) {
              e.preventDefault();
              lastElement.focus();
            }
          } else {
            // Tab
            if (document.activeElement === lastElement) {
              e.preventDefault();
              firstElement.focus();
            }
          }
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, closeOnEscape, onClose]);

    // Restore focus when modal closes
    useEffect(() => {
      if (isOpen) return;

      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    }, [isOpen]);

    // Prevent body scroll when modal is open
    useEffect(() => {
      if (isOpen) {
        document.body.style.overflow = 'hidden';
        return () => {
          document.body.style.overflow = '';
        };
      }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (closeOnBackdropClick && e.target === e.currentTarget) {
        onClose();
      }
    };

    return (
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 ${backdropClassName}`}
        onClick={handleBackdropClick}
        role="presentation"
      >
        <div
          ref={ref || modalRef}
          className={`relative w-full rounded-lg border border-border bg-background shadow-lg ${sizeClasses[size]} ${className}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? 'modal-title' : undefined}
        >
          {/* Header */}
          {title && (
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 id="modal-title" className="text-lg font-semibold">
                {title}
              </h2>
              <button
                onClick={onClose}
                className="rounded-md p-1 hover:bg-muted focus-visible:outline-ring"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}

          {/* Content */}
          <div className="px-6 py-4">{children}</div>

          {/* Footer */}
          {footer && (
            <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
              {footer}
            </div>
          )}
        </div>
      </div>
    );
  }
);

Modal.displayName = 'Modal';

/**
 * Confirmation Modal Component
 * 
 * Pre-built modal for confirmation dialogs
 */
export function ConfirmationModal({
  isOpen,
  onClose,
  title = 'Confirm',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  isLoading = false,
  variant = 'default',
}: {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => Promise<void> | void;
  isLoading?: boolean;
  variant?: 'default' | 'destructive';
}) {
  const handleConfirm = useCallback(async () => {
    await onConfirm();
    onClose();
  }, [onConfirm, onClose]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            variant={variant === 'destructive' ? 'destructive' : 'default'}
          >
            {isLoading ? 'Loading...' : confirmText}
          </Button>
        </>
      }
    >
      <p className="text-sm text-muted-foreground">{message}</p>
    </Modal>
  );
}

/**
 * Alert Modal Component
 * 
 * Pre-built modal for alert dialogs
 */
export function AlertModal({
  isOpen,
  onClose,
  title = 'Alert',
  message,
  actionText = 'OK',
  variant = 'default',
}: {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  actionText?: string;
  variant?: 'default' | 'warning' | 'destructive';
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <Button onClick={onClose} variant={variant === 'destructive' ? 'destructive' : 'default'}>
          {actionText}
        </Button>
      }
    >
      <p className="text-sm text-muted-foreground">{message}</p>
    </Modal>
  );
}

/**
 * Hook for managing modal state
 */
export function useModal(initialOpen = false) {
  const [isOpen, setIsOpen] = useCallback((open: boolean) => {
    setIsOpen(open);
  }, []);

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen((prev) => !prev),
  };
}
