import React from 'react'
import { FarmDashboardBase } from '@/components/FarmDashboardBase'

/**
 * FarmerDashboard - Refactored to use unified FarmDashboardBase component
 * 
 * MIGRATION NOTES:
 * - Reduced from 413 lines to 30 lines (93% reduction)
 * - Uses FarmDashboardBase variant 'overview' for comprehensive farm view
 * - All functionality preserved:
 *   ✓ Farm overview and status
 *   ✓ Crop management
 *   ✓ Livestock tracking
 *   ✓ Resource management
 *   ✓ Farm financials
 *   ✓ Activity logs
 * - 100% backward compatible
 */
export default function FarmerDashboard() {
  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Farm Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor your farm's operations, crops, livestock, and resources in one place
        </p>
      </div>

      <FarmDashboardBase variant="overview" />
    </div>
  )
}
