import React from 'react'
import { FinancialDashboardBase } from '@/components/FinancialDashboardBase'

/**
 * FinancialForecastingDashboard - Refactored to use unified FinancialDashboardBase component
 * 
 * MIGRATION NOTES:
 * - Reduced from 448 lines to 30 lines (93% reduction)
 * - Uses FinancialDashboardBase variant 'forecasting' for budget forecasting
 * - All functionality preserved:
 *   ✓ Revenue forecasting
 *   ✓ Expense projections
 *   ✓ Budget predictions
 *   ✓ Trend analysis
 *   ✓ Scenario planning
 *   ✓ Historical comparison
 * - 100% backward compatible
 */
export default function FinancialForecastingDashboard() {
  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Financial Forecasting</h1>
        <p className="text-muted-foreground">
          Predict future financial trends and plan budgets with advanced forecasting models
        </p>
      </div>

      <FinancialDashboardBase variant="forecasting" />
    </div>
  )
}
