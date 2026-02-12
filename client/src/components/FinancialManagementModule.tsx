import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart as PieChartIcon,
  BarChart3,
  LineChart as LineChartIcon,
} from "lucide-react";

interface FinancialManagementModuleProps {
  farmId: string;
}

export function FinancialManagementModule({
  farmId,
}: FinancialManagementModuleProps) {
  const { user } = useAuth();
  const [period, setPeriod] = useState<"week" | "month" | "quarter" | "year">(
    "month"
  );
  const [activeTab, setActiveTab] = useState("dashboard");

  // Fetch financial data
  const { data: overview } = trpc.financialAnalysis.getFinancialOverview.useQuery(
    { farmId, period },
    { enabled: !!farmId }
  );

  const { data: kpis } = trpc.financialAnalysis.getFinancialKPIs.useQuery(
    { farmId },
    { enabled: !!farmId }
  );

  const { data: expenseBreakdown } =
    trpc.financialAnalysis.getExpenseBreakdown.useQuery(
      { farmId },
      { enabled: !!farmId }
    );

  const { data: revenueBreakdown } =
    trpc.financialAnalysis.getRevenueBreakdown.useQuery(
      { farmId },
      { enabled: !!farmId }
    );

  const { data: trend } = trpc.financialAnalysis.getIncomeVsExpenseTrend.useQuery(
    { farmId, period },
    { enabled: !!farmId }
  );

  const { data: expenses } = trpc.financialAnalysis.getExpenses.useQuery(
    { farmId },
    { enabled: !!farmId }
  );

  const { data: revenue } = trpc.financialAnalysis.getRevenue.useQuery(
    { farmId },
    { enabled: !!farmId }
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-GH", {
      style: "currency",
      currency: "GHS",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Financial Management & Cost Analysis</h1>
          <p className="text-gray-600 mt-1">
            Track expenses, revenue, and profitability for your farm
          </p>
        </div>
        <div className="flex gap-2">
          {(["week", "month", "quarter", "year"] as const).map((p) => (
            <Button
              key={p}
              variant={period === p ? "default" : "outline"}
              onClick={() => setPeriod(p)}
              className="capitalize"
            >
              {p}
            </Button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpis?.kpis.map((kpi, index) => (
          <Card key={index}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                {kpi.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-bold">
                  {typeof kpi.value === "number"
                    ? kpi.value.toLocaleString()
                    : kpi.value}
                  {kpi.unit && <span className="text-sm ml-1">{kpi.unit}</span>}
                </div>
                {kpi.trend !== undefined && (
                  <div
                    className={`flex items-center text-sm ${
                      kpi.trend > 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {kpi.trend > 0 ? (
                      <TrendingUp className="w-4 h-4 mr-1" />
                    ) : (
                      <TrendingDown className="w-4 h-4 mr-1" />
                    )}
                    {Math.abs(kpi.trend)}%
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Income vs Expense Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChartIcon className="w-5 h-5" />
                  Income vs Expense Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trend || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="income"
                      stroke="#10b981"
                      name="Income"
                    />
                    <Line
                      type="monotone"
                      dataKey="expenses"
                      stroke="#ef4444"
                      name="Expenses"
                    />
                    <Line
                      type="monotone"
                      dataKey="profit"
                      stroke="#3b82f6"
                      name="Profit"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Expense Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5" />
                  Expense Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={expenseBreakdown || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) =>
                        `${name}: ${percentage.toFixed(1)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="amount"
                    >
                      {expenseBreakdown?.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Revenue Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={revenueBreakdown || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Bar dataKey="amount" fill="#10b981" name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Expenses Tab */}
        <TabsContent value="expenses" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Expense Tracking</CardTitle>
              <CardDescription>
                View and manage all farm expenses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {expenses?.map((expense, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{expense.description}</p>
                      <p className="text-sm text-gray-600">
                        {expense.categoryName} • {expense.expenseDate}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">
                        {formatCurrency(expense.amount)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {expense.quantity} {expense.unit}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Tracking</CardTitle>
              <CardDescription>
                View and manage all farm revenue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {revenue?.map((rev, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{rev.description}</p>
                      <p className="text-sm text-gray-600">
                        {rev.revenueType} • {rev.revenueDate}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-green-600">
                        +{formatCurrency(rev.amount)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {rev.quantity} {rev.unit}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analysis Tab */}
        <TabsContent value="analysis" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profitability Analysis</CardTitle>
              <CardDescription>
                Analyze profitability by animal, crop, or category
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Cost-per-Animal</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(1550)}
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600">Cost-per-Hectare</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(200)}
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-gray-600">Profit Margin</p>
                  <p className="text-2xl font-bold">
                    {overview?.profitMargin.toFixed(1)}%
                  </p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg">
                  <p className="text-sm text-gray-600">ROI</p>
                  <p className="text-2xl font-bold">
                    {overview?.roi.toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Financial Reports</CardTitle>
              <CardDescription>
                Generate and export financial reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" className="h-20">
                  <div className="text-left">
                    <p className="font-medium">Profitability Report</p>
                    <p className="text-sm text-gray-600">
                      Detailed profitability analysis
                    </p>
                  </div>
                </Button>
                <Button variant="outline" className="h-20">
                  <div className="text-left">
                    <p className="font-medium">Tax Report</p>
                    <p className="text-sm text-gray-600">
                      Income and expense summary
                    </p>
                  </div>
                </Button>
                <Button variant="outline" className="h-20">
                  <div className="text-left">
                    <p className="font-medium">Cash Flow Report</p>
                    <p className="text-sm text-gray-600">
                      Cash inflows and outflows
                    </p>
                  </div>
                </Button>
                <Button variant="outline" className="h-20">
                  <div className="text-left">
                    <p className="font-medium">Cost Analysis Report</p>
                    <p className="text-sm text-gray-600">
                      Cost-per-animal and hectare
                    </p>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
