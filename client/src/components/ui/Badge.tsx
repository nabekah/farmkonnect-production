import { forwardRef, ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info';
export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps {
  /**
   * Badge content
   */
  children: ReactNode;
  /**
   * Badge variant
   */
  variant?: BadgeVariant;
  /**
   * Badge size
   */
  size?: BadgeSize;
  /**
   * Show close button
   */
  dismissible?: boolean;
  /**
   * Callback when close button clicked
   */
  onDismiss?: () => void;
  /**
   * Custom icon
   */
  icon?: ReactNode;
  /**
   * Custom className
   */
  className?: string;
}

/**
 * Badge Component
 * 
 * Status indicator or tag component with multiple variants
 */
export const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  (
    {
      children,
      variant = 'default',
      size = 'md',
      dismissible = false,
      onDismiss,
      icon,
      className = '',
    },
    ref
  ) => {
    const variantClasses: Record<BadgeVariant, string> = {
      default: 'bg-primary text-primary-foreground',
      secondary: 'bg-secondary text-secondary-foreground',
      destructive: 'bg-destructive text-destructive-foreground',
      outline: 'border border-border text-foreground bg-transparent',
      success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      info: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    };

    const sizeClasses: Record<BadgeSize, string> = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-1 text-sm',
      lg: 'px-3 py-1.5 text-base',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full font-medium transition-colors',
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
      >
        {/* Icon */}
        {icon && (
          <span className="flex-shrink-0">
            {icon}
          </span>
        )}

        {/* Content */}
        <span className="flex-shrink-0">{children}</span>

        {/* Dismiss button */}
        {dismissible && (
          <button
            onClick={onDismiss}
            className="ml-1 flex-shrink-0 hover:opacity-70 transition-opacity"
            aria-label="Remove badge"
          >
            <X
              className={cn(
                size === 'sm' && 'h-3 w-3',
                size === 'md' && 'h-3.5 w-3.5',
                size === 'lg' && 'h-4 w-4'
              )}
            />
          </button>
        )}
      </div>
    );
  }
);

Badge.displayName = 'Badge';

/**
 * BadgeGroup Component
 * 
 * Display multiple badges
 */
export interface BadgeGroupProps {
  /**
   * Array of badge items
   */
  items: Array<{
    id: string;
    label: string;
    variant?: BadgeVariant;
    icon?: ReactNode;
  }>;
  /**
   * Badge size
   */
  size?: BadgeSize;
  /**
   * Show close buttons
   */
  dismissible?: boolean;
  /**
   * Callback when badge dismissed
   */
  onDismiss?: (id: string) => void;
  /**
   * Custom className
   */
  className?: string;
}

export const BadgeGroup = forwardRef<HTMLDivElement, BadgeGroupProps>(
  (
    {
      items,
      size = 'md',
      dismissible = false,
      onDismiss,
      className = '',
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn('flex flex-wrap gap-2', className)}
      >
        {items.map((item) => (
          <Badge
            key={item.id}
            variant={item.variant}
            size={size}
            dismissible={dismissible}
            onDismiss={() => onDismiss?.(item.id)}
            icon={item.icon}
          >
            {item.label}
          </Badge>
        ))}
      </div>
    );
  }
);

BadgeGroup.displayName = 'BadgeGroup';

/**
 * StatusBadge Component
 * 
 * Specialized badge for status indicators
 */
export type StatusType = 'active' | 'inactive' | 'pending' | 'completed' | 'failed' | 'warning';

export interface StatusBadgeProps {
  /**
   * Status type
   */
  status: StatusType;
  /**
   * Custom label
   */
  label?: string;
  /**
   * Badge size
   */
  size?: BadgeSize;
  /**
   * Show dot indicator
   */
  showDot?: boolean;
  /**
   * Custom className
   */
  className?: string;
}

const statusConfig: Record<StatusType, { label: string; variant: BadgeVariant; color: string }> = {
  active: { label: 'Active', variant: 'success', color: 'bg-green-500' },
  inactive: { label: 'Inactive', variant: 'secondary', color: 'bg-gray-500' },
  pending: { label: 'Pending', variant: 'warning', color: 'bg-yellow-500' },
  completed: { label: 'Completed', variant: 'success', color: 'bg-green-500' },
  failed: { label: 'Failed', variant: 'destructive', color: 'bg-red-500' },
  warning: { label: 'Warning', variant: 'warning', color: 'bg-yellow-500' },
};

export const StatusBadge = forwardRef<HTMLDivElement, StatusBadgeProps>(
  (
    {
      status,
      label,
      size = 'md',
      showDot = true,
      className = '',
    },
    ref
  ) => {
    const config = statusConfig[status];
    const displayLabel = label || config.label;

    return (
      <Badge
        ref={ref}
        variant={config.variant}
        size={size}
        icon={
          showDot && (
            <div className={cn('h-2 w-2 rounded-full', config.color)} />
          )
        }
        className={className}
      >
        {displayLabel}
      </Badge>
    );
  }
);

StatusBadge.displayName = 'StatusBadge';

/**
 * CountBadge Component
 * 
 * Badge for displaying counts
 */
export interface CountBadgeProps {
  /**
   * Count value
   */
  count: number;
  /**
   * Max count to display (shows + if exceeded)
   */
  max?: number;
  /**
   * Badge variant
   */
  variant?: BadgeVariant;
  /**
   * Badge size
   */
  size?: BadgeSize;
  /**
   * Custom className
   */
  className?: string;
}

export const CountBadge = forwardRef<HTMLDivElement, CountBadgeProps>(
  (
    {
      count,
      max = 99,
      variant = 'default',
      size = 'md',
      className = '',
    },
    ref
  ) => {
    const displayCount = count > max ? `${max}+` : count;

    return (
      <Badge
        ref={ref}
        variant={variant}
        size={size}
        className={cn('min-w-fit', className)}
      >
        {displayCount}
      </Badge>
    );
  }
);

CountBadge.displayName = 'CountBadge';
