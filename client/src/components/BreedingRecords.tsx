import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Trash2, AlertCircle, CheckCircle } from "lucide-react";
import { format, differenceInDays } from "date-fns";

interface BreedingRecordsProps {
  farmId: number;
  animalsList: any[];
}

export default function BreedingRecords({ farmId, animalsList }: BreedingRecordsProps) {
  const [selectedAnimalId, setSelectedAnimalId] = useState<number | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  // Queries
  const { data: breedingRecords = [] } = trpc.breeding.listByAnimal.useQuery(
    { animalId: selectedAnimalId! },
    { enabled: !!selectedAnimalId }
  );

  // Mutations
  const createBreedingMutation = trpc.breeding.create.useMutation();
  const updateBreedingMutation = trpc.breeding.update.useMutation();
  const deleteBreedingMutation = trpc.breeding.delete.useMutation();

  // Form state
  const [breedingForm, setBreedingForm] = useState({
    breedingDate: "",
    sireId: "",
    damId: "",
    expectedDueDate: "",
    notes: "",
  });

  const handleCreateBreeding = async () => {
    if (!selectedAnimalId || !breedingForm.breedingDate) return;

    await createBreedingMutation.mutateAsync({
      animalId: selectedAnimalId,
      breedingDate: new Date(breedingForm.breedingDate),
      sireId: breedingForm.sireId ? parseInt(breedingForm.sireId) : undefined,
      damId: breedingForm.damId ? parseInt(breedingForm.damId) : undefined,
      expectedDueDate: breedingForm.expectedDueDate ? new Date(breedingForm.expectedDueDate) : undefined,
      notes: breedingForm.notes || undefined,
    });

    setBreedingForm({
      breedingDate: "",
      sireId: "",
      damId: "",
      expectedDueDate: "",
      notes: "",
    });
    setShowDialog(false);
  };

  const handleUpdateOutcome = async (recordId: number, outcome: string) => {
    await updateBreedingMutation.mutateAsync({
      id: recordId,
      outcome: outcome as "pending" | "successful" | "unsuccessful" | "aborted",
    });
  };

  const handleDeleteRecord = async (recordId: number) => {
    await deleteBreedingMutation.mutateAsync({ id: recordId });
  };

  const getAnimalName = (animalId: number) => {
    const animal = animalsList.find(a => a.id === animalId);
    return animal?.uniqueTagId || `Animal ${animalId}`;
  };

  const getOutcomeIcon = (outcome: string) => {
    switch (outcome) {
      case "successful":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "unsuccessful":
      case "aborted":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-amber-600" />;
    }
  };

  const getDaysUntilDue = (dueDate: string) => {
    const days = differenceInDays(new Date(dueDate), new Date());
    return days;
  };

  const upcomingBirths = breedingRecords.filter(
    (r: any) => r.outcome === "pending" && r.expectedDueDate && getDaysUntilDue(r.expectedDueDate) <= 30 && getDaysUntilDue(r.expectedDueDate) >= 0
  );

  const overdueBirths = breedingRecords.filter(
    (r: any) => r.outcome === "pending" && r.expectedDueDate && getDaysUntilDue(r.expectedDueDate) < 0
  );

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-base font-semibold mb-2 block">Select Animal for Breeding Records</Label>
        <Select value={selectedAnimalId?.toString() || ""} onValueChange={(val) => setSelectedAnimalId(parseInt(val))}>
          <SelectTrigger>
            <SelectValue placeholder="Choose an animal..." />
          </SelectTrigger>
          <SelectContent>
            {animalsList.map((animal: any) => (
              <SelectItem key={animal.id} value={animal.id.toString()}>
                {animal.uniqueTagId || `Animal ${animal.id}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedAnimalId && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Total Breeding Records</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{breedingRecords.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Pending</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {breedingRecords.filter((r: any) => r.outcome === "pending").length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Successful</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {breedingRecords.filter((r: any) => r.outcome === "successful").length}
                </div>
              </CardContent>
            </Card>
          </div>

          {upcomingBirths.length > 0 && (
            <Card className="border-amber-200 bg-amber-50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                  <CardTitle className="text-sm">Upcoming Births (Next 30 Days)</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {upcomingBirths.map((record: any) => (
                    <div key={record.id} className="flex justify-between items-center text-sm">
                      <div>
                        <p className="font-semibold">Expected: {format(new Date(record.expectedDueDate), "MMM d, yyyy")}</p>
                        <p className="text-xs text-gray-600">{getDaysUntilDue(record.expectedDueDate)} days remaining</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {overdueBirths.length > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <CardTitle className="text-sm">Overdue Births</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {overdueBirths.map((record: any) => (
                    <div key={record.id} className="flex justify-between items-center text-sm">
                      <div>
                        <p className="font-semibold">Expected: {format(new Date(record.expectedDueDate), "MMM d, yyyy")}</p>
                        <p className="text-xs text-red-600">{Math.abs(getDaysUntilDue(record.expectedDueDate))} days overdue</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Record Breeding
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Record Breeding Event</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Breeding Date</Label>
                  <Input
                    type="date"
                    value={breedingForm.breedingDate}
                    onChange={(e) => setBreedingForm({ ...breedingForm, breedingDate: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Sire (Male Parent)</Label>
                    <Select value={breedingForm.sireId} onValueChange={(val) => setBreedingForm({ ...breedingForm, sireId: val })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select sire..." />
                      </SelectTrigger>
                      <SelectContent>
                        {animalsList
                          .filter((a: any) => a.gender === "male")
                          .map((animal: any) => (
                            <SelectItem key={animal.id} value={animal.id.toString()}>
                              {animal.uniqueTagId || `Animal ${animal.id}`}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Dam (Female Parent)</Label>
                    <Select value={breedingForm.damId} onValueChange={(val) => setBreedingForm({ ...breedingForm, damId: val })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select dam..." />
                      </SelectTrigger>
                      <SelectContent>
                        {animalsList
                          .filter((a: any) => a.gender === "female")
                          .map((animal: any) => (
                            <SelectItem key={animal.id} value={animal.id.toString()}>
                              {animal.uniqueTagId || `Animal ${animal.id}`}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Expected Due Date</Label>
                  <Input
                    type="date"
                    value={breedingForm.expectedDueDate}
                    onChange={(e) => setBreedingForm({ ...breedingForm, expectedDueDate: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Notes</Label>
                  <Input
                    value={breedingForm.notes}
                    onChange={(e) => setBreedingForm({ ...breedingForm, notes: e.target.value })}
                    placeholder="Additional breeding details..."
                  />
                </div>

                <Button onClick={handleCreateBreeding} disabled={createBreedingMutation.isPending} className="w-full">
                  {createBreedingMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Record Breeding
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <div className="space-y-2">
            {breedingRecords.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No breeding records yet. Click "Record Breeding" to add one.</p>
              </div>
            ) : (
              breedingRecords.map((record: any) => (
                <Card key={record.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        {getOutcomeIcon(record.outcome)}
                        <div>
                          <CardTitle className="text-sm">
                            Breeding on {format(new Date(record.breedingDate), "MMM d, yyyy")}
                          </CardTitle>
                          <p className="text-xs text-gray-600 mt-1">
                            {record.sireId && `Sire: ${getAnimalName(record.sireId)}`}
                            {record.sireId && record.damId && " • "}
                            {record.damId && `Dam: ${getAnimalName(record.damId)}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select
                          value={record.outcome}
                          onValueChange={(val) => handleUpdateOutcome(record.id, val)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="successful">Successful</SelectItem>
                            <SelectItem value="unsuccessful">Unsuccessful</SelectItem>
                            <SelectItem value="aborted">Aborted</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteRecord(record.id)}
                          disabled={deleteBreedingMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {record.expectedDueDate && (
                        <div>
                          <p className="text-gray-600">Expected Due Date</p>
                          <p className="font-semibold">{format(new Date(record.expectedDueDate), "MMM d, yyyy")}</p>
                          {record.outcome === "pending" && (
                            <p className="text-xs text-gray-500 mt-1">
                              {getDaysUntilDue(record.expectedDueDate) > 0
                                ? `${getDaysUntilDue(record.expectedDueDate)} days remaining`
                                : `${Math.abs(getDaysUntilDue(record.expectedDueDate))} days overdue`}
                            </p>
                          )}
                        </div>
                      )}
                      {record.notes && (
                        <div>
                          <p className="text-gray-600">Notes</p>
                          <p className="font-semibold">{record.notes}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
