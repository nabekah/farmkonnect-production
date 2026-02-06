import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download, Loader2, BarChart3, TrendingUp, Clock, Users } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

interface TimeEntry {
  id: string;
  workerId: string;
  workerName: string;
  activityType: string;
  startTime: string;
  endTime: string;
  duration: number; // in minutes
  date: string;
  notes?: string;
}

interface ActivityMetrics {
  activityType: string;
  totalTime: number; // in minutes
  count: number;
  averageTime: number;
}

interface WorkerMetrics {
  workerId: string;
  workerName: string;
  totalTime: number;
  activitiesCount: number;
  averageTimePerActivity: number;
  productivity: number; // percentage
}

export function TimeTrackerReporting() {
  const { user } = useAuth();
  const [farmId] = useState(1);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });
  const [selectedWorker, setSelectedWorker] = useState<string>('all');

  // Fetch time entries
  const { data: timeEntriesData, isLoading } = trpc.fieldWorker.getTimeTrackerLogs.useQuery(
    { farmId, startDate: dateRange.start, endDate: dateRange.end },
    { enabled: !!user }
  );

  const timeEntries = (timeEntriesData?.entries || []) as TimeEntry[];

  // Filter by worker if selected
  const filteredEntries = selectedWorker === 'all'
    ? timeEntries
    : timeEntries.filter((e) => e.workerId === selectedWorker);

  // Calculate metrics by activity type
  const activityMetrics: ActivityMetrics[] = [];
  const activityMap = new Map<string, { total: number; count: number }>();

  filteredEntries.forEach((entry) => {
    const current = activityMap.get(entry.activityType) || { total: 0, count: 0 };
    current.total += entry.duration;
    current.count += 1;
    activityMap.set(entry.activityType, current);
  });

  activityMap.forEach((value, key) => {
    activityMetrics.push({
      activityType: key,
      totalTime: value.total,
      count: value.count,
      averageTime: Math.round(value.total / value.count),
    });
  });

  // Calculate metrics by worker
  const workerMetrics: WorkerMetrics[] = [];
  const workerMap = new Map<string, { name: string; total: number; count: number }>();

  timeEntries.forEach((entry) => {
    const current = workerMap.get(entry.workerId) || { name: entry.workerName, total: 0, count: 0 };
    current.total += entry.duration;
    current.count += 1;
    workerMap.set(entry.workerId, current);
  });

  workerMap.forEach((value, key) => {
    workerMetrics.push({
      workerId: key,
      workerName: value.name,
      totalTime: value.total,
      activitiesCount: value.count,
      averageTimePerActivity: Math.round(value.total / value.count),
      productivity: Math.round((value.count / (value.total / 60)) * 100), // activities per hour
    });
  });

  // Calculate summary metrics
  const totalHours = Math.round(filteredEntries.reduce((sum, e) => sum + e.duration, 0) / 60);
  const totalActivities = filteredEntries.length;
  const averageActivityTime = totalActivities > 0 ? Math.round(filteredEntries.reduce((sum, e) => sum + e.duration, 0) / totalActivities) : 0;
  const uniqueWorkers = new Set(filteredEntries.map((e) => e.workerId)).size;

  // Chart data for time spent by activity type
  const activityChartData = {
    labels: activityMetrics.map((m) => m.activityType),
    datasets: [
      {
        label: 'Hours Spent',
        data: activityMetrics.map((m) => Math.round(m.totalTime / 60)),
        backgroundColor: [
          'rgba(255, 99, 132, 0.5)',
          'rgba(54, 162, 235, 0.5)',
          'rgba(255, 206, 86, 0.5)',
          'rgba(75, 192, 192, 0.5)',
          'rgba(153, 102, 255, 0.5)',
          'rgba(255, 159, 64, 0.5)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Chart data for worker productivity
  const workerChartData = {
    labels: workerMetrics.map((m) => m.workerName),
    datasets: [
      {
        label: 'Total Hours',
        data: workerMetrics.map((m) => Math.round(m.totalTime / 60)),
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  // Chart data for activity distribution (pie)
  const activityDistributionData = {
    labels: activityMetrics.map((m) => m.activityType),
    datasets: [
      {
        data: activityMetrics.map((m) => m.count),
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(153, 102, 255, 0.7)',
          'rgba(255, 159, 64, 0.7)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const handleExportCSV = () => {
    // Prepare CSV data
    const csvRows = [
      ['Time Tracker Report', `${dateRange.start} to ${dateRange.end}`],
      [],
      ['Summary Metrics'],
      ['Total Hours', totalHours],
      ['Total Activities', totalActivities],
      ['Average Activity Time (minutes)', averageActivityTime],
      ['Unique Workers', uniqueWorkers],
      [],
      ['Activity Type Breakdown'],
      ['Activity Type', 'Hours Spent', 'Count', 'Average Time (minutes)'],
      ...activityMetrics.map((m) => [
        m.activityType,
        Math.round(m.totalTime / 60),
        m.count,
        m.averageTime,
      ]),
      [],
      ['Worker Productivity'],
      ['Worker Name', 'Total Hours', 'Activities Count', 'Average Time per Activity (minutes)', 'Productivity (activities/hour)'],
      ...workerMetrics.map((m) => [
        m.workerName,
        Math.round(m.totalTime / 60),
        m.activitiesCount,
        m.averageTimePerActivity,
        m.productivity,
      ]),
      [],
      ['Detailed Time Entries'],
      ['Worker', 'Activity Type', 'Date', 'Start Time', 'End Time', 'Duration (minutes)', 'Notes'],
      ...filteredEntries.map((e) => [
        e.workerName,
        e.activityType,
        e.date,
        e.startTime,
        e.endTime,
        e.duration,
        e.notes || '',
      ]),
    ];

    // Convert to CSV string
    const csvContent = csvRows.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `time-tracker-report-${dateRange.start}-to-${dateRange.end}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading time tracker data...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Time Tracker Reporting</h1>
          <p className="text-muted-foreground">Analytics and insights from field worker time tracking</p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">From Date</label>
                <Input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">To Date</label>
                <Input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                />
              </div>

              {/* Worker Filter */}
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Worker</label>
                <Select value={selectedWorker} onValueChange={setSelectedWorker}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Workers</SelectItem>
                    {Array.from(new Set(timeEntries.map((e) => e.workerId))).map((workerId) => {
                      const worker = timeEntries.find((e) => e.workerId === workerId);
                      return (
                        <SelectItem key={workerId} value={workerId}>
                          {worker?.workerName}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Export Button */}
              <div className="flex items-end">
                <Button onClick={handleExportCSV} className="w-full gap-2">
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Hours</p>
                  <p className="text-3xl font-bold text-foreground">{totalHours}</p>
                </div>
                <Clock className="h-8 w-8 text-blue-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Activities</p>
                  <p className="text-3xl font-bold text-foreground">{totalActivities}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Avg Activity Time</p>
                  <p className="text-3xl font-bold text-foreground">{averageActivityTime}m</p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Unique Workers</p>
                  <p className="text-3xl font-bold text-foreground">{uniqueWorkers}</p>
                </div>
                <Users className="h-8 w-8 text-purple-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Time by Activity Type */}
          <Card>
            <CardHeader>
              <CardTitle>Time Spent by Activity Type</CardTitle>
              <CardDescription>Hours spent on each activity type</CardDescription>
            </CardHeader>
            <CardContent>
              {activityMetrics.length > 0 ? (
                <div style={{ height: '300px' }}>
                  <Bar data={activityChartData} options={{ maintainAspectRatio: false }} />
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No data available</p>
              )}
            </CardContent>
          </Card>

          {/* Worker Productivity */}
          <Card>
            <CardHeader>
              <CardTitle>Worker Productivity</CardTitle>
              <CardDescription>Total hours by worker</CardDescription>
            </CardHeader>
            <CardContent>
              {workerMetrics.length > 0 ? (
                <div style={{ height: '300px' }}>
                  <Bar data={workerChartData} options={{ maintainAspectRatio: false }} />
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No data available</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Activity Distribution Pie Chart */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Activity Distribution</CardTitle>
            <CardDescription>Number of activities by type</CardDescription>
          </CardHeader>
          <CardContent>
            {activityMetrics.length > 0 ? (
              <div style={{ height: '300px', maxWidth: '400px', margin: '0 auto' }}>
                <Pie data={activityDistributionData} options={{ maintainAspectRatio: false }} />
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No data available</p>
            )}
          </CardContent>
        </Card>

        {/* Activity Metrics Table */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Activity Type Metrics</CardTitle>
            <CardDescription>Detailed breakdown by activity type</CardDescription>
          </CardHeader>
          <CardContent>
            {activityMetrics.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4 font-semibold">Activity Type</th>
                      <th className="text-right py-2 px-4 font-semibold">Hours</th>
                      <th className="text-right py-2 px-4 font-semibold">Count</th>
                      <th className="text-right py-2 px-4 font-semibold">Avg Time (min)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activityMetrics.map((metric) => (
                      <tr key={metric.activityType} className="border-b hover:bg-muted/50">
                        <td className="py-2 px-4">{metric.activityType}</td>
                        <td className="text-right py-2 px-4">{Math.round(metric.totalTime / 60)}</td>
                        <td className="text-right py-2 px-4">{metric.count}</td>
                        <td className="text-right py-2 px-4">{metric.averageTime}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No data available</p>
            )}
          </CardContent>
        </Card>

        {/* Worker Metrics Table */}
        <Card>
          <CardHeader>
            <CardTitle>Worker Productivity Metrics</CardTitle>
            <CardDescription>Performance metrics by worker</CardDescription>
          </CardHeader>
          <CardContent>
            {workerMetrics.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4 font-semibold">Worker Name</th>
                      <th className="text-right py-2 px-4 font-semibold">Total Hours</th>
                      <th className="text-right py-2 px-4 font-semibold">Activities</th>
                      <th className="text-right py-2 px-4 font-semibold">Avg Time (min)</th>
                      <th className="text-right py-2 px-4 font-semibold">Productivity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workerMetrics.map((metric) => (
                      <tr key={metric.workerId} className="border-b hover:bg-muted/50">
                        <td className="py-2 px-4">{metric.workerName}</td>
                        <td className="text-right py-2 px-4">{Math.round(metric.totalTime / 60)}</td>
                        <td className="text-right py-2 px-4">{metric.activitiesCount}</td>
                        <td className="text-right py-2 px-4">{metric.averageTimePerActivity}</td>
                        <td className="text-right py-2 px-4">
                          <Badge variant="outline">{metric.productivity} act/hr</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No data available</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
