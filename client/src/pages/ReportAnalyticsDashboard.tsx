import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle2 } from 'lucide-react';

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b'];

export default function ReportAnalyticsDashboard() {
  const [selectedFarmId, setSelectedFarmId] = useState('');
  const [selectedMetric, setSelectedMetric] = useState<'successRate' | 'generationTime' | 'fileSize'>('successRate');
  const [days, setDays] = useState('30');

  // Queries
  const { data: farms } = trpc.farms.list.useQuery();
  const { data: summary } = trpc.reportAnalytics.getPerformanceSummary.useQuery(
    { farmId: parseInt(selectedFarmId), days: parseInt(days) },
    { enabled: !!selectedFarmId }
  );
  const { data: distribution } = trpc.reportAnalytics.getReportTypeDistribution.useQuery(
    { farmId: parseInt(selectedFarmId) },
    { enabled: !!selectedFarmId }
  );
  const { data: trendData } = trpc.reportAnalytics.getTrendData.useQuery(
    { farmId: parseInt(selectedFarmId), metric: selectedMetric, days: parseInt(days) },
    { enabled: !!selectedFarmId }
  );
  const { data: failures } = trpc.reportAnalytics.getRecentFailures.useQuery(
    { farmId: parseInt(selectedFarmId), limit: 10 },
    { enabled: !!selectedFarmId }
  );

  const getMetricLabel = () => {
    if (selectedMetric === 'successRate') return 'Success Rate (%)';
    if (selectedMetric === 'generationTime') return 'Generation Time (ms)';
    return 'File Size (bytes)';
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Report Analytics Dashboard</h1>
        <p className="text-muted-foreground">Track report delivery metrics and performance trends</p>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Farm</label>
          <Select value={selectedFarmId} onValueChange={setSelectedFarmId}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a farm" />
            </SelectTrigger>
            <SelectContent>
              {farms?.map((farm) => (
                <SelectItem key={farm.id} value={farm.id.toString()}>
                  {farm.farmName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Time Period</label>
          <Select value={days} onValueChange={setDays}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Metric</label>
          <Select value={selectedMetric} onValueChange={(value: any) => setSelectedMetric(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="successRate">Success Rate</SelectItem>
              <SelectItem value="generationTime">Generation Time</SelectItem>
              <SelectItem value="fileSize">File Size</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedFarmId && summary && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.reports.total}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {summary.reports.successful} successful, {summary.reports.failed} failed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-bold text-green-600">{summary.reports.successRate}%</div>
                  {summary.reports.successRate >= 95 ? (
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-red-600" />
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Avg Recipients/Report</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.delivery.averageRecipientsPerReport}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {summary.delivery.totalRecipients} total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Avg Generation Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.performance.averageGenerationTime}ms</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {(summary.performance.averageFileSize / 1024).toFixed(1)} KB avg size
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Trend</CardTitle>
              <CardDescription>{getMetricLabel()} over time</CardDescription>
            </CardHeader>
            <CardContent>
              {trendData && trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#3b82f6"
                      name={getMetricLabel()}
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Report Type Distribution */}
          {distribution && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Report Type Distribution</CardTitle>
                  <CardDescription>Breakdown by report type</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Financial', value: distribution.financial.totalGenerated },
                          { name: 'Livestock', value: distribution.livestock.totalGenerated },
                          { name: 'Complete', value: distribution.complete.totalGenerated },
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {COLORS.map((color, index) => (
                          <Cell key={`cell-${index}`} fill={color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Success Rate by Type</CardTitle>
                  <CardDescription>Delivery success percentage</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={[
                        { name: 'Financial', rate: distribution.financial.averageSuccessRate },
                        { name: 'Livestock', rate: distribution.livestock.averageSuccessRate },
                        { name: 'Complete', rate: distribution.complete.averageSuccessRate },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="rate" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Recent Failures */}
          {failures && failures.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  Recent Failures
                </CardTitle>
                <CardDescription>Last 10 failed report generations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {failures.map((failure) => (
                    <div key={failure.id} className="flex items-start justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="destructive" className="capitalize">
                            {failure.reportType}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {new Date(failure.createdAt).toLocaleString()}
                          </span>
                        </div>
                        {failure.errorMessage && (
                          <p className="text-sm text-red-600">{failure.errorMessage}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Type Statistics */}
          {distribution && (
            <Card>
              <CardHeader>
                <CardTitle>Report Type Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { name: 'Financial', data: distribution.financial },
                    { name: 'Livestock', data: distribution.livestock },
                    { name: 'Complete', data: distribution.complete },
                  ].map((type) => (
                    <div key={type.name} className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-3">{type.name} Reports</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Schedules:</span>
                          <span className="font-medium">{type.data.count}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Generated:</span>
                          <span className="font-medium">{type.data.totalGenerated}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Sent:</span>
                          <span className="font-medium">{type.data.totalSent}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t">
                          <span className="text-muted-foreground">Success Rate:</span>
                          <span className="font-medium text-green-600">{type.data.averageSuccessRate}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {!selectedFarmId && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 text-muted-foreground">
              <p>Select a farm to view analytics</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
