import React, { useState, useMemo } from 'react'
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Leaf, Droplets, Thermometer, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DashboardCard } from './DashboardCard'
import { MetricsGrid } from './MetricsGrid'
import { ChartContainer } from './ChartContainer'
import { trpc } from '@/lib/trpc'

export interface FarmDashboardConfig {
  variant: 'overview' | 'analytics' | 'cooperative'
  farmId?: number
  dateRange?: [Date, Date]
}

interface FarmMetrics {
  totalArea: number
  cropsPlanted: number
  healthScore: number
  yieldEstimate: number
  soilMoisture: Array<{ date: string; moisture: number }>
  temperatureTrend: Array<{ date: string; temperature: number }>
  cropHealth: Array<{ crop: string; health: number }>
}

/**
 * Unified FarmDashboardBase component consolidating all farm dashboards
 * Supports three variants: overview, analytics, and cooperative
 */
export const FarmDashboardBase: React.FC<FarmDashboardConfig> = ({
  variant = 'overview',
  farmId: initialFarmId = 1,
  dateRange,
}) => {
  const [farmId, setFarmId] = useState(initialFarmId)
  const [startDate, setStartDate] = useState<Date | undefined>(dateRange?.[0])
  const [endDate, setEndDate] = useState<Date | undefined>(dateRange?.[1])

  // Fetch farm data
  const { data: farmData, isLoading } = trpc.farm.getFarmAnalytics.useQuery({
    farmId,
    startDate,
    endDate,
  })

  // Process farm data
  const metrics = useMemo<FarmMetrics>(() => {
    if (!farmData) {
      return {
        totalArea: 0,
        cropsPlanted: 0,
        healthScore: 0,
        yieldEstimate: 0,
        soilMoisture: [],
        temperatureTrend: [],
        cropHealth: [],
      }
    }

    return {
      totalArea: farmData.totalArea || 0,
      cropsPlanted: farmData.cropsPlanted || 0,
      healthScore: farmData.healthScore || 0,
      yieldEstimate: farmData.yieldEstimate || 0,
      soilMoisture: farmData.soilMoisture || [],
      temperatureTrend: farmData.temperatureTrend || [],
      cropHealth: farmData.cropHealth || [],
    }
  }, [farmData])

  // Prepare metrics for grid
  const metricsArray = [
    {
      title: 'Total Area',
      icon: <Leaf className="h-4 w-4" />,
      value: `${metrics.totalArea} ha`,
      trend: { value: 5, direction: 'up' as const, label: 'vs last season' },
    },
    {
      title: 'Crops Planted',
      icon: <Leaf className="h-4 w-4" />,
      value: metrics.cropsPlanted.toString(),
      trend: { value: 2, direction: 'up' as const, label: 'vs last season' },
    },
    {
      title: 'Farm Health Score',
      icon: <AlertTriangle className="h-4 w-4" />,
      value: `${metrics.healthScore}%`,
      trend: { value: 8, direction: 'up' as const, label: 'vs last month' },
    },
    {
      title: 'Yield Estimate',
      icon: <Droplets className="h-4 w-4" />,
      value: `${metrics.yieldEstimate} tons`,
      trend: { value: 12, direction: 'up' as const, label: 'vs last season' },
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
      {(variant === 'overview' || variant === 'analytics') && metrics.soilMoisture.length > 0 && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChartContainer
            title="Soil Moisture Level"
            description="Daily moisture tracking"
            height="md"
            loading={isLoading}
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.soilMoisture}>
                <defs>
                  <linearGradient id="colorMoisture" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="moisture"
                  stroke="#3b82f6"
                  fillOpacity={1}
                  fill="url(#colorMoisture)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>

          <ChartContainer
            title="Temperature Trend"
            description="Daily temperature data"
            height="md"
            loading={isLoading}
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics.temperatureTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="temperature"
                  stroke="#f59e0b"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      )}

      {variant === 'analytics' && metrics.cropHealth.length > 0 && (
        <ChartContainer
          title="Crop Health Status"
          description="Health score by crop type"
          height="md"
          loading={isLoading}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={metrics.cropHealth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="crop" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="health" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      )}

      {variant === 'cooperative' && metrics.cropHealth.length > 0 && (
        <ChartContainer
          title="Cooperative Farm Performance"
          description="Aggregated metrics from member farms"
          height="lg"
          loading={isLoading}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={metrics.cropHealth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="crop" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="health" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="mb-2 inline-block h-8 w-8 animate-spin rounded-full border-4 border-muted-foreground border-t-primary" />
            <p className="text-muted-foreground">Loading farm data...</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default FarmDashboardBase
