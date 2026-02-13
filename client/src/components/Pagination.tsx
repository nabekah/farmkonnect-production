import { forwardRef, useState, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface PaginationProps {
  /**
   * Total number of items
   */
  totalItems: number;
  /**
   * Current page number (1-indexed)
   */
  currentPage: number;
  /**
   * Items per page
   */
  itemsPerPage: number;
  /**
   * Callback when page changes
   */
  onPageChange: (page: number) => void;
  /**
   * Callback when items per page changes
   */
  onItemsPerPageChange?: (itemsPerPage: number) => void;
  /**
   * Available page sizes
   */
  pageSizes?: number[];
  /**
   * Show page size selector
   */
  showPageSizeSelector?: boolean;
  /**
   * Show jump to page input
   */
  showJumpToPage?: boolean;
  /**
   * Show total count
   */
  showTotalCount?: boolean;
  /**
   * Show page info (e.g., "1 to 10 of 100")
   */
  showPageInfo?: boolean;
  /**
   * Max page buttons to show
   */
  maxPageButtons?: number;
  /**
   * Custom className
   */
  className?: string;
  /**
   * Disabled state
   */
  disabled?: boolean;
}

/**
 * Pagination Component
 * 
 * Displays pagination controls with customizable page sizes and navigation
 */
export const Pagination = forwardRef<HTMLDivElement, PaginationProps>(
  (
    {
      totalItems,
      currentPage,
      itemsPerPage,
      onPageChange,
      onItemsPerPageChange,
      pageSizes = [10, 25, 50, 100],
      showPageSizeSelector = true,
      showJumpToPage = true,
      showTotalCount = true,
      showPageInfo = true,
      maxPageButtons = 5,
      className = '',
      disabled = false,
    },
    ref
  ) => {
    const [jumpToPageInput, setJumpToPageInput] = useState('');

    const totalPages = useMemo(() => Math.ceil(totalItems / itemsPerPage), [totalItems, itemsPerPage]);

    const pageRange = useMemo(() => {
      const half = Math.floor(maxPageButtons / 2);
      let start = Math.max(1, currentPage - half);
      let end = Math.min(totalPages, start + maxPageButtons - 1);

      if (end - start + 1 < maxPageButtons) {
        start = Math.max(1, end - maxPageButtons + 1);
      }

      return { start, end };
    }, [currentPage, totalPages, maxPageButtons]);

    const startIndex = (currentPage - 1) * itemsPerPage + 1;
    const endIndex = Math.min(currentPage * itemsPerPage, totalItems);

    const handlePageChange = useCallback(
      (page: number) => {
        if (page >= 1 && page <= totalPages && !disabled) {
          onPageChange(page);
        }
      },
      [totalPages, onPageChange, disabled]
    );

    const handleJumpToPage = useCallback(() => {
      const page = parseInt(jumpToPageInput, 10);
      if (!isNaN(page) && page >= 1 && page <= totalPages) {
        handlePageChange(page);
        setJumpToPageInput('');
      }
    }, [jumpToPageInput, totalPages, handlePageChange]);

    const handleItemsPerPageChange = useCallback(
      (value: string) => {
        const newSize = parseInt(value, 10);
        onItemsPerPageChange?.(newSize);
      },
      [onItemsPerPageChange]
    );

    const pageButtons = useMemo(() => {
      const buttons = [];

      // First page
      if (pageRange.start > 1) {
        buttons.push(1);
        if (pageRange.start > 2) {
          buttons.push(-1); // Ellipsis
        }
      }

      // Page range
      for (let i = pageRange.start; i <= pageRange.end; i++) {
        buttons.push(i);
      }

      // Last page
      if (pageRange.end < totalPages) {
        if (pageRange.end < totalPages - 1) {
          buttons.push(-1); // Ellipsis
        }
        buttons.push(totalPages);
      }

      return buttons;
    }, [pageRange, totalPages]);

    return (
      <div ref={ref} className={`flex flex-col gap-4 ${className}`}>
        {/* Info Row */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Page Info */}
          {showPageInfo && totalItems > 0 && (
            <div className="text-sm text-muted-foreground">
              Showing <span className="font-medium">{startIndex}</span> to{' '}
              <span className="font-medium">{endIndex}</span> of{' '}
              <span className="font-medium">{totalItems}</span> items
            </div>
          )}

          {/* Page Size Selector */}
          {showPageSizeSelector && (
            <div className="flex items-center gap-2">
              <label htmlFor="page-size" className="text-sm text-muted-foreground">
                Items per page:
              </label>
              <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange} disabled={disabled}>
                <SelectTrigger id="page-size" className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pageSizes.map((size) => (
                    <SelectItem key={size} value={size.toString()}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Controls Row */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Navigation Buttons */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(1)}
              disabled={disabled || currentPage === 1}
              title="First page"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={disabled || currentPage === 1}
              title="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {/* Page Buttons */}
            <div className="flex items-center gap-1">
              {pageButtons.map((page, index) =>
                page === -1 ? (
                  <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">
                    ...
                  </span>
                ) : (
                  <Button
                    key={page}
                    variant={page === currentPage ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handlePageChange(page)}
                    disabled={disabled}
                    className="min-w-10"
                  >
                    {page}
                  </Button>
                )
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={disabled || currentPage === totalPages}
              title="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(totalPages)}
              disabled={disabled || currentPage === totalPages}
              title="Last page"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Jump to Page */}
          {showJumpToPage && totalPages > 1 && (
            <div className="flex items-center gap-2">
              <label htmlFor="jump-to-page" className="text-sm text-muted-foreground">
                Go to page:
              </label>
              <div className="flex gap-1">
                <Input
                  id="jump-to-page"
                  type="number"
                  min="1"
                  max={totalPages}
                  value={jumpToPageInput}
                  onChange={(e) => setJumpToPageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleJumpToPage();
                    }
                  }}
                  placeholder="Page #"
                  className="w-16"
                  disabled={disabled}
                />
                <Button
                  size="sm"
                  onClick={handleJumpToPage}
                  disabled={disabled || !jumpToPageInput}
                >
                  Go
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Total Count */}
        {showTotalCount && (
          <div className="text-xs text-muted-foreground text-center">
            Page {currentPage} of {totalPages} ({totalItems} total items)
          </div>
        )}
      </div>
    );
  }
);

Pagination.displayName = 'Pagination';

/**
 * Hook for managing pagination state
 */
export function usePagination(initialPage = 1, initialItemsPerPage = 10) {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleItemsPerPageChange = useCallback((size: number) => {
    setItemsPerPage(size);
    setCurrentPage(1); // Reset to first page when changing page size
  }, []);

  return {
    currentPage,
    itemsPerPage,
    handlePageChange,
    handleItemsPerPageChange,
  };
}
