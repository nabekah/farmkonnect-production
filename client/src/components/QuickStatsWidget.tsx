import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";
import {
  Tractor,
  Sprout,
  CheckCircle2,
  AlertCircle,
  Beef,
  Droplet,
} from "lucide-react";

interface QuickStatsWidgetProps {
  refreshInterval?: number; // in milliseconds, default 30000 (30 seconds)
}

export function QuickStatsWidget({ refreshInterval = 30000 }: QuickStatsWidgetProps = {}) {
  const { data: stats, isLoading, refetch } = trpc.dashboard.getQuickStats.useQuery(undefined, {
    refetchInterval: refreshInterval,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  // Set up polling interval
  useEffect(() => {
    if (refreshInterval <= 0) return; // Disable polling if interval is 0 or negative
    
    const interval = setInterval(() => {
      refetch();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval, refetch]);

  if (!stats) {
    return null;
  }

  const statItems = [
    {
      label: "Total Farms",
      value: stats.totalFarms,
      icon: Tractor,
      color: "bg-blue-100 text-blue-600",
    },
    {
      label: "Farm Area (ha)",
      value: stats.totalFarmArea.toFixed(2),
      icon: Droplet,
      color: "bg-green-100 text-green-600",
    },
    {
      label: "Active Crops",
      value: stats.activeCrops,
      icon: Sprout,
      color: "bg-emerald-100 text-emerald-600",
    },
    {
      label: "Pending Tasks",
      value: stats.pendingTasks,
      icon: CheckCircle2,
      color: "bg-yellow-100 text-yellow-600",
    },
    {
      label: "Weather Alerts",
      value: stats.weatherAlerts,
      icon: AlertCircle,
      color: "bg-orange-100 text-orange-600",
    },
    {
      label: "Livestock",
      value: stats.livestockCount,
      icon: Beef,
      color: "bg-purple-100 text-purple-600",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Auto-refreshing every {(refreshInterval / 1000).toFixed(0)}s
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {statItems.map((item) => {
        const IconComponent = item.icon;
        return (
          <Card key={item.label} className="hover:shadow-lg transition-shadow animate-in fade-in">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {item.label}
                </CardTitle>
                <div className={`p-2 rounded-lg ${item.color} transition-all`}>
                  <IconComponent className="h-5 w-5" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-white transition-all duration-300">
                {item.value}
              </div>
            </CardContent>
          </Card>
        );
      })}
      </div>
    </div>
  );
}
