import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react';
import { KPICard, SimpleBarChart, SimplePieChart, LineChart, AnalyticsDashboard } from './AnalyticsDashboard';
import { RealtimeManager, useRealtime, useBroadcast } from '../../lib/realtime';
import { CacheManager, DataSyncManager, useCache, useDataSync, useOptimisticUpdate } from '../../lib/dataManagement';

/**
 * Analytics Dashboard E2E Tests
 */
describe('Analytics Dashboard E2E', () => {
  const mockMetrics = [
    {
      label: 'Total Yield',
      value: 1250,
      unit: 'kg',
      change: 12,
      isPositive: true,
      color: 'success' as const,
    },
    {
      label: 'Soil Health',
      value: 85,
      unit: '%',
      change: -5,
      isPositive: false,
      color: 'warning' as const,
    },
  ];

  const mockChartData = [
    { label: 'Jan', value: 100 },
    { label: 'Feb', value: 150 },
    { label: 'Mar', value: 120 },
  ];

  it('should render KPI cards with metrics', () => {
    render(
      <KPICard
        metric={mockMetrics[0]}
      />
    );

    expect(screen.getByText('Total Yield')).toBeInTheDocument();
    expect(screen.getByText('1250')).toBeInTheDocument();
    expect(screen.getByText('kg')).toBeInTheDocument();
  });

  it('should display trend indicators', () => {
    render(
      <KPICard
        metric={mockMetrics[0]}
      />
    );

    expect(screen.getByText('+12%')).toBeInTheDocument();
  });

  it('should render bar chart', () => {
    render(
      <SimpleBarChart
        data={mockChartData}
        title="Monthly Yield"
      />
    );

    expect(screen.getByText('Monthly Yield')).toBeInTheDocument();
    mockChartData.forEach((point) => {
      expect(screen.getByText(point.label)).toBeInTheDocument();
    });
  });

  it('should render pie chart with legend', () => {
    render(
      <SimplePieChart
        data={mockChartData}
        title="Distribution"
      />
    );

    expect(screen.getByText('Distribution')).toBeInTheDocument();
    mockChartData.forEach((point) => {
      expect(screen.getByText(point.label)).toBeInTheDocument();
    });
  });

  it('should render line chart', () => {
    render(
      <LineChart
        data={mockChartData}
        title="Trend"
        yAxisLabel="Value"
      />
    );

    expect(screen.getByText('Trend')).toBeInTheDocument();
  });

  it('should render complete dashboard', () => {
    render(
      <AnalyticsDashboard
        metrics={mockMetrics}
        chartData={mockChartData}
        chartType="bar"
        chartTitle="Performance"
      />
    );

    expect(screen.getByText('Total Yield')).toBeInTheDocument();
    expect(screen.getByText('Soil Health')).toBeInTheDocument();
    expect(screen.getByText('Performance')).toBeInTheDocument();
  });
});

/**
 * Realtime Features E2E Tests
 */
describe('Realtime Features E2E', () => {
  let manager: RealtimeManager;

  beforeEach(() => {
    manager = new RealtimeManager('ws://localhost:8080', {
      autoReconnect: false,
    });
  });

  afterEach(() => {
    manager.disconnect();
  });

  it('should manage realtime events', (done) => {
    const events: any[] = [];

    manager.on('test', (event) => {
      events.push(event);
      expect(events.length).toBeGreaterThan(0);
      done();
    });

    // Simulate event
    setTimeout(() => {
      manager.send({ type: 'test', data: 'hello' });
    }, 100);
  });

  it('should handle connection events', (done) => {
    let connected = false;

    manager.on('connect', () => {
      connected = true;
    });

    manager.on('disconnect', () => {
      expect(connected).toBe(true);
      done();
    });

    // Simulate disconnect
    setTimeout(() => {
      manager.disconnect();
    }, 100);
  });

  it('should track connection state', () => {
    expect(manager.isConnected()).toBe(false);
  });
});

/**
 * Data Management E2E Tests
 */
describe('Data Management E2E', () => {
  it('should cache data with TTL', async () => {
    const cache = new CacheManager();
    const testData = { id: 1, name: 'Test' };

    cache.set('test', testData, 1000);
    expect(cache.get('test')).toEqual(testData);

    // Wait for TTL to expire
    await new Promise((resolve) => setTimeout(resolve, 1100));
    expect(cache.get('test')).toBeNull();

    cache.destroy();
  });

  it('should manage cache size', () => {
    const cache = new CacheManager();

    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    cache.set('key3', 'value3');

    expect(cache.size()).toBe(3);

    cache.delete('key1');
    expect(cache.size()).toBe(2);

    cache.clear();
    expect(cache.size()).toBe(0);

    cache.destroy();
  });

  it('should sync data', async () => {
    const syncedData: any[] = [];
    const syncFn = async (data: any) => {
      syncedData.push(data);
      return { ...data, synced: true };
    };

    const manager = new DataSyncManager(syncFn);

    manager.queue('test', { id: 1, value: 'data' });
    await manager.sync();

    expect(syncedData.length).toBe(1);
    expect(syncedData[0]).toEqual({ id: 1, value: 'data' });

    manager.destroy();
  });

  it('should handle sync errors', async () => {
    const syncFn = async () => {
      throw new Error('Sync failed');
    };

    const manager = new DataSyncManager(syncFn);

    manager.queue('test', { id: 1 });

    try {
      await manager.sync();
    } catch (error) {
      expect(error).toBeDefined();
    }

    expect(manager.getPendingCount()).toBe(1);

    manager.destroy();
  });
});

/**
 * useCache Hook E2E Tests
 */
describe('useCache Hook E2E', () => {
  it('should fetch and cache data', async () => {
    const fetcher = vi.fn(async () => ({ id: 1, name: 'Test' }));

    const { result } = renderHook(() =>
      useCache('test', fetcher, { ttl: 5000 })
    );

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual({ id: 1, name: 'Test' });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('should handle fetch errors', async () => {
    const fetcher = vi.fn(async () => {
      throw new Error('Fetch failed');
    });

    const { result } = renderHook(() =>
      useCache('test', fetcher)
    );

    await waitFor(() => {
      expect(result.current.error).toBeDefined();
    });

    expect(result.current.data).toBeNull();
  });

  it('should revalidate data', async () => {
    const fetcher = vi.fn(async () => ({ id: 1 }));

    const { result } = renderHook(() =>
      useCache('test', fetcher)
    );

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });

    expect(fetcher).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.revalidate();
    });

    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});

/**
 * useDataSync Hook E2E Tests
 */
describe('useDataSync Hook E2E', () => {
  it('should queue and sync data', async () => {
    const syncFn = vi.fn(async (data) => ({ ...data, synced: true }));

    const { result } = renderHook(() =>
      useDataSync(syncFn)
    );

    act(() => {
      result.current.queue('test', { id: 1, value: 'data' });
    });

    expect(result.current.pendingCount).toBe(1);

    await act(async () => {
      await result.current.sync();
    });

    expect(result.current.pendingCount).toBe(0);
    expect(syncFn).toHaveBeenCalled();
  });

  it('should handle sync errors gracefully', async () => {
    const syncFn = vi.fn(async () => {
      throw new Error('Sync failed');
    });

    const { result } = renderHook(() =>
      useDataSync(syncFn)
    );

    act(() => {
      result.current.queue('test', { id: 1 });
    });

    await act(async () => {
      try {
        await result.current.sync();
      } catch (error) {
        // Expected
      }
    });

    expect(result.current.error).toBeDefined();
    expect(result.current.pendingCount).toBe(1);
  });
});

/**
 * useOptimisticUpdate Hook E2E Tests
 */
describe('useOptimisticUpdate Hook E2E', () => {
  it('should update optimistically', async () => {
    const updateFn = vi.fn(async (data) => ({ ...data, updated: true }));

    const { result } = renderHook(() =>
      useOptimisticUpdate({ id: 1, value: 'old' }, updateFn)
    );

    expect(result.current.data).toEqual({ id: 1, value: 'old' });

    await act(async () => {
      await result.current.update({ id: 1, value: 'new' });
    });

    expect(result.current.data.value).toBe('new');
    expect(updateFn).toHaveBeenCalled();
  });

  it('should rollback on error', async () => {
    const updateFn = vi.fn(async () => {
      throw new Error('Update failed');
    });

    const { result } = renderHook(() =>
      useOptimisticUpdate({ id: 1, value: 'old' }, updateFn)
    );

    const originalData = result.current.data;

    await act(async () => {
      await result.current.update({ id: 1, value: 'new' });
    });

    expect(result.current.data).toEqual(originalData);
    expect(result.current.error).toBeDefined();
  });
});

/**
 * Integration E2E Tests
 */
describe('Integration E2E', () => {
  it('should work together: cache + sync + optimistic update', async () => {
    const cache = new CacheManager();
    const syncFn = vi.fn(async (data) => data);
    const syncManager = new DataSyncManager(syncFn);

    // Cache data
    const initialData = { id: 1, value: 'initial' };
    cache.set('item:1', initialData);

    // Queue sync
    syncManager.queue('item:1', { ...initialData, value: 'updated' });

    // Sync
    await syncManager.sync();

    expect(syncFn).toHaveBeenCalled();
    expect(cache.get('item:1')).toEqual(initialData);

    cache.destroy();
    syncManager.destroy();
  });

  it('should handle complex data flow', async () => {
    const cache = new CacheManager();
    const fetcher = vi.fn(async () => ({ id: 1, items: [] }));
    const syncFn = vi.fn(async (data) => data);

    // Simulate data flow
    const data = await fetcher();
    cache.set('dashboard', data);

    const syncManager = new DataSyncManager(syncFn);
    syncManager.queue('dashboard', { ...data, items: [1, 2, 3] });

    await syncManager.sync();

    expect(cache.get('dashboard')).toBeDefined();
    expect(syncFn).toHaveBeenCalled();

    cache.destroy();
    syncManager.destroy();
  });
});
