import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus, Trash2, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import BreedingRecords from "@/components/BreedingRecords";
import { FeedingRecords } from "@/components/FeedingRecords";

const ANIMAL_TYPES = [
  { id: 1, name: "Cattle" },
  { id: 2, name: "Sheep" },
  { id: 3, name: "Goat" },
  { id: 4, name: "Pig" },
  { id: 5, name: "Chicken" },
  { id: 6, name: "Duck" },
];

export default function Livestock() {
  const { user } = useAuth();
  const [selectedFarmId, setSelectedFarmId] = useState<number | null>(null);
  const [selectedAnimalId, setSelectedAnimalId] = useState<number | null>(null);
  const [tabValue, setTabValue] = useState("animals");

  // Queries
  const { data: farms = [] } = trpc.livestock.farms.list.useQuery({ farmType: undefined });
  const { data: animalsList = [] } = trpc.livestock.animals.list.useQuery(
    { farmId: selectedFarmId || 0 },
    { enabled: !!selectedFarmId }
  );
  const { data: healthRecords = [] } = trpc.livestock.healthRecords.list.useQuery(
    { animalId: selectedAnimalId! },
    { enabled: !!selectedAnimalId }
  );
  const { data: performanceData = [] } = trpc.livestock.performanceMetrics.list.useQuery(
    { animalId: selectedAnimalId! },
    { enabled: !!selectedAnimalId }
  );

  // Mutations
  const createAnimalMutation = trpc.livestock.animals.create.useMutation();
  const updateAnimalMutation = trpc.livestock.animals.update.useMutation();
  const createHealthRecordMutation = trpc.livestock.healthRecords.create.useMutation();
  const deleteHealthRecordMutation = trpc.livestock.healthRecords.delete.useMutation();
  const recordPerformanceMutation = trpc.livestock.performanceMetrics.create.useMutation();

  // Form states
  const [animalForm, setAnimalForm] = useState({
    typeId: "",
    uniqueTagId: "",
    birthDate: "",
    gender: "unknown",
    breed: "",
  });

  const [healthForm, setHealthForm] = useState({
    recordDate: "",
    eventType: "checkup" as const,
    details: "",
  });

  const [vaccinationForm, setVaccinationForm] = useState({
    vaccineType: "",
    recordDate: "",
    nextDueDate: "",
    details: "",
  });

  const [performanceForm, setPerformanceForm] = useState({
    metricDate: "",
    weightKg: "",
    milkYieldLiters: "",
    eggCount: "",
  });

  const handleCreateAnimal = async () => {
    if (!selectedFarmId || !animalForm.typeId) return;
    await createAnimalMutation.mutateAsync({
      farmId: selectedFarmId,
      typeId: parseInt(animalForm.typeId),
      uniqueTagId: animalForm.uniqueTagId || undefined,
      birthDate: animalForm.birthDate ? new Date(animalForm.birthDate) : undefined,
      gender: animalForm.gender as "male" | "female" | "unknown",
      breed: animalForm.breed || undefined,
    });
    setAnimalForm({ typeId: "", uniqueTagId: "", birthDate: "", gender: "unknown", breed: "" });
  };

  const handleCreateHealthRecord = async () => {
    if (!selectedAnimalId || !healthForm.recordDate) return;
    await createHealthRecordMutation.mutateAsync({
      animalId: selectedAnimalId,
      recordDate: new Date(healthForm.recordDate),
      eventType: healthForm.eventType,
      details: healthForm.details || undefined,
    });
    setHealthForm({ recordDate: "", eventType: "checkup", details: "" });
  };

  const handleRecordVaccination = async () => {
    if (!selectedAnimalId || !vaccinationForm.vaccineType || !vaccinationForm.recordDate) return;
    // Vaccination records are tracked through health records
    await createHealthRecordMutation.mutateAsync({
      animalId: selectedAnimalId,
      recordDate: new Date(vaccinationForm.recordDate),
      eventType: "vaccination",
      details: `${vaccinationForm.vaccineType}: ${vaccinationForm.details || 'Vaccination administered'}`,
    });
    setVaccinationForm({ vaccineType: "", recordDate: "", nextDueDate: "", details: "" });
  };

  const handleRecordPerformance = async () => {
    if (!selectedAnimalId || !performanceForm.metricDate) return;
    await recordPerformanceMutation.mutateAsync({
      animalId: selectedAnimalId,
      metricDate: new Date(performanceForm.metricDate),
      weightKg: performanceForm.weightKg || undefined,
      milkYieldLiters: performanceForm.milkYieldLiters || undefined,
      eggCount: performanceForm.eggCount ? parseInt(performanceForm.eggCount) : undefined,
    });
    setPerformanceForm({ metricDate: "", weightKg: "", milkYieldLiters: "", eggCount: "" });
  };

  const handleDeleteHealthRecord = async (id: number) => {
    await deleteHealthRecordMutation.mutateAsync({ id });
  };

  const handleUpdateAnimalStatus = async (animalId: number, newStatus: string) => {
    await updateAnimalMutation.mutateAsync({
      id: animalId,
      status: newStatus as "active" | "sold" | "culled" | "deceased",
    });
  };

  const getAnimalTypeName = (typeId: number) => {
    return ANIMAL_TYPES.find(t => t.id === typeId)?.name || `Type ${typeId}`;
  };

  const upcomingVaccinations = healthRecords
    .filter((r: any) => r.eventType === "vaccination" && r.details?.includes("Next due"))
    .sort((a: any, b: any) => new Date(b.recordDate).getTime() - new Date(a.recordDate).getTime())
    .slice(0, 5);

  if (!user) return null;

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Livestock Management</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Select Farm</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedFarmId?.toString() || ""} onValueChange={(val) => setSelectedFarmId(parseInt(val))}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a farm..." />
            </SelectTrigger>
            <SelectContent>
              {farms.map((farm: any) => (
                <SelectItem key={farm.id} value={farm.id.toString()}>
                  {farm.farmName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Total Animals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{animalsList.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {animalsList.filter((a: any) => a.status === "active").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Health Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{healthRecords.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Upcoming Vaccinations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingVaccinations.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={tabValue} onValueChange={setTabValue}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="animals">Animals</TabsTrigger>
          <TabsTrigger value="health">Health Records</TabsTrigger>
          <TabsTrigger value="vaccinations">Vaccinations</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="breeding">Breeding</TabsTrigger>
          <TabsTrigger value="feeding">Feeding</TabsTrigger>
        </TabsList>

        <TabsContent value="animals" className="space-y-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Animal
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Register New Animal</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Animal Type</Label>
                  <Select value={animalForm.typeId} onValueChange={(val) => setAnimalForm({ ...animalForm, typeId: val })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type..." />
                    </SelectTrigger>
                    <SelectContent>
                      {ANIMAL_TYPES.map((type) => (
                        <SelectItem key={type.id} value={type.id.toString()}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Tag ID</Label>
                  <Input
                    value={animalForm.uniqueTagId}
                    onChange={(e) => setAnimalForm({ ...animalForm, uniqueTagId: e.target.value })}
                    placeholder="e.g., TAG-001"
                  />
                </div>
                <div>
                  <Label>Birth Date</Label>
                  <Input
                    type="date"
                    value={animalForm.birthDate}
                    onChange={(e) => setAnimalForm({ ...animalForm, birthDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Gender</Label>
                  <Select value={animalForm.gender} onValueChange={(val) => setAnimalForm({ ...animalForm, gender: val })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="unknown">Unknown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Breed</Label>
                  <Input
                    value={animalForm.breed}
                    onChange={(e) => setAnimalForm({ ...animalForm, breed: e.target.value })}
                    placeholder="e.g., Holstein"
                  />
                </div>
                <Button onClick={handleCreateAnimal} disabled={createAnimalMutation.isPending}>
                  {createAnimalMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Register Animal
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <div className="space-y-2">
            {animalsList.map((animal: any) => (
              <Card
                key={animal.id}
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => {
                  setSelectedAnimalId(animal.id);
                  setTabValue("health");
                }}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        {getAnimalTypeName(animal.typeId)} {animal.uniqueTagId && `(${animal.uniqueTagId})`}
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        {animal.breed && `Breed: ${animal.breed}`}
                        {animal.birthDate && ` • Born: ${format(new Date(animal.birthDate), "MMM d, yyyy")}`}
                      </p>
                    </div>
                    <Select
                      value={animal.status}
                      onValueChange={(val) => handleUpdateAnimalStatus(animal.id, val)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="sold">Sold</SelectItem>
                        <SelectItem value="culled">Culled</SelectItem>
                        <SelectItem value="deceased">Deceased</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Gender</p>
                      <p className="font-semibold capitalize">{animal.gender}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Status</p>
                      <p className="font-semibold capitalize">{animal.status}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Created</p>
                      <p className="font-semibold">{format(new Date(animal.createdAt), "MMM d")}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {animalsList.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>No animals registered yet. Add your first animal to get started.</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="health" className="space-y-4">
          {!selectedAnimalId ? (
            <div className="text-center py-8 text-gray-500">
              <p>Select an animal to view health records</p>
            </div>
          ) : (
            <>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Health Record
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Log Health Record</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Record Date</Label>
                      <Input
                        type="date"
                        value={healthForm.recordDate}
                        onChange={(e) => setHealthForm({ ...healthForm, recordDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Event Type</Label>
                      <Select
                        value={healthForm.eventType}
                        onValueChange={(val) => setHealthForm({ ...healthForm, eventType: val as any })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="vaccination">Vaccination</SelectItem>
                          <SelectItem value="treatment">Treatment</SelectItem>
                          <SelectItem value="illness">Illness</SelectItem>
                          <SelectItem value="checkup">Checkup</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Details</Label>
                      <Input
                        value={healthForm.details}
                        onChange={(e) => setHealthForm({ ...healthForm, details: e.target.value })}
                        placeholder="Additional notes..."
                      />
                    </div>
                    <Button onClick={handleCreateHealthRecord} disabled={createHealthRecordMutation.isPending}>
                      {createHealthRecordMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Log Record
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <div className="space-y-2">
                {healthRecords.map((record: any) => (
                  <Card key={record.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-sm capitalize">{record.eventType}</CardTitle>
                          <p className="text-xs text-gray-600 mt-1">
                            {format(new Date(record.recordDate), "MMM d, yyyy")}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteHealthRecord(record.id)}
                          disabled={deleteHealthRecordMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{record.details || "No additional details"}</p>
                    </CardContent>
                  </Card>
                ))}
                {healthRecords.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>No health records yet</p>
                  </div>
                )}
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="vaccinations" className="space-y-4">
          {!selectedAnimalId ? (
            <div className="text-center py-8 text-gray-500">
              <p>Select an animal to manage vaccinations</p>
            </div>
          ) : (
            <>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Record Vaccination
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Record Vaccination</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Vaccine Type</Label>
                      <Input
                        value={vaccinationForm.vaccineType}
                        onChange={(e) => setVaccinationForm({ ...vaccinationForm, vaccineType: e.target.value })}
                        placeholder="e.g., FMD, Rabies"
                      />
                    </div>
                    <div>
                      <Label>Vaccination Date</Label>
                      <Input
                        type="date"
                        value={vaccinationForm.recordDate}
                        onChange={(e) => setVaccinationForm({ ...vaccinationForm, recordDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Next Due Date</Label>
                      <Input
                        type="date"
                        value={vaccinationForm.nextDueDate}
                        onChange={(e) => setVaccinationForm({ ...vaccinationForm, nextDueDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Notes</Label>
                      <Input
                        value={vaccinationForm.details}
                        onChange={(e) => setVaccinationForm({ ...vaccinationForm, details: e.target.value })}
                        placeholder="Veterinarian, batch number, etc."
                      />
                    </div>
                    <Button onClick={handleRecordVaccination} disabled={createHealthRecordMutation.isPending}>
                      {createHealthRecordMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Record Vaccination
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <div className="space-y-2">
                {upcomingVaccinations.length > 0 && (
                  <Card className="border-amber-200 bg-amber-50">
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-amber-600" />
                        <CardTitle className="text-sm">Upcoming Vaccinations</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {upcomingVaccinations.map((record: any) => (
                          <div key={record.id} className="text-sm">
                            <p className="font-semibold">{record.details?.split(" - ")[0]}</p>
                            <p className="text-xs text-gray-600">{record.details?.split(" - ").slice(1).join(" - ")}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="space-y-2">
                  {healthRecords
                    .filter((r: any) => r.eventType === "vaccination")
                    .map((record: any) => (
                      <Card key={record.id}>
                        <CardHeader>
                          <CardTitle className="text-sm">{record.details?.split(" - ")[0]}</CardTitle>
                          <p className="text-xs text-gray-600 mt-1">
                            {format(new Date(record.recordDate), "MMM d, yyyy")}
                          </p>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm">{record.details?.split(" - ").slice(1).join(" - ")}</p>
                        </CardContent>
                      </Card>
                    ))}
                  {healthRecords.filter((r: any) => r.eventType === "vaccination").length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <p>No vaccinations recorded yet</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="breeding" className="space-y-4">
          {!selectedFarmId ? (
            <div className="text-center py-8 text-gray-500">
              <p>Select a farm to view breeding records</p>
            </div>
          ) : (
            <BreedingRecords farmId={selectedFarmId} animalsList={animalsList} />
          )}
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          {!selectedAnimalId ? (
            <div className="text-center py-8 text-gray-500">
              <p>Select an animal to view performance metrics</p>
            </div>
          ) : (
            <>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Record Performance
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Record Performance Metrics</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Measurement Date</Label>
                      <Input
                        type="date"
                        value={performanceForm.metricDate}
                        onChange={(e) => setPerformanceForm({ ...performanceForm, metricDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Weight (kg)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={performanceForm.weightKg}
                        onChange={(e) => setPerformanceForm({ ...performanceForm, weightKg: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Milk Yield (liters)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={performanceForm.milkYieldLiters}
                        onChange={(e) => setPerformanceForm({ ...performanceForm, milkYieldLiters: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Egg Count</Label>
                      <Input
                        type="number"
                        value={performanceForm.eggCount}
                        onChange={(e) => setPerformanceForm({ ...performanceForm, eggCount: e.target.value })}
                      />
                    </div>
                    <Button onClick={handleRecordPerformance} disabled={recordPerformanceMutation.isPending}>
                      {recordPerformanceMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Record Metrics
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <div className="space-y-2">
                {performanceData.map((metric: any) => (
                  <Card key={metric.id}>
                    <CardHeader>
                      <CardTitle className="text-sm">
                        {format(new Date(metric.metricDate), "MMM d, yyyy")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        {metric.weightKg && (
                          <div>
                            <p className="text-gray-600">Weight</p>
                            <p className="font-semibold">{metric.weightKg} kg</p>
                          </div>
                        )}
                        {metric.milkYieldLiters && (
                          <div>
                            <p className="text-gray-600">Milk Yield</p>
                            <p className="font-semibold">{metric.milkYieldLiters} L</p>
                          </div>
                        )}
                        {metric.eggCount && (
                          <div>
                            <p className="text-gray-600">Eggs</p>
                            <p className="font-semibold">{metric.eggCount}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {performanceData.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>No performance metrics recorded yet</p>
                  </div>
                )}
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="feeding" className="space-y-4">
          {!selectedAnimalId ? (
            <div className="text-center py-8 text-gray-500">
              <p>Select an animal to manage feeding records</p>
            </div>
          ) : (
            <FeedingRecords animalId={selectedAnimalId} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
