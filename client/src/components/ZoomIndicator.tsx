import React, { useState, useEffect } from 'react';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

const ZOOM_LEVELS = [
  { value: 0.75, label: '75%' },
  { value: 0.80, label: '80%' },
  { value: 0.85, label: '85%' },
  { value: 0.90, label: '90% (Default)' },
  { value: 0.95, label: '95%' },
  { value: 1.00, label: '100%' },
  { value: 1.10, label: '110%' },
  { value: 1.25, label: '125%' },
  { value: 1.50, label: '150%' },
];

const DEFAULT_ZOOM = 0.90;
const STORAGE_KEY = 'farmkonnect-zoom-level';

export function ZoomIndicator() {
  const [currentZoom, setCurrentZoom] = useState<number>(DEFAULT_ZOOM);
  const [isLoading, setIsLoading] = useState(true);

  // Load zoom level from localStorage on mount
  useEffect(() => {
    const savedZoom = localStorage.getItem(STORAGE_KEY);
    if (savedZoom) {
      const zoom = parseFloat(savedZoom);
      setCurrentZoom(zoom);
    } else {
      setCurrentZoom(DEFAULT_ZOOM);
    }
    setIsLoading(false);
  }, []);

  // Apply zoom to the document
  const applyZoom = (zoomValue: number) => {
    document.documentElement.style.zoom = `${zoomValue * 100}%`;
    document.body.style.zoom = `${zoomValue * 100}%`;
    localStorage.setItem(STORAGE_KEY, zoomValue.toString());
    setCurrentZoom(zoomValue);
  };

  // Handle zoom change
  const handleZoomChange = (zoomValue: number) => {
    applyZoom(zoomValue);
  };

  // Reset to default
  const handleReset = () => {
    applyZoom(DEFAULT_ZOOM);
  };

  // Zoom in
  const handleZoomIn = () => {
    const nextZoom = Math.min(currentZoom + 0.05, 1.50);
    applyZoom(nextZoom);
  };

  // Zoom out
  const handleZoomOut = () => {
    const nextZoom = Math.max(currentZoom - 0.05, 0.75);
    applyZoom(nextZoom);
  };

  if (isLoading) {
    return null;
  }

  const currentZoomPercent = Math.round(currentZoom * 100);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-1 text-xs font-medium"
          title="Click to adjust zoom level"
        >
          <ZoomIn className="w-4 h-4" />
          <span className="hidden sm:inline">{currentZoomPercent}%</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {/* Current Zoom Display */}
        <div className="px-2 py-2 text-xs font-semibold text-muted-foreground">
          Current: {currentZoomPercent}%
        </div>
        <DropdownMenuSeparator />

        {/* Quick Action Buttons */}
        <div className="px-2 py-2 space-y-1">
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomOut}
              className="flex-1 text-xs"
            >
              <ZoomOut className="w-3 h-3 mr-1" />
              Out
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="flex-1 text-xs"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Reset
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomIn}
              className="flex-1 text-xs"
            >
              <ZoomIn className="w-3 h-3 mr-1" />
              In
            </Button>
          </div>
        </div>

        <DropdownMenuSeparator />

        {/* Preset Zoom Levels */}
        {ZOOM_LEVELS.map((zoom) => (
          <DropdownMenuItem
            key={zoom.value}
            onClick={() => handleZoomChange(zoom.value)}
            className={currentZoom === zoom.value ? 'bg-accent' : ''}
          >
            <span className="text-xs">
              {zoom.label}
              {currentZoom === zoom.value && ' ✓'}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
