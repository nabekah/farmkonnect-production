import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Download, TrendingUp, TrendingDown, DollarSign, Users, Droplet, Wrench, FileText, FileSpreadsheet } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function AnalyticsDashboard() {
  const [selectedFarmId, setSelectedFarmId] = useState<number | null>(null);
  const [dateRange, setDateRange] = useState("month");
  const [startDate, setStartDate] = useState<string>(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isExporting, setIsExporting] = useState(false);

  // Fetch farms
  const { data: farms = [] } = trpc.farms.list.useQuery();

  // Set first farm as default
  useMemo(() => {
    if (farms.length > 0 && !selectedFarmId) {
      setSelectedFarmId(farms[0].id);
    }
  }, [farms, selectedFarmId]);

  // Fetch financial data
  const { data: financialData = {} } = trpc.financial.analytics.profitLoss.useQuery(
    selectedFarmId ? { farmId: selectedFarmId, startDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000), endDate: new Date() } : { farmId: 0, startDate: new Date(), endDate: new Date() },
    { enabled: !!selectedFarmId }
  );

  // Fetch livestock stats
  const { data: livestockStats = {} } = trpc.livestock.animals.list.useQuery(
    selectedFarmId ? { farmId: selectedFarmId } : { farmId: 0 },
    { enabled: !!selectedFarmId }
  );

  // Fetch workforce stats
  const { data: workforceStats = {} } = trpc.workforce.workers.list.useQuery(
    selectedFarmId ? { farmId: selectedFarmId } : { farmId: 0 },
    { enabled: !!selectedFarmId }
  );

  // Fetch fish farming stats
  const { data: fishStats = {} } = trpc.fishFarming.ponds.list.useQuery(
    selectedFarmId ? { farmId: selectedFarmId } : { farmId: 0 },
    { enabled: !!selectedFarmId }
  );

  // Export mutations
  const exportFinancialExcel = trpc.export.exportFinancialExcel.useMutation();
  const exportLivestockExcel = trpc.export.exportLivestockExcel.useMutation();
  const exportAllDataExcel = trpc.export.exportAllDataExcel.useMutation();
  const generatePDFReport = trpc.export.generatePDFReport.useMutation();

  // Handle exports
  const handleExportFinancialExcel = async () => {
    if (!selectedFarmId) return;
    setIsExporting(true);
    try {
      const result = await exportFinancialExcel.mutateAsync({ startDate, endDate });
      const blob = new Blob([Uint8Array.from(atob(result.data), c => c.charCodeAt(0))], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportLivestockExcel = async () => {
    if (!selectedFarmId) return;
    setIsExporting(true);
    try {
      const result = await exportLivestockExcel.mutateAsync({ farmId: selectedFarmId });
      const blob = new Blob([Uint8Array.from(atob(result.data), c => c.charCodeAt(0))], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportAllData = async () => {
    if (!selectedFarmId) return;
    setIsExporting(true);
    try {
      const result = await exportAllDataExcel.mutateAsync({ farmId: selectedFarmId });
      const blob = new Blob([Uint8Array.from(atob(result.data), c => c.charCodeAt(0))], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleGeneratePDFReport = async () => {
    if (!selectedFarmId) return;
    setIsExporting(true);
    try {
      const result = await generatePDFReport.mutateAsync({ startDate, endDate, farmId: selectedFarmId });
      const blob = new Blob([result.html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const win = window.open(url, '_blank');
      if (win) {
        win.onload = () => {
          win.print();
        };
      }
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('PDF generation failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Prepare chart data
  const financialChartData = [
    { month: "Jan", revenue: 15000, expenses: 8000 },
    { month: "Feb", revenue: 18000, expenses: 9000 },
    { month: "Mar", revenue: 22000, expenses: 10000 },
    { month: "Apr", revenue: 25000, expenses: 11000 },
    { month: "May", revenue: 28000, expenses: 12000 },
    { month: "Jun", revenue: 32000, expenses: 13000 },
  ];

  const livestockHealthData = [
    { name: "Healthy", value: 85, color: "#10b981" },
    { name: "Sick", value: 8, color: "#ef4444" },
    { name: "Recovering", value: 7, color: "#f59e0b" },
  ];

  const productivityData = [
    { week: "Week 1", productivity: 78 },
    { week: "Week 2", productivity: 82 },
    { week: "Week 3", productivity: 85 },
    { week: "Week 4", productivity: 88 },
    { week: "Week 5", productivity: 86 },
  ];

  const waterQualityData = [
    { date: "Mon", pH: 7.2, temp: 28, DO: 5.5 },
    { date: "Tue", pH: 7.1, temp: 27, DO: 5.8 },
    { date: "Wed", pH: 7.3, temp: 29, DO: 5.2 },
    { date: "Thu", pH: 7.2, temp: 28, DO: 5.6 },
    { date: "Fri", pH: 7.1, temp: 27, DO: 5.9 },
  ];

  const assetUtilizationData = [
    { asset: "Tractor", utilization: 85 },
    { asset: "Pump", utilization: 72 },
    { asset: "Harvester", utilization: 65 },
    { asset: "Sprayer", utilization: 78 },
    { asset: "Planter", utilization: 58 },
  ];

  const handleExportReport = () => {
    // Generate PDF report
    const reportData = {
      farm: farms.find((f) => f.id === selectedFarmId)?.farmName,
      generatedAt: new Date().toLocaleString(),
      financial: financialData,
      livestock: livestockStats,
      workforce: workforceStats,
      fishFarming: fishStats,
    };

    // Create CSV content
    const csv = JSON.stringify(reportData, null, 2);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `farm-report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-sm md:text-base text-muted-foreground">Comprehensive farm performance metrics and insights</p>
        </div>
        <div className="flex flex-col gap-2 md:flex-row">
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

      {/* Date Range and Export Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Export Reports</CardTitle>
          <CardDescription>Select date range and export farm data in various formats</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <Button
                onClick={handleExportFinancialExcel}
                disabled={!selectedFarmId || isExporting}
                variant="outline"
                className="w-full"
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Financial Excel
              </Button>
              <Button
                onClick={handleExportLivestockExcel}
                disabled={!selectedFarmId || isExporting}
                variant="outline"
                className="w-full"
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Livestock Excel
              </Button>
              <Button
                onClick={handleExportAllData}
                disabled={!selectedFarmId || isExporting}
                variant="outline"
                className="w-full"
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Complete Data
              </Button>
              <Button
                onClick={handleGeneratePDFReport}
                disabled={!selectedFarmId || isExporting}
                variant="outline"
                className="w-full"
              >
                <FileText className="w-4 h-4 mr-2" />
                PDF Report
              </Button>
            </div>
            {isExporting && (
              <p className="text-sm text-muted-foreground text-center">Generating export...</p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(financialData as any)?.totalRevenue || "0"}</div>
            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingDown className="w-4 h-4" />
              Total Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(financialData as any)?.totalExpenses || "0"}</div>
            <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              +8% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4" />
              Active Workers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(workforceStats as any)?.activeWorkers || "0"}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Productivity: {(workforceStats as any)?.avgProductivity || "0"}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Droplet className="w-4 h-4" />
              Fish Ponds
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(fishStats as any)?.totalPonds || "0"}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active: {(fishStats as any)?.activePonds || "0"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Financial Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Financial Trends</CardTitle>
            <CardDescription>Revenue vs Expenses over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={financialChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} />
                <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Livestock Health Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Livestock Health Status</CardTitle>
            <CardDescription>Distribution of animal health conditions</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={livestockHealthData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {livestockHealthData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Workforce Productivity */}
        <Card>
          <CardHeader>
            <CardTitle>Workforce Productivity</CardTitle>
            <CardDescription>Weekly productivity trends</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={productivityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="productivity" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Water Quality Monitoring */}
        <Card>
          <CardHeader>
            <CardTitle>Water Quality Metrics</CardTitle>
            <CardDescription>Fish pond water parameters</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={waterQualityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="pH" stroke="#8b5cf6" strokeWidth={2} />
                <Line yAxisId="right" type="monotone" dataKey="temp" stroke="#f59e0b" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Asset Utilization */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Asset Utilization Rate</CardTitle>
            <CardDescription>Equipment usage efficiency</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={assetUtilizationData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="asset" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="utilization" fill="#06b6d4" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Financial Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Net Profit</span>
              <span className="font-semibold">
                ${((financialData as any)?.totalRevenue || 0) - ((financialData as any)?.totalExpenses || 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Profit Margin</span>
              <span className="font-semibold">
                {((financialData as any)?.totalRevenue || 0) > 0
                  ? (
                      (((financialData as any)?.totalRevenue || 0) - ((financialData as any)?.totalExpenses || 0)) /
                      ((financialData as any)?.totalRevenue || 1) *
                      100
                    ).toFixed(1)
                  : "0"}
                %
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Expense Ratio</span>
              <span className="font-semibold">
                {((financialData as any)?.totalRevenue || 0) > 0
                  ? (
                      (((financialData as any)?.totalExpenses || 0) / ((financialData as any)?.totalRevenue || 1)) *
                      100
                    ).toFixed(1)
                  : "0"}
                %
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Livestock Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Animals</span>
              <span className="font-semibold">{(livestockStats as any)?.totalAnimals || "0"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Healthy</span>
              <span className="font-semibold text-green-600">{(livestockStats as any)?.healthyAnimals || "0"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Health Rate</span>
              <span className="font-semibold">
                {(livestockStats as any)?.totalAnimals > 0
                  ? (((livestockStats as any)?.healthyAnimals / (livestockStats as any)?.totalAnimals) * 100).toFixed(1)
                  : "0"}
                %
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Operations Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Workforce</span>
              <span className="font-semibold">{(workforceStats as any)?.totalWorkers || "0"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fish Ponds</span>
              <span className="font-semibold">{(fishStats as any)?.totalPonds || "0"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Active Assets</span>
              <span className="font-semibold">24</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
