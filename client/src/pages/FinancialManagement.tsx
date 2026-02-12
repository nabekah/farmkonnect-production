import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DollarSign, TrendingUp, TrendingDown, Plus, Download, Calendar, AlertCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { BarChart, Bar, PieChart as PieChartComponent, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

/**
 * Financial Management & Cost Analysis Component
 * Comprehensive farm financial tracking with profitability analysis
 */
export const FinancialManagement: React.FC = () => {
  const { user } = useAuth();
  const utils = trpc.useUtils();

  // ============ STATE ============
  const [viewMode, setViewMode] = useState<"dashboard" | "expenses" | "revenue" | "profitability" | "budget" | "reports">("dashboard");
  const [selectedFarmId, setSelectedFarmId] = useState<string>("");
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isAddRevenueOpen, setIsAddRevenueOpen] = useState(false);

  // Form states
  const [expenseForm, setExpenseForm] = useState({
    description: "",
    expenseType: "feed",
    amount: "",
    date: new Date().toISOString().split('T')[0],
  });

  const [revenueForm, setRevenueForm] = useState({
    description: "",
    revenueType: "animal_sales",
    amount: "",
    date: new Date().toISOString().split('T')[0],
  });

  // ============ QUERIES ============
  // Fetch user's farms
  const { data: farms = [] } = trpc.farms.list.useQuery();

  // Set default farm on load
  React.useEffect(() => {
    if (farms.length > 0 && !selectedFarmId) {
      setSelectedFarmId(farms[0].id.toString());
    }
  }, [farms, selectedFarmId]);

  // Debug: Log when farms are loaded
  React.useEffect(() => {
    if (farms.length > 0) {
      console.log("DEBUG: Farms loaded:", farms);
    }
  }, [farms]);

  // Fetch financial data for selected farm
  const isValidFarmId = selectedFarmId && selectedFarmId !== "";

  const { data: summary, isLoading: summaryLoading } = trpc.financialManagement.getFinancialSummary.useQuery(
    { farmId: selectedFarmId, startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1), endDate: new Date() },
    { enabled: isValidFarmId }
  );

  // Debug: Log summary data
  React.useEffect(() => {
    console.log("DEBUG: Summary data:", { summary, isValidFarmId, selectedFarmId, summaryLoading });
  }, [summary, isValidFarmId, selectedFarmId, summaryLoading]);

  const { data: expenses = [] } = trpc.financialManagement.getExpenses.useQuery(
    { farmId: selectedFarmId },
    { enabled: isValidFarmId }
  );

  const { data: revenue = [] } = trpc.financialManagement.getRevenue.useQuery(
    { farmId: selectedFarmId },
    { enabled: isValidFarmId }
  );

  const { data: expenseBreakdown = [] } = trpc.financialManagement.getExpenseBreakdown.useQuery(
    { farmId: selectedFarmId, startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1), endDate: new Date() },
    { enabled: isValidFarmId }
  );

  const { data: revenueBreakdown = [] } = trpc.financialManagement.getRevenueBreakdown.useQuery(
    { farmId: selectedFarmId, startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1), endDate: new Date() },
    { enabled: isValidFarmId }
  );

  // ============ MUTATIONS ============
  const createExpenseMutation = trpc.financialManagement.createExpense.useMutation({
    onSuccess: () => {
      toast.success("Expense added successfully");
      setIsAddExpenseOpen(false);
      setExpenseForm({ description: "", expenseType: "feed", amount: "", date: new Date().toISOString().split('T')[0] });
      utils.financialManagement.getExpenses.invalidate();
      utils.financialManagement.getFinancialSummary.invalidate();
      utils.financialManagement.getExpenseBreakdown.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to add expense: ${error.message}`);
    },
  });

  const createRevenueMutation = trpc.financialManagement.createRevenue.useMutation({
    onSuccess: () => {
      toast.success("Revenue added successfully");
      setIsAddRevenueOpen(false);
      setRevenueForm({ description: "", revenueType: "animal_sales", amount: "", date: new Date().toISOString().split('T')[0] });
      utils.financialManagement.getRevenue.invalidate();
      utils.financialManagement.getFinancialSummary.invalidate();
      utils.financialManagement.getRevenueBreakdown.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to add revenue: ${error.message}`);
    },
  });

  // ============ HANDLERS ============
  const handleAddExpense = async () => {
    if (!selectedFarmId || !expenseForm.description || !expenseForm.amount) {
      toast.error("Please fill in all fields");
      return;
    }
    
    createExpenseMutation.mutate({
      farmId: selectedFarmId,
      description: expenseForm.description,
      expenseType: expenseForm.expenseType,
      amount: parseFloat(expenseForm.amount),
      expenseDate: new Date(expenseForm.date),
    });
  };

  const handleAddRevenue = async () => {
    if (!selectedFarmId || !revenueForm.description || !revenueForm.amount) {
      toast.error("Please fill in all fields");
      return;
    }
    
    createRevenueMutation.mutate({
      farmId: selectedFarmId,
      description: revenueForm.description,
      revenueType: revenueForm.revenueType,
      amount: parseFloat(revenueForm.amount),
      saleDate: new Date(revenueForm.date),
    });
  };

  // ============ FORMATTING ============
  const formatCurrency = (value: number | string | null | undefined) => {
    if (value === null || value === undefined) return "₵0.00";
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return `₵${num.toFixed(2)}`;
  };

  // ============ RENDER ============
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Financial Management</h1>
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Farm Selector */}
      <div className="flex gap-4">
        <div className="flex-1 max-w-xs">
          <Label className="text-sm font-medium mb-2 block">Select Farm</Label>
          <Select value={selectedFarmId} onValueChange={setSelectedFarmId}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a farm" />
            </SelectTrigger>
            <SelectContent>
              {farms.map((farm) => (
                <SelectItem key={farm.id} value={farm.id.toString()}>
                  {farm.farmName || "Unnamed Farm"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* View Mode Tabs */}
      <div className="flex gap-2 border-b">
        {[
          { id: "dashboard", label: "Dashboard" },
          { id: "expenses", label: "Expenses" },
          { id: "revenue", label: "Revenue" },
          { id: "profitability", label: "Profitability" },
          { id: "budget", label: "Budget" },
          { id: "reports", label: "Reports" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setViewMode(tab.id as any)}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              viewMode === tab.id
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Dashboard View */}
      {viewMode === "dashboard" && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Income</p>
                  <p className="text-2xl font-bold">{formatCurrency(summary?.totalRevenue)}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Expenses</p>
                  <p className="text-2xl font-bold">{formatCurrency(summary?.totalExpenses)}</p>
                </div>
                <TrendingDown className="w-8 h-8 text-red-500" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Net Profit</p>
                  <p className="text-2xl font-bold">{formatCurrency((summary?.totalRevenue || 0) - (summary?.totalExpenses || 0))}</p>
                </div>
                <DollarSign className="w-8 h-8 text-blue-500" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Profit Margin</p>
                  <p className="text-2xl font-bold">
                    {summary?.totalRevenue ? (((summary.totalRevenue - (summary.totalExpenses || 0)) / summary.totalRevenue) * 100).toFixed(1) : "0"}%
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-500" />
              </div>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Expense Breakdown */}
            <Card className="p-6">
              <h2 className="text-lg font-bold mb-4">Expense Breakdown</h2>
              {expenseBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChartComponent>
                    <Pie data={expenseBreakdown} dataKey="total" nameKey="category" cx="50%" cy="50%" outerRadius={80} label>
                      {expenseBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6"][index % 5]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                  </PieChartComponent>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500 text-center py-8">No expense data available</p>
              )}
            </Card>

            {/* Revenue Breakdown */}
            <Card className="p-6">
              <h2 className="text-lg font-bold mb-4">Revenue Breakdown</h2>
              {revenueBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChartComponent>
                    <Pie data={revenueBreakdown} dataKey="total" nameKey="type" cx="50%" cy="50%" outerRadius={80} label>
                      {revenueBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={["#10b981", "#3b82f6", "#f59e0b", "#ef4444"][index % 4]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                  </PieChartComponent>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500 text-center py-8">No revenue data available</p>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* Expenses View */}
      {viewMode === "expenses" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Expenses</h2>
            <Dialog open={isAddExpenseOpen} onOpenChange={setIsAddExpenseOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Expense
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Expense</DialogTitle>
                  <DialogDescription>Record a new farm expense</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Description</Label>
                    <Input
                      value={expenseForm.description}
                      onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                      placeholder="e.g., Feed purchase"
                    />
                  </div>
                  <div>
                    <Label>Type</Label>
                    <Select value={expenseForm.expenseType} onValueChange={(value) => setExpenseForm({ ...expenseForm, expenseType: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["feed", "medication", "labor", "equipment", "utilities", "transport", "rent", "other"].map((type) => (
                          <SelectItem key={type} value={type}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Amount</Label>
                    <Input
                      type="number"
                      value={expenseForm.amount}
                      onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={expenseForm.date}
                      onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                    />
                  </div>
                  <Button onClick={handleAddExpense} disabled={createExpenseMutation.isPending} className="w-full">
                    {createExpenseMutation.isPending ? "Adding..." : "Add Expense"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {expenses.length > 0 ? (
            <div className="space-y-2">
              {expenses.map((expense) => (
                <Card key={expense.id} className="p-4 flex justify-between items-center">
                  <div>
                    <p className="font-medium">{expense.description}</p>
                    <p className="text-sm text-gray-600">{expense.expenseType} • {new Date(expense.expenseDate).toLocaleDateString()}</p>
                  </div>
                  <p className="font-bold text-red-600">{formatCurrency(expense.amount)}</p>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No expenses recorded</p>
          )}
        </div>
      )}

      {/* Revenue View */}
      {viewMode === "revenue" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Revenue</h2>
            <Dialog open={isAddRevenueOpen} onOpenChange={setIsAddRevenueOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Revenue
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Revenue</DialogTitle>
                  <DialogDescription>Record a new farm revenue</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Description</Label>
                    <Input
                      value={revenueForm.description}
                      onChange={(e) => setRevenueForm({ ...revenueForm, description: e.target.value })}
                      placeholder="e.g., Milk sales"
                    />
                  </div>
                  <div>
                    <Label>Type</Label>
                    <Select value={revenueForm.revenueType} onValueChange={(value) => setRevenueForm({ ...revenueForm, revenueType: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["animal_sales", "milk_production", "egg_production", "crop_sales", "other"].map((type) => (
                          <SelectItem key={type} value={type}>
                            {type.replace(/_/g, " ").charAt(0).toUpperCase() + type.replace(/_/g, " ").slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Amount</Label>
                    <Input
                      type="number"
                      value={revenueForm.amount}
                      onChange={(e) => setRevenueForm({ ...revenueForm, amount: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={revenueForm.date}
                      onChange={(e) => setRevenueForm({ ...revenueForm, date: e.target.value })}
                    />
                  </div>
                  <Button onClick={handleAddRevenue} disabled={createRevenueMutation.isPending} className="w-full">
                    {createRevenueMutation.isPending ? "Adding..." : "Add Revenue"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {revenue.length > 0 ? (
            <div className="space-y-2">
              {revenue.map((rev) => (
                <Card key={rev.id} className="p-4 flex justify-between items-center">
                  <div>
                    <p className="font-medium">{rev.description}</p>
                    <p className="text-sm text-gray-600">{rev.revenueType} • {new Date(rev.saleDate).toLocaleDateString()}</p>
                  </div>
                  <p className="font-bold text-green-600">{formatCurrency(rev.amount)}</p>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No revenue recorded</p>
          )}
        </div>
      )}

      {/* Profitability View */}
      {viewMode === "profitability" && (
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Profitability Analysis</h2>
          <p className="text-gray-600">Coming soon: Cost-per-animal, cost-per-hectare, and profitability by animal/crop</p>
        </Card>
      )}

      {/* Budget View */}
      {viewMode === "budget" && (
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Budget Planning</h2>
          <p className="text-gray-600">Coming soon: Budget templates, forecasting, and alerts</p>
        </Card>
      )}

      {/* Reports View */}
      {viewMode === "reports" && (
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Financial Reports</h2>
          <p className="text-gray-600">Coming soon: Invoice generation, tax reporting, and exports</p>
        </Card>
      )}
    </div>
  );
};
