'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Calendar, Leaf, Droplet, Zap, AlertCircle } from 'lucide-react';

interface HistoricalRecord {
  year: number;
  cropName: string;
  plantingDate: string;
  harvestDate: string;
  quantityHarvested: number;
  unit: string;
  yieldPerHectare: number;
  quality: 'premium' | 'grade_a' | 'grade_b' | 'grade_c' | 'rejected';
  soilPH: number;
  moisture: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  temperature: number;
  rainfall: number;
  diseasePresence: string[];
  pestPresence: string[];
  fertilizationApplied: string;
  irrigationEvents: number;
  notes: string;
}

interface FieldHistory {
  fieldId: number;
  fieldName: string;
  yearsOfData: number;
  records: HistoricalRecord[];
}

export const HistoricalFieldData = () => {
  const [selectedField, setSelectedField] = useState<FieldHistory>({
    fieldId: 1,
    fieldName: 'North Field',
    yearsOfData: 5,
    records: [
      {
        year: 2020,
        cropName: 'Wheat',
        plantingDate: '2020-10-15',
        harvestDate: '2021-06-10',
        quantityHarvested: 11000,
        unit: 'kg',
        yieldPerHectare: 4200,
        quality: 'grade_a',
        soilPH: 6.8,
        moisture: 62,
        nitrogen: 42,
        phosphorus: 26,
        potassium: 175,
        temperature: 18,
        rainfall: 450,
        diseasePresence: [],
        pestPresence: ['armyworm'],
        fertilizationApplied: 'NPK 15-15-15',
        irrigationEvents: 3,
        notes: 'Good yield despite pest pressure. Irrigation helped recovery.',
      },
      {
        year: 2021,
        cropName: 'Corn',
        plantingDate: '2021-04-20',
        harvestDate: '2021-09-15',
        quantityHarvested: 12500,
        unit: 'kg',
        yieldPerHectare: 4800,
        quality: 'grade_a',
        soilPH: 6.9,
        moisture: 65,
        nitrogen: 45,
        phosphorus: 28,
        potassium: 180,
        temperature: 22,
        rainfall: 520,
        diseasePresence: [],
        pestPresence: [],
        fertilizationApplied: 'NPK 20-10-10',
        irrigationEvents: 4,
        notes: 'Excellent year. Optimal weather and soil conditions.',
      },
      {
        year: 2022,
        cropName: 'Soybean',
        plantingDate: '2022-05-10',
        harvestDate: '2022-10-20',
        quantityHarvested: 8800,
        unit: 'kg',
        yieldPerHectare: 3380,
        quality: 'grade_b',
        soilPH: 6.7,
        moisture: 58,
        nitrogen: 38,
        phosphorus: 24,
        potassium: 168,
        temperature: 20,
        rainfall: 380,
        diseasePresence: ['rust'],
        pestPresence: ['spider_mite'],
        fertilizationApplied: 'NPK 10-15-15',
        irrigationEvents: 2,
        notes: 'Drought year affected yield. Disease management was challenging.',
      },
      {
        year: 2023,
        cropName: 'Barley',
        plantingDate: '2023-10-01',
        harvestDate: '2024-06-05',
        quantityHarvested: 9500,
        unit: 'kg',
        yieldPerHectare: 3650,
        quality: 'grade_a',
        soilPH: 6.8,
        moisture: 64,
        nitrogen: 44,
        phosphorus: 27,
        potassium: 178,
        temperature: 19,
        rainfall: 480,
        diseasePresence: [],
        pestPresence: [],
        fertilizationApplied: 'NPK 15-10-20',
        irrigationEvents: 3,
        notes: 'Good recovery year. Barley performed well with proper nutrient management.',
      },
      {
        year: 2024,
        cropName: 'Wheat',
        plantingDate: '2024-10-10',
        harvestDate: '2025-06-15',
        quantityHarvested: 12800,
        unit: 'kg',
        yieldPerHectare: 4920,
        quality: 'premium',
        soilPH: 6.8,
        moisture: 66,
        nitrogen: 46,
        phosphorus: 29,
        potassium: 185,
        temperature: 21,
        rainfall: 510,
        diseasePresence: [],
        pestPresence: [],
        fertilizationApplied: 'NPK 18-12-12',
        irrigationEvents: 4,
        notes: 'Best year on record. Improved soil management and timely interventions.',
      },
    ],
  });

  const [selectedRecord, setSelectedRecord] = useState<HistoricalRecord | null>(null);
  const [timeRange, setTimeRange] = useState<'all' | '3years' | '5years'>('all');
  const [showComparison, setShowComparison] = useState(false);

  const fields: FieldHistory[] = [
    selectedField,
    {
      fieldId: 2,
      fieldName: 'South Field',
      yearsOfData: 4,
      records: [
        {
          year: 2021,
          cropName: 'Corn',
          plantingDate: '2021-04-15',
          harvestDate: '2021-09-10',
          quantityHarvested: 11200,
          unit: 'kg',
          yieldPerHectare: 4200,
          quality: 'grade_b',
          soilPH: 7.1,
          moisture: 68,
          nitrogen: 48,
          phosphorus: 30,
          potassium: 190,
          temperature: 23,
          rainfall: 550,
          diseasePresence: ['leaf_spot'],
          pestPresence: [],
          fertilizationApplied: 'NPK 20-10-10',
          irrigationEvents: 5,
          notes: 'Higher moisture affected quality.',
        },
        {
          year: 2022,
          cropName: 'Soybean',
          plantingDate: '2022-05-05',
          harvestDate: '2022-10-15',
          quantityHarvested: 7800,
          unit: 'kg',
          yieldPerHectare: 2920,
          quality: 'grade_c',
          soilPH: 7.0,
          moisture: 55,
          nitrogen: 35,
          phosphorus: 22,
          potassium: 160,
          temperature: 21,
          rainfall: 350,
          diseasePresence: ['rust', 'blight'],
          pestPresence: ['aphids'],
          fertilizationApplied: 'NPK 10-15-15',
          irrigationEvents: 1,
          notes: 'Severe drought and disease pressure.',
        },
        {
          year: 2023,
          cropName: 'Corn',
          plantingDate: '2023-04-20',
          harvestDate: '2023-09-20',
          quantityHarvested: 10500,
          unit: 'kg',
          yieldPerHectare: 3940,
          quality: 'grade_a',
          soilPH: 7.0,
          moisture: 66,
          nitrogen: 46,
          phosphorus: 28,
          potassium: 185,
          temperature: 22,
          rainfall: 490,
          diseasePresence: [],
          pestPresence: [],
          fertilizationApplied: 'NPK 20-10-10',
          irrigationEvents: 4,
          notes: 'Good recovery with improved management.',
        },
        {
          year: 2024,
          cropName: 'Soybean',
          plantingDate: '2024-05-15',
          harvestDate: '2024-10-25',
          quantityHarvested: 9200,
          unit: 'kg',
          yieldPerHectare: 3450,
          quality: 'grade_a',
          soilPH: 7.1,
          moisture: 67,
          nitrogen: 47,
          phosphorus: 29,
          potassium: 188,
          temperature: 23,
          rainfall: 520,
          diseasePresence: [],
          pestPresence: [],
          fertilizationApplied: 'NPK 10-15-15',
          irrigationEvents: 5,
          notes: 'Excellent year with proper crop rotation benefits.',
        },
      ],
    },
  ];

  const getFilteredRecords = () => {
    const currentYear = new Date().getFullYear();
    if (timeRange === '3years') {
      return selectedField.records.filter(r => currentYear - r.year <= 3);
    }
    if (timeRange === '5years') {
      return selectedField.records.filter(r => currentYear - r.year <= 5);
    }
    return selectedField.records;
  };

  const filteredRecords = getFilteredRecords();

  const yieldTrend = filteredRecords.map(r => ({
    year: r.year,
    yield: r.yieldPerHectare,
    crop: r.cropName,
  }));

  const soilTrend = filteredRecords.map(r => ({
    year: r.year,
    pH: r.soilPH,
    nitrogen: r.nitrogen,
    phosphorus: r.phosphorus,
    potassium: r.potassium,
  }));

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'premium':
        return 'bg-purple-100 text-purple-800';
      case 'grade_a':
        return 'bg-green-100 text-green-800';
      case 'grade_b':
        return 'bg-yellow-100 text-yellow-800';
      case 'grade_c':
        return 'bg-orange-100 text-orange-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateAverageYield = () => {
    if (filteredRecords.length === 0) return 0;
    return (filteredRecords.reduce((sum, r) => sum + r.yieldPerHectare, 0) / filteredRecords.length).toFixed(0);
  };

  const calculateTrend = () => {
    if (filteredRecords.length < 2) return 'stable';
    const recent = filteredRecords.slice(-2);
    const older = filteredRecords.slice(0, -2);
    if (older.length === 0) return 'stable';
    const recentAvg = recent.reduce((sum, r) => sum + r.yieldPerHectare, 0) / recent.length;
    const olderAvg = older.reduce((sum, r) => sum + r.yieldPerHectare, 0) / older.length;
    const change = ((recentAvg - olderAvg) / olderAvg) * 100;
    if (change > 5) return 'improving';
    if (change < -5) return 'declining';
    return 'stable';
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Historical Field Data</h1>
          <p className="text-gray-600">Track field performance over time with comprehensive historical records</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedField.fieldId.toString()} onValueChange={(val) => {
            const field = fields.find(f => f.fieldId === parseInt(val));
            if (field) setSelectedField(field);
          }}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {fields.map(field => (
                <SelectItem key={field.fieldId} value={field.fieldId.toString()}>
                  {field.fieldName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={showComparison} onOpenChange={setShowComparison}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <TrendingUp className="w-4 h-4" /> Compare Fields
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Field Comparison</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {fields.map(field => (
                    <Card key={field.fieldId}>
                      <CardContent className="pt-6">
                        <p className="font-semibold mb-2">{field.fieldName}</p>
                        <div className="space-y-1 text-sm">
                          <p>Years of Data: {field.yearsOfData}</p>
                          <p>
                            Avg Yield:{' '}
                            {(field.records.reduce((sum, r) => sum + r.yieldPerHectare, 0) / field.records.length).toFixed(0)}{' '}
                            kg/ha
                          </p>
                          <p>Latest Crop: {field.records[field.records.length - 1]?.cropName}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600 mb-1">Average Yield</p>
            <p className="text-3xl font-bold">{calculateAverageYield()}</p>
            <p className="text-xs text-gray-500">kg/hectare</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600 mb-1">Yield Trend</p>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <p className="text-lg font-semibold capitalize">{calculateTrend()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600 mb-1">Years of Data</p>
            <p className="text-3xl font-bold">{selectedField.yearsOfData}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600 mb-1">Records</p>
            <p className="text-3xl font-bold">{filteredRecords.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Time Range Filter */}
      <div className="flex gap-2">
        <Button
          variant={timeRange === 'all' ? 'default' : 'outline'}
          onClick={() => setTimeRange('all')}
          size="sm"
        >
          All Years
        </Button>
        <Button
          variant={timeRange === '5years' ? 'default' : 'outline'}
          onClick={() => setTimeRange('5years')}
          size="sm"
        >
          Last 5 Years
        </Button>
        <Button
          variant={timeRange === '3years' ? 'default' : 'outline'}
          onClick={() => setTimeRange('3years')}
          size="sm"
        >
          Last 3 Years
        </Button>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Yield Trend Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={yieldTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="yield" stroke="#10b981" name="Yield (kg/ha)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Soil Nutrient Levels</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={soilTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="nitrogen" stroke="#3b82f6" name="Nitrogen" strokeWidth={2} />
                <Line type="monotone" dataKey="phosphorus" stroke="#f59e0b" name="Phosphorus" strokeWidth={2} />
                <Line type="monotone" dataKey="potassium" stroke="#8b5cf6" name="Potassium" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Historical Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>Historical Records</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="table" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="table">Table View</TabsTrigger>
              <TabsTrigger value="timeline">Timeline View</TabsTrigger>
            </TabsList>

            <TabsContent value="table" className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left py-2 px-2">Year</th>
                      <th className="text-left py-2 px-2">Crop</th>
                      <th className="text-left py-2 px-2">Planting</th>
                      <th className="text-left py-2 px-2">Harvest</th>
                      <th className="text-left py-2 px-2">Yield (kg/ha)</th>
                      <th className="text-left py-2 px-2">Quality</th>
                      <th className="text-left py-2 px-2">Soil pH</th>
                      <th className="text-left py-2 px-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.map(record => (
                      <tr key={record.year} className="border-b hover:bg-gray-50">
                        <td className="py-2 px-2 font-semibold">{record.year}</td>
                        <td className="py-2 px-2">
                          <div className="flex items-center gap-2">
                            <Leaf className="w-4 h-4 text-green-600" />
                            {record.cropName}
                          </div>
                        </td>
                        <td className="py-2 px-2 text-xs">{record.plantingDate}</td>
                        <td className="py-2 px-2 text-xs">{record.harvestDate}</td>
                        <td className="py-2 px-2 font-semibold">{record.yieldPerHectare}</td>
                        <td className="py-2 px-2">
                          <Badge className={getQualityColor(record.quality)}>
                            {record.quality.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="py-2 px-2">{record.soilPH}</td>
                        <td className="py-2 px-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedRecord(record)}
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="timeline" className="space-y-4">
              <div className="space-y-4">
                {filteredRecords.map((record, idx) => (
                  <div
                    key={record.year}
                    className="flex gap-4 pb-4 border-b last:border-b-0 cursor-pointer hover:bg-gray-50 p-2 rounded"
                    onClick={() => setSelectedRecord(record)}
                  >
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center font-semibold">
                        {record.year}
                      </div>
                      {idx < filteredRecords.length - 1 && <div className="w-1 h-8 bg-blue-200 mt-2" />}
                    </div>
                    <div className="flex-1 pt-2">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{record.cropName}</h4>
                        <Badge className={getQualityColor(record.quality)}>
                          {record.quality.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {record.plantingDate} to {record.harvestDate}
                      </p>
                      <div className="grid grid-cols-4 gap-2 text-xs">
                        <div>
                          <p className="text-gray-600">Yield</p>
                          <p className="font-semibold">{record.yieldPerHectare} kg/ha</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Soil pH</p>
                          <p className="font-semibold">{record.soilPH}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Rainfall</p>
                          <p className="font-semibold">{record.rainfall} mm</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Irrigation</p>
                          <p className="font-semibold">{record.irrigationEvents} events</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Detailed Record View */}
      {selectedRecord && (
        <Dialog open={!!selectedRecord} onOpenChange={() => setSelectedRecord(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedRecord.cropName} - {selectedRecord.year}</DialogTitle>
            </DialogHeader>
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="soil">Soil</TabsTrigger>
                <TabsTrigger value="environment">Environment</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Planting Date</p>
                    <p className="font-semibold">{selectedRecord.plantingDate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Harvest Date</p>
                    <p className="font-semibold">{selectedRecord.harvestDate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Quantity Harvested</p>
                    <p className="font-semibold">{selectedRecord.quantityHarvested} {selectedRecord.unit}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Yield per Hectare</p>
                    <p className="font-semibold text-lg">{selectedRecord.yieldPerHectare} kg/ha</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Quality</p>
                    <Badge className={getQualityColor(selectedRecord.quality)}>
                      {selectedRecord.quality.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Fertilization</p>
                    <p className="font-semibold">{selectedRecord.fertilizationApplied}</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="soil" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Soil pH</p>
                    <p className="text-2xl font-bold">{selectedRecord.soilPH}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Moisture</p>
                    <p className="text-2xl font-bold">{selectedRecord.moisture}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Nitrogen</p>
                    <p className="text-2xl font-bold">{selectedRecord.nitrogen}</p>
                    <p className="text-xs text-gray-500">ppm</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Phosphorus</p>
                    <p className="text-2xl font-bold">{selectedRecord.phosphorus}</p>
                    <p className="text-xs text-gray-500">ppm</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Potassium</p>
                    <p className="text-2xl font-bold">{selectedRecord.potassium}</p>
                    <p className="text-xs text-gray-500">ppm</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="environment" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Temperature</p>
                    <p className="text-2xl font-bold">{selectedRecord.temperature}°C</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Rainfall</p>
                    <p className="text-2xl font-bold">{selectedRecord.rainfall}</p>
                    <p className="text-xs text-gray-500">mm</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Irrigation Events</p>
                    <p className="text-2xl font-bold">{selectedRecord.irrigationEvents}</p>
                  </div>
                </div>

                {(selectedRecord.diseasePresence.length > 0 || selectedRecord.pestPresence.length > 0) && (
                  <div className="bg-yellow-50 p-3 rounded">
                    {selectedRecord.diseasePresence.length > 0 && (
                      <div className="mb-2">
                        <p className="font-semibold text-sm mb-1">Diseases</p>
                        <div className="flex gap-1 flex-wrap">
                          {selectedRecord.diseasePresence.map(disease => (
                            <Badge key={disease} variant="outline">
                              {disease.replace('_', ' ')}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedRecord.pestPresence.length > 0 && (
                      <div>
                        <p className="font-semibold text-sm mb-1">Pests</p>
                        <div className="flex gap-1 flex-wrap">
                          {selectedRecord.pestPresence.map(pest => (
                            <Badge key={pest} variant="outline">
                              {pest.replace('_', ' ')}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="notes" className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm">{selectedRecord.notes}</p>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default HistoricalFieldData;
