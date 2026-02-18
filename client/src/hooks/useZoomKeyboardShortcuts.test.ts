import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useZoomKeyboardShortcuts } from './useZoomKeyboardShortcuts';

describe('useZoomKeyboardShortcuts', () => {
  const STORAGE_KEY = 'farmkonnect-zoom-level';

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.style.zoom = '';
    document.body.style.zoom = '';
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should initialize with default zoom level from localStorage', () => {
    localStorage.setItem(STORAGE_KEY, '0.90');
    renderHook(() => useZoomKeyboardShortcuts());
    
    expect(localStorage.getItem(STORAGE_KEY)).toBe('0.90');
  });

  it('should zoom in with Ctrl + Plus', () => {
    localStorage.setItem(STORAGE_KEY, '0.90');
    renderHook(() => useZoomKeyboardShortcuts());

    const event = new KeyboardEvent('keydown', {
      key: '+',
      ctrlKey: true,
      bubbles: true,
    });

    window.dispatchEvent(event);

    const savedZoom = localStorage.getItem(STORAGE_KEY);
    expect(savedZoom).toBeTruthy();
    const zoom = parseFloat(savedZoom!);
    expect(zoom).toBeGreaterThan(0.90);
    expect(zoom).toBeLessThanOrEqual(0.95);
  });

  it('should zoom out with Ctrl + Minus', () => {
    localStorage.setItem(STORAGE_KEY, '0.90');
    renderHook(() => useZoomKeyboardShortcuts());

    const event = new KeyboardEvent('keydown', {
      key: '-',
      ctrlKey: true,
      bubbles: true,
    });

    window.dispatchEvent(event);

    const savedZoom = localStorage.getItem(STORAGE_KEY);
    expect(savedZoom).toBeTruthy();
    const zoom = parseFloat(savedZoom!);
    expect(zoom).toBeLessThan(0.90);
    expect(zoom).toBeGreaterThanOrEqual(0.85);
  });

  it('should reset to default with Ctrl + 0', () => {
    localStorage.setItem(STORAGE_KEY, '1.25');
    renderHook(() => useZoomKeyboardShortcuts());

    const event = new KeyboardEvent('keydown', {
      key: '0',
      ctrlKey: true,
      bubbles: true,
    });

    window.dispatchEvent(event);

    const savedZoom = localStorage.getItem(STORAGE_KEY);
    expect(savedZoom).toBe('0.9');
  });

  it('should respect minimum zoom level (75%)', () => {
    localStorage.setItem(STORAGE_KEY, '0.75');
    renderHook(() => useZoomKeyboardShortcuts());

    // Try to zoom out further
    const event = new KeyboardEvent('keydown', {
      key: '-',
      ctrlKey: true,
      bubbles: true,
    });

    window.dispatchEvent(event);

    const savedZoom = localStorage.getItem(STORAGE_KEY);
    expect(parseFloat(savedZoom!)).toBeGreaterThanOrEqual(0.75);
  });

  it('should respect maximum zoom level (150%)', () => {
    localStorage.setItem(STORAGE_KEY, '1.50');
    renderHook(() => useZoomKeyboardShortcuts());

    // Try to zoom in further
    const event = new KeyboardEvent('keydown', {
      key: '+',
      ctrlKey: true,
      bubbles: true,
    });

    window.dispatchEvent(event);

    const savedZoom = localStorage.getItem(STORAGE_KEY);
    expect(parseFloat(savedZoom!)).toBeLessThanOrEqual(1.50);
  });

  it('should not zoom with Ctrl + other keys', () => {
    localStorage.setItem(STORAGE_KEY, '0.90');
    renderHook(() => useZoomKeyboardShortcuts());

    const event = new KeyboardEvent('keydown', {
      key: 'a',
      ctrlKey: true,
      bubbles: true,
    });

    window.dispatchEvent(event);

    const savedZoom = localStorage.getItem(STORAGE_KEY);
    expect(savedZoom).toBe('0.90');
  });

  it('should not zoom without Ctrl/Cmd modifier', () => {
    localStorage.setItem(STORAGE_KEY, '0.90');
    renderHook(() => useZoomKeyboardShortcuts());

    const event = new KeyboardEvent('keydown', {
      key: '+',
      ctrlKey: false,
      metaKey: false,
      bubbles: true,
    });

    window.dispatchEvent(event);

    const savedZoom = localStorage.getItem(STORAGE_KEY);
    expect(savedZoom).toBe('0.90');
  });

  it('should work with Cmd key on Mac', () => {
    localStorage.setItem(STORAGE_KEY, '0.90');
    renderHook(() => useZoomKeyboardShortcuts());

    const event = new KeyboardEvent('keydown', {
      key: '+',
      metaKey: true,
      bubbles: true,
    });

    window.dispatchEvent(event);

    const savedZoom = localStorage.getItem(STORAGE_KEY);
    expect(savedZoom).toBeTruthy();
    const zoom = parseFloat(savedZoom!);
    expect(zoom).toBeGreaterThan(0.90);
  });

  it('should handle equals key as plus', () => {
    localStorage.setItem(STORAGE_KEY, '0.90');
    renderHook(() => useZoomKeyboardShortcuts());

    const event = new KeyboardEvent('keydown', {
      key: '=',
      ctrlKey: true,
      bubbles: true,
    });

    window.dispatchEvent(event);

    const savedZoom = localStorage.getItem(STORAGE_KEY);
    expect(savedZoom).toBeTruthy();
    const zoom = parseFloat(savedZoom!);
    expect(zoom).toBeGreaterThan(0.90);
  });

  it('should prevent default behavior on zoom shortcuts', () => {
    localStorage.setItem(STORAGE_KEY, '0.90');
    renderHook(() => useZoomKeyboardShortcuts());

    const event = new KeyboardEvent('keydown', {
      key: '+',
      ctrlKey: true,
      bubbles: true,
    });

    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
    window.dispatchEvent(event);

    expect(preventDefaultSpy).toHaveBeenCalled();
  });
});
