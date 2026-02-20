import { useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { AdminAnalyticsDashboard } from "./AdminAnalyticsDashboard";
import { QuickStatsWidget } from "./QuickStatsWidget";
import { RecentActivitiesWidget } from "./RecentActivitiesWidget";
import { useDashboardPreferences } from "@/hooks/useDashboardPreferences";
import { BarChart3, TrendingUp, Activity, RefreshCw, Pause, Play } from "lucide-react";

export function WelcomeDashboard() {
  const { preferences, isLoaded, setRefreshInterval, togglePolling } = useDashboardPreferences();

  // Use stored preferences or defaults
  const isPollingEnabled = preferences.isPollingEnabled ?? true;
  const refreshInterval = preferences.refreshInterval ?? 30000;

  const handleRefreshIntervalChange = (interval: number) => {
    setRefreshInterval(interval);
  };

  const handleTogglePolling = () => {
    togglePolling();
  };

  // Show loading state while preferences are being loaded
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard preferences...</p>
        </div>
      </div>
    );
  }

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
            onClick={handleTogglePolling}
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
            {[10, 30, 60].map((seconds) => {
              const intervalMs = seconds * 1000;
              return (
                <Button
                  key={seconds}
                  variant={refreshInterval === intervalMs ? "default" : "ghost"}
                  size="sm"
                  onClick={() => handleRefreshIntervalChange(intervalMs)}
                  className="text-xs"
                  disabled={!isPollingEnabled}
                  title={`Set refresh interval to ${seconds} seconds`}
                >
                  {seconds}s
                </Button>
              );
            })}
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
