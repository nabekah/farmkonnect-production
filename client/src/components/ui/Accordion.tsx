import { forwardRef, useState, useCallback, ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AccordionItem {
  /**
   * Item ID
   */
  id: string;
  /**
   * Item title
   */
  title: string;
  /**
   * Item content
   */
  content: ReactNode;
  /**
   * Item icon
   */
  icon?: ReactNode;
  /**
   * Is item disabled
   */
  disabled?: boolean;
}

export interface AccordionProps {
  /**
   * Accordion items
   */
  items: AccordionItem[];
  /**
   * Initially expanded item IDs
   */
  expandedItems?: string[];
  /**
   * Callback on item expand/collapse
   */
  onExpandedChange?: (expandedItems: string[]) => void;
  /**
   * Allow multiple items to be expanded
   */
  allowMultiple?: boolean;
  /**
   * Custom className
   */
  className?: string;
}

/**
 * Accordion Component
 * 
 * Collapsible accordion with smooth animations
 */
export const Accordion = forwardRef<HTMLDivElement, AccordionProps>(
  (
    {
      items,
      expandedItems = [],
      onExpandedChange,
      allowMultiple = false,
      className = '',
    },
    ref
  ) => {
    const [expanded, setExpanded] = useState<Set<string>>(new Set(expandedItems));

    const handleToggle = useCallback(
      (itemId: string) => {
        const item = items.find((i) => i.id === itemId);
        if (item?.disabled) return;

        let newExpanded = new Set(expanded);

        if (newExpanded.has(itemId)) {
          newExpanded.delete(itemId);
        } else {
          if (!allowMultiple) {
            newExpanded.clear();
          }
          newExpanded.add(itemId);
        }

        setExpanded(newExpanded);
        onExpandedChange?.(Array.from(newExpanded));
      },
      [items, expanded, allowMultiple, onExpandedChange]
    );

    const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, itemId: string) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleToggle(itemId);
      }
    };

    return (
      <div
        ref={ref}
        className={cn('space-y-2', className)}
      >
        {items.map((item) => {
          const isExpanded = expanded.has(item.id);

          return (
            <div
              key={item.id}
              className="border border-border rounded-lg overflow-hidden"
            >
              {/* Header */}
              <button
                onClick={() => handleToggle(item.id)}
                onKeyDown={(e) => handleKeyDown(e, item.id)}
                disabled={item.disabled}
                className={cn(
                  'w-full px-4 py-3 flex items-center justify-between',
                  'hover:bg-muted transition-colors',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
                )}
                aria-expanded={isExpanded}
                aria-controls={`accordion-content-${item.id}`}
              >
                <div className="flex items-center gap-3">
                  {item.icon && (
                    <span className="flex-shrink-0 text-muted-foreground">
                      {item.icon}
                    </span>
                  )}
                  <span className="font-medium text-left">{item.title}</span>
                </div>

                <ChevronDown
                  className={cn(
                    'h-5 w-5 flex-shrink-0 transition-transform duration-200',
                    isExpanded && 'rotate-180'
                  )}
                />
              </button>

              {/* Content */}
              {isExpanded && (
                <div
                  id={`accordion-content-${item.id}`}
                  className="border-t border-border px-4 py-3 bg-muted/50 animate-in fade-in slide-in-from-top-2 duration-200"
                  role="region"
                >
                  {item.content}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }
);

Accordion.displayName = 'Accordion';

/**
 * useAccordion Hook
 * 
 * Manage accordion state
 */
export function useAccordion(initialExpanded: string[] = [], allowMultiple = false) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(initialExpanded));

  const toggle = useCallback(
    (itemId: string) => {
      let newExpanded = new Set(expanded);

      if (newExpanded.has(itemId)) {
        newExpanded.delete(itemId);
      } else {
        if (!allowMultiple) {
          newExpanded.clear();
        }
        newExpanded.add(itemId);
      }

      setExpanded(newExpanded);
      return Array.from(newExpanded);
    },
    [expanded, allowMultiple]
  );

  const expand = useCallback(
    (itemId: string) => {
      const newExpanded = new Set(expanded);
      newExpanded.add(itemId);
      setExpanded(newExpanded);
      return Array.from(newExpanded);
    },
    [expanded]
  );

  const collapse = useCallback(
    (itemId: string) => {
      const newExpanded = new Set(expanded);
      newExpanded.delete(itemId);
      setExpanded(newExpanded);
      return Array.from(newExpanded);
    },
    [expanded]
  );

  const expandAll = useCallback(() => {
    if (allowMultiple) {
      // This would need item IDs to work properly
      return Array.from(expanded);
    }
    return Array.from(expanded);
  }, [expanded, allowMultiple]);

  const collapseAll = useCallback(() => {
    setExpanded(new Set());
    return [];
  }, []);

  return {
    expanded: Array.from(expanded),
    toggle,
    expand,
    collapse,
    expandAll,
    collapseAll,
  };
}
