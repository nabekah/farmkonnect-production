import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Edit2, Heart, AlertTriangle, TrendingUp, Loader2, Copy, Download, Settings } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { BatchAnimalEditingModal } from "@/components/BatchAnimalEditingModal";
import { AnimalImportWizard } from "@/components/AnimalImportWizard";
import { AnimalSearchDashboard } from "@/components/AnimalSearchDashboard";

const ANIMAL_TYPES = [
  { id: 1, name: "Cattle" },
  { id: 2, name: "Pig" },
  { id: 3, name: "Goat" },
  { id: 4, name: "Sheep" },
  { id: 5, name: "Poultry" },
  { id: 6, name: "Other" },
];

export default function LivestockManagement() {
  const [selectedFarmId, setSelectedFarmId] = useState<number | null>(null);
  const [showNewAnimal, setShowNewAnimal] = useState(false);
  const [showHealthRecord, setShowHealthRecord] = useState(false);
  const [selectedAnimalId, setSelectedAnimalId] = useState<number | null>(null);
  const [registrationMode, setRegistrationMode] = useState<"single" | "bulk">("single");
  const [bulkTagIds, setBulkTagIds] = useState("");
  const [tagIdPrefix, setTagIdPrefix] = useState("TAG");
  const [tagIdCount, setTagIdCount] = useState(1);
  const [showBatchEditing, setShowBatchEditing] = useState(false);
  const [showImportWizard, setShowImportWizard] = useState(false);
  const [showSearchDashboard, setShowSearchDashboard] = useState(false);
  const [activeTab, setActiveTab] = useState("animals");

  // Fetch farms
  const { data: farms = [] } = trpc.farms.list.useQuery();

  // Set first farm as default
  useMemo(() => {
    if (farms.length > 0 && !selectedFarmId) {
      setSelectedFarmId(farms[0].id);
    }
  }, [farms, selectedFarmId]);

  // Fetch animals
  const { data: animals = [], isLoading: animalsLoading, refetch: refetchAnimals } = trpc.livestock.animals.list.useQuery(
    selectedFarmId ? { farmId: selectedFarmId } : { farmId: 0 },
    { enabled: !!selectedFarmId }
  );

  // Fetch health records
  const { data: healthRecords = [], isLoading: healthLoading, refetch: refetchHealth } = trpc.livestock.healthRecords.list.useQuery(
    selectedAnimalId ? { animalId: selectedAnimalId } : { animalId: 0 },
    { enabled: !!selectedAnimalId }
  );

  // Mutations
  const createAnimal = trpc.livestock.animals.create.useMutation({
    onSuccess: () => {
      refetchAnimals();
      setShowNewAnimal(false);
    },
  });

  const deleteAnimal = trpc.livestock.animals.delete.useMutation({
    onSuccess: () => {
      refetchAnimals();
    },
  });

  const createHealthRecord = trpc.livestock.healthRecords.create.useMutation({
    onSuccess: () => {
      refetchHealth();
      setShowHealthRecord(false);
    },
  });

  // Bulk registration mutation
  const bulkRegisterAnimals = trpc.animalBulkRegistration.registerBulk.useMutation({
    onSuccess: () => {
      refetchAnimals();
      setShowNewAnimal(false);
      setBulkTagIds("");
    },
  });

  // Calculate stats
  const stats = {
    totalAnimals: animals.length,
    activeAnimals: animals.filter((a) => a.status === "active").length,
    soldAnimals: animals.filter((a) => a.status === "sold").length,
    totalBatches: animals.length,
  };

  const handleAddAnimal = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedFarmId) return;

    const formData = new FormData(e.currentTarget);
    const typeId = parseInt(formData.get("typeId") as string);

    await createAnimal.mutateAsync({
      farmId: selectedFarmId,
      typeId,
      uniqueTagId: (formData.get("uniqueTagId") as string) || undefined,
      birthDate: formData.get("birthDate") ? new Date(formData.get("birthDate") as string) : undefined,
      gender: (formData.get("gender") as any) || "unknown",
      breed: (formData.get("breed") as string) || undefined,
    });

    (e.target as HTMLFormElement).reset();
  };

  const handleBulkRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedFarmId) return;

    const formData = new FormData(e.currentTarget);
    const typeId = parseInt(formData.get("typeId") as string);
    const breed = (formData.get("breed") as string) || "Unknown";
    const gender = (formData.get("gender") as any) || "unknown";
    const birthDate = formData.get("birthDate") ? new Date(formData.get("birthDate") as string) : undefined;

    // Parse tag IDs
    const tagIds = bulkTagIds
      .split("\n")
      .map((id) => id.trim())
      .filter((id) => id.length > 0);

    if (tagIds.length === 0) {
      alert("Please enter at least one tag ID");
      return;
    }

    await bulkRegisterAnimals.mutateAsync({
      farmId: selectedFarmId,
      typeId,
      breed,
      gender,
      birthDate,
      tagIds,
    });

    (e.target as HTMLFormElement).reset();
  };

  const generateTagIds = () => {
    const ids = [];
    const count = parseInt(tagIdCount.toString()) || 1;
    for (let i = 1; i <= count; i++) {
      ids.push(`${tagIdPrefix}-${String(i).padStart(3, "0")}`);
    }
    setBulkTagIds(ids.join("\n"));
  };

  const downloadTemplate = () => {
    const csv = "Tag ID,Breed,Gender,Birth Date\nTAG-001,Holstein,female,2023-01-15\nTAG-002,Holstein,female,2023-02-20";
    const element = document.createElement("a");
    element.setAttribute("href", "data:text/csv;charset=utf-8," + encodeURIComponent(csv));
    element.setAttribute("download", "bulk_animal_template.csv");
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleAddHealthRecord = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedAnimalId) return;

    const formData = new FormData(e.currentTarget);

    await createHealthRecord.mutateAsync({
      animalId: selectedAnimalId,
      recordDate: new Date(formData.get("recordDate") as string),
      eventType: (formData.get("eventType") as any) || "checkup",
      details: (formData.get("details") as string) || undefined,
    });

    (e.target as HTMLFormElement).reset();
  };

  // Group animals by type
  const animalsByType = animals.reduce((acc: Record<string, any[]>, animal) => {
    const typeObj = ANIMAL_TYPES.find((t) => t.id === animal.typeId);
    const type = typeObj?.name || "Other";
    if (!acc[type]) acc[type] = [];
    acc[type].push(animal);
    return acc;
  }, {});

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <TrendingUp className="w-8 h-8" />
            Livestock Management
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">Track and manage your livestock</p>
        </div>
        <div className="flex flex-col gap-2">
          <Select value={selectedFarmId?.toString() || ""} onValueChange={(val) => setSelectedFarmId(parseInt(val))}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Select farm" />
            </SelectTrigger>
            <SelectContent>
              {farms.map((farm) => (
                <SelectItem key={farm.id} value={farm.id.toString()}>
                  {farm.farmName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Animals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAnimals}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.activeAnimals}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Sold</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.soldAnimals}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBatches}</div>
          </CardContent>
        </Card>
      </div>

      {/* Add Animal Button */}
      <Dialog open={showNewAnimal} onOpenChange={setShowNewAnimal}>
        <DialogTrigger asChild>
          <Button className="w-full md:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Add Animal
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[90vh] overflow-y-auto max-w-2xl">
          <DialogHeader>
            <DialogTitle>Register New Animal(s)</DialogTitle>
            <DialogDescription>Register a single animal or multiple animals in bulk</DialogDescription>
          </DialogHeader>

          {/* Registration Mode Toggle */}
          <div className="flex gap-4 mb-6">
            <Button
              variant={registrationMode === "single" ? "default" : "outline"}
              onClick={() => setRegistrationMode("single")}
              className="flex-1"
            >
              Single Registration
            </Button>
            <Button
              variant={registrationMode === "bulk" ? "default" : "outline"}
              onClick={() => setRegistrationMode("bulk")}
              className="flex-1"
            >
              Bulk Registration
            </Button>
          </div>

          {registrationMode === "single" ? (
            // Single Animal Registration Form
            <form onSubmit={handleAddAnimal} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="typeId">Animal Type</Label>
                <Select name="typeId" defaultValue="1">
                  <SelectTrigger id="typeId">
                    <SelectValue />
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
              <div className="space-y-2">
                <Label htmlFor="breed">Breed</Label>
                <Input id="breed" name="breed" placeholder="e.g., Holstein" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="uniqueTagId">Tag ID</Label>
                <Input id="uniqueTagId" name="uniqueTagId" placeholder="e.g., TAG-001" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select name="gender" defaultValue="unknown">
                    <SelectTrigger id="gender">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="unknown">Unknown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birthDate">Birth Date</Label>
                  <Input id="birthDate" name="birthDate" type="date" />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={createAnimal.isPending}>
                {createAnimal.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Animal"
                )}
              </Button>
            </form>
          ) : (
            // Bulk Registration Form
            <form onSubmit={handleBulkRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bulk-typeId">Animal Type</Label>
                <Select name="typeId" defaultValue="1">
                  <SelectTrigger id="bulk-typeId">
                    <SelectValue />
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

              <div className="space-y-2">
                <Label htmlFor="bulk-breed">Breed (same for all)</Label>
                <Input id="bulk-breed" name="breed" placeholder="e.g., Holstein" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="bulk-gender">Gender (same for all)</Label>
                  <Select name="gender" defaultValue="unknown">
                    <SelectTrigger id="bulk-gender">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="unknown">Unknown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bulk-birthDate">Birth Date (same for all)</Label>
                  <Input id="bulk-birthDate" name="birthDate" type="date" />
                </div>
              </div>

              {/* Tag ID Generator */}
              <Card className="bg-muted/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Auto-Generate Tag IDs</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="prefix" className="text-xs">Prefix</Label>
                      <Input
                        id="prefix"
                        value={tagIdPrefix}
                        onChange={(e) => setTagIdPrefix(e.target.value)}
                        placeholder="TAG"
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="count" className="text-xs">Count</Label>
                      <Input
                        id="count"
                        type="number"
                        value={tagIdCount}
                        onChange={(e) => setTagIdCount(parseInt(e.target.value) || 1)}
                        min="1"
                        max="1000"
                        className="text-sm"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={generateTagIds}
                        className="w-full"
                      >
                        Generate
                      </Button>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(bulkTagIds);
                      }}
                      disabled={!bulkTagIds}
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Copy
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={downloadTemplate}
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Template
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Tag IDs Input */}
              <div className="space-y-2">
                <Label htmlFor="tagIds">Tag IDs (one per line)</Label>
                <Textarea
                  id="tagIds"
                  value={bulkTagIds}
                  onChange={(e) => setBulkTagIds(e.target.value)}
                  placeholder="TAG-001&#10;TAG-002&#10;TAG-003"
                  rows={8}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  {bulkTagIds.split("\n").filter((id) => id.trim()).length} tag IDs ready
                </p>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={bulkRegisterAnimals.isPending || bulkTagIds.trim().length === 0}
              >
                {bulkRegisterAnimals.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Registering...
                  </>
                ) : (
                  `Register ${bulkTagIds.split("\n").filter((id) => id.trim()).length} Animals`
                )}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Animals Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All Animals</TabsTrigger>
          <TabsTrigger value="health">Health Records</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {animalsLoading ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">Loading animals...</p>
              </CardContent>
            </Card>
          ) : animals.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">No animals registered yet</p>
              </CardContent>
            </Card>
          ) : (
            Object.entries(animalsByType).map(([type, typeAnimals]) => (
              <Card key={type}>
                <CardHeader>
                  <CardTitle className="text-lg">{type}</CardTitle>
                  <CardDescription>{typeAnimals.length} animals</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {typeAnimals.map((animal) => (
                      <div
                        key={animal.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{animal.uniqueTagId || `Animal #${animal.id}`}</p>
                          <p className="text-sm text-muted-foreground">
                            {animal.breed} • {animal.gender} • {animal.status}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedAnimalId(animal.id)}
                          >
                            <Heart className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteAnimal.mutateAsync({ id: animal.id })}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="health" className="space-y-4">
          <Dialog open={showHealthRecord} onOpenChange={setShowHealthRecord}>
            <DialogTrigger asChild>
              <Button className="w-full md:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Add Health Record
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Health Record</DialogTitle>
                <DialogDescription>Record a health event for an animal</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddHealthRecord} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="animalId">Select Animal</Label>
                  <Select
                    value={selectedAnimalId?.toString() || ""}
                    onValueChange={(val) => setSelectedAnimalId(parseInt(val))}
                  >
                    <SelectTrigger id="animalId">
                      <SelectValue placeholder="Select animal" />
                    </SelectTrigger>
                    <SelectContent>
                      {animals.map((animal) => (
                        <SelectItem key={animal.id} value={animal.id.toString()}>
                          {animal.uniqueTagId || `Animal #${animal.id}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eventType">Event Type</Label>
                  <Select name="eventType" defaultValue="checkup">
                    <SelectTrigger id="eventType">
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
                <div className="space-y-2">
                  <Label htmlFor="recordDate">Date</Label>
                  <Input id="recordDate" name="recordDate" type="date" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="details">Details</Label>
                  <Textarea id="details" name="details" placeholder="Enter health record details" />
                </div>
                <Button type="submit" className="w-full" disabled={createHealthRecord.isPending}>
                  {createHealthRecord.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add Record"
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          {healthLoading ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">Loading health records...</p>
              </CardContent>
            </Card>
          ) : healthRecords.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">No health records yet</p>
              </CardContent>
            </Card>
          ) : (
            healthRecords.map((record) => (
              <Card key={record.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium capitalize">{record.eventType}</p>
                      <p className="text-sm text-muted-foreground">{record.details}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(record.recordDate).toLocaleDateString()}
                      </p>
                    </div>
                    {record.eventType === "illness" && <AlertTriangle className="w-5 h-5 text-red-500" />}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Animal Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Animals</p>
                  <p className="text-2xl font-bold">{stats.totalAnimals}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Animals</p>
                  <p className="text-2xl font-bold text-green-600">{stats.activeAnimals}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Sold Animals</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.soldAnimals}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Health Records</p>
                  <p className="text-2xl font-bold">{healthRecords.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
