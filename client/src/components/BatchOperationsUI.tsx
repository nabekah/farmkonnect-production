import React, { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Trash2, Edit3, Copy, ChevronDown, CheckSquare, Square, RotateCcw } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface BatchItem {
  id: string;
  date: string;
  category: string;
  amount: number;
  description: string;
  selected?: boolean;
}

interface BatchOperationsUIProps {
  items: BatchItem[];
  onItemsChange: (items: BatchItem[]) => void;
  itemType: "expenses" | "receipts" | "appointments";
}

export const BatchOperationsUI: React.FC<BatchOperationsUIProps> = ({
  items,
  onItemsChange,
  itemType,
}) => {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showBatchDialog, setShowBatchDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [batchAction, setBatchAction] = useState<"category" | "date" | "duplicate">("category");
  const [batchValue, setBatchValue] = useState("");
  const [undoStack, setUndoStack] = useState<BatchItem[][]>([]);
  const [showActionBar, setShowActionBar] = useState(false);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "a") {
          e.preventDefault();
          selectAll();
        } else if (e.key === "z") {
          e.preventDefault();
          undo();
        }
      } else if (e.key === "Delete" && selectedItems.size > 0) {
        setShowDeleteConfirm(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedItems]);

  const selectAll = useCallback(() => {
    const allIds = new Set(items.map((item) => item.id));
    setSelectedItems(allIds);
    setShowActionBar(true);
  }, [items]);

  const deselectAll = useCallback(() => {
    setSelectedItems(new Set());
    setShowActionBar(false);
  }, []);

  const toggleItem = useCallback((id: string) => {
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      setShowActionBar(newSet.size > 0);
      return newSet;
    });
  }, []);

  const toggleRange = useCallback(
    (startId: string, endId: string) => {
      const startIndex = items.findIndex((item) => item.id === startId);
      const endIndex = items.findIndex((item) => item.id === endId);
      const [min, max] = startIndex < endIndex ? [startIndex, endIndex] : [endIndex, startIndex];

      const newSet = new Set(selectedItems);
      for (let i = min; i <= max; i++) {
        newSet.add(items[i].id);
      }
      setSelectedItems(newSet);
      setShowActionBar(true);
    },
    [items, selectedItems]
  );

  const applyBatchAction = () => {
    // Save current state for undo
    setUndoStack((prev) => [...prev, items]);

    const updatedItems = items.map((item) => {
      if (!selectedItems.has(item.id)) return item;

      switch (batchAction) {
        case "category":
          return { ...item, category: batchValue };
        case "date":
          return { ...item, date: batchValue };
        case "duplicate":
          return { ...item, description: `${item.description} (Copy)` };
        default:
          return item;
      }
    });

    onItemsChange(updatedItems);
    setShowBatchDialog(false);
    setBatchValue("");
  };

  const deleteBatchItems = () => {
    // Save current state for undo
    setUndoStack((prev) => [...prev, items]);

    const updatedItems = items.filter((item) => !selectedItems.has(item.id));
    onItemsChange(updatedItems);
    setSelectedItems(new Set());
    setShowActionBar(false);
    setShowDeleteConfirm(false);
  };

  const undo = () => {
    if (undoStack.length === 0) return;
    const previousState = undoStack[undoStack.length - 1];
    onItemsChange(previousState);
    setUndoStack((prev) => prev.slice(0, -1));
  };

  const duplicateItems = () => {
    // Save current state for undo
    setUndoStack((prev) => [...prev, items]);

    const duplicates = items
      .filter((item) => selectedItems.has(item.id))
      .map((item) => ({
        ...item,
        id: `${item.id}-copy-${Date.now()}`,
        description: `${item.description} (Copy)`,
      }));

    onItemsChange([...items, ...duplicates]);
    setSelectedItems(new Set());
    setShowActionBar(false);
  };

  const selectedCount = selectedItems.size;
  const totalAmount = items
    .filter((item) => selectedItems.has(item.id))
    .reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="space-y-4">
      {/* Batch Action Bar */}
      {showActionBar && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="text-sm">
                <p className="font-semibold">
                  {selectedCount} item{selectedCount !== 1 ? "s" : ""} selected
                </p>
                <p className="text-xs text-gray-600">
                  Total: GHS {totalAmount.toLocaleString("en-US", { maximumFractionDigits: 2 })}
                </p>
              </div>

              <div className="flex gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowBatchDialog(true)}
                  className="gap-2"
                >
                  <Edit3 className="h-4 w-4" />
                  Batch Edit
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={duplicateItems}
                  className="gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Duplicate
                </Button>

                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>

                <Button size="sm" variant="outline" onClick={deselectAll}>
                  Clear Selection
                </Button>

                {undoStack.length > 0 && (
                  <Button size="sm" variant="outline" onClick={undo} className="gap-2">
                    <RotateCcw className="h-4 w-4" />
                    Undo
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selection Controls */}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={selectAll}
          className="gap-2"
        >
          <CheckSquare className="h-4 w-4" />
          Select All ({items.length})
        </Button>
        {selectedCount > 0 && (
          <Button size="sm" variant="outline" onClick={deselectAll}>
            Deselect All
          </Button>
        )}
      </div>

      {/* Items List */}
      <Card>
        <CardHeader>
          <CardTitle>
            {itemType === "expenses" && "Expenses"}
            {itemType === "receipts" && "Receipts"}
            {itemType === "appointments" && "Appointments"}
          </CardTitle>
          <CardDescription>
            Click items to select, or use Ctrl+A to select all. Press Delete to remove selected items.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No items to display</p>
            ) : (
              items.map((item, index) => (
                <div
                  key={item.id}
                  className={`p-3 border rounded-lg cursor-pointer transition ${
                    selectedItems.has(item.id)
                      ? "bg-blue-50 border-blue-300 border-2"
                      : "bg-white hover:bg-gray-50"
                  }`}
                  onClick={() => toggleItem(item.id)}
                  onShiftClick={(e) => {
                    if (index > 0) {
                      e.preventDefault();
                      toggleRange(items[index - 1].id, item.id);
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {selectedItems.has(item.id) ? (
                        <CheckSquare className="h-5 w-5 text-blue-600" />
                      ) : (
                        <Square className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <p className="font-semibold text-sm">{item.description}</p>
                          <p className="text-xs text-gray-600 mt-1">
                            {item.date} • {item.category}
                          </p>
                        </div>
                        <span className="font-bold text-sm whitespace-nowrap">
                          GHS {item.amount.toLocaleString("en-US", { maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Batch Edit Dialog */}
      <Dialog open={showBatchDialog} onOpenChange={setShowBatchDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Batch Edit ({selectedCount} items)</DialogTitle>
            <DialogDescription>
              Apply changes to all selected items
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Action</Label>
              <select
                value={batchAction}
                onChange={(e) => setBatchAction(e.target.value as any)}
                className="w-full border rounded px-3 py-2 mt-2"
              >
                <option value="category">Change Category</option>
                <option value="date">Change Date</option>
                <option value="duplicate">Mark as Duplicate</option>
              </select>
            </div>

            {batchAction !== "duplicate" && (
              <div>
                <Label>
                  {batchAction === "category" ? "New Category" : "New Date"}
                </Label>
                {batchAction === "date" ? (
                  <Input
                    type="date"
                    value={batchValue}
                    onChange={(e) => setBatchValue(e.target.value)}
                    className="mt-2"
                  />
                ) : (
                  <Input
                    type="text"
                    placeholder="Enter category"
                    value={batchValue}
                    onChange={(e) => setBatchValue(e.target.value)}
                    className="mt-2"
                  />
                )}
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={applyBatchAction} className="flex-1">
                Apply Changes
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowBatchDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete {selectedCount} item(s)?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone, but you can use Ctrl+Z to undo immediately.
            Total amount to be deleted: GHS {totalAmount.toLocaleString("en-US", { maximumFractionDigits: 2 })}
          </AlertDialogDescription>
          <div className="flex gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteBatchItems} className="bg-red-600">
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Keyboard Shortcuts Help */}
      <Card className="bg-gray-50">
        <CardContent className="pt-4">
          <p className="text-xs font-semibold text-gray-600 mb-2">Keyboard Shortcuts:</p>
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
            <div>
              <kbd className="bg-white border px-2 py-1 rounded">Ctrl+A</kbd> Select all
            </div>
            <div>
              <kbd className="bg-white border px-2 py-1 rounded">Delete</kbd> Delete selected
            </div>
            <div>
              <kbd className="bg-white border px-2 py-1 rounded">Ctrl+Z</kbd> Undo
            </div>
            <div>
              <kbd className="bg-white border px-2 py-1 rounded">Shift+Click</kbd> Range select
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BatchOperationsUI;
