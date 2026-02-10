import { useEffect, useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  X,
  ChevronDown,
  Star,
  ThumbsUp,
  ThumbsDown,
  Bookmark,
  Clock,
  Trending2,
} from "lucide-react";

interface SearchFilter {
  type?: string;
  status?: string;
  category?: "animal" | "farm" | "crop";
}

interface SearchResult {
  id: number | string;
  name: string;
  category: "animal" | "farm" | "crop";
  path: string;
  [key: string]: any;
}

interface SavedQuery {
  id: string;
  name: string;
  query: string;
  filters?: SearchFilter;
  usageCount: number;
}

interface Suggestion {
  text: string;
}

export function SearchComponentEnhanced() {
  const [query, setQuery] = useState<string>("");
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [filters, setFilters] = useState<SearchFilter>({});
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [selectedResults, setSelectedResults] = useState<Set<number | string>>(
    new Set()
  );
  const searchRef = useRef<HTMLDivElement>(null);

  // tRPC hooks
  const { data: searchResults, isLoading: searchLoading } =
    trpc.search.globalSearch.useQuery(
      {
        query,
        limit: 10,
        filters,
      },
      { enabled: query.length > 0 && isOpen }
    ) as any;

  const { data: savedQueries } = trpc.searchEnhancements.getSavedQueries.useQuery({
    limit: 5,
  }) as any;

  const { data: suggestions } = trpc.search.getAutocompleteSuggestions.useQuery({
    query,
    limit: 5,
  }) as any;

  const saveMutation = trpc.searchEnhancements.saveQuery.useMutation();
  const feedbackMutation = trpc.searchEnhancements.submitFeedback.useMutation();
  const incrementUsageMutation =
    trpc.searchEnhancements.incrementQueryUsage.useMutation();

  // Handle clicks outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (value: string) => {
    setQuery(value);
    setIsOpen(true);
  };

  const handleSaveQuery = async () => {
    if (!query.trim()) return;

    try {
      await saveMutation.mutateAsync({
        name: query,
        query,
        filters,
        category: filters.category,
      });
      // Show success toast
    } catch (error) {
      console.error("Error saving query:", error);
    }
  };

  const handleUseSavedQuery = async (savedQuery: SavedQuery) => {
    setQuery(savedQuery.query);
    setFilters(savedQuery.filters || {});
    setIsOpen(true);

    // Increment usage count
    try {
      await incrementUsageMutation.mutateAsync({
        queryId: savedQuery.id,
      });
    } catch (error) {
      console.error("Error incrementing usage:", error);
    }
  };

  const handleFeedback = async (
    result: SearchResult,
    feedbackType: "thumbsUp" | "thumbsDown" | "rating",
    rating?: number
  ) => {
    try {
      await feedbackMutation.mutateAsync({
        query,
        resultId: result.id as number,
        resultType: result.category,
        resultTitle: result.name,
        feedbackType,
        rating,
      });
    } catch (error) {
      console.error("Error submitting feedback:", error);
    }
  };

  const results: SearchResult[] = (searchResults?.results as SearchResult[]) || [];
  const displaySuggestions: Suggestion[] = (suggestions?.suggestions as Suggestion[]) || [];

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      {/* Search Input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Search animals, farms, crops..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => setIsOpen(true)}
            className="pl-10 pr-4"
          />
          {query && (
            <button
              onClick={() => {
                setQuery("");
                setFilters({});
                setIsOpen(false);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="h-4 w-4 text-gray-400" />
            </button>
          )}
        </div>

        {/* Filter Toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="gap-2"
        >
          <ChevronDown className="h-4 w-4" />
          Filters
        </Button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card className="absolute top-full left-0 right-0 mt-2 p-4 z-50 bg-white shadow-lg">
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Category</label>
              <select
                value={filters.category || ""}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    category: e.target.value as "animal" | "farm" | "crop" | "",
                  })
                }
                className="w-full mt-1 px-3 py-2 border rounded-md"
              >
                <option value="">All Categories</option>
                <option value="animal">Animals</option>
                <option value="farm">Farms</option>
                <option value="crop">Crops</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Status</label>
              <select
                value={filters.status || ""}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    status: e.target.value,
                  })
                }
                className="w-full mt-1 px-3 py-2 border rounded-md"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setFilters({})}
              >
                Clear Filters
              </Button>
              <Button size="sm" onClick={() => setShowFilters(false)}>
                Apply
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Dropdown Results */}
      {isOpen && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 bg-white shadow-lg max-h-96 overflow-y-auto">
          {/* Saved Queries Section */}
          {!query && Array.isArray(savedQueries?.queries) && savedQueries.queries.length > 0 && (
            <div className="border-b p-3">
              <div className="flex items-center gap-2 mb-2">
                <Bookmark className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Saved Searches</span>
              </div>
              <div className="space-y-1">
                {savedQueries.queries.map((sq: SavedQuery) => (
                  <button
                    key={sq.id}
                    onClick={() => handleUseSavedQuery(sq)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded flex items-center justify-between"
                  >
                    <span className="text-sm">{sq.name}</span>
                    <span className="text-xs text-gray-500">
                      {sq.usageCount} uses
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions Section */}
          {query && Array.isArray(displaySuggestions) && displaySuggestions.length > 0 && (
            <div className="border-b p-3">
              <div className="flex items-center gap-2 mb-2">
                <Trending2 className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Suggestions</span>
              </div>
              <div className="space-y-1">
                {displaySuggestions.map((suggestion: Suggestion, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => handleSearch(suggestion.text)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm"
                  >
                    {suggestion.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search Results Section */}
          {searchLoading ? (
            <div className="p-4 text-center text-gray-500">Loading...</div>
          ) : Array.isArray(results) && results.length > 0 ? (
            <div className="p-3 space-y-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">
                  Results ({results.length})
                </span>
                {query && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleSaveQuery}
                    className="gap-1"
                  >
                    <Bookmark className="h-3 w-3" />
                    Save
                  </Button>
                )}
              </div>

              {results.map((result: SearchResult) => (
                <div
                  key={`${result.category}-${result.id}`}
                  className="p-2 hover:bg-gray-50 rounded border"
                >
                  <a
                    href={result.path}
                    className="block text-sm font-medium text-blue-600 hover:underline"
                  >
                    {result.name}
                  </a>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {result.category}
                    </Badge>
                    <div className="flex gap-1">
                      <button
                        onClick={() =>
                          handleFeedback(result, "thumbsUp")
                        }
                        className="p-1 hover:bg-green-100 rounded"
                        title="Helpful"
                      >
                        <ThumbsUp className="h-3 w-3 text-green-600" />
                      </button>
                      <button
                        onClick={() =>
                          handleFeedback(result, "thumbsDown")
                        }
                        className="p-1 hover:bg-red-100 rounded"
                        title="Not helpful"
                      >
                        <ThumbsDown className="h-3 w-3 text-red-600" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : query ? (
            <div className="p-4 text-center text-gray-500">No results found</div>
          ) : null}
        </Card>
      )}
    </div>
  );
}
