import { forwardRef, useState, useRef, useCallback, ReactNode, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button, ButtonProps } from '@/components/ui/button';

export interface DropdownMenuProps {
  /**
   * Trigger button label
   */
  label: string;
  /**
   * Menu items
   */
  items: DropdownMenuItem[];
  /**
   * Callback when item is selected
   */
  onSelect?: (item: DropdownMenuItem) => void;
  /**
   * Show chevron icon
   */
  showChevron?: boolean;
  /**
   * Menu alignment
   */
  align?: 'left' | 'right' | 'center';
  /**
   * Custom trigger button props
   */
  triggerProps?: ButtonProps;
  /**
   * Custom className for menu
   */
  menuClassName?: string;
}

export interface DropdownMenuItem {
  /**
   * Item label
   */
  label: string;
  /**
   * Item value/id
   */
  value: string;
  /**
   * Item icon (optional)
   */
  icon?: ReactNode;
  /**
   * Item callback
   */
  onClick?: () => void;
  /**
   * Disable item
   */
  disabled?: boolean;
  /**
   * Item variant
   */
  variant?: 'default' | 'destructive';
  /**
   * Submenu items
   */
  submenu?: DropdownMenuItem[];
}

/**
 * DropdownMenu Component
 * 
 * Accessible dropdown menu with keyboard navigation, click-outside detection, and submenu support
 */
export const DropdownMenu = forwardRef<HTMLDivElement, DropdownMenuProps>(
  (
    {
      label,
      items,
      onSelect,
      showChevron = true,
      align = 'left',
      triggerProps,
      menuClassName = '',
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (
          menuRef.current &&
          triggerRef.current &&
          !menuRef.current.contains(e.target as Node) &&
          !triggerRef.current.contains(e.target as Node)
        ) {
          setIsOpen(false);
          setActiveSubmenu(null);
        }
      };

      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
      }
    }, [isOpen]);

    // Handle keyboard navigation
    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (!isOpen) {
          if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
            e.preventDefault();
            setIsOpen(true);
            setActiveIndex(0);
          }
          return;
        }

        switch (e.key) {
          case 'ArrowDown':
            e.preventDefault();
            setActiveIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
            break;

          case 'ArrowUp':
            e.preventDefault();
            setActiveIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
            break;

          case 'ArrowRight':
            e.preventDefault();
            if (items[activeIndex]?.submenu) {
              setActiveSubmenu(items[activeIndex].value);
            }
            break;

          case 'ArrowLeft':
            e.preventDefault();
            setActiveSubmenu(null);
            break;

          case 'Enter':
            e.preventDefault();
            if (activeIndex >= 0) {
              const item = items[activeIndex];
              if (item.submenu) {
                setActiveSubmenu(activeSubmenu === item.value ? null : item.value);
              } else {
                handleSelectItem(item);
              }
            }
            break;

          case 'Escape':
            e.preventDefault();
            setIsOpen(false);
            setActiveSubmenu(null);
            triggerRef.current?.focus();
            break;

          case 'Tab':
            setIsOpen(false);
            setActiveSubmenu(null);
            break;
        }
      },
      [isOpen, items, activeIndex, activeSubmenu]
    );

    const handleSelectItem = useCallback(
      (item: DropdownMenuItem) => {
        if (item.disabled) return;

        item.onClick?.();
        onSelect?.(item);
        setIsOpen(false);
        setActiveSubmenu(null);
      },
      [onSelect]
    );

    const alignClass = {
      left: 'left-0',
      right: 'right-0',
      center: 'left-1/2 -translate-x-1/2',
    }[align];

    return (
      <div ref={ref} className="relative inline-block">
        <Button
          ref={triggerRef}
          onClick={() => setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          aria-haspopup="menu"
          aria-expanded={isOpen}
          {...triggerProps}
        >
          {label}
          {showChevron && <ChevronDown className="ml-2 h-4 w-4" />}
        </Button>

        {isOpen && (
          <div
            ref={menuRef}
            onKeyDown={handleKeyDown}
            className={`absolute top-full mt-1 w-48 rounded-lg border border-border bg-background shadow-lg ${alignClass} z-50 ${menuClassName}`}
            role="menu"
          >
            {items.map((item, index) => (
              <div key={item.value}>
                <button
                  onClick={() => handleSelectItem(item)}
                  onMouseEnter={() => {
                    setActiveIndex(index);
                    if (item.submenu) {
                      setActiveSubmenu(item.value);
                    }
                  }}
                  disabled={item.disabled}
                  className={`w-full flex items-center gap-2 px-4 py-2 text-sm text-left ${
                    index === activeIndex ? 'bg-muted' : ''
                  } ${
                    item.variant === 'destructive'
                      ? 'text-destructive hover:bg-destructive/10'
                      : 'hover:bg-muted'
                  } ${item.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  role="menuitem"
                  aria-disabled={item.disabled}
                >
                  {item.icon && <span className="h-4 w-4">{item.icon}</span>}
                  <span className="flex-1">{item.label}</span>
                  {item.submenu && <ChevronDown className="h-3 w-3 ml-auto" />}
                </button>

                {/* Submenu */}
                {item.submenu && activeSubmenu === item.value && (
                  <div className="pl-2 bg-muted/50">
                    {item.submenu.map((subitem) => (
                      <button
                        key={subitem.value}
                        onClick={() => handleSelectItem(subitem)}
                        disabled={subitem.disabled}
                        className={`w-full flex items-center gap-2 px-4 py-2 text-sm text-left ${
                          subitem.variant === 'destructive'
                            ? 'text-destructive hover:bg-destructive/10'
                            : 'hover:bg-muted'
                        } ${subitem.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        role="menuitem"
                        aria-disabled={subitem.disabled}
                      >
                        {subitem.icon && <span className="h-4 w-4">{subitem.icon}</span>}
                        <span>{subitem.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
);

DropdownMenu.displayName = 'DropdownMenu';

/**
 * Hook for managing dropdown state
 */
export function useDropdown() {
  const [isOpen, setIsOpen] = useState(false);

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen((prev) => !prev),
  };
}
