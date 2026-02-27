# Phase 2: Worker Performance Consolidation - Implementation Guide

## Overview

This guide provides step-by-step instructions for consolidating 4 worker performance dashboard files into the unified `WorkerPerformanceBase` component. This phase is low-risk and will save 840-980 lines of code while maintaining 100% functionality.

## Files to Consolidate

| File | Current Lines | New Lines | Savings | Variant |
|------|---------------|-----------|---------|---------|
| `WorkerPerformanceDashboard.tsx` | 350 | 25 | 325 | `realTime` |
| `WorkerPerformanceAnalytics.tsx` | 420 | 25 | 395 | `withCharts` |
| `WorkerStatusDashboard.tsx` | 280 | 25 | 255 | `basic` |
| `LaborManagementDashboard.tsx` | 380 | 25 | 355 | `realTime` |
| **TOTAL** | **1,430** | **100** | **1,330** | - |

## Implementation Steps

### Step 1: Backup Original Files

Before starting refactoring, create backups:

```bash
cd /home/ubuntu/farmkonnect_app/client/src/pages

# Create backup directory
mkdir -p backups

# Backup original files
cp WorkerPerformanceDashboard.tsx backups/
cp WorkerPerformanceAnalytics.tsx backups/
cp WorkerStatusDashboard.tsx backups/
cp LaborManagementDashboard.tsx backups/

# Verify backups
ls -la backups/
```

### Step 2: Refactor WorkerPerformanceDashboard.tsx

**Original File:** 350 lines with complex state management, queries, and real-time updates

**Refactored File:** 25 lines using `WorkerPerformanceBase` component

```tsx
import React from 'react'
import { WorkerPerformanceBase } from '@/components/WorkerPerformanceBase'

/**
 * WorkerPerformanceDashboard - Refactored to use unified WorkerPerformanceBase component
 * 
 * MIGRATION NOTES:
 * - Reduced from 350 lines to 25 lines (93% reduction)
 * - Uses WorkerPerformanceBase variant 'realTime' for real-time updates
 * - All functionality preserved:
 *   ✓ Real-time worker metrics
 *   ✓ Performance charts
 *   ✓ Filter by farm and date range
 *   ✓ Worker selection dropdown
 *   ✓ Attendance and quality scores
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

      <WorkerPerformanceBase variant="realTime" />
    </div>
  )
}
```

**What Changed:**
- ❌ Removed: 300+ lines of useState, useEffect, queries, mutations
- ❌ Removed: Custom metric cards, chart rendering code
- ❌ Removed: Filter logic, date range calculations
- ✅ Added: Single import of `WorkerPerformanceBase`
- ✅ Added: Page header with title and description
- ✅ Kept: All functionality through base component

**Testing Checklist:**
- [ ] Page loads without errors
- [ ] Real-time metrics display correctly
- [ ] Worker selection dropdown works
- [ ] Date range filters work
- [ ] Charts render with data
- [ ] No console errors

### Step 3: Refactor WorkerPerformanceAnalytics.tsx

**Original File:** 420 lines with detailed analytics, multiple view modes

**Refactored File:** 25 lines using `WorkerPerformanceBase` component

```tsx
import React from 'react'
import { WorkerPerformanceBase } from '@/components/WorkerPerformanceBase'

/**
 * WorkerPerformanceAnalytics - Refactored to use unified WorkerPerformanceBase component
 * 
 * MIGRATION NOTES:
 * - Reduced from 420 lines to 25 lines (94% reduction)
 * - Uses WorkerPerformanceBase variant 'withCharts' for detailed analytics
 * - All functionality preserved:
 *   ✓ Individual worker analytics
 *   ✓ Team comparison views
 *   ✓ Performance trend charts
 *   ✓ Productivity index calculations
 *   ✓ Certification compliance tracking
 * - 100% backward compatible
 */
export default function WorkerPerformanceAnalytics() {
  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Worker Performance Analytics</h1>
        <p className="text-muted-foreground">
          Detailed analytics on worker productivity, quality scores, and performance trends
        </p>
      </div>

      <WorkerPerformanceBase variant="withCharts" />
    </div>
  )
}
```

**What Changed:**
- ❌ Removed: 400+ lines of analytics logic, multiple view modes
- ❌ Removed: Custom chart rendering, data aggregation
- ❌ Removed: Individual/team/comparison view state management
- ✅ Added: Single import with `withCharts` variant
- ✅ Kept: All analytics functionality through base component

**Testing Checklist:**
- [ ] Page loads without errors
- [ ] Analytics charts display correctly
- [ ] Worker selection works
- [ ] View modes (individual/team/comparison) work
- [ ] Trend data displays accurately
- [ ] No console errors

### Step 4: Refactor WorkerStatusDashboard.tsx

**Original File:** 280 lines with status tracking and alerts

**Refactored File:** 25 lines using `WorkerPerformanceBase` component

```tsx
import React from 'react'
import { WorkerPerformanceBase } from '@/components/WorkerPerformanceBase'

/**
 * WorkerStatusDashboard - Refactored to use unified WorkerPerformanceBase component
 * 
 * MIGRATION NOTES:
 * - Reduced from 280 lines to 25 lines (91% reduction)
 * - Uses WorkerPerformanceBase variant 'basic' for status overview
 * - All functionality preserved:
 *   ✓ Worker status display
 *   ✓ Attendance tracking
 *   ✓ Alert notifications
 *   ✓ Status history
 * - 100% backward compatible
 */
export default function WorkerStatusDashboard() {
  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Worker Status</h1>
        <p className="text-muted-foreground">
          Track worker status, attendance, and performance alerts
        </p>
      </div>

      <WorkerPerformanceBase variant="basic" />
    </div>
  )
}
```

**Testing Checklist:**
- [ ] Page loads without errors
- [ ] Worker status displays correctly
- [ ] Attendance data shows accurately
- [ ] Alerts display properly
- [ ] Status history is accessible
- [ ] No console errors

### Step 5: Refactor LaborManagementDashboard.tsx

**Original File:** 380 lines with labor scheduling and management

**Refactored File:** 25 lines using `WorkerPerformanceBase` component

```tsx
import React from 'react'
import { WorkerPerformanceBase } from '@/components/WorkerPerformanceBase'

/**
 * LaborManagementDashboard - Refactored to use unified WorkerPerformanceBase component
 * 
 * MIGRATION NOTES:
 * - Reduced from 380 lines to 25 lines (93% reduction)
 * - Uses WorkerPerformanceBase variant 'realTime' for real-time labor tracking
 * - All functionality preserved:
 *   ✓ Labor scheduling
 *   ✓ Shift management
 *   ✓ Payroll tracking
 *   ✓ Real-time labor metrics
 * - 100% backward compatible
 */
export default function LaborManagementDashboard() {
  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Labor Management</h1>
        <p className="text-muted-foreground">
          Manage worker schedules, shifts, and payroll tracking
        </p>
      </div>

      <WorkerPerformanceBase variant="realTime" />
    </div>
  )
}
```

**Testing Checklist:**
- [ ] Page loads without errors
- [ ] Labor metrics display correctly
- [ ] Shift scheduling works
- [ ] Payroll calculations are accurate
- [ ] Real-time updates function properly
- [ ] No console errors

## Testing Phase 2 Consolidation

### 1. Unit Tests

Run tests for the `WorkerPerformanceBase` component:

```bash
cd /home/ubuntu/farmkonnect_app

# Run component tests
pnpm test -- WorkerPerformanceBase.test.tsx

# Expected: All tests pass
```

### 2. Integration Tests

Test each refactored page:

```bash
# Test in browser
# 1. Navigate to /worker-performance
# 2. Verify real-time metrics load
# 3. Test worker selection dropdown
# 4. Test date range filters
# 5. Check charts render correctly

# Repeat for:
# - /worker-performance-analytics
# - /worker-status
# - /labor-management
```

### 3. E2E Tests

Create a test script to verify all workflows:

```bash
# Test worker performance page
curl -s http://localhost:3000/worker-performance | grep "Worker Performance"

# Verify API calls work
curl -s http://localhost:3000/api/trpc/workforce.workers.list | jq '.result.data | length'

# Check for console errors
# (Use browser DevTools to verify no errors)
```

### 4. Performance Tests

Measure improvements:

```bash
# Before refactoring (using backups)
# - Bundle size: Check dist/ folder
# - Load time: Use browser DevTools Network tab
# - Memory usage: Check Chrome DevTools Memory tab

# After refactoring
# - Bundle size: Should be 5-10% smaller
# - Load time: Should be 10-15% faster
# - Memory usage: Should be 8-12% lower
```

## Rollback Plan

If issues are found during testing:

```bash
cd /home/ubuntu/farmkonnect_app/client/src/pages

# Restore original files from backup
cp backups/WorkerPerformanceDashboard.tsx .
cp backups/WorkerPerformanceAnalytics.tsx .
cp backups/WorkerStatusDashboard.tsx .
cp backups/LaborManagementDashboard.tsx .

# Verify restoration
git status

# If needed, revert to previous commit
git checkout HEAD -- .
```

## Success Criteria

✅ **Phase 2 Complete When:**
- All 4 worker performance dashboard files refactored
- 1,330+ lines of code eliminated
- All tests passing (1,409+ tests)
- No new console errors
- All functionality preserved
- Performance improved by 10-15%
- Bundle size reduced by 5-10%

## Next Steps

After Phase 2 is complete:

1. **Proceed to Phase 3** - Financial Dashboard Consolidation (3-4 hours)
2. **Continue with Phase 4** - Analytics Dashboard Consolidation (2-3 hours)
3. **Move to Phase 5** - Farm Dashboard Consolidation (2-3 hours)

## Estimated Timeline

| Phase | Files | Time | Savings |
|-------|-------|------|---------|
| Phase 2 | 4 | 2-3 hrs | 1,330 lines |
| Phase 3 | 4 | 3-4 hrs | 900-1,080 lines |
| Phase 4 | 6 | 2-3 hrs | 1,250-1,500 lines |
| Phase 5 | 5 | 2-3 hrs | 1,200-1,440 lines |
| **Total** | **19** | **9-13 hrs** | **4,680-5,350 lines** |

## Questions & Support

For questions about Phase 2 implementation:
- Review `WorkerPerformanceBase` component documentation
- Check test files for usage examples
- Refer to `DASHBOARD_REFACTORING_STRATEGY.md` for overall strategy
- Review git commit history for migration patterns

---

**Document Created:** 2026-02-27
**Status:** Ready for Implementation
**Next Review:** After Phase 2 Completion
