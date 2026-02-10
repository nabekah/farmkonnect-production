import { useState, useCallback } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  SortingState,
  ColumnOrderState,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Eye,
  EyeOff,
  Settings,
  Download,
  Save,
  X,
} from 'lucide-react';

interface DataTableProps<TData> {
  columns: ColumnDef<TData>[];
  data: TData[];
  onSave?: (data: TData[]) => Promise<void>;
  enableDragDrop?: boolean;
  enableInlineEdit?: boolean;
  enableExport?: boolean;
  filterPlaceholder?: string;
  filterColumn?: string;
}

interface EditingCell {
  rowIndex: number;
  columnId: string;
  value: any;
}

export function DataTableWithDragDrop<TData>({
  columns,
  data,
  onSave,
  enableDragDrop = true,
  enableInlineEdit = true,
  enableExport = true,
  filterPlaceholder = 'Filter...',
  filterColumn = 'name',
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>(
    columns.map((col: any) => col.id || '')
  );
  const [columnVisibility, setColumnVisibility] = useState({});
  const [globalFilter, setGlobalFilter] = useState('');
  const [editingCells, setEditingCells] = useState<EditingCell[]>([]);
  const [editedData, setEditedData] = useState<TData[]>(data);
  const [isSaving, setIsSaving] = useState(false);
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null);

  const table = useReactTable({
    data: editedData,
    columns,
    state: {
      sorting,
      columnOrder,
      columnVisibility,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnOrderChange: setColumnOrder,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const handleCellEdit = useCallback(
    (rowIndex: number, columnId: string, value: any) => {
      setEditingCells((prev) => {
        const existing = prev.find((e) => e.rowIndex === rowIndex && e.columnId === columnId);
        if (existing) {
          return prev.map((e) =>
            e.rowIndex === rowIndex && e.columnId === columnId ? { ...e, value } : e
          );
        }
        return [...prev, { rowIndex, columnId, value }];
      });

      // Update edited data
      setEditedData((prev) => {
        const newData = [...prev];
        const row = newData[rowIndex] as any;
        if (row) {
          row[columnId] = value;
        }
        return newData;
      });
    },
    []
  );

  const handleSave = async () => {
    if (!onSave) return;
    setIsSaving(true);
    try {
      await onSave(editedData);
      setEditingCells([]);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedData(data);
    setEditingCells([]);
  };

  const handleExport = () => {
    const csv = [
      table.getHeaderGroups()[0].headers.map((h) => h.column.columnDef.header).join(','),
      ...editedData.map((row: any) =>
        table.getHeaderGroups()[0].headers.map((h) => row[h.column.columnDef.id] || '').join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.csv';
    a.click();
  };

  const handleDragStart = (columnId: string) => {
    setDraggedColumn(columnId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetColumnId: string) => {
    if (!draggedColumn || draggedColumn === targetColumnId) return;

    const newOrder = [...columnOrder];
    const draggedIndex = newOrder.indexOf(draggedColumn);
    const targetIndex = newOrder.indexOf(targetColumnId);

    if (draggedIndex !== -1 && targetIndex !== -1) {
      newOrder.splice(draggedIndex, 1);
      newOrder.splice(targetIndex, 0, draggedColumn);
      setColumnOrder(newOrder);
    }

    setDraggedColumn(null);
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Input
          placeholder={filterPlaceholder}
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-xs"
        />

        <div className="flex items-center gap-2 ml-auto">
          {enableExport && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
          )}

          {/* Column Visibility */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Eye className="h-4 w-4" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table.getAllLeafColumns().map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                >
                  {column.columnDef.header as string}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {editingCells.length > 0 && (
            <>
              <Button
                variant="default"
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    draggable={enableDragDrop}
                    onDragStart={() => handleDragStart(header.column.id)}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(header.column.id)}
                    className={`cursor-move ${
                      draggedColumn === header.column.id ? 'bg-muted opacity-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {header.isPlaceholder ? null : (
                        <>
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getCanSort() && (
                            <button
                              onClick={() => header.column.toggleSorting()}
                              className="ml-auto"
                            >
                              {header.column.getIsSorted() === 'asc' ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : header.column.getIsSorted() === 'desc' ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronsUpDown className="h-4 w-4 opacity-50" />
                              )}
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row, rowIndex) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => {
                  const isEditing = editingCells.some(
                    (e) => e.rowIndex === rowIndex && e.columnId === cell.column.id
                  );
                  const editingValue = editingCells.find(
                    (e) => e.rowIndex === rowIndex && e.columnId === cell.column.id
                  )?.value;

                  return (
                    <TableCell
                      key={cell.id}
                      onClick={() => {
                        if (enableInlineEdit && !isEditing) {
                          handleCellEdit(rowIndex, cell.column.id, cell.getValue());
                        }
                      }}
                      className={`${
                        enableInlineEdit ? 'cursor-pointer hover:bg-muted' : ''
                      } ${isEditing ? 'p-0' : ''}`}
                    >
                      {isEditing ? (
                        <Input
                          autoFocus
                          value={editingValue}
                          onChange={(e) =>
                            handleCellEdit(rowIndex, cell.column.id, e.target.value)
                          }
                          onBlur={() => {
                            // Keep the edit active
                          }}
                          className="h-8 border-0 rounded-none"
                        />
                      ) : (
                        flexRender(cell.column.columnDef.cell, cell.getContext())
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} of {data.length} row(s)
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <span className="text-sm">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
