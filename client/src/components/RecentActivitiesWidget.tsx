import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Loader2, Tractor, Sprout, CheckCircle2, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export function RecentActivitiesWidget() {
  const { data: activities, isLoading } = trpc.dashboard.getRecentActivities.useQuery();

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
          <CardTitle>Recent Activities</CardTitle>
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
        <CardTitle>Recent Activities</CardTitle>
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
                className="flex items-start gap-4 pb-4 border-b last:border-b-0 last:pb-0"
              >
                <div className={`p-2 rounded-lg ${colorClass} flex-shrink-0`}>
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
