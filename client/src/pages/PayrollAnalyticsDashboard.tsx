import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, Users, DollarSign, AlertCircle, TrendingDown } from "lucide-react";

export default function PayrollAnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState("12months");
  const [selectedYear, setSelectedYear] = useState("2026");

  // Mock analytics data
  const analytics = {
    totalPayroll: 125000,
    averageSalary: 2778,
    totalWorkers: 45,
    payrollTrend: 5.2, // percentage increase
    taxWithheld: 18750,
    ssnitContribution: 8125,
  };

  const monthlyData = [
    { month: "Jan", payroll: 110000, tax: 16500, ssnit: 7150 },
    { month: "Feb", payroll: 115000, tax: 17250, ssnit: 7475 },
    { month: "Mar", payroll: 120000, tax: 18000, ssnit: 7800 },
    { month: "Apr", payroll: 118000, tax: 17700, ssnit: 7670 },
    { month: "May", payroll: 125000, tax: 18750, ssnit: 8125 },
    { month: "Jun", payroll: 128000, tax: 19200, ssnit: 8320 },
  ];

  const forecastData = [
    { month: "Jul", forecast: 130000, confidence: 92 },
    { month: "Aug", forecast: 132000, confidence: 89 },
    { month: "Sep", forecast: 135000, confidence: 85 },
    { month: "Oct", forecast: 137000, confidence: 82 },
    { month: "Nov", forecast: 140000, confidence: 78 },
    { month: "Dec", forecast: 145000, confidence: 75 },
  ];

  const workerCostBreakdown = [
    { category: "Salaries", amount: 100000, percentage: 80 },
    { category: "Allowances", amount: 15000, percentage: 12 },
    { category: "Bonuses", amount: 10000, percentage: 8 },
  ];

  const deductionBreakdown = [
    { type: "Income Tax", amount: 18750, percentage: 60 },
    { type: "SSNIT Employee", amount: 8125, percentage: 26 },
    { type: "Other Deductions", amount: 3625, percentage: 14 },
  ];

  const costTrends = [
    { metric: "Average Monthly Payroll", current: 125000, previous: 118000, change: 5.9 },
    { metric: "Average Worker Salary", current: 2778, previous: 2622, change: 5.9 },
    { metric: "Total Tax Withholding", current: 18750, previous: 17700, change: 5.9 },
    { metric: "SSNIT Contribution", current: 8125, previous: 7670, change: 5.9 },
  ];

  const workerMetrics = [
    { metric: "Total Active Workers", value: 45, change: 2 },
    { metric: "New Hires (This Year)", value: 8, change: 3 },
    { metric: "Turnover Rate", value: "4.4%", change: -1.2 },
    { metric: "Average Tenure", value: "3.2 years", change: 0.3 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payroll Analytics</h1>
          <p className="text-gray-600 mt-2">Comprehensive payroll insights and forecasting</p>
        </div>
        <div className="flex gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="12months">Last 12 Months</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Payroll</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  GHS {analytics.totalPayroll.toLocaleString()}
                </p>
                <p className="text-xs text-green-600 mt-2">↑ {analytics.payrollTrend}% from last month</p>
              </div>
              <DollarSign className="h-10 w-10 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Workers</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{analytics.totalWorkers}</p>
                <p className="text-xs text-gray-600 mt-2">Active employees</p>
              </div>
              <Users className="h-10 w-10 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg. Salary</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  GHS {analytics.averageSalary.toLocaleString()}
                </p>
                <p className="text-xs text-gray-600 mt-2">Per worker</p>
              </div>
              <TrendingUp className="h-10 w-10 text-purple-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tax Withheld</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  GHS {analytics.taxWithheld.toLocaleString()}
                </p>
                <p className="text-xs text-gray-600 mt-2">15% of payroll</p>
              </div>
              <AlertCircle className="h-10 w-10 text-orange-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payroll Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Payroll Trend</CardTitle>
            <CardDescription>Monthly payroll over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {monthlyData.map((data, idx) => {
                const maxPayroll = Math.max(...monthlyData.map((m) => m.payroll));
                const percentage = (data.payroll / maxPayroll) * 100;

                return (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{data.month}</span>
                      <span className="text-sm font-semibold text-gray-900">
                        GHS {data.payroll.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Payroll Forecast */}
        <Card>
          <CardHeader>
            <CardTitle>Payroll Forecast</CardTitle>
            <CardDescription>Predicted payroll for next 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {forecastData.map((data, idx) => (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{data.month}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">
                        GHS {data.forecast.toLocaleString()}
                      </span>
                      <span className="text-xs text-gray-500">({data.confidence}% confidence)</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all"
                      style={{ width: `${(data.forecast / 150000) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cost Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Worker Cost Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Worker Cost Breakdown</CardTitle>
            <CardDescription>Distribution of payroll expenses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {workerCostBreakdown.map((item, idx) => (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">{item.category}</span>
                    <span className="text-sm font-semibold text-gray-900">
                      GHS {item.amount.toLocaleString()} ({item.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-blue-600 h-3 rounded-full"
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Deduction Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Deduction Breakdown</CardTitle>
            <CardDescription>Tax and statutory deductions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {deductionBreakdown.map((item, idx) => (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">{item.type}</span>
                    <span className="text-sm font-semibold text-gray-900">
                      GHS {item.amount.toLocaleString()} ({item.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-red-600 h-3 rounded-full"
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cost Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Cost Trends</CardTitle>
          <CardDescription>Year-over-year comparison</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {costTrends.map((trend, idx) => (
              <div key={idx} className="border rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-2">{trend.metric}</p>
                <p className="text-xl font-bold text-gray-900">
                  {typeof trend.current === "number" ? `GHS ${trend.current.toLocaleString()}` : trend.current}
                </p>
                <p className={`text-sm mt-2 ${trend.change > 0 ? "text-green-600" : "text-red-600"}`}>
                  {trend.change > 0 ? "↑" : "↓"} {Math.abs(trend.change)}% from last period
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Worker Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Worker Metrics</CardTitle>
          <CardDescription>Workforce statistics and trends</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {workerMetrics.map((metric, idx) => (
              <div key={idx} className="border rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-2">{metric.metric}</p>
                <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                <p className={`text-sm mt-2 ${metric.change > 0 ? "text-green-600" : "text-red-600"}`}>
                  {metric.change > 0 ? "↑" : "↓"} {Math.abs(metric.change)} from last year
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
