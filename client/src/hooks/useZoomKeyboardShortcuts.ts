import { useEffect } from 'react';

const STORAGE_KEY = 'farmkonnect-zoom-level';
const MIN_ZOOM = 0.75;
const MAX_ZOOM = 1.50;
const ZOOM_STEP = 0.05;
const DEFAULT_ZOOM = 0.90;

export function useZoomKeyboardShortcuts() {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if Ctrl/Cmd is pressed
      const isCtrlOrCmd = event.ctrlKey || event.metaKey;

      if (!isCtrlOrCmd) return;

      let zoomChange = 0;

      // Ctrl/Cmd + Plus/Equals: Zoom in
      if (event.key === '+' || event.key === '=') {
        event.preventDefault();
        zoomChange = ZOOM_STEP;
      }
      // Ctrl/Cmd + Minus: Zoom out
      else if (event.key === '-' || event.key === '_') {
        event.preventDefault();
        zoomChange = -ZOOM_STEP;
      }
      // Ctrl/Cmd + 0: Reset to default
      else if (event.key === '0') {
        event.preventDefault();
        zoomChange = DEFAULT_ZOOM - getCurrentZoom();
      }

      if (zoomChange !== 0) {
        const currentZoom = getCurrentZoom();
        const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, currentZoom + zoomChange));
        applyZoom(newZoom);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}

function getCurrentZoom(): number {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? parseFloat(saved) : DEFAULT_ZOOM;
}

function applyZoom(zoomValue: number) {
  document.documentElement.style.zoom = `${zoomValue * 100}%`;
  document.body.style.zoom = `${zoomValue * 100}%`;
  localStorage.setItem(STORAGE_KEY, zoomValue.toString());

  // Dispatch custom event for other components to listen to
  window.dispatchEvent(
    new CustomEvent('zoomchange', { detail: { zoom: zoomValue } })
  );
}
