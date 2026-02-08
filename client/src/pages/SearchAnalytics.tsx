import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Search, BarChart3, Zap } from "lucide-react";

export function SearchAnalytics() {
  const [selectedPeriod, setSelectedPeriod] = useState("30");
  const [cacheStats, setCacheStats] = useState<any>(null);

  // Fetch trending searches
  const { data: trendingData, isLoading: trendingLoading } = trpc.search.getTrendingSearches.useQuery({
    limit: 10,
  });

  // Fetch popular searches
  const { data: popularData, isLoading: popularLoading } = trpc.search.getPopularSearches.useQuery({
    limit: 10,
  });

  // Fetch user analytics
  const { data: analyticsData, isLoading: analyticsLoading } = trpc.search.getAnalytics.useQuery({
    days: parseInt(selectedPeriod),
  });

  // Fetch cache stats
  const { data: cacheData, isLoading: cacheLoading } = trpc.search.getCacheStats.useQuery();

  useEffect(() => {
    if (cacheData?.success) {
      setCacheStats(cacheData.stats);
    }
  }, [cacheData]);

  const trendingChartData = trendingData?.trending || [];
  const popularChartData = popularData?.popular || [];
  const analyticsMetrics = analyticsData?.metrics || {};

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Search Analytics</h1>
          <p className="text-gray-500 mt-2">Monitor search performance and user behavior</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Searches</CardTitle>
            <Search className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsMetrics.totalSearches || 0}</div>
            <p className="text-xs text-gray-500">Last {selectedPeriod} days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Click-Through Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(analyticsMetrics.clickThroughRate || 0).toFixed(1)}%
            </div>
            <p className="text-xs text-gray-500">{analyticsMetrics.totalClicks || 0} clicks</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Results</CardTitle>
            <BarChart3 className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(analyticsMetrics.avgResultCount || 0).toFixed(1)}
            </div>
            <p className="text-xs text-gray-500">Per search</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
            <Zap className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {cacheStats ? ((cacheStats.validEntries / (cacheStats.totalEntries || 1)) * 100).toFixed(1) : 0}%
            </div>
            <p className="text-xs text-gray-500">{cacheStats?.validEntries || 0} cached</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trending Searches */}
        <Card>
          <CardHeader>
            <CardTitle>Trending Searches</CardTitle>
            <CardDescription>Top searches in the last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            {trendingLoading ? (
              <div className="h-64 flex items-center justify-center">Loading...</div>
            ) : trendingChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={trendingChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="query" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="searchCount" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">No trending data</div>
            )}
          </CardContent>
        </Card>

        {/* Popular Searches */}
        <Card>
          <CardHeader>
            <CardTitle>Popular Searches</CardTitle>
            <CardDescription>Most searched queries overall</CardDescription>
          </CardHeader>
          <CardContent>
            {popularLoading ? (
              <div className="h-64 flex items-center justify-center">Loading...</div>
            ) : popularChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={popularChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="query" type="category" width={100} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">No popular data</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cache Statistics */}
      {cacheStats && (
        <Card>
          <CardHeader>
            <CardTitle>Cache Performance</CardTitle>
            <CardDescription>Search result caching statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">Total Entries</p>
                <p className="text-2xl font-bold">{cacheStats.totalEntries}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Valid Entries</p>
                <p className="text-2xl font-bold text-green-600">{cacheStats.validEntries}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Memory Usage</p>
                <p className="text-2xl font-bold">{cacheStats.memoryUsage}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Period Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Analytics Period</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {["7", "30", "90"].map((period) => (
              <Button
                key={period}
                variant={selectedPeriod === period ? "default" : "outline"}
                onClick={() => setSelectedPeriod(period)}
              >
                Last {period} Days
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
