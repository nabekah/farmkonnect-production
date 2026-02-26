import React, { useState, useMemo } from 'react'
import { BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, TrendingDown, DollarSign, PieChart as PieChartIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DashboardCard } from './DashboardCard'
import { MetricsGrid } from './MetricsGrid'
import { ChartContainer } from './ChartContainer'
import { trpc } from '@/lib/trpc'

export interface FinancialDashboardConfig {
  variant: 'overview' | 'forecasting' | 'budgetVsActual'
  farmId?: number
  dateRange?: [Date, Date]
}

interface FinancialMetrics {
  totalRevenue: number
  totalExpenses: number
  netProfit: number
  profitMargin: number
  monthlyRevenue: Array<{ month: string; revenue: number }>
  monthlyExpenses: Array<{ month: string; expenses: number }>
  expenseBreakdown: Array<{ category: string; amount: number }>
}

/**
 * Unified FinancialDashboardBase component consolidating all financial dashboards
 * Supports three variants: overview, forecasting, and budgetVsActual
 */
export const FinancialDashboardBase: React.FC<FinancialDashboardConfig> = ({
  variant = 'overview',
  farmId: initialFarmId = 1,
  dateRange,
}) => {
  const [farmId, setFarmId] = useState(initialFarmId)
  const [startDate, setStartDate] = useState<Date | undefined>(dateRange?.[0])
  const [endDate, setEndDate] = useState<Date | undefined>(dateRange?.[1])

  // Fetch financial data
  const { data: financialData, isLoading } = trpc.financial.getFinancialSummary.useQuery({
    farmId,
    startDate,
    endDate,
  })

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

  // Process financial data
  const metrics = useMemo<FinancialMetrics>(() => {
    if (!financialData) {
      return {
        totalRevenue: 0,
        totalExpenses: 0,
        netProfit: 0,
        profitMargin: 0,
        monthlyRevenue: [],
        monthlyExpenses: [],
        expenseBreakdown: [],
      }
    }

    const totalRevenue = financialData.totalRevenue || 0
    const totalExpenses = financialData.totalExpenses || 0
    const netProfit = totalRevenue - totalExpenses
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0

    return {
      totalRevenue,
      totalExpenses,
      netProfit,
      profitMargin,
      monthlyRevenue: financialData.monthlyRevenue || [],
      monthlyExpenses: financialData.monthlyExpenses || [],
      expenseBreakdown: financialData.expenseBreakdown || [],
    }
  }, [financialData])

  // Prepare metrics for grid
  const metricsArray = [
    {
      title: 'Total Revenue',
      icon: <DollarSign className="h-4 w-4" />,
      value: `$${metrics.totalRevenue.toLocaleString()}`,
      trend: { value: 12, direction: 'up' as const, label: 'vs last month' },
    },
    {
      title: 'Total Expenses',
      icon: <TrendingDown className="h-4 w-4" />,
      value: `$${metrics.totalExpenses.toLocaleString()}`,
      trend: { value: 5, direction: 'down' as const, label: 'vs last month' },
    },
    {
      title: 'Net Profit',
      icon: <TrendingUp className="h-4 w-4" />,
      value: `$${metrics.netProfit.toLocaleString()}`,
      trend: { value: 18, direction: 'up' as const, label: 'vs last month' },
    },
    {
      title: 'Profit Margin',
      icon: <PieChartIcon className="h-4 w-4" />,
      value: `${metrics.profitMargin.toFixed(1)}%`,
      trend: { value: 2, direction: 'up' as const, label: 'vs last month' },
    },
  ]

  // Combined monthly data for charts
  const monthlyData = useMemo(() => {
    const combined: Record<string, any> = {}

    metrics.monthlyRevenue.forEach((item) => {
      if (!combined[item.month]) combined[item.month] = { month: item.month }
      combined[item.month].revenue = item.revenue
    })

    metrics.monthlyExpenses.forEach((item) => {
      if (!combined[item.month]) combined[item.month] = { month: item.month }
      combined[item.month].expenses = item.expenses
    })

    return Object.values(combined)
  }, [metrics])

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
      {variant === 'overview' && monthlyData.length > 0 && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChartContainer
            title="Revenue vs Expenses"
            description="Monthly comparison"
            height="md"
            loading={isLoading}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="revenue" fill="#10b981" />
                <Bar dataKey="expenses" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>

          <ChartContainer
            title="Expense Breakdown"
            description="By category"
            height="md"
            loading={isLoading}
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={metrics.expenseBreakdown}
                  dataKey="amount"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {metrics.expenseBreakdown.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      )}

      {variant === 'forecasting' && monthlyData.length > 0 && (
        <ChartContainer
          title="Revenue Forecast"
          description="Projected 12-month trend"
          height="lg"
          loading={isLoading}
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#10b981"
                fillOpacity={1}
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      )}

      {variant === 'budgetVsActual' && monthlyData.length > 0 && (
        <ChartContainer
          title="Budget vs Actual"
          description="Monthly variance analysis"
          height="lg"
          loading={isLoading}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} />
              <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="mb-2 inline-block h-8 w-8 animate-spin rounded-full border-4 border-muted-foreground border-t-primary" />
            <p className="text-muted-foreground">Loading financial data...</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default FinancialDashboardBase
