import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export interface ChartContainerProps {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
  headerClassName?: string
  contentClassName?: string
  loading?: boolean
  error?: string
  height?: 'sm' | 'md' | 'lg' | 'xl'
  actions?: React.ReactNode
}

const heightClasses = {
  sm: 'h-64',
  md: 'h-80',
  lg: 'h-96',
  xl: 'h-[500px]',
}

/**
 * Unified ChartContainer component for displaying charts
 * Provides consistent styling and layout for all chart types
 */
export const ChartContainer: React.FC<ChartContainerProps> = ({
  title,
  description,
  children,
  className,
  headerClassName,
  contentClassName,
  loading = false,
  error,
  height = 'md',
  actions,
}) => {
  return (
    <Card className={className}>
      <CardHeader className={headerClassName}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          {actions && <div className="ml-2">{actions}</div>}
        </div>
      </CardHeader>

      <CardContent className={cn('relative', contentClassName)}>
        {error ? (
          <div className={cn(
            'flex items-center justify-center rounded bg-destructive/10 text-destructive',
            heightClasses[height]
          )}>
            <div className="text-center">
              <p className="font-medium">Error loading chart</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        ) : loading ? (
          <div className={cn(
            'flex items-center justify-center bg-muted',
            heightClasses[height]
          )}>
            <div className="text-center">
              <div className="mb-2 inline-block h-8 w-8 animate-spin rounded-full border-4 border-muted-foreground border-t-primary" />
              <p className="text-sm text-muted-foreground">Loading chart...</p>
            </div>
          </div>
        ) : (
          <div className={heightClasses[height]}>
            {children}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default ChartContainer
