import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Loader2, Tractor, Sprout, CheckCircle2, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface RecentActivitiesWidgetProps {
  refreshInterval?: number; // in milliseconds, default 30000 (30 seconds)
}

export function RecentActivitiesWidget({ refreshInterval = 30000 }: RecentActivitiesWidgetProps = {}) {
  const { data: activities, isLoading, refetch } = trpc.dashboard.getRecentActivities.useQuery(undefined, {
    refetchInterval: refreshInterval,
  });

  // Set up polling interval
  useEffect(() => {
    if (refreshInterval <= 0) return; // Disable polling if interval is 0 or negative
    
    const interval = setInterval(() => {
      refetch();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval, refetch]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Activities</CardTitle>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Auto-refreshing every {(refreshInterval / 1000).toFixed(0)}s
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 dark:text-gray-400">No recent activities</p>
        </CardContent>
      </Card>
    );
  }

  const getIconForActivity = (type: string) => {
    switch (type) {
      case "farm_registration":
        return Tractor;
      case "crop_planting":
        return Sprout;
      case "task_completion":
        return CheckCircle2;
      case "weather_alert":
        return AlertCircle;
      default:
        return AlertCircle;
    }
  };

  const getColorForActivity = (type: string) => {
    switch (type) {
      case "farm_registration":
        return "bg-blue-100 text-blue-600";
      case "crop_planting":
        return "bg-green-100 text-green-600";
      case "task_completion":
        return "bg-emerald-100 text-emerald-600";
      case "weather_alert":
        return "bg-orange-100 text-orange-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Recent Activities</CardTitle>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Auto-refreshing every {(refreshInterval / 1000).toFixed(0)}s
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => {
            const IconComponent = getIconForActivity(activity.type);
            const colorClass = getColorForActivity(activity.type);
            const timeAgo = formatDistanceToNow(new Date(activity.timestamp), {
              addSuffix: true,
            });

            return (
              <div
                key={activity.id}
                className="flex items-start gap-4 pb-4 border-b last:border-b-0 last:pb-0 animate-in fade-in"
              >
                <div className={`p-2 rounded-lg ${colorClass} flex-shrink-0 transition-all`}>
                  <IconComponent className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white truncate">
                    {activity.title}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {activity.description}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {timeAgo}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
