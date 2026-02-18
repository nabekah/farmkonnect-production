import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { trpc } from "@/lib/trpc";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Chrome, Smartphone, Tablet, TrendingUp } from "lucide-react";

export function LoginAnalyticsDashboard() {
  const analyticsQuery = trpc.securityFeatures.getLoginAnalytics.useQuery({ days: 30 });
  const statsQuery = trpc.securityFeatures.getAuthProviderStats.useQuery();
  const preferredQuery = trpc.securityFeatures.getPreferredAuthMethod.useQuery();

  if (analyticsQuery.isLoading || statsQuery.isLoading) {
    return <div className="text-center py-8">Loading analytics...</div>;
  }

  const analytics = analyticsQuery.data;
  const stats = statsQuery.data;
  const preferred = preferredQuery.data;

  // Sample data for charts
  const loginTrendData = [
    { date: "Mon", manus: 12, google: 8 },
    { date: "Tue", manus: 15, google: 10 },
    { date: "Wed", manus: 10, google: 12 },
    { date: "Thu", manus: 18, google: 14 },
    { date: "Fri", manus: 20, google: 16 },
    { date: "Sat", manus: 8, google: 6 },
    { date: "Sun", manus: 5, google: 4 },
  ];

  const authProviderData = [
    { name: "Manus OAuth", value: stats?.manusLogins || 0, color: "#3b82f6" },
    { name: "Google", value: stats?.googleLogins || 0, color: "#ef4444" },
  ];

  const deviceTypeData = [
    { name: "Desktop", value: 65 },
    { name: "Mobile", value: 25 },
    { name: "Tablet", value: 10 },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Logins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalLogins || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Manus Logins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{analytics?.manusLogins || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics?.manusSuccessRate || 100}% success rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Google Logins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{analytics?.googleLogins || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics?.googleSuccessRate || 100}% success rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Preferred Method</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="outline" className="mt-1">
              {preferred?.preferredProvider === "manus" ? "Manus OAuth" : "Google"}
            </Badge>
            <p className="text-xs text-muted-foreground mt-2">Last used: {preferred?.lastUsedProvider}</p>
          </CardContent>
        </Card>
      </div>

      {/* Login Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Login Trend (7 Days)</CardTitle>
          <CardDescription>Daily logins by authentication method</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={loginTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="manus" fill="#3b82f6" name="Manus OAuth" />
              <Bar dataKey="google" fill="#ef4444" name="Google" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Auth Provider Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Method Distribution</CardTitle>
            <CardDescription>Proportion of logins by provider</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={authProviderData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {authProviderData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Device Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Login Devices</CardTitle>
            <CardDescription>Device types used for login</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {deviceTypeData.map((device) => (
                <div key={device.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {device.name === "Desktop" && <Chrome className="w-5 h-5 text-muted-foreground" />}
                    {device.name === "Mobile" && <Smartphone className="w-5 h-5 text-muted-foreground" />}
                    {device.name === "Tablet" && <Tablet className="w-5 h-5 text-muted-foreground" />}
                    <span className="font-medium">{device.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${device.value}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-8 text-right">{device.value}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Login Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Login Activity</CardTitle>
          <CardDescription>Your last 5 login attempts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { time: "Today at 2:30 PM", method: "Manus OAuth", device: "Chrome on Windows", location: "New York, USA" },
              { time: "Yesterday at 10:15 AM", method: "Google", device: "Safari on iPhone", location: "New York, USA" },
              { time: "2 days ago at 3:45 PM", method: "Manus OAuth", device: "Chrome on Windows", location: "New York, USA" },
              { time: "3 days ago at 9:20 AM", method: "Manus OAuth", device: "Firefox on Mac", location: "New York, USA" },
              { time: "4 days ago at 1:10 PM", method: "Google", device: "Chrome on Windows", location: "New York, USA" },
            ].map((login, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium text-sm">{login.method}</p>
                  <p className="text-xs text-muted-foreground">{login.device}</p>
                  <p className="text-xs text-muted-foreground">{login.location}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">{login.time}</p>
                  <Badge variant="outline" className="mt-1">
                    Successful
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
