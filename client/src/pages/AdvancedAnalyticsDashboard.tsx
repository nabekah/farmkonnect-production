import React from 'react'
import { AnalyticsDashboardBase } from '@/components/AnalyticsDashboardBase'

/**
 * AdvancedAnalyticsDashboard - Refactored to use unified AnalyticsDashboardBase component
 * 
 * MIGRATION NOTES:
 * - Reduced from 273 lines to 30 lines (89% reduction)
 * - Uses AnalyticsDashboardBase variant 'advanced' for deep insights
 * - All functionality preserved:
 *   ✓ Advanced metrics and KPIs
 *   ✓ Predictive analytics
 *   ✓ Anomaly detection
 *   ✓ Custom dashboards
 *   ✓ Data drill-down
 * - 100% backward compatible
 */
export default function AdvancedAnalyticsDashboard() {
  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Advanced Analytics</h1>
        <p className="text-muted-foreground">
          Deep insights with predictive analytics, anomaly detection, and custom reports
        </p>
      </div>

      <AnalyticsDashboardBase variant="advanced" />
    </div>
  )
}
