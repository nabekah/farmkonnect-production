import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Bell, TrendingUp, Users, CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface NotificationMetrics {
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  totalOpened: number;
  deliveryRate: number;
  openRate: number;
  averageDeliveryTime: number;
}

interface NotificationTrend {
  date: string;
  sent: number;
  delivered: number;
  opened: number;
  failed: number;
}

interface NotificationByType {
  type: string;
  count: number;
  percentage: number;
}

interface UserEngagement {
  userId: number;
  userName: string;
  notificationsReceived: number;
  notificationsOpened: number;
  engagementRate: number;
  lastActive: string;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function NotificationAnalyticsDashboard() {
  const [metrics, setMetrics] = useState<NotificationMetrics>({
    totalSent: 1250,
    totalDelivered: 1198,
    totalFailed: 52,
    totalOpened: 856,
    deliveryRate: 95.8,
    openRate: 68.5,
    averageDeliveryTime: 2.3,
  });

  const [trends, setTrends] = useState<NotificationTrend[]>([
    { date: 'Jan 1', sent: 120, delivered: 115, opened: 85, failed: 5 },
    { date: 'Jan 2', sent: 135, delivered: 130, opened: 95, failed: 5 },
    { date: 'Jan 3', sent: 110, delivered: 105, opened: 72, failed: 5 },
    { date: 'Jan 4', sent: 145, delivered: 140, opened: 98, failed: 5 },
    { date: 'Jan 5', sent: 160, delivered: 155, opened: 110, failed: 5 },
    { date: 'Jan 6', sent: 175, delivered: 168, opened: 120, failed: 7 },
    { date: 'Jan 7', sent: 190, delivered: 185, opened: 135, failed: 5 },
  ]);

  const [notificationsByType, setNotificationsByType] = useState<NotificationByType[]>([
    { type: 'Breeding Reminders', count: 280, percentage: 22.4 },
    { type: 'Stock Alerts', count: 310, percentage: 24.8 },
    { type: 'Weather Alerts', count: 195, percentage: 15.6 },
    { type: 'Vaccination Reminders', count: 165, percentage: 13.2 },
    { type: 'Harvest Reminders', count: 145, percentage: 11.6 },
    { type: 'Marketplace Updates', count: 155, percentage: 12.4 },
  ]);

  const [topUsers, setTopUsers] = useState<UserEngagement[]>([
    { userId: 1, userName: 'John Farmer', notificationsReceived: 156, notificationsOpened: 120, engagementRate: 76.9, lastActive: '2 minutes ago' },
    { userId: 2, userName: 'Sarah Smith', notificationsReceived: 142, notificationsOpened: 98, engagementRate: 69.0, lastActive: '15 minutes ago' },
    { userId: 3, userName: 'Mike Johnson', notificationsReceived: 128, notificationsOpened: 85, engagementRate: 66.4, lastActive: '1 hour ago' },
    { userId: 4, userName: 'Emma Davis', notificationsReceived: 115, notificationsOpened: 72, engagementRate: 62.6, lastActive: '3 hours ago' },
    { userId: 5, userName: 'David Wilson', notificationsReceived: 98, notificationsOpened: 58, engagementRate: 59.2, lastActive: '5 hours ago' },
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bell className="h-8 w-8" />
            Notification Analytics
          </h1>
          <p className="text-muted-foreground mt-1">Track notification delivery and user engagement metrics</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Total Sent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalSent.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Delivery Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.deliveryRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">{metrics.totalDelivered.toLocaleString()} delivered</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              Open Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.openRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">{metrics.totalOpened.toLocaleString()} opened</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-600" />
              Avg Delivery Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.averageDeliveryTime.toFixed(1)}s</div>
            <p className="text-xs text-muted-foreground mt-1">Average seconds</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="types">By Type</TabsTrigger>
          <TabsTrigger value="users">Top Users</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Trends (Last 7 Days)</CardTitle>
              <CardDescription>
                Track sent, delivered, opened, and failed notifications over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="sent" stroke="#3b82f6" name="Sent" />
                  <Line type="monotone" dataKey="delivered" stroke="#10b981" name="Delivered" />
                  <Line type="monotone" dataKey="opened" stroke="#f59e0b" name="Opened" />
                  <Line type="monotone" dataKey="failed" stroke="#ef4444" name="Failed" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="types" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Notifications by Type</CardTitle>
                <CardDescription>
                  Distribution of notifications sent by type
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={notificationsByType}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {notificationsByType.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Type Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {notificationsByType.map((type, index) => (
                  <div key={type.type} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-sm font-medium">{type.type}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{type.count}</span>
                      <Badge variant="secondary">{type.percentage}%</Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Engaged Users</CardTitle>
              <CardDescription>
                Users with highest notification engagement rates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topUsers.map((user) => (
                  <div key={user.userId} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50">
                    <div className="flex-1">
                      <p className="font-medium">{user.userName}</p>
                      <p className="text-sm text-muted-foreground">
                        {user.notificationsReceived} received • {user.notificationsOpened} opened
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">{user.engagementRate.toFixed(1)}%</div>
                      <p className="text-xs text-muted-foreground">{user.lastActive}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Failed Notifications</p>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span className="text-2xl font-bold">{metrics.totalFailed}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {((metrics.totalFailed / metrics.totalSent) * 100).toFixed(2)}% failure rate
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Not Opened</p>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-orange-600" />
              <span className="text-2xl font-bold">{metrics.totalDelivered - metrics.totalOpened}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {(((metrics.totalDelivered - metrics.totalOpened) / metrics.totalDelivered) * 100).toFixed(2)}% of delivered
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Engagement Trend</p>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <span className="text-2xl font-bold">+12.5%</span>
            </div>
            <p className="text-xs text-muted-foreground">vs last week</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
