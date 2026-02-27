import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { trpc } from '@/lib/trpc';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, DollarSign, Users, Activity, AlertCircle } from 'lucide-react';

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];

export default function AdvancedAnalyticsDashboard() {
  const [farmId, setFarmId] = useState(1);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  // Fetch analytics data
  const { data: productivityData, isLoading: productivityLoading } = trpc.advancedAnalytics.getProductivityAnalytics.useQuery({
    farmId,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });

  const { data: costData, isLoading: costLoading } = trpc.advancedAnalytics.getLaborCostAnalytics.useQuery({
    farmId,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });

  const { data: utilizationData, isLoading: utilizationLoading } = trpc.advancedAnalytics.getWorkforceUtilization.useQuery({
    farmId,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });

  const { data: complianceData, isLoading: complianceLoading } = trpc.advancedAnalytics.getComplianceAnalytics.useQuery({
    farmId,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });

  const { data: predictiveData, isLoading: predictiveLoading } = trpc.advancedAnalytics.getPredictiveAnalytics.useQuery({
    farmId,
    forecastDays: 30,
  });

  const isLoading = productivityLoading || costLoading || utilizationLoading || complianceLoading || predictiveLoading;

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Advanced Labor Analytics</h1>
        <div className="flex gap-4">
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
            className="px-3 py-2 border rounded-md"
          />
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
            className="px-3 py-2 border rounded-md"
          />
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Productivity</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productivityData?.averageProductivity?.toFixed(1) || 0}%</div>
            <p className="text-xs text-gray-500">Performance score</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Labor Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${costData?.totalCost?.toFixed(0) || 0}</div>
            <p className="text-xs text-gray-500">Current period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilization Rate</CardTitle>
            <Activity className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{utilizationData?.utilizationRate || 0}%</div>
            <p className="text-xs text-gray-500">Workforce efficiency</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{complianceData?.complianceRate?.toFixed(1) || 0}%</div>
            <p className="text-xs text-gray-500">Regulatory compliance</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="productivity" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="productivity">Productivity</TabsTrigger>
          <TabsTrigger value="costs">Labor Costs</TabsTrigger>
          <TabsTrigger value="utilization">Utilization</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="productivity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Productivity Trends</CardTitle>
              <CardDescription>Worker performance over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm">
                <p><strong>Trend:</strong> {productivityData?.trend || 'N/A'}</p>
                <p><strong>Top Performers:</strong> {productivityData?.topPerformers?.length || 0}</p>
                <p><strong>Bottom Performers:</strong> {productivityData?.bottomPerformers?.length || 0}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="costs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Labor Cost Breakdown</CardTitle>
              <CardDescription>Cost analysis by status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Draft:</span>
                  <span className="font-bold">${costData?.costByStatus?.draft?.toFixed(0) || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Approved:</span>
                  <span className="font-bold">${costData?.costByStatus?.approved?.toFixed(0) || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Paid:</span>
                  <span className="font-bold">${costData?.costByStatus?.paid?.toFixed(0) || 0}</span>
                </div>
                <div className="border-t pt-2 flex justify-between">
                  <span>Average per Worker:</span>
                  <span className="font-bold">${costData?.averageCostPerWorker?.toFixed(0) || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="utilization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Workforce Utilization</CardTitle>
              <CardDescription>Worker shift distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>Total Shifts:</strong> {utilizationData?.totalShifts || 0}</p>
                <p><strong>Total Workers:</strong> {utilizationData?.totalWorkers || 0}</p>
                <p><strong>Utilization Rate:</strong> {utilizationData?.utilizationRate || 0}%</p>
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">Top Workers by Hours</h4>
                  <div className="space-y-1 text-sm">
                    {utilizationData?.shiftsByWorker?.slice(0, 5).map((worker: any) => (
                      <div key={worker.workerId} className="flex justify-between">
                        <span>{worker.workerName}</span>
                        <span>{worker.totalHours} hrs</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Summary</CardTitle>
              <CardDescription>Regulatory compliance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Total Checks</p>
                    <p className="text-2xl font-bold">{complianceData?.totalChecks || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Compliance Rate</p>
                    <p className="text-2xl font-bold text-green-600">{complianceData?.complianceRate?.toFixed(1) || 0}%</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-sm text-gray-500">Compliant</p>
                    <p className="text-xl font-bold text-green-600">{complianceData?.compliant || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Warnings</p>
                    <p className="text-xl font-bold text-yellow-600">{complianceData?.warnings || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Violations</p>
                    <p className="text-xl font-bold text-red-600">{complianceData?.violations || 0}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Predictive Analytics */}
      <Card>
        <CardHeader>
          <CardTitle>Predictive Analytics</CardTitle>
          <CardDescription>30-day forecast and recommendations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Performance Trend</p>
              <p className="text-lg font-bold capitalize">{predictiveData?.performanceTrend || 'N/A'}</p>
              <p className="text-xs text-gray-400">Change: {predictiveData?.performanceChange}%</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Predicted Staffing Needs</p>
              <p className="text-lg font-bold">{predictiveData?.predictedStaffingNeeds || 0} workers</p>
              <p className="text-xs text-gray-400">Next 30 days</p>
            </div>
          </div>
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-2">Recommendations</h4>
            <ul className="space-y-1 text-sm">
              {predictiveData?.recommendations?.map((rec: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
