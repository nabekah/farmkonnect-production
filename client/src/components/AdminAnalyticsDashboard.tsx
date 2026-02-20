import React, { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format, subDays } from "date-fns";
import { Download } from "lucide-react";

export function AdminAnalyticsDashboard() {
  const [daysRange, setDaysRange] = useState(7);
  
  const { data: loginStats, isLoading: statsLoading } = trpc.authAnalytics.getLoginStats.useQuery({
    daysBack: daysRange,
  });

  const { data: dailyTrends, isLoading: trendsLoading } = trpc.authAnalytics.getDailyTrends.useQuery({
    daysBack: daysRange,
  });

  const { data: failedAttempts, isLoading: failedLoading } = trpc.authAnalytics.getFailedAttempts.useQuery({
    daysBack: daysRange,
    limit: 10,
  });

  const { data: methodBreakdown, isLoading: methodLoading } = trpc.authAnalytics.getLoginMethodBreakdown.useQuery({
    daysBack: daysRange,
  });

  const exportAnalytics = async () => {
    try {
      const response = await fetch("/api/trpc/authAnalytics.exportAnalytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ daysBack: daysRange }),
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `analytics-${format(new Date(), "yyyy-MM-dd")}.csv`;
        a.click();
      }
    } catch (error) {
      console.error("Failed to export analytics:", error);
    }
  };

  const COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b"];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Authentication Analytics</h2>
        <div className="flex gap-2">
          {[7, 30, 90].map((days) => (
            <Button
              key={days}
              variant={daysRange === days ? "default" : "outline"}
              onClick={() => setDaysRange(days)}
            >
              {days}d
            </Button>
          ))}
          <Button onClick={exportAnalytics} className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      {loginStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Logins</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loginStats.totalLogins}</div>
              <p className="text-xs text-muted-foreground">
                {loginStats.successRate.toFixed(1)}% success rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Successful</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{loginStats.successfulLogins}</div>
              <p className="text-xs text-muted-foreground">
                {((loginStats.successfulLogins / loginStats.totalLogins) * 100).toFixed(1)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Failed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{loginStats.failedLogins}</div>
              <p className="text-xs text-muted-foreground">
                {((loginStats.failedLogins / loginStats.totalLogins) * 100).toFixed(1)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Unique Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loginStats.uniqueUsers}</div>
              <p className="text-xs text-muted-foreground">
                {(loginStats.uniqueUsers / loginStats.totalLogins).toFixed(2)} avg logins/user
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Daily Trends Chart */}
      {dailyTrends && dailyTrends.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Login Trends</CardTitle>
            <CardDescription>Daily login activity over the selected period</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="successful" stroke="#10b981" name="Successful" />
                <Line type="monotone" dataKey="failed" stroke="#ef4444" name="Failed" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Login Method Breakdown */}
        {methodBreakdown && methodBreakdown.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Login Methods</CardTitle>
              <CardDescription>Distribution by authentication method</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={methodBreakdown}
                    dataKey="count"
                    nameKey="method"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {methodBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Failed Attempts by IP */}
        {failedAttempts && failedAttempts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Failed Attempts by IP</CardTitle>
              <CardDescription>Top 10 IPs with failed login attempts</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={failedAttempts}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="ipAddress" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="failureCount" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
