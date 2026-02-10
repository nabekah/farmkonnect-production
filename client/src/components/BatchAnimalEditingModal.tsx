import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Clock, User, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useBulkNotifications } from "@/hooks/useBulkNotifications";

interface Animal {
  id: number;
  uniqueTagId?: string;
  breed?: string;
  gender?: string;
  status?: string;
}

interface BatchEditRequest {
  id: string;
  animalCount: number;
  updates: Record<string, any>;
  reason: string;
  status: string;
  createdAt: Date | string;
}

interface BatchEditHistory {
  id: string;
  animalCount: number;
  updates: Record<string, any>;
  status: string;
  createdAt: Date | string;
  approvedAt: Date | string;
  appliedAt: Date | string;
}

interface BatchEditingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  farmId: number;
  animals: Animal[];
}

export function BatchAnimalEditingModal({ open, onOpenChange, farmId, animals }: BatchEditingModalProps) {
  const [step, setStep] = useState<"select" | "update" | "review" | "history">("select");
  const [selectedAnimals, setSelectedAnimals] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [updateType, setUpdateType] = useState<"status" | "breed" | "health">("status");
  const [updateValue, setUpdateValue] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [expandedRequest, setExpandedRequest] = useState<string | null>(null);
  const { notifyBatchStart, notifyApprovalRequested, notifyApprovalResult } = useBulkNotifications();

  // Fetch pending requests
  const { data: pendingRequests = [] } = trpc.animalBatchEditing.getPendingBatchEditRequests.useQuery(
    { farmId },
    { enabled: step === "history" }
  ) as any;

  // Fetch batch edit history
  const { data: history = [] } = trpc.animalBatchEditing.getBatchEditHistory.useQuery(
    { farmId },
    { enabled: step === "history" }
  ) as any;

  // Mutations
  const createBatchEdit = trpc.animalBatchEditing.createBatchEditRequest.useMutation({
    onSuccess: () => {
      notifyApprovalRequested(`${updateType} update`, selectedAnimals.length);
      setStep("review");
      setSelectedAnimals([]);
      setUpdateValue("");
      setReason("");
    },
    onError: (error) => {
      console.error("Batch edit error:", error);
    },
  });

  const approveBatchEdit = trpc.animalBatchEditing.approveBatchEditRequest.useMutation({
    onSuccess: (data: any) => {
      notifyApprovalResult("Batch edit", true, data?.successfulUpdates || data?.affectedCount || 0);
    },
    onError: (error) => {
      console.error("Approval error:", error);
    },
  });

  const rejectBatchEdit = trpc.animalBatchEditing.rejectBatchEditRequest.useMutation({
    onSuccess: (data: any) => {
      notifyApprovalResult("Batch edit", false, 0);
    },
    onError: (error) => {
      console.error("Rejection error:", error);
    },
  });

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    const isChecked = typeof checked === 'boolean' ? checked : false;
    setSelectAll(isChecked);
    if (isChecked) {
      setSelectedAnimals(animals.map((a) => a.id));
    } else {
      setSelectedAnimals([]);
    }
  };

  const handleSelectAnimal = (animalId: number, checked: boolean | 'indeterminate') => {
    const isChecked = typeof checked === 'boolean' ? checked : false;
    if (isChecked) {
      setSelectedAnimals([...selectedAnimals, animalId]);
    } else {
      setSelectedAnimals(selectedAnimals.filter((id) => id !== animalId));
    }
  };

  const handleCreateBatchEdit = async () => {
    if (selectedAnimals.length === 0 || !updateValue || !reason) {
      alert("Please select animals, provide update value, and reason");
      return;
    }

    const updates: any = {};
    if (updateType === "status") updates.status = updateValue;
    if (updateType === "breed") updates.breed = updateValue;
    if (updateType === "health") updates.healthStatus = updateValue;

    await createBatchEdit.mutateAsync({
      animalIds: selectedAnimals,
      updates,
      reason,
    });
  };

  const handleApprove = async (requestId: string) => {
    await approveBatchEdit.mutateAsync({
      requestId,
    });
  };

  const handleReject = async (requestId: string, reason: string) => {
    await rejectBatchEdit.mutateAsync({
      requestId,
      rejectionReason: reason,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Batch Animal Editing</DialogTitle>
          <DialogDescription>Manage bulk updates with approval workflow</DialogDescription>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={step === "select" ? "default" : "outline"}
            onClick={() => setStep("select")}
            className="flex-1"
          >
            Select Animals
          </Button>
          <Button
            variant={step === "update" ? "default" : "outline"}
            onClick={() => setStep("update")}
            disabled={selectedAnimals.length === 0}
            className="flex-1"
          >
            Update Details
          </Button>
          <Button
            variant={step === "review" ? "default" : "outline"}
            onClick={() => setStep("review")}
            className="flex-1"
          >
            Review & Submit
          </Button>
          <Button
            variant={step === "history" ? "default" : "outline"}
            onClick={() => setStep("history")}
            className="flex-1"
          >
            History
          </Button>
        </div>

        {/* Step 1: Select Animals */}
        {step === "select" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <Checkbox
                checked={selectAll}
                onCheckedChange={handleSelectAll}
                id="select-all"
              />
              <Label htmlFor="select-all" className="flex-1 cursor-pointer">
                Select All ({animals.length} animals)
              </Label>
              <Badge variant="secondary">{selectedAnimals.length} selected</Badge>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {animals.map((animal) => (
                <div
                  key={animal.id}
                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50"
                >
                  <Checkbox
                    checked={selectedAnimals.includes(animal.id)}
                    onCheckedChange={(checked) => handleSelectAnimal(animal.id, checked as boolean)}
                    id={`animal-${animal.id}`}
                  />
                  <div className="flex-1">
                    <Label htmlFor={`animal-${animal.id}`} className="cursor-pointer font-medium">
                      {animal.uniqueTagId || `Animal #${animal.id}`}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {animal.breed} • {animal.gender} • {animal.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <Button
              onClick={() => setStep("update")}
              disabled={selectedAnimals.length === 0}
              className="w-full"
            >
              Continue with {selectedAnimals.length} animals
            </Button>
          </div>
        )}

        {/* Step 2: Update Details */}
        {step === "update" && (
          <div className="space-y-4">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <p className="text-sm font-medium">
                  Updating {selectedAnimals.length} animals
                </p>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <Label htmlFor="update-type">Update Type</Label>
              <Select value={updateType} onValueChange={(value: string) => setUpdateType(value as 'status' | 'breed' | 'health')}>
                <SelectTrigger id="update-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="status">Status</SelectItem>
                  <SelectItem value="breed">Breed</SelectItem>
                  <SelectItem value="health">Health Status</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="update-value">New Value</Label>
              {updateType === "status" ? (
                <Select value={updateValue} onValueChange={setUpdateValue}>
                  <SelectTrigger id="update-value">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="sold">Sold</SelectItem>
                    <SelectItem value="deceased">Deceased</SelectItem>
                  </SelectContent>
                </Select>
              ) : updateType === "health" ? (
                <Select value={updateValue} onValueChange={setUpdateValue}>
                  <SelectTrigger id="update-value">
                    <SelectValue placeholder="Select health status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="healthy">Healthy</SelectItem>
                    <SelectItem value="sick">Sick</SelectItem>
                    <SelectItem value="recovering">Recovering</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="update-value"
                  value={updateValue}
                  onChange={(e) => setUpdateValue(e.target.value)}
                  placeholder="Enter new breed"
                />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Update</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why you're making this bulk update"
                rows={4}
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("select")} className="flex-1">
                Back
              </Button>
              <Button
                onClick={() => setStep("review")}
                disabled={!updateValue || !reason}
                className="flex-1"
              >
                Review Changes
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Review & Submit */}
        {step === "review" && (
          <div className="space-y-4">
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-green-900">Review Your Changes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Animals Affected</p>
                    <p className="text-2xl font-bold">{selectedAnimals.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Update Type</p>
                    <p className="text-2xl font-bold capitalize">{updateType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">New Value</p>
                    <p className="text-2xl font-bold">{updateValue}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge>Pending Approval</Badge>
                  </div>
                </div>

                <div className="border-t pt-3">
                  <p className="text-sm text-muted-foreground mb-2">Reason</p>
                  <p className="text-sm">{reason}</p>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("update")} className="flex-1">
                Edit
              </Button>
              <Button
                onClick={handleCreateBatchEdit}
                disabled={createBatchEdit.isPending}
                className="flex-1"
              >
                {createBatchEdit.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit for Approval"
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: History & Approvals */}
        {step === "history" && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant={expandedRequest === "pending" ? "default" : "outline"}
                onClick={() => setExpandedRequest(expandedRequest === "pending" ? null : "pending")}
                className="flex-1"
              >
                <Clock className="w-4 h-4 mr-2" />
                Pending Requests ({pendingRequests.length})
              </Button>
              <Button
                variant={expandedRequest === "history" ? "default" : "outline"}
                onClick={() => setExpandedRequest(expandedRequest === "history" ? null : "history")}
                className="flex-1"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Completed ({history.length})
              </Button>
            </div>

            {/* Pending Requests */}
            {expandedRequest === "pending" && (
              <div className="space-y-3">
                {pendingRequests.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-center text-muted-foreground">No pending requests</p>
                    </CardContent>
                  </Card>
                ) : (
                  Array.isArray(pendingRequests) && pendingRequests.map((request: BatchEditRequest) => (
                    <Card key={request.id} className="border-yellow-200 bg-yellow-50">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-base">{request.animalCount} Animals</CardTitle>
                            <CardDescription>{request.reason}</CardDescription>
                          </div>
                          <Badge variant="outline">Pending</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="text-sm">
                          <p className="text-muted-foreground">Update: {JSON.stringify(request.updates)}</p>
                          <p className="text-muted-foreground text-xs mt-1">
                            Created: {new Date(request.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleApprove(request.id)}
                            disabled={approveBatchEdit.isPending}
                            className="flex-1"
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReject(request.id, "Rejected by user")}
                            disabled={rejectBatchEdit.isPending}
                            className="flex-1"
                          >
                            Reject
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}

            {/* Completed History */}
            {expandedRequest === "history" && (
              <div className="space-y-3">
                {history.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-center text-muted-foreground">No history</p>
                    </CardContent>
                  </Card>
                ) : (
                  Array.isArray(history) && history.map((item: BatchEditHistory) => (
                    <Card key={item.id} className="border-green-200 bg-green-50">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-base flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              {item.animalCount} Animals
                            </CardTitle>
                            <CardDescription>{JSON.stringify(item.updates)}</CardDescription>
                          </div>
                          <Badge variant="secondary">Completed</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="text-sm text-muted-foreground">
                          <p>Created: {new Date(item.createdAt).toLocaleString()}</p>
                          <p>Applied: {new Date(item.appliedAt).toLocaleString()}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
