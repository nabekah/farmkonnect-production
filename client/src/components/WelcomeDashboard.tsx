import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { AdminAnalyticsDashboard } from "./AdminAnalyticsDashboard";
import { QuickStatsWidget } from "./QuickStatsWidget";
import { RecentActivitiesWidget } from "./RecentActivitiesWidget";
import { BarChart3, TrendingUp, Activity, RefreshCw, Pause, Play } from "lucide-react";

export function WelcomeDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [isPollingEnabled, setIsPollingEnabled] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds default

  const handleRefreshIntervalChange = (interval: number) => {
    setRefreshInterval(interval);
  };

  const togglePolling = () => {
    setIsPollingEnabled(!isPollingEnabled);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome to FarmKonnect
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Your comprehensive farm management dashboard
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={togglePolling}
            className="gap-2"
            title={isPollingEnabled ? "Pause auto-refresh" : "Resume auto-refresh"}
          >
            {isPollingEnabled ? (
              <>
                <Pause className="h-4 w-4" />
                <span className="hidden sm:inline">Pause</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                <span className="hidden sm:inline">Resume</span>
              </>
            )}
          </Button>
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {[10, 30, 60].map((seconds) => (
              <Button
                key={seconds}
                variant={refreshInterval === seconds * 1000 ? "default" : "ghost"}
                size="sm"
                onClick={() => handleRefreshIntervalChange(seconds * 1000)}
                className="text-xs"
                disabled={!isPollingEnabled}
              >
                {seconds}s
              </Button>
            ))}
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="activities" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Activities</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Quick Stats
            </h2>
            <QuickStatsWidget refreshInterval={isPollingEnabled ? refreshInterval : 0} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Recent Activities
            </h2>
            <RecentActivitiesWidget refreshInterval={isPollingEnabled ? refreshInterval : 0} />
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <AdminAnalyticsDashboard />
        </TabsContent>

        <TabsContent value="activities" className="space-y-6">
          <RecentActivitiesWidget refreshInterval={isPollingEnabled ? refreshInterval : 0} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
