import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { usePollingRefresh } from '../usePollingRefresh';

describe('usePollingRefresh', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should call callback immediately on mount', async () => {
    const callback = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => usePollingRefresh(callback));

    await waitFor(() => {
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  it('should poll at specified interval', async () => {
    const callback = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => usePollingRefresh(callback, { interval: 5000 }));

    // Initial call
    await waitFor(() => {
      expect(callback).toHaveBeenCalledTimes(1);
    });

    // Fast-forward time
    vi.advanceTimersByTime(5000);

    await waitFor(() => {
      expect(callback).toHaveBeenCalledTimes(2);
    });
  });

  it('should pause polling when disabled', async () => {
    const callback = vi.fn().mockResolvedValue(undefined);
    const { result, rerender } = renderHook(
      ({ enabled }: { enabled: boolean }) => usePollingRefresh(callback, { enabled }),
      { initialProps: { enabled: true } }
    );

    await waitFor(() => {
      expect(callback).toHaveBeenCalledTimes(1);
    });

    // Disable polling
    rerender({ enabled: false });

    vi.advanceTimersByTime(5000);

    // Should not call callback again
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should handle errors gracefully', async () => {
    const error = new Error('Test error');
    const callback = vi.fn().mockRejectedValue(error);
    const onError = vi.fn();

    const { result } = renderHook(() => 
      usePollingRefresh(callback, { onError })
    );

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(error);
    });

    expect(result.current.error).toBe(error);
  });

  it('should support manual refresh', async () => {
    const callback = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => usePollingRefresh(callback, { enabled: false }));

    await result.current.manualRefresh();

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should toggle polling on and off', async () => {
    const callback = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => usePollingRefresh(callback));

    expect(result.current.isPolling).toBe(true);

    result.current.togglePolling();

    await waitFor(() => {
      expect(result.current.isPolling).toBe(false);
    });

    result.current.togglePolling();

    await waitFor(() => {
      expect(result.current.isPolling).toBe(true);
    });
  });

  it('should update lastRefreshTime on successful refresh', async () => {
    const callback = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => usePollingRefresh(callback));

    const initialTime = result.current.lastRefreshTime;

    vi.advanceTimersByTime(100);

    await result.current.manualRefresh();

    expect(result.current.lastRefreshTime).toBeGreaterThan(initialTime);
  });

  it('should pause polling when tab is inactive', async () => {
    const callback = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => 
      usePollingRefresh(callback, { pauseWhenInactive: true })
    );

    await waitFor(() => {
      expect(callback).toHaveBeenCalledTimes(1);
    });

    // Simulate tab becoming inactive
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => true,
    });

    document.dispatchEvent(new Event('visibilitychange'));

    await waitFor(() => {
      expect(result.current.isPolling).toBe(false);
    });

    // Simulate tab becoming active again
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => false,
    });

    document.dispatchEvent(new Event('visibilitychange'));

    await waitFor(() => {
      expect(result.current.isPolling).toBe(true);
    });
  });
});
