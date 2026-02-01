import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, TrendingUp, PieChart as PieChartIcon } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

const FERTILIZER_TYPES = [
  "NPK (Nitrogen-Phosphorus-Potassium)",
  "Urea",
  "Ammonium Sulfate",
  "Superphosphate",
  "Potassium Chloride",
  "Compost",
  "Manure",
  "Bone Meal",
  "Fish Emulsion",
  "Seaweed Extract",
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF6B9D', '#8DD1E1', '#D084D1'];

export default function FertilizerTracking() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedCycleId, setSelectedCycleId] = useState<number | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    cycleId: "",
    applicationDate: new Date().toISOString().split("T")[0],
    fertilizerType: "",
    quantityKg: "",
    notes: "",
  });

  // Queries
  const { data: applications = [], refetch: refetchApplications } = trpc.fertilizer.list.useQuery({
    cycleId: selectedCycleId || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    limit: 100,
  });

  const { data: usageStats } = trpc.fertilizer.getUsageStats.useQuery({
    cycleId: selectedCycleId || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  const { data: cropCycles = [] } = trpc.crops.list.useQuery();

  // Mutations
  const createMutation = trpc.fertilizer.create.useMutation({
    onSuccess: () => {
      refetchApplications();
      setIsCreateDialogOpen(false);
      resetForm();
    },
  });

  const deleteMutation = trpc.fertilizer.delete.useMutation({
    onSuccess: () => {
      refetchApplications();
    },
  });

  const resetForm = () => {
    setFormData({
      cycleId: "",
      applicationDate: new Date().toISOString().split("T")[0],
      fertilizerType: "",
      quantityKg: "",
      notes: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      cycleId: parseInt(formData.cycleId),
      applicationDate: formData.applicationDate,
      fertilizerType: formData.fertilizerType,
      quantityKg: formData.quantityKg,
      notes: formData.notes || undefined,
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this fertilizer application record?")) {
      deleteMutation.mutate({ id });
    }
  };

  // Prepare chart data
  const pieChartData = usageStats?.typeBreakdown.map((item, index) => ({
    name: item.fertilizerType,
    value: Number(item.totalQuantity),
    count: item.applicationCount,
    color: COLORS[index % COLORS.length],
  })) || [];

  const barChartData = usageStats?.typeBreakdown.map((item) => ({
    type: item.fertilizerType.split(" ")[0], // Shorten names for chart
    quantity: Number(item.totalQuantity),
    applications: item.applicationCount,
  })) || [];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Fertilizer Tracking</h1>
          <p className="text-muted-foreground">
            Record and analyze fertilizer applications for your crops
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Record Application
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Record Fertilizer Application</DialogTitle>
              <DialogDescription>
                Add a new fertilizer application record
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cycleId">Crop Cycle *</Label>
                <Select
                  value={formData.cycleId}
                  onValueChange={(value) => setFormData({ ...formData, cycleId: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select crop cycle" />
                  </SelectTrigger>
                  <SelectContent>
                    {cropCycles.map((cycle: any) => (
                      <SelectItem key={cycle.id} value={cycle.id.toString()}>
                        {cycle.cropName} - {cycle.variety || "No variety"} ({new Date(cycle.plantingDate).toLocaleDateString()})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="applicationDate">Application Date *</Label>
                <Input
                  id="applicationDate"
                  type="date"
                  value={formData.applicationDate}
                  onChange={(e) => setFormData({ ...formData, applicationDate: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fertilizerType">Fertilizer Type *</Label>
                <Select
                  value={formData.fertilizerType}
                  onValueChange={(value) => setFormData({ ...formData, fertilizerType: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select fertilizer type" />
                  </SelectTrigger>
                  <SelectContent>
                    {FERTILIZER_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantityKg">Quantity (kg) *</Label>
                <Input
                  id="quantityKg"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.quantityKg}
                  onChange={(e) => setFormData({ ...formData, quantityKg: e.target.value })}
                  placeholder="Enter quantity in kilograms"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes about this application"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Recording..." : "Record Application"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Crop Cycle</Label>
              <Select
                value={selectedCycleId?.toString() || "all"}
                onValueChange={(value) => setSelectedCycleId(value === "all" ? null : parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All cycles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cycles</SelectItem>
                  {cropCycles.map((cycle: any) => (
                    <SelectItem key={cycle.id} value={cycle.id.toString()}>
                      {cycle.cropName} - {cycle.variety || "No variety"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Quantity</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usageStats?.totalQuantity.toFixed(2) || 0} kg</div>
            <p className="text-xs text-muted-foreground">
              Across all applications
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <PieChartIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usageStats?.applicationCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              Fertilizer applications recorded
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fertilizer Types</CardTitle>
            <PieChartIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usageStats?.typeBreakdown.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Different types used
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      {usageStats && usageStats.typeBreakdown.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Usage by Type (Quantity)</CardTitle>
              <CardDescription>Distribution of fertilizer quantities by type</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name.split(" ")[0]}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `${value.toFixed(2)} kg`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Applications by Type</CardTitle>
              <CardDescription>Number of applications per fertilizer type</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="applications" fill="#8884d8" name="Applications" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Application History */}
      <Card>
        <CardHeader>
          <CardTitle>Application History</CardTitle>
          <CardDescription>
            {applications.length} fertilizer application{applications.length !== 1 ? "s" : ""} recorded
          </CardDescription>
        </CardHeader>
        <CardContent>
          {applications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No fertilizer applications recorded yet. Click "Record Application" to add one.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Crop Cycle</TableHead>
                  <TableHead>Fertilizer Type</TableHead>
                  <TableHead className="text-right">Quantity (kg)</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((app) => {
                  const cycle = cropCycles.find((c: any) => c.id === app.cycleId);
                  return (
                    <TableRow key={app.id}>
                      <TableCell>{new Date(app.applicationDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {cycle ? `${cycle.cropName} - ${cycle.variety || "No variety"}` : `Cycle #${app.cycleId}`}
                      </TableCell>
                      <TableCell>{app.fertilizerType}</TableCell>
                      <TableCell className="text-right">{Number(app.quantityKg).toFixed(2)}</TableCell>
                      <TableCell className="max-w-xs truncate">{app.notes || "-"}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(app.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
