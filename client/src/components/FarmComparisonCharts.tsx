import React, { useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";

interface FarmComparisonChartsProps {
  farms: Array<{ id: number; farmName: string }>;
  startDate: Date;
  endDate: Date;
}

export const FarmComparisonCharts: React.FC<FarmComparisonChartsProps> = ({ farms, startDate, endDate }) => {
  const farmDataQueries = farms.map(farm =>
    trpc.financialManagement.getFinancialSummary.useQuery(
      { farmId: farm.id.toString(), startDate, endDate },
      { enabled: !!farm.id }
    )
  );

  const comparisonData = useMemo(() => {
    return farms.map((farm, index) => {
      const data = farmDataQueries[index].data;
      return {
        name: farm.farmName,
        revenue: data?.totalRevenue || 0,
        expenses: data?.totalExpenses || 0,
        profit: data?.profit || 0,
        margin: data?.profitMargin || 0
      };
    });
  }, [farms, farmDataQueries]);

  const totals = useMemo(() => {
    return {
      totalRevenue: comparisonData.reduce((sum, farm) => sum + farm.revenue, 0),
      totalExpenses: comparisonData.reduce((sum, farm) => sum + farm.expenses, 0),
      totalProfit: comparisonData.reduce((sum, farm) => sum + farm.profit, 0),
      avgMargin: comparisonData.length > 0 
        ? comparisonData.reduce((sum, farm) => sum + farm.margin, 0) / comparisonData.length 
        : 0
    };
  }, [comparisonData]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              GHS {totals.totalRevenue.toLocaleString('en-US', { maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-gray-500">Across all farms</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              GHS {totals.totalExpenses.toLocaleString('en-US', { maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-gray-500">Across all farms</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totals.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              GHS {totals.totalProfit.toLocaleString('en-US', { maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-gray-500">Combined profit</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Margin</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.avgMargin.toFixed(1)}%</div>
            <p className="text-xs text-gray-500">Average across farms</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Revenue vs Expenses</CardTitle>
          <CardDescription>Farm performance comparison</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => `GHS ${value.toLocaleString('en-US', { maximumFractionDigits: 2 })}`} />
              <Legend />
              <Bar dataKey="revenue" fill="#10b981" name="Revenue" />
              <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Profit Comparison</CardTitle>
          <CardDescription>Net profit by farm</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => `GHS ${value.toLocaleString('en-US', { maximumFractionDigits: 2 })}`} />
              <Bar dataKey="profit" fill="#3b82f6" name="Profit" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Profit Margin</CardTitle>
          <CardDescription>Profitability percentage</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
              <Line type="monotone" dataKey="margin" stroke="#8b5cf6" strokeWidth={2} name="Margin %" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Farm</th>
                  <th className="text-right py-2">Revenue</th>
                  <th className="text-right py-2">Expenses</th>
                  <th className="text-right py-2">Profit</th>
                  <th className="text-right py-2">Margin %</th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((farm, i) => (
                  <tr key={i} className="border-b hover:bg-gray-50">
                    <td className="py-3 font-medium">{farm.name}</td>
                    <td className="text-right">GHS {farm.revenue.toLocaleString('en-US', { maximumFractionDigits: 2 })}</td>
                    <td className="text-right">GHS {farm.expenses.toLocaleString('en-US', { maximumFractionDigits: 2 })}</td>
                    <td className={`text-right font-semibold ${farm.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      GHS {farm.profit.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                    </td>
                    <td className={`text-right font-semibold ${farm.margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {farm.margin.toFixed(1)}%
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
};
