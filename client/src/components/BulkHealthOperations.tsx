import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, AlertCircle, CheckCircle2 } from "lucide-react";

interface BulkHealthOperationsProps {
  selectedAnimalIds: number[];
  onSuccess?: () => void;
}

export function BulkHealthOperations({
  selectedAnimalIds,
  onSuccess,
}: BulkHealthOperationsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [operationType, setOperationType] = useState<"health" | "vaccination" | "performance">("health");
  const [formData, setFormData] = useState({
    recordType: "vaccination",
    description: "",
    date: new Date().toISOString().split("T")[0],
    notes: "",
    severity: "medium",
    vaccineName: "",
    nextDueDate: "",
    veterinarian: "",
    batchNumber: "",
    metricType: "weight",
    value: "",
    unit: "kg",
  });
  const [result, setResult] = useState<any>(null);

  const addHealthRecordsMutation = trpc.bulkHealthOperations.addHealthRecords.useMutation();
  const addVaccinationsMutation = trpc.bulkHealthOperations.addVaccinations.useMutation();
  const addPerformanceMetricsMutation = trpc.bulkHealthOperations.addPerformanceMetrics.useMutation();

  const handleSubmit = async () => {
    try {
      if (operationType === "health") {
        const res = await addHealthRecordsMutation.mutateAsync({
          animalIds: selectedAnimalIds,
          recordType: formData.recordType as any,
          description: formData.description,
          date: formData.date,
          notes: formData.notes,
          severity: formData.severity as any,
        });
        setResult(res);
      } else if (operationType === "vaccination") {
        const res = await addVaccinationsMutation.mutateAsync({
          animalIds: selectedAnimalIds,
          vaccineName: formData.vaccineName,
          vaccinationDate: formData.date,
          nextDueDate: formData.nextDueDate,
          veterinarian: formData.veterinarian,
          batchNumber: formData.batchNumber,
          notes: formData.notes,
        });
        setResult(res);
      } else {
        const res = await addPerformanceMetricsMutation.mutateAsync({
          animalIds: selectedAnimalIds,
          metricType: formData.metricType as any,
          value: parseFloat(formData.value),
          unit: formData.unit,
          recordDate: formData.date,
          notes: formData.notes,
        });
        setResult(res);
      }
      onSuccess?.();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  if (selectedAnimalIds.length === 0) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          Bulk Operations ({selectedAnimalIds.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Health Operations</DialogTitle>
        </DialogHeader>

        {result ? (
          <div className="space-y-4">
            <Card className={`p-4 ${result.failed === 0 ? "bg-green-50" : "bg-yellow-50"}`}>
              <div className="flex items-start gap-3">
                {result.failed === 0 ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                )}
                <div>
                  <p className="font-semibold">
                    {result.successful} of {result.total} operations completed
                  </p>
                  {result.failed > 0 && (
                    <p className="text-sm text-yellow-700">
                      {result.failed} operations failed
                    </p>
                  )}
                </div>
              </div>
            </Card>
            <Button onClick={() => setIsOpen(false)} className="w-full">
              Close
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Operation Type Selection */}
            <div>
              <Label>Operation Type</Label>
              <Select value={operationType} onValueChange={(val: any) => setOperationType(val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="health">Health Records</SelectItem>
                  <SelectItem value="vaccination">Vaccinations</SelectItem>
                  <SelectItem value="performance">Performance Metrics</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Health Records Form */}
            {operationType === "health" && (
              <>
                <div>
                  <Label>Record Type</Label>
                  <Select value={formData.recordType} onValueChange={(val) => setFormData({ ...formData, recordType: val })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vaccination">Vaccination</SelectItem>
                      <SelectItem value="treatment">Treatment</SelectItem>
                      <SelectItem value="checkup">Checkup</SelectItem>
                      <SelectItem value="medication">Medication</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Description</Label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="e.g., Annual health checkup"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Severity</Label>
                    <Select value={formData.severity} onValueChange={(val) => setFormData({ ...formData, severity: val })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}

            {/* Vaccination Form */}
            {operationType === "vaccination" && (
              <>
                <div>
                  <Label>Vaccine Name</Label>
                  <Input
                    value={formData.vaccineName}
                    onChange={(e) => setFormData({ ...formData, vaccineName: e.target.value })}
                    placeholder="e.g., FMD Vaccine"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Vaccination Date</Label>
                    <Input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Next Due Date</Label>
                    <Input
                      type="date"
                      value={formData.nextDueDate}
                      onChange={(e) => setFormData({ ...formData, nextDueDate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Veterinarian</Label>
                    <Input
                      value={formData.veterinarian}
                      onChange={(e) => setFormData({ ...formData, veterinarian: e.target.value })}
                      placeholder="Name"
                    />
                  </div>
                  <div>
                    <Label>Batch Number</Label>
                    <Input
                      value={formData.batchNumber}
                      onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                      placeholder="Batch #"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Performance Metrics Form */}
            {operationType === "performance" && (
              <>
                <div>
                  <Label>Metric Type</Label>
                  <Select value={formData.metricType} onValueChange={(val) => setFormData({ ...formData, metricType: val })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weight">Weight</SelectItem>
                      <SelectItem value="milk_production">Milk Production</SelectItem>
                      <SelectItem value="egg_production">Egg Production</SelectItem>
                      <SelectItem value="growth_rate">Growth Rate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Value</Label>
                    <Input
                      type="number"
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label>Unit</Label>
                    <Input
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      placeholder="kg"
                    />
                  </div>
                  <div>
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Notes */}
            <div>
              <Label>Notes (Optional)</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Add any additional notes"
                rows={3}
              />
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={
                addHealthRecordsMutation.isPending ||
                addVaccinationsMutation.isPending ||
                addPerformanceMetricsMutation.isPending
              }
              className="w-full"
            >
              {(addHealthRecordsMutation.isPending ||
                addVaccinationsMutation.isPending ||
                addPerformanceMetricsMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Apply to {selectedAnimalIds.length} Animals
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
