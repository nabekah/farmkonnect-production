import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, Send, Eye, CheckCircle, AlertCircle, Clock } from 'lucide-react'

/**
 * Notification Analytics Dashboard
 * Displays notification delivery rates, read rates, and worker engagement metrics
 */

interface NotificationMetrics {
  date: string
  sent: number
  delivered: number
  read: number
  clicked: number
  failed: number
}

interface NotificationType {
  type: string
  count: number
  deliveryRate: number
  readRate: number
  clickRate: number
}

interface WorkerEngagement {
  workerId: number
  name: string
  notificationsReceived: number
  notificationsRead: number
  engagementRate: number
  lastNotification: Date
}

export const NotificationAnalyticsDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<NotificationMetrics[]>([])
  const [notificationTypes, setNotificationTypes] = useState<NotificationType[]>([])
  const [workerEngagement, setWorkerEngagement] = useState<WorkerEngagement[]>([])
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d')
  const [loading, setLoading] = useState(false)

  /**
   * Load analytics data
   */
  useEffect(() => {
    loadAnalytics()
  }, [timeRange])

  /**
   * Load analytics data from API
   */
  const loadAnalytics = async () => {
    try {
      setLoading(true)

      // Mock data - in production would fetch from API
      const mockMetrics: NotificationMetrics[] = [
        { date: 'Mon', sent: 145, delivered: 142, read: 128, clicked: 95, failed: 3 },
        { date: 'Tue', sent: 168, delivered: 165, read: 148, clicked: 112, failed: 3 },
        { date: 'Wed', sent: 152, delivered: 150, read: 135, clicked: 98, failed: 2 },
        { date: 'Thu', sent: 178, delivered: 175, read: 158, clicked: 125, failed: 3 },
        { date: 'Fri', sent: 195, delivered: 192, read: 175, clicked: 142, failed: 3 },
        { date: 'Sat', sent: 98, delivered: 96, read: 85, clicked: 62, failed: 2 },
        { date: 'Sun', sent: 87, delivered: 85, read: 72, clicked: 52, failed: 2 },
      ]

      const mockTypes: NotificationType[] = [
        { type: 'Shift Assignment', count: 342, deliveryRate: 98.5, readRate: 92.1, clickRate: 68.4 },
        { type: 'Task Assignment', count: 298, deliveryRate: 97.8, readRate: 88.6, clickRate: 64.2 },
        { type: 'Approvals', count: 156, deliveryRate: 99.2, readRate: 95.3, clickRate: 76.9 },
        { type: 'Alerts', count: 234, deliveryRate: 96.5, readRate: 85.2, clickRate: 58.1 },
        { type: 'Compliance', count: 89, deliveryRate: 100, readRate: 98.9, clickRate: 82.1 },
      ]

      const mockWorkers: WorkerEngagement[] = [
        { workerId: 1, name: 'John Smith', notificationsReceived: 145, notificationsRead: 132, engagementRate: 91, lastNotification: new Date() },
        { workerId: 2, name: 'Maria Garcia', notificationsReceived: 138, notificationsRead: 128, engagementRate: 93, lastNotification: new Date(Date.now() - 3600000) },
        { workerId: 3, name: 'James Wilson', notificationsReceived: 152, notificationsRead: 138, engagementRate: 91, lastNotification: new Date(Date.now() - 7200000) },
        { workerId: 4, name: 'Sarah Johnson', notificationsReceived: 128, notificationsRead: 115, engagementRate: 90, lastNotification: new Date(Date.now() - 10800000) },
        { workerId: 5, name: 'Michael Brown', notificationsReceived: 142, notificationsRead: 125, engagementRate: 88, lastNotification: new Date(Date.now() - 14400000) },
      ]

      setMetrics(mockMetrics)
      setNotificationTypes(mockTypes)
      setWorkerEngagement(mockWorkers)
    } catch (error) {
      console.error('[NotificationAnalyticsDashboard] Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Calculate overall metrics
   */
  const calculateOverallMetrics = () => {
    const totalSent = metrics.reduce((sum, m) => sum + m.sent, 0)
    const totalDelivered = metrics.reduce((sum, m) => sum + m.delivered, 0)
    const totalRead = metrics.reduce((sum, m) => sum + m.read, 0)
    const totalClicked = metrics.reduce((sum, m) => sum + m.clicked, 0)

    return {
      totalSent,
      deliveryRate: totalSent > 0 ? ((totalDelivered / totalSent) * 100).toFixed(1) : 0,
      readRate: totalDelivered > 0 ? ((totalRead / totalDelivered) * 100).toFixed(1) : 0,
      clickRate: totalRead > 0 ? ((totalClicked / totalRead) * 100).toFixed(1) : 0,
    }
  }

  const overallMetrics = calculateOverallMetrics()

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notification Analytics</h1>
          <p className="text-muted-foreground mt-2">Track notification delivery, engagement, and performance</p>
        </div>
        <div className="flex gap-2">
          {(['7d', '30d', '90d'] as const).map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? 'default' : 'outline'}
              onClick={() => setTimeRange(range)}
            >
              {range === '7d' ? 'Last 7 Days' : range === '30d' ? 'Last 30 Days' : 'Last 90 Days'}
            </Button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Send className="w-4 h-4" />
              Total Sent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{overallMetrics.totalSent}</div>
            <p className="text-xs text-muted-foreground mt-1">notifications</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Delivery Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{overallMetrics.deliveryRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">successfully delivered</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Read Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{overallMetrics.readRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">of delivered</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Click Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{overallMetrics.clickRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">of read</p>
          </CardContent>
        </Card>
      </div>

      {/* Notification Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Trend</CardTitle>
          <CardDescription>Daily notification metrics over the selected period</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={metrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="sent" stroke="#3b82f6" strokeWidth={2} name="Sent" />
              <Line type="monotone" dataKey="delivered" stroke="#10b981" strokeWidth={2} name="Delivered" />
              <Line type="monotone" dataKey="read" stroke="#f59e0b" strokeWidth={2} name="Read" />
              <Line type="monotone" dataKey="clicked" stroke="#8b5cf6" strokeWidth={2} name="Clicked" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Notification Types Performance */}
      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Performance by Type</CardTitle>
            <CardDescription>Delivery and engagement rates by notification type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={notificationTypes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="deliveryRate" fill="#10b981" name="Delivery Rate %" />
                <Bar dataKey="readRate" fill="#3b82f6" name="Read Rate %" />
                <Bar dataKey="clickRate" fill="#f59e0b" name="Click Rate %" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notification Distribution</CardTitle>
            <CardDescription>Breakdown of notifications by type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={notificationTypes}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ type, count }) => `${type}: ${count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {notificationTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Worker Engagement */}
      <Card>
        <CardHeader>
          <CardTitle>Worker Engagement</CardTitle>
          <CardDescription>Notification engagement metrics by worker</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {workerEngagement.map((worker) => (
              <div key={worker.workerId} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">{worker.name}</p>
                  <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                    <span>{worker.notificationsReceived} received</span>
                    <span>{worker.notificationsRead} read</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {worker.lastNotification.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">{worker.engagementRate}%</div>
                    <p className="text-xs text-muted-foreground">engagement</p>
                  </div>
                  <Badge
                    className={
                      worker.engagementRate >= 90
                        ? 'bg-green-100 text-green-800'
                        : worker.engagementRate >= 80
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                    }
                  >
                    {worker.engagementRate >= 90 ? 'Excellent' : worker.engagementRate >= 80 ? 'Good' : 'Needs Attention'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Key Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm">
            ✓ <strong>Delivery Performance:</strong> Your notification delivery rate of {overallMetrics.deliveryRate}% is excellent. Most notifications reach their intended recipients.
          </p>
          <p className="text-sm">
            ✓ <strong>Read Engagement:</strong> {overallMetrics.readRate}% of delivered notifications are being read, indicating good user engagement.
          </p>
          <p className="text-sm">
            ✓ <strong>Action Rate:</strong> {overallMetrics.clickRate}% of read notifications result in user action, showing effective notification content.
          </p>
          <p className="text-sm">
            💡 <strong>Recommendation:</strong> Consider optimizing notification timing for workers with lower engagement rates to improve overall performance.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
