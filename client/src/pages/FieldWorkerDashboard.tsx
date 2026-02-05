import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Clock, CheckCircle2, AlertTriangle, MapPin, Camera, Plus } from 'lucide-react';
import { useLocation } from 'wouter';

interface DashboardWidget {
  id: string;
  title: string;
  visible: boolean;
}

export function FieldWorkerDashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [farmId, setFarmId] = useState<number | null>(null);
  const [isClockingIn, setIsClockingIn] = useState(false);
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [clockInTime, setClockInTime] = useState<Date | null>(null);

  // Get dashboard data
  const dashboardQuery = trpc.fieldWorker.getDashboardData.useQuery(
    { farmId: farmId || 0 },
    { enabled: !!farmId, refetchInterval: 30000 } // Refetch every 30 seconds
  );

  // Clock in/out mutations
  const clockInMutation = trpc.fieldWorker.clockIn.useMutation({
    onSuccess: () => {
      dashboardQuery.refetch();
    },
  });
  const clockOutMutation = trpc.fieldWorker.clockOut.useMutation({
    onSuccess: () => {
      dashboardQuery.refetch();
    },
  });

  useEffect(() => {
    // Get user's farm ID from profile or use default
    if (user?.id) {
      // TODO: Fetch actual farm ID from user profile
      setFarmId(1); // Placeholder - replace with actual farm ID from user profile
    }
  }, [user]);

  // Update work duration every second when clocked in
  useEffect(() => {
    if (!isClockedIn) return;
    const interval = setInterval(() => {
      // Force component re-render to update duration
    }, 1000);
    return () => clearInterval(interval);
  }, [isClockedIn, clockInTime]);

  const handleClockIn = async () => {
    if (!farmId) return;
    setIsClockingIn(true);
    try {
      await clockInMutation.mutateAsync({ farmId });
      setIsClockedIn(true);
      setClockInTime(new Date());
    } catch (error) {
      console.error('Clock in failed:', error);
    } finally {
      setIsClockingIn(false);
    }
  };

  const handleClockOut = async () => {
    if (!farmId) return;
    setIsClockingIn(true);
    try {
      await clockOutMutation.mutateAsync({ farmId });
      setIsClockedIn(false);
      setClockInTime(null);
    } catch (error) {
      console.error('Clock out failed:', error);
    } finally {
      setIsClockingIn(false);
    }
  };

  const [, setForceUpdate] = useState(0);

  const calculateWorkDuration = () => {
    if (!clockInTime) return '0h 0m';
    const now = new Date();
    const diffMs = now.getTime() - clockInTime.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  // Force update every second for duration display
  useEffect(() => {
    if (!isClockedIn) return;
    const interval = setInterval(() => {
      setForceUpdate((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isClockedIn]);

  if (!farmId) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Field Worker Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user?.name || 'Field Worker'}</p>
      </div>

      {/* Quick Actions Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Button
          onClick={isClockedIn ? handleClockOut : handleClockIn}
          disabled={isClockingIn}
          className={`h-16 text-lg font-semibold ${
            isClockedIn
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-green-500 hover:bg-green-600'
          }`}
        >
          <Clock className="mr-2 h-5 w-5" />
          {isClockedIn ? 'Clock Out' : 'Clock In'}
        </Button>

        <Button
          onClick={() => navigate('/field-worker/activity-log')}
          variant="outline"
          className="h-16 text-lg font-semibold"
        >
          <Plus className="mr-2 h-5 w-5" />
          Log Activity
        </Button>

        <Button
          onClick={() => navigate('/field-worker/tasks')}
          variant="outline"
          className="h-16 text-lg font-semibold"
        >
          <CheckCircle2 className="mr-2 h-5 w-5" />
          View Tasks
        </Button>

        <Button
          onClick={() => navigate('/field-worker/photos')}
          variant="outline"
          className="h-16 text-lg font-semibold"
        >
          <Camera className="mr-2 h-5 w-5" />
          Upload Photo
        </Button>
      </div>

      {/* Work Hours Widget */}
      <Card className="mb-8 border-l-4 border-l-blue-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Work Hours Today
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Current Duration</p>
              <p className="text-3xl font-bold text-foreground">
                {isClockedIn ? calculateWorkDuration() : '0h 0m'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Status</p>
              <Badge className={isClockedIn ? 'bg-green-500' : 'bg-gray-500'}>
                {isClockedIn ? 'Clocked In' : 'Clocked Out'}
              </Badge>
            </div>
          </div>
          {dashboardQuery.data?.workHoursToday && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">Total Today</p>
              <p className="text-2xl font-semibold text-foreground">
                {dashboardQuery.data.workHoursToday.hours}h {dashboardQuery.data.workHoursToday.minutes}m
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Tasks Widget */}
      <Card className="mb-8 border-l-4 border-l-orange-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Pending Tasks ({dashboardQuery.data?.pendingTasks.length || 0})
          </CardTitle>
          <CardDescription>Tasks due today and upcoming</CardDescription>
        </CardHeader>
        <CardContent>
          {dashboardQuery.isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading tasks...</div>
          ) : dashboardQuery.data?.pendingTasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No pending tasks</div>
          ) : (
            <div className="space-y-3">
              {dashboardQuery.data?.pendingTasks.slice(0, 5).map((task: any) => (
                <div
                  key={task.id}
                  className="flex items-start justify-between p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors cursor-pointer"
                  onClick={() => navigate(`/field-worker/tasks/${task.id}`)}
                >
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{task.title}</p>
                    <p className="text-sm text-muted-foreground">{task.description}</p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {task.taskType}
                      </Badge>
                      <Badge
                        className={`text-xs ${
                          task.priority === 'high'
                            ? 'bg-red-500'
                            : task.priority === 'medium'
                            ? 'bg-yellow-500'
                            : 'bg-blue-500'
                        }`}
                      >
                        {task.priority}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-xs text-muted-foreground">
                      {new Date(task.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Button
            variant="ghost"
            className="w-full mt-4"
            onClick={() => navigate('/field-worker/tasks')}
          >
            View All Tasks →
          </Button>
        </CardContent>
      </Card>

      {/* Recent Activities Widget */}
      <Card className="mb-8 border-l-4 border-l-green-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            Recent Activities
          </CardTitle>
          <CardDescription>Your latest logged activities</CardDescription>
        </CardHeader>
        <CardContent>
          {dashboardQuery.isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading activities...</div>
          ) : dashboardQuery.data?.recentActivities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No recent activities</div>
          ) : (
            <div className="space-y-3">
              {dashboardQuery.data?.recentActivities.slice(0, 5).map((activity: any) => (
                <div
                  key={activity.id}
                  className="flex items-start justify-between p-3 bg-muted rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{activity.title}</p>
                    <p className="text-sm text-muted-foreground">{activity.activityType}</p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-xs text-muted-foreground">
                      {new Date(activity.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Button
            variant="ghost"
            className="w-full mt-4"
            onClick={() => navigate('/field-worker/activities')}
          >
            View All Activities →
          </Button>
        </CardContent>
      </Card>

      {/* Weather Widget */}
      <Card className="border-l-4 border-l-purple-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Weather & Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Weather integration coming soon
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
