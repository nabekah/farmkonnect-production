/**
 * Period Comparison Analysis Component
 * Displays month-over-month and year-over-year financial comparisons
 * Shows trends and percentage changes
 */

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface PeriodComparisonAnalysisProps {
  farmId: string;
  dataType: "expenses" | "revenue";
}

type ComparisonMode = "month" | "year";

export function PeriodComparisonAnalysis({
  farmId,
  dataType,
}: PeriodComparisonAnalysisProps) {
  const [comparisonMode, setComparisonMode] = useState<ComparisonMode>("month");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Fetch month-over-month data
  const { data: momData } = trpc.periodComparison.getMonthOverMonthExpenses.useQuery(
    { farmId: parseInt(farmId), month: selectedMonth, year: selectedYear },
    {
      enabled: !!farmId && comparisonMode === "month" && dataType === "expenses",
    }
  );

  const { data: momRevenueData } = trpc.periodComparison.getMonthOverMonthRevenue.useQuery(
    { farmId: parseInt(farmId), month: selectedMonth, year: selectedYear },
    {
      enabled: !!farmId && comparisonMode === "month" && dataType === "revenue",
    }
  );

  // Fetch year-over-year data
  const { data: yoyData } = trpc.periodComparison.getYearOverYearExpenses.useQuery(
    { farmId: parseInt(farmId), year: selectedYear },
    {
      enabled: !!farmId && comparisonMode === "year" && dataType === "expenses",
    }
  );

  const { data: yoyRevenueData } = trpc.periodComparison.getYearOverYearRevenue.useQuery(
    { farmId: parseInt(farmId), year: selectedYear },
    {
      enabled: !!farmId && comparisonMode === "year" && dataType === "revenue",
    }
  );

  const currentData =
    comparisonMode === "month"
      ? dataType === "expenses"
        ? momData
        : momRevenueData
      : dataType === "expenses"
        ? yoyData
        : yoyRevenueData;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-GH", {
      style: "currency",
      currency: "GHS",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getTrendIcon = (trend: string) => {
    if (trend === "up") return <TrendingUp className="w-4 h-4 text-red-600" />;
    if (trend === "down") return <TrendingDown className="w-4 h-4 text-green-600" />;
    return <Minus className="w-4 h-4 text-gray-600" />;
  };

  const getTrendColor = (trend: string, dataType: string) => {
    if (dataType === "expenses") {
      return trend === "up" ? "text-red-600" : trend === "down" ? "text-green-600" : "text-gray-600";
    } else {
      return trend === "up" ? "text-green-600" : trend === "down" ? "text-red-600" : "text-gray-600";
    }
  };

  if (!currentData) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-gray-600">Loading comparison data...</p>
        </CardContent>
      </Card>
    );
  }

  const chartData = currentData.comparison.map((item) => ({
    name: item.category || item.type,
    current: comparisonMode === "month" ? item.currentMonth || item.currentYear : item.currentYear,
    previous: comparisonMode === "month" ? item.previousMonth || item.previousYear : item.previousYear,
    change: item.change,
    changePercentage: item.changePercentage,
    trend: item.trend,
  }));

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col gap-4">
        <div className="flex gap-2">
          <Button
            variant={comparisonMode === "month" ? "default" : "outline"}
            onClick={() => setComparisonMode("month")}
          >
            Month-over-Month
          </Button>
          <Button
            variant={comparisonMode === "year" ? "default" : "outline"}
            onClick={() => setComparisonMode("year")}
          >
            Year-over-Year
          </Button>
        </div>

        {comparisonMode === "month" && (
          <div className="flex gap-2">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="px-3 py-2 border rounded-md"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                <option key={month} value={month}>
                  {new Date(2024, month - 1).toLocaleString("default", { month: "long" })}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-3 py-2 border rounded-md"
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        )}

        {comparisonMode === "year" && (
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-3 py-2 border rounded-md w-48"
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              {comparisonMode === "month" ? "Current Month" : "Current Year"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(currentData.summary.totalCurrentMonth || currentData.summary.totalCurrentYear)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              {comparisonMode === "month" ? "Previous Month" : "Previous Year"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(currentData.summary.totalPreviousMonth || currentData.summary.totalPreviousYear)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Change
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-2xl font-bold">
                {formatCurrency(currentData.summary.totalChange)}
              </p>
              <p className={`text-sm font-semibold ${getTrendColor(currentData.summary.totalChangePercentage > 0 ? "up" : currentData.summary.totalChangePercentage < 0 ? "down" : "stable", dataType)}`}>
                {currentData.summary.totalChangePercentage > 0 ? "+" : ""}
                {currentData.summary.totalChangePercentage.toFixed(1)}%
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Comparison Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Comparison Chart</CardTitle>
          <CardDescription>
            {comparisonMode === "month"
              ? `${dataType === "expenses" ? "Expense" : "Revenue"} comparison for ${new Date(2024, selectedMonth - 1).toLocaleString("default", { month: "long" })}`
              : `${dataType === "expenses" ? "Expense" : "Revenue"} comparison for ${selectedYear}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value as number)} />
              <Legend />
              <Bar
                dataKey="current"
                fill="#3b82f6"
                name={comparisonMode === "month" ? "Current Month" : "Current Year"}
              />
              <Bar
                dataKey="previous"
                fill="#9ca3af"
                name={comparisonMode === "month" ? "Previous Month" : "Previous Year"}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detailed Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Comparison</CardTitle>
          <CardDescription>
            Category-wise {dataType} comparison with trends
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4">Category</th>
                  <th className="text-right py-2 px-4">
                    {comparisonMode === "month" ? "Current Month" : "Current Year"}
                  </th>
                  <th className="text-right py-2 px-4">
                    {comparisonMode === "month" ? "Previous Month" : "Previous Year"}
                  </th>
                  <th className="text-right py-2 px-4">Change</th>
                  <th className="text-right py-2 px-4">Trend</th>
                </tr>
              </thead>
              <tbody>
                {chartData.map((item, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{item.name}</td>
                    <td className="text-right py-3 px-4">
                      {formatCurrency(item.current)}
                    </td>
                    <td className="text-right py-3 px-4">
                      {formatCurrency(item.previous)}
                    </td>
                    <td className="text-right py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <span className={getTrendColor(item.trend, dataType)}>
                          {item.change > 0 ? "+" : ""}
                          {formatCurrency(item.change)}
                        </span>
                        <span className="text-xs">
                          ({item.changePercentage > 0 ? "+" : ""}
                          {item.changePercentage.toFixed(1)}%)
                        </span>
                      </div>
                    </td>
                    <td className="text-right py-3 px-4">
                      <div className="flex items-center justify-end gap-1">
                        {getTrendIcon(item.trend)}
                        <span className="text-xs capitalize">{item.trend}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Insights */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-blue-900">Insights</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800 space-y-2">
          {currentData.summary.totalChangePercentage > 10 && (
            <p>
              • {dataType === "expenses" ? "Expenses" : "Revenue"} have increased significantly
              ({currentData.summary.totalChangePercentage.toFixed(1)}%) compared to the previous period.
            </p>
          )}
          {currentData.summary.totalChangePercentage < -10 && (
            <p>
              • {dataType === "expenses" ? "Expenses" : "Revenue"} have decreased significantly
              ({Math.abs(currentData.summary.totalChangePercentage).toFixed(1)}%) compared to the previous period.
            </p>
          )}
          {Math.abs(currentData.summary.totalChangePercentage) <= 10 && (
            <p>
              • {dataType === "expenses" ? "Expenses" : "Revenue"} remain relatively stable compared to the previous period.
            </p>
          )}
          {chartData.filter((item) => item.trend === "up").length > 0 && (
            <p>
              • {chartData.filter((item) => item.trend === "up").length} categories show an upward trend.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
