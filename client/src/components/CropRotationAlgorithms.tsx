'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, CheckCircle, Leaf, Zap, TrendingUp, Calendar } from 'lucide-react';

interface CropRotationPlan {
  fieldId: number;
  fieldName: string;
  currentCrop: string;
  currentYear: number;
  rotationStrategy: 'two_year' | 'three_year' | 'four_year' | 'custom';
  schedule: RotationYear[];
  soilHealthScore: number;
  nitrogenBalance: number;
  diseaseRiskReduction: number;
  yieldOptimization: number;
  recommendations: string[];
  warnings: string[];
}

interface RotationYear {
  year: number;
  crop: string;
  benefits: string[];
  soilImpact: 'improve' | 'maintain' | 'deplete';
  diseaseRisk: 'low' | 'medium' | 'high';
  nitrogenImpact: number; // -50 to +50
}

interface CropCompatibility {
  crop1: string;
  crop2: string;
  compatibility: number; // 0-100
  reason: string;
}

export const CropRotationAlgorithms = () => {
  const [selectedField, setSelectedField] = useState<CropRotationPlan>({
    fieldId: 1,
    fieldName: 'North Field',
    currentCrop: 'Wheat',
    currentYear: 2025,
    rotationStrategy: 'three_year',
    schedule: [
      {
        year: 2025,
        crop: 'Wheat',
        benefits: ['Cash crop', 'High market value'],
        soilImpact: 'deplete',
        diseaseRisk: 'low',
        nitrogenImpact: -30,
      },
      {
        year: 2026,
        crop: 'Soybean',
        benefits: ['Nitrogen fixation', 'Legume rotation', 'Improves soil'],
        soilImpact: 'improve',
        diseaseRisk: 'low',
        nitrogenImpact: +40,
      },
      {
        year: 2027,
        crop: 'Corn',
        benefits: ['High yield potential', 'Market demand', 'Soil recovery'],
        soilImpact: 'maintain',
        diseaseRisk: 'medium',
        nitrogenImpact: -20,
      },
    ],
    soilHealthScore: 78,
    nitrogenBalance: 12,
    diseaseRiskReduction: 65,
    yieldOptimization: 82,
    recommendations: [
      'Maintain 3-year rotation for optimal soil health',
      'Add cover crops in winter to improve nitrogen levels',
      'Monitor for wheat diseases in year 2026',
      'Consider adding legume in rotation to boost nitrogen',
    ],
    warnings: [
      'Nitrogen levels declining - consider supplemental fertilization',
      'Wheat disease pressure may increase if rotated too frequently',
    ],
  });

  const [rotationStrategy, setRotationStrategy] = useState<'two_year' | 'three_year' | 'four_year' | 'custom'>('three_year');
  const [showOptimization, setShowOptimization] = useState(false);
  const [selectedYear, setSelectedYear] = useState<RotationYear | null>(null);

  const fields: CropRotationPlan[] = [
    selectedField,
    {
      fieldId: 2,
      fieldName: 'South Field',
      currentCrop: 'Corn',
      currentYear: 2025,
      rotationStrategy: 'four_year',
      schedule: [
        {
          year: 2025,
          crop: 'Corn',
          benefits: ['High yield', 'Market demand'],
          soilImpact: 'deplete',
          diseaseRisk: 'medium',
          nitrogenImpact: -35,
        },
        {
          year: 2026,
          crop: 'Soybean',
          benefits: ['Nitrogen fixation', 'Pest break'],
          soilImpact: 'improve',
          diseaseRisk: 'low',
          nitrogenImpact: +45,
        },
        {
          year: 2027,
          crop: 'Barley',
          benefits: ['Soil improvement', 'Disease break'],
          soilImpact: 'maintain',
          diseaseRisk: 'low',
          nitrogenImpact: -15,
        },
        {
          year: 2028,
          crop: 'Alfalfa',
          benefits: ['Nitrogen accumulation', 'Soil structure'],
          soilImpact: 'improve',
          diseaseRisk: 'low',
          nitrogenImpact: +50,
        },
      ],
      soilHealthScore: 85,
      nitrogenBalance: 25,
      diseaseRiskReduction: 78,
      yieldOptimization: 88,
      recommendations: [
        'Excellent 4-year rotation plan',
        'Nitrogen levels well-balanced',
        'Disease pressure minimized',
      ],
      warnings: [],
    },
  ];

  const cropCompatibilities: CropCompatibility[] = [
    { crop1: 'Wheat', crop2: 'Soybean', compatibility: 95, reason: 'Excellent rotation - nitrogen fixation helps wheat' },
    { crop1: 'Wheat', crop2: 'Corn', compatibility: 70, reason: 'Good but may increase disease pressure' },
    { crop1: 'Wheat', crop2: 'Barley', compatibility: 50, reason: 'Same family - disease risk' },
    { crop1: 'Corn', crop2: 'Soybean', compatibility: 92, reason: 'Classic rotation - proven benefits' },
    { crop1: 'Corn', crop2: 'Alfalfa', compatibility: 88, reason: 'Excellent soil improvement' },
    { crop1: 'Soybean', crop2: 'Corn', compatibility: 92, reason: 'Complementary nutrient needs' },
    { crop1: 'Soybean', crop2: 'Wheat', compatibility: 95, reason: 'Nitrogen-fixing legume benefits cereals' },
    { crop1: 'Barley', crop2: 'Soybean', compatibility: 85, reason: 'Good disease break' },
  ];

  const getSoilImpactColor = (impact: string) => {
    switch (impact) {
      case 'improve':
        return 'bg-green-100 text-green-800';
      case 'maintain':
        return 'bg-blue-100 text-blue-800';
      case 'deplete':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDiseaseRiskColor = (risk: string) => {
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

  const getCompatibilityColor = (score: number) => {
    if (score >= 85) return 'bg-green-100 text-green-800';
    if (score >= 70) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Crop Rotation Algorithms</h1>
          <p className="text-gray-600">Optimize crop rotation for soil health and disease management</p>
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
          <Dialog open={showOptimization} onOpenChange={setShowOptimization}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Zap className="w-4 h-4" /> Optimize Rotation
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Rotation Strategy Selection</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-3">Select Rotation Strategy:</p>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input type="radio" name="strategy" value="two_year" defaultChecked={rotationStrategy === 'two_year'} onChange={(e) => setRotationStrategy(e.target.value as any)} />
                      <div>
                        <p className="font-medium">2-Year Rotation</p>
                        <p className="text-xs text-gray-600">Simple but may deplete soil</p>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input type="radio" name="strategy" value="three_year" defaultChecked={rotationStrategy === 'three_year'} onChange={(e) => setRotationStrategy(e.target.value as any)} />
                      <div>
                        <p className="font-medium">3-Year Rotation</p>
                        <p className="text-xs text-gray-600">Balanced approach - recommended</p>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input type="radio" name="strategy" value="four_year" defaultChecked={rotationStrategy === 'four_year'} onChange={(e) => setRotationStrategy(e.target.value as any)} />
                      <div>
                        <p className="font-medium">4-Year Rotation</p>
                        <p className="text-xs text-gray-600">Optimal for soil health</p>
                      </div>
                    </label>
                  </div>
                </div>
                <Button className="w-full">Apply Strategy</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600 mb-1">Soil Health Score</p>
            <p className="text-3xl font-bold">{selectedField.soilHealthScore}</p>
            <p className="text-xs text-gray-500">/ 100</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600 mb-1">Nitrogen Balance</p>
            <p className={`text-3xl font-bold ${selectedField.nitrogenBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {selectedField.nitrogenBalance > 0 ? '+' : ''}{selectedField.nitrogenBalance}
            </p>
            <p className="text-xs text-gray-500">ppm</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600 mb-1">Disease Risk Reduction</p>
            <p className="text-3xl font-bold text-green-600">{selectedField.diseaseRiskReduction}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600 mb-1">Yield Optimization</p>
            <p className="text-3xl font-bold text-blue-600">{selectedField.yieldOptimization}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations and Warnings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {selectedField.recommendations.length > 0 && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-900 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" /> Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {selectedField.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {selectedField.warnings.length > 0 && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="text-yellow-900 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" /> Warnings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {selectedField.warnings.map((warning, idx) => (
                  <li key={idx} className="flex gap-2 text-sm">
                    <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <span>{warning}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Rotation Schedule */}
      <Card>
        <CardHeader>
          <CardTitle>Recommended Rotation Schedule ({selectedField.rotationStrategy.replace('_', '-').toUpperCase()})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {selectedField.schedule.map((year, idx) => (
              <div
                key={year.year}
                className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setSelectedYear(year)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 font-semibold">
                      {year.year}
                    </div>
                    <div>
                      <h4 className="font-semibold flex items-center gap-2">
                        <Leaf className="w-4 h-4 text-green-600" />
                        {year.crop}
                      </h4>
                      <p className="text-sm text-gray-600">Year {idx + 1} of {selectedField.schedule.length}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={getSoilImpactColor(year.soilImpact)}>
                      {year.soilImpact.replace('_', ' ')}
                    </Badge>
                    <Badge className={getDiseaseRiskColor(year.diseaseRisk)}>
                      {year.diseaseRisk} risk
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-3">
                  <div>
                    <p className="text-xs text-gray-600">Nitrogen Impact</p>
                    <p className={`font-semibold ${year.nitrogenImpact > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {year.nitrogenImpact > 0 ? '+' : ''}{year.nitrogenImpact}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Soil Impact</p>
                    <p className="font-semibold capitalize">{year.soilImpact}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Disease Risk</p>
                    <p className="font-semibold capitalize">{year.diseaseRisk}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-600 mb-1">Benefits:</p>
                  <div className="flex gap-1 flex-wrap">
                    {year.benefits.map((benefit, bidx) => (
                      <Badge key={bidx} variant="outline" className="text-xs">
                        {benefit}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Crop Compatibility Matrix */}
      <Card>
        <CardHeader>
          <CardTitle>Crop Compatibility Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="matrix" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="matrix">Compatibility Matrix</TabsTrigger>
              <TabsTrigger value="details">Detailed Analysis</TabsTrigger>
            </TabsList>

            <TabsContent value="matrix" className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left py-2 px-2">Crop 1</th>
                      <th className="text-left py-2 px-2">Crop 2</th>
                      <th className="text-left py-2 px-2">Score</th>
                      <th className="text-left py-2 px-2">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cropCompatibilities.map((compat, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="py-2 px-2 font-semibold">{compat.crop1}</td>
                        <td className="py-2 px-2 font-semibold">{compat.crop2}</td>
                        <td className="py-2 px-2">
                          <Badge className={getCompatibilityColor(compat.compatibility)}>
                            {compat.compatibility}%
                          </Badge>
                        </td>
                        <td className="py-2 px-2 text-xs text-gray-600">{compat.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="details" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cropCompatibilities.filter(c => c.compatibility >= 85).map((compat, idx) => (
                  <Card key={idx} className="border-green-200 bg-green-50">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold">{compat.crop1} → {compat.crop2}</h4>
                        <Badge className="bg-green-600 text-white">{compat.compatibility}%</Badge>
                      </div>
                      <p className="text-sm text-gray-700">{compat.reason}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Year Detail Modal */}
      {selectedYear && (
        <Dialog open={!!selectedYear} onOpenChange={() => setSelectedYear(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedYear.crop} - Year {selectedYear.year}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Soil Impact</p>
                  <Badge className={getSoilImpactColor(selectedYear.soilImpact)}>
                    {selectedYear.soilImpact.replace('_', ' ')}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Disease Risk</p>
                  <Badge className={getDiseaseRiskColor(selectedYear.diseaseRisk)}>
                    {selectedYear.diseaseRisk}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Nitrogen Impact</p>
                  <p className={`text-lg font-bold ${selectedYear.nitrogenImpact > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedYear.nitrogenImpact > 0 ? '+' : ''}{selectedYear.nitrogenImpact} ppm
                  </p>
                </div>
              </div>

              <div>
                <p className="font-semibold mb-2">Benefits</p>
                <ul className="space-y-1">
                  {selectedYear.benefits.map((benefit, idx) => (
                    <li key={idx} className="flex gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default CropRotationAlgorithms;
