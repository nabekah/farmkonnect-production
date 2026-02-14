'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';
import { TrendingUp, TrendingDown, BarChart3, PieChart as PieChartIcon, AlertCircle, CheckCircle, Leaf, Droplet, Zap } from 'lucide-react';

interface FieldAnalytics {
  fieldId: number;
  fieldName: string;
  totalArea: number;
  activeSegments: number;
  averageYield: number;
  yieldTrend: 'improving' | 'stable' | 'declining';
  profitMargin: number;
  soilHealth: number;
  waterEfficiency: number;
  nitrogenUtilization: number;
  diseaseIncidence: number;
  pestIncidence: number;
  costPerHectare: number;
  revenuePerHectare: number;
  roi: number;
  carbonFootprint: number;
  biodiversity: number;
}

interface PerformanceMetric {
  month: string;
  yield: number;
  soilHealth: number;
  waterUsage: number;
  costPerUnit: number;
}

interface SegmentAnalysis {
  segmentId: number;
  segmentName: string;
  area: number;
  yield: number;
  profitability: number;
  healthScore: number;
  efficiency: number;
  riskLevel: string;
}

export const FieldSpecificAnalytics = () => {
  const [selectedField, setSelectedField] = useState<FieldAnalytics>({
    fieldId: 1,
    fieldName: 'North Field',
    totalArea: 5.2,
    activeSegments: 2,
    averageYield: 4800,
    yieldTrend: 'improving',
    profitMargin: 35,
    soilHealth: 78,
    waterEfficiency: 82,
    nitrogenUtilization: 75,
    diseaseIncidence: 5,
    pestIncidence: 8,
    costPerHectare: 1200,
    revenuePerHectare: 3200,
    roi: 167,
    carbonFootprint: 450,
    biodiversity: 68,
  });

  const [performanceData] = useState<PerformanceMetric[]>([
    { month: 'Jan', yield: 4200, soilHealth: 72, waterUsage: 45, costPerUnit: 0.25 },
    { month: 'Feb', yield: 4400, soilHealth: 74, waterUsage: 48, costPerUnit: 0.24 },
    { month: 'Mar', yield: 4600, soilHealth: 76, waterUsage: 52, costPerUnit: 0.23 },
    { month: 'Apr', yield: 4800, soilHealth: 78, waterUsage: 55, costPerUnit: 0.22 },
    { month: 'May', yield: 5000, soilHealth: 80, waterUsage: 58, costPerUnit: 0.21 },
    { month: 'Jun', yield: 4900, soilHealth: 79, waterUsage: 56, costPerUnit: 0.22 },
  ]);

  const [segmentAnalysis] = useState<SegmentAnalysis[]>([
    {
      segmentId: 1,
      segmentName: 'North-West Zone',
      area: 2.6,
      yield: 5000,
      profitability: 92,
      healthScore: 82,
      efficiency: 88,
      riskLevel: 'low',
    },
    {
      segmentId: 2,
      segmentName: 'North-East Zone',
      area: 2.6,
      yield: 4600,
      profitability: 85,
      healthScore: 74,
      efficiency: 76,
      riskLevel: 'medium',
    },
  ]);

  const [analyticsView, setAnalyticsView] = useState<'overview' | 'performance' | 'segments' | 'sustainability'>('overview');
  const [showReport, setShowReport] = useState(false);

  const fields: FieldAnalytics[] = [
    selectedField,
    {
      fieldId: 2,
      fieldName: 'South Field',
      totalArea: 3.8,
      activeSegments: 2,
      averageYield: 4200,
      yieldTrend: 'stable',
      profitMargin: 32,
      soilHealth: 75,
      waterEfficiency: 78,
      nitrogenUtilization: 72,
      diseaseIncidence: 8,
      pestIncidence: 12,
      costPerHectare: 1300,
      revenuePerHectare: 2800,
      roi: 115,
      carbonFootprint: 520,
      biodiversity: 62,
    },
  ];

  const getTrendIcon = (trend: string) => {
    if (trend === 'improving') return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (trend === 'declining') return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <TrendingUp className="w-4 h-4 text-gray-600" />;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
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

  const profitabilityData = [
    { name: 'Revenue', value: selectedField.revenuePerHectare, fill: '#10b981' },
    { name: 'Cost', value: selectedField.costPerHectare, fill: '#ef4444' },
    { name: 'Profit', value: selectedField.revenuePerHectare - selectedField.costPerHectare, fill: '#3b82f6' },
  ];

  const efficiencyData = [
    { name: 'Water', value: selectedField.waterEfficiency },
    { name: 'Nitrogen', value: selectedField.nitrogenUtilization },
    { name: 'Soil Health', value: selectedField.soilHealth },
    { name: 'Biodiversity', value: selectedField.biodiversity },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Field-Specific Analytics</h1>
          <p className="text-gray-600">Comprehensive field performance analysis and insights</p>
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
          <Dialog open={showReport} onOpenChange={setShowReport}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <BarChart3 className="w-4 h-4" /> Generate Report
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Field Analytics Report</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm mb-2">Report will include:</p>
                  <ul className="text-sm space-y-1 text-gray-700">
                    <li>✓ Field performance summary</li>
                    <li>✓ Yield and profitability analysis</li>
                    <li>✓ Segment-specific insights</li>
                    <li>✓ Sustainability metrics</li>
                    <li>✓ Recommendations</li>
                  </ul>
                </div>
                <Button className="w-full">Download PDF Report</Button>
                <Button variant="outline" className="w-full">Export to Excel</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600 mb-1">Average Yield</p>
            <div className="flex items-end gap-2">
              <p className="text-3xl font-bold">{selectedField.averageYield}</p>
              {getTrendIcon(selectedField.yieldTrend)}
            </div>
            <p className="text-xs text-gray-500">kg/hectare</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600 mb-1">Profit Margin</p>
            <p className="text-3xl font-bold text-green-600">{selectedField.profitMargin}%</p>
            <p className="text-xs text-gray-500">ROI: {selectedField.roi}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600 mb-1">Soil Health</p>
            <p className={`text-3xl font-bold ${getScoreColor(selectedField.soilHealth)}`}>
              {selectedField.soilHealth}
            </p>
            <p className="text-xs text-gray-500">/ 100</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600 mb-1">Water Efficiency</p>
            <p className={`text-3xl font-bold ${getScoreColor(selectedField.waterEfficiency)}`}>
              {selectedField.waterEfficiency}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* View Selector */}
      <Tabs value={analyticsView} onValueChange={(val) => setAnalyticsView(val as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="segments">Segments</TabsTrigger>
          <TabsTrigger value="sustainability">Sustainability</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Profitability Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Profitability Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={profitabilityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Efficiency Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Efficiency Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={efficiencyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Leaf className="w-5 h-5 text-green-600" /> Health Indicators
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Soil Health</span>
                    <span className="font-semibold">{selectedField.soilHealth}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: `${selectedField.soilHealth}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Biodiversity</span>
                    <span className="font-semibold">{selectedField.biodiversity}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: `${selectedField.biodiversity}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Disease Incidence</span>
                    <span className="font-semibold">{selectedField.diseaseIncidence}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-red-600 h-2 rounded-full" style={{ width: `${selectedField.diseaseIncidence}%` }} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Droplet className="w-5 h-5 text-blue-600" /> Resource Efficiency
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Water Efficiency</span>
                    <span className="font-semibold">{selectedField.waterEfficiency}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${selectedField.waterEfficiency}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Nitrogen Utilization</span>
                    <span className="font-semibold">{selectedField.nitrogenUtilization}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${selectedField.nitrogenUtilization}%` }} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-600" /> Economics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Cost per Hectare</p>
                  <p className="text-2xl font-bold">${selectedField.costPerHectare}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Revenue per Hectare</p>
                  <p className="text-2xl font-bold text-green-600">${selectedField.revenuePerHectare}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">ROI</p>
                  <p className="text-2xl font-bold text-blue-600">{selectedField.roi}%</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends (6 Months)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="yield" stroke="#10b981" name="Yield (kg/ha)" strokeWidth={2} />
                  <Line yAxisId="left" type="monotone" dataKey="soilHealth" stroke="#3b82f6" name="Soil Health" strokeWidth={2} />
                  <Line yAxisId="right" type="monotone" dataKey="costPerUnit" stroke="#f59e0b" name="Cost/Unit" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="segments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Segment Performance Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {segmentAnalysis.map(segment => (
                  <div key={segment.segmentId} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold">{segment.segmentName}</h4>
                        <p className="text-sm text-gray-600">{segment.area} hectares</p>
                      </div>
                      <Badge className={getRiskColor(segment.riskLevel)}>
                        {segment.riskLevel} risk
                      </Badge>
                    </div>

                    <div className="grid grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="text-gray-600">Yield</p>
                        <p className="font-semibold">{segment.yield} kg/ha</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Profitability</p>
                        <p className={`font-semibold ${getScoreColor(segment.profitability)}`}>
                          {segment.profitability}%
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Health Score</p>
                        <p className={`font-semibold ${getScoreColor(segment.healthScore)}`}>
                          {segment.healthScore}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Efficiency</p>
                        <p className={`font-semibold ${getScoreColor(segment.efficiency)}`}>
                          {segment.efficiency}%
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sustainability" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Environmental Impact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Carbon Footprint</p>
                  <p className="text-3xl font-bold">{selectedField.carbonFootprint}</p>
                  <p className="text-xs text-gray-500">kg CO₂ per hectare</p>
                </div>
                <div className="bg-green-50 p-3 rounded">
                  <p className="text-sm font-semibold mb-1">Recommendations:</p>
                  <ul className="text-xs space-y-1 text-gray-700">
                    <li>• Implement cover crops to reduce carbon</li>
                    <li>• Use conservation tillage practices</li>
                    <li>• Optimize fertilizer application</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Biodiversity & Ecosystem</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Biodiversity Index</p>
                  <p className="text-3xl font-bold">{selectedField.biodiversity}</p>
                  <p className="text-xs text-gray-500">/ 100</p>
                </div>
                <div className="bg-blue-50 p-3 rounded">
                  <p className="text-sm font-semibold mb-1">Actions:</p>
                  <ul className="text-xs space-y-1 text-gray-700">
                    <li>• Maintain field margins for wildlife</li>
                    <li>• Reduce pesticide usage</li>
                    <li>• Plant native species borders</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FieldSpecificAnalytics;
