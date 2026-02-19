import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { AlertCircle, Download, RefreshCw, Filter, Search } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/contexts/ToastContext";

export function AuthenticationAuditLogViewer() {
  const { showToast } = useToast();
  const [filterType, setFilterType] = useState<string>("");
  const [searchIP, setSearchIP] = useState<string>("");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const statsQuery = trpc.auditLogging.getStatistics.useQuery(undefined, {
    refetchInterval: autoRefresh ? 60000 : false, // Refresh every 60 seconds
  });

  const criticalQuery = trpc.auditLogging.getRecentCriticalEvents.useQuery(
    { limit: 50 },
    { refetchInterval: autoRefresh ? 60000 : false }
  );

  const exportMutation = trpc.auditLogging.exportLogs.useMutation();

  const handleExport = async () => {
    try {
      const result = await exportMutation.mutateAsync({
        eventType: filterType || undefined,
      });

      // Create and download CSV file
      const element = document.createElement("a");
      element.setAttribute("href", `data:text/csv;charset=utf-8,${encodeURIComponent(result.csv)}`);
      element.setAttribute("download", result.fileName);
      element.style.display = "none";
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);

      showToast({
        type: "success",
        title: "Export Successful",
        message: `Audit logs exported to ${result.fileName}`,
      });
    } catch (error: any) {
      showToast({
        type: "error",
        title: "Export Failed",
        message: error.message || "Failed to export audit logs",
      });
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-300";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "low":
        return "bg-green-100 text-green-800 border-green-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getEventIcon = (eventType: string) => {
    if (eventType.includes("LOGIN")) return "🔐";
    if (eventType.includes("2FA")) return "🔑";
    if (eventType.includes("PASSWORD")) return "🔓";
    if (eventType.includes("SESSION")) return "📱";
    if (eventType.includes("SUSPICIOUS")) return "⚠️";
    return "📝";
  };

  if (statsQuery.isLoading || criticalQuery.isLoading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  const stats = statsQuery.data;
  const logs = criticalQuery.data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Authentication Audit Logs</h2>
          <p className="text-gray-600 text-sm mt-1">Monitor all authentication and security events</p>
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
            onClick={() => criticalQuery.refetch()}
            disabled={criticalQuery.isRefetching}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold">Critical Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.totalCriticalEvents}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold">Failed Logins</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.eventTypes.loginFailed}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold">2FA Failures</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.eventTypes.twoFAFailed}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold">Locked Accounts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.eventTypes.accountLocked}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold">Suspicious Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.eventTypes.suspiciousActivity}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold">Password Changes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.eventTypes.passwordChanged}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Export */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filters & Export
            </CardTitle>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? "Hide" : "Show"}
            </Button>
          </div>
        </CardHeader>

        {showFilters && (
          <CardContent className="space-y-4 border-t pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Event Type</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="">All Events</option>
                  <option value="LOGIN_SUCCESS">Login Success</option>
                  <option value="LOGIN_FAILED">Login Failed</option>
                  <option value="LOGIN_RATE_LIMITED">Login Rate Limited</option>
                  <option value="2FA_VERIFIED">2FA Verified</option>
                  <option value="2FA_FAILED">2FA Failed</option>
                  <option value="PASSWORD_CHANGED">Password Changed</option>
                  <option value="PASSWORD_RESET_REQUESTED">Password Reset Requested</option>
                  <option value="SUSPICIOUS_ACTIVITY_DETECTED">Suspicious Activity</option>
                  <option value="ACCOUNT_LOCKED">Account Locked</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">IP Address</label>
                <input
                  type="text"
                  value={searchIP}
                  onChange={(e) => setSearchIP(e.target.value)}
                  placeholder="Search by IP..."
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
            </div>

            <Button
              onClick={handleExport}
              disabled={exportMutation.isPending}
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              {exportMutation.isPending ? "Exporting..." : "Export as CSV"}
            </Button>
          </CardContent>
        )}
      </Card>

      {/* Recent Events */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Events</CardTitle>
          <CardDescription>Latest authentication and security events</CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-gray-600 text-sm text-center py-8">No events found</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {logs.map((log, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${getSeverityColor(log.severity)} flex items-start gap-3`}
                >
                  <span className="text-xl">{getEventIcon(log.eventType)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-sm">{log.eventType.replace(/_/g, " ")}</p>
                      <span className="text-xs whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs mt-1">
                      {log.email && <span>Email: {log.email} • </span>}
                      IP: {log.ipAddress}
                      {log.userId && <span> • User ID: {log.userId}</span>}
                    </p>
                    {log.details && (
                      <p className="text-xs mt-1 opacity-75">
                        {log.details.reason || log.details.activityType || log.details.method || ""}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Recommendations */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <AlertCircle className="w-5 h-5" />
            Security Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-blue-900">
          <p>• Review critical events regularly to identify potential security threats</p>
          <p>• Investigate multiple failed login attempts from the same IP address</p>
          <p>• Monitor for suspicious activity patterns across multiple accounts</p>
          <p>• Export logs periodically for compliance and archival purposes</p>
          <p>• Set up alerts for critical events (account lockouts, 2FA failures)</p>
        </CardContent>
      </Card>
    </div>
  );
}
