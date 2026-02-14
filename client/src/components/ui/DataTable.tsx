import { forwardRef, useState, useCallback, useMemo, ReactNode } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Column<T> {
  /**
   * Column key
   */
  key: keyof T;
  /**
   * Column header label
   */
  label: string;
  /**
   * Column width
   */
  width?: string;
  /**
   * Is column sortable
   */
  sortable?: boolean;
  /**
   * Is column filterable
   */
  filterable?: boolean;
  /**
   * Render custom cell content
   */
  render?: (value: any, row: T, index: number) => ReactNode;
  /**
   * Cell className
   */
  className?: string;
}

export interface DataTableProps<T> {
  /**
   * Table columns
   */
  columns: Column<T>[];
  /**
   * Table data
   */
  data: T[];
  /**
   * Row key extractor
   */
  rowKey: keyof T | ((row: T, index: number) => string);
  /**
   * Enable row selection
   */
  selectable?: boolean;
  /**
   * Selected row keys
   */
  selectedRows?: Set<string>;
  /**
   * Callback on row selection change
   */
  onSelectionChange?: (selectedRows: Set<string>) => void;
  /**
   * Enable pagination
   */
  paginated?: boolean;
  /**
   * Items per page
   */
  itemsPerPage?: number;
  /**
   * On row click callback
   */
  onRowClick?: (row: T, index: number) => void;
  /**
   * Custom row className
   */
  rowClassName?: (row: T, index: number) => string;
  /**
   * Empty state message
   */
  emptyMessage?: string;
  /**
   * Loading state
   */
  isLoading?: boolean;
  /**
   * Custom className
   */
  className?: string;
}

/**
 * Sort direction type
 */
type SortDirection = 'asc' | 'desc' | null;

/**
 * Data Table Component
 * 
 * Feature-rich table with sorting, filtering, and row selection
 */
export const DataTable = forwardRef<HTMLDivElement, DataTableProps<any>>(
  (
    {
      columns,
      data,
      rowKey,
      selectable = false,
      selectedRows = new Set(),
      onSelectionChange,
      paginated = false,
      itemsPerPage = 10,
      onRowClick,
      rowClassName,
      emptyMessage = 'No data available',
      isLoading = false,
      className = '',
    },
    ref
  ) => {
    const [sortKey, setSortKey] = useState<keyof any | null>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>(null);
    const [currentPage, setCurrentPage] = useState(1);

    const getRowKey = useCallback(
      (row: any, index: number) => {
        if (typeof rowKey === 'function') {
          return rowKey(row, index);
        }
        return String(row[rowKey]);
      },
      [rowKey]
    );

    // Handle sorting
    const sortedData = useMemo(() => {
      if (!sortKey || !sortDirection) return data;

      return [...data].sort((a, b) => {
        const aVal = a[sortKey];
        const bVal = b[sortKey];

        if (aVal === bVal) return 0;
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;

        const comparison = aVal < bVal ? -1 : 1;
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }, [data, sortKey, sortDirection]);

    // Handle pagination
    const paginatedData = useMemo(() => {
      if (!paginated) return sortedData;

      const startIndex = (currentPage - 1) * itemsPerPage;
      return sortedData.slice(startIndex, startIndex + itemsPerPage);
    }, [sortedData, paginated, currentPage, itemsPerPage]);

    const totalPages = paginated ? Math.ceil(sortedData.length / itemsPerPage) : 1;

    const handleSort = (key: keyof any) => {
      const column = columns.find((c) => c.key === key);
      if (!column?.sortable) return;

      if (sortKey === key) {
        if (sortDirection === 'asc') {
          setSortDirection('desc');
        } else if (sortDirection === 'desc') {
          setSortDirection(null);
          setSortKey(null);
        }
      } else {
        setSortKey(key);
        setSortDirection('asc');
      }
    };

    const handleSelectAll = (checked: boolean) => {
      if (checked) {
        const newSelected = new Set(selectedRows);
        paginatedData.forEach((row, index) => {
          newSelected.add(getRowKey(row, index));
        });
        onSelectionChange?.(newSelected);
      } else {
        onSelectionChange?.(new Set());
      }
    };

    const handleSelectRow = (rowKey: string, checked: boolean) => {
      const newSelected = new Set(selectedRows);
      if (checked) {
        newSelected.add(rowKey);
      } else {
        newSelected.delete(rowKey);
      }
      onSelectionChange?.(newSelected);
    };

    const getSortIcon = (key: keyof any) => {
      if (sortKey !== key) {
        return <ChevronsUpDown className="h-4 w-4 opacity-50" />;
      }
      return sortDirection === 'asc' ? (
        <ChevronUp className="h-4 w-4" />
      ) : (
        <ChevronDown className="h-4 w-4" />
      );
    };

    const allSelected =
      paginatedData.length > 0 &&
      paginatedData.every((row, index) =>
        selectedRows.has(getRowKey(row, index))
      );

    const someSelected =
      paginatedData.some((row, index) =>
        selectedRows.has(getRowKey(row, index))
      ) && !allSelected;

    return (
      <div
        ref={ref}
        className={cn('w-full', className)}
      >
        {/* Table */}
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            {/* Header */}
            <thead className="bg-muted border-b border-border">
              <tr>
                {/* Selection checkbox */}
                {selectable && (
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      indeterminate={someSelected}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-input"
                    />
                  </th>
                )}

                {/* Column headers */}
                {columns.map((column) => (
                  <th
                    key={String(column.key)}
                    className={cn(
                      'px-4 py-3 text-left font-semibold text-sm',
                      column.width && `w-${column.width}`,
                      column.sortable && 'cursor-pointer hover:bg-muted/80'
                    )}
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    <div className="flex items-center gap-2">
                      {column.label}
                      {column.sortable && getSortIcon(column.key)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Body */}
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={columns.length + (selectable ? 1 : 0)}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    Loading...
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + (selectable ? 1 : 0)}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, index) => {
                  const key = getRowKey(row, index);
                  const isSelected = selectedRows.has(key);

                  return (
                    <tr
                      key={key}
                      className={cn(
                        'border-b border-border hover:bg-muted/50 transition-colors',
                        isSelected && 'bg-primary/5',
                        rowClassName?.(row, index)
                      )}
                      onClick={() => onRowClick?.(row, index)}
                    >
                      {/* Selection checkbox */}
                      {selectable && (
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => handleSelectRow(key, e.target.checked)}
                            onClick={(e) => e.stopPropagation()}
                            className="rounded border-input"
                          />
                        </td>
                      )}

                      {/* Cells */}
                      {columns.map((column) => (
                        <td
                          key={String(column.key)}
                          className={cn('px-4 py-3 text-sm', column.className)}
                        >
                          {column.render
                            ? column.render(row[column.key], row, index)
                            : row[column.key]}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {paginated && totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 px-4 py-2">
            <div className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className={cn(
                  'p-2 rounded-md border border-input transition-colors',
                  'hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className={cn(
                  'p-2 rounded-md border border-input transition-colors',
                  'hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
);

DataTable.displayName = 'DataTable';

/**
 * useDataTable Hook
 * 
 * Manage data table state
 */
export function useDataTable<T>(data: T[]) {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [currentPage, setCurrentPage] = useState(1);

  return {
    selectedRows,
    setSelectedRows,
    sortKey,
    setSortKey,
    sortDirection,
    setSortDirection,
    currentPage,
    setCurrentPage,
  };
}
