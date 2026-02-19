import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { AlertCircle, Lock, RefreshCw, Trash2, TrendingUp } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/contexts/ToastContext";

export function RateLimitingDashboard() {
  const { showToast } = useToast();
  const [autoRefresh, setAutoRefresh] = useState(true);

  const statsQuery = trpc.rateLimiting.getStats.useQuery(undefined, {
    refetchInterval: autoRefresh ? 30000 : false, // Refresh every 30 seconds
  });

  const clearAllMutation = trpc.rateLimiting.clearAll.useMutation();

  const handleClearAll = async () => {
    if (!window.confirm("Are you sure you want to clear all rate limits? This should only be done in emergencies.")) {
      return;
    }

    try {
      await clearAllMutation.mutateAsync();
      showToast({
        type: "success",
        title: "Rate Limits Cleared",
        message: "All rate limits have been cleared",
      });
      statsQuery.refetch();
    } catch (error: any) {
      showToast({
        type: "error",
        title: "Error",
        message: error.message || "Failed to clear rate limits",
      });
    }
  };

  if (statsQuery.isLoading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  const stats = statsQuery.data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Rate Limiting Dashboard</h2>
          <p className="text-gray-600 text-sm mt-1">Monitor and manage login and 2FA rate limits</p>
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
            onClick={() => statsQuery.refetch()}
            disabled={statsQuery.isRefetching}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Active Rate Limit Keys
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{stats.totalKeys}</div>
              <p className="text-xs text-gray-600 mt-1">IP/Email combinations being tracked</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Locked Accounts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{stats.lockedAccounts}</div>
              <p className="text-xs text-gray-600 mt-1">Accounts currently locked</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Rate Limiting Information */}
      <Card>
        <CardHeader>
          <CardTitle>Rate Limiting Configuration</CardTitle>
          <CardDescription>Current rate limiting rules</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-sm mb-2">Login Rate Limiting</h3>
              <ul className="text-sm space-y-1 text-gray-700">
                <li>• Max attempts: 5 failed logins</li>
                <li>• Time window: 15 minutes</li>
                <li>• Lockout duration: 15 minutes</li>
                <li>• Tracked by: Email + IP address</li>
              </ul>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-sm mb-2">2FA Rate Limiting</h3>
              <ul className="text-sm space-y-1 text-gray-700">
                <li>• Max attempts: 5 failed codes</li>
                <li>• Time window: 10 minutes</li>
                <li>• Lockout duration: 10 minutes</li>
                <li>• Tracked by: User ID + IP address</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Alert */}
      {stats && stats.lockedAccounts > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-900">
              <AlertCircle className="w-5 h-5" />
              Active Account Lockouts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-yellow-800 mb-4">
              {stats.lockedAccounts} account{stats.lockedAccounts !== 1 ? "s" : ""} are currently locked due to too many failed attempts.
              They will automatically unlock after the lockout period expires.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearAll}
              disabled={clearAllMutation.isPending}
              className="text-yellow-900 border-yellow-300 hover:bg-yellow-100"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {clearAllMutation.isPending ? "Clearing..." : "Clear All Lockouts (Emergency)"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Best Practices */}
      <Card>
        <CardHeader>
          <CardTitle>Security Best Practices</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex gap-3">
            <div className="text-green-600 font-bold">✓</div>
            <div>
              <p className="font-semibold">Monitor Failed Attempts</p>
              <p className="text-gray-600">Watch for patterns of failed login attempts that might indicate brute-force attacks</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="text-green-600 font-bold">✓</div>
            <div>
              <p className="font-semibold">Review Locked Accounts</p>
              <p className="text-gray-600">Investigate why accounts are being locked and help legitimate users regain access</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="text-green-600 font-bold">✓</div>
            <div>
              <p className="font-semibold">Use Audit Logs</p>
              <p className="text-gray-600">Check audit logs for suspicious patterns across multiple accounts or IP addresses</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="text-green-600 font-bold">✓</div>
            <div>
              <p className="font-semibold">Educate Users</p>
              <p className="text-gray-600">Inform users about rate limiting and encourage them to use strong passwords and 2FA</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
