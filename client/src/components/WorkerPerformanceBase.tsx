import React, { useState, useMemo, useCallback } from 'react'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TrendingUp, Clock, AlertCircle, Award, Download, FileText, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DashboardCard } from './DashboardCard'
import { MetricsGrid } from './MetricsGrid'
import { ChartContainer } from './ChartContainer'
import { trpc } from '@/lib/trpc'
import { usePerformanceUpdates, PerformanceUpdate } from '@/hooks/usePerformanceUpdates'
import { PerformanceAlerts } from './PerformanceAlerts'
import { PerformanceTrendsChart } from './PerformanceTrendsChart'

export interface WorkerPerformanceConfig {
  variant: 'basic' | 'withCharts' | 'realTime'
  farmId?: number
  workerId?: number
  dateRange?: [Date, Date]
}

interface WorkerMetric {
  userId: number
  totalHours: string
  totalEntries: number
  avgDuration: string
  lastActive: Date
}

/**
 * Unified WorkerPerformanceBase component consolidating all worker performance dashboards
 * Supports three variants: basic, withCharts, and realTime
 */
export const WorkerPerformanceBase: React.FC<WorkerPerformanceConfig> = ({
  variant = 'withCharts',
  farmId: initialFarmId = 1,
  workerId,
  dateRange,
}) => {
  const [farmId, setFarmId] = useState(initialFarmId)
  const [startDate, setStartDate] = useState<Date | undefined>(dateRange?.[0])
  const [endDate, setEndDate] = useState<Date | undefined>(dateRange?.[1])
  const [workerMetrics, setWorkerMetrics] = useState<Map<number, WorkerMetric>>(new Map())
  const [performanceAlerts, setPerformanceAlerts] = useState<any[]>([])

  const { data: logsData, isLoading } = trpc.fieldWorker.getTimeTrackerLogs.useQuery({
    farmId,
    startDate,
    endDate,
  })

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6']

  // Initialize metrics from data
  const initialMetrics = useMemo(() => {
    const metricsMap = new Map<number, WorkerMetric>()

    if (logsData && Array.isArray(logsData)) {
      (logsData as any[]).forEach((log: any) => {
        const userId = log.userId
        if (!metricsMap.has(userId)) {
          metricsMap.set(userId, {
            userId,
            totalHours: '0',
            totalEntries: 0,
            avgDuration: '0',
            lastActive: new Date(),
          })
        }

        const metric = metricsMap.get(userId)!
        const duration = log.durationMinutes || 0
        const totalMinutes = parseFloat(metric.totalHours) * 60 + duration
        const totalEntries = metric.totalEntries + 1

        metric.totalHours = (totalMinutes / 60).toFixed(2)
        metric.totalEntries = totalEntries
        metric.avgDuration = (totalMinutes / totalEntries).toFixed(0)
        metric.lastActive = new Date(log.clockInTime)
      })
    }

    return metricsMap
  }, [logsData])

  useMemo(() => {
    setWorkerMetrics(initialMetrics)
  }, [initialMetrics])

  // Handle real-time performance updates
  const handlePerformanceUpdate = useCallback((update: PerformanceUpdate) => {
    setWorkerMetrics((prev) => {
      const newMetrics = new Map(prev)
      const existing = newMetrics.get(update.userId)

      if (existing) {
        const totalMinutes = parseFloat(existing.totalHours) * 60 + update.avgDuration
        const totalEntries = existing.totalEntries + update.totalEntries

        newMetrics.set(update.userId, {
          userId: update.userId,
          totalHours: (totalMinutes / 60).toFixed(2),
          totalEntries,
          avgDuration: (totalMinutes / totalEntries).toFixed(0),
          lastActive: update.lastActive,
        })
      } else {
        newMetrics.set(update.userId, {
          userId: update.userId,
          totalHours: (update.totalHours).toFixed(2),
          totalEntries: update.totalEntries,
          avgDuration: update.avgDuration.toFixed(0),
          lastActive: update.lastActive,
        })
      }

      return newMetrics
    })
  }, [])

  // Use real-time updates if variant is realTime
  if (variant === 'realTime') {
    usePerformanceUpdates(farmId, handlePerformanceUpdate)
  }

  // Prepare chart data
  const chartData = Array.from(workerMetrics.values()).map((metric) => ({
    name: `Worker ${metric.userId}`,
    hours: parseFloat(metric.totalHours),
    entries: metric.totalEntries,
    avgDuration: parseInt(metric.avgDuration),
  }))

  // Prepare metrics for grid
  const metricsArray = Array.from(workerMetrics.values()).slice(0, 4).map((metric) => ({
    title: `Worker ${metric.userId}`,
    value: `${metric.totalHours}h`,
    description: `${metric.totalEntries} entries`,
    trend: { value: Math.random() * 20, direction: 'up' as const },
  }))

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

      {/* Metrics Grid - shown in all variants */}
      {metricsArray.length > 0 && (
        <MetricsGrid
          metrics={metricsArray}
          columns={4}
          gap="md"
        />
      )}

      {/* Charts - shown in withCharts and realTime variants */}
      {(variant === 'withCharts' || variant === 'realTime') && chartData.length > 0 && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChartContainer
            title="Hours Worked by Worker"
            description="Total hours per worker"
            height="md"
            loading={isLoading}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="hours" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>

          <ChartContainer
            title="Task Entries by Worker"
            description="Number of task entries"
            height="md"
            loading={isLoading}
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="entries"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>

          <ChartContainer
            title="Average Duration Trend"
            description="Avg task duration per worker"
            height="md"
            loading={isLoading}
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="avgDuration" stroke="#10b981" />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      )}

      {/* Performance Alerts - shown in realTime variant */}
      {variant === 'realTime' && performanceAlerts.length > 0 && (
        <PerformanceAlerts alerts={performanceAlerts} />
      )}

      {/* Real-time trends - shown in realTime variant */}
      {variant === 'realTime' && (
        <PerformanceTrendsChart farmId={farmId} />
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="mb-2 inline-block h-8 w-8 animate-spin rounded-full border-4 border-muted-foreground border-t-primary" />
            <p className="text-muted-foreground">Loading worker performance data...</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default WorkerPerformanceBase
