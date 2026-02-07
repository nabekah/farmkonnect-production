import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

interface BulkRegistrationConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  tagIds: string[];
  breed: string;
  animalType: string;
  gender: string;
}

export function BulkRegistrationConfirmation({
  isOpen,
  onClose,
  onConfirm,
  tagIds,
  breed,
  animalType,
  gender,
}: BulkRegistrationConfirmationProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    try {
      setIsConfirming(true);
      setError(null);
      await onConfirm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to register animals");
    } finally {
      setIsConfirming(false);
    }
  };

  const estimatedTime = Math.ceil(tagIds.length / 10); // Rough estimate: 10 animals per second

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Confirm Bulk Animal Registration</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary Card */}
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Total Animals:</span>
                <span className="text-2xl font-bold text-blue-600">{tagIds.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Estimated Processing Time:</span>
                <span className="font-semibold">{estimatedTime}s</span>
              </div>
            </div>
          </Card>

          {/* Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Animal Type</p>
              <p className="font-semibold">{animalType}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Breed</p>
              <p className="font-semibold">{breed || "Not specified"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Gender</p>
              <p className="font-semibold capitalize">{gender}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Tag ID Format</p>
              <p className="font-semibold text-xs">{tagIds[0]} - {tagIds[tagIds.length - 1]}</p>
            </div>
          </div>

          {/* Tag IDs Preview */}
          <div>
            <p className="text-sm font-semibold mb-2">Tag IDs to Register:</p>
            <div className="bg-gray-50 rounded p-3 max-h-40 overflow-y-auto">
              <div className="grid grid-cols-4 gap-2">
                {tagIds.slice(0, 20).map((id, idx) => (
                  <div key={idx} className="text-xs bg-white p-2 rounded border text-center">
                    {id}
                  </div>
                ))}
                {tagIds.length > 20 && (
                  <div className="text-xs bg-gray-200 p-2 rounded text-center col-span-4">
                    +{tagIds.length - 20} more
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded border border-yellow-200">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-yellow-800">
              <p className="font-semibold">Please review carefully</p>
              <p>This action cannot be undone. All animals will be registered immediately.</p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-3 p-3 bg-red-50 rounded border border-red-200">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isConfirming}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isConfirming}>
            {isConfirming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isConfirming ? "Registering..." : `Register ${tagIds.length} Animals`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
