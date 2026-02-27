# Performance Metrics Monitoring - Implementation Guide

## Overview

This guide provides setup instructions for monitoring performance metrics before, during, and after the dashboard refactoring phases. Performance monitoring ensures that refactoring achieves the target 10-15% improvement in page load times and 15-20% reduction in bundle size.

## Performance Metrics to Track

### 1. Bundle Size Metrics

**What to Measure:**
- Total JavaScript bundle size
- CSS bundle size
- Component-specific bundle impact
- Unused code (dead code elimination)

**Tools:**
- `webpack-bundle-analyzer` - Visualize bundle composition
- `bundlesize` - Automated bundle size checks
- `source-map-explorer` - Analyze source maps

**Setup:**

```bash
cd /home/ubuntu/farmkonnect_app

# Install bundle analysis tools
pnpm add -D webpack-bundle-analyzer bundlesize source-map-explorer

# Add scripts to package.json
```

Add to `package.json`:
```json
{
  "scripts": {
    "analyze:bundle": "webpack-bundle-analyzer dist/assets/*.js",
    "check:bundlesize": "bundlesize",
    "analyze:sourcemap": "source-map-explorer 'dist/assets/*.js'"
  }
}
```

**Baseline Measurement (Before Refactoring):**

```bash
# Build the project
pnpm build

# Analyze bundle
pnpm analyze:bundle

# Record metrics:
# - Total JS size: _____ KB
# - CSS size: _____ KB
# - Largest chunks: _____ KB
# - Component sizes:
#   - WorkerPerformanceDashboard: _____ KB
#   - FinancialDashboard: _____ KB
#   - AnalyticsDashboard: _____ KB
#   - FarmDashboard: _____ KB
```

### 2. Page Load Time Metrics

**What to Measure:**
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Time to Interactive (TTI)
- Cumulative Layout Shift (CLS)
- Total Blocking Time (TBT)

**Tools:**
- Chrome DevTools Lighthouse
- WebPageTest
- Google PageSpeed Insights
- Real User Monitoring (RUM)

**Setup - Lighthouse CI:**

```bash
# Install Lighthouse CI
pnpm add -D @lhci/cli@latest @lhci/config-builder@latest

# Create lighthouserc.json
cat > lighthouserc.json << 'EOF'
{
  "ci": {
    "collect": {
      "url": [
        "http://localhost:3000/worker-performance",
        "http://localhost:3000/financial-dashboard",
        "http://localhost:3000/analytics",
        "http://localhost:3000/farms"
      ],
      "numberOfRuns": 3,
      "settings": {
        "chromeFlags": "--no-sandbox"
      }
    },
    "upload": {
      "target": "temporary-public-storage"
    },
    "assert": {
      "preset": "lighthouse:recommended",
      "assertions": {
        "first-contentful-paint": ["error", { "minScore": 0.9 }],
        "largest-contentful-paint": ["error", { "minScore": 0.9 }],
        "cumulative-layout-shift": ["error", { "minScore": 0.9 }]
      }
    }
  }
}
EOF

# Add script to package.json
```

Add to `package.json`:
```json
{
  "scripts": {
    "lighthouse:baseline": "lhci autorun --config=lighthouserc.json"
  }
}
```

**Baseline Measurement (Before Refactoring):**

```bash
# Start dev server
pnpm run dev &

# Run Lighthouse baseline
pnpm lighthouse:baseline

# Record metrics for each page:
# Worker Performance Dashboard:
#   - FCP: _____ ms
#   - LCP: _____ ms
#   - TTI: _____ ms
#   - CLS: _____
#   - TBT: _____ ms
#   - Performance Score: _____/100

# Financial Dashboard:
#   - FCP: _____ ms
#   - LCP: _____ ms
#   - TTI: _____ ms
#   - CLS: _____
#   - TBT: _____ ms
#   - Performance Score: _____/100

# Analytics Dashboard:
#   - FCP: _____ ms
#   - LCP: _____ ms
#   - TTI: _____ ms
#   - CLS: _____
#   - TBT: _____ ms
#   - Performance Score: _____/100

# Farm Dashboard:
#   - FCP: _____ ms
#   - LCP: _____ ms
#   - TTI: _____ ms
#   - CLS: _____
#   - TBT: _____ ms
#   - Performance Score: _____/100
```

### 3. Memory Usage Metrics

**What to Measure:**
- Heap size
- Memory usage per component
- Memory leaks
- Garbage collection frequency

**Tools:**
- Chrome DevTools Memory tab
- Node.js heap snapshots
- Clinic.js

**Baseline Measurement (Before Refactoring):**

```bash
# In Chrome DevTools:
# 1. Open DevTools (F12)
# 2. Go to Memory tab
# 3. Take heap snapshot (baseline)
# 4. Navigate to /worker-performance
# 5. Wait for page to load
# 6. Take another heap snapshot
# 7. Compare snapshots

# Record metrics:
# - Baseline heap: _____ MB
# - After page load: _____ MB
# - Increase: _____ MB
# - Detached DOM nodes: _____
# - Event listeners: _____
```

### 4. Runtime Performance Metrics

**What to Measure:**
- React render time
- Component re-render frequency
- API response times
- Database query times

**Tools:**
- React DevTools Profiler
- Chrome DevTools Performance tab
- Server-side monitoring

**Setup - React Profiler:**

```bash
# In React DevTools:
# 1. Open DevTools (F12)
# 2. Go to React DevTools > Profiler tab
# 3. Click record button
# 4. Interact with dashboard
# 5. Stop recording
# 6. Analyze render times
```

**Baseline Measurement (Before Refactoring):**

```bash
# For each dashboard, record:
# - Initial render time: _____ ms
# - Re-render on filter change: _____ ms
# - Re-render on data update: _____ ms
# - Number of re-renders: _____
# - Wasted renders: _____
```

## Performance Baseline Report Template

Create a file to track metrics:

```bash
cat > PERFORMANCE_BASELINE.md << 'EOF'
# Performance Baseline Report

## Date: 2026-02-27
## Status: Before Refactoring

### Bundle Size Metrics

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Total JS | _____ KB | -15% | 🔴 Baseline |
| CSS | _____ KB | -5% | 🔴 Baseline |
| Largest Chunk | _____ KB | -20% | 🔴 Baseline |
| Worker Dashboard | _____ KB | -30% | 🔴 Baseline |
| Financial Dashboard | _____ KB | -30% | 🔴 Baseline |
| Analytics Dashboard | _____ KB | -25% | 🔴 Baseline |
| Farm Dashboard | _____ KB | -25% | 🔴 Baseline |

### Page Load Time Metrics

#### Worker Performance Dashboard
| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| FCP | _____ ms | -15% | 🔴 Baseline |
| LCP | _____ ms | -15% | 🔴 Baseline |
| TTI | _____ ms | -15% | 🔴 Baseline |
| CLS | _____ | < 0.1 | 🔴 Baseline |
| TBT | _____ ms | -20% | 🔴 Baseline |
| Performance Score | _____/100 | +10 | 🔴 Baseline |

#### Financial Dashboard
| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| FCP | _____ ms | -15% | 🔴 Baseline |
| LCP | _____ ms | -15% | 🔴 Baseline |
| TTI | _____ ms | -15% | 🔴 Baseline |
| CLS | _____ | < 0.1 | 🔴 Baseline |
| TBT | _____ ms | -20% | 🔴 Baseline |
| Performance Score | _____/100 | +10 | 🔴 Baseline |

#### Analytics Dashboard
| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| FCP | _____ ms | -15% | 🔴 Baseline |
| LCP | _____ ms | -15% | 🔴 Baseline |
| TTI | _____ ms | -15% | 🔴 Baseline |
| CLS | _____ | < 0.1 | 🔴 Baseline |
| TBT | _____ ms | -20% | 🔴 Baseline |
| Performance Score | _____/100 | +10 | 🔴 Baseline |

#### Farm Dashboard
| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| FCP | _____ ms | -15% | 🔴 Baseline |
| LCP | _____ ms | -15% | 🔴 Baseline |
| TTI | _____ ms | -15% | 🔴 Baseline |
| CLS | _____ | < 0.1 | 🔴 Baseline |
| TBT | _____ ms | -20% | 🔴 Baseline |
| Performance Score | _____/100 | +10 | 🔴 Baseline |

### Memory Usage Metrics

#### Worker Performance Dashboard
| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Baseline Heap | _____ MB | -10% | 🔴 Baseline |
| After Load | _____ MB | -10% | 🔴 Baseline |
| Increase | _____ MB | -15% | 🔴 Baseline |
| Detached Nodes | _____ | < 50 | 🔴 Baseline |
| Event Listeners | _____ | < 100 | 🔴 Baseline |

#### Financial Dashboard
| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Baseline Heap | _____ MB | -10% | 🔴 Baseline |
| After Load | _____ MB | -10% | 🔴 Baseline |
| Increase | _____ MB | -15% | 🔴 Baseline |
| Detached Nodes | _____ | < 50 | 🔴 Baseline |
| Event Listeners | _____ | < 100 | 🔴 Baseline |

#### Analytics Dashboard
| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Baseline Heap | _____ MB | -10% | 🔴 Baseline |
| After Load | _____ MB | -10% | 🔴 Baseline |
| Increase | _____ MB | -15% | 🔴 Baseline |
| Detached Nodes | _____ | < 50 | 🔴 Baseline |
| Event Listeners | _____ | < 100 | 🔴 Baseline |

#### Farm Dashboard
| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Baseline Heap | _____ MB | -10% | 🔴 Baseline |
| After Load | _____ MB | -10% | 🔴 Baseline |
| Increase | _____ MB | -15% | 🔴 Baseline |
| Detached Nodes | _____ | < 50 | 🔴 Baseline |
| Event Listeners | _____ | < 100 | 🔴 Baseline |

### Runtime Performance Metrics

#### Worker Performance Dashboard
| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Initial Render | _____ ms | -20% | 🔴 Baseline |
| Filter Re-render | _____ ms | -20% | 🔴 Baseline |
| Data Update Re-render | _____ ms | -20% | 🔴 Baseline |
| Re-render Count | _____ | -30% | 🔴 Baseline |
| Wasted Renders | _____ | -50% | 🔴 Baseline |

#### Financial Dashboard
| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Initial Render | _____ ms | -20% | 🔴 Baseline |
| Filter Re-render | _____ ms | -20% | 🔴 Baseline |
| Data Update Re-render | _____ ms | -20% | 🔴 Baseline |
| Re-render Count | _____ | -30% | 🔴 Baseline |
| Wasted Renders | _____ | -50% | 🔴 Baseline |

#### Analytics Dashboard
| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Initial Render | _____ ms | -20% | 🔴 Baseline |
| Filter Re-render | _____ ms | -20% | 🔴 Baseline |
| Data Update Re-render | _____ ms | -20% | 🔴 Baseline |
| Re-render Count | _____ | -30% | 🔴 Baseline |
| Wasted Renders | _____ | -50% | 🔴 Baseline |

#### Farm Dashboard
| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Initial Render | _____ ms | -20% | 🔴 Baseline |
| Filter Re-render | _____ ms | -20% | 🔴 Baseline |
| Data Update Re-render | _____ ms | -20% | 🔴 Baseline |
| Re-render Count | _____ | -30% | 🔴 Baseline |
| Wasted Renders | _____ | -50% | 🔴 Baseline |

## Performance Improvement Targets

### Phase 2 (Worker Performance)
- Bundle size reduction: 5-10%
- Page load time improvement: 10-15%
- Memory usage reduction: 8-12%
- Render time improvement: 15-20%

### Phase 3 (Financial Dashboard)
- Bundle size reduction: 5-10%
- Page load time improvement: 10-15%
- Memory usage reduction: 8-12%
- Render time improvement: 15-20%

### Phase 4 & 5 (Analytics & Farm)
- Bundle size reduction: 5-10% per phase
- Page load time improvement: 10-15% per phase
- Memory usage reduction: 8-12% per phase
- Render time improvement: 15-20% per phase

### Overall Target (All Phases)
- Total bundle size reduction: 15-20%
- Total page load improvement: 10-15%
- Total memory reduction: 10-12%
- Total render time improvement: 15-20%

## Monitoring During Refactoring

### After Each Phase:

```bash
# 1. Build the project
pnpm build

# 2. Analyze bundle
pnpm analyze:bundle

# 3. Run Lighthouse
pnpm lighthouse:baseline

# 4. Check memory usage in DevTools

# 5. Update PERFORMANCE_BASELINE.md with new metrics

# 6. Calculate improvements:
# - (Baseline - Current) / Baseline * 100 = % Improvement
```

### Automated Monitoring:

Add to CI/CD pipeline:

```yaml
# .github/workflows/performance.yml
name: Performance Monitoring

on: [push, pull_request]

jobs:
  performance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: pnpm install
      - run: pnpm build
      - run: pnpm analyze:bundle
      - run: pnpm lighthouse:baseline
```

## Success Criteria

✅ **Performance Monitoring Complete When:**
- Baseline metrics established for all 4 dashboards
- Bundle size tracked and monitored
- Page load times measured with Lighthouse
- Memory usage profiled
- Runtime performance analyzed
- Automated monitoring setup in CI/CD
- Performance improvement targets defined
- Monitoring dashboard created for tracking

## Next Steps

1. **Establish Baseline** - Run all measurements before Phase 2
2. **Monitor Phase 2** - Track metrics during worker performance consolidation
3. **Monitor Phase 3** - Track metrics during financial consolidation
4. **Compare Results** - Verify improvements match targets
5. **Optimize Further** - If targets not met, identify bottlenecks

---

**Document Created:** 2026-02-27
**Status:** Ready for Implementation
**Next Review:** After Phase 2 Completion
EOF
```

## Performance Monitoring Checklist

- [ ] Bundle analysis tools installed
- [ ] Lighthouse CI configured
- [ ] Baseline metrics established
- [ ] Performance baseline report created
- [ ] Monitoring scripts added to package.json
- [ ] CI/CD performance monitoring setup
- [ ] Team notified of performance targets
- [ ] Monitoring dashboard created

## Questions & Support

For questions about performance monitoring:
- Review Chrome DevTools documentation
- Check Lighthouse CI documentation
- Refer to webpack-bundle-analyzer docs
- Review performance best practices guide

---

**Document Created:** 2026-02-27
**Status:** Ready for Implementation
**Next Review:** After Phase 2 Completion
