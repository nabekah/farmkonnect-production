import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { AlertCircle, MapPin, Globe, RefreshCw, TrendingUp } from "lucide-react";
import { trpc } from "@/lib/trpc";

export function GeoIPDashboard() {
  const [autoRefresh, setAutoRefresh] = useState(true);

  const loginHistoryQuery = trpc.securityManagement.getLoginHistory.useQuery(
    { limit: 50 },
    { refetchInterval: autoRefresh ? 60000 : false }
  );

  const locationsQuery = trpc.securityManagement.getUniqueLocations.useQuery(undefined, {
    refetchInterval: autoRefresh ? 60000 : false,
  });

  const geoStatsQuery = trpc.securityManagement.getGeoIPStatistics.useQuery(undefined, {
    refetchInterval: autoRefresh ? 60000 : false,
  });

  const loginHistory = loginHistoryQuery.data || [];
  const locations = locationsQuery.data || [];
  const stats = geoStatsQuery.data;

  const isLoading = loginHistoryQuery.isLoading || locationsQuery.isLoading || geoStatsQuery.isLoading;

  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Login Locations</h2>
          <p className="text-gray-600 text-sm mt-1">Monitor where your account is being accessed from</p>
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
              loginHistoryQuery.refetch();
              locationsQuery.refetch();
              geoStatsQuery.refetch();
            }}
            disabled={loginHistoryQuery.isRefetching}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Total Logins
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{stats.totalLocations}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Unique Countries
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.uniqueCountries}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Unique Locations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{locations.length}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Unique Locations */}
      <Card>
        <CardHeader>
          <CardTitle>Unique Login Locations</CardTitle>
          <CardDescription>Countries and cities where you've logged in</CardDescription>
        </CardHeader>
        <CardContent>
          {locations.length === 0 ? (
            <p className="text-gray-600 text-sm text-center py-8">No login history available</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {locations.map((loc, idx) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-lg border">
                  <div className="flex items-center gap-2 mb-1">
                    <Globe className="w-4 h-4 text-blue-600" />
                    <p className="font-semibold">{loc.country}</p>
                  </div>
                  <p className="text-sm text-gray-600 ml-6">{loc.city}</p>
                  <p className="text-xs text-gray-500 ml-6 mt-1">{loc.count} login{loc.count !== 1 ? "s" : ""}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Login History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Login History</CardTitle>
          <CardDescription>Your latest login locations and devices</CardDescription>
        </CardHeader>
        <CardContent>
          {loginHistory.length === 0 ? (
            <p className="text-gray-600 text-sm text-center py-8">No login history available</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {loginHistory.map((login, idx) => (
                <div key={idx} className="p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <MapPin className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-semibold">
                          {login.city}, {login.country}
                        </p>
                        <p className="text-sm text-gray-600">IP: {login.ipAddress}</p>
                        {login.deviceName && <p className="text-sm text-gray-600">Device: {login.deviceName}</p>}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-gray-500">{new Date(login.timestamp).toLocaleString()}</p>
                    </div>
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
            Security Tips
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-blue-900">
          <p>• Regularly review your login locations to spot unauthorized access</p>
          <p>• If you see a location you don't recognize, change your password immediately</p>
          <p>• Enable 2FA to add an extra layer of security to your account</p>
          <p>• Use strong, unique passwords for your account</p>
          <p>• Log out of sessions you don't recognize in your security settings</p>
        </CardContent>
      </Card>
    </div>
  );
}
