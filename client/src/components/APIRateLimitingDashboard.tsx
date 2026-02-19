import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { AlertCircle, TrendingUp, Zap, Clock, Activity, RefreshCw } from "lucide-react";
import { trpc } from "@/lib/trpc";

export function APIRateLimitingDashboard() {
  const [autoRefresh, setAutoRefresh] = useState(true);

  const statusQuery = trpc.apiRateLimiting.getCurrentStatus.useQuery(undefined, {
    refetchInterval: autoRefresh ? 30000 : false,
  });

  const usageQuery = trpc.apiRateLimiting.getUserUsage.useQuery(undefined, {
    refetchInterval: autoRefresh ? 60000 : false,
  });

  const statsQuery = trpc.apiRateLimiting.getUserStatistics.useQuery(undefined, {
    refetchInterval: autoRefresh ? 30000 : false,
  });

  const status = statusQuery.data;
  const usage = usageQuery.data || [];
  const stats = statsQuery.data;

  const isLoading = statusQuery.isLoading || statsQuery.isLoading;

  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "free":
        return "text-gray-600 bg-gray-50";
      case "pro":
        return "text-blue-600 bg-blue-50";
      case "enterprise":
        return "text-purple-600 bg-purple-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case "free":
        return "bg-gray-100 text-gray-800";
      case "pro":
        return "bg-blue-100 text-blue-800";
      case "enterprise":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">API Rate Limiting</h2>
          <p className="text-gray-600 text-sm mt-1">Monitor your API usage and rate limits</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            Auto-refresh
          </label>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              statusQuery.refetch();
              usageQuery.refetch();
              statsQuery.refetch();
            }}
            disabled={statusQuery.isRefetching}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Tier and Limits */}
      {status && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className={getTierColor(status.tier)}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Your Tier</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold capitalize">{status.tier}</div>
                <span className={`text-xs px-3 py-1 rounded-full font-semibold ${getTierBadgeColor(status.tier)}`}>
                  {status.tier.toUpperCase()}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Requests per Minute
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{status.limits.default}</div>
              <p className="text-xs text-gray-600 mt-1">Current limit for your tier</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Total Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.totalRequests}</div>
              <p className="text-xs text-gray-600 mt-1">Last hour</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Avg Response
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.averageResponseTime}ms</div>
              <p className="text-xs text-gray-600 mt-1">Average latency</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Error Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stats.errorRate > 5 ? "text-red-600" : "text-green-600"}`}>
                {stats.errorRate.toFixed(2)}%
              </div>
              <p className="text-xs text-gray-600 mt-1">Last hour</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Top Endpoint
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm font-bold text-purple-600">
                {stats.topEndpoints.length > 0 ? stats.topEndpoints[0].endpoint : "N/A"}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {stats.topEndpoints.length > 0 ? `${stats.topEndpoints[0].count} requests` : "No data"}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Top Endpoints */}
      {stats && stats.topEndpoints.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Endpoints</CardTitle>
            <CardDescription>Your most frequently called endpoints</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.topEndpoints.map((endpoint, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="text-2xl font-bold text-gray-400">#{idx + 1}</div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{endpoint.endpoint}</p>
                      <p className="text-xs text-gray-600">{endpoint.count} requests</p>
                    </div>
                  </div>
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${(endpoint.count / stats.topEndpoints[0].count) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Usage */}
      <Card>
        <CardHeader>
          <CardTitle>Recent API Calls</CardTitle>
          <CardDescription>Your latest API requests</CardDescription>
        </CardHeader>
        <CardContent>
          {usage.length === 0 ? (
            <p className="text-gray-600 text-sm text-center py-8">No API calls yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="text-left py-2 px-3">Endpoint</th>
                    <th className="text-left py-2 px-3">Response Time</th>
                    <th className="text-left py-2 px-3">Status</th>
                    <th className="text-left py-2 px-3">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {usage.slice(0, 10).map((call, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-3 font-mono text-xs">{call.endpoint}</td>
                      <td className="py-2 px-3">{call.responseTime}ms</td>
                      <td className="py-2 px-3">
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            call.statusCode < 400
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {call.statusCode}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-gray-600">
                        {new Date(call.timestamp).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rate Limit Info */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <AlertCircle className="w-5 h-5" />
            Rate Limit Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-blue-900">
          <p>
            <strong>Free Tier:</strong> 60 requests per minute. Perfect for personal projects and testing.
          </p>
          <p>
            <strong>Pro Tier:</strong> 300 requests per minute. Ideal for small to medium applications.
          </p>
          <p>
            <strong>Enterprise Tier:</strong> 1,000 requests per minute. For high-traffic production systems.
          </p>
          <p className="mt-3">
            Some endpoints have stricter limits for security reasons (e.g., login, registration, IP management).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
