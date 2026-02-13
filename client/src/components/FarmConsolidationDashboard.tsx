import React, { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, DollarSign, AlertCircle, Award, ChevronRight } from "lucide-react";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export function FarmConsolidationDashboard() {
  const [, setLocation] = useLocation();
  const [sortBy, setSortBy] = useState<"revenue" | "profit" | "profitMargin" | "efficiency">("revenue");

  // Get consolidated data
  const { data: consolidatedFinancials } = trpc.farmConsolidation.getConsolidatedFinancials.useQuery();
  const { data: consolidatedBudget } = trpc.farmConsolidation.getConsolidatedBudgetStatus.useQuery();
  const { data: portfolioOverview } = trpc.farmConsolidation.getPortfolioOverview.useQuery();
  const { data: farmRanking } = trpc.farmConsolidation.getFarmRanking.useQuery({ sortBy });
  const { data: expenseBreakdown } = trpc.farmConsolidation.getConsolidatedExpenseBreakdown.useQuery();
  const { data: revenueBreakdown } = trpc.farmConsolidation.getConsolidatedRevenueBreakdown.useQuery();

  if (!consolidatedFinancials || !portfolioOverview) {
    return <div className="text-center py-8">Loading portfolio data...</div>;
  }

  const hasNegativeProfit = consolidatedFinancials.totalProfit < 0;

  const handleFarmClick = (farmId: number) => {
    setLocation(`/farm/${farmId}/analytics`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Farm Portfolio Dashboard</h1>
        <p className="text-gray-600 mt-2">Consolidated view of all your farms</p>
      </div>

      {/* Portfolio Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Farms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{consolidatedFinancials.farmCount}</div>
            <p className="text-xs text-gray-500 mt-1">
              {Object.entries(portfolioOverview.farmTypes)
                .map(([type, count]) => `${count} ${type}`)
                .join(", ")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Area</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{consolidatedFinancials.totalSizeHectares}</div>
            <p className="text-xs text-gray-500 mt-1">hectares</p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-900">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700">GHS {consolidatedFinancials.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-green-600 mt-1">Across all farms</p>
          </CardContent>
        </Card>

        <Card className={hasNegativeProfit ? "border-red-200 bg-red-50" : "border-blue-200 bg-blue-50"}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${hasNegativeProfit ? "text-red-700" : "text-blue-700"}`}>
              {consolidatedFinancials.totalProfit > 0 ? "+" : ""}GHS {consolidatedFinancials.totalProfit.toLocaleString()}
            </div>
            <p className={`text-xs mt-1 ${hasNegativeProfit ? "text-red-600" : "text-blue-600"}`}>
              {consolidatedFinancials.profitMargin}% margin
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue vs Expenses */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue vs Expenses</CardTitle>
            <CardDescription>Portfolio financial summary</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={[
                  {
                    name: "Portfolio",
                    revenue: consolidatedFinancials.totalRevenue,
                    expenses: consolidatedFinancials.totalExpenses,
                  },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="revenue" fill="#10b981" />
                <Bar dataKey="expenses" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Efficiency Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Efficiency Metrics</CardTitle>
            <CardDescription>Performance per hectare</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Revenue per Hectare</span>
              <span className="font-semibold">GHS {(consolidatedFinancials.totalRevenue / consolidatedFinancials.totalSizeHectares).toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Expense per Hectare</span>
              <span className="font-semibold">GHS {(consolidatedFinancials.totalExpenses / consolidatedFinancials.totalSizeHectares).toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Average Farm Size</span>
              <span className="font-semibold">{(consolidatedFinancials.totalSizeHectares / consolidatedFinancials.farmCount).toFixed(1)} ha</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Farms with Profit</span>
              <span className="font-semibold">{portfolioOverview.farmsWithProfit}/{consolidatedFinancials.farmCount}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expense and Revenue Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Breakdown */}
        {revenueBreakdown && revenueBreakdown.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Revenue Breakdown</CardTitle>
              <CardDescription>By revenue type</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={revenueBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="amount"
                  >
                    {revenueBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Expense Breakdown */}
        {expenseBreakdown && expenseBreakdown.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Expense Breakdown</CardTitle>
              <CardDescription>By expense category</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={expenseBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="amount"
                  >
                    {expenseBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Farm Performance Ranking */}
      <Card>
        <CardHeader>
          <CardTitle>Farm Performance Ranking</CardTitle>
          <CardDescription>Sorted by {sortBy}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-2 flex-wrap">
            {[
              { label: "Revenue", value: "revenue" },
              { label: "Profit", value: "profit" },
              { label: "Profit Margin", value: "profitMargin" },
              { label: "Efficiency", value: "efficiency" },
            ].map((option) => (
              <Button
                key={option.value}
                onClick={() => setSortBy(option.value as any)}
                variant={sortBy === option.value ? "default" : "outline"}
                size="sm"
              >
                {option.label}
              </Button>
            ))}
          </div>

          <div className="space-y-3">
            {farmRanking?.ranking.map((farm, idx) => (
              <div
                key={farm.farmId}
                onClick={() => handleFarmClick(farm.farmId)}
                className="w-full flex items-center gap-4 p-4 border rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all cursor-pointer"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 font-bold text-blue-700">
                  {farm.rank}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold hover:text-blue-600 transition-colors">{farm.farmName}</h3>
                  <p className="text-sm text-gray-600">{farm.farmType} • {farm.sizeHectares} ha</p>
                </div>
                <div className="text-right flex items-center gap-3">
                  {sortBy === "revenue" && (
                    <div>
                      <p className="font-bold">GHS {farm.totalRevenue.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">Revenue</p>
                    </div>
                  )}
                  {sortBy === "profit" && (
                    <div>
                      <p className={`font-bold ${farm.totalProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                        GHS {farm.totalProfit.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">Profit</p>
                    </div>
                  )}
                  {sortBy === "profitMargin" && (
                    <div>
                      <p className={`font-bold ${farm.profitMargin >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {farm.profitMargin}%
                      </p>
                      <p className="text-xs text-gray-500">Margin</p>
                    </div>
                  )}
                  {sortBy === "efficiency" && (
                    <div>
                      <p className="font-bold">GHS {farm.revenuePerHectare.toFixed(2)}</p>
                      <p className="text-xs text-gray-500">Rev/Ha</p>
                    </div>
                  )}
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* All Farms Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Farms Summary</CardTitle>
          <CardDescription>Complete financial overview</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="text-left py-2 px-4">Farm Name</th>
                  <th className="text-left py-2 px-4">Type</th>
                  <th className="text-right py-2 px-4">Size (Ha)</th>
                  <th className="text-right py-2 px-4">Revenue</th>
                  <th className="text-right py-2 px-4">Expenses</th>
                  <th className="text-right py-2 px-4">Profit</th>
                </tr>
              </thead>
              <tbody>
                {portfolioOverview.farmList.map((farm) => (
                  <tr
                    key={farm.farmId}
                    onClick={() => handleFarmClick(farm.farmId)}
                    className="hover:bg-blue-50 cursor-pointer transition-colors border-b"
                  >
                    <td className="py-3 px-4 font-medium hover:text-blue-600">{farm.farmName}</td>
                    <td className="py-3 px-4">{farm.farmType}</td>
                    <td className="py-3 px-4 text-right">{farm.sizeHectares}</td>
                    <td className="py-3 px-4 text-right">GHS {farm.totalRevenue.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right">GHS {farm.totalExpenses.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right">
                      <span className={farm.profit >= 0 ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                        GHS {farm.profit.toLocaleString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
