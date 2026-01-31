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
import { DatePickerPopover } from "@/components/DatePickerPopover";

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

  const utils = trpc.useUtils();
  const createCycleMutation = trpc.crops.cycles.create.useMutation({
    onSuccess: () => {
      utils.crops.cycles.list.invalidate();
    },
  });
  const createSoilTestMutation = trpc.crops.soilTests.create.useMutation({
    onSuccess: () => {
      utils.crops.soilTests.list.invalidate();
    },
  });
  const createYieldMutation = trpc.crops.yields.create.useMutation({
    onSuccess: () => {
      utils.crops.yields.list.invalidate();
    },
  });

  const [cycleForm, setCycleForm] = useState({
    cropId: "",
    plantingDate: null as Date | null,
    expectedHarvestDate: null as Date | null,
    areaPlantedHectares: "",
    expectedYieldKg: "",
  });
  const [soilForm, setSoilForm] = useState({
    testDate: null as Date | null,
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
      plantingDate: cycleForm.plantingDate,
      expectedHarvestDate: cycleForm.expectedHarvestDate || undefined,
      areaPlantedHectares: cycleForm.areaPlantedHectares,
      expectedYieldKg: cycleForm.expectedYieldKg,
    });
    setCycleForm({ cropId: "", plantingDate: null, expectedHarvestDate: null, areaPlantedHectares: "", expectedYieldKg: "" });
  };

  const handleCreateSoilTest = async () => {
    if (!selectedFarmId || !soilForm.testDate) return;
    await createSoilTestMutation.mutateAsync({
      farmId: selectedFarmId,
      testDate: soilForm.testDate,
      phLevel: soilForm.phLevel,
      nitrogenLevel: soilForm.nitrogenLevel,
      phosphorusLevel: soilForm.phosphorusLevel,
      potassiumLevel: soilForm.potassiumLevel,
    });
    setSoilForm({
      testDate: null,
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
                            <div className="flex flex-col">
                              <span className="font-medium">{crop.cropName || crop.name || "Unknown Crop"}</span>
                              {crop.variety && (
                                <span className="text-xs text-muted-foreground">Variety: {crop.variety}</span>
                              )}
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Planting Date</Label>
                  <DatePickerPopover
                    value={cycleForm.plantingDate}
                    onChange={(date) => setCycleForm({ ...cycleForm, plantingDate: date || null })}
                    placeholder="Select planting date"
                  />
                </div>
                <div>
                  <Label>Expected Harvest Date</Label>
                  <DatePickerPopover
                    value={cycleForm.expectedHarvestDate}
                    onChange={(date) => setCycleForm({ ...cycleForm, expectedHarvestDate: date || null })}
                    placeholder="Select harvest date"
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
                <div>
                  <Label>Expected Yield (kg)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={cycleForm.expectedYieldKg}
                    onChange={(e) => setCycleForm({ ...cycleForm, expectedYieldKg: e.target.value })}
                    placeholder="Estimated harvest quantity"
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
                  <CardTitle className="text-lg">
                    {cycle.crop?.cropName || "Unknown Crop"} - {cycle.varietyName || `Cycle ${cycle.id}`}
                  </CardTitle>
                  {cycle.crop?.variety && (
                    <p className="text-sm text-muted-foreground mt-1">Variety: {cycle.crop.variety}</p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
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
                    {cycle.crop?.cultivarParameters && (
                      <div className="border-t pt-3">
                        <p className="text-sm font-medium text-gray-700 mb-1">Cultivar Parameters</p>
                        <p className="text-sm text-gray-600">{cycle.crop.cultivarParameters}</p>
                      </div>
                    )}
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
                  <DatePickerPopover
                    value={soilForm.testDate}
                    onChange={(date) => setSoilForm({ ...soilForm, testDate: date || null })}
                    placeholder="Select test date"
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
                <div>
                  <Label>Phosphorus (mg/kg)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={soilForm.phosphorusLevel}
                    onChange={(e) => setSoilForm({ ...soilForm, phosphorusLevel: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Potassium (mg/kg)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={soilForm.potassiumLevel}
                    onChange={(e) => setSoilForm({ ...soilForm, potassiumLevel: e.target.value })}
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
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Record Yield
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record Yield</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Cycle</Label>
                  <Select value={selectedCycleId?.toString() || ""} onValueChange={(val) => setSelectedCycleId(parseInt(val))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select cycle..." />
                    </SelectTrigger>
                    <SelectContent>
                      {cycles.map((cycle: any) => (
                        <SelectItem key={cycle.id} value={cycle.id.toString()}>
                          {cycle.varietyName || `Cycle ${cycle.id}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Yield (kg)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={yieldForm.yieldQuantityKg}
                    onChange={(e) => setYieldForm({ ...yieldForm, yieldQuantityKg: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Quality Grade</Label>
                  <Input
                    type="text"
                    value={yieldForm.qualityGrade}
                    onChange={(e) => setYieldForm({ ...yieldForm, qualityGrade: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Notes</Label>
                  <Input
                    type="text"
                    value={yieldForm.notes}
                    onChange={(e) => setYieldForm({ ...yieldForm, notes: e.target.value })}
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
                  <CardTitle className="text-sm">{y.yieldQuantityKg} kg - Grade {y.qualityGrade}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">{y.notes}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {/* Expected vs Actual Yield Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Total Expected Yield</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {cycles
                    .filter((c: any) => c.expectedYieldKg && c.status !== "completed")
                    .reduce((sum: number, c: any) => sum + parseFloat(c.expectedYieldKg || "0"), 0)
                    .toFixed(1)} kg
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  From {cycles.filter((c: any) => c.expectedYieldKg && c.status !== "completed").length} active cycles
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Total Actual Yield</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {yields.reduce((sum: number, y: any) => sum + parseFloat(y.yieldQuantityKg || "0"), 0).toFixed(1)} kg
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  From {yields.length} harvest records
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Yield per Hectare</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(() => {
                    const totalYield = yields.reduce((sum: number, y: any) => sum + parseFloat(y.yieldQuantityKg || "0"), 0);
                    const totalArea = cycles.reduce((sum: number, c: any) => sum + parseFloat(c.areaPlantedHectares || "0"), 0);
                    return totalArea > 0 ? (totalYield / totalArea).toFixed(1) : "0.0";
                  })()} kg/ha
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Average productivity
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {yields.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Yield Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <Bar data={yieldChartData} options={{ responsive: true }} />
                </CardContent>
              </Card>
            )}
            {soilTests.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>pH Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <Line data={phTrendData} options={{ responsive: true }} />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Expected Yield by Crop Cycle */}
          {cycles.filter((c: any) => c.expectedYieldKg && c.status !== "completed").length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Expected Yield by Active Crop Cycle</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {cycles
                    .filter((c: any) => c.expectedYieldKg && c.status !== "completed")
                    .map((cycle: any) => (
                      <div key={cycle.id} className="flex justify-between items-center p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{cycle.crop?.cropName || "Unknown Crop"}</p>
                          <p className="text-sm text-muted-foreground">
                            Planted: {format(new Date(cycle.plantingDate), "MMM d, yyyy")}
                            {cycle.expectedHarvestDate && ` • Expected: ${format(new Date(cycle.expectedHarvestDate), "MMM d, yyyy")}`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">{parseFloat(cycle.expectedYieldKg).toFixed(1)} kg</p>
                          {cycle.areaPlantedHectares && (
                            <p className="text-xs text-muted-foreground">
                              {(parseFloat(cycle.expectedYieldKg) / parseFloat(cycle.areaPlantedHectares)).toFixed(1)} kg/ha
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
