import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Copy } from 'lucide-react';

interface PhotoData {
  id: string;
  url: string;
  name: string;
  date: string;
  metadata?: {
    camera?: string;
    iso?: number;
    aperture?: string;
    location?: string;
  };
}

interface PhotoComparisonProps {
  beforePhoto: PhotoData;
  afterPhoto: PhotoData;
  isOpen: boolean;
  onClose: () => void;
}

export function PhotoComparison({
  beforePhoto,
  afterPhoto,
  isOpen,
  onClose,
}: PhotoComparisonProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [comparisonMode, setComparisonMode] = useState<'slider' | 'side-by-side' | 'overlay'>('slider');
  const [overlayOpacity, setOverlayOpacity] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (comparisonMode !== 'slider' || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, percentage)));
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (comparisonMode !== 'slider' || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, percentage)));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Photo Comparison - Before & After</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Mode Selection */}
          <div className="flex gap-2">
            <Button
              variant={comparisonMode === 'slider' ? 'default' : 'outline'}
              onClick={() => setComparisonMode('slider')}
              size="sm"
            >
              Slider
            </Button>
            <Button
              variant={comparisonMode === 'side-by-side' ? 'default' : 'outline'}
              onClick={() => setComparisonMode('side-by-side')}
              size="sm"
            >
              Side by Side
            </Button>
            <Button
              variant={comparisonMode === 'overlay' ? 'default' : 'outline'}
              onClick={() => setComparisonMode('overlay')}
              size="sm"
            >
              Overlay
            </Button>
          </div>

          {/* Comparison View */}
          {comparisonMode === 'slider' && (
            <div
              ref={containerRef}
              className="relative w-full bg-gray-100 rounded-lg overflow-hidden cursor-col-resize"
              onMouseMove={handleMouseMove}
              onTouchMove={handleTouchMove}
              style={{ aspectRatio: '16/9' }}
            >
              {/* Before Image */}
              <img
                src={beforePhoto.url}
                alt="Before"
                className="absolute inset-0 w-full h-full object-cover"
              />

              {/* After Image (clipped) */}
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${sliderPosition}%` }}
              >
                <img
                  src={afterPhoto.url}
                  alt="After"
                  className="w-full h-full object-cover"
                  style={{ width: `${(100 / sliderPosition) * 100}%` }}
                />
              </div>

              {/* Slider Handle */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-white cursor-col-resize"
                style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
              >
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow-lg">
                  <ChevronLeft className="w-4 h-4 text-gray-800" />
                  <ChevronRight className="w-4 h-4 text-gray-800" />
                </div>
              </div>

              {/* Labels */}
              <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded text-sm">
                Before
              </div>
              <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded text-sm">
                After
              </div>
            </div>
          )}

          {comparisonMode === 'side-by-side' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Before</h3>
                <img
                  src={beforePhoto.url}
                  alt="Before"
                  className="w-full rounded-lg object-cover"
                  style={{ aspectRatio: '16/9' }}
                />
                <p className="text-xs text-muted-foreground">{beforePhoto.date}</p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">After</h3>
                <img
                  src={afterPhoto.url}
                  alt="After"
                  className="w-full rounded-lg object-cover"
                  style={{ aspectRatio: '16/9' }}
                />
                <p className="text-xs text-muted-foreground">{afterPhoto.date}</p>
              </div>
            </div>
          )}

          {comparisonMode === 'overlay' && (
            <div className="relative w-full bg-gray-100 rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
              <img
                src={beforePhoto.url}
                alt="Before"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <img
                src={afterPhoto.url}
                alt="After"
                className="absolute inset-0 w-full h-full object-cover"
                style={{ opacity: overlayOpacity / 100 }}
              />
              <div className="absolute bottom-4 left-4 right-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white bg-black/50 px-2 py-1 rounded">
                    After Opacity: {overlayOpacity}%
                  </span>
                </div>
                <Slider
                  value={[overlayOpacity]}
                  onValueChange={(value) => setOverlayOpacity(value[0])}
                  min={0}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>
          )}

          {/* Photo Details */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Before Photo</h4>
              <div className="space-y-1 text-sm">
                <p className="text-muted-foreground">{beforePhoto.name}</p>
                <p className="text-xs text-muted-foreground">{beforePhoto.date}</p>
                {beforePhoto.metadata && (
                  <div className="flex flex-wrap gap-1 pt-2">
                    {beforePhoto.metadata.camera && (
                      <Badge variant="outline" className="text-xs">
                        {beforePhoto.metadata.camera}
                      </Badge>
                    )}
                    {beforePhoto.metadata.iso && (
                      <Badge variant="outline" className="text-xs">
                        ISO {beforePhoto.metadata.iso}
                      </Badge>
                    )}
                    {beforePhoto.metadata.location && (
                      <Badge variant="outline" className="text-xs">
                        {beforePhoto.metadata.location}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-sm">After Photo</h4>
              <div className="space-y-1 text-sm">
                <p className="text-muted-foreground">{afterPhoto.name}</p>
                <p className="text-xs text-muted-foreground">{afterPhoto.date}</p>
                {afterPhoto.metadata && (
                  <div className="flex flex-wrap gap-1 pt-2">
                    {afterPhoto.metadata.camera && (
                      <Badge variant="outline" className="text-xs">
                        {afterPhoto.metadata.camera}
                      </Badge>
                    )}
                    {afterPhoto.metadata.iso && (
                      <Badge variant="outline" className="text-xs">
                        ISO {afterPhoto.metadata.iso}
                      </Badge>
                    )}
                    {afterPhoto.metadata.location && (
                      <Badge variant="outline" className="text-xs">
                        {afterPhoto.metadata.location}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button variant="outline" size="sm">
              <Copy className="w-4 h-4 mr-2" />
              Export Comparison
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
