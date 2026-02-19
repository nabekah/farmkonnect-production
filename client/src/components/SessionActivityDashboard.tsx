import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { AlertCircle, Smartphone, Monitor, Globe, LogOut, RefreshCw } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/contexts/ToastContext";

export function SessionActivityDashboard() {
  const { showToast } = useToast();
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);

  const sessionsQuery = trpc.sessionManagement.getActiveSessions.useQuery();
  const statsQuery = trpc.sessionManagement.getSessionStats.useQuery();
  const suspiciousQuery = trpc.sessionManagement.getSuspiciousSessions.useQuery();
  const logoutSessionMutation = trpc.sessionManagement.logoutSession.useMutation();
  const logoutAllOthersMutation = trpc.sessionManagement.logoutAllOtherSessions.useMutation();

  const handleLogoutSession = async (sessionId: number) => {
    if (!window.confirm("Are you sure you want to log out this session?")) {
      return;
    }

    try {
      await logoutSessionMutation.mutateAsync({ sessionId });
      showToast({
        type: "success",
        title: "Session Logged Out",
        message: "The session has been successfully logged out",
      });
      sessionsQuery.refetch();
      statsQuery.refetch();
    } catch (error: any) {
      showToast({
        type: "error",
        title: "Error",
        message: error.message || "Failed to logout session",
      });
    }
  };

  const handleLogoutAllOthers = async () => {
    if (!window.confirm("This will log out all other sessions. Continue?")) {
      return;
    }

    try {
      await logoutAllOthersMutation.mutateAsync();
      showToast({
        type: "success",
        title: "Sessions Logged Out",
        message: "All other sessions have been logged out",
      });
      sessionsQuery.refetch();
      statsQuery.refetch();
    } catch (error: any) {
      showToast({
        type: "error",
        title: "Error",
        message: error.message || "Failed to logout sessions",
      });
    }
  };

  const getDeviceIcon = (userAgent: string | null) => {
    if (!userAgent) return <Smartphone className="w-5 h-5" />;
    if (userAgent.includes("Mobile")) return <Smartphone className="w-5 h-5" />;
    if (userAgent.includes("Tablet")) return <Smartphone className="w-5 h-5" />;
    return <Monitor className="w-5 h-5" />;
  };

  const getDeviceType = (userAgent: string | null) => {
    if (!userAgent) return "Unknown Device";
    if (userAgent.includes("Windows")) return "Windows";
    if (userAgent.includes("Mac")) return "Mac";
    if (userAgent.includes("Linux")) return "Linux";
    if (userAgent.includes("iPhone")) return "iPhone";
    if (userAgent.includes("Android")) return "Android";
    return "Unknown Device";
  };

  if (sessionsQuery.isLoading || statsQuery.isLoading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  const sessions = sessionsQuery.data || [];
  const stats = statsQuery.data;
  const suspicious = suspiciousQuery.data || [];

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Active Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.activeSessions}</div>
              <p className="text-xs text-gray-600 mt-1">Currently logged in</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Total Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{stats.totalSessions}</div>
              <p className="text-xs text-gray-600 mt-1">All time sessions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Device Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">
                {Object.keys(stats.deviceTypes).length}
              </div>
              <p className="text-xs text-gray-600 mt-1">Unique devices</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Suspicious Activity Alert */}
      {suspicious.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-900">
              <AlertCircle className="w-5 h-5" />
              Suspicious Activity Detected
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {suspicious.map((session) => (
              <div key={session.id} className="bg-white p-3 rounded border border-yellow-200">
                <p className="font-semibold text-sm">{session.deviceName}</p>
                <p className="text-xs text-gray-600">{session.reason}</p>
                <p className="text-xs text-gray-600">IP: {session.ipAddress}</p>
                <p className="text-xs text-gray-600">
                  Accessed: {new Date(session.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Active Sessions</CardTitle>
              <CardDescription>Manage your logged-in devices</CardDescription>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => sessionsQuery.refetch()}
              disabled={sessionsQuery.isRefetching}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {sessions.length === 0 ? (
            <p className="text-gray-600 text-sm">No active sessions found</p>
          ) : (
            <>
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="text-gray-400">
                      {getDeviceIcon(session.userAgent)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm">{session.deviceName}</p>
                        {session.isCurrent && (
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                            Current
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                        <Globe className="w-3 h-3" />
                        {session.ipAddress || "Unknown IP"}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Last active: {new Date(session.lastActivity).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        Signed in: {new Date(session.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {!session.isCurrent && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleLogoutSession(session.id)}
                      disabled={logoutSessionMutation.isPending}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </Button>
                  )}
                </div>
              ))}

              {sessions.length > 1 && (
                <div className="pt-4 border-t">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleLogoutAllOthers}
                    disabled={logoutAllOthersMutation.isPending}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout All Other Sessions
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Device Types Breakdown */}
      {stats && Object.keys(stats.deviceTypes).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Device Types</CardTitle>
            <CardDescription>Breakdown of devices accessing your account</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats.deviceTypes).map(([device, count]) => (
                <div key={device} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{device}</span>
                  <span className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full">
                    {count} session{count !== 1 ? "s" : ""}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
