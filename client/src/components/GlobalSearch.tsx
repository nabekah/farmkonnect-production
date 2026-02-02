import React, { useState, useEffect, useRef } from 'react';
import { Search, Command, X } from 'lucide-react';
import { useLocation } from 'wouter';
import { navigationStructure } from './NavigationStructure';
import { Input } from './ui/input';

interface SearchResult {
  path: string;
  label: string;
  category: string;
  icon: React.ReactNode;
}

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [, setLocation] = useLocation();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Build search index from navigation structure
  const buildSearchIndex = (): SearchResult[] => {
    const index: SearchResult[] = [];
    navigationStructure.forEach((group) => {
      group.items.forEach((item) => {
        index.push({
          path: item.path,
          label: item.label,
          category: group.title,
          icon: <item.icon className="h-4 w-4" />,
        });
      });
    });
    return index;
  };

  const searchIndex = buildSearchIndex();

  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 0);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter results based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults(searchIndex);
      setSelectedIndex(0);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = searchIndex.filter((item) => {
      const labelMatch = item.label.toLowerCase().includes(query);
      const categoryMatch = item.category.toLowerCase().includes(query);
      return labelMatch || categoryMatch;
    });

    setResults(filtered);
    setSelectedIndex(0);
  }, [searchQuery]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % results.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (results[selectedIndex]) {
          handleSelect(results[selectedIndex]);
        }
        break;
    }
  };

  const handleSelect = (result: SearchResult) => {
    setLocation(result.path);
    setIsOpen(false);
    setSearchQuery('');
  };

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div ref={searchRef} className="relative w-full">
      <button
        onClick={() => {
          setIsOpen(true);
          setTimeout(() => inputRef.current?.focus(), 0);
        }}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-accent/50 hover:bg-accent transition-colors text-sm text-muted-foreground"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left">Search...</span>
        <div className="flex items-center gap-1 text-xs">
          <Command className="h-3 w-3" />
          <span>K</span>
        </div>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-lg shadow-lg z-50 max-h-96 overflow-hidden flex flex-col">
          <div className="p-3 border-b border-border">
            <Input
              ref={inputRef}
              type="text"
              placeholder="Search pages and features..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="h-9"
              autoFocus
            />
          </div>

          <div className="overflow-y-auto flex-1">
            {results.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No results found
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {results.map((result, index) => (
                  <button
                    key={result.path}
                    onClick={() => handleSelect(result)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                      index === selectedIndex
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-accent'
                    }`}
                  >
                    {result.icon}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{result.label}</div>
                      <div className="text-xs opacity-70 truncate">
                        {result.category}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="p-2 border-t border-border text-xs text-muted-foreground space-y-1">
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-accent rounded text-xs">↑↓</kbd>
              <span>Navigate</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-accent rounded text-xs">Enter</kbd>
              <span>Select</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-accent rounded text-xs">Esc</kbd>
              <span>Close</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
