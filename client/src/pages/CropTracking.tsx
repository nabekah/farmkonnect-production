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
import { Loader2, Plus } from "lucide-react";
import { format } from "date-fns";
import { Bar, Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

export default function CropTracking() {
  const { user } = useAuth();
  const [selectedFarmId, setSelectedFarmId] = useState<number | null>(null);
  const [selectedCycleId, setSelectedCycleId] = useState<number | null>(null);
  const [tabValue, setTabValue] = useState("cycles");

  const { data: farms = [] } = trpc.farms.list.useQuery();
  const { data: cycles = [] } = trpc.crops.cycles.list.useQuery(
    { farmId: selectedFarmId! },
    { enabled: !!selectedFarmId }
  );
  const { data: soilTests = [] } = trpc.crops.soilTests.list.useQuery(
    { farmId: selectedFarmId! },
    { enabled: !!selectedFarmId }
  );
  const { data: yields = [] } = trpc.crops.yields.list.useQuery(
    { cycleId: selectedCycleId! },
    { enabled: !!selectedCycleId }
  );
  const { data: crops = [], isLoading: cropsLoading } = trpc.crops.list.useQuery();

  const createCycleMutation = trpc.crops.cycles.create.useMutation();
  const createSoilTestMutation = trpc.crops.soilTests.create.useMutation();
  const createYieldMutation = trpc.crops.yields.create.useMutation();

  const [cycleForm, setCycleForm] = useState({
    cropId: "",
    plantingDate: "",
    expectedHarvestDate: "",
    areaPlantedHectares: "",
  });
  const [soilForm, setSoilForm] = useState({
    testDate: "",
    phLevel: "",
    nitrogenLevel: "",
    phosphorusLevel: "",
    potassiumLevel: "",
  });
  const [yieldForm, setYieldForm] = useState({
    yieldQuantityKg: "",
    qualityGrade: "",
    notes: "",
  });

  const handleCreateCycle = async () => {
    if (!selectedFarmId || !cycleForm.cropId || !cycleForm.plantingDate) return;
    await createCycleMutation.mutateAsync({
      farmId: selectedFarmId,
      cropId: parseInt(cycleForm.cropId),
      plantingDate: new Date(cycleForm.plantingDate),
      expectedHarvestDate: cycleForm.expectedHarvestDate ? new Date(cycleForm.expectedHarvestDate) : undefined,
      areaPlantedHectares: cycleForm.areaPlantedHectares,
    });
    setCycleForm({ cropId: "", plantingDate: "", expectedHarvestDate: "", areaPlantedHectares: "" });
  };

  const handleCreateSoilTest = async () => {
    if (!selectedFarmId || !soilForm.testDate) return;
    await createSoilTestMutation.mutateAsync({
      farmId: selectedFarmId,
      testDate: new Date(soilForm.testDate),
      phLevel: soilForm.phLevel,
      nitrogenLevel: soilForm.nitrogenLevel,
      phosphorusLevel: soilForm.phosphorusLevel,
      potassiumLevel: soilForm.potassiumLevel,
    });
    setSoilForm({
      testDate: "",
      phLevel: "",
      nitrogenLevel: "",
      phosphorusLevel: "",
      potassiumLevel: "",
    });
  };

  const handleCreateYield = async () => {
    if (!selectedCycleId || !yieldForm.yieldQuantityKg) return;
    await createYieldMutation.mutateAsync({
      cycleId: selectedCycleId,
      yieldQuantityKg: yieldForm.yieldQuantityKg,
      qualityGrade: yieldForm.qualityGrade,
      notes: yieldForm.notes,
      recordedDate: new Date(),
    });
    setYieldForm({ yieldQuantityKg: "", qualityGrade: "", notes: "" });
  };

  const yieldChartData = {
    labels: yields.map((_: any, i: number) => `Harvest ${i + 1}`),
    datasets: [
      {
        label: "Yield (kg)",
        data: yields.map((y: any) => parseFloat(y.yieldQuantityKg || "0")),
        backgroundColor: "rgba(34, 197, 94, 0.6)",
      },
    ],
  };

  const phTrendData = {
    labels: soilTests.map((s: any) => format(new Date(s.testDate), "MMM d")),
    datasets: [
      {
        label: "pH Level",
        data: soilTests.map((s: any) => parseFloat(s.phLevel || "0")),
        borderColor: "rgba(59, 130, 246, 1)",
      },
    ],
  };

  if (!user) return null;

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Crop Tracking Dashboard</h1>

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Active Cycles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cycles.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Soil Tests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{soilTests.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Total Yield</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {yields.reduce((sum: number, y: any) => sum + parseFloat(y.yieldQuantityKg || "0"), 0).toFixed(1)} kg
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={tabValue} onValueChange={setTabValue}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="cycles">Cycles</TabsTrigger>
          <TabsTrigger value="soil">Soil</TabsTrigger>
          <TabsTrigger value="yields">Yields</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="cycles" className="space-y-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Crop Cycle
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Crop Cycle</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Crop</Label>
                  <Select value={cycleForm.cropId} onValueChange={(val) => setCycleForm({ ...cycleForm, cropId: val })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select crop..." />
                    </SelectTrigger>
                    <SelectContent>
                      {cropsLoading ? (
                        <div className="p-2 text-sm text-muted-foreground">Loading crops...</div>
                      ) : crops.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground">No crops available</div>
                      ) : (
                        crops.map((crop: any) => (
                          <SelectItem key={crop.id} value={crop.id.toString()}>
                            {crop.cropName || crop.name || "Unknown Crop"}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Planting Date</Label>
                  <Input
                    type="date"
                    value={cycleForm.plantingDate}
                    onChange={(e) => setCycleForm({ ...cycleForm, plantingDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Expected Harvest Date</Label>
                  <Input
                    type="date"
                    value={cycleForm.expectedHarvestDate}
                    onChange={(e) => setCycleForm({ ...cycleForm, expectedHarvestDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Area (hectares)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={cycleForm.areaPlantedHectares}
                    onChange={(e) => setCycleForm({ ...cycleForm, areaPlantedHectares: e.target.value })}
                  />
                </div>
                <Button onClick={handleCreateCycle} disabled={createCycleMutation.isPending}>
                  {createCycleMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <div className="space-y-2">
            {cycles.map((cycle: any) => (
              <Card key={cycle.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{cycle.varietyName || `Cycle ${cycle.id}`}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Area</p>
                      <p className="font-semibold">{cycle.areaPlantedHectares} ha</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <p className="font-semibold capitalize">{cycle.status}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="soil" className="space-y-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Log Soil Test
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Log Soil Test</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Test Date</Label>
                  <Input
                    type="date"
                    value={soilForm.testDate}
                    onChange={(e) => setSoilForm({ ...soilForm, testDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label>pH Level</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="14"
                    value={soilForm.phLevel}
                    onChange={(e) => setSoilForm({ ...soilForm, phLevel: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Nitrogen (mg/kg)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={soilForm.nitrogenLevel}
                    onChange={(e) => setSoilForm({ ...soilForm, nitrogenLevel: e.target.value })}
                  />
                </div>
                <Button onClick={handleCreateSoilTest} disabled={createSoilTestMutation.isPending}>
                  {createSoilTestMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Log Test
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <div className="space-y-2">
            {soilTests.map((test: any) => (
              <Card key={test.id}>
                <CardHeader>
                  <CardTitle className="text-sm">Test on {format(new Date(test.testDate), "MMM d, yyyy")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-600">pH</p>
                      <p className="font-semibold">{test.phLevel}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">N</p>
                      <p className="font-semibold">{test.nitrogenLevel}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">P</p>
                      <p className="font-semibold">{test.phosphorusLevel}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">K</p>
                      <p className="font-semibold">{test.potassiumLevel}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="yields" className="space-y-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button disabled={!selectedCycleId}>
                <Plus className="mr-2 h-4 w-4" />
                Record Harvest
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record Harvest</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Quantity (kg)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={yieldForm.yieldQuantityKg}
                    onChange={(e) => setYieldForm({ ...yieldForm, yieldQuantityKg: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Grade</Label>
                  <Input
                    value={yieldForm.qualityGrade}
                    onChange={(e) => setYieldForm({ ...yieldForm, qualityGrade: e.target.value })}
                    placeholder="Grade A"
                  />
                </div>
                <Button onClick={handleCreateYield} disabled={createYieldMutation.isPending}>
                  {createYieldMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Record
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <div className="space-y-2">
            {yields.map((y: any) => (
              <Card key={y.id}>
                <CardHeader>
                  <CardTitle className="text-sm">Harvest on {format(new Date(y.recordedDate), "MMM d, yyyy")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-600">Quantity</p>
                      <p className="font-semibold">{y.yieldQuantityKg} kg</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Grade</p>
                      <p className="font-semibold">{y.qualityGrade || "N/A"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Yield Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ height: "300px" }}>
                  <Bar data={yieldChartData} options={{ maintainAspectRatio: false }} />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Soil pH Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ height: "300px" }}>
                  <Line data={phTrendData} options={{ maintainAspectRatio: false }} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
