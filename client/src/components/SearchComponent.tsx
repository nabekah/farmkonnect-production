import { useState, useRef, useEffect } from "react";
import { Search, Loader2, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

interface SearchResult {
  id: number;
  name: string;
  category: "animal" | "farm" | "crop";
  path?: string;
  type?: string;
  location?: string;
  variety?: string;
}

export function SearchComponent() {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchRef = useRef<HTMLDivElement>(null);
  const [, setLocation] = useLocation();

  const { data: searchResults, isLoading } = trpc.search.globalSearch.useQuery(
    { query, limit: 8 },
    { enabled: query.length > 0 }
  );

  const results = searchResults?.results || [];

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % results.length);
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
          break;
        case "Enter":
          e.preventDefault();
          if (results[selectedIndex]) {
            handleSelectResult(results[selectedIndex]);
          }
          break;
        case "Escape":
          e.preventDefault();
          setIsOpen(false);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, results, selectedIndex]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectResult = (result: SearchResult) => {
    if (result.path) {
      setLocation(result.path);
    } else {
      // Default navigation based on category
      if (result.category === "animal") {
        setLocation(`/livestock-management?animal=${result.id}`);
      } else if (result.category === "farm") {
        setLocation(`/farms`);
      } else if (result.category === "crop") {
        setLocation(`/crops`);
      }
    }
    setQuery("");
    setIsOpen(false);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "animal":
        return "text-blue-600 dark:text-blue-400";
      case "farm":
        return "text-green-600 dark:text-green-400";
      case "crop":
        return "text-amber-600 dark:text-amber-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  const getCategoryLabel = (category: string) => {
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      <div className="relative">
        <input
          type="text"
          placeholder="Search animals, farms, crops..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(0);
          }}
          onFocus={() => query.length > 0 && setIsOpen(true)}
          className="w-full px-4 py-2 pl-10 pr-4 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && query.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-gray-600 dark:text-gray-400">
              <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
              Searching...
            </div>
          ) : results.length > 0 ? (
            <div className="max-h-96 overflow-y-auto">
              {results.map((result, index) => (
                <button
                  key={`${result.category}-${result.id}`}
                  onClick={() => handleSelectResult(result)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors ${
                    index === selectedIndex
                      ? "bg-gray-50 dark:bg-gray-700"
                      : "hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {result.name}
                      </p>
                      <p className={`text-xs ${getCategoryColor(result.category)}`}>
                        {getCategoryLabel(result.category)}
                        {result.type && ` • ${result.type}`}
                        {result.location && ` • ${result.location}`}
                        {result.variety && ` • ${result.variety}`}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-sm text-gray-600 dark:text-gray-400">
              <AlertCircle className="h-4 w-4 mx-auto mb-2 opacity-50" />
              No results found for "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}
