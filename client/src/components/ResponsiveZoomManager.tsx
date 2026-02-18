import React, { useEffect, useState } from 'react';

interface ZoomBreakpoint {
  zoomLevel: number;
  sidebarWidth: number;
  mainPadding: number;
  fontSize: string;
  spacing: string;
}

const ZOOM_BREAKPOINTS: Record<string, ZoomBreakpoint> = {
  '75': {
    zoomLevel: 0.75,
    sidebarWidth: 240,
    mainPadding: 16,
    fontSize: '0.875rem',
    spacing: '0.5rem',
  },
  '80': {
    zoomLevel: 0.80,
    sidebarWidth: 240,
    mainPadding: 16,
    fontSize: '0.875rem',
    spacing: '0.5rem',
  },
  '85': {
    zoomLevel: 0.85,
    sidebarWidth: 240,
    mainPadding: 16,
    fontSize: '0.875rem',
    spacing: '0.5rem',
  },
  '90': {
    zoomLevel: 0.90,
    sidebarWidth: 256,
    mainPadding: 16,
    fontSize: '1rem',
    spacing: '1rem',
  },
  '95': {
    zoomLevel: 0.95,
    sidebarWidth: 256,
    mainPadding: 16,
    fontSize: '1rem',
    spacing: '1rem',
  },
  '100': {
    zoomLevel: 1.00,
    sidebarWidth: 256,
    mainPadding: 16,
    fontSize: '1rem',
    spacing: '1rem',
  },
  '110': {
    zoomLevel: 1.10,
    sidebarWidth: 224,
    mainPadding: 12,
    fontSize: '1rem',
    spacing: '0.75rem',
  },
  '125': {
    zoomLevel: 1.25,
    sidebarWidth: 200,
    mainPadding: 12,
    fontSize: '0.875rem',
    spacing: '0.5rem',
  },
  '150': {
    zoomLevel: 1.50,
    sidebarWidth: 180,
    mainPadding: 8,
    fontSize: '0.75rem',
    spacing: '0.25rem',
  },
};

const STORAGE_KEY = 'farmkonnect-zoom-level';

export function ResponsiveZoomManager() {
  const [currentZoom, setCurrentZoom] = useState<number>(0.90);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Load zoom level from localStorage
    const savedZoom = localStorage.getItem(STORAGE_KEY);
    const zoom = savedZoom ? parseFloat(savedZoom) : 0.90;
    setCurrentZoom(zoom);
    applyResponsiveStyles(zoom);
    setIsInitialized(true);

    // Listen for storage changes (zoom changed in another tab/window)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        const newZoom = parseFloat(e.newValue);
        setCurrentZoom(newZoom);
        applyResponsiveStyles(newZoom);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Listen for zoom changes from ZoomIndicator
  useEffect(() => {
    if (!isInitialized) return;

    const handleZoomChange = () => {
      const savedZoom = localStorage.getItem(STORAGE_KEY);
      if (savedZoom) {
        const zoom = parseFloat(savedZoom);
        if (zoom !== currentZoom) {
          setCurrentZoom(zoom);
          applyResponsiveStyles(zoom);
        }
      }
    };

    // Check for zoom changes every 100ms
    const interval = setInterval(handleZoomChange, 100);
    return () => clearInterval(interval);
  }, [currentZoom, isInitialized]);

  return null;
}

function applyResponsiveStyles(zoomLevel: number) {
  // Find the closest breakpoint
  const zoomPercent = Math.round(zoomLevel * 100);
  const breakpointKey = Object.keys(ZOOM_BREAKPOINTS).reduce((closest, key) => {
    const closestDiff = Math.abs(parseInt(closest) - zoomPercent);
    const keyDiff = Math.abs(parseInt(key) - zoomPercent);
    return keyDiff < closestDiff ? key : closest;
  });

  const breakpoint = ZOOM_BREAKPOINTS[breakpointKey];

  // Create or update style element
  let styleElement = document.getElementById('responsive-zoom-styles');
  if (!styleElement) {
    styleElement = document.createElement('style');
    styleElement.id = 'responsive-zoom-styles';
    document.head.appendChild(styleElement);
  }

  // Apply responsive CSS
  styleElement.textContent = `
    /* Responsive Zoom Styles */
    :root {
      --sidebar-width: ${breakpoint.sidebarWidth}px;
      --main-padding: ${breakpoint.mainPadding}px;
      --base-font-size: ${breakpoint.fontSize};
      --spacing-unit: ${breakpoint.spacing};
    }

    /* Sidebar adjustments */
    [data-state="expanded"] {
      width: var(--sidebar-width);
    }

    /* Main content adjustments */
    main {
      padding: var(--main-padding);
    }

    /* Text scaling */
    body {
      font-size: var(--base-font-size);
    }

    /* Spacing adjustments */
    .space-y-1 {
      row-gap: var(--spacing-unit);
    }

    .space-y-2 {
      row-gap: calc(var(--spacing-unit) * 2);
    }

    .gap-1 {
      gap: var(--spacing-unit);
    }

    .gap-2 {
      gap: calc(var(--spacing-unit) * 2);
    }

    .gap-3 {
      gap: calc(var(--spacing-unit) * 3);
    }

    /* Button sizing */
    button {
      transition: all 0.2s ease;
    }

    /* Table adjustments for high zoom */
    ${zoomLevel > 1.25 ? `
      table {
        font-size: 0.875rem;
      }

      th, td {
        padding: 0.5rem;
      }
    ` : ''}

    /* Card adjustments for high zoom */
    ${zoomLevel > 1.25 ? `
      .rounded-lg {
        border-radius: 0.375rem;
      }
    ` : ''}

    /* Prevent horizontal scrolling at extreme zoom levels */
    ${zoomLevel > 1.25 ? `
      body {
        overflow-x: hidden;
      }

      main {
        overflow-x: auto;
      }
    ` : ''}

    /* Mobile-friendly at low zoom */
    ${zoomLevel < 0.85 ? `
      .hidden.sm\\:inline {
        display: inline;
      }
    ` : ''}
  `;
}
