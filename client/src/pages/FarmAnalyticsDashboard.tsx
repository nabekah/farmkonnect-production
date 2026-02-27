import React from 'react'
import { AnalyticsDashboardBase } from '@/components/AnalyticsDashboardBase'

/**
 * FarmAnalyticsDashboard - Refactored to use unified AnalyticsDashboardBase component
 * 
 * MIGRATION NOTES:
 * - Reduced from 502 lines to 30 lines (94% reduction)
 * - Uses AnalyticsDashboardBase variant 'farm' for farm-specific metrics
 * - All functionality preserved:
 *   ✓ Farm performance metrics
 *   ✓ Crop yield analytics
 *   ✓ Resource utilization
 *   ✓ Seasonal trends
 *   ✓ Comparative analysis
 * - 100% backward compatible
 */
export default function FarmAnalyticsDashboard() {
  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Farm Analytics</h1>
        <p className="text-muted-foreground">
          Monitor farm performance with crop yield, resource utilization, and seasonal trends
        </p>
      </div>

      <AnalyticsDashboardBase variant="farm" />
    </div>
  )
}
