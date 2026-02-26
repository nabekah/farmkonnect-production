import React from 'react'
import { WorkerPerformanceBase } from '@/components/WorkerPerformanceBase'

/**
 * WorkerPerformanceDashboard - Refactored to use unified WorkerPerformanceBase component
 * Displays comprehensive worker performance metrics with charts and real-time updates
 */
export default function WorkerPerformanceDashboard() {
  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Worker Performance</h1>
        <p className="text-muted-foreground">
          Track worker productivity, hours worked, and performance metrics in real-time
        </p>
      </div>

      <WorkerPerformanceBase variant="realTime" />
    </div>
  )
}
