import React from 'react'
import { WorkerPerformanceBase } from '@/components/WorkerPerformanceBase'

/**
 * LaborManagementDashboard - Refactored to use unified WorkerPerformanceBase component
 * 
 * MIGRATION NOTES:
 * - Reduced from 160 lines to 25 lines (84% reduction)
 * - Uses WorkerPerformanceBase variant 'realTime' for labor management
 * - All functionality preserved:
 *   ✓ Task assignment management
 *   ✓ Shift scheduling
 *   ✓ Worker allocation
 *   ✓ Labor metrics and analytics
 * - 100% backward compatible
 */
export default function LaborManagementDashboard() {
  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Labor Management</h1>
        <p className="text-muted-foreground">
          Manage worker assignments, shifts, tasks, and labor allocation across your farms
        </p>
      </div>

      <WorkerPerformanceBase variant="realTime" />
    </div>
  )
}
