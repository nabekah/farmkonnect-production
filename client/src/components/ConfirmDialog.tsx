import { forwardRef, ReactNode, useState, useCallback } from 'react';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/ui/button';

export type ConfirmDialogType = 'danger' | 'warning' | 'info' | 'success';

export interface ConfirmDialogProps {
  /**
   * Dialog title
   */
  title: string;
  /**
   * Dialog description/message
   */
  description?: string;
  /**
   * Dialog type (danger, warning, info, success)
   */
  type?: ConfirmDialogType;
  /**
   * Confirm button text
   */
  confirmText?: string;
  /**
   * Cancel button text
   */
  cancelText?: string;
  /**
   * Confirm button variant
   */
  confirmVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost';
  /**
   * Is dialog open
   */
  isOpen: boolean;
  /**
   * Callback when confirmed
   */
  onConfirm: () => void | Promise<void>;
  /**
   * Callback when cancelled
   */
  onCancel?: () => void;
  /**
   * Is loading (async operation)
   */
  isLoading?: boolean;
  /**
   * Custom icon
   */
  icon?: ReactNode;
  /**
   * Show close button
   */
  showCloseButton?: boolean;
  /**
   * Custom className
   */
  className?: string;
  /**
   * Disable confirm button
   */
  disableConfirm?: boolean;
  /**
   * Additional content
   */
  children?: ReactNode;
}

/**
 * ConfirmDialog Component
 * 
 * Modal dialog for confirming destructive or important actions
 */
export const ConfirmDialog = forwardRef<HTMLDivElement, ConfirmDialogProps>(
  (
    {
      title,
      description,
      type = 'warning',
      confirmText = 'Confirm',
      cancelText = 'Cancel',
      confirmVariant = type === 'danger' ? 'destructive' : 'default',
      isOpen,
      onConfirm,
      onCancel,
      isLoading = false,
      icon,
      showCloseButton = true,
      className = '',
      disableConfirm = false,
      children,
    },
    ref
  ) => {
    const [isConfirming, setIsConfirming] = useState(false);

    const handleConfirm = useCallback(async () => {
      setIsConfirming(true);
      try {
        await onConfirm();
      } finally {
        setIsConfirming(false);
      }
    }, [onConfirm]);

    const handleCancel = useCallback(() => {
      onCancel?.();
    }, [onCancel]);

    const getIcon = () => {
      if (icon) return icon;

      switch (type) {
        case 'danger':
          return <AlertTriangle className="h-6 w-6 text-destructive" />;
        case 'warning':
          return <AlertTriangle className="h-6 w-6 text-yellow-600" />;
        case 'success':
          return <CheckCircle className="h-6 w-6 text-green-600" />;
        case 'info':
          return <XCircle className="h-6 w-6 text-blue-600" />;
        default:
          return null;
      }
    };

    const getTypeColor = () => {
      switch (type) {
        case 'danger':
          return 'border-destructive/20 bg-destructive/5';
        case 'warning':
          return 'border-yellow-200 bg-yellow-50';
        case 'success':
          return 'border-green-200 bg-green-50';
        case 'info':
          return 'border-blue-200 bg-blue-50';
        default:
          return 'border-border';
      }
    };

    return (
      <Modal
        ref={ref}
        isOpen={isOpen}
        onClose={handleCancel}
        showCloseButton={showCloseButton}
        className={className}
      >
        <div className="space-y-4">
          {/* Header with Icon */}
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">{getIcon()}</div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold">{title}</h2>
              {description && (
                <p className="mt-1 text-sm text-muted-foreground">{description}</p>
              )}
            </div>
          </div>

          {/* Content */}
          {children && (
            <div className={`rounded-lg border p-4 ${getTypeColor()}`}>
              {children}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isConfirming || isLoading}
            >
              {cancelText}
            </Button>
            <Button
              variant={confirmVariant}
              onClick={handleConfirm}
              disabled={disableConfirm || isConfirming || isLoading}
              isLoading={isConfirming || isLoading}
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </Modal>
    );
  }
);

ConfirmDialog.displayName = 'ConfirmDialog';

/**
 * Hook for managing confirm dialog state
 */
export function useConfirmDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<Partial<ConfirmDialogProps>>({});

  const open = useCallback(
    (options: Partial<ConfirmDialogProps>) => {
      setConfig(options);
      setIsOpen(true);
    },
    []
  );

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  return {
    isOpen,
    config,
    open,
    close,
  };
}

/**
 * Predefined confirm dialogs
 */
export const ConfirmDialogs = {
  /**
   * Delete confirmation
   */
  delete: (itemName: string): Partial<ConfirmDialogProps> => ({
    type: 'danger',
    title: `Delete ${itemName}?`,
    description: `This action cannot be undone. The ${itemName} will be permanently deleted.`,
    confirmText: 'Delete',
    confirmVariant: 'destructive',
  }),

  /**
   * Archive confirmation
   */
  archive: (itemName: string): Partial<ConfirmDialogProps> => ({
    type: 'warning',
    title: `Archive ${itemName}?`,
    description: `The ${itemName} will be archived and hidden from view. You can restore it later.`,
    confirmText: 'Archive',
  }),

  /**
   * Discard changes confirmation
   */
  discardChanges: (): Partial<ConfirmDialogProps> => ({
    type: 'warning',
    title: 'Discard changes?',
    description: 'You have unsaved changes. Are you sure you want to discard them?',
    confirmText: 'Discard',
  }),

  /**
   * Logout confirmation
   */
  logout: (): Partial<ConfirmDialogProps> => ({
    type: 'warning',
    title: 'Logout?',
    description: 'Are you sure you want to logout?',
    confirmText: 'Logout',
  }),

  /**
   * Clear data confirmation
   */
  clearData: (dataType: string): Partial<ConfirmDialogProps> => ({
    type: 'danger',
    title: `Clear all ${dataType}?`,
    description: `This will permanently delete all ${dataType}. This action cannot be undone.`,
    confirmText: 'Clear',
    confirmVariant: 'destructive',
  }),

  /**
   * Confirm action
   */
  action: (action: string): Partial<ConfirmDialogProps> => ({
    type: 'info',
    title: `Confirm ${action}?`,
    description: `Are you sure you want to ${action.toLowerCase()}?`,
    confirmText: 'Confirm',
  }),
};
