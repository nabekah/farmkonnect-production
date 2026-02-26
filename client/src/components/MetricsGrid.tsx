import React from 'react'
import { cn } from '@/lib/utils'
import { DashboardCard, DashboardCardProps } from './DashboardCard'

export interface MetricsGridProps {
  metrics: DashboardCardProps[]
  columns?: 1 | 2 | 3 | 4
  gap?: 'sm' | 'md' | 'lg'
  className?: string
}

const columnClasses = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
}

const gapClasses = {
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
}

/**
 * Unified MetricsGrid component for displaying KPIs and metrics
 * Provides consistent grid layout across all dashboards
 */
export const MetricsGrid: React.FC<MetricsGridProps> = ({
  metrics,
  columns = 3,
  gap = 'md',
  className,
}) => {
  return (
    <div
      className={cn(
        'grid',
        columnClasses[columns],
        gapClasses[gap],
        className
      )}
    >
      {metrics.map((metric, index) => (
        <DashboardCard key={index} {...metric} />
      ))}
    </div>
  )
}

export default MetricsGrid
