'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, Zap, AlertCircle, CheckCircle, Leaf, Droplet, Thermometer, Wind } from 'lucide-react';

interface CropRecommendation {
  id: number;
  cropName: string;
  scientificName: string;
  compatibilityScore: number; // 0-100
  yieldPotential: number; // kg/hectare
  waterRequirement: 'low' | 'medium' | 'high';
  soilPHRange: { min: number; max: number };
  temperatureRange: { min: number; max: number };
  growingPeriod: number; // days
  marketDemand: 'low' | 'medium' | 'high';
  profitMargin: number; // percentage
  riskLevel: 'low' | 'medium' | 'high';
  reasons: string[];
  warnings: string[];
  historicalYield?: number;
  lastGrown?: string;
}

interface FieldData {
  fieldId: number;
  fieldName: string;
  soilPH: number;
  moisture: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  temperature: number;
  lastCrop?: string;
  yearsInRotation: number;
}

export const CropRecommendationEngine = () => {
  const [selectedField, setSelectedField] = useState<FieldData>({
    fieldId: 1,
    fieldName: 'North Field',
    soilPH: 6.8,
    moisture: 65,
    nitrogen: 45,
    phosphorus: 28,
    potassium: 180,
    temperature: 22,
    lastCrop: 'Wheat',
    yearsInRotation: 1,
  });

  const [recommendations, setRecommendations] = useState<CropRecommendation[]>([
    {
      id: 1,
      cropName: 'Corn',
      scientificName: 'Zea mays',
      compatibilityScore: 92,
      yieldPotential: 8500,
      waterRequirement: 'medium',
      soilPHRange: { min: 6.0, max: 7.5 },
      temperatureRange: { min: 15, max: 30 },
      growingPeriod: 120,
      marketDemand: 'high',
      profitMargin: 35,
      riskLevel: 'low',
      reasons: [
        'Soil pH 6.8 is optimal for corn',
        'Nitrogen level (45 ppm) is adequate',
        'Good moisture retention',
        'Temperature range suitable',
      ],
      warnings: [],
      historicalYield: 8200,
      lastGrown: '2024',
    },
    {
      id: 2,
      cropName: 'Soybean',
      scientificName: 'Glycine max',
      compatibilityScore: 88,
      yieldPotential: 3200,
      waterRequirement: 'medium',
      soilPHRange: { min: 6.0, max: 7.5 },
      temperatureRange: { min: 18, max: 28 },
      growingPeriod: 110,
      marketDemand: 'high',
      profitMargin: 32,
      riskLevel: 'low',
      reasons: [
        'Excellent crop rotation option after wheat',
        'Nitrogen-fixing legume improves soil',
        'Soil conditions are favorable',
        'Strong market demand',
      ],
      warnings: [],
      historicalYield: 3100,
      lastGrown: '2023',
    },
    {
      id: 3,
      cropName: 'Barley',
      scientificName: 'Hordeum vulgare',
      compatibilityScore: 82,
      yieldPotential: 5500,
      waterRequirement: 'low',
      soilPHRange: { min: 6.0, max: 7.8 },
      temperatureRange: { min: 10, max: 25 },
      growingPeriod: 100,
      marketDemand: 'medium',
      profitMargin: 28,
      riskLevel: 'low',
      reasons: [
        'Drought-tolerant option',
        'Soil pH slightly favorable',
        'Lower water requirement',
        'Good for soil improvement',
      ],
      warnings: ['Slightly lower market demand compared to corn'],
      historicalYield: 5300,
      lastGrown: '2022',
    },
    {
      id: 4,
      cropName: 'Sunflower',
      scientificName: 'Helianthus annuus',
      compatibilityScore: 75,
      yieldPotential: 2800,
      waterRequirement: 'low',
      soilPHRange: { min: 6.0, max: 8.0 },
      temperatureRange: { min: 15, max: 28 },
      growingPeriod: 90,
      marketDemand: 'medium',
      profitMargin: 30,
      riskLevel: 'medium',
      reasons: [
        'Drought-tolerant crop',
        'Soil pH is suitable',
        'Good for crop rotation',
      ],
      warnings: [
        'Requires well-drained soil',
        'May need additional phosphorus',
      ],
      historicalYield: 2600,
      lastGrown: '2021',
    },
    {
      id: 5,
      cropName: 'Rice',
      scientificName: 'Oryza sativa',
      compatibilityScore: 45,
      yieldPotential: 6000,
      waterRequirement: 'high',
      soilPHRange: { min: 5.5, max: 7.0 },
      temperatureRange: { min: 20, max: 30 },
      growingPeriod: 130,
      marketDemand: 'high',
      profitMargin: 25,
      riskLevel: 'high',
      reasons: [
        'High market demand',
        'Good yield potential',
      ],
      warnings: [
        'Requires high water availability',
        'Current moisture level may be insufficient',
        'Soil pH slightly above optimal range',
        'High disease risk in current conditions',
      ],
      historicalYield: undefined,
      lastGrown: undefined,
    },
  ]);

  const [showAnalysis, setShowAnalysis] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] = useState<CropRecommendation | null>(null);

  const fields: FieldData[] = [
    selectedField,
    {
      fieldId: 2,
      fieldName: 'South Field',
      soilPH: 7.2,
      moisture: 70,
      nitrogen: 50,
      phosphorus: 32,
      potassium: 190,
      temperature: 23,
      lastCrop: 'Corn',
      yearsInRotation: 2,
    },
    {
      fieldId: 3,
      fieldName: 'East Field',
      soilPH: 6.5,
      moisture: 55,
      nitrogen: 38,
      phosphorus: 22,
      potassium: 165,
      temperature: 21,
      lastCrop: 'Barley',
      yearsInRotation: 1,
    },
  ];

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'bg-green-100 text-green-800';
    if (score >= 70) return 'bg-yellow-100 text-yellow-800';
    if (score >= 50) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getWaterColor = (water: string) => {
    switch (water) {
      case 'low':
        return 'text-blue-600';
      case 'medium':
        return 'text-blue-500';
      case 'high':
        return 'text-blue-400';
      default:
        return 'text-gray-600';
    }
  };

  const getDemandColor = (demand: string) => {
    switch (demand) {
      case 'high':
        return 'text-green-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Crop Recommendation Engine</h1>
          <p className="text-gray-600">AI-powered crop suggestions based on soil and field conditions</p>
        </div>
        <Dialog open={showAnalysis} onOpenChange={setShowAnalysis}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Zap className="w-4 h-4" /> Generate Recommendations
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Recommendation Analysis</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Select Field:</p>
                <Select value={selectedField.fieldId.toString()} onValueChange={(val) => {
                  const field = fields.find(f => f.fieldId === parseInt(val));
                  if (field) setSelectedField(field);
                }}>
                  <SelectTrigger>
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
              </div>
              <div className="bg-blue-50 p-3 rounded-lg space-y-2 text-sm">
                <p><strong>Soil pH:</strong> {selectedField.soilPH}</p>
                <p><strong>Moisture:</strong> {selectedField.moisture}%</p>
                <p><strong>Nitrogen:</strong> {selectedField.nitrogen} ppm</p>
                <p><strong>Temperature:</strong> {selectedField.temperature}°C</p>
                <p><strong>Last Crop:</strong> {selectedField.lastCrop || 'None'}</p>
              </div>
              <Button className="w-full">Analyze & Generate</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Field Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Current Field: {selectedField.fieldName}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div>
              <p className="text-sm text-gray-600">Soil pH</p>
              <p className="text-2xl font-bold">{selectedField.soilPH}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Moisture</p>
              <p className="text-2xl font-bold">{selectedField.moisture}%</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Nitrogen</p>
              <p className="text-2xl font-bold">{selectedField.nitrogen}</p>
              <p className="text-xs text-gray-500">ppm</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Phosphorus</p>
              <p className="text-2xl font-bold">{selectedField.phosphorus}</p>
              <p className="text-xs text-gray-500">ppm</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Potassium</p>
              <p className="text-2xl font-bold">{selectedField.potassium}</p>
              <p className="text-xs text-gray-500">ppm</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Temperature</p>
              <p className="text-2xl font-bold">{selectedField.temperature}°C</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Recommended Crops</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendations.map(rec => (
            <Card
              key={rec.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedRecommendation(rec)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{rec.cropName}</CardTitle>
                    <p className="text-sm text-gray-600 italic">{rec.scientificName}</p>
                  </div>
                  <Badge className={getScoreColor(rec.compatibilityScore)}>
                    {rec.compatibilityScore}%
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-gray-600">Yield Potential</p>
                    <p className="font-semibold">{rec.yieldPotential} kg/ha</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Growing Period</p>
                    <p className="font-semibold">{rec.growingPeriod} days</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Profit Margin</p>
                    <p className="font-semibold text-green-600">{rec.profitMargin}%</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Risk Level</p>
                    <Badge className={getRiskColor(rec.riskLevel)} variant="outline">
                      {rec.riskLevel}
                    </Badge>
                  </div>
                </div>

                {/* Requirements */}
                <div className="border-t pt-3 space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Droplet className={`w-4 h-4 ${getWaterColor(rec.waterRequirement)}`} />
                    <span>Water: {rec.waterRequirement}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Thermometer className="w-4 h-4 text-orange-600" />
                    <span>Temp: {rec.temperatureRange.min}°C - {rec.temperatureRange.max}°C</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Leaf className="w-4 h-4 text-green-600" />
                    <span>pH: {rec.soilPHRange.min} - {rec.soilPHRange.max}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className={`w-4 h-4 ${getDemandColor(rec.marketDemand)}`} />
                    <span>Market Demand: {rec.marketDemand}</span>
                  </div>
                </div>

                {/* Warnings */}
                {rec.warnings.length > 0 && (
                  <div className="bg-yellow-50 p-2 rounded text-xs">
                    {rec.warnings.map((warning, idx) => (
                      <div key={idx} className="flex gap-1 mb-1">
                        <AlertCircle className="w-3 h-3 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <span className="text-yellow-800">{warning}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Detailed Analysis Modal */}
      {selectedRecommendation && (
        <Dialog open={!!selectedRecommendation} onOpenChange={() => setSelectedRecommendation(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedRecommendation.cropName} - Detailed Analysis</DialogTitle>
            </DialogHeader>
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="requirements">Requirements</TabsTrigger>
                <TabsTrigger value="analysis">Analysis</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Compatibility Score</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${selectedRecommendation.compatibilityScore}%` }}
                        />
                      </div>
                      <span className="font-semibold">{selectedRecommendation.compatibilityScore}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Risk Level</p>
                    <Badge className={getRiskColor(selectedRecommendation.riskLevel)} className="mt-1">
                      {selectedRecommendation.riskLevel}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Yield Potential</p>
                    <p className="text-2xl font-bold">{selectedRecommendation.yieldPotential}</p>
                    <p className="text-xs text-gray-500">kg/hectare</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Profit Margin</p>
                    <p className="text-2xl font-bold text-green-600">{selectedRecommendation.profitMargin}%</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Growing Period</p>
                    <p className="text-lg font-semibold">{selectedRecommendation.growingPeriod} days</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Market Demand</p>
                    <Badge className={getDemandColor(selectedRecommendation.marketDemand)}>
                      {selectedRecommendation.marketDemand}
                    </Badge>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="requirements" className="space-y-4">
                <div>
                  <p className="font-semibold mb-2">Soil pH Range</p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{selectedRecommendation.soilPHRange.min}</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          marginLeft: `${(selectedRecommendation.soilPHRange.min / 14) * 100}%`,
                          width: `${((selectedRecommendation.soilPHRange.max - selectedRecommendation.soilPHRange.min) / 14) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm">{selectedRecommendation.soilPHRange.max}</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">Current pH: {selectedField.soilPH}</p>
                </div>

                <div>
                  <p className="font-semibold mb-2">Temperature Range</p>
                  <p className="text-sm">
                    {selectedRecommendation.temperatureRange.min}°C - {selectedRecommendation.temperatureRange.max}°C
                  </p>
                  <p className="text-xs text-gray-600 mt-1">Current: {selectedField.temperature}°C</p>
                </div>

                <div>
                  <p className="font-semibold mb-2">Water Requirement</p>
                  <Badge>{selectedRecommendation.waterRequirement}</Badge>
                  <p className="text-xs text-gray-600 mt-1">Current moisture: {selectedField.moisture}%</p>
                </div>
              </TabsContent>

              <TabsContent value="analysis" className="space-y-4">
                <div>
                  <p className="font-semibold mb-2">Why This Crop?</p>
                  <ul className="space-y-1">
                    {selectedRecommendation.reasons.map((reason, idx) => (
                      <li key={idx} className="flex gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {selectedRecommendation.warnings.length > 0 && (
                  <div>
                    <p className="font-semibold mb-2">Warnings & Considerations</p>
                    <ul className="space-y-1">
                      {selectedRecommendation.warnings.map((warning, idx) => (
                        <li key={idx} className="flex gap-2 text-sm">
                          <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                          <span>{warning}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="history" className="space-y-4">
                {selectedRecommendation.historicalYield ? (
                  <>
                    <div>
                      <p className="text-sm text-gray-600">Last Grown</p>
                      <p className="font-semibold">{selectedRecommendation.lastGrown}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Historical Yield</p>
                      <p className="text-2xl font-bold">{selectedRecommendation.historicalYield} kg/ha</p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded">
                      <p className="text-sm">
                        Based on historical data, this crop has performed well in this field with an average yield of{' '}
                        {selectedRecommendation.historicalYield} kg/ha.
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-6 text-gray-600">
                    <p>No historical data available for this crop in this field.</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default CropRecommendationEngine;
