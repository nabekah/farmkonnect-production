import { forwardRef, useState, useCallback, ReactNode, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export interface TabItem {
  /**
   * Tab id/value
   */
  value: string;
  /**
   * Tab label
   */
  label: string;
  /**
   * Tab content
   */
  content?: ReactNode;
  /**
   * Lazy load content function
   */
  loadContent?: () => Promise<ReactNode>;
  /**
   * Disable tab
   */
  disabled?: boolean;
  /**
   * Tab icon
   */
  icon?: ReactNode;
  /**
   * Badge content
   */
  badge?: string | number;
}

export interface EnhancedTabsProps {
  /**
   * Tab items
   */
  items: TabItem[];
  /**
   * Default active tab
   */
  defaultValue?: string;
  /**
   * Callback when tab changes
   */
  onChange?: (value: string) => void;
  /**
   * Enable keyboard navigation
   */
  enableKeyboard?: boolean;
  /**
   * Enable lazy loading
   */
  enableLazyLoad?: boolean;
  /**
   * Animation enabled
   */
  animated?: boolean;
  /**
   * Custom className
   */
  className?: string;
}

/**
 * EnhancedTabs Component
 * 
 * Tabs with keyboard navigation (arrow keys), lazy loading support, and animated tab switching
 */
export const EnhancedTabs = forwardRef<HTMLDivElement, EnhancedTabsProps>(
  (
    {
      items,
      defaultValue,
      onChange,
      enableKeyboard = true,
      enableLazyLoad = true,
      animated = true,
      className = '',
    },
    ref
  ) => {
    const [activeTab, setActiveTab] = useState(defaultValue || items[0]?.value || '');
    const [loadedTabs, setLoadedTabs] = useState<Set<string>>(new Set());
    const [loadingTabs, setLoadingTabs] = useState<Set<string>>(new Set());
    const [tabContents, setTabContents] = useState<Record<string, ReactNode>>({});

    // Load tab content on demand
    useEffect(() => {
      if (!enableLazyLoad) return;

      const activeItem = items.find((item) => item.value === activeTab);
      if (!activeItem || loadedTabs.has(activeTab)) return;

      if (activeItem.loadContent) {
        setLoadingTabs((prev) => new Set(prev).add(activeTab));

        activeItem.loadContent().then((content) => {
          setTabContents((prev) => ({ ...prev, [activeTab]: content }));
          setLoadedTabs((prev) => new Set(prev).add(activeTab));
          setLoadingTabs((prev) => {
            const next = new Set(prev);
            next.delete(activeTab);
            return next;
          });
        });
      } else {
        setLoadedTabs((prev) => new Set(prev).add(activeTab));
      }
    }, [activeTab, enableLazyLoad, items, loadedTabs]);

    const handleTabChange = useCallback(
      (value: string) => {
        setActiveTab(value);
        onChange?.(value);
      },
      [onChange]
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (!enableKeyboard) return;

        const currentIndex = items.findIndex((item) => item.value === activeTab);
        let nextIndex = currentIndex;

        switch (e.key) {
          case 'ArrowRight':
          case 'ArrowDown':
            e.preventDefault();
            nextIndex = (currentIndex + 1) % items.length;
            break;

          case 'ArrowLeft':
          case 'ArrowUp':
            e.preventDefault();
            nextIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1;
            break;

          case 'Home':
            e.preventDefault();
            nextIndex = 0;
            break;

          case 'End':
            e.preventDefault();
            nextIndex = items.length - 1;
            break;

          default:
            return;
        }

        // Skip disabled tabs
        while (items[nextIndex]?.disabled) {
          if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            nextIndex = nextIndex === 0 ? items.length - 1 : nextIndex - 1;
          } else {
            nextIndex = (nextIndex + 1) % items.length;
          }
        }

        handleTabChange(items[nextIndex].value);
      },
      [activeTab, enableKeyboard, items, handleTabChange]
    );

    return (
      <div ref={ref} onKeyDown={handleKeyDown} className={className}>
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}>
            {items.map((item) => (
              <TabsTrigger
                key={item.value}
                value={item.value}
                disabled={item.disabled}
                className={animated ? 'transition-all duration-200' : ''}
              >
                <div className="flex items-center gap-2">
                  {item.icon && <span className="h-4 w-4">{item.icon}</span>}
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="ml-1 inline-flex items-center justify-center rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                      {item.badge}
                    </span>
                  )}
                </div>
              </TabsTrigger>
            ))}
          </TabsList>

          {items.map((item) => (
            <TabsContent
              key={item.value}
              value={item.value}
              className={animated ? 'animate-in fade-in duration-200' : ''}
            >
              {loadingTabs.has(item.value) ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
                </div>
              ) : enableLazyLoad && item.loadContent ? (
                tabContents[item.value] || item.content
              ) : (
                item.content
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    );
  }
);

EnhancedTabs.displayName = 'EnhancedTabs';

/**
 * Hook for managing tabs state
 */
export function useTabs(defaultValue?: string) {
  const [activeTab, setActiveTab] = useState(defaultValue || '');

  return {
    activeTab,
    setActiveTab,
  };
}

/**
 * Animated Tab Indicator Component
 * 
 * Shows animated indicator under active tab
 */
export function TabIndicator({
  items,
  activeValue,
}: {
  items: TabItem[];
  activeValue: string;
}) {
  const activeIndex = items.findIndex((item) => item.value === activeValue);

  return (
    <div
      className="absolute bottom-0 h-1 bg-primary transition-all duration-300"
      style={{
        left: `${(activeIndex / items.length) * 100}%`,
        width: `${(1 / items.length) * 100}%`,
      }}
    />
  );
}

/**
 * Vertical Tabs Component
 * 
 * Tabs displayed vertically instead of horizontally
 */
export const VerticalTabs = forwardRef<HTMLDivElement, EnhancedTabsProps>(
  (
    {
      items,
      defaultValue,
      onChange,
      enableKeyboard = true,
      enableLazyLoad = true,
      animated = true,
      className = '',
    },
    ref
  ) => {
    const [activeTab, setActiveTab] = useState(defaultValue || items[0]?.value || '');
    const [loadedTabs, setLoadedTabs] = useState<Set<string>>(new Set());
    const [loadingTabs, setLoadingTabs] = useState<Set<string>>(new Set());
    const [tabContents, setTabContents] = useState<Record<string, ReactNode>>({});

    // Load tab content on demand
    useEffect(() => {
      if (!enableLazyLoad) return;

      const activeItem = items.find((item) => item.value === activeTab);
      if (!activeItem || loadedTabs.has(activeTab)) return;

      if (activeItem.loadContent) {
        setLoadingTabs((prev) => new Set(prev).add(activeTab));

        activeItem.loadContent().then((content) => {
          setTabContents((prev) => ({ ...prev, [activeTab]: content }));
          setLoadedTabs((prev) => new Set(prev).add(activeTab));
          setLoadingTabs((prev) => {
            const next = new Set(prev);
            next.delete(activeTab);
            return next;
          });
        });
      } else {
        setLoadedTabs((prev) => new Set(prev).add(activeTab));
      }
    }, [activeTab, enableLazyLoad, items, loadedTabs]);

    const handleTabChange = useCallback(
      (value: string) => {
        setActiveTab(value);
        onChange?.(value);
      },
      [onChange]
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (!enableKeyboard) return;

        const currentIndex = items.findIndex((item) => item.value === activeTab);
        let nextIndex = currentIndex;

        switch (e.key) {
          case 'ArrowDown':
            e.preventDefault();
            nextIndex = (currentIndex + 1) % items.length;
            break;

          case 'ArrowUp':
            e.preventDefault();
            nextIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1;
            break;

          default:
            return;
        }

        handleTabChange(items[nextIndex].value);
      },
      [activeTab, enableKeyboard, items, handleTabChange]
    );

    return (
      <div ref={ref} onKeyDown={handleKeyDown} className={`flex gap-4 ${className}`}>
        {/* Tab List */}
        <div className="flex flex-col gap-2 border-r border-border pr-4">
          {items.map((item) => (
            <button
              key={item.value}
              onClick={() => handleTabChange(item.value)}
              disabled={item.disabled}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === item.value
                  ? 'border-r-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              } ${item.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {item.icon && <span className="h-4 w-4">{item.icon}</span>}
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1">
          {items.map((item) => (
            activeTab === item.value && (
              <div
                key={item.value}
                className={animated ? 'animate-in fade-in duration-200' : ''}
              >
                {loadingTabs.has(item.value) ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
                  </div>
                ) : enableLazyLoad && item.loadContent ? (
                  tabContents[item.value] || item.content
                ) : (
                  item.content
                )}
              </div>
            )
          ))}
        </div>
      </div>
    );
  }
);

VerticalTabs.displayName = 'VerticalTabs';
