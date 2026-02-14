import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertCircle, DollarSign, Zap, Users, Wrench, Droplets, TrendingDown, TrendingUp } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface IrrigationCostData {
  waterCost: number;
  energyCost: number;
  laborCost: number;
  equipmentCost: number;
  maintenanceCost: number;
  totalCost: number;
  costPerHectare: number;
  costPerCubicMeter: number;
  costPerIrrigation: number;
}

interface CostBreakdownData {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];
const IRRIGATION_METHODS = ['flood', 'sprinkler', 'drip', 'furrow'];
const WATER_SOURCES = ['well', 'canal', 'tank', 'river'];
const PUMP_TYPES = ['centrifugal', 'submersible', 'solar'];

export function IrrigationCostAnalysisUI() {
  const [formData, setFormData] = useState({
    fieldId: 'field-001',
    cropName: 'rice',
    areaHectares: 2,
    irrigationMethod: 'drip' as const,
    waterSourceType: 'well' as const,
    pumpType: 'centrifugal' as const,
    totalWaterApplied: 500000,
    pumpPower: 5,
    operatingHours: 100,
    laborHours: 50,
    seasonalIrrigations: 8,
  });

  const [costData, setCostData] = useState<IrrigationCostData | null>(null);
  const [methodComparison, setMethodComparison] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

  // Mock cost calculation
  const calculateCosts = () => {
    const waterRates: Record<string, number> = {
      well: 0.15,
      canal: 0.10,
      tank: 0.05,
      river: 0.08,
    };

    const equipmentCosts: Record<string, number> = {
      flood: 500,
      sprinkler: 800,
      drip: 1200,
      furrow: 600,
    };

    const waterCost = (formData.totalWaterApplied / 1000) * waterRates[formData.waterSourceType];
    const energyCost = formData.pumpPower * formData.operatingHours * 0.12;
    const laborCost = formData.laborHours * 15;
    const equipmentCost = equipmentCosts[formData.irrigationMethod] * formData.areaHectares;
    const maintenanceCost = equipmentCost * 0.08;

    const totalCost = waterCost + energyCost + laborCost + equipmentCost + maintenanceCost;

    const data: IrrigationCostData = {
      waterCost: Math.round(waterCost * 100) / 100,
      energyCost: Math.round(energyCost * 100) / 100,
      laborCost: Math.round(laborCost * 100) / 100,
      equipmentCost: Math.round(equipmentCost * 100) / 100,
      maintenanceCost: Math.round(maintenanceCost * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
      costPerHectare: Math.round((totalCost / formData.areaHectares) * 100) / 100,
      costPerCubicMeter: Math.round((totalCost / (formData.totalWaterApplied / 1000)) * 100) / 100,
      costPerIrrigation: Math.round((totalCost / formData.seasonalIrrigations) * 100) / 100,
    };

    setCostData(data);

    // Generate method comparison
    const comparison = IRRIGATION_METHODS.map((method) => {
      const methodEquipmentCost = equipmentCosts[method] * formData.areaHectares;
      const methodTotalCost =
        waterCost + energyCost + laborCost + methodEquipmentCost + methodEquipmentCost * 0.08;

      const efficiencies: Record<string, number> = {
        flood: 60,
        sprinkler: 75,
        drip: 90,
        furrow: 65,
      };

      return {
        method,
        cost: Math.round(methodTotalCost * 100) / 100,
        efficiency: efficiencies[method],
        costPerHectare: Math.round((methodTotalCost / formData.areaHectares) * 100) / 100,
      };
    });

    setMethodComparison(comparison);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const costBreakdown: CostBreakdownData[] = useMemo(() => {
    if (!costData) return [];
    return [
      {
        name: 'Water',
        value: costData.waterCost,
        percentage: (costData.waterCost / costData.totalCost) * 100,
        color: COLORS[0],
      },
      {
        name: 'Energy',
        value: costData.energyCost,
        percentage: (costData.energyCost / costData.totalCost) * 100,
        color: COLORS[1],
      },
      {
        name: 'Labor',
        value: costData.laborCost,
        percentage: (costData.laborCost / costData.totalCost) * 100,
        color: COLORS[2],
      },
      {
        name: 'Equipment',
        value: costData.equipmentCost,
        percentage: (costData.equipmentCost / costData.totalCost) * 100,
        color: COLORS[3],
      },
      {
        name: 'Maintenance',
        value: costData.maintenanceCost,
        percentage: (costData.maintenanceCost / costData.totalCost) * 100,
        color: COLORS[4],
      },
    ];
  }, [costData]);

  const bestMethod = useMemo(() => {
    if (methodComparison.length === 0) return null;
    return methodComparison.reduce((best, current) =>
      current.efficiency > best.efficiency ? current : best
    );
  }, [methodComparison]);

  return (
    <div className="w-full space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Irrigation Cost Analysis</CardTitle>
            <CardDescription>Calculate and compare irrigation costs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fieldId">Field ID</Label>
              <Input
                id="fieldId"
                value={formData.fieldId}
                onChange={(e) => handleInputChange('fieldId', e.target.value)}
                placeholder="Enter field ID"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cropName">Crop Name</Label>
              <Select value={formData.cropName} onValueChange={(value) => handleInputChange('cropName', value)}>
                <SelectTrigger id="cropName">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rice">Rice</SelectItem>
                  <SelectItem value="wheat">Wheat</SelectItem>
                  <SelectItem value="corn">Corn</SelectItem>
                  <SelectItem value="sugarcane">Sugarcane</SelectItem>
                  <SelectItem value="cotton">Cotton</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="areaHectares">Area (Hectares)</Label>
              <Input
                id="areaHectares"
                type="number"
                value={formData.areaHectares}
                onChange={(e) => handleInputChange('areaHectares', parseFloat(e.target.value))}
                min="0.1"
                step="0.1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="irrigationMethod">Irrigation Method</Label>
              <Select
                value={formData.irrigationMethod}
                onValueChange={(value) => handleInputChange('irrigationMethod', value)}
              >
                <SelectTrigger id="irrigationMethod">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {IRRIGATION_METHODS.map((method) => (
                    <SelectItem key={method} value={method}>
                      {method.charAt(0).toUpperCase() + method.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="waterSourceType">Water Source</Label>
              <Select
                value={formData.waterSourceType}
                onValueChange={(value) => handleInputChange('waterSourceType', value)}
              >
                <SelectTrigger id="waterSourceType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WATER_SOURCES.map((source) => (
                    <SelectItem key={source} value={source}>
                      {source.charAt(0).toUpperCase() + source.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pumpType">Pump Type</Label>
              <Select value={formData.pumpType} onValueChange={(value) => handleInputChange('pumpType', value)}>
                <SelectTrigger id="pumpType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PUMP_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalWaterApplied">Total Water Applied (Liters)</Label>
              <Input
                id="totalWaterApplied"
                type="number"
                value={formData.totalWaterApplied}
                onChange={(e) => handleInputChange('totalWaterApplied', parseFloat(e.target.value))}
                min="0"
                step="10000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pumpPower">Pump Power (kW)</Label>
              <Input
                id="pumpPower"
                type="number"
                value={formData.pumpPower}
                onChange={(e) => handleInputChange('pumpPower', parseFloat(e.target.value))}
                min="0.5"
                step="0.5"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="operatingHours">Operating Hours</Label>
              <Input
                id="operatingHours"
                type="number"
                value={formData.operatingHours}
                onChange={(e) => handleInputChange('operatingHours', parseFloat(e.target.value))}
                min="0"
                step="10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="laborHours">Labor Hours</Label>
              <Input
                id="laborHours"
                type="number"
                value={formData.laborHours}
                onChange={(e) => handleInputChange('laborHours', parseFloat(e.target.value))}
                min="0"
                step="5"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="seasonalIrrigations">Seasonal Irrigations</Label>
              <Input
                id="seasonalIrrigations"
                type="number"
                value={formData.seasonalIrrigations}
                onChange={(e) => handleInputChange('seasonalIrrigations', parseFloat(e.target.value))}
                min="1"
                step="1"
              />
            </div>

            <Button onClick={calculateCosts} className="w-full">
              Calculate Costs
            </Button>
          </CardContent>
        </Card>

        {costData && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Total Cost Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600">Total Cost</p>
                    <p className="text-3xl font-bold">${costData.totalCost.toFixed(2)}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-gray-600">Cost per Hectare</p>
                      <p className="text-xl font-semibold">${costData.costPerHectare.toFixed(2)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-600">Cost per m³</p>
                      <p className="text-xl font-semibold">${costData.costPerCubicMeter.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm text-gray-600">Cost per Irrigation</p>
                    <p className="text-xl font-semibold">${costData.costPerIrrigation.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Cost Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {costBreakdown.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${item.value.toFixed(2)}</p>
                      <p className="text-xs text-gray-600">{item.percentage.toFixed(1)}%</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {costData && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Cost Breakdown</TabsTrigger>
            <TabsTrigger value="comparison">Method Comparison</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Cost Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={costBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name} ${percentage.toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {costBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Droplets className="h-4 w-4" />
                    Water Cost
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">${costData.waterCost.toFixed(2)}</p>
                  <p className="text-sm text-gray-600 mt-2">
                    {((costData.waterCost / costData.totalCost) * 100).toFixed(1)}% of total
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Zap className="h-4 w-4" />
                    Energy Cost
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">${costData.energyCost.toFixed(2)}</p>
                  <p className="text-sm text-gray-600 mt-2">
                    {((costData.energyCost / costData.totalCost) * 100).toFixed(1)}% of total
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Users className="h-4 w-4" />
                    Labor Cost
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">${costData.laborCost.toFixed(2)}</p>
                  <p className="text-sm text-gray-600 mt-2">
                    {((costData.laborCost / costData.totalCost) * 100).toFixed(1)}% of total
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Wrench className="h-4 w-4" />
                    Equipment & Maintenance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    ${(costData.equipmentCost + costData.maintenanceCost).toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    {(((costData.equipmentCost + costData.maintenanceCost) / costData.totalCost) * 100).toFixed(1)}%
                    of total
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="comparison" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Irrigation Method Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={methodComparison}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="method" />
                    <YAxis yAxisId="left" label={{ value: 'Cost ($)', angle: -90, position: 'insideLeft' }} />
                    <YAxis yAxisId="right" orientation="right" label={{ value: 'Efficiency (%)', angle: 90, position: 'insideRight' }} />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="cost" fill="#3b82f6" name="Total Cost" />
                    <Bar yAxisId="right" dataKey="efficiency" fill="#10b981" name="Efficiency %" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {bestMethod && (
              <Alert>
                <TrendingUp className="h-4 w-4" />
                <AlertDescription>
                  <strong>Best Option:</strong> {bestMethod.method.toUpperCase()} irrigation method with{' '}
                  {bestMethod.efficiency}% efficiency and ${bestMethod.costPerHectare.toFixed(2)}/hectare cost
                </AlertDescription>
              </Alert>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              {methodComparison.map((method) => (
                <Card key={method.method}>
                  <CardHeader>
                    <CardTitle className="text-lg capitalize">{method.method}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <p className="text-sm text-gray-600">Total Cost</p>
                      <p className="text-2xl font-bold">${method.cost.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Cost per Hectare</p>
                      <p className="text-xl font-semibold">${method.costPerHectare.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Efficiency</p>
                      <p className="text-xl font-semibold">{method.efficiency}%</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Based on your current configuration, here are the recommendations to optimize irrigation costs:
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle>Cost Optimization Recommendations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="border-l-4 border-blue-500 pl-4 py-2">
                    <h4 className="font-semibold">Water Source Optimization</h4>
                    <p className="text-sm text-gray-600">
                      Tank water source is most economical at $0.05/1000L. Consider rainwater harvesting to reduce
                      costs.
                    </p>
                  </div>

                  <div className="border-l-4 border-green-500 pl-4 py-2">
                    <h4 className="font-semibold">Irrigation Method</h4>
                    <p className="text-sm text-gray-600">
                      Drip irrigation offers 90% efficiency. Switching from flood (60%) could save up to 30% on water
                      costs.
                    </p>
                  </div>

                  <div className="border-l-4 border-yellow-500 pl-4 py-2">
                    <h4 className="font-semibold">Energy Efficiency</h4>
                    <p className="text-sm text-gray-600">
                      Consider solar pumps to reduce electricity costs. Solar pumps have higher upfront costs but zero
                      operating costs.
                    </p>
                  </div>

                  <div className="border-l-4 border-purple-500 pl-4 py-2">
                    <h4 className="font-semibold">Equipment Maintenance</h4>
                    <p className="text-sm text-gray-600">
                      Regular maintenance can prevent costly repairs. Budget 8-10% of equipment cost annually for
                      maintenance.
                    </p>
                  </div>

                  <div className="border-l-4 border-red-500 pl-4 py-2">
                    <h4 className="font-semibold">Labor Optimization</h4>
                    <p className="text-sm text-gray-600">
                      Automate irrigation scheduling to reduce labor hours. Smart controllers can reduce labor by 40-50%.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>ROI Analysis for System Upgrade</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Current Annual Cost</p>
                    <p className="text-2xl font-bold">${(costData.costPerIrrigation * formData.seasonalIrrigations).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Potential Savings (30%)</p>
                    <p className="text-2xl font-bold text-green-600">
                      ${((costData.costPerIrrigation * formData.seasonalIrrigations * 0.3)).toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 p-4 bg-green-50 rounded-lg">
                  <p className="text-sm font-semibold text-green-900">Payback Period for Drip System Upgrade</p>
                  <p className="text-3xl font-bold text-green-700 mt-2">
                    {(1200 / ((costData.costPerIrrigation * formData.seasonalIrrigations * 0.3))).toFixed(1)} years
                  </p>
                  <p className="text-xs text-green-700 mt-2">Based on $1,200 upgrade cost and 30% savings</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
