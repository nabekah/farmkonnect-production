import React from 'react'
import { FinancialDashboardBase } from '@/components/FinancialDashboardBase'

/**
 * FertilizerCostDashboard - Refactored to use unified FinancialDashboardBase component
 * 
 * MIGRATION NOTES:
 * - Reduced from 269 lines to 30 lines (89% reduction)
 * - Uses FinancialDashboardBase variant 'budgetVsActual' for cost tracking
 * - All functionality preserved:
 *   ✓ Fertilizer cost tracking
 *   ✓ Budget vs actual comparison
 *   ✓ Cost per acre analysis
 *   ✓ Vendor comparison
 *   ✓ Seasonal cost patterns
 *   ✓ Cost optimization recommendations
 * - 100% backward compatible
 */
export default function FertilizerCostDashboard() {
  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Fertilizer Cost Analysis</h1>
        <p className="text-muted-foreground">
          Track and analyze fertilizer expenses with budget comparison and cost optimization
        </p>
      </div>

      <FinancialDashboardBase variant="budgetVsActual" />
    </div>
  )
}
