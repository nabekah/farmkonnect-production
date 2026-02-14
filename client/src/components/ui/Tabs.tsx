import { forwardRef, useState, useCallback, ReactNode, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

export interface TabItem {
  /**
   * Tab ID
   */
  id: string;
  /**
   * Tab label
   */
  label: string;
  /**
   * Tab content
   */
  content: ReactNode;
  /**
   * Tab icon
   */
  icon?: ReactNode;
  /**
   * Is tab disabled
   */
  disabled?: boolean;
  /**
   * Badge content
   */
  badge?: string | number;
}

export interface TabsProps {
  /**
   * Tab items
   */
  items: TabItem[];
  /**
   * Active tab ID
   */
  activeTab?: string;
  /**
   * Callback on tab change
   */
  onTabChange?: (tabId: string) => void;
  /**
   * Tab orientation
   */
  orientation?: 'horizontal' | 'vertical';
  /**
   * Tab variant
   */
  variant?: 'default' | 'pills' | 'underline';
  /**
   * Lazy load tab content
   */
  lazy?: boolean;
  /**
   * Custom className
   */
  className?: string;
}

/**
 * Tabs Component
 * 
 * Tabbed interface with keyboard navigation
 */
export const Tabs = forwardRef<HTMLDivElement, TabsProps>(
  (
    {
      items,
      activeTab,
      onTabChange,
      orientation = 'horizontal',
      variant = 'default',
      lazy = false,
      className = '',
    },
    ref
  ) => {
    const [activeTabId, setActiveTabId] = useState(activeTab || items[0]?.id || '');
    const [loadedTabs, setLoadedTabs] = useState(new Set([activeTabId]));
    const tabListRef = useRef<HTMLDivElement>(null);

    const handleTabChange = useCallback(
      (tabId: string) => {
        const tab = items.find((t) => t.id === tabId);
        if (tab && !tab.disabled) {
          setActiveTabId(tabId);
          if (lazy) {
            setLoadedTabs((prev) => new Set([...prev, tabId]));
          }
          onTabChange?.(tabId);
        }
      },
      [items, lazy, onTabChange]
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
        const enabledTabs = items.filter((t) => !t.disabled);
        const currentIndex = enabledTabs.findIndex((t) => t.id === activeTabId);

        let nextIndex = currentIndex;

        if (orientation === 'horizontal') {
          if (e.key === 'ArrowRight') {
            e.preventDefault();
            nextIndex = (currentIndex + 1) % enabledTabs.length;
          } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            nextIndex = (currentIndex - 1 + enabledTabs.length) % enabledTabs.length;
          }
        } else {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            nextIndex = (currentIndex + 1) % enabledTabs.length;
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            nextIndex = (currentIndex - 1 + enabledTabs.length) % enabledTabs.length;
          }
        }

        if (e.key === 'Home') {
          e.preventDefault();
          nextIndex = 0;
        } else if (e.key === 'End') {
          e.preventDefault();
          nextIndex = enabledTabs.length - 1;
        }

        if (nextIndex !== currentIndex) {
          handleTabChange(enabledTabs[nextIndex].id);
        }
      },
      [items, activeTabId, orientation, handleTabChange]
    );

    const getTabListClasses = () => {
      const baseClasses = 'flex gap-1';
      const orientationClasses = orientation === 'vertical' ? 'flex-col' : 'flex-row';
      return cn(baseClasses, orientationClasses);
    };

    const getTabButtonClasses = (tabId: string, disabled?: boolean) => {
      const isActive = tabId === activeTabId;
      const baseClasses = 'px-4 py-2 font-medium transition-colors rounded-md flex items-center gap-2 whitespace-nowrap';
      const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';

      const variantClasses = {
        'default': isActive
          ? 'bg-primary text-primary-foreground'
          : 'bg-muted text-foreground hover:bg-muted/80',
        'pills': isActive
          ? 'bg-primary text-primary-foreground rounded-full'
          : 'text-foreground hover:bg-muted rounded-full',
        'underline': isActive
          ? 'border-b-2 border-primary text-primary bg-transparent'
          : 'border-b-2 border-transparent text-muted-foreground hover:text-foreground bg-transparent',
      };

      return cn(baseClasses, disabledClasses, variantClasses[variant]);
    };

    const getContainerClasses = () => {
      if (orientation === 'vertical') {
        return 'flex gap-4';
      }
      return 'flex flex-col gap-4';
    };

    return (
      <div
        ref={ref}
        className={cn(getContainerClasses(), className)}
      >
        {/* Tab list */}
        <div
          ref={tabListRef}
          className={getTabListClasses()}
          role="tablist"
          aria-orientation={orientation}
        >
          {items.map((tab, index) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              disabled={tab.disabled}
              className={getTabButtonClasses(tab.id, tab.disabled)}
              role="tab"
              aria-selected={tab.id === activeTabId}
              aria-controls={`tabpanel-${tab.id}`}
              tabIndex={tab.id === activeTabId ? 0 : -1}
            >
              {tab.icon && <span className="flex-shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="ml-1 px-2 py-0.5 text-xs font-semibold bg-destructive text-destructive-foreground rounded-full">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="w-full">
          {items.map((tab) => {
            const isActive = tab.id === activeTabId;
            const isLoaded = !lazy || loadedTabs.has(tab.id);

            return (
              <div
                key={tab.id}
                id={`tabpanel-${tab.id}`}
                role="tabpanel"
                aria-labelledby={`tab-${tab.id}`}
                hidden={!isActive}
                className={cn(
                  'animate-in fade-in duration-200',
                  !isActive && 'hidden'
                )}
              >
                {isLoaded ? tab.content : null}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);

Tabs.displayName = 'Tabs';

/**
 * useTabs Hook
 * 
 * Manage tabs state
 */
export function useTabs(initialTabId?: string) {
  const [activeTab, setActiveTab] = useState(initialTabId || '');

  return {
    activeTab,
    setActiveTab,
  };
}
