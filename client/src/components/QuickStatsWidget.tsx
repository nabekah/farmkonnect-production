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

export function QuickStatsWidget() {
  const { data: stats, isLoading } = trpc.dashboard.getQuickStats.useQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {statItems.map((item) => {
        const IconComponent = item.icon;
        return (
          <Card key={item.label} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {item.label}
                </CardTitle>
                <div className={`p-2 rounded-lg ${item.color}`}>
                  <IconComponent className="h-5 w-5" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {item.value}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
