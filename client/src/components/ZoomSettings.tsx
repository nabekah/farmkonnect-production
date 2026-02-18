import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

export interface ZoomLevel {
  value: number;
  label: string;
}

const ZOOM_LEVELS: ZoomLevel[] = [
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

export function ZoomSettings() {
  const [currentZoom, setCurrentZoom] = useState<number>(DEFAULT_ZOOM);
  const [isLoading, setIsLoading] = useState(true);

  // Load zoom level from localStorage on mount
  useEffect(() => {
    const savedZoom = localStorage.getItem(STORAGE_KEY);
    if (savedZoom) {
      const zoom = parseFloat(savedZoom);
      setCurrentZoom(zoom);
      applyZoom(zoom);
    } else {
      applyZoom(DEFAULT_ZOOM);
    }
    setIsLoading(false);
  }, []);

  // Apply zoom to the document
  const applyZoom = (zoomValue: number) => {
    document.documentElement.style.zoom = `${zoomValue * 100}%`;
    document.body.style.zoom = `${zoomValue * 100}%`;
    localStorage.setItem(STORAGE_KEY, zoomValue.toString());
  };

  // Handle zoom change
  const handleZoomChange = (zoomValue: number) => {
    setCurrentZoom(zoomValue);
    applyZoom(zoomValue);
  };

  // Reset to default
  const handleReset = () => {
    setCurrentZoom(DEFAULT_ZOOM);
    applyZoom(DEFAULT_ZOOM);
  };

  // Zoom in
  const handleZoomIn = () => {
    const nextZoom = Math.min(currentZoom + 0.05, 1.50);
    handleZoomChange(nextZoom);
  };

  // Zoom out
  const handleZoomOut = () => {
    const nextZoom = Math.max(currentZoom - 0.05, 0.75);
    handleZoomChange(nextZoom);
  };

  if (isLoading) {
    return <div>Loading zoom settings...</div>;
  }

  const currentZoomPercent = Math.round(currentZoom * 100);
  const currentLabel = ZOOM_LEVELS.find(z => z.value === currentZoom)?.label || `${currentZoomPercent}%`;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ZoomIn className="w-5 h-5" />
          Display Zoom
        </CardTitle>
        <CardDescription>
          Adjust the application zoom level for comfortable viewing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Zoom Display */}
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <span className="text-sm font-medium">Current Zoom Level:</span>
          <span className="text-lg font-bold text-primary">{currentLabel}</span>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomOut}
            className="flex-1"
          >
            <ZoomOut className="w-4 h-4 mr-2" />
            Zoom Out
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="flex-1"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomIn}
            className="flex-1"
          >
            <ZoomIn className="w-4 h-4 mr-2" />
            Zoom In
          </Button>
        </div>

        {/* Slider Control */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Fine-tune Zoom</label>
          <Slider
            value={[currentZoom]}
            onValueChange={(value) => handleZoomChange(value[0])}
            min={0.75}
            max={1.50}
            step={0.01}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>75%</span>
            <span>100%</span>
            <span>150%</span>
          </div>
        </div>

        {/* Preset Zoom Levels */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Preset Zoom Levels</label>
          <div className="grid grid-cols-3 gap-2">
            {ZOOM_LEVELS.map((zoom) => (
              <Button
                key={zoom.value}
                variant={currentZoom === zoom.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleZoomChange(zoom.value)}
                className="text-xs"
              >
                {zoom.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Info Message */}
        <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-xs text-blue-900 dark:text-blue-100">
            💡 <strong>Tip:</strong> Your zoom preference is saved automatically and will persist across sessions.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
