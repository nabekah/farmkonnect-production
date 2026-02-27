'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { Users, ListTodo, Calendar, TrendingUp, Bell, BarChart3, AlertCircle, Layers } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';

interface MetricCard {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
}

export const LaborManagementDashboard = () => {
  const { user } = useAuth();
  const farmId = user?.farmId || 1;

  // Fetch labor management metrics
  const { data: taskStats } = trpc.taskAssignmentDatabase.getTaskStats.useQuery({ farmId });
  const { data: shiftStats } = trpc.shiftManagement?.getShiftStats?.useQuery?.({ farmId }) || { data: null };
  const { data: workerStats } = trpc.workerManagement?.getWorkerStats?.useQuery?.({ farmId }) || { data: null };

  const metrics: MetricCard[] = [
    {
      title: 'Pending Tasks',
      value: taskStats?.pending || 0,
      icon: <ListTodo className="w-6 h-6" />,
      color: 'text-yellow-600'
    },
    {
      title: 'In Progress',
      value: taskStats?.inProgress || 0,
      icon: <Clock className="w-6 h-6" />,
      color: 'text-blue-600'
    },
    {
      title: 'Completed Tasks',
      value: taskStats?.completed || 0,
      icon: <CheckCircle className="w-6 h-6" />,
      color: 'text-green-600'
    },
    {
      title: 'Scheduled Shifts',
      value: shiftStats?.scheduled || 0,
      icon: <Calendar className="w-6 h-6" />,
      color: 'text-purple-600'
    },
    {
      title: 'Active Workers',
      value: workerStats?.active || 0,
      icon: <Users className="w-6 h-6" />,
      color: 'text-indigo-600'
    },
    {
      title: 'Compliance Alerts',
      value: workerStats?.complianceAlerts || 0,
      icon: <AlertCircle className="w-6 h-6" />,
      color: 'text-red-600'
    }
  ];

  const quickLinks = [
    { label: 'Task Assignment', path: '/task-assignment', icon: <ListTodo className="w-4 h-4" /> },
    { label: 'Shift Management', path: '/shift-management', icon: <Calendar className="w-4 h-4" /> },
    { label: 'Worker Directory', path: '/labor-management', icon: <Users className="w-4 h-4" /> },
    { label: 'Performance Trends', path: '/performance-trends', icon: <TrendingUp className="w-4 h-4" /> },
    { label: 'Bulk Assignment', path: '/bulk-shift-assignment', icon: <Layers className="w-4 h-4" /> },
    { label: 'Notifications', path: '/notification-preferences', icon: <Bell className="w-4 h-4" /> },
    { label: 'Analytics', path: '/notification-analytics', icon: <BarChart3 className="w-4 h-4" /> },
    { label: 'Compliance', path: '/labor/compliance-dashboard', icon: <AlertCircle className="w-4 h-4" /> }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Labor Management Dashboard</h1>
        <p className="text-muted-foreground mt-2">Manage workforce, tasks, shifts, and compliance</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((metric, index) => (
          <Card key={index}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {metric.title}
                </CardTitle>
                <div className={metric.color}>{metric.icon}</div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Links</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {quickLinks.map((link) => (
              <Link key={link.path} href={link.path}>
                <a>
                  <Button variant="outline" className="w-full justify-start gap-2">
                    {link.icon}
                    {link.label}
                  </Button>
                </a>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b">
              <div>
                <p className="font-medium">Task Assignment</p>
                <p className="text-sm text-muted-foreground">3 new tasks assigned today</p>
              </div>
              <span className="text-sm text-muted-foreground">2 hours ago</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <div>
                <p className="font-medium">Shift Scheduling</p>
                <p className="text-sm text-muted-foreground">5 shifts scheduled for next week</p>
              </div>
              <span className="text-sm text-muted-foreground">4 hours ago</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium">Worker Performance</p>
                <p className="text-sm text-muted-foreground">2 workers marked as high performers</p>
              </div>
              <span className="text-sm text-muted-foreground">1 day ago</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

import { Clock, CheckCircle } from 'lucide-react';

export default LaborManagementDashboard;
