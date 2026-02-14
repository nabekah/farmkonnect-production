'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Maximize2, ZoomIn, ZoomOut, Download, Share2, Edit2, AlertCircle, CheckCircle } from 'lucide-react';

interface FieldLocation {
  id: number;
  fieldName: string;
  fieldCode: string;
  latitude: number;
  longitude: number;
  areaHectares: number;
  status: 'active' | 'fallow' | 'preparation' | 'harvested' | 'archived';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  color: string;
}

interface SegmentLocation {
  id: number;
  segmentName: string;
  segmentCode: string;
  fieldId: number;
  latitude: number;
  longitude: number;
  areaHectares: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  moistureLevel: number;
  nitrogenLevel: number;
  color: string;
}

interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export const FieldMapIntegration = () => {
  const [fields, setFields] = useState<FieldLocation[]>([
    {
      id: 1,
      fieldName: 'North Field',
      fieldCode: 'F1',
      latitude: 40.7128,
      longitude: -74.006,
      areaHectares: 5.2,
      status: 'active',
      riskLevel: 'low',
      color: '#10b981',
    },
    {
      id: 2,
      fieldName: 'South Field',
      fieldCode: 'F2',
      latitude: 40.7100,
      longitude: -74.0050,
      areaHectares: 3.8,
      status: 'active',
      riskLevel: 'medium',
      color: '#f59e0b',
    },
    {
      id: 3,
      fieldName: 'East Field',
      fieldCode: 'F3',
      latitude: 40.7150,
      longitude: -73.9950,
      areaHectares: 4.5,
      status: 'fallow',
      riskLevel: 'low',
      color: '#6b7280',
    },
  ]);

  const [segments, setSegments] = useState<SegmentLocation[]>([
    {
      id: 1,
      segmentName: 'F1-S1 (NW Zone)',
      segmentCode: 'F1-S1',
      fieldId: 1,
      latitude: 40.7135,
      longitude: -74.0065,
      areaHectares: 2.6,
      riskLevel: 'low',
      moistureLevel: 65,
      nitrogenLevel: 45,
      color: '#10b981',
    },
    {
      id: 2,
      segmentName: 'F1-S2 (NE Zone)',
      segmentCode: 'F1-S2',
      fieldId: 1,
      latitude: 40.7120,
      longitude: -73.9950,
      areaHectares: 2.6,
      riskLevel: 'medium',
      moistureLevel: 55,
      nitrogenLevel: 38,
      color: '#f59e0b',
    },
    {
      id: 3,
      segmentName: 'F2-S1 (SW Zone)',
      segmentCode: 'F2-S1',
      fieldId: 2,
      latitude: 40.7095,
      longitude: -74.0075,
      areaHectares: 1.9,
      riskLevel: 'high',
      moistureLevel: 72,
      nitrogenLevel: 52,
      color: '#ef4444',
    },
  ]);

  const [selectedField, setSelectedField] = useState<FieldLocation | null>(null);
  const [selectedSegment, setSelectedSegment] = useState<SegmentLocation | null>(null);
  const [mapView, setMapView] = useState<'fields' | 'segments'>('fields');
  const [zoom, setZoom] = useState(12);
  const [showDrawing, setShowDrawing] = useState(false);
  const [showMeasurement, setShowMeasurement] = useState(false);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return '#10b981';
      case 'medium':
        return '#f59e0b';
      case 'high':
        return '#ef4444';
      case 'critical':
        return '#991b1b';
      default:
        return '#6b7280';
    }
  };

  const calculateMapBounds = (): MapBounds => {
    const locations = mapView === 'fields' ? fields : segments;
    if (locations.length === 0) {
      return { north: 40.7128, south: 40.7100, east: -73.9950, west: -74.006 };
    }

    const lats = locations.map(l => l.latitude);
    const lons = locations.map(l => l.longitude);

    return {
      north: Math.max(...lats) + 0.01,
      south: Math.min(...lats) - 0.01,
      east: Math.max(...lons) + 0.01,
      west: Math.min(...lons) - 0.01,
    };
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const bounds = calculateMapBounds();
  const centerLat = (bounds.north + bounds.south) / 2;
  const centerLon = (bounds.east + bounds.west) / 2;

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Field Map Integration</h1>
          <p className="text-gray-600">Interactive map visualization and field boundary management</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" /> Export Map
          </Button>
          <Button variant="outline" className="gap-2">
            <Share2 className="w-4 h-4" /> Share
          </Button>
        </div>
      </div>

      {/* Map Controls */}
      <div className="flex gap-2 items-center flex-wrap">
        <div className="flex gap-2">
          <Button
            variant={mapView === 'fields' ? 'default' : 'outline'}
            onClick={() => setMapView('fields')}
            size="sm"
          >
            Fields View
          </Button>
          <Button
            variant={mapView === 'segments' ? 'default' : 'outline'}
            onClick={() => setMapView('segments')}
            size="sm"
          >
            Segments View
          </Button>
        </div>

        <div className="flex gap-2 ml-auto">
          <Button variant="outline" size="sm" onClick={() => setZoom(Math.min(zoom + 1, 18))}>
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setZoom(Math.max(zoom - 1, 8))}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setZoom(12)}>
            <Maximize2 className="w-4 h-4" />
          </Button>
        </div>

        <Dialog open={showDrawing} onOpenChange={setShowDrawing}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Edit2 className="w-4 h-4" /> Draw Field
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Draw Field Boundary</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Click on the map to create field boundaries. Click the first point again to complete the polygon.
              </p>
              <div className="bg-gray-100 h-64 rounded-lg flex items-center justify-center">
                <p className="text-gray-600">Map Drawing Interface</p>
              </div>
              <Button className="w-full">Save Field Boundary</Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showMeasurement} onOpenChange={setShowMeasurement}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <MapPin className="w-4 h-4" /> Measure
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Measure Distance</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Click on two points on the map to measure the distance between them.
              </p>
              <div className="bg-gray-100 h-64 rounded-lg flex items-center justify-center">
                <p className="text-gray-600">Map Measurement Interface</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium">Distance: 1.23 km</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Main Map View */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="relative bg-gradient-to-br from-blue-50 to-green-50 h-96 rounded-lg overflow-hidden">
            {/* Map Background */}
            <svg className="w-full h-full" viewBox={`${bounds.west} ${bounds.south} ${bounds.east - bounds.west} ${bounds.north - bounds.south}`}>
              {/* Grid */}
              <defs>
                <pattern id="grid" width="0.01" height="0.01" patternUnits="userSpaceOnUse">
                  <path d="M 0.01 0 L 0 0 0 0.01" fill="none" stroke="#e5e7eb" strokeWidth="0.0005" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />

              {/* Fields */}
              {mapView === 'fields' &&
                fields.map(field => (
                  <g key={field.id} onClick={() => setSelectedField(field)} className="cursor-pointer">
                    <circle
                      cx={field.longitude}
                      cy={field.latitude}
                      r="0.005"
                      fill={field.color}
                      opacity="0.7"
                      stroke={field.color}
                      strokeWidth="0.001"
                    />
                    <text
                      x={field.longitude}
                      y={field.latitude - 0.008}
                      fontSize="0.003"
                      textAnchor="middle"
                      fill="#000"
                      fontWeight="bold"
                    >
                      {field.fieldCode}
                    </text>
                  </g>
                ))}

              {/* Segments */}
              {mapView === 'segments' &&
                segments.map(segment => (
                  <g key={segment.id} onClick={() => setSelectedSegment(segment)} className="cursor-pointer">
                    <circle
                      cx={segment.longitude}
                      cy={segment.latitude}
                      r="0.004"
                      fill={segment.color}
                      opacity="0.6"
                      stroke={segment.color}
                      strokeWidth="0.001"
                    />
                    <text
                      x={segment.longitude}
                      y={segment.latitude - 0.006}
                      fontSize="0.0025"
                      textAnchor="middle"
                      fill="#000"
                      fontWeight="bold"
                    >
                      {segment.segmentCode}
                    </text>
                  </g>
                ))}

              {/* Center marker */}
              <circle cx={centerLon} cy={centerLat} r="0.003" fill="none" stroke="#3b82f6" strokeWidth="0.0005" strokeDasharray="0.002" />
            </svg>

            {/* Map Legend */}
            <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 text-sm">
              <p className="font-semibold mb-2">Risk Levels</p>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-600"></div>
                  <span>Low</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span>Medium</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-600"></div>
                  <span>High</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-900"></div>
                  <span>Critical</span>
                </div>
              </div>
            </div>

            {/* Zoom Level */}
            <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-2 text-xs text-gray-600">
              Zoom: {zoom}x | Center: ({centerLat.toFixed(4)}, {centerLon.toFixed(4)})
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Locations List */}
      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list">Locations List</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mapView === 'fields' ? (
              fields.map(field => (
                <Card
                  key={field.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setSelectedField(field)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold">{field.fieldName}</h4>
                        <p className="text-sm text-gray-600">{field.fieldCode}</p>
                      </div>
                      <Badge style={{ backgroundColor: field.color }} className="text-white">
                        {field.riskLevel}
                      </Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Area:</span>
                        <span className="font-medium">{field.areaHectares} ha</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className="font-medium capitalize">{field.status}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Coordinates:</span>
                        <span className="font-medium text-xs">
                          {field.latitude.toFixed(4)}, {field.longitude.toFixed(4)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              segments.map(segment => (
                <Card
                  key={segment.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setSelectedSegment(segment)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold">{segment.segmentName}</h4>
                        <p className="text-sm text-gray-600">{segment.segmentCode}</p>
                      </div>
                      <Badge style={{ backgroundColor: segment.color }} className="text-white">
                        {segment.riskLevel}
                      </Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Area:</span>
                        <span className="font-medium">{segment.areaHectares} ha</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Moisture:</span>
                        <span className="font-medium">{segment.moistureLevel}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Nitrogen:</span>
                        <span className="font-medium">{segment.nitrogenLevel} ppm</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          {selectedField && mapView === 'fields' ? (
            <Card>
              <CardHeader>
                <CardTitle>{selectedField.fieldName}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Field Code</p>
                    <p className="font-semibold">{selectedField.fieldCode}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Area</p>
                    <p className="font-semibold">{selectedField.areaHectares} hectares</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <Badge>{selectedField.status}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Risk Level</p>
                    <Badge style={{ backgroundColor: selectedField.color }} className="text-white">
                      {selectedField.riskLevel}
                    </Badge>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">GPS Coordinates</p>
                    <p className="font-semibold">
                      {selectedField.latitude.toFixed(6)}, {selectedField.longitude.toFixed(6)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : selectedSegment && mapView === 'segments' ? (
            <Card>
              <CardHeader>
                <CardTitle>{selectedSegment.segmentName}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Segment Code</p>
                    <p className="font-semibold">{selectedSegment.segmentCode}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Area</p>
                    <p className="font-semibold">{selectedSegment.areaHectares} ha</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Moisture Level</p>
                    <p className="font-semibold">{selectedSegment.moistureLevel}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Nitrogen Level</p>
                    <p className="font-semibold">{selectedSegment.nitrogenLevel} ppm</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Risk Level</p>
                    <Badge style={{ backgroundColor: selectedSegment.color }} className="text-white">
                      {selectedSegment.riskLevel}
                    </Badge>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">GPS Coordinates</p>
                    <p className="font-semibold">
                      {selectedSegment.latitude.toFixed(6)}, {selectedSegment.longitude.toFixed(6)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-gray-600 text-center">Select a field or segment to view details</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FieldMapIntegration;
