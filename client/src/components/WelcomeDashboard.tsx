import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminAnalyticsDashboard } from "./AdminAnalyticsDashboard";
import { QuickStatsWidget } from "./QuickStatsWidget";
import { RecentActivitiesWidget } from "./RecentActivitiesWidget";
import { BarChart3, TrendingUp, Activity } from "lucide-react";

export function WelcomeDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome to FarmKonnect
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Your comprehensive farm management dashboard
        </p>
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
            <QuickStatsWidget />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Recent Activities
            </h2>
            <RecentActivitiesWidget />
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <AdminAnalyticsDashboard />
        </TabsContent>

        <TabsContent value="activities" className="space-y-6">
          <RecentActivitiesWidget />
        </TabsContent>
      </Tabs>
    </div>
  );
}
