'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { MapPin, Plus, Edit2, Trash2, Eye, AlertCircle, CheckCircle, Leaf, Droplets } from 'lucide-react';

interface Field {
  id: number;
  fieldId: string;
  fieldName: string;
  fieldCode: string;
  areaHectares: number;
  soilType: string;
  soilPH: number;
  fieldStatus: 'active' | 'fallow' | 'preparation' | 'harvested' | 'archived';
  cropId?: number;
  cropName?: string;
  lastHarvestDate?: string;
  nextPlantingDate?: string;
  gpsLatitude?: number;
  gpsLongitude?: number;
  photoUrl?: string;
}

interface FieldStats {
  totalFields: number;
  activeFields: number;
  totalArea: number;
  averageSoilPH: number;
  fieldsNeedingAttention: number;
}

export const FieldManagement = () => {
  const [fields, setFields] = useState<Field[]>([
    {
      id: 1,
      fieldId: 'f-001',
      fieldName: 'North Field',
      fieldCode: 'F1',
      areaHectares: 5.2,
      soilType: 'loam',
      soilPH: 6.8,
      fieldStatus: 'active',
      cropName: 'Wheat',
      lastHarvestDate: '2025-08-15',
      nextPlantingDate: '2026-03-01',
      gpsLatitude: 40.7128,
      gpsLongitude: -74.006,
    },
    {
      id: 2,
      fieldId: 'f-002',
      fieldName: 'South Field',
      fieldCode: 'F2',
      areaHectares: 3.8,
      soilType: 'clay',
      soilPH: 7.2,
      fieldStatus: 'active',
      cropName: 'Corn',
      lastHarvestDate: '2025-09-20',
      nextPlantingDate: '2026-04-15',
      gpsLatitude: 40.7100,
      gpsLongitude: -74.0050,
    },
    {
      id: 3,
      fieldId: 'f-003',
      fieldName: 'East Field',
      fieldCode: 'F3',
      areaHectares: 4.5,
      soilType: 'sandy',
      soilPH: 6.5,
      fieldStatus: 'fallow',
      lastHarvestDate: '2025-07-10',
      nextPlantingDate: '2026-05-01',
      gpsLatitude: 40.7150,
      gpsLongitude: -73.9950,
    },
  ]);

  const [selectedField, setSelectedField] = useState<Field | null>(null);
  const [showNewFieldDialog, setShowNewFieldDialog] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const stats: FieldStats = {
    totalFields: fields.length,
    activeFields: fields.filter(f => f.fieldStatus === 'active').length,
    totalArea: fields.reduce((sum, f) => sum + f.areaHectares, 0),
    averageSoilPH: fields.reduce((sum, f) => sum + f.soilPH, 0) / fields.length,
    fieldsNeedingAttention: fields.filter(f => f.fieldStatus === 'active' && f.soilPH < 6.0 || f.soilPH > 7.5).length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'fallow':
        return 'bg-yellow-100 text-yellow-800';
      case 'preparation':
        return 'bg-blue-100 text-blue-800';
      case 'harvested':
        return 'bg-orange-100 text-orange-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSoilHealthIcon = (pH: number) => {
    if (pH >= 6.0 && pH <= 7.5) {
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    }
    return <AlertCircle className="w-4 h-4 text-orange-600" />;
  };

  const filteredFields = filterStatus === 'all' 
    ? fields 
    : fields.filter(f => f.fieldStatus === filterStatus);

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Field Management</h1>
          <p className="text-gray-600">Manage farm fields and monitor soil health</p>
        </div>
        <Dialog open={showNewFieldDialog} onOpenChange={setShowNewFieldDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" /> Add Field
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Field</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Field Name</label>
                <Input placeholder="e.g., North Field" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Field Code</label>
                  <Input placeholder="e.g., F1" />
                </div>
                <div>
                  <label className="text-sm font-medium">Area (hectares)</label>
                  <Input type="number" placeholder="5.2" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Soil Type</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select soil type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="loam">Loam</SelectItem>
                      <SelectItem value="clay">Clay</SelectItem>
                      <SelectItem value="sandy">Sandy</SelectItem>
                      <SelectItem value="silt">Silt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Soil pH</label>
                  <Input type="number" placeholder="6.8" step="0.1" />
                </div>
              </div>
              <Button className="w-full">Create Field</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Fields</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.totalFields}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Fields</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{stats.activeFields}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Area</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.totalArea.toFixed(1)}</p>
            <p className="text-xs text-gray-600">hectares</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Avg Soil pH</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.averageSoilPH.toFixed(1)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Needs Attention</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-orange-600">{stats.fieldsNeedingAttention}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2 items-center">
        <span className="text-sm font-medium">Filter by Status:</span>
        <div className="flex gap-2">
          {['all', 'active', 'fallow', 'preparation', 'harvested', 'archived'].map(status => (
            <Button
              key={status}
              variant={filterStatus === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus(status)}
              className="capitalize"
            >
              {status}
            </Button>
          ))}
        </div>
      </div>

      {/* Fields Grid/List */}
      <div className="space-y-4">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFields.map(field => (
              <Card key={field.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{field.fieldName}</CardTitle>
                      <p className="text-sm text-gray-600">Code: {field.fieldCode}</p>
                    </div>
                    <Badge className={getStatusColor(field.fieldStatus)}>
                      {field.fieldStatus}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Leaf className="w-4 h-4 text-green-600" />
                    <span>{field.areaHectares} hectares</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Droplets className="w-4 h-4 text-blue-600" />
                    <span>Soil: {field.soilType} (pH {field.soilPH})</span>
                    {getSoilHealthIcon(field.soilPH)}
                  </div>
                  {field.cropName && (
                    <div className="text-sm">
                      <span className="font-medium">Current Crop:</span> {field.cropName}
                    </div>
                  )}
                  {field.gpsLatitude && field.gpsLongitude && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>{field.gpsLatitude.toFixed(4)}, {field.gpsLongitude.toFixed(4)}</span>
                    </div>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setSelectedField(field)}
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
        ) : (
          <div className="space-y-2">
            {filteredFields.map(field => (
              <Card key={field.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold">{field.fieldName}</h4>
                      <div className="grid grid-cols-4 gap-4 mt-2 text-sm text-gray-600">
                        <div>Code: {field.fieldCode}</div>
                        <div>Area: {field.areaHectares} ha</div>
                        <div>Soil: {field.soilType} (pH {field.soilPH})</div>
                        <div>Crop: {field.cropName || 'N/A'}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(field.fieldStatus)}>
                        {field.fieldStatus}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Field Details Modal */}
      {selectedField && (
        <Dialog open={!!selectedField} onOpenChange={() => setSelectedField(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedField.fieldName} - Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Field Code</p>
                  <p className="font-semibold">{selectedField.fieldCode}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <Badge className={getStatusColor(selectedField.fieldStatus)}>
                    {selectedField.fieldStatus}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Area</p>
                  <p className="font-semibold">{selectedField.areaHectares} hectares</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Soil Type</p>
                  <p className="font-semibold">{selectedField.soilType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Soil pH</p>
                  <p className="font-semibold">{selectedField.soilPH}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Current Crop</p>
                  <p className="font-semibold">{selectedField.cropName || 'None'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Last Harvest</p>
                  <p className="font-semibold">{selectedField.lastHarvestDate || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Next Planting</p>
                  <p className="font-semibold">{selectedField.nextPlantingDate || 'N/A'}</p>
                </div>
              </div>
              {selectedField.gpsLatitude && selectedField.gpsLongitude && (
                <div>
                  <p className="text-sm text-gray-600">GPS Coordinates</p>
                  <p className="font-semibold">
                    {selectedField.gpsLatitude.toFixed(6)}, {selectedField.gpsLongitude.toFixed(6)}
                  </p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default FieldManagement;
