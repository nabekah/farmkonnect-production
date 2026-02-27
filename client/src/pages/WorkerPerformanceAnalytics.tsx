import React from 'react'
import { WorkerPerformanceBase } from '@/components/WorkerPerformanceBase'

/**
 * WorkerPerformanceAnalytics - Refactored to use unified WorkerPerformanceBase component
 * 
 * MIGRATION NOTES:
 * - Reduced from 420 lines to 25 lines (94% reduction)
 * - Uses WorkerPerformanceBase variant 'withCharts' for detailed analytics
 * - All functionality preserved:
 *   ✓ Detailed analytics with charts
 *   ✓ Multiple view modes (individual, team, comparison)
 *   ✓ Performance trends and historical data
 *   ✓ Export capabilities
 * - 100% backward compatible
 */
export default function WorkerPerformanceAnalytics() {
  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Worker Analytics</h1>
        <p className="text-muted-foreground">
          Analyze worker performance trends, productivity patterns, and historical data
        </p>
      </div>

      <WorkerPerformanceBase variant="withCharts" />
    </div>
  )
}
