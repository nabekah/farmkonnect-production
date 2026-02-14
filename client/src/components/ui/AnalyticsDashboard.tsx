import { forwardRef, ReactNode, useMemo } from 'react';
import { TrendingUp, TrendingDown, BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MetricData {
  /**
   * Metric label
   */
  label: string;
  /**
   * Metric value
   */
  value: number | string;
  /**
   * Metric unit
   */
  unit?: string;
  /**
   * Change percentage
   */
  change?: number;
  /**
   * Is positive change
   */
  isPositive?: boolean;
  /**
   * Icon
   */
  icon?: ReactNode;
  /**
   * Color theme
   */
  color?: 'primary' | 'success' | 'warning' | 'destructive';
}

export interface ChartDataPoint {
  /**
   * Label
   */
  label: string;
  /**
   * Value
   */
  value: number;
  /**
   * Additional data
   */
  [key: string]: any;
}

export interface KPICardProps {
  /**
   * Metric data
   */
  metric: MetricData;
  /**
   * Custom className
   */
  className?: string;
}

/**
 * KPI Card Component
 * 
 * Display key performance indicator
 */
export const KPICard = forwardRef<HTMLDivElement, KPICardProps>(
  (
    {
      metric,
      className = '',
    },
    ref
  ) => {
    const colorClasses = {
      'primary': 'text-blue-600 dark:text-blue-400',
      'success': 'text-green-600 dark:text-green-400',
      'warning': 'text-yellow-600 dark:text-yellow-400',
      'destructive': 'text-red-600 dark:text-red-400',
    };

    const bgClasses = {
      'primary': 'bg-blue-50 dark:bg-blue-950',
      'success': 'bg-green-50 dark:bg-green-950',
      'warning': 'bg-yellow-50 dark:bg-yellow-950',
      'destructive': 'bg-red-50 dark:bg-red-950',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'p-6 rounded-lg border border-border',
          bgClasses[metric.color || 'primary'],
          className
        )}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{metric.label}</p>
            <div className="flex items-baseline gap-2 mt-2">
              <h3 className="text-3xl font-bold">
                {metric.value}
              </h3>
              {metric.unit && (
                <span className="text-sm text-muted-foreground">
                  {metric.unit}
                </span>
              )}
            </div>

            {metric.change !== undefined && (
              <div className="flex items-center gap-1 mt-2">
                {metric.isPositive ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
                <span
                  className={cn(
                    'text-sm font-medium',
                    metric.isPositive ? 'text-green-600' : 'text-red-600'
                  )}
                >
                  {metric.isPositive ? '+' : ''}{metric.change}%
                </span>
              </div>
            )}
          </div>

          {metric.icon && (
            <div className={cn('p-3 rounded-lg', colorClasses[metric.color || 'primary'])}>
              {metric.icon}
            </div>
          )}
        </div>
      </div>
    );
  }
);

KPICard.displayName = 'KPICard';

/**
 * SimpleBarChart Component
 * 
 * Horizontal bar chart for data visualization
 */
export interface SimpleBarChartProps {
  /**
   * Chart data
   */
  data: ChartDataPoint[];
  /**
   * Chart title
   */
  title?: string;
  /**
   * Max bar width
   */
  maxValue?: number;
  /**
   * Custom className
   */
  className?: string;
}

export const SimpleBarChart = forwardRef<HTMLDivElement, SimpleBarChartProps>(
  (
    {
      data,
      title,
      maxValue,
      className = '',
    },
    ref
  ) => {
    const max = maxValue || Math.max(...data.map((d) => d.value));

    return (
      <div
        ref={ref}
        className={cn('p-6 rounded-lg border border-border', className)}
      >
        {title && (
          <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            {title}
          </h3>
        )}

        <div className="space-y-4">
          {data.map((point, index) => {
            const percentage = (point.value / max) * 100;

            return (
              <div key={index} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{point.label}</span>
                  <span className="text-sm text-muted-foreground">
                    {point.value}
                  </span>
                </div>

                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);

SimpleBarChart.displayName = 'SimpleBarChart';

/**
 * SimplePieChart Component
 * 
 * Pie chart for proportion visualization
 */
export interface SimplePieChartProps {
  /**
   * Chart data
   */
  data: ChartDataPoint[];
  /**
   * Chart title
   */
  title?: string;
  /**
   * Custom className
   */
  className?: string;
}

export const SimplePieChart = forwardRef<HTMLDivElement, SimplePieChartProps>(
  (
    {
      data,
      title,
      className = '',
    },
    ref
  ) => {
    const total = useMemo(() => data.reduce((sum, d) => sum + d.value, 0), [data]);

    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-red-500',
      'bg-purple-500',
      'bg-pink-500',
    ];

    let cumulativePercentage = 0;
    const segments = data.map((point, index) => {
      const percentage = (point.value / total) * 100;
      const startPercentage = cumulativePercentage;
      cumulativePercentage += percentage;

      return {
        ...point,
        percentage,
        startPercentage,
        color: colors[index % colors.length],
      };
    });

    return (
      <div
        ref={ref}
        className={cn('p-6 rounded-lg border border-border', className)}
      >
        {title && (
          <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
            <PieChartIcon className="h-4 w-4" />
            {title}
          </h3>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Pie chart */}
          <div className="flex-1 flex items-center justify-center">
            <div className="relative w-48 h-48">
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                {segments.map((segment, index) => {
                  const startAngle = (segment.startPercentage / 100) * 360;
                  const endAngle = ((segment.startPercentage + segment.percentage) / 100) * 360;
                  const largeArc = segment.percentage > 50 ? 1 : 0;

                  const startRad = (startAngle * Math.PI) / 180;
                  const endRad = (endAngle * Math.PI) / 180;

                  const x1 = 50 + 40 * Math.cos(startRad);
                  const y1 = 50 + 40 * Math.sin(startRad);
                  const x2 = 50 + 40 * Math.cos(endRad);
                  const y2 = 50 + 40 * Math.sin(endRad);

                  const pathData = [
                    `M 50 50`,
                    `L ${x1} ${y1}`,
                    `A 40 40 0 ${largeArc} 1 ${x2} ${y2}`,
                    'Z',
                  ].join(' ');

                  const colorMap = {
                    'bg-blue-500': '#3b82f6',
                    'bg-green-500': '#10b981',
                    'bg-yellow-500': '#eab308',
                    'bg-red-500': '#ef4444',
                    'bg-purple-500': '#a855f7',
                    'bg-pink-500': '#ec4899',
                  };

                  return (
                    <path
                      key={index}
                      d={pathData}
                      fill={colorMap[segment.color as keyof typeof colorMap]}
                      className="hover:opacity-80 transition-opacity"
                    />
                  );
                })}
              </svg>

              {/* Center text */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-2xl font-bold">{total}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex-1 space-y-2">
            {segments.map((segment, index) => (
              <div key={index} className="flex items-center gap-2">
                <div
                  className={cn('w-3 h-3 rounded-full', segment.color)}
                />
                <span className="text-sm">{segment.label}</span>
                <span className="text-sm text-muted-foreground ml-auto">
                  {segment.percentage.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
);

SimplePieChart.displayName = 'SimplePieChart';

/**
 * LineChart Component
 * 
 * Simple line chart for trend visualization
 */
export interface LineChartProps {
  /**
   * Chart data
   */
  data: ChartDataPoint[];
  /**
   * Chart title
   */
  title?: string;
  /**
   * Y-axis label
   */
  yAxisLabel?: string;
  /**
   * Custom className
   */
  className?: string;
}

export const LineChart = forwardRef<HTMLDivElement, LineChartProps>(
  (
    {
      data,
      title,
      yAxisLabel,
      className = '',
    },
    ref
  ) => {
    const max = useMemo(() => Math.max(...data.map((d) => d.value)), [data]);
    const min = useMemo(() => Math.min(...data.map((d) => d.value)), [data]);
    const range = max - min || 1;

    const points = data.map((point, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = 100 - ((point.value - min) / range) * 100;
      return { ...point, x, y };
    });

    const pathData = points
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
      .join(' ');

    return (
      <div
        ref={ref}
        className={cn('p-6 rounded-lg border border-border', className)}
      >
        {title && (
          <h3 className="font-semibold text-sm mb-4">{title}</h3>
        )}

        <div className="relative w-full h-64">
          <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
            {/* Grid lines */}
            {[0, 25, 50, 75, 100].map((y) => (
              <line
                key={`grid-${y}`}
                x1="0"
                y1={y}
                x2="100"
                y2={y}
                stroke="currentColor"
                strokeWidth="0.5"
                className="text-muted-foreground opacity-20"
              />
            ))}

            {/* Line */}
            <path
              d={pathData}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-primary"
            />

            {/* Points */}
            {points.map((point, index) => (
              <circle
                key={`point-${index}`}
                cx={point.x}
                cy={point.y}
                r="2"
                fill="currentColor"
                className="text-primary"
              />
            ))}
          </svg>

          {/* Axes labels */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-muted-foreground px-2">
            {points.map((point, index) => (
              <span key={`label-${index}`}>{point.label}</span>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
          <span>{yAxisLabel || 'Value'}</span>
          <span>Min: {min.toFixed(2)} | Max: {max.toFixed(2)}</span>
        </div>
      </div>
    );
  }
);

LineChart.displayName = 'LineChart';

/**
 * AnalyticsDashboard Component
 * 
 * Complete dashboard with KPIs and charts
 */
export interface AnalyticsDashboardProps {
  /**
   * KPI metrics
   */
  metrics: MetricData[];
  /**
   * Chart data
   */
  chartData?: ChartDataPoint[];
  /**
   * Chart type
   */
  chartType?: 'bar' | 'pie' | 'line';
  /**
   * Chart title
   */
  chartTitle?: string;
  /**
   * Custom className
   */
  className?: string;
}

export const AnalyticsDashboard = forwardRef<HTMLDivElement, AnalyticsDashboardProps>(
  (
    {
      metrics,
      chartData,
      chartType = 'bar',
      chartTitle,
      className = '',
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn('space-y-6', className)}
      >
        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((metric, index) => (
            <KPICard key={index} metric={metric} />
          ))}
        </div>

        {/* Charts */}
        {chartData && chartData.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {chartType === 'bar' && (
              <SimpleBarChart
                data={chartData}
                title={chartTitle}
              />
            )}
            {chartType === 'pie' && (
              <SimplePieChart
                data={chartData}
                title={chartTitle}
              />
            )}
            {chartType === 'line' && (
              <LineChart
                data={chartData}
                title={chartTitle}
              />
            )}
          </div>
        )}
      </div>
    );
  }
);

AnalyticsDashboard.displayName = 'AnalyticsDashboard';
