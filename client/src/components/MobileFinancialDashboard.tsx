import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, DollarSign, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface MobileFinancialDashboardProps {
  summary?: {
    totalRevenue: number;
    totalExpenses: number;
    profit: number;
    profitMargin: number;
  };
  expenseBreakdown?: Array<{ name: string; value: number; percentage: number }>;
  revenueBreakdown?: Array<{ name: string; value: number }>;
  costPerAnimal?: {
    totalAnimals: number;
    averageCostPerAnimal: number;
    totalExpenses: number;
  };
  onAddExpense?: () => void;
  onAddRevenue?: () => void;
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export const MobileFinancialDashboard: React.FC<MobileFinancialDashboardProps> = ({
  summary,
  expenseBreakdown = [],
  revenueBreakdown = [],
  costPerAnimal,
  onAddExpense,
  onAddRevenue,
}) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    kpis: true,
    expenses: false,
    revenue: false,
    costs: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <div className="space-y-4 pb-20">
      {/* KPI Cards - Stacked Layout */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-4 py-2">
          <h2 className="text-lg font-bold">Financial Overview</h2>
          <button
            onClick={() => toggleSection("kpis")}
            className="p-1 hover:bg-gray-100 rounded"
          >
            {expandedSections.kpis ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>

        {expandedSections.kpis && (
          <div className="space-y-2 px-2">
            {/* Total Revenue */}
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600 font-medium">Total Revenue</p>
                    <p className="text-2xl font-bold text-green-700">
                      GHS {summary?.totalRevenue?.toLocaleString('en-US', { maximumFractionDigits: 0 }) || '0'}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600 opacity-30" />
                </div>
              </CardContent>
            </Card>

            {/* Total Expenses */}
            <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600 font-medium">Total Expenses</p>
                    <p className="text-2xl font-bold text-red-700">
                      GHS {summary?.totalExpenses?.toLocaleString('en-US', { maximumFractionDigits: 0 }) || '0'}
                    </p>
                  </div>
                  <TrendingDown className="h-8 w-8 text-red-600 opacity-30" />
                </div>
              </CardContent>
            </Card>

            {/* Net Profit */}
            <Card className={`bg-gradient-to-br ${(summary?.profit || 0) >= 0 ? 'from-blue-50 to-blue-100 border-blue-200' : 'from-orange-50 to-orange-100 border-orange-200'}`}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600 font-medium">Net Profit</p>
                    <p className={`text-2xl font-bold ${(summary?.profit || 0) >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                      GHS {summary?.profit?.toLocaleString('en-US', { maximumFractionDigits: 0 }) || '0'}
                    </p>
                  </div>
                  <TrendingUp className={`h-8 w-8 opacity-30 ${(summary?.profit || 0) >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
                </div>
              </CardContent>
            </Card>

            {/* Profit Margin */}
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600 font-medium">Profit Margin</p>
                    <p className="text-2xl font-bold text-purple-700">
                      {summary?.profitMargin?.toFixed(1) || '0'}%
                    </p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-purple-600 opacity-30" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 px-2">
        <Button onClick={onAddExpense} variant="default" className="flex-1 text-sm">
          + Expense
        </Button>
        <Button onClick={onAddRevenue} variant="outline" className="flex-1 text-sm">
          + Revenue
        </Button>
      </div>

      {/* Expense Breakdown */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-4 py-2">
          <h3 className="text-lg font-bold">Expense Breakdown</h3>
          <button
            onClick={() => toggleSection("expenses")}
            className="p-1 hover:bg-gray-100 rounded"
          >
            {expandedSections.expenses ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>

        {expandedSections.expenses && (
          <div className="px-2">
            <Card>
              <CardContent className="pt-4">
                {expenseBreakdown.length > 0 ? (
                  <div className="space-y-3">
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={expenseBreakdown}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percentage }) => `${name}: ${percentage}%`}
                          outerRadius={60}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {expenseBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2 text-sm">
                      {expenseBreakdown.map((item, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span>{item.name}</span>
                          </div>
                          <span className="font-semibold">GHS {item.value.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No expense data available</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Revenue Breakdown */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-4 py-2">
          <h3 className="text-lg font-bold">Revenue Breakdown</h3>
          <button
            onClick={() => toggleSection("revenue")}
            className="p-1 hover:bg-gray-100 rounded"
          >
            {expandedSections.revenue ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>

        {expandedSections.revenue && (
          <div className="px-2">
            <Card>
              <CardContent className="pt-4">
                {revenueBreakdown.length > 0 ? (
                  <div className="space-y-3">
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={revenueBreakdown}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#10b981" />
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="space-y-2 text-sm">
                      {revenueBreakdown.map((item, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <span>{item.name}</span>
                          <span className="font-semibold">GHS {item.value.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No revenue data available</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Cost Analysis */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-4 py-2">
          <h3 className="text-lg font-bold">Cost Analysis</h3>
          <button
            onClick={() => toggleSection("costs")}
            className="p-1 hover:bg-gray-100 rounded"
          >
            {expandedSections.costs ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>

        {expandedSections.costs && (
          <div className="px-2">
            <Card>
              <CardContent className="pt-4">
                <div className="space-y-4">
                  <div className="border-b pb-3">
                    <p className="text-xs text-gray-600 font-medium">Total Animals</p>
                    <p className="text-2xl font-bold">{costPerAnimal?.totalAnimals || 0}</p>
                  </div>
                  <div className="border-b pb-3">
                    <p className="text-xs text-gray-600 font-medium">Average Cost Per Animal</p>
                    <p className="text-2xl font-bold">
                      GHS {costPerAnimal?.averageCostPerAnimal?.toLocaleString('en-US', { maximumFractionDigits: 2 }) || '0'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 font-medium">Total Expenses</p>
                    <p className="text-2xl font-bold">
                      GHS {costPerAnimal?.totalExpenses?.toLocaleString('en-US', { maximumFractionDigits: 0 }) || '0'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileFinancialDashboard;
