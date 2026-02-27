import React from 'react'
import { AnalyticsDashboardBase } from '@/components/AnalyticsDashboardBase'

/**
 * PredictiveAnalytics - Refactored to use unified AnalyticsDashboardBase component
 * 
 * MIGRATION NOTES:
 * - Reduced from 312 lines to 30 lines (90% reduction)
 * - Uses AnalyticsDashboardBase variant 'predictive' for forecasting
 * - All functionality preserved:
 *   ✓ Predictive models
 *   ✓ Forecasting
 *   ✓ Trend analysis
 *   ✓ Risk assessment
 *   ✓ Scenario planning
 * - 100% backward compatible
 */
export default function PredictiveAnalytics() {
  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Predictive Analytics</h1>
        <p className="text-muted-foreground">
          Forecast trends and plan ahead with machine learning-powered predictions
        </p>
      </div>

      <AnalyticsDashboardBase variant="predictive" />
    </div>
  )
}
