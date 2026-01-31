import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { DatePickerPopover } from "./DatePickerPopover";
import { Plus, Loader2, Syringe } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface CropTreatmentLogProps {
  healthRecordId: number;
  onTreatmentAdded?: () => void;
}

export function CropTreatmentLog({ healthRecordId, onTreatmentAdded }: CropTreatmentLogProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: treatments = [], refetch } = trpc.crops.treatments.list.useQuery({ healthRecordId });
  const createTreatment = trpc.crops.treatments.create.useMutation({
    onSuccess: () => {
      refetch();
      setIsDialogOpen(false);
      resetForm();
      toast.success("Treatment logged successfully");
      onTreatmentAdded?.();
    },
    onError: (error) => {
      toast.error(`Failed to log treatment: ${error.message}`);
    },
  });

  const updateEffectiveness = trpc.crops.treatments.updateEffectiveness.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Effectiveness updated");
    },
  });

  const [treatmentForm, setTreatmentForm] = useState({
    treatmentDate: new Date(),
    treatmentType: "",
    productName: "",
    dosage: "",
    applicationMethod: "",
    cost: "",
    notes: "",
  });

  const resetForm = () => {
    setTreatmentForm({
      treatmentDate: new Date(),
      treatmentType: "",
      productName: "",
      dosage: "",
      applicationMethod: "",
      cost: "",
      notes: "",
    });
  };

  const handleSubmit = async () => {
    if (!treatmentForm.treatmentType) {
      toast.error("Please provide a treatment type");
      return;
    }

    await createTreatment.mutateAsync({
      healthRecordId,
      treatmentDate: treatmentForm.treatmentDate,
      treatmentType: treatmentForm.treatmentType,
      productName: treatmentForm.productName,
      dosage: treatmentForm.dosage,
      applicationMethod: treatmentForm.applicationMethod,
      cost: treatmentForm.cost,
      notes: treatmentForm.notes,
    });
  };

  const getEffectivenessColor = (effectiveness: string) => {
    switch (effectiveness) {
      case "very_effective":
        return "bg-green-100 text-green-800";
      case "effective":
        return "bg-blue-100 text-blue-800";
      case "partially_effective":
        return "bg-yellow-100 text-yellow-800";
      case "ineffective":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-semibold">Treatment History</h4>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Log Treatment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Log Treatment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Treatment Date</Label>
                  <DatePickerPopover
                    value={treatmentForm.treatmentDate}
                    onChange={(date) => setTreatmentForm({ ...treatmentForm, treatmentDate: date || new Date() })}
                    placeholder="Select date"
                  />
                </div>
                <div>
                  <Label>Treatment Type *</Label>
                  <Input
                    value={treatmentForm.treatmentType}
                    onChange={(e) => setTreatmentForm({ ...treatmentForm, treatmentType: e.target.value })}
                    placeholder="e.g., Fungicide, Insecticide"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Product Name</Label>
                  <Input
                    value={treatmentForm.productName}
                    onChange={(e) => setTreatmentForm({ ...treatmentForm, productName: e.target.value })}
                    placeholder="Commercial product name"
                  />
                </div>
                <div>
                  <Label>Dosage</Label>
                  <Input
                    value={treatmentForm.dosage}
                    onChange={(e) => setTreatmentForm({ ...treatmentForm, dosage: e.target.value })}
                    placeholder="e.g., 2ml/L, 500g/ha"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Application Method</Label>
                  <Input
                    value={treatmentForm.applicationMethod}
                    onChange={(e) => setTreatmentForm({ ...treatmentForm, applicationMethod: e.target.value })}
                    placeholder="e.g., Spray, Drench, Dust"
                  />
                </div>
                <div>
                  <Label>Cost (GH₵)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={treatmentForm.cost}
                    onChange={(e) => setTreatmentForm({ ...treatmentForm, cost: e.target.value })}
                    placeholder="Treatment cost"
                  />
                </div>
              </div>

              <div>
                <Label>Notes</Label>
                <Textarea
                  value={treatmentForm.notes}
                  onChange={(e) => setTreatmentForm({ ...treatmentForm, notes: e.target.value })}
                  placeholder="Additional observations or instructions..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={createTreatment.isPending}>
                  {createTreatment.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Log Treatment
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {treatments.length === 0 ? (
        <div className="text-sm text-muted-foreground text-center py-4">
          No treatments logged yet
        </div>
      ) : (
        <div className="space-y-3">
          {treatments.map((treatment: any) => (
            <Card key={treatment.id} className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-sm">{treatment.treatmentType}</CardTitle>
                    <CardDescription className="text-xs">
                      {format(new Date(treatment.treatmentDate), "MMM d, yyyy")}
                      {treatment.cost && ` • GH₵${parseFloat(treatment.cost).toFixed(2)}`}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    <Select
                      value={treatment.effectiveness}
                      onValueChange={(val: any) => {
                        updateEffectiveness.mutate({ id: treatment.id, effectiveness: val });
                      }}
                    >
                      <SelectTrigger className="w-[160px] h-7">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="not_evaluated">Not Evaluated</SelectItem>
                        <SelectItem value="ineffective">Ineffective</SelectItem>
                        <SelectItem value="partially_effective">Partially Effective</SelectItem>
                        <SelectItem value="effective">Effective</SelectItem>
                        <SelectItem value="very_effective">Very Effective</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {treatment.productName && (
                  <div className="flex gap-2">
                    <span className="font-medium">Product:</span>
                    <span className="text-muted-foreground">{treatment.productName}</span>
                  </div>
                )}
                {treatment.dosage && (
                  <div className="flex gap-2">
                    <span className="font-medium">Dosage:</span>
                    <span className="text-muted-foreground">{treatment.dosage}</span>
                  </div>
                )}
                {treatment.applicationMethod && (
                  <div className="flex gap-2">
                    <span className="font-medium">Method:</span>
                    <span className="text-muted-foreground">{treatment.applicationMethod}</span>
                  </div>
                )}
                {treatment.notes && (
                  <div>
                    <p className="font-medium mb-1">Notes:</p>
                    <p className="text-muted-foreground">{treatment.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
