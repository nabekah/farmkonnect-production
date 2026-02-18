import { useState, useEffect, useRef } from "react";
import { Command, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { navigationStructure } from "./NavigationStructure";

interface CommandItem {
  id: string;
  title: string;
  description?: string;
  category: string;
  href?: string;
  action?: () => void;
  icon?: React.ReactNode;
}

interface CommandPaletteProps {
  items?: CommandItem[];
}

/**
 * Build command items from navigation structure
 * Ensures search results are always in sync with sidebar navigation
 */
function buildCommandItems(): CommandItem[] {
  const items: CommandItem[] = [];
  navigationStructure.forEach((group) => {
    group.items.forEach((item) => {
      items.push({
        id: item.path,
        title: item.label,
        category: group.title,
        href: item.path,
        icon: <item.icon className="h-4 w-4" />,
      });
    });
  });
  return items;
}

const DEFAULT_ITEMS: CommandItem[] = buildCommandItems();

export function CommandPalette({ items = DEFAULT_ITEMS }: CommandPaletteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Rebuild items to ensure they're always in sync with navigation
  const currentItems = items === DEFAULT_ITEMS ? buildCommandItems() : items;

  // Filter items based on search
  const filteredItems = currentItems.filter(
    (item) =>
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.description?.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase())
  );

  // Group items by category
  const groupedItems = filteredItems.reduce(
    (acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    },
    {} as Record<string, CommandItem[]>
  );

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(!isOpen);
        setSearch("");
        setSelectedIndex(0);
      }

      // Close on Escape
      if (e.key === "Escape") {
        setIsOpen(false);
      }

      // Navigate with arrow keys
      if (isOpen) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < filteredItems.length - 1 ? prev + 1 : prev
          );
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        }
        if (e.key === "Enter") {
          e.preventDefault();
          const item = filteredItems[selectedIndex];
          if (item?.href) {
            window.location.href = item.href;
          } else if (item?.action) {
            item.action();
          }
          setIsOpen(false);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  return (
    <>
      {/* Command Palette Trigger */}
      <button
        onClick={() => setIsOpen(true)}
        className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 text-sm text-muted-foreground transition-colors"
        title="Search pages and features (Cmd+K)"
      >
        <Search className="w-4 h-4" />
        <span>Search...</span>
        <kbd className="ml-auto text-xs font-semibold border border-muted-foreground/20 rounded px-2 py-1">
          <Command className="w-3 h-3 inline" />K
        </kbd>
      </button>

      {/* Command Palette Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-20">
          <div className="w-full max-w-2xl bg-background rounded-lg shadow-lg overflow-hidden border border-border">
            {/* Search Input */}
            <div className="border-b border-border p-4 flex items-center gap-3">
              <Search className="w-5 h-5 text-muted-foreground" />
              <Input
                ref={inputRef}
                type="text"
                placeholder="Search pages, features, and sections..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setSelectedIndex(0);
                }}
                className="border-0 focus:ring-0 text-lg bg-transparent"
              />
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-accent rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Results */}
            <div className="max-h-96 overflow-y-auto">
              {filteredItems.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No results found for "{search}"
                </div>
              ) : (
                Object.entries(groupedItems).map(([category, categoryItems]) => (
                  <div key={category}>
                    <div className="px-4 py-2 text-xs font-semibold text-muted-foreground bg-muted/30">
                      {category}
                    </div>
                    {categoryItems.map((item, index) => {
                      const globalIndex = filteredItems.indexOf(item);
                      const isSelected = globalIndex === selectedIndex;

                      return (
                        <div key={item.id}>
                          {item.href ? (
                            <Link
                              href={item.href}
                              className={`px-4 py-3 flex items-center justify-between cursor-pointer transition-colors ${
                                isSelected
                                  ? "bg-primary text-primary-foreground"
                                  : "hover:bg-accent"
                              }`}
                              onClick={() => setIsOpen(false)}
                            >
                              <div className="flex items-center gap-3 flex-1">
                                {item.icon && <div className="text-muted-foreground">{item.icon}</div>}
                                <div>
                                  <div className="font-medium">{item.title}</div>
                                  {item.description && (
                                    <div className="text-sm text-muted-foreground">
                                      {item.description}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <kbd className="text-xs font-semibold border border-border rounded px-2 py-1">
                                ↵
                              </kbd>
                            </Link>
                          ) : (
                            <button
                              onClick={() => {
                                item.action?.();
                                setIsOpen(false);
                              }}
                              className={`w-full px-4 py-3 flex items-center justify-between text-left transition-colors ${
                                isSelected
                                  ? "bg-primary text-primary-foreground"
                                  : "hover:bg-accent"
                              }`}
                            >
                              <div className="flex items-center gap-3 flex-1">
                                {item.icon && <div className="text-muted-foreground">{item.icon}</div>}
                                <div>
                                  <div className="font-medium">{item.title}</div>
                                  {item.description && (
                                    <div className="text-sm text-muted-foreground">
                                      {item.description}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <kbd className="text-xs font-semibold border border-border rounded px-2 py-1">
                                ↵
                              </kbd>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-border px-4 py-3 text-xs text-muted-foreground bg-muted/30 flex items-center justify-between">
              <div className="flex gap-4">
                <div className="flex items-center gap-1">
                  <kbd className="border border-border rounded px-2 py-1">
                    ↑↓
                  </kbd>
                  <span>Navigate</span>
                </div>
                <div className="flex items-center gap-1">
                  <kbd className="border border-border rounded px-2 py-1">
                    ↵
                  </kbd>
                  <span>Select</span>
                </div>
                <div className="flex items-center gap-1">
                  <kbd className="border border-border rounded px-2 py-1">
                    Esc
                  </kbd>
                  <span>Close</span>
                </div>
              </div>
              <span>{filteredItems.length} results</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
