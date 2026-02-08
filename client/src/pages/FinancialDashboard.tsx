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

export const FinancialDashboard: React.FC = () => {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState<"month" | "quarter" | "year">("month");
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isAddRevenueOpen, setIsAddRevenueOpen] = useState(false);
  const [selectedFarmId, setSelectedFarmId] = useState<string>("");

  // Fetch user's farms
  const { data: farms = [] } = trpc.farms.list.useQuery();

  // Set default farm on load
  React.useEffect(() => {
    if (farms.length > 0 && !selectedFarmId) {
      setSelectedFarmId(farms[0].id.toString());
    }
  }, [farms, selectedFarmId]);

  const farmId = selectedFarmId || (farms[0]?.id.toString() ?? "");

  // Expense form state
  const [expenseForm, setExpenseForm] = useState({
    category: "feed",
    description: "",
    amount: "",
    date: new Date().toISOString().split('T')[0],
    animalId: ""
  });

  // Revenue form state
  const [revenueForm, setRevenueForm] = useState({
    source: "animal_sales",
    description: "",
    amount: "",
    date: new Date().toISOString().split('T')[0],
    animalId: ""
  });

  // Calculate date range
  const endDate = new Date();
  let startDate = new Date();
  if (dateRange === "month") {
    startDate.setMonth(endDate.getMonth() - 1);
  } else if (dateRange === "quarter") {
    startDate.setMonth(endDate.getMonth() - 3);
  } else {
    startDate.setFullYear(endDate.getFullYear() - 1);
  }

  // Fetch financial data
  const { data: summary } = trpc.financialManagement.getFinancialSummary.useQuery(
    farmId ? { farmId, startDate, endDate } : undefined,
    { enabled: !!farmId }
  );

  const { data: expenseBreakdown } = trpc.financialManagement.getExpenseBreakdown.useQuery(
    farmId ? { farmId, startDate, endDate } : undefined,
    { enabled: !!farmId }
  );

  const { data: revenueBreakdown } = trpc.financialManagement.getRevenueBreakdown.useQuery(
    farmId ? { farmId, startDate, endDate } : undefined,
    { enabled: !!farmId }
  );

  const { data: costPerAnimal } = trpc.financialManagement.calculateCostPerAnimal.useQuery(
    farmId ? { farmId, startDate, endDate } : undefined,
    { enabled: !!farmId }
  );

  // Mutations
  const createExpenseMutation = trpc.financialManagement.createExpense.useMutation({
    onSuccess: () => {
      toast.success("Expense recorded successfully!");
      setExpenseForm({
        category: "feed",
        description: "",
        amount: "",
        date: new Date().toISOString().split('T')[0],
        animalId: ""
      });
      setIsAddExpenseOpen(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to record expense");
    }
  });

  const createRevenueMutation = trpc.financialManagement.createRevenue.useMutation({
    onSuccess: () => {
      toast.success("Revenue recorded successfully!");
      setRevenueForm({
        source: "animal_sales",
        description: "",
        amount: "",
        date: new Date().toISOString().split('T')[0],
        animalId: ""
      });
      setIsAddRevenueOpen(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to record revenue");
    }
  });

  const handleAddExpense = async () => {
    if (!expenseForm.description || !expenseForm.amount) {
      toast.error("Please fill in all required fields");
      return;
    }

    await createExpenseMutation.mutateAsync({
      farmId,
      category: expenseForm.category as any,
      description: expenseForm.description,
      amount: parseFloat(expenseForm.amount),
      date: new Date(expenseForm.date),
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
      source: revenueForm.source as any,
      description: revenueForm.description,
      amount: parseFloat(revenueForm.amount),
      date: new Date(revenueForm.date),
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
    <div className="space-y-6">
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
              {farms.map((farm: any) => (
                <option key={farm.id} value={farm.id.toString()}>
                  {farm.farmName}
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant={dateRange === "month" ? "default" : "outline"}
            onClick={() => setDateRange("month")}
          >
            Month
          </Button>
          <Button
            variant={dateRange === "quarter" ? "default" : "outline"}
            onClick={() => setDateRange("quarter")}
          >
            Quarter
          </Button>
          <Button
            variant={dateRange === "year" ? "default" : "outline"}
            onClick={() => setDateRange("year")}
          >
            Year
          </Button>
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
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="feed">Feed</option>
                  <option value="medication">Medication</option>
                  <option value="labor">Labor</option>
                  <option value="equipment">Equipment</option>
                  <option value="utilities">Utilities</option>
                  <option value="transport">Transport</option>
                </select>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  placeholder="Expense description"
                />
              </div>
              <div>
                <Label htmlFor="amount">Amount (GHS)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={expenseForm.date}
                  onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
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
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Revenue
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Revenue</DialogTitle>
              <DialogDescription>Add a new farm revenue source</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="source">Source</Label>
                <select
                  id="source"
                  value={revenueForm.source}
                  onChange={(e) => setRevenueForm({ ...revenueForm, source: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="animal_sales">Animal Sales</option>
                  <option value="milk_production">Milk Production</option>
                  <option value="eggs">Eggs</option>
                  <option value="meat">Meat</option>
                  <option value="breeding">Breeding</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <Label htmlFor="rev-description">Description</Label>
                <Input
                  id="rev-description"
                  value={revenueForm.description}
                  onChange={(e) => setRevenueForm({ ...revenueForm, description: e.target.value })}
                  placeholder="Revenue description"
                />
              </div>
              <div>
                <Label htmlFor="rev-amount">Amount (GHS)</Label>
                <Input
                  id="rev-amount"
                  type="number"
                  step="0.01"
                  value={revenueForm.amount}
                  onChange={(e) => setRevenueForm({ ...revenueForm, amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="rev-date">Date</Label>
                <Input
                  id="rev-date"
                  type="date"
                  value={revenueForm.date}
                  onChange={(e) => setRevenueForm({ ...revenueForm, date: e.target.value })}
                />
              </div>
              <Button onClick={handleAddRevenue} className="w-full">
                Record Revenue
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Charts */}
      <Tabs defaultValue="breakdown" className="w-full">
        <TabsList>
          <TabsTrigger value="breakdown">Expense Breakdown</TabsTrigger>
          <TabsTrigger value="revenue">Revenue Breakdown</TabsTrigger>
          <TabsTrigger value="costanalysis">Cost Per Animal</TabsTrigger>
        </TabsList>

        <TabsContent value="breakdown">
          <Card>
            <CardHeader>
              <CardTitle>Expense Breakdown by Category</CardTitle>
              <CardDescription>Distribution of farm expenses</CardDescription>
            </CardHeader>
            <CardContent>
              {expenseChartData.length > 0 ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenseChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percentage }) => `${name}: ${percentage}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {expenseChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `GHS ${value.toLocaleString('en-US', { maximumFractionDigits: 2 })}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-80 flex items-center justify-center text-gray-500">
                  No expense data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Breakdown by Source</CardTitle>
              <CardDescription>Income distribution across sources</CardDescription>
            </CardHeader>
            <CardContent>
              {revenueChartData.length > 0 ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => `GHS ${value.toLocaleString('en-US', { maximumFractionDigits: 2 })}`} />
                      <Bar dataKey="value" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-80 flex items-center justify-center text-gray-500">
                  No revenue data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="costanalysis">
          <Card>
            <CardHeader>
              <CardTitle>Cost Per Animal Analysis</CardTitle>
              <CardDescription>Average costs for livestock</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Total Animals Tracked</p>
                    <p className="text-2xl font-bold">{costPerAnimal?.totalAnimals || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Average Cost Per Animal</p>
                    <p className="text-2xl font-bold">GHS {costPerAnimal?.averageCostPerAnimal?.toLocaleString('en-US', { maximumFractionDigits: 2 }) || '0'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
