/**
 * Enhanced Revenue Category Breakdown Component
 * Provides multiple visual representations of revenue by type
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
  AreaChart,
  Area,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  getRevenueTypeColor,
  getRevenueTypeName,
  RevenueType,
  getRevenueGroup,
  getGroupColor,
} from "@/lib/expenseCategoryColors";
import { TrendingUp, TrendingDown } from "lucide-react";

interface RevenueData {
  type: RevenueType;
  amount: number;
  percentage: number;
  count: number;
  trend?: number;
}

interface RevenueCategoryBreakdownProps {
  data: RevenueData[];
  totalRevenue: number;
  onTypeSelect?: (type: RevenueType) => void;
}

type ViewMode = "pie" | "bar" | "group" | "area";

export function RevenueCategoryBreakdown({
  data,
  totalRevenue,
  onTypeSelect,
}: RevenueCategoryBreakdownProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("pie");
  const [selectedType, setSelectedType] = useState<RevenueType | null>(null);

  const chartData = useMemo(() => {
    return data.map((item) => ({
      ...item,
      name: getRevenueTypeName(item.type),
      color: getRevenueTypeColor(item.type),
      group: getRevenueGroup(item.type),
    }));
  }, [data]);

  const groupedData = useMemo(() => {
    const groups: Record<string, { name: string; amount: number; color: string; types: typeof chartData }> = {};

    chartData.forEach((item) => {
      if (!groups[item.group]) {
        groups[item.group] = {
          name: item.group.charAt(0).toUpperCase() + item.group.slice(1),
          amount: 0,
          color: getGroupColor(item.group),
          types: [],
        };
      }
      groups[item.group].amount += item.amount;
      groups[item.group].types.push(item);
    });

    return Object.values(groups);
  }, [chartData]);

  const topSource = useMemo(() => {
    return chartData.length > 0 ? chartData.reduce((max, item) => item.amount > max.amount ? item : max) : null;
  }, [chartData]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-GH", {
      style: "currency",
      currency: "GHS",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const handleTypeClick = (type: RevenueType) => {
    setSelectedType(type);
    onTypeSelect?.(type);
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
          variant={viewMode === "group" ? "default" : "outline"}
          onClick={() => setViewMode("group")}
          size="sm"
        >
          Group Comparison
        </Button>
        <Button
          variant={viewMode === "area" ? "default" : "outline"}
          onClick={() => setViewMode("area")}
          size="sm"
        >
          Area Chart
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Revenue Breakdown by Type</CardTitle>
          <CardDescription>
            Total Revenue: {formatCurrency(totalRevenue)}
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
                  onClick={(entry) => handleTypeClick(entry.type)}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      opacity={
                        selectedType === null || selectedType === entry.type
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
                  fill="#10b981"
                  onClick={(data) => handleTypeClick(data.type)}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      opacity={
                        selectedType === null || selectedType === entry.type
                          ? 1
                          : 0.4
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}

          {viewMode === "group" && (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={groupedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Bar dataKey="amount" fill="#10b981">
                  {groupedData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}

          {viewMode === "area" && (
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Area
                  type="monotone"
                  dataKey="amount"
                  fill="#10b981"
                  stroke="#059669"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {topSource && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Top Revenue Source
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: topSource.color }}
                  />
                  <p className="font-medium">{topSource.name}</p>
                </div>
                <p className="text-2xl font-bold">
                  {formatCurrency(topSource.amount)}
                </p>
                <p className="text-sm text-gray-600">
                  {topSource.percentage.toFixed(1)}% of total
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Revenue Streams
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-2xl font-bold">{chartData.length}</p>
              <p className="text-sm text-gray-600">
                {groupedData.length} revenue groups
              </p>
              <p className="text-sm text-gray-600">
                Avg per stream: {formatCurrency(totalRevenue / chartData.length)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Revenue Details</CardTitle>
          <CardDescription>
            Detailed breakdown of each revenue source
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4">Revenue Type</th>
                  <th className="text-right py-2 px-4">Amount</th>
                  <th className="text-right py-2 px-4">Percentage</th>
                  <th className="text-right py-2 px-4">Count</th>
                </tr>
              </thead>
              <tbody>
                {chartData.map((item) => (
                  <tr
                    key={item.type}
                    className="border-b hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleTypeClick(item.type)}
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

      {chartData.length < 3 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-blue-900 text-sm font-medium">
              Revenue Diversification Tip
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-blue-800">
            <p>
              Your farm currently has {chartData.length} revenue stream(s). Consider
              diversifying revenue sources to reduce risk and improve financial stability.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
