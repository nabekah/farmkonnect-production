import { useState, useEffect, useRef } from "react";
import { Command, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";

interface CommandItem {
  id: string;
  title: string;
  description?: string;
  category: string;
  href?: string;
  action?: () => void;
}

interface CommandPaletteProps {
  items?: CommandItem[];
}

const DEFAULT_ITEMS: CommandItem[] = [
  { id: "home", title: "Home", category: "Navigation", href: "/" },
  { id: "farms", title: "Farms", category: "Navigation", href: "/farms" },
  { id: "livestock", title: "Livestock", category: "Navigation", href: "/livestock" },
  { id: "crops", title: "Crops", category: "Navigation", href: "/crops" },
  { id: "marketplace", title: "Marketplace", category: "Navigation", href: "/marketplace" },
  { id: "analytics", title: "Analytics", category: "Navigation", href: "/analytics" },
  { id: "settings", title: "Settings", category: "Navigation", href: "/settings" },
];

export function CommandPalette({ items = DEFAULT_ITEMS }: CommandPaletteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter items based on search
  const filteredItems = items.filter(
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
          <div className="w-full max-w-2xl bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Search Input */}
            <div className="border-b p-4 flex items-center gap-3">
              <Search className="w-5 h-5 text-muted-foreground" />
              <Input
                ref={inputRef}
                type="text"
                placeholder="Search commands, pages, actions..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setSelectedIndex(0);
                }}
                className="border-0 focus:ring-0 text-lg"
              />
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-muted rounded"
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
                            <Link href={item.href}>
                              <a
                                className={`px-4 py-3 flex items-center justify-between cursor-pointer transition-colors ${
                                  isSelected
                                    ? "bg-blue-50 text-blue-900"
                                    : "hover:bg-muted"
                                }`}
                                onClick={() => setIsOpen(false)}
                              >
                                <div>
                                  <div className="font-medium">{item.title}</div>
                                  {item.description && (
                                    <div className="text-sm text-muted-foreground">
                                      {item.description}
                                    </div>
                                  )}
                                </div>
                                <kbd className="text-xs font-semibold border border-muted-foreground/20 rounded px-2 py-1">
                                  ↵
                                </kbd>
                              </a>
                            </Link>
                          ) : (
                            <button
                              onClick={() => {
                                item.action?.();
                                setIsOpen(false);
                              }}
                              className={`w-full px-4 py-3 flex items-center justify-between text-left transition-colors ${
                                isSelected
                                  ? "bg-blue-50 text-blue-900"
                                  : "hover:bg-muted"
                              }`}
                            >
                              <div>
                                <div className="font-medium">{item.title}</div>
                                {item.description && (
                                  <div className="text-sm text-muted-foreground">
                                    {item.description}
                                  </div>
                                )}
                              </div>
                              <kbd className="text-xs font-semibold border border-muted-foreground/20 rounded px-2 py-1">
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
            <div className="border-t px-4 py-3 text-xs text-muted-foreground bg-muted/30 flex items-center justify-between">
              <div className="flex gap-4">
                <div className="flex items-center gap-1">
                  <kbd className="border border-muted-foreground/20 rounded px-2 py-1">
                    ↑↓
                  </kbd>
                  <span>Navigate</span>
                </div>
                <div className="flex items-center gap-1">
                  <kbd className="border border-muted-foreground/20 rounded px-2 py-1">
                    ↵
                  </kbd>
                  <span>Select</span>
                </div>
                <div className="flex items-center gap-1">
                  <kbd className="border border-muted-foreground/20 rounded px-2 py-1">
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
