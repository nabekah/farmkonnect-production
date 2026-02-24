import React from 'react';

interface NotificationBadgeProps {
  count: number;
  variant?: 'default' | 'danger' | 'warning' | 'success';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function NotificationBadge({
  count,
  variant = 'default',
  size = 'md',
  className = '',
}: NotificationBadgeProps) {
  if (count === 0) return null;

  const displayCount = count > 99 ? '99+' : count;

  const variantStyles = {
    default: 'bg-gray-500 text-white',
    danger: 'bg-red-500 text-white',
    warning: 'bg-yellow-500 text-white',
    success: 'bg-green-500 text-white',
  };

  const sizeStyles = {
    sm: 'h-4 w-4 text-xs',
    md: 'h-5 w-5 text-xs',
    lg: 'h-6 w-6 text-sm',
  };

  return (
    <span
      className={`
        inline-flex items-center justify-center rounded-full font-semibold
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
    >
      {displayCount}
    </span>
  );
}

interface NavItemWithBadgeProps {
  icon: React.ReactNode;
  label: string;
  badge?: number;
  badgeVariant?: 'default' | 'danger' | 'warning' | 'success';
  onClick?: () => void;
  className?: string;
}

export function NavItemWithBadge({
  icon,
  label,
  badge = 0,
  badgeVariant = 'default',
  onClick,
  className = '',
}: NavItemWithBadgeProps) {
  return (
    <button
      onClick={onClick}
      className={`
        relative flex items-center gap-2 px-3 py-2 rounded-lg
        hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors
        ${className}
      `}
    >
      <div className="relative">
        {icon}
        {badge > 0 && (
          <NotificationBadge
            count={badge}
            variant={badgeVariant}
            size="sm"
            className="absolute -top-2 -right-2"
          />
        )}
      </div>
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}
