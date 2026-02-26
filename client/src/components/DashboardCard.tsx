import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export interface DashboardCardProps {
  title: string
  description?: string
  icon?: React.ReactNode
  value?: string | number
  trend?: {
    value: number
    direction: 'up' | 'down'
    label?: string
  }
  children?: React.ReactNode
  className?: string
  headerClassName?: string
  contentClassName?: string
  onClick?: () => void
  loading?: boolean
  error?: string
}

/**
 * Unified DashboardCard component used across all dashboards
 * Provides consistent styling, layout, and interactions
 */
export const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  description,
  icon,
  value,
  trend,
  children,
  className,
  headerClassName,
  contentClassName,
  onClick,
  loading = false,
  error,
}) => {
  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:shadow-lg',
        onClick && 'hover:border-primary',
        className
      )}
      onClick={onClick}
    >
      <CardHeader className={cn('pb-2', headerClassName)}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base font-semibold">{title}</CardTitle>
            {description && <CardDescription className="text-xs">{description}</CardDescription>}
          </div>
          {icon && <div className="ml-2 text-muted-foreground">{icon}</div>}
        </div>
      </CardHeader>

      <CardContent className={cn('space-y-2', contentClassName)}>
        {error ? (
          <div className="rounded bg-destructive/10 p-2 text-sm text-destructive">{error}</div>
        ) : loading ? (
          <div className="h-8 animate-pulse rounded bg-muted" />
        ) : (
          <>
            {value !== undefined && (
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-bold">{value}</div>
                {trend && (
                  <div
                    className={cn(
                      'text-sm font-medium',
                      trend.direction === 'up' ? 'text-green-600' : 'text-red-600'
                    )}
                  >
                    {trend.direction === 'up' ? '↑' : '↓'} {trend.value}%
                    {trend.label && <span className="ml-1 text-xs text-muted-foreground">{trend.label}</span>}
                  </div>
                )}
              </div>
            )}
            {children && <div className="mt-4">{children}</div>}
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default DashboardCard
