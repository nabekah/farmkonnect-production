import React, { useState, useEffect } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Calendar, TrendingUp, Users, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

interface WorkerStats {
  workerId: number;
  workerName: string;
  tasksCompleted: number;
  tasksInProgress: number;
  tasksPending: number;
  activitiesLogged: number;
  averageCompletionTime: number; // in hours
  completionRate: number; // percentage
}

interface ActivityTrend {
  date: string;
  activities: number;
  tasks: number;
  completions: number;
}

interface ActivityTypeStats {
  type: string;
  count: number;
  percentage: number;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function ActivityAnalyticsDashboard() {
  const { user } = useAuth();
  const [farmId, setFarmId] = useState<number | null>(null);
  const [dateRange, setDateRange] = useState('7days');
  const [workerStats, setWorkerStats] = useState<WorkerStats[]>([]);
  const [activityTrends, setActivityTrends] = useState<ActivityTrend[]>([]);
  const [activityTypes, setActivityTypes] = useState<ActivityTypeStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    if (user?.id) {
      setFarmId(1); // Placeholder
    }
  }, [user]);

  useEffect(() => {
    if (!farmId) return;

    // Simulate fetching analytics data
    setIsLoading(true);
    setTimeout(() => {
      // Mock worker stats
      setWorkerStats([
        {
          workerId: 1,
          workerName: 'John Smith',
          tasksCompleted: 24,
          tasksInProgress: 3,
          tasksPending: 2,
          activitiesLogged: 45,
          averageCompletionTime: 2.5,
          completionRate: 92,
        },
        {
          workerId: 2,
          workerName: 'Maria Garcia',
          tasksCompleted: 19,
          tasksInProgress: 5,
          tasksPending: 1,
          activitiesLogged: 38,
          averageCompletionTime: 3.1,
          completionRate: 88,
        },
        {
          workerId: 3,
          workerName: 'Ahmed Hassan',
          tasksCompleted: 28,
          tasksInProgress: 2,
          tasksPending: 0,
          activitiesLogged: 52,
          averageCompletionTime: 2.2,
          completionRate: 96,
        },
      ]);

      // Mock activity trends
      setActivityTrends([
        { date: 'Mon', activities: 12, tasks: 8, completions: 6 },
        { date: 'Tue', activities: 19, tasks: 12, completions: 10 },
        { date: 'Wed', activities: 15, tasks: 10, completions: 8 },
        { date: 'Thu', activities: 22, tasks: 14, completions: 12 },
        { date: 'Fri', activities: 18, tasks: 11, completions: 9 },
        { date: 'Sat', activities: 14, tasks: 9, completions: 7 },
        { date: 'Sun', activities: 10, tasks: 6, completions: 5 },
      ]);

      // Mock activity types
      setActivityTypes([
        { type: 'Crop Monitoring', count: 45, percentage: 28 },
        { type: 'Irrigation', count: 38, percentage: 24 },
        { type: 'Pest Control', count: 32, percentage: 20 },
        { type: 'Fertilization', count: 28, percentage: 17 },
        { type: 'Equipment Maintenance', count: 17, percentage: 11 },
      ]);

      setIsLoading(false);
    }, 1000);
  }, [farmId, dateRange]);

  const totalActivities = activityTrends.reduce((sum, d) => sum + d.activities, 0);
  const totalTasks = workerStats.reduce((sum, w) => sum + w.tasksCompleted, 0);
  const averageCompletionRate =
    workerStats.length > 0
      ? Math.round(
          workerStats.reduce((sum, w) => sum + w.completionRate, 0) / workerStats.length
        )
      : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Activity Analytics</h1>
          <p className="text-muted-foreground">Track worker productivity and activity trends</p>
        </div>

        {/* Date Range Selector */}
        <div className="flex gap-2 mb-8">
          {['7days', '30days', '90days', 'all'].map((range) => (
            <Button
              key={range}
              variant={dateRange === range ? 'default' : 'outline'}
              onClick={() => setDateRange(range)}
              className="capitalize"
            >
              {range === '7days'
                ? 'Last 7 Days'
                : range === '30days'
                  ? 'Last 30 Days'
                  : range === '90days'
                    ? 'Last 90 Days'
                    : 'All Time'}
            </Button>
          ))}
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Activities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{totalActivities}</div>
              <p className="text-xs text-muted-foreground mt-1">
                <TrendingUp className="inline h-3 w-3 mr-1" />
                +12% from last period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Tasks Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{totalTasks}</div>
              <p className="text-xs text-muted-foreground mt-1">
                <CheckCircle2 className="inline h-3 w-3 mr-1" />
                Across all workers
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Completion Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{averageCompletionRate}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                <TrendingUp className="inline h-3 w-3 mr-1" />
                Average across team
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Workers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{workerStats.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                <Users className="inline h-3 w-3 mr-1" />
                On the farm
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Activity Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Activity Trends</CardTitle>
              <CardDescription>Activities, tasks, and completions over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={activityTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="activities"
                    stroke="#3b82f6"
                    name="Activities"
                  />
                  <Line type="monotone" dataKey="tasks" stroke="#10b981" name="Tasks" />
                  <Line
                    type="monotone"
                    dataKey="completions"
                    stroke="#f59e0b"
                    name="Completions"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Activity Types Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Activity Types</CardTitle>
              <CardDescription>Distribution of activities by type</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={activityTypes}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ type, percentage }) => `${type} ${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {activityTypes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Worker Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Worker Performance</CardTitle>
            <CardDescription>Individual worker statistics and metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {workerStats.map((worker) => (
                <div key={worker.workerId} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-foreground">{worker.workerName}</h3>
                      <p className="text-sm text-muted-foreground">
                        {worker.activitiesLogged} activities logged
                      </p>
                    </div>
                    <Badge className="bg-green-500">
                      {worker.completionRate}% Complete
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Completed</p>
                      <p className="text-lg font-semibold text-foreground">
                        {worker.tasksCompleted}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">In Progress</p>
                      <p className="text-lg font-semibold text-foreground">
                        {worker.tasksInProgress}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Pending</p>
                      <p className="text-lg font-semibold text-foreground">
                        {worker.tasksPending}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Avg Time</p>
                      <p className="text-lg font-semibold text-foreground">
                        {worker.averageCompletionTime}h
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Activities</p>
                      <p className="text-lg font-semibold text-foreground">
                        {worker.activitiesLogged}
                      </p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${worker.completionRate}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
