import { forwardRef, useState, useCallback, useMemo, ReactNode } from 'react';
import { ChevronDown, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface NavItem {
  /**
   * Unique identifier
   */
  id: string;
  /**
   * Display label
   */
  label: string;
  /**
   * Navigation href
   */
  href?: string;
  /**
   * Icon component
   */
  icon?: ReactNode;
  /**
   * Badge text/number
   */
  badge?: string | number;
  /**
   * Child items for nested navigation
   */
  children?: NavItem[];
  /**
   * Is active
   */
  isActive?: boolean;
  /**
   * Is disabled
   */
  isDisabled?: boolean;
  /**
   * Callback when clicked
   */
  onClick?: () => void;
}

export interface SidebarNavigationProps {
  /**
   * Navigation items
   */
  items: NavItem[];
  /**
   * Currently active item ID
   */
  activeItemId?: string;
  /**
   * Logo/brand component
   */
  logo?: ReactNode;
  /**
   * Footer content
   */
  footer?: ReactNode;
  /**
   * Show sidebar on mobile
   */
  isOpen?: boolean;
  /**
   * Callback when sidebar toggle
   */
  onToggle?: (isOpen: boolean) => void;
  /**
   * Callback when item clicked
   */
  onItemClick?: (item: NavItem) => void;
  /**
   * Collapse sidebar on mobile after item click
   */
  collapseOnMobileClick?: boolean;
  /**
   * Custom className
   */
  className?: string;
  /**
   * Sidebar width (closed)
   */
  collapsedWidth?: string;
  /**
   * Sidebar width (open)
   */
  expandedWidth?: string;
  /**
   * Show collapse/expand button
   */
  showCollapseButton?: boolean;
  /**
   * Is collapsed state
   */
  isCollapsed?: boolean;
  /**
   * Callback when collapse state changes
   */
  onCollapseChange?: (isCollapsed: boolean) => void;
}

/**
 * NavItem Component
 */
const NavItemComponent = forwardRef<
  HTMLDivElement,
  {
    item: NavItem;
    isActive?: boolean;
    isExpanded?: boolean;
    onToggle?: () => void;
    onClick?: () => void;
    level?: number;
    isCollapsed?: boolean;
  }
>(
  (
    {
      item,
      isActive = false,
      isExpanded = false,
      onToggle,
      onClick,
      level = 0,
      isCollapsed = false,
    },
    ref
  ) => {
    const hasChildren = item.children && item.children.length > 0;

    return (
      <div ref={ref} className="space-y-1">
        <button
          onClick={() => {
            if (hasChildren) {
              onToggle?.();
            } else {
              onClick?.();
            }
          }}
          disabled={item.isDisabled}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
            'hover:bg-accent hover:text-accent-foreground',
            isActive && 'bg-primary text-primary-foreground',
            item.isDisabled && 'opacity-50 cursor-not-allowed'
          )}
          style={{ paddingLeft: `${12 + level * 12}px` }}
        >
          {item.icon && <span className="flex-shrink-0 w-5 h-5">{item.icon}</span>}

          {!isCollapsed && (
            <>
              <span className="flex-1 text-left truncate">{item.label}</span>

              {item.badge && (
                <span className="flex-shrink-0 bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}

              {hasChildren && (
                <ChevronDown
                  className={cn(
                    'flex-shrink-0 w-4 h-4 transition-transform',
                    isExpanded && 'rotate-180'
                  )}
                />
              )}
            </>
          )}
        </button>

        {/* Nested items */}
        {hasChildren && isExpanded && !isCollapsed && (
          <div className="space-y-1">
            {item.children!.map((child) => (
              <NavItemComponent
                key={child.id}
                item={child}
                isActive={child.isActive}
                onClick={() => {
                  child.onClick?.();
                }}
                level={level + 1}
                isCollapsed={isCollapsed}
              />
            ))}
          </div>
        )}
      </div>
    );
  }
);

NavItemComponent.displayName = 'NavItem';

/**
 * SidebarNavigation Component
 *
 * Collapsible sidebar with nested navigation items
 */
export const SidebarNavigation = forwardRef<HTMLDivElement, SidebarNavigationProps>(
  (
    {
      items,
      activeItemId,
      logo,
      footer,
      isOpen = true,
      onToggle,
      onItemClick,
      collapseOnMobileClick = true,
      className = '',
      collapsedWidth = 'w-20',
      expandedWidth = 'w-64',
      showCollapseButton = true,
      isCollapsed = false,
      onCollapseChange,
    },
    ref
  ) => {
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
    const [isMobileOpen, setIsMobileOpen] = useState(isOpen);

    const toggleItem = useCallback((itemId: string) => {
      setExpandedItems((prev) => {
        const next = new Set(prev);
        if (next.has(itemId)) {
          next.delete(itemId);
        } else {
          next.add(itemId);
        }
        return next;
      });
    }, []);

    const handleItemClick = useCallback(
      (item: NavItem) => {
        onItemClick?.(item);
        if (collapseOnMobileClick && window.innerWidth < 768) {
          setIsMobileOpen(false);
        }
      },
      [onItemClick, collapseOnMobileClick]
    );

    const renderItems = useCallback(
      (navItems: NavItem[], level = 0) => {
        return navItems.map((item) => (
          <NavItemComponent
            key={item.id}
            item={item}
            isActive={item.id === activeItemId}
            isExpanded={expandedItems.has(item.id)}
            onToggle={() => toggleItem(item.id)}
            onClick={() => handleItemClick(item)}
            level={level}
            isCollapsed={isCollapsed}
          />
        ));
      },
      [activeItemId, expandedItems, toggleItem, handleItemClick, isCollapsed]
    );

    return (
      <>
        {/* Mobile menu button */}
        <div className="md:hidden fixed top-4 left-4 z-50">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsMobileOpen(!isMobileOpen)}
          >
            {isMobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>

        {/* Sidebar */}
        <div
          ref={ref}
          className={cn(
            'fixed md:relative inset-y-0 left-0 z-40 flex flex-col bg-background border-r transition-all duration-300',
            isMobileOpen ? 'w-64' : '-translate-x-full md:translate-x-0',
            isCollapsed ? collapsedWidth : expandedWidth,
            className
          )}
        >
          {/* Logo */}
          {logo && (
            <div className="flex items-center justify-between p-4 border-b">
              {!isCollapsed && <div className="flex-1">{logo}</div>}
              {showCollapseButton && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onCollapseChange?.(!isCollapsed)}
                  className="hidden md:flex"
                >
                  <Menu className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}

          {/* Navigation items */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-2">
            {renderItems(items)}
          </nav>

          {/* Footer */}
          {footer && (
            <div className="border-t p-4">
              {!isCollapsed && footer}
            </div>
          )}
        </div>

        {/* Mobile backdrop */}
        {isMobileOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
            onClick={() => setIsMobileOpen(false)}
          />
        )}
      </>
    );
  }
);

SidebarNavigation.displayName = 'SidebarNavigation';

/**
 * Hook for managing sidebar state
 */
export function useSidebarNavigation() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeItemId, setActiveItemId] = useState<string>();

  const handleCollapseChange = useCallback((collapsed: boolean) => {
    setIsCollapsed(collapsed);
  }, []);

  const handleItemClick = useCallback((item: NavItem) => {
    setActiveItemId(item.id);
    item.onClick?.();
  }, []);

  return {
    isCollapsed,
    activeItemId,
    handleCollapseChange,
    handleItemClick,
  };
}
