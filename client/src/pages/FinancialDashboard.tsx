import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { DollarSign, TrendingUp, TrendingDown, AlertCircle, Plus } from "lucide-react";
import { toast } from "sonner";
import { ExpenseRevenueHistory } from "@/components/ExpenseRevenueHistory";
import { RecurringExpenseManager } from "@/components/RecurringExpenseManager";
import { BudgetAlertsWidget } from "@/components/BudgetAlertsWidget";
import { FarmComparisonCharts } from "@/components/FarmComparisonCharts";
import { BudgetForecasting } from "@/components/BudgetForecasting";
import { FinancialReportsExport } from "@/components/FinancialReportsExport";
import { BudgetVarianceAnalysis } from "@/components/BudgetVarianceAnalysis";
import { MobileOptimizedDashboard } from "@/components/MobileOptimizedDashboard";
import { ForecastingDashboard } from "@/components/ForecastingDashboard";
import { ReceiptUploadGallery } from "@/components/ReceiptUploadGallery";
import { MobileFinancialDashboard } from "@/components/MobileFinancialDashboard";
import { FinancialReportExporter } from "@/components/FinancialReportExporter";
import { generateExpensePDF, generateRevenuePDF, downloadTextFile } from "@/lib/exportPdf";

export const FinancialDashboard: React.FC = () => {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const [dateRange, setDateRange] = useState<"month" | "quarter" | "year">("month");
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isAddRevenueOpen, setIsAddRevenueOpen] = useState(false);
  const [selectedFarmId, setSelectedFarmId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("overview");

  // Fetch user's farms
  const { data: farms = [] } = trpc.farms.list.useQuery();

  // Set default to "all" on load
  React.useEffect(() => {
    if (farms.length > 0 && !selectedFarmId) {
      setSelectedFarmId("all");
    }
  }, [farms, selectedFarmId]);

  // Get farm IDs for queries - "all" means all farms
  const farmIds = selectedFarmId === "all" ? farms.map(f => f.id.toString()) : [selectedFarmId];
  const farmId = selectedFarmId === "all" ? farms.map(f => f.id.toString()).join(",") : selectedFarmId;

  // Expense form state
  const [expenseForm, setExpenseForm] = useState({
    expenseType: "feed",
    description: "",
    amount: "",
    expenseDate: new Date().toISOString().split('T')[0],
    vendor: "",
    animalId: ""
  });

  // Revenue form state
  const [revenueForm, setRevenueForm] = useState({
    revenueType: "animal_sale",
    description: "",
    amount: "",
    revenueDate: new Date().toISOString().split('T')[0],
    buyer: "",
    animalId: ""
  });

  // Calculate date range with useMemo to prevent flickering
  const { startDate, endDate } = React.useMemo(() => {
    const end = new Date();
    const start = new Date();
    if (dateRange === "month") {
      start.setMonth(end.getMonth() - 1);
    } else if (dateRange === "quarter") {
      start.setMonth(end.getMonth() - 3);
    } else {
      start.setFullYear(end.getFullYear() - 1);
    }
    return { startDate: start, endDate: end };
  }, [dateRange]);


  // Fetch financial data
  const { data: summary } = trpc.financialManagement.getFinancialSummary.useQuery(
    farmId ? { farmId, startDate, endDate } : undefined,
    { enabled: !!farmId, staleTime: 0, gcTime: 0 }
  );

  const { data: expenseBreakdown } = trpc.financialManagement.getExpenseBreakdown.useQuery(
    farmId ? { farmId, startDate, endDate } : undefined,
    { enabled: !!farmId, staleTime: 0, gcTime: 0 }
  );

  const { data: revenueBreakdown } = trpc.financialManagement.getRevenueBreakdown.useQuery(
    farmId ? { farmId, startDate, endDate } : undefined,
    { enabled: !!farmId, staleTime: 0, gcTime: 0 }
  );

  const { data: costPerAnimal } = trpc.financialManagement.calculateCostPerAnimal.useQuery(
    farmId ? { farmId, startDate, endDate } : undefined,
    { enabled: !!farmId, staleTime: 0, gcTime: 0 }
  );

  // Mutations
  const createExpenseMutation = trpc.financialManagement.createExpense.useMutation({
    onSuccess: () => {
      toast.success("Expense recorded successfully!");
      setExpenseForm({
        expenseType: "feed",
        description: "",
        amount: "",
        expenseDate: new Date().toISOString().split('T')[0],
        vendor: "",
        animalId: ""
      });
      setIsAddExpenseOpen(false);
      // Invalidate relevant queries to refetch data
      utils.financialManagement.getExpenses.invalidate();
      utils.financialManagement.getFinancialSummary.invalidate();
      utils.financialManagement.getExpenseBreakdown.invalidate();
      utils.financialManagement.calculateCostPerAnimal.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to record expense");
    }
  });

  const createRevenueMutation = trpc.financialManagement.createRevenue.useMutation({
    onSuccess: () => {
      toast.success("Revenue recorded successfully!");
      setRevenueForm({
        revenueType: "animal_sale",
        description: "",
        amount: "",
        revenueDate: new Date().toISOString().split('T')[0],
        buyer: "",
        animalId: ""
      });
      setIsAddRevenueOpen(false);
      // Invalidate relevant queries to refetch data
      utils.financialManagement.getRevenue.invalidate();
      utils.financialManagement.getFinancialSummary.invalidate();
      utils.financialManagement.getRevenueBreakdown.invalidate();
      utils.financialManagement.calculateCostPerAnimal.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to record revenue");
    }
  });

  const handleAddExpense = async () => {
    if (!expenseForm.description || !expenseForm.description.trim()) {
      toast.error("Please enter a description");
      return;
    }
    
    if (!expenseForm.amount || parseFloat(expenseForm.amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    
    if (!expenseForm.expenseType) {
      toast.error("Please select an expense type");
      return;
    }

    if (!expenseForm.expenseDate || !expenseForm.expenseDate.trim()) {
      toast.error("Please select a date");
      return;
    }
    
    if (!farmId) {
      toast.error("No farm selected. Please select a farm first.");
      return;
    }

    const dateObj = new Date(expenseForm.expenseDate);
    if (isNaN(dateObj.getTime())) {
      toast.error("Invalid date format");
      return;
    }

    await createExpenseMutation.mutateAsync({
      farmId,
      expenseType: expenseForm.expenseType,
      description: expenseForm.description,
      amount: parseFloat(expenseForm.amount),
      expenseDate: dateObj,
      vendor: expenseForm.vendor || undefined,
      animalId: expenseForm.animalId || undefined
    });
  };

  const handleAddRevenue = async () => {
    if (!revenueForm.description || !revenueForm.amount) {
      toast.error("Please fill in all required fields");
      return;
    }

    await createRevenueMutation.mutateAsync({
      farmId,
      revenueType: revenueForm.revenueType as any,
      description: revenueForm.description,
      amount: parseFloat(revenueForm.amount),
      revenueDate: new Date(revenueForm.revenueDate),
      buyer: revenueForm.buyer || undefined,
      animalId: revenueForm.animalId || undefined
    });
  };

  // Prepare chart data
  const expenseChartData = expenseBreakdown?.breakdown
    ? Object.entries(expenseBreakdown.breakdown).map(([category, amount]) => ({
        name: category.charAt(0).toUpperCase() + category.slice(1),
        value: amount,
        percentage: expenseBreakdown.percentages[category]?.toFixed(1) || 0
      }))
    : [];

  const revenueChartData = revenueBreakdown?.breakdown
    ? Object.entries(revenueBreakdown.breakdown).map(([source, amount]) => ({
        name: source.replace(/_/g, " ").charAt(0).toUpperCase() + source.replace(/_/g, " ").slice(1),
        value: amount,
        percentage: revenueBreakdown.percentages[source]?.toFixed(1) || 0
      }))
    : [];

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">Please log in to view financial data</p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile Optimized View - Hidden on desktop */}
      <div className="md:hidden">
        <div className="flex justify-between items-center gap-2 px-4 py-4 border-b">
          <h1 className="text-2xl font-bold">Financial Dashboard</h1>
          {farms.length > 0 && (
            <select
              value={selectedFarmId}
              onChange={(e) => setSelectedFarmId(e.target.value)}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="all">All Farms</option>
              {farms.map((farm: any) => (
                <option key={farm.id} value={farm.id.toString()}>
                  {farm.farmName}
                </option>
              ))}
            </select>
          )}
        </div>
        <MobileFinancialDashboard
          summary={summary}
          expenseBreakdown={expenseChartData}
          revenueBreakdown={revenueChartData}
          costPerAnimal={costPerAnimal}
          onAddExpense={() => setIsAddExpenseOpen(true)}
          onAddRevenue={() => setIsAddRevenueOpen(true)}
        />
      </div>

      {/* Desktop View - Hidden on mobile */}
      <div className="hidden md:block space-y-6">

      {/* Header with date range selector and farm selection */}
      <div className="flex justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Financial Dashboard</h1>
          {farms.length > 0 && (
            <select
              value={selectedFarmId}
              onChange={(e) => setSelectedFarmId(e.target.value)}
              className="mt-2 border rounded px-3 py-2 text-sm"
            >
              <option value="all">📊 All Farms (Consolidated)</option>
              {farms.map((farm: any) => (
                <option key={farm.id} value={farm.id.toString()}>
                  🏠 {farm.farmName}
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant={dateRange === "month" ? "default" : "outline"}
            onClick={() => setDateRange("month")}
            size="sm"
          >
            Month
          </Button>
          <Button
            variant={dateRange === "quarter" ? "default" : "outline"}
            onClick={() => setDateRange("quarter")}
            size="sm"
          >
            Quarter
          </Button>
          <Button
            variant={dateRange === "year" ? "default" : "outline"}
            onClick={() => setDateRange("year")}
            size="sm"
          >
            Year
          </Button>
          {selectedFarmId && selectedFarmId !== "all" && (
            <FinancialReportExporter
              farmId={selectedFarmId}
              farmName={farms.find(f => f.id.toString() === selectedFarmId)?.farmName || "Farm"}
              startDate={startDate}
              endDate={endDate}
            />
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">GHS {summary?.totalRevenue?.toLocaleString('en-US', { maximumFractionDigits: 2 }) || '0'}</div>
            <p className="text-xs text-gray-500">Income from all sources</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">GHS {summary?.totalExpenses?.toLocaleString('en-US', { maximumFractionDigits: 2 }) || '0'}</div>
            <p className="text-xs text-gray-500">All farm expenses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(summary?.profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              GHS {summary?.profit?.toLocaleString('en-US', { maximumFractionDigits: 2 }) || '0'}
            </div>
            <p className="text-xs text-gray-500">Revenue minus expenses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
            <AlertCircle className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.profitMargin?.toFixed(1) || '0'}%</div>
            <p className="text-xs text-gray-500">Return on investment</p>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Dialog open={isAddExpenseOpen} onOpenChange={setIsAddExpenseOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Expense</DialogTitle>
              <DialogDescription>Add a new farm expense</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  value={expenseForm.expenseType}
                  onChange={(e) => setExpenseForm({ ...expenseForm, expenseType: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="feed">Feed</option>
                  <option value="medication">Medication</option>
                  <option value="labor">Labor</option>
                  <option value="equipment">Equipment</option>
                  <option value="utilities">Utilities</option>
                  <option value="transport">Transport</option>
                  <option value="veterinary">Veterinary</option>
                  <option value="fertilizer">Fertilizer</option>
                  <option value="seeds">Seeds</option>
                  <option value="pesticides">Pesticides</option>
                  <option value="water">Water</option>
                  <option value="rent">Rent</option>
                  <option value="insurance">Insurance</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  placeholder="e.g., Chicken feed purchase"
                />
              </div>
              <div>
                <Label htmlFor="amount">Amount (GHS)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="expenseDate">Date</Label>
                <Input
                  id="expenseDate"
                  type="date"
                  value={expenseForm.expenseDate}
                  onChange={(e) => setExpenseForm({ ...expenseForm, expenseDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="vendor">Vendor (Optional)</Label>
                <Input
                  id="vendor"
                  value={expenseForm.vendor}
                  onChange={(e) => setExpenseForm({ ...expenseForm, vendor: e.target.value })}
                  placeholder="e.g., John's Farm Supplies"
                />
              </div>
              <Button onClick={handleAddExpense} className="w-full">
                Record Expense
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isAddRevenueOpen} onOpenChange={setIsAddRevenueOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Revenue
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Revenue</DialogTitle>
              <DialogDescription>Add a new farm revenue</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="revenueType">Revenue Source</Label>
                <select
                  id="revenueType"
                  value={revenueForm.revenueType}
                  onChange={(e) => setRevenueForm({ ...revenueForm, revenueType: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="animal_sale">Animal Sale</option>
                  <option value="milk_production">Milk Production</option>
                  <option value="egg_production">Egg Production</option>
                  <option value="wool_production">Wool Production</option>
                  <option value="meat_sale">Meat Sale</option>
                  <option value="crop_sale">Crop Sale</option>
                  <option value="produce_sale">Produce Sale</option>
                  <option value="breeding_service">Breeding Service</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <Label htmlFor="rev_description">Description</Label>
                <Input
                  id="rev_description"
                  value={revenueForm.description}
                  onChange={(e) => setRevenueForm({ ...revenueForm, description: e.target.value })}
                  placeholder="e.g., Sold 5 chickens"
                />
              </div>
              <div>
                <Label htmlFor="rev_amount">Amount (GHS)</Label>
                <Input
                  id="rev_amount"
                  type="number"
                  value={revenueForm.amount}
                  onChange={(e) => setRevenueForm({ ...revenueForm, amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="revenueDate">Date</Label>
                <Input
                  id="revenueDate"
                  type="date"
                  value={revenueForm.revenueDate}
                  onChange={(e) => setRevenueForm({ ...revenueForm, revenueDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="buyer">Buyer (Optional)</Label>
                <Input
                  id="buyer"
                  value={revenueForm.buyer}
                  onChange={(e) => setRevenueForm({ ...revenueForm, buyer: e.target.value })}
                  placeholder="e.g., Local Market"
                />
              </div>
              <Button onClick={handleAddRevenue} className="w-full">
                Record Revenue
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs for different sections */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="forecasting">Forecasting</TabsTrigger>
          <TabsTrigger value="receipts">Receipts</TabsTrigger>
          <TabsTrigger value="profitability">Profitability</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Expense Breakdown</CardTitle>
            <CardDescription>Distribution by category</CardDescription>
          </CardHeader>
          <CardContent>
            {expenseChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={expenseChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {expenseChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500">No expense data available</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue Breakdown</CardTitle>
            <CardDescription>Distribution by source</CardDescription>
          </CardHeader>
          <CardContent>
            {revenueChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={revenueChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500">No revenue data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Budget Alerts Widget */}
      {farmId && <BudgetAlertsWidget farmId={farmId} />}

      {/* Recurring Expense Manager */}
      {farmId && <RecurringExpenseManager farmId={farmId} />}

      {/* Expense History */}
      {farmId && <ExpenseRevenueHistory farmId={farmId} type="expense" startDate={startDate} endDate={endDate} />}

      {/* Revenue History */}
      {farmId && <ExpenseRevenueHistory farmId={farmId} type="revenue" startDate={startDate} endDate={endDate} />}

      {/* Farm Comparison Charts */}
      {selectedFarmId === "all" && farms.length > 1 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Farm Performance Comparison</h2>
          <FarmComparisonCharts farms={farms} startDate={startDate} endDate={endDate} />
        </div>
      )}

      {/* Budget Forecasting */}
      {selectedFarmId !== "all" && selectedFarmId && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Budget Forecasting</h2>
          <BudgetForecasting
            farmId={selectedFarmId}
            budgetAmount={summary?.totalRevenue || 0}
            currentSpent={summary?.totalExpenses || 0}
            startDate={startDate}
            endDate={endDate}
          />
        </div>
      )}

      {/* Financial Reports Export */}
      {farmId && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Reports and Export</h2>
          <FinancialReportsExport
            farmId={selectedFarmId === "all" ? farms[0]?.id.toString() || "" : selectedFarmId}
            farmName={selectedFarmId === "all" ? "All Farms" : farms.find(f => f.id.toString() === selectedFarmId)?.farmName || "Farm"}
            startDate={startDate}
            endDate={endDate}
          />
        </div>
      )}

      {/* Budget Variance Analysis */}
      {selectedFarmId !== "all" && selectedFarmId && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Budget Variance Analysis</h2>
          <BudgetVarianceAnalysis
            farmId={selectedFarmId}
            startDate={startDate}
            endDate={endDate}
          />
        </div>
      )}

      {/* Cost Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Cost Analysis</CardTitle>
          <CardDescription>Cost per animal breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p><strong>Total Animals:</strong> {costPerAnimal?.totalAnimals || 0}</p>
            <p><strong>Average Cost Per Animal:</strong> GHS {costPerAnimal?.averageCostPerAnimal?.toLocaleString('en-US', { maximumFractionDigits: 2 }) || '0'}</p>
            <p><strong>Total Expenses:</strong> GHS {costPerAnimal?.totalExpenses?.toLocaleString('en-US', { maximumFractionDigits: 2 }) || '0'}</p>
          </div>
        </CardContent>
      </Card>
      </TabsContent>

        {/* Forecasting Tab */}
        <TabsContent value="forecasting" className="space-y-6">
          {selectedFarmId && selectedFarmId !== "all" ? (
            <ForecastingDashboard farmId={selectedFarmId} />
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-gray-500 text-center">Select a specific farm to view forecasting</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Receipts Tab */}
        <TabsContent value="receipts" className="space-y-6">
          {selectedFarmId && selectedFarmId !== "all" ? (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Expense Receipts</h2>
              <ReceiptUploadGallery
                expenseId={0}
                farmId={selectedFarmId}
                onReceiptUpdated={() => utils.financialManagement.getFinancialSummary.invalidate()}
              />
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-gray-500 text-center">Select a specific farm to manage receipts</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Profitability Tab */}
        <TabsContent value="profitability" className="space-y-6">
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Animal Profitability Analysis</h2>
            <p className="text-gray-600">Analyze profitability by animal type to optimize farm operations.</p>
          </div>
        </TabsContent>
      </Tabs>
      </div>
      </>
  );
};

export default FinancialDashboard;