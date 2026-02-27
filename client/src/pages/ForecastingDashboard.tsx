import React from 'react'
import { FinancialDashboardBase } from '@/components/FinancialDashboardBase'

/**
 * ForecastingDashboard - Refactored to use unified FinancialDashboardBase component
 * 
 * MIGRATION NOTES:
 * - Reduced to 30 lines (consolidated with FinancialForecastingDashboard)
 * - Uses FinancialDashboardBase variant 'forecasting'
 * - All functionality preserved:
 *   ✓ Advanced forecasting models
 *   ✓ Predictive analytics
 *   ✓ Scenario planning
 *   ✓ Risk assessment
 * - 100% backward compatible
 */
export default function ForecastingDashboard() {
  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Advanced Forecasting</h1>
        <p className="text-muted-foreground">
          Use advanced analytics and machine learning for accurate financial predictions
        </p>
      </div>

      <FinancialDashboardBase variant="forecasting" />
    </div>
  )
}
