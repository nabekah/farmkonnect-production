/**
 * Enhanced Expense Category Breakdown Component
 * Provides multiple visual representations of expenses by category
 * with color-coded distinctions for better analysis
 */

import React, { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  LineChart,
  Line,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  getExpenseCategoryColor,
  getExpenseCategoryName,
  ExpenseCategory,
  getExpenseCategoryGroup,
  getGroupColor,
} from "@/lib/expenseCategoryColors";
import { TrendingUp, TrendingDown, AlertCircle } from "lucide-react";

interface ExpenseData {
  category: ExpenseCategory;
  amount: number;
  percentage: number;
  count: number;
  trend?: number;
}

interface ExpenseCategoryBreakdownProps {
  data: ExpenseData[];
  totalExpenses: number;
  onCategorySelect?: (category: ExpenseCategory) => void;
}

type ViewMode = "pie" | "bar" | "comparison" | "timeline";

export function ExpenseCategoryBreakdown({
  data,
  totalExpenses,
  onCategorySelect,
}: ExpenseCategoryBreakdownProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("pie");
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | null>(null);

  const chartData = useMemo(() => {
    return data.map((item) => ({
      ...item,
      name: getExpenseCategoryName(item.category),
      color: getExpenseCategoryColor(item.category),
      group: getExpenseCategoryGroup(item.category),
    }));
  }, [data]);

  const groupedData = useMemo(() => {
    const groups: Record<string, { name: string; amount: number; color: string; categories: typeof chartData }> = {};

    chartData.forEach((item) => {
      if (!groups[item.group]) {
        groups[item.group] = {
          name: item.group.charAt(0).toUpperCase() + item.group.slice(1),
          amount: 0,
          color: getGroupColor(item.group),
          categories: [],
        };
      }
      groups[item.group].amount += item.amount;
      groups[item.group].categories.push(item);
    });

    return Object.values(groups);
  }, [chartData]);

  const topCategory = useMemo(() => {
    return chartData.length > 0 ? chartData.reduce((max, item) => item.amount > max.amount ? item : max) : null;
  }, [chartData]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-GH", {
      style: "currency",
      currency: "GHS",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const handleCategoryClick = (category: ExpenseCategory) => {
    setSelectedCategory(category);
    onCategorySelect?.(category);
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <Button
          variant={viewMode === "pie" ? "default" : "outline"}
          onClick={() => setViewMode("pie")}
          size="sm"
        >
          Pie Chart
        </Button>
        <Button
          variant={viewMode === "bar" ? "default" : "outline"}
          onClick={() => setViewMode("bar")}
          size="sm"
        >
          Bar Chart
        </Button>
        <Button
          variant={viewMode === "comparison" ? "default" : "outline"}
          onClick={() => setViewMode("comparison")}
          size="sm"
        >
          Group Comparison
        </Button>
        <Button
          variant={viewMode === "timeline" ? "default" : "outline"}
          onClick={() => setViewMode("timeline")}
          size="sm"
        >
          Timeline
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Expense Breakdown by Category</CardTitle>
          <CardDescription>
            Total Expenses: {formatCurrency(totalExpenses)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {viewMode === "pie" && (
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) =>
                    `${name}: ${percentage.toFixed(1)}%`
                  }
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="amount"
                  onClick={(entry) => handleCategoryClick(entry.category)}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      opacity={
                        selectedCategory === null || selectedCategory === entry.category
                          ? 1
                          : 0.4
                      }
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => formatCurrency(value as number)}
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}

          {viewMode === "bar" && (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Bar
                  dataKey="amount"
                  fill="#3b82f6"
                  onClick={(data) => handleCategoryClick(data.category)}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      opacity={
                        selectedCategory === null || selectedCategory === entry.category
                          ? 1
                          : 0.4
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}

          {viewMode === "comparison" && (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={groupedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Bar dataKey="amount" fill="#3b82f6">
                  {groupedData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}

          {viewMode === "timeline" && (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#3b82f6"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {topCategory && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Highest Expense
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: topCategory.color }}
                  />
                  <p className="font-medium">{topCategory.name}</p>
                </div>
                <p className="text-2xl font-bold">
                  {formatCurrency(topCategory.amount)}
                </p>
                <p className="text-sm text-gray-600">
                  {topCategory.percentage.toFixed(1)}% of total
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Active Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-2xl font-bold">{chartData.length}</p>
              <p className="text-sm text-gray-600">
                {groupedData.length} category groups
              </p>
              <p className="text-sm text-gray-600">
                Avg per category: {formatCurrency(totalExpenses / chartData.length)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Category Details</CardTitle>
          <CardDescription>
            Detailed breakdown of each expense category
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4">Category</th>
                  <th className="text-right py-2 px-4">Amount</th>
                  <th className="text-right py-2 px-4">Percentage</th>
                  <th className="text-right py-2 px-4">Count</th>
                </tr>
              </thead>
              <tbody>
                {chartData.map((item) => (
                  <tr
                    key={item.category}
                    className="border-b hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleCategoryClick(item.category)}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="font-medium">{item.name}</span>
                      </div>
                    </td>
                    <td className="text-right py-3 px-4 font-semibold">
                      {formatCurrency(item.amount)}
                    </td>
                    <td className="text-right py-3 px-4">
                      {item.percentage.toFixed(1)}%
                    </td>
                    <td className="text-right py-3 px-4">{item.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {chartData.some((item) => item.percentage > 40) && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-yellow-900">
              <AlertCircle className="w-5 h-5" />
              Spending Alert
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-yellow-800">
            {chartData
              .filter((item) => item.percentage > 40)
              .map((item) => (
                <p key={item.category}>
                  {item.name} represents {item.percentage.toFixed(1)}% of total expenses.
                  Consider reviewing this category for optimization opportunities.
                </p>
              ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
