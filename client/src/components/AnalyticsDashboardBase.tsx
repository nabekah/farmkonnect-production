import React, { useState, useMemo } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter } from 'recharts'
import { TrendingUp, Activity, Users, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DashboardCard } from './DashboardCard'
import { MetricsGrid } from './MetricsGrid'
import { ChartContainer } from './ChartContainer'
import { trpc } from '@/lib/trpc'

export interface AnalyticsDashboardConfig {
  variant: 'basic' | 'advanced' | 'activity'
  farmId?: number
  dateRange?: [Date, Date]
}

interface AnalyticsMetrics {
  totalUsers: number
  activeUsers: number
  totalActivities: number
  conversionRate: number
  dailyData: Array<{ date: string; users: number; activities: number }>
  topActivities: Array<{ name: string; count: number }>
  userEngagement: Array<{ week: string; engagement: number }>
}

/**
 * Unified AnalyticsDashboardBase component consolidating all analytics dashboards
 * Supports three variants: basic, advanced, and activity
 */
export const AnalyticsDashboardBase: React.FC<AnalyticsDashboardConfig> = ({
  variant = 'basic',
  farmId: initialFarmId = 1,
  dateRange,
}) => {
  const [farmId, setFarmId] = useState(initialFarmId)
  const [startDate, setStartDate] = useState<Date | undefined>(dateRange?.[0])
  const [endDate, setEndDate] = useState<Date | undefined>(dateRange?.[1])

  // Fetch analytics data
  const { data: analyticsData, isLoading } = trpc.analytics.getAnalyticsSummary.useQuery({
    farmId,
    startDate,
    endDate,
  })

  // Process analytics data
  const metrics = useMemo<AnalyticsMetrics>(() => {
    if (!analyticsData) {
      return {
        totalUsers: 0,
        activeUsers: 0,
        totalActivities: 0,
        conversionRate: 0,
        dailyData: [],
        topActivities: [],
        userEngagement: [],
      }
    }

    return {
      totalUsers: analyticsData.totalUsers || 0,
      activeUsers: analyticsData.activeUsers || 0,
      totalActivities: analyticsData.totalActivities || 0,
      conversionRate: analyticsData.conversionRate || 0,
      dailyData: analyticsData.dailyData || [],
      topActivities: analyticsData.topActivities || [],
      userEngagement: analyticsData.userEngagement || [],
    }
  }, [analyticsData])

  // Prepare metrics for grid
  const metricsArray = [
    {
      title: 'Total Users',
      icon: <Users className="h-4 w-4" />,
      value: metrics.totalUsers.toLocaleString(),
      trend: { value: 8, direction: 'up' as const, label: 'vs last month' },
    },
    {
      title: 'Active Users',
      icon: <Activity className="h-4 w-4" />,
      value: metrics.activeUsers.toLocaleString(),
      trend: { value: 12, direction: 'up' as const, label: 'vs last month' },
    },
    {
      title: 'Total Activities',
      icon: <Target className="h-4 w-4" />,
      value: metrics.totalActivities.toLocaleString(),
      trend: { value: 15, direction: 'up' as const, label: 'vs last month' },
    },
    {
      title: 'Conversion Rate',
      icon: <TrendingUp className="h-4 w-4" />,
      value: `${metrics.conversionRate.toFixed(1)}%`,
      trend: { value: 3, direction: 'up' as const, label: 'vs last month' },
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex items-end gap-4">
        <div className="flex-1">
          <Label htmlFor="farm-select">Farm</Label>
          <Input
            id="farm-select"
            type="number"
            value={farmId}
            onChange={(e) => setFarmId(parseInt(e.target.value))}
            placeholder="Farm ID"
          />
        </div>
        <div className="flex-1">
          <Label htmlFor="start-date">Start Date</Label>
          <Input
            id="start-date"
            type="date"
            onChange={(e) => setStartDate(e.target.value ? new Date(e.target.value) : undefined)}
          />
        </div>
        <div className="flex-1">
          <Label htmlFor="end-date">End Date</Label>
          <Input
            id="end-date"
            type="date"
            onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value) : undefined)}
          />
        </div>
      </div>

      {/* Key Metrics */}
      <MetricsGrid
        metrics={metricsArray}
        columns={4}
        gap="md"
      />

      {/* Charts based on variant */}
      {(variant === 'basic' || variant === 'advanced') && metrics.dailyData.length > 0 && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChartContainer
            title="Daily Users Trend"
            description="User activity over time"
            height="md"
            loading={isLoading}
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics.dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>

          <ChartContainer
            title="Daily Activities"
            description="Activity count per day"
            height="md"
            loading={isLoading}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="activities" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      )}

      {variant === 'advanced' && metrics.topActivities.length > 0 && (
        <ChartContainer
          title="Top Activities"
          description="Most performed activities"
          height="md"
          loading={isLoading}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={metrics.topActivities}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={100} />
              <Tooltip />
              <Bar dataKey="count" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      )}

      {variant === 'activity' && metrics.userEngagement.length > 0 && (
        <ChartContainer
          title="User Engagement Trend"
          description="Weekly engagement metrics"
          height="lg"
          loading={isLoading}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={metrics.userEngagement}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="engagement"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={{ fill: '#8b5cf6', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="mb-2 inline-block h-8 w-8 animate-spin rounded-full border-4 border-muted-foreground border-t-primary" />
            <p className="text-muted-foreground">Loading analytics data...</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default AnalyticsDashboardBase
