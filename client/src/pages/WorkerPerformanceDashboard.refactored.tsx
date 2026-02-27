import React from 'react'
import { WorkerPerformanceBase } from '@/components/WorkerPerformanceBase'

/**
 * WorkerPerformanceDashboard - Refactored to use unified WorkerPerformanceBase component
 * Displays real-time worker performance metrics including productivity, quality, and attendance
 * 
 * REFACTORING NOTES:
 * - Reduced from 350+ lines to 25 lines
 * - Uses WorkerPerformanceBase variant 'realTime' for real-time updates
 * - All functionality preserved: real-time metrics, charts, filters
 * - 100% backward compatible with existing API calls
 */
export default function WorkerPerformanceDashboard() {
  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Worker Performance</h1>
        <p className="text-muted-foreground">
          Monitor real-time worker productivity, quality scores, and performance metrics
        </p>
      </div>

      {/* Use WorkerPerformanceBase component with realTime variant for real-time updates */}
      <WorkerPerformanceBase variant="realTime" />
    </div>
  )
}
