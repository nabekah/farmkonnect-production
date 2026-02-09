import React, { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DollarSign, TrendingUp, TrendingDown, Download, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

export const MarketplaceFinancialDashboard: React.FC = () => {
  const [dateRange, setDateRange] = useState<'month' | 'quarter' | 'year'>('month');
  const [selectedFarmId, setSelectedFarmId] = useState<number | null>(null);
  const utils = trpc.useUtils();

  // Fetch marketplace financial data
  const { data: summary, isLoading: summaryLoading } = trpc.marketplaceFinancial.getFinancialSummary.useQuery({});

  const { data: transactions, isLoading: transactionsLoading } = trpc.marketplaceFinancial.getTransactions.useQuery({
    limit: 20,
    offset: 0,
  });

  const { data: report, isLoading: reportLoading } = trpc.marketplaceFinancial.generateReport.useQuery({
    period: dateRange === 'month' ? 'month' : dateRange === 'quarter' ? 'quarter' : 'year',
  });

  const { data: revenueBreakdown } = trpc.marketplaceFinancial.getRevenueBreakdown.useQuery({});

  // Sync to financial dashboard mutation
  const syncMutation = trpc.marketplaceFinancial.syncToFinancialDashboard.useMutation({
    onSuccess: () => {
      toast.success('Marketplace data synced to financial dashboard');
      utils.marketplaceFinancial.getFinancialSummary.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to sync data');
    },
  });

  const handleSync = () => {
    if (!selectedFarmId) {
      toast.error('Please select a farm first');
      return;
    }
    syncMutation.mutate({ farmId: selectedFarmId });
  };

  if (summaryLoading) {
    return <div className="p-4">Loading marketplace financial data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Marketplace Financial Dashboard</h1>
          <p className="text-gray-600">Track your marketplace revenue and expenses</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => utils.marketplaceFinancial.getFinancialSummary.invalidate()}
            disabled={summaryLoading}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleSync} disabled={syncMutation.isPending}>
            <Download className="w-4 h-4 mr-2" />
            Sync to Financial Dashboard
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">GH₵{summary?.totalRevenue.toFixed(2) || '0.00'}</div>
            <p className="text-xs text-gray-600">{summary?.totalOrders || 0} orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commissions</CardTitle>
            <TrendingDown className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">GH₵{summary?.totalCommissions.toFixed(2) || '0.00'}</div>
            <p className="text-xs text-gray-600">3% of gross revenue</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing Fees</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">GH₵{summary?.paymentProcessingFee.toFixed(2) || '0.00'}</div>
            <p className="text-xs text-gray-600">2.9% + GH₵0.30 per order</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">GH₵{summary?.netRevenue.toFixed(2) || '0.00'}</div>
            <p className="text-xs text-gray-600">After all fees</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="breakdown" className="w-full">
        <TabsList>
          <TabsTrigger value="breakdown">Revenue Breakdown</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        {/* Revenue Breakdown */}
        <TabsContent value="breakdown">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Breakdown</CardTitle>
              <CardDescription>Gross revenue vs fees and net revenue</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Pie Chart */}
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={revenueBreakdown?.breakdown || []}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {(revenueBreakdown?.breakdown || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `GH₵${value.toFixed(2)}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Breakdown Table */}
                <div className="space-y-4">
                  {revenueBreakdown?.breakdown.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="font-medium">{item.label}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">GH₵{item.value.toFixed(2)}</div>
                        <div className="text-xs text-gray-600">{item.percentage.toFixed(1)}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transactions */}
        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Latest marketplace transactions and fees</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Date</th>
                      <th className="text-left py-2">Type</th>
                      <th className="text-left py-2">Description</th>
                      <th className="text-right py-2">Amount</th>
                      <th className="text-left py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(transactions || []).map((transaction) => (
                      <tr key={transaction.id} className="border-b hover:bg-gray-50">
                        <td className="py-2">{new Date(transaction.date).toLocaleDateString()}</td>
                        <td className="py-2">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              transaction.type === 'sale'
                                ? 'bg-green-100 text-green-800'
                                : transaction.type === 'commission'
                                  ? 'bg-orange-100 text-orange-800'
                                  : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                          </span>
                        </td>
                        <td className="py-2">{transaction.description}</td>
                        <td className="text-right py-2 font-medium">
                          {transaction.type === 'sale' ? '+' : '-'}GH₵{transaction.amount.toFixed(2)}
                        </td>
                        <td className="py-2">
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              transaction.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends */}
        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Order Trends</CardTitle>
              <CardDescription>Orders and revenue over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={report?.orderTrend || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="orders"
                      stroke="#3b82f6"
                      name="Orders"
                      yAxisId="left"
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#10b981"
                      name="Revenue (GH₵)"
                      yAxisId="right"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Top Products */}
      {report?.topProducts && report.topProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
            <CardDescription>Your best-selling products this period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={report.topProducts}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="sales" fill="#3b82f6" name="Units Sold" />
                  <Bar dataKey="revenue" fill="#10b981" name="Revenue (GH₵)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
