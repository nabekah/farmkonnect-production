import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { AlertCircle, Users, Settings, RefreshCw, Save } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/contexts/ToastContext";

export function RateLimitConfiguration() {
  const { showToast } = useToast();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedTier, setSelectedTier] = useState<"free" | "pro" | "enterprise">("free");
  const [autoRefresh, setAutoRefresh] = useState(true);

  const defaultLimitsQuery = trpc.apiRateLimiting.getDefaultLimits.useQuery();
  const endpointLimitsQuery = trpc.apiRateLimiting.getEndpointLimits.useQuery();
  const userTiersQuery = trpc.apiRateLimiting.getAllUserTiers.useQuery(
    { limit: 100, offset: 0 },
    { refetchInterval: autoRefresh ? 60000 : false }
  );

  const globalStatsQuery = trpc.apiRateLimiting.getGlobalStatistics.useQuery(undefined, {
    refetchInterval: autoRefresh ? 30000 : false,
  });

  const setUserTierMutation = trpc.apiRateLimiting.setUserTier.useMutation();

  const defaultLimits = defaultLimitsQuery.data;
  const endpointLimits = endpointLimitsQuery.data;
  const userTiers = userTiersQuery.data || [];
  const globalStats = globalStatsQuery.data;

  const handleSetTier = async () => {
    if (!selectedUserId) {
      showToast({
        type: "error",
        title: "Error",
        message: "Please select a user",
      });
      return;
    }

    try {
      await setUserTierMutation.mutateAsync({
        userId: selectedUserId,
        tier: selectedTier,
      });

      showToast({
        type: "success",
        title: "Success",
        message: `User tier updated to ${selectedTier}`,
      });

      userTiersQuery.refetch();
      setSelectedUserId(null);
    } catch (error: any) {
      showToast({
        type: "error",
        title: "Error",
        message: error.message || "Failed to update user tier",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Rate Limit Configuration</h2>
          <p className="text-gray-600 text-sm mt-1">Manage API rate limits and user tiers</p>
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
              userTiersQuery.refetch();
              globalStatsQuery.refetch();
            }}
            disabled={userTiersQuery.isRefetching}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Global Statistics */}
      {globalStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Total Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{globalStats.totalRequests}</div>
              <p className="text-xs text-gray-600 mt-1">Last hour</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Unique Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{globalStats.uniqueUsers}</div>
              <p className="text-xs text-gray-600 mt-1">Active users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Avg Response Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{globalStats.averageResponseTime}ms</div>
              <p className="text-xs text-gray-600 mt-1">Average latency</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Error Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${globalStats.errorRate > 5 ? "text-red-600" : "text-green-600"}`}>
                {globalStats.errorRate.toFixed(2)}%
              </div>
              <p className="text-xs text-gray-600 mt-1">Last hour</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Default Limits */}
      {defaultLimits && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Default Rate Limits
            </CardTitle>
            <CardDescription>Requests per minute by user tier</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg border">
                <h3 className="font-semibold text-gray-900 mb-2">Free Tier</h3>
                <p className="text-3xl font-bold text-gray-600">{defaultLimits.free}</p>
                <p className="text-sm text-gray-600 mt-2">requests/minute</p>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-2">Pro Tier</h3>
                <p className="text-3xl font-bold text-blue-600">{defaultLimits.pro}</p>
                <p className="text-sm text-blue-600 mt-2">requests/minute</p>
              </div>

              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <h3 className="font-semibold text-purple-900 mb-2">Enterprise Tier</h3>
                <p className="text-3xl font-bold text-purple-600">{defaultLimits.enterprise}</p>
                <p className="text-sm text-purple-600 mt-2">requests/minute</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Set User Tier */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Set User Tier
          </CardTitle>
          <CardDescription>Change a user's rate limit tier</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">User ID</label>
              <input
                type="number"
                value={selectedUserId || ""}
                onChange={(e) => setSelectedUserId(e.target.value ? parseInt(e.target.value) : null)}
                placeholder="Enter user ID"
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">New Tier</label>
              <select
                value={selectedTier}
                onChange={(e) => setSelectedTier(e.target.value as any)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              >
                <option value="free">Free</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>

            <div className="flex items-end">
              <Button
                onClick={handleSetTier}
                disabled={setUserTierMutation.isPending || !selectedUserId}
                className="w-full"
              >
                <Save className="w-4 h-4 mr-2" />
                Update Tier
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Endpoint-Specific Limits */}
      {endpointLimits && Object.keys(endpointLimits).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Endpoint-Specific Limits</CardTitle>
            <CardDescription>Special rate limits for sensitive endpoints</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="text-left py-2 px-3">Endpoint</th>
                    <th className="text-center py-2 px-3">Free</th>
                    <th className="text-center py-2 px-3">Pro</th>
                    <th className="text-center py-2 px-3">Enterprise</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(endpointLimits).map(([endpoint, limits]) => (
                    <tr key={endpoint} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-3 font-mono text-xs">{endpoint}</td>
                      <td className="py-2 px-3 text-center">{limits.free}</td>
                      <td className="py-2 px-3 text-center text-blue-600 font-semibold">{limits.pro}</td>
                      <td className="py-2 px-3 text-center text-purple-600 font-semibold">{limits.enterprise}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* User Tiers */}
      <Card>
        <CardHeader>
          <CardTitle>User Tiers</CardTitle>
          <CardDescription>Current tier assignments for users</CardDescription>
        </CardHeader>
        <CardContent>
          {userTiers.length === 0 ? (
            <p className="text-gray-600 text-sm text-center py-8">No custom tier assignments</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="text-left py-2 px-3">User ID</th>
                    <th className="text-left py-2 px-3">Tier</th>
                    <th className="text-left py-2 px-3">Assigned At</th>
                  </tr>
                </thead>
                <tbody>
                  {userTiers.map((tier, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-3 font-mono">{tier.userId}</td>
                      <td className="py-2 px-3">
                        <span
                          className={`text-xs px-2 py-1 rounded capitalize font-semibold ${
                            tier.tier === "free"
                              ? "bg-gray-100 text-gray-800"
                              : tier.tier === "pro"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-purple-100 text-purple-800"
                          }`}
                        >
                          {tier.tier}
                        </span>
                      </td>
                      <td className="py-2 px-3">{new Date(tier.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Box */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <AlertCircle className="w-5 h-5" />
            Rate Limiting Best Practices
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-blue-900">
          <p>• Monitor endpoint-specific limits for security-sensitive operations (login, registration, IP management)</p>
          <p>• Upgrade users to higher tiers when they consistently hit rate limits</p>
          <p>• Use endpoint-specific limits to prevent abuse of expensive operations</p>
          <p>• Review error rates regularly to identify problematic endpoints or users</p>
          <p>• Consider temporary tier upgrades for users during high-traffic periods</p>
        </CardContent>
      </Card>
    </div>
  );
}
