import React, { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format, subDays } from "date-fns";
import { Download } from "lucide-react";

export function AdminAnalyticsDashboard() {
  const [daysRange, setDaysRange] = useState(7);
  
  const { data: loginStats, isLoading: statsLoading } = trpc.authAnalytics.getLoginStats.useQuery({
    days: daysRange,
  });

  const { data: dailyTrends, isLoading: trendsLoading } = trpc.authAnalytics.getDailyLoginTrends.useQuery({
    days: daysRange,
  });

  const { data: failedAttempts, isLoading: failedLoading } = trpc.authAnalytics.getFailedLoginAttempts.useQuery({
    hours: daysRange * 24,
    limit: 10,
  });

  const { data: methodBreakdown, isLoading: methodLoading } = trpc.authAnalytics.getLoginMethodPreferences.useQuery();

  const exportAnalytics = async () => {
    try {
      const data = {
        loginStats,
        dailyTrends,
        failedAttempts,
        methodBreakdown,
        exportedAt: new Date().toISOString(),
      };
      
      const csvContent = "data:text/csv;charset=utf-8," + 
        "Login Analytics Export\n" +
        `Exported: ${new Date().toLocaleString()}\n\n` +
        JSON.stringify(data, null, 2);
      
      const link = document.createElement("a");
      link.setAttribute("href", encodeURI(csvContent));
      link.setAttribute("download", `analytics-${format(new Date(), "yyyy-MM-dd")}.csv`);
      link.click();
    } catch (error) {
      console.error("Failed to export analytics:", error);
    }
  };

  const COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b"];

  const isLoading = statsLoading || trendsLoading || failedLoading || methodLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold">Authentication Analytics</h2>
          <div className="text-sm text-muted-foreground">Loading...</div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

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
      {loginStats && loginStats.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loginStats.map((stat, index) => {
            const totalAttempts = stat.totalAttempts || 0;
            const successfulLogins = stat.successfulLogins || 0;
            const failedLogins = stat.failedLogins || 0;
            const successRate = stat.successRate || 0;
            
            return (
              <Card key={index}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium capitalize">
                    {stat.loginMethod} Logins
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-xs text-muted-foreground">Total:</span>
                      <span className="text-lg font-bold">{totalAttempts}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-muted-foreground">Successful:</span>
                      <span className="text-lg font-bold text-green-600">{successfulLogins}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-muted-foreground">Failed:</span>
                      <span className="text-lg font-bold text-red-600">{failedLogins}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-muted-foreground">Success Rate:</span>
                      <span className="text-lg font-bold">{successRate.toFixed(1)}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
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
                <Line type="monotone" dataKey="successfulLogins" stroke="#10b981" name="Successful" />
                <Line type="monotone" dataKey="failedLogins" stroke="#ef4444" name="Failed" />
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
                    nameKey="loginMethod"
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

        {/* Failed Attempts */}
        {failedAttempts && failedAttempts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Failed Login Attempts</CardTitle>
              <CardDescription>Recent failed login attempts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {failedAttempts.map((attempt, index) => (
                  <div key={index} className="flex justify-between items-start p-2 border-b">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{attempt.ipAddress}</p>
                      <p className="text-xs text-muted-foreground">{attempt.failureReason}</p>
                      <p className="text-xs text-muted-foreground">{new Date(attempt.loginAt).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
