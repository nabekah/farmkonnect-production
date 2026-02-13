import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle } from "lucide-react";

interface PredictiveAnalyticsProps {
  farmId: number;
}

export function PredictiveAnalytics({ farmId }: PredictiveAnalyticsProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [trendMonths, setTrendMonths] = useState(6);

  // Fetch forecasts
  const { data: forecast, isLoading: forecastLoading } = trpc.predictiveAnalytics.forecastEndOfYear.useQuery({
    farmId,
    currentMonth,
  });

  // Fetch spending trend
  const { data: spendingTrendData, isLoading: spendingLoading } = trpc.predictiveAnalytics.getSpendingTrend.useQuery({
    farmId,
    months: trendMonths,
  });

  // Fetch revenue trend
  const { data: revenueTrendData, isLoading: revenueLoading } = trpc.predictiveAnalytics.getRevenueTrend.useQuery({
    farmId,
    months: trendMonths,
  });

  // Fetch farm health score
  const { data: healthScore, isLoading: healthLoading } = trpc.predictiveAnalytics.getFarmHealthScore.useQuery({
    farmId,
  });

  const isLoading = forecastLoading || spendingLoading || revenueLoading || healthLoading;

  // Prepare combined trend data
  const combinedTrend = spendingTrendData?.trend.map((month, index) => ({
    month: month.month,
    revenue: revenueTrendData?.trend[index]?.total || 0,
    expenses: month.total,
  })) || [];

  // Get health score color
  const getHealthColor = (status?: string) => {
    switch (status) {
      case "excellent":
        return "text-green-600";
      case "good":
        return "text-blue-600";
      case "fair":
        return "text-yellow-600";
      case "poor":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getHealthBgColor = (status?: string) => {
    switch (status) {
      case "excellent":
        return "bg-green-50";
      case "good":
        return "bg-blue-50";
      case "fair":
        return "bg-yellow-50";
      case "poor":
        return "bg-red-50";
      default:
        return "bg-gray-50";
    }
  };

  return (
    <div className="space-y-6">
      {/* Farm Health Score */}
      {healthScore && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Farm Health Score
            </CardTitle>
            <CardDescription>Overall farm performance and sustainability</CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`p-6 rounded-lg ${getHealthBgColor(healthScore.status)}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Health Score</p>
                  <p className={`text-4xl font-bold ${getHealthColor(healthScore.status)}`}>
                    {healthScore.healthScore}
                  </p>
                  <p className={`text-sm font-medium mt-2 ${getHealthColor(healthScore.status)}`}>
                    Status: {healthScore.status.toUpperCase()}
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="text-right">
                    <p className="text-xs text-gray-600">Profitability</p>
                    <p className="text-lg font-semibold">{healthScore.profitabilityScore}%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-600">Efficiency</p>
                    <p className="text-lg font-semibold">{healthScore.efficiencyScore}%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-600">Data Quality</p>
                    <p className="text-lg font-semibold">{healthScore.dataQualityScore}%</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-600">Profit Margin</p>
                    <p className={`text-lg font-semibold ${healthScore.margin >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {healthScore.margin}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Revenue/Hectare</p>
                    <p className="text-lg font-semibold">GHS {healthScore.revenuePerHectare}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* End of Year Forecast */}
      {forecast && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              End of Year Forecast
            </CardTitle>
            <CardDescription>Projected performance based on current trends</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Current Revenue</p>
                  <p className="text-lg font-semibold text-blue-600">GHS {forecast.currentRevenue}</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Projected Revenue</p>
                  <p className="text-lg font-semibold text-green-600">GHS {forecast.projectedRevenue}</p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Current Expense</p>
                  <p className="text-lg font-semibold text-orange-600">GHS {forecast.currentExpense}</p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Projected Expense</p>
                  <p className="text-lg font-semibold text-red-600">GHS {forecast.projectedExpense}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                <div className="p-4 border rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Total Projected Revenue</p>
                  <p className="text-2xl font-bold text-green-600">GHS {forecast.totalProjectedRevenue}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Total Projected Expense</p>
                  <p className="text-2xl font-bold text-red-600">GHS {forecast.totalProjectedExpense}</p>
                </div>
                <div className={`p-4 border rounded-lg ${forecast.projectedProfit >= 0 ? "bg-green-50" : "bg-red-50"}`}>
                  <p className="text-xs text-gray-600 mb-1">Projected Profit</p>
                  <p className={`text-2xl font-bold ${forecast.projectedProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                    GHS {forecast.projectedProfit}
                  </p>
                  <p className={`text-xs mt-1 ${forecast.projectedMargin >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {forecast.projectedMargin}% margin
                  </p>
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium mb-2">Confidence Level</p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${forecast.confidence}%` }}
                  />
                </div>
                <p className="text-xs text-gray-600 mt-2">{forecast.confidence.toFixed(0)}% based on available data</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Spending and Revenue Trends */}
      {combinedTrend.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Revenue vs Expense Trend</CardTitle>
            <CardDescription>Monthly trend analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={combinedTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `GHS ${value}`} />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} name="Revenue" />
                <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} name="Expenses" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Spending by Category */}
      {spendingTrendData?.trend && spendingTrendData.trend.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
            <CardDescription>Latest month breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            {spendingTrendData.trend.length > 0 && (
              <div>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={Object.entries(spendingTrendData.trend[spendingTrendData.trend.length - 1]?.categories || {}).map(
                        ([name, value]) => ({
                          name,
                          value,
                        })
                      )}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: GHS ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {["#ef4444", "#f97316", "#eab308", "#84cc16", "#22c55e", "#06b6d4", "#0ea5e9", "#6366f1"].map(
                        (color, index) => (
                          <Cell key={`cell-${index}`} fill={color} />
                        )
                      )}
                    </Pie>
                    <Tooltip formatter={(value) => `GHS ${value}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
