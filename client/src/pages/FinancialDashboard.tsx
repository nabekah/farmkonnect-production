import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { DollarSign, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";

interface FinancialDashboardProps {
  farmId: string;
}

export const FinancialDashboard: React.FC<FinancialDashboardProps> = ({ farmId }) => {
  const [dateRange, setDateRange] = useState<"month" | "quarter" | "year">("month");

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
  const { data: summary } = trpc.financialManagement.getFinancialSummary.useQuery({
    farmId,
    startDate,
    endDate
  });

  const { data: expenseBreakdown } = trpc.financialManagement.getExpenseBreakdown.useQuery({
    farmId,
    startDate,
    endDate
  });

  const { data: revenueBreakdown } = trpc.financialManagement.getRevenueBreakdown.useQuery({
    farmId,
    startDate,
    endDate
  });

  const { data: costPerAnimal } = trpc.financialManagement.calculateCostPerAnimal.useQuery({
    farmId,
    startDate,
    endDate
  });

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

  return (
    <div className="space-y-6">
      {/* Header with date range selector */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Financial Dashboard</h1>
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
