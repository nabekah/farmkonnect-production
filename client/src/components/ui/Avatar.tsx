import { forwardRef, useState, ReactNode } from 'react';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
export type AvatarShape = 'circle' | 'square';

export interface AvatarProps {
  /**
   * Image source URL
   */
  src?: string;
  /**
   * Alt text for image
   */
  alt?: string;
  /**
   * User name for initials fallback
   */
  name?: string;
  /**
   * Avatar size
   */
  size?: AvatarSize;
  /**
   * Avatar shape
   */
  shape?: AvatarShape;
  /**
   * Background color for initials
   */
  bgColor?: string;
  /**
   * Text color for initials
   */
  textColor?: string;
  /**
   * Custom icon component
   */
  icon?: ReactNode;
  /**
   * Show border
   */
  showBorder?: boolean;
  /**
   * Border color
   */
  borderColor?: string;
  /**
   * Status indicator
   */
  status?: 'online' | 'offline' | 'away' | 'busy';
  /**
   * Custom className
   */
  className?: string;
  /**
   * Image loading callback
   */
  onImageLoad?: () => void;
  /**
   * Image error callback
   */
  onImageError?: () => void;
}

/**
 * Get initials from name
 */
function getInitials(name?: string): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Get background color based on name hash
 */
function getBackgroundColor(name?: string): string {
  if (!name) return 'bg-gray-300';

  const colors = [
    'bg-red-500',
    'bg-orange-500',
    'bg-yellow-500',
    'bg-green-500',
    'bg-blue-500',
    'bg-indigo-500',
    'bg-purple-500',
    'bg-pink-500',
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}

/**
 * Avatar Component
 * 
 * Displays user avatar with image or initials fallback
 */
export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  (
    {
      src,
      alt,
      name,
      size = 'md',
      shape = 'circle',
      bgColor,
      textColor = 'text-white',
      icon,
      showBorder = false,
      borderColor = 'border-white',
      status,
      className = '',
      onImageLoad,
      onImageError,
    },
    ref
  ) => {
    const [imageError, setImageError] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);

    const sizeClasses: Record<AvatarSize, string> = {
      xs: 'h-6 w-6 text-xs',
      sm: 'h-8 w-8 text-sm',
      md: 'h-10 w-10 text-base',
      lg: 'h-12 w-12 text-lg',
      xl: 'h-16 w-16 text-xl',
      '2xl': 'h-20 w-20 text-2xl',
    };

    const shapeClasses = shape === 'circle' ? 'rounded-full' : 'rounded-lg';
    const bgColorClass = bgColor || getBackgroundColor(name);
    const initials = getInitials(name);

    const handleImageError = () => {
      setImageError(true);
      onImageError?.();
    };

    const handleImageLoad = () => {
      setImageLoaded(true);
      onImageLoad?.();
    };

    return (
      <div
        ref={ref}
        className={cn(
          'relative inline-flex items-center justify-center flex-shrink-0 font-semibold',
          sizeClasses[size],
          shapeClasses,
          !imageError && src && imageLoaded ? 'bg-transparent' : bgColorClass,
          textColor,
          showBorder && 'border-2',
          showBorder && borderColor,
          className
        )}
      >
        {/* Image */}
        {src && !imageError && (
          <img
            src={src}
            alt={alt || name || 'Avatar'}
            className={cn('h-full w-full object-cover', shapeClasses)}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        )}

        {/* Fallback: Initials or Icon */}
        {(!src || imageError) && (
          <>
            {icon ? (
              <div className="flex items-center justify-center">{icon}</div>
            ) : (
              <span>{initials}</span>
            )}
          </>
        )}

        {/* Status Indicator */}
        {status && (
          <div
            className={cn(
              'absolute bottom-0 right-0 rounded-full border-2 border-white',
              size === 'xs' && 'h-2 w-2',
              size === 'sm' && 'h-2.5 w-2.5',
              size === 'md' && 'h-3 w-3',
              size === 'lg' && 'h-3.5 w-3.5',
              size === 'xl' && 'h-4 w-4',
              size === '2xl' && 'h-5 w-5',
              status === 'online' && 'bg-green-500',
              status === 'offline' && 'bg-gray-400',
              status === 'away' && 'bg-yellow-500',
              status === 'busy' && 'bg-red-500'
            )}
          />
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

/**
 * AvatarGroup Component
 * 
 * Display multiple avatars in a group
 */
export interface AvatarGroupProps {
  /**
   * Array of avatar props
   */
  avatars: AvatarProps[];
  /**
   * Avatar size
   */
  size?: AvatarSize;
  /**
   * Max avatars to show before showing count
   */
  max?: number;
  /**
   * Custom className
   */
  className?: string;
}

export const AvatarGroup = forwardRef<HTMLDivElement, AvatarGroupProps>(
  (
    {
      avatars,
      size = 'md',
      max = 3,
      className = '',
    },
    ref
  ) => {
    const displayedAvatars = avatars.slice(0, max);
    const remaining = avatars.length - max;

    const sizeClasses: Record<AvatarSize, string> = {
      xs: '-ml-2',
      sm: '-ml-2',
      md: '-ml-3',
      lg: '-ml-4',
      xl: '-ml-5',
      '2xl': '-ml-6',
    };

    return (
      <div
        ref={ref}
        className={cn('flex items-center', className)}
      >
        {displayedAvatars.map((avatar, index) => (
          <div
            key={index}
            className={cn(
              'relative',
              index > 0 && sizeClasses[size],
              'border-2 border-white'
            )}
          >
            <Avatar {...avatar} size={size} showBorder={false} />
          </div>
        ))}

        {remaining > 0 && (
          <div
            className={cn(
              'relative flex items-center justify-center font-semibold text-white bg-gray-400 border-2 border-white',
              size === 'xs' && 'h-6 w-6 text-xs',
              size === 'sm' && 'h-8 w-8 text-sm',
              size === 'md' && 'h-10 w-10 text-base',
              size === 'lg' && 'h-12 w-12 text-lg',
              size === 'xl' && 'h-16 w-16 text-xl',
              size === '2xl' && 'h-20 w-20 text-2xl',
              'rounded-full',
              sizeClasses[size]
            )}
          >
            +{remaining}
          </div>
        )}
      </div>
    );
  }
);

AvatarGroup.displayName = 'AvatarGroup';
