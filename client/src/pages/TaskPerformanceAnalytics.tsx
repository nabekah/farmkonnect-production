import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Clock, CheckCircle2, AlertCircle, BarChart3 } from 'lucide-react';

interface TaskMetrics {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  averageCompletionTime: number; // in seconds
  photoRequirementsMet: number; // percentage
  completionRate: number; // percentage
  workerProductivity: {
    workerId: string;
    workerName: string;
    tasksCompleted: number;
    averageTime: number;
    completionRate: number;
  }[];
  taskTrends: {
    date: string;
    completed: number;
    pending: number;
    overdue: number;
  }[];
}

const MOCK_METRICS: TaskMetrics = {
  totalTasks: 156,
  completedTasks: 98,
  pendingTasks: 45,
  overdueTasks: 13,
  averageCompletionTime: 3600, // 1 hour
  photoRequirementsMet: 94,
  completionRate: 62.8,
  workerProductivity: [
    { workerId: '1', workerName: 'John Doe', tasksCompleted: 24, averageTime: 2400, completionRate: 85 },
    { workerId: '2', workerName: 'Jane Smith', tasksCompleted: 22, averageTime: 3000, completionRate: 78 },
    { workerId: '3', workerName: 'Mike Johnson', tasksCompleted: 18, averageTime: 3600, completionRate: 72 },
    { workerId: '4', workerName: 'Sarah Williams', tasksCompleted: 20, averageTime: 2800, completionRate: 80 },
    { workerId: '5', workerName: 'Tom Brown', tasksCompleted: 14, averageTime: 4200, completionRate: 65 },
  ],
  taskTrends: [
    { date: '2026-01-29', completed: 8, pending: 12, overdue: 2 },
    { date: '2026-01-30', completed: 12, pending: 10, overdue: 3 },
    { date: '2026-01-31', completed: 15, pending: 8, overdue: 2 },
    { date: '2026-02-01', completed: 18, pending: 7, overdue: 1 },
    { date: '2026-02-02', completed: 20, pending: 5, overdue: 2 },
    { date: '2026-02-03', completed: 15, pending: 3, overdue: 3 },
    { date: '2026-02-04', completed: 10, pending: 0, overdue: 0 },
  ],
};

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

function StatCard({ icon: Icon, label, value, unit, trend }: any) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">{label}</p>
            <p className="text-2xl font-bold mt-1">
              {value}
              {unit && <span className="text-sm text-gray-500 ml-1">{unit}</span>}
            </p>
            {trend && (
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {trend}
              </p>
            )}
          </div>
          <div className="p-3 bg-blue-100 rounded-lg">
            <Icon className="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function TaskPerformanceAnalytics() {
  const metrics = MOCK_METRICS;

  const stats = useMemo(
    () => [
      {
        icon: CheckCircle2,
        label: 'Completion Rate',
        value: metrics.completionRate.toFixed(1),
        unit: '%',
        trend: '+5.2% from last week',
      },
      {
        icon: Clock,
        label: 'Avg Completion Time',
        value: formatTime(metrics.averageCompletionTime),
        unit: '',
        trend: '-15 min improvement',
      },
      {
        icon: AlertCircle,
        label: 'Overdue Tasks',
        value: metrics.overdueTasks,
        unit: 'tasks',
        trend: '-2 from yesterday',
      },
      {
        icon: BarChart3,
        label: 'Photo Requirements',
        value: metrics.photoRequirementsMet,
        unit: '%',
        trend: '+3% compliance',
      },
    ],
    [metrics]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Task Performance Analytics</h1>
        <p className="text-gray-600 mt-2">Track team productivity and task completion metrics</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Worker Productivity */}
      <Card>
        <CardHeader>
          <CardTitle>Worker Productivity</CardTitle>
          <CardDescription>Performance metrics by team member</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {metrics.workerProductivity.map((worker) => (
              <div key={worker.workerId} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium">{worker.workerName}</h4>
                  <p className="text-sm text-gray-600">{worker.tasksCompleted} tasks completed</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatTime(worker.averageTime)}</p>
                    <p className="text-xs text-gray-600">avg time</p>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">{worker.completionRate}%</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Task Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Task Trends (Last 7 Days)</CardTitle>
          <CardDescription>Daily task completion and pending status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {metrics.taskTrends.map((trend) => (
              <div key={trend.date} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium">{new Date(trend.date).toLocaleDateString()}</h4>
                  <div className="flex gap-4 mt-2">
                    <span className="text-sm">
                      <span className="text-green-600 font-medium">{trend.completed}</span> completed
                    </span>
                    <span className="text-sm">
                      <span className="text-yellow-600 font-medium">{trend.pending}</span> pending
                    </span>
                    <span className="text-sm">
                      <span className="text-red-600 font-medium">{trend.overdue}</span> overdue
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  {Array(trend.completed)
                    .fill(0)
                    .map((_, i) => (
                      <div key={`c${i}`} className="w-2 h-8 bg-green-500 rounded-sm" />
                    ))}
                  {Array(trend.pending)
                    .fill(0)
                    .map((_, i) => (
                      <div key={`p${i}`} className="w-2 h-8 bg-yellow-500 rounded-sm" />
                    ))}
                  {Array(trend.overdue)
                    .fill(0)
                    .map((_, i) => (
                      <div key={`o${i}`} className="w-2 h-8 bg-red-500 rounded-sm" />
                    ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">Total Tasks</p>
              <p className="text-3xl font-bold mt-2">{metrics.totalTasks}</p>
              <p className="text-xs text-gray-500 mt-2">
                {metrics.completedTasks} completed • {metrics.pendingTasks} pending
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">Team Size</p>
              <p className="text-3xl font-bold mt-2">{metrics.workerProductivity.length}</p>
              <p className="text-xs text-gray-500 mt-2">Active field workers</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">Efficiency Score</p>
              <p className="text-3xl font-bold mt-2">
                {Math.round((metrics.completionRate * metrics.photoRequirementsMet) / 100)}
              </p>
              <p className="text-xs text-gray-500 mt-2">Overall performance</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
