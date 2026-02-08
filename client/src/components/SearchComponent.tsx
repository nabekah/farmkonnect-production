import { useState, useRef, useEffect } from "react";
import { Search, Loader2, AlertCircle, Filter, TrendingUp, Clock } from "lucide-react";
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

interface SearchFilter {
  type?: string;
  status?: string;
  category?: "animal" | "farm" | "crop";
}

export function SearchComponent() {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilter>({});
  const [sessionId] = useState(() => Math.random().toString(36).substring(7));
  const searchRef = useRef<HTMLDivElement>(null);
  const [, setLocation] = useLocation();

  // Main search query
  const { data: searchResults, isLoading } = trpc.search.globalSearch.useQuery(
    { query, limit: 8, filters, sessionId },
    { enabled: query.length > 0 }
  );

  // Get suggestions when search box is focused but empty
  const { data: suggestionsData } = trpc.search.getSuggestions.useQuery(
    { limit: 10 },
    { enabled: isOpen && query.length === 0 }
  );

  // Get trending searches
  const { data: trendingData } = trpc.search.getTrendingSearches.useQuery(
    { limit: 5 },
    { enabled: isOpen && query.length === 0 }
  );

  const results = searchResults?.results || [];
  const suggestions = suggestionsData?.recent || [];
  const trending = trendingData?.trending || [];

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % Math.max(results.length, 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + Math.max(results.length, 1)) % Math.max(results.length, 1));
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

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setSelectedIndex(0);
  };

  const handleTrendingClick = (trendingQuery: string) => {
    setQuery(trendingQuery);
    setSelectedIndex(0);
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
          onFocus={() => setIsOpen(true)}
          className="w-full px-4 py-2 pl-10 pr-12 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        
        {/* Filter button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
          title="Toggle filters"
        >
          <Filter className="h-4 w-4 text-gray-400" />
        </button>

        {isLoading && (
          <Loader2 className="absolute right-10 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
        )}
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-40 p-3 space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Type</label>
            <input
              type="text"
              placeholder="e.g., cattle, goat"
              value={filters.type || ""}
              onChange={(e) => setFilters({ ...filters, type: e.target.value || undefined })}
              className="w-full mt-1 px-2 py-1 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Status</label>
            <select
              value={filters.status || ""}
              onChange={(e) => setFilters({ ...filters, status: e.target.value || undefined })}
              className="w-full mt-1 px-2 py-1 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded"
            >
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <button
            onClick={() => setFilters({})}
            className="w-full text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Search Results Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {query.length === 0 ? (
            // Show suggestions and trending when no query
            <>
              {suggestions.length > 0 && (
                <div className="border-b border-gray-200 dark:border-gray-700">
                  <div className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    Recent Searches
                  </div>
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion.id}
                      onClick={() => handleSuggestionClick(suggestion.suggestionText)}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      {suggestion.suggestionText}
                    </button>
                  ))}
                </div>
              )}

              {trending.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    <TrendingUp className="h-3 w-3" />
                    Trending Searches
                  </div>
                  {trending.map((trend) => (
                    <button
                      key={trend.query}
                      onClick={() => handleTrendingClick(trend.query)}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-between"
                    >
                      <span>{trend.query}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{trend.searchCount} searches</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : isLoading ? (
            <div className="p-4 text-center text-sm text-gray-600 dark:text-gray-400">
              <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
              Searching...
            </div>
          ) : results.length > 0 ? (
            <div>
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
