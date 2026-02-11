import React, { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  PieChart,
  BarChart3,
  FileText,
  Plus,
  Download,
  Calendar,
  AlertCircle,
  CheckCircle,
  ArrowUpRight,
  ArrowDownLeft,
  Activity,
  Pill,
  Stethoscope,
  Shield,
  TrendingUpIcon,
  Bell,
  Settings,
  Loader2,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { BarChart, Bar, PieChart as PieChartComponent, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

/**
 * Financial Management & Accounting Component
 * Comprehensive farm financial management and reporting with veterinary integration
 * NOW CONNECTED TO REAL DATABASE VIA tRPC
 */
export const FinancialManagement: React.FC = () => {
  const { user } = useAuth();
  const utils = trpc.useUtils();

  const [viewMode, setViewMode] = useState<
    "dashboard" | "expenses" | "revenue" | "budget" | "forecast" | "reports" | "tax" | "veterinary" | "insurance" | "alerts" | "export"
  >("dashboard");
  const [timeRange, setTimeRange] = useState<"month" | "quarter" | "year">("month");
  const [selectedFarmId, setSelectedFarmId] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showBudgetAlerts, setShowBudgetAlerts] = useState(false);
  const [exportFormat, setExportFormat] = useState<"pdf" | "csv" | "excel">("pdf");
  const [isExporting, setIsExporting] = useState(false);

  // Expense categories - from database schema
  const expenseCategories = [
    { value: "all", label: "All Categories" },
    { value: "feed", label: "Feed" },
    { value: "medication", label: "Medication" },
    { value: "labor", label: "Labor" },
    { value: "equipment", label: "Equipment" },
    { value: "utilities", label: "Utilities" },
    { value: "transport", label: "Transport" },
    { value: "veterinary", label: "Veterinary" },
    { value: "fertilizer", label: "Fertilizer" },
    { value: "seeds", label: "Seeds" },
    { value: "pesticides", label: "Pesticides" },
    { value: "water", label: "Water" },
    { value: "rent", label: "Rent" },
    { value: "insurance", label: "Insurance" },
    { value: "maintenance", label: "Maintenance" },
    { value: "other", label: "Other" },
  ];

  // Calculate date range
  const { startDate, endDate } = useMemo(() => {
    const end = new Date();
    const start = new Date();
    if (timeRange === "month") {
      start.setMonth(end.getMonth() - 1);
    } else if (timeRange === "quarter") {
      start.setMonth(end.getMonth() - 3);
    } else {
      start.setFullYear(end.getFullYear() - 1);
    }
    return { startDate: start, endDate: end };
  }, [timeRange]);

  // ============ tRPC QUERIES ============

  // Fetch user's farms
  const { data: farms = [], isLoading: farmsLoading } = trpc.farms.list.useQuery();

  // Set default farm on load - only when farms load, not on every selectedFarmId change
  React.useEffect(() => {
    if (farms.length > 0 && !selectedFarmId) {
      setSelectedFarmId(farms[0].id.toString());
    }
  }, [farms]); // Only depend on farms, not selectedFarmId

  // Prepare farmId for queries - use selectedFarmId if set, otherwise use first farm
  const farmId = selectedFarmId || (farms.length > 0 ? farms[0].id.toString() : "");

  // Fetch financial summary
  const { data: summary, isLoading: summaryLoading } = trpc.financialManagement.getFinancialSummary.useQuery(
    farmId ? { farmId, startDate, endDate } : undefined,
    { enabled: !!farmId }
  );

  // Fetch expenses
  const { data: expenseData, isLoading: expensesLoading } = trpc.financialManagement.getExpenses.useQuery(
    farmId ? { farmId, category: selectedCategory !== "all" ? selectedCategory : undefined } : undefined,
    { enabled: !!farmId }
  );

  // Fetch revenue
  const { data: revenueData, isLoading: revenueLoading } = trpc.financialManagement.getRevenue.useQuery(
    farmId ? { farmId } : undefined,
    { enabled: !!farmId }
  );

  // Fetch budgets
  const { data: budgetData, isLoading: budgetsLoading } = trpc.financialManagement.getBudgets.useQuery(
    farmId ? { farmId } : undefined,
    { enabled: !!farmId }
  );

  // Fetch expense breakdown
  const { data: expenseBreakdown, isLoading: breakdownLoading } = trpc.financialManagement.getExpenseBreakdown.useQuery(
    farmId ? { farmId, startDate, endDate } : undefined,
    { enabled: !!farmId }
  );

  // Fetch revenue breakdown
  const { data: revenueBreakdown, isLoading: revenueBreakdownLoading } = trpc.financialManagement.getRevenueBreakdown.useQuery(
    farmId ? { farmId, startDate, endDate } : undefined,
    { enabled: !!farmId }
  );

  // ============ MUTATIONS ============

  // Export mutation
  const exportMutation = trpc.financialManagement.exportReport.useMutation({
    onSuccess: (data) => {
      toast.success(`Report exported successfully as ${exportFormat.toUpperCase()}`);
      // In a real app, trigger download here
      console.log("Export data:", data);
    },
    onError: (error) => {
      toast.error(`Export failed: ${error.message}`);
    },
  });

  // ============ EVENT HANDLERS ============

  const handleExport = async (format: "pdf" | "csv" | "excel") => {
    if (!farmId) {
      toast.error("Please select a farm first");
      return;
    }

    setIsExporting(true);
    try {
      await exportMutation.mutateAsync({
        farmId,
        format,
        startDate,
        endDate,
      });
    } finally {
      setIsExporting(false);
    }
  };

  // ============ LOADING STATES ============

  const isLoading = summaryLoading || expensesLoading || revenueLoading || budgetsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading financial data...</p>
        </div>
      </div>
    );
  }

  // ============ DATA PROCESSING ============

  // Process expense data for charts
  const expenseChartData = expenseBreakdown?.map(item => ({
    name: item.category || "Unknown",
    value: Number(item.totalAmount) || 0,
  })) || [];

  // Process revenue data for charts
  const revenueChartData = revenueBreakdown?.map(item => ({
    name: item.product || "Unknown",
    value: Number(item.totalAmount) || 0,
  })) || [];

  // Calculate budget variances
  const budgetVariances = budgetData?.map(budget => ({
    category: budget.category,
    budgeted: Number(budget.budgetedAmount) || 0,
    actual: Number(budget.actualAmount) || 0,
    variance: (Number(budget.budgetedAmount) || 0) - (Number(budget.actualAmount) || 0),
    status: (Number(budget.actualAmount) || 0) > (Number(budget.budgetedAmount) || 0) ? "exceeded" : "ok",
  })) || [];

  // Get budget alerts (exceeded budgets)
  const budgetAlerts = budgetVariances.filter(b => b.status === "exceeded" || b.variance < b.budgeted * 0.1);

  // ============ COLORS FOR CHARTS ============

  const COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Financial Management</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowBudgetAlerts(!showBudgetAlerts)}>
            <Bell className="w-4 h-4 mr-2" />
            Budget Alerts ({budgetAlerts.length})
          </Button>
          <Button variant="outline" size="sm" onClick={() => setViewMode("export")}>
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Farm & Category Selectors */}
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="text-sm font-medium mb-2 block">Select Farm</label>
          <Select value={selectedFarmId || ""} onValueChange={setSelectedFarmId}>
            <SelectTrigger>
              <SelectValue placeholder={farmsLoading ? "Loading farms..." : "Choose a farm"} />
            </SelectTrigger>
            <SelectContent>
              {farms.length === 0 && !farmsLoading && (
                <div className="p-2 text-gray-500 text-sm">No farms available</div>
              )}
              {farms.map((farm) => (
                <SelectItem key={farm.id} value={farm.id.toString()}>
                  {farm.farmName || farm.name || "Unnamed Farm"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          <label className="text-sm font-medium mb-2 block">Expense Category</label>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {expenseCategories.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          <label className="text-sm font-medium mb-2 block">Time Range</label>
          <Select value={timeRange} onValueChange={(val) => setTimeRange(val as "month" | "quarter" | "year")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Last Month</SelectItem>
              <SelectItem value="quarter">Last Quarter</SelectItem>
              <SelectItem value="year">Last Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Budget Alerts Panel */}
      {showBudgetAlerts && budgetAlerts.length > 0 && (
        <Card className="p-6 border-orange-200 bg-orange-50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              Budget Alerts
            </h2>
            <Button size="sm" variant="ghost" onClick={() => setShowBudgetAlerts(false)}>×</Button>
          </div>
          <div className="space-y-3">
            {budgetAlerts.map((alert, idx) => (
              <div key={idx} className={`p-3 rounded-lg border ${
                alert.status === "exceeded" ? "bg-red-50 border-red-200" : "bg-yellow-50 border-yellow-200"
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{alert.category}</p>
                    <p className="text-sm text-gray-600">
                      {alert.status === "exceeded" ? "Budget exceeded" : "Approaching budget limit"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">₵{alert.actual.toLocaleString()} / ₵{alert.budgeted.toLocaleString()}</p>
                    <p className={`text-xs ${
                      alert.status === "exceeded" ? "text-red-600" : "text-yellow-600"
                    }`}>
                      {Math.round((alert.actual / alert.budgeted) * 100)}% used
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Dashboard View */}
      {viewMode === "dashboard" && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Income</p>
                  <p className="text-2xl font-bold">₵{(Number(summary?.totalIncome) || 0).toLocaleString()}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Expenses</p>
                  <p className="text-2xl font-bold">₵{(Number(summary?.totalExpenses) || 0).toLocaleString()}</p>
                </div>
                <TrendingDown className="w-8 h-8 text-red-500" />
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Net Profit</p>
                  <p className="text-2xl font-bold">₵{(Number(summary?.netProfit) || 0).toLocaleString()}</p>
                </div>
                <DollarSign className="w-8 h-8 text-blue-500" />
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Profit Margin</p>
                  <p className="text-2xl font-bold">{(Number(summary?.profitMargin) || 0).toFixed(1)}%</p>
                </div>
                <BarChart3 className="w-8 h-8 text-purple-500" />
              </div>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Expense Breakdown */}
            <Card className="p-6">
              <h3 className="text-lg font-bold mb-4">Expense Breakdown</h3>
              {expenseChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChartComponent>
                    <Pie
                      data={expenseChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ₵${value.toLocaleString()}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {expenseChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `₵${value.toLocaleString()}`} />
                  </PieChartComponent>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500 text-center py-8">No expense data available</p>
              )}
            </Card>

            {/* Revenue Breakdown */}
            <Card className="p-6">
              <h3 className="text-lg font-bold mb-4">Revenue Breakdown</h3>
              {revenueChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => `₵${value.toLocaleString()}`} />
                    <Bar dataKey="value" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500 text-center py-8">No revenue data available</p>
              )}
            </Card>
          </div>

          {/* Budget Variance Analysis */}
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4">Budget vs Actual</h3>
            {budgetVariances.length > 0 ? (
              <div className="space-y-4">
                {budgetVariances.map((budget, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{budget.category}</p>
                      <p className="text-sm text-gray-600">
                        Budgeted: ₵{budget.budgeted.toLocaleString()} | Actual: ₵{budget.actual.toLocaleString()}
                      </p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      budget.status === "exceeded" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                    }`}>
                      {budget.status === "exceeded" ? "Exceeded" : "On Track"}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No budget data available</p>
            )}
          </Card>

          {/* Recent Expenses */}
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4">Recent Expenses</h3>
            {expenseData && expenseData.length > 0 ? (
              <div className="space-y-3">
                {expenseData.slice(0, 5).map((expense) => (
                  <div key={expense.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{expense.description}</p>
                      <p className="text-sm text-gray-600">{expense.expenseType} • {new Date(expense.expenseDate).toLocaleDateString()}</p>
                    </div>
                    <p className="font-bold">₵{(Number(expense.amount) || 0).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No expense data available</p>
            )}
          </Card>

          {/* Recent Revenue */}
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4">Recent Revenue</h3>
            {revenueData && revenueData.length > 0 ? (
              <div className="space-y-3">
                {revenueData.slice(0, 5).map((rev) => (
                  <div key={rev.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{rev.description}</p>
                      <p className="text-sm text-gray-600">{rev.productId} • {new Date(rev.saleDate).toLocaleDateString()}</p>
                    </div>
                    <p className="font-bold text-green-600">₵{(Number(rev.totalAmount) || 0).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No revenue data available</p>
            )}
          </Card>
        </div>
      )}

      {/* Export Report View */}
      {viewMode === "export" && (
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Export Financial Report</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Select Export Format</label>
              <div className="flex gap-3">
                <Button
                  variant={exportFormat === "pdf" ? "default" : "outline"}
                  onClick={() => setExportFormat("pdf")}
                  className="flex-1"
                  disabled={isExporting}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  PDF Report
                </Button>
                <Button
                  variant={exportFormat === "csv" ? "default" : "outline"}
                  onClick={() => setExportFormat("csv")}
                  className="flex-1"
                  disabled={isExporting}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  CSV Export
                </Button>
                <Button
                  variant={exportFormat === "excel" ? "default" : "outline"}
                  onClick={() => setExportFormat("excel")}
                  className="flex-1"
                  disabled={isExporting}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Excel Export
                </Button>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => handleExport(exportFormat)}
                className="flex-1"
                disabled={isExporting || !farmId}
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Export Report
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setViewMode("dashboard")}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
