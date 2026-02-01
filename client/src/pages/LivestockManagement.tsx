import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Edit2, Heart, AlertTriangle, TrendingUp } from "lucide-react";

export default function LivestockManagement() {
  const [piggery, setPiggery] = useState<any[]>([]);
  const [poultry, setPoultry] = useState<any[]>([]);
  const [showNewAnimal, setShowNewAnimal] = useState(false);
  const [animalType, setAnimalType] = useState("pig");
  const [healthRecords, setHealthRecords] = useState<any[]>([]);

  const handleAddAnimal = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const animal = {
      id: Date.now(),
      type: formData.get("type"),
      breed: formData.get("breed"),
      quantity: formData.get("quantity"),
      age: formData.get("age"),
      weight: formData.get("weight"),
      batchId: formData.get("batchId"),
      purchaseDate: formData.get("purchaseDate"),
      health: "healthy",
      createdAt: new Date(),
    };

    if (animal.type === "pig") {
      setPiggery([...piggery, animal]);
    } else {
      setPoultry([...poultry, animal]);
    }

    // Toast notification would go here
    setShowNewAnimal(false);
    (e.target as HTMLFormElement).reset();
  };

  const handleRecordHealth = (animalId: number, animalType: string) => {
    const record = {
      id: Date.now(),
      animalId,
      animalType,
      date: new Date().toISOString().split("T")[0],
      condition: "healthy",
      notes: "",
      treatment: null,
    };
    setHealthRecords([...healthRecords, record]);
    // Toast notification would go here
  };

  const deleteAnimal = (id: number, type: string) => {
    if (type === "pig") {
      setPiggery(piggery.filter(a => a.id !== id));
    } else {
      setPoultry(poultry.filter(a => a.id !== id));
    }
    // Toast notification would go here
  };

  const stats = {
    totalPigs: piggery.reduce((sum, p) => sum + parseInt(p.quantity || 0), 0),
    totalPoultry: poultry.reduce((sum, p) => sum + parseInt(p.quantity || 0), 0),
    healthyAnimals: piggery.filter(p => p.health === "healthy").length + poultry.filter(p => p.health === "healthy").length,
    totalBatches: piggery.length + poultry.length,
  };

  const AnimalCard = ({ animal, type }: any) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg capitalize">{animal.breed}</CardTitle>
            <CardDescription>Batch ID: {animal.batchId}</CardDescription>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            animal.health === "healthy" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}>
            {animal.health}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-muted-foreground">Quantity</p>
            <p className="font-semibold">{animal.quantity}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Age</p>
            <p className="font-semibold">{animal.age} months</p>
          </div>
          <div>
            <p className="text-muted-foreground">Avg Weight</p>
            <p className="font-semibold">{animal.weight} kg</p>
          </div>
          <div>
            <p className="text-muted-foreground">Purchase Date</p>
            <p className="font-semibold text-xs">{animal.purchaseDate}</p>
          </div>
        </div>
        <div className="flex gap-2 pt-3">
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={() => handleRecordHealth(animal.id, type)}
          >
            <Heart className="w-4 h-4 mr-1" />
            Health
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
          >
            <TrendingUp className="w-4 h-4 mr-1" />
            Feed
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => deleteAnimal(animal.id, type)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Livestock Management</h1>
          <p className="text-sm md:text-base text-muted-foreground">Track piggery and poultry operations</p>
        </div>
        <Dialog open={showNewAnimal} onOpenChange={setShowNewAnimal}>
          <DialogTrigger asChild>
            <Button className="w-full md:w-auto"><Plus className="w-4 h-4 mr-2" />Add Batch</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Livestock Batch</DialogTitle>
              <DialogDescription>Record a new batch of animals</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddAnimal} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="type">Animal Type</Label>
                <Select name="type" defaultValue="pig" onValueChange={setAnimalType}>
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pig">Piggery</SelectItem>
                    <SelectItem value="poultry">Poultry</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="breed">Breed</Label>
                <Input
                  id="breed"
                  name="breed"
                  placeholder={animalType === "pig" ? "e.g., Landrace, Duroc" : "e.g., Broiler, Layer"}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="batchId">Batch ID</Label>
                <Input id="batchId" name="batchId" placeholder="e.g., BATCH-2024-001" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input id="quantity" name="quantity" type="number" placeholder="Number of animals" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="age">Age (months)</Label>
                <Input id="age" name="age" type="number" placeholder="Age in months" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">Average Weight (kg)</Label>
                <Input id="weight" name="weight" type="number" placeholder="Average weight" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="purchaseDate">Purchase Date</Label>
                <Input id="purchaseDate" name="purchaseDate" type="date" />
              </div>
              <Button type="submit" className="w-full">Add Batch</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Pigs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPigs}</div>
            <p className="text-xs text-muted-foreground">{piggery.length} batches</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Poultry</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPoultry}</div>
            <p className="text-xs text-muted-foreground">{poultry.length} batches</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Healthy Animals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.healthyAnimals}</div>
            <p className="text-xs text-muted-foreground">All batches</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Batches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBatches}</div>
            <p className="text-xs text-muted-foreground">Active</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Piggery and Poultry */}
      <Tabs defaultValue="piggery" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="piggery">Piggery ({piggery.length})</TabsTrigger>
          <TabsTrigger value="poultry">Poultry ({poultry.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="piggery" className="space-y-4">
          {piggery.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {piggery.map((pig) => (
                <AnimalCard key={pig.id} animal={pig} type="pig" />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No piggery batches recorded yet</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="poultry" className="space-y-4">
          {poultry.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {poultry.map((bird) => (
                <AnimalCard key={bird.id} animal={bird} type="poultry" />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No poultry batches recorded yet</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Health Records */}
      {healthRecords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Health Records</CardTitle>
            <CardDescription>Latest health checks and treatments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {healthRecords.slice(-5).map((record) => (
                <div key={record.id} className="border rounded-lg p-4 flex items-start justify-between">
                  <div>
                    <p className="font-semibold capitalize">{record.animalType} Health Check</p>
                    <p className="text-sm text-muted-foreground">{record.date}</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Recorded
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
