'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { AlertCircle, Plus, Edit2, Trash2, Eye, TrendingUp, Droplet, Zap, Activity } from 'lucide-react';

interface FieldSegment {
  id: number;
  segmentId: string;
  fieldId: number;
  fieldName: string;
  segmentName: string;
  segmentCode: string;
  areaHectares: number;
  segmentationType: 'geographic' | 'soil_type' | 'irrigation' | 'crop_variety' | 'management_zone';
  soilType: string;
  soilPH: number;
  moistureLevel: number;
  nitrogenLevel: number;
  phosphorusLevel: number;
  potassiumLevel: number;
  segmentStatus: 'active' | 'inactive' | 'treatment' | 'monitoring';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  lastAssessmentDate: string;
  nextAssessmentDate: string;
  gpsLatitude?: number;
  gpsLongitude?: number;
}

interface SegmentationStats {
  totalSegments: number;
  activeSegments: number;
  averageMoisture: number;
  averageNitrogen: number;
  segmentsAtRisk: number;
  segmentsNeedingTreatment: number;
}

export const FieldSegmentation = () => {
  const [segments, setSegments] = useState<FieldSegment[]>([
    {
      id: 1,
      segmentId: 'seg-001',
      fieldId: 1,
      fieldName: 'North Field',
      segmentName: 'North-West Zone',
      segmentCode: 'F1-S1',
      areaHectares: 2.6,
      segmentationType: 'soil_type',
      soilType: 'loam',
      soilPH: 6.8,
      moistureLevel: 65,
      nitrogenLevel: 45,
      phosphorusLevel: 28,
      potassiumLevel: 180,
      segmentStatus: 'active',
      riskLevel: 'low',
      lastAssessmentDate: '2026-02-10',
      nextAssessmentDate: '2026-02-24',
      gpsLatitude: 40.7135,
      gpsLongitude: -74.0065,
    },
    {
      id: 2,
      segmentId: 'seg-002',
      fieldId: 1,
      fieldName: 'North Field',
      segmentName: 'North-East Zone',
      segmentCode: 'F1-S2',
      areaHectares: 2.6,
      segmentationType: 'soil_type',
      soilType: 'loam',
      soilPH: 6.5,
      moistureLevel: 55,
      nitrogenLevel: 38,
      phosphorusLevel: 22,
      potassiumLevel: 165,
      segmentStatus: 'monitoring',
      riskLevel: 'medium',
      lastAssessmentDate: '2026-02-08',
      nextAssessmentDate: '2026-02-22',
      gpsLatitude: 40.7120,
      gpsLongitude: -73.9950,
    },
    {
      id: 3,
      segmentId: 'seg-003',
      fieldId: 2,
      fieldName: 'South Field',
      segmentName: 'South-West Zone',
      segmentCode: 'F2-S1',
      areaHectares: 1.9,
      segmentationType: 'irrigation',
      soilType: 'clay',
      soilPH: 7.2,
      moistureLevel: 72,
      nitrogenLevel: 52,
      phosphorusLevel: 35,
      potassiumLevel: 195,
      segmentStatus: 'treatment',
      riskLevel: 'high',
      lastAssessmentDate: '2026-02-05',
      nextAssessmentDate: '2026-02-19',
      gpsLatitude: 40.7095,
      gpsLongitude: -74.0075,
    },
    {
      id: 4,
      segmentId: 'seg-004',
      fieldId: 2,
      fieldName: 'South Field',
      segmentName: 'South-East Zone',
      segmentCode: 'F2-S2',
      areaHectares: 1.9,
      segmentationType: 'irrigation',
      soilType: 'clay',
      soilPH: 7.3,
      moistureLevel: 68,
      nitrogenLevel: 48,
      phosphorusLevel: 32,
      potassiumLevel: 188,
      segmentStatus: 'active',
      riskLevel: 'medium',
      lastAssessmentDate: '2026-02-07',
      nextAssessmentDate: '2026-02-21',
      gpsLatitude: 40.7085,
      gpsLongitude: -73.9925,
    },
  ]);

  const [selectedSegment, setSelectedSegment] = useState<FieldSegment | null>(null);
  const [showNewSegmentDialog, setShowNewSegmentDialog] = useState(false);
  const [filterField, setFilterField] = useState<string>('all');
  const [filterRisk, setFilterRisk] = useState<string>('all');

  const stats: SegmentationStats = {
    totalSegments: segments.length,
    activeSegments: segments.filter(s => s.segmentStatus === 'active').length,
    averageMoisture: segments.reduce((sum, s) => sum + s.moistureLevel, 0) / segments.length,
    averageNitrogen: segments.reduce((sum, s) => sum + s.nitrogenLevel, 0) / segments.length,
    segmentsAtRisk: segments.filter(s => s.riskLevel === 'high' || s.riskLevel === 'critical').length,
    segmentsNeedingTreatment: segments.filter(s => s.segmentStatus === 'treatment').length,
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'treatment':
        return 'bg-orange-100 text-orange-800';
      case 'monitoring':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getNutrientStatus = (value: number, type: string) => {
    // Simplified nutrient status based on typical ranges
    if (type === 'nitrogen') {
      return value >= 40 && value <= 60 ? 'optimal' : value < 40 ? 'low' : 'high';
    }
    if (type === 'phosphorus') {
      return value >= 20 && value <= 40 ? 'optimal' : value < 20 ? 'low' : 'high';
    }
    if (type === 'potassium') {
      return value >= 150 && value <= 200 ? 'optimal' : value < 150 ? 'low' : 'high';
    }
    return 'unknown';
  };

  const filteredSegments = segments.filter(s => {
    const fieldMatch = filterField === 'all' || s.fieldId.toString() === filterField;
    const riskMatch = filterRisk === 'all' || s.riskLevel === filterRisk;
    return fieldMatch && riskMatch;
  });

  const uniqueFields = [...new Set(segments.map(s => s.fieldId))];

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Field Segmentation</h1>
          <p className="text-gray-600">Monitor and manage field subdivisions with precision</p>
        </div>
        <Dialog open={showNewSegmentDialog} onOpenChange={setShowNewSegmentDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" /> Add Segment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Field Segment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Field</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select field" />
                  </SelectTrigger>
                  <SelectContent>
                    {uniqueFields.map(fieldId => {
                      const field = segments.find(s => s.fieldId === fieldId);
                      return (
                        <SelectItem key={fieldId} value={fieldId.toString()}>
                          {field?.fieldName}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Segment Name</label>
                <Input placeholder="e.g., North-West Zone" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Segment Code</label>
                  <Input placeholder="e.g., F1-S1" />
                </div>
                <div>
                  <label className="text-sm font-medium">Area (hectares)</label>
                  <Input type="number" placeholder="2.6" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Segmentation Type</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="geographic">Geographic</SelectItem>
                    <SelectItem value="soil_type">Soil Type</SelectItem>
                    <SelectItem value="irrigation">Irrigation</SelectItem>
                    <SelectItem value="crop_variety">Crop Variety</SelectItem>
                    <SelectItem value="management_zone">Management Zone</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full">Create Segment</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Segments</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.totalSegments}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{stats.activeSegments}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Avg Moisture</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.averageMoisture.toFixed(0)}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Avg Nitrogen</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.averageNitrogen.toFixed(0)}</p>
            <p className="text-xs text-gray-600">ppm</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">At Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-orange-600">{stats.segmentsAtRisk}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Treatment</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">{stats.segmentsNeedingTreatment}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center flex-wrap">
        <div>
          <label className="text-sm font-medium mr-2">Filter by Field:</label>
          <Select value={filterField} onValueChange={setFilterField}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Fields</SelectItem>
              {uniqueFields.map(fieldId => {
                const field = segments.find(s => s.fieldId === fieldId);
                return (
                  <SelectItem key={fieldId} value={fieldId.toString()}>
                    {field?.fieldName}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mr-2">Filter by Risk:</label>
          <Select value={filterRisk} onValueChange={setFilterRisk}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Risk Levels</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Segments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredSegments.map(segment => (
          <Card key={segment.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{segment.segmentName}</CardTitle>
                  <p className="text-sm text-gray-600">{segment.fieldName} • {segment.segmentCode}</p>
                </div>
                <div className="flex gap-2">
                  <Badge className={getRiskColor(segment.riskLevel)}>
                    {segment.riskLevel}
                  </Badge>
                  <Badge className={getStatusColor(segment.segmentStatus)}>
                    {segment.segmentStatus}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-gray-600">Area</p>
                  <p className="font-semibold">{segment.areaHectares} ha</p>
                </div>
                <div>
                  <p className="text-gray-600">Type</p>
                  <p className="font-semibold capitalize">{segment.segmentationType.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-gray-600">Soil Type</p>
                  <p className="font-semibold">{segment.soilType}</p>
                </div>
                <div>
                  <p className="text-gray-600">Soil pH</p>
                  <p className="font-semibold">{segment.soilPH}</p>
                </div>
              </div>

              {/* Soil Metrics */}
              <div className="space-y-2 border-t pt-3">
                <p className="text-sm font-semibold">Soil Metrics</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Droplet className="w-4 h-4 text-blue-600" />
                    <div>
                      <p className="text-gray-600">Moisture</p>
                      <p className="font-semibold">{segment.moistureLevel}%</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-600" />
                    <div>
                      <p className="text-gray-600">Nitrogen</p>
                      <p className="font-semibold">{segment.nitrogenLevel} ppm</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-gray-600">Phosphorus</p>
                    <p className="font-semibold">{segment.phosphorusLevel} ppm</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Potassium</p>
                    <p className="font-semibold">{segment.potassiumLevel} ppm</p>
                  </div>
                </div>
              </div>

              {/* Assessment Dates */}
              <div className="space-y-2 border-t pt-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Last Assessment</span>
                  <span className="font-semibold">{segment.lastAssessmentDate}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Next Assessment</span>
                  <span className="font-semibold">{segment.nextAssessmentDate}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setSelectedSegment(segment)}
                >
                  <Eye className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" className="flex-1 text-red-600">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Segment Details Modal */}
      {selectedSegment && (
        <Dialog open={!!selectedSegment} onOpenChange={() => setSelectedSegment(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedSegment.segmentName} - Detailed Analysis</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="nutrients">Nutrients</TabsTrigger>
                  <TabsTrigger value="health">Health</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Segment Code</p>
                      <p className="font-semibold">{selectedSegment.segmentCode}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Field</p>
                      <p className="font-semibold">{selectedSegment.fieldName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Area</p>
                      <p className="font-semibold">{selectedSegment.areaHectares} hectares</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Type</p>
                      <p className="font-semibold capitalize">{selectedSegment.segmentationType.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <Badge className={getStatusColor(selectedSegment.segmentStatus)}>
                        {selectedSegment.segmentStatus}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Risk Level</p>
                      <Badge className={getRiskColor(selectedSegment.riskLevel)}>
                        {selectedSegment.riskLevel}
                      </Badge>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="nutrients" className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Nitrogen: {selectedSegment.nitrogenLevel} ppm</span>
                        <span className="text-xs text-gray-600">{getNutrientStatus(selectedSegment.nitrogenLevel, 'nitrogen')}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-yellow-600 h-2 rounded-full"
                          style={{ width: `${Math.min((selectedSegment.nitrogenLevel / 100) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Phosphorus: {selectedSegment.phosphorusLevel} ppm</span>
                        <span className="text-xs text-gray-600">{getNutrientStatus(selectedSegment.phosphorusLevel, 'phosphorus')}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-orange-600 h-2 rounded-full"
                          style={{ width: `${Math.min((selectedSegment.phosphorusLevel / 50) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Potassium: {selectedSegment.potassiumLevel} ppm</span>
                        <span className="text-xs text-gray-600">{getNutrientStatus(selectedSegment.potassiumLevel, 'potassium')}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-red-600 h-2 rounded-full"
                          style={{ width: `${Math.min((selectedSegment.potassiumLevel / 300) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="health" className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium mb-2">Soil Moisture: {selectedSegment.moistureLevel}%</p>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${selectedSegment.moistureLevel}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-2">Soil pH: {selectedSegment.soilPH}</p>
                      <p className="text-xs text-gray-600">Optimal range: 6.0 - 7.5</p>
                    </div>
                    <div className="pt-2 border-t">
                      <p className="text-sm text-gray-600">Last Assessment</p>
                      <p className="font-semibold">{selectedSegment.lastAssessmentDate}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Next Assessment</p>
                      <p className="font-semibold">{selectedSegment.nextAssessmentDate}</p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default FieldSegmentation;
