import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingDown, DollarSign, AlertTriangle, CheckCircle } from 'lucide-react';

export default function EquipmentDepreciation() {
  const { user } = useAuth();
  const [selectedEquipment, setSelectedEquipment] = useState<number>(1);

  const depreciationStats = [
    { label: 'Total Equipment Value', value: 'GHS 385,000', color: 'text-blue-600' },
    { label: 'Total Depreciation', value: 'GHS 125,000', color: 'text-red-600' },
    { label: 'Current Book Value', value: 'GHS 260,000', color: 'text-green-600' },
    { label: 'Avg. Depreciation Rate', value: '32.5%', color: 'text-orange-600' },
  ];

  const depreciationData = [
    { year: 2020, value: 45000, depreciation: 0 },
    { year: 2021, value: 40950, depreciation: 4050 },
    { year: 2022, value: 36900, depreciation: 4050 },
    { year: 2023, value: 32850, depreciation: 4050 },
    { year: 2024, value: 28800, depreciation: 4050 },
    { year: 2025, value: 24750, depreciation: 4050 },
    { year: 2026, value: 32500, depreciation: -7750 },
  ];

  const equipmentDepreciation = [
    {
      id: 1,
      name: 'John Deere Tractor',
      purchasePrice: 45000,
      purchaseDate: '2020-05-15',
      usefulLife: 10,
      currentValue: 32500,
      depreciation: 12500,
      depreciationRate: 27.8,
      yearsInUse: 6,
    },
    {
      id: 2,
      name: 'Kubota Harvester',
      purchasePrice: 65000,
      purchaseDate: '2019-08-20',
      usefulLife: 12,
      currentValue: 42000,
      depreciation: 23000,
      depreciationRate: 35.4,
      yearsInUse: 7,
    },
    {
      id: 3,
      name: 'AGCO Cultivator',
      purchasePrice: 28000,
      purchaseDate: '2021-03-10',
      usefulLife: 8,
      currentValue: 24500,
      depreciation: 3500,
      depreciationRate: 12.5,
      yearsInUse: 5,
    },
  ];

  const efficiencyMetrics = [
    {
      equipment: 'John Deere Tractor',
      utilization: 72,
      maintenance: 85,
      fuelEfficiency: 2.15,
      reliability: 90,
      overall: 82,
    },
    {
      equipment: 'Kubota Harvester',
      utilization: 68,
      maintenance: 78,
      fuelEfficiency: 2.45,
      reliability: 85,
      overall: 78,
    },
    {
      equipment: 'AGCO Cultivator',
      utilization: 45,
      maintenance: 92,
      fuelEfficiency: 1.85,
      reliability: 95,
      overall: 83,
    },
  ];

  const taxDepreciation = [
    { year: 1, depreciation: 4500, accumulated: 4500, bookValue: 40500 },
    { year: 2, depreciation: 4500, accumulated: 9000, bookValue: 36000 },
    { year: 3, depreciation: 4500, accumulated: 13500, bookValue: 31500 },
    { year: 4, depreciation: 4500, accumulated: 18000, bookValue: 27000 },
    { year: 5, depreciation: 4500, accumulated: 22500, bookValue: 22500 },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Equipment Depreciation & Efficiency</h1>
          <p className="text-gray-600">Track asset value and equipment performance metrics</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {depreciationStats.map((stat, idx) => (
          <Card key={idx}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="depreciation" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="depreciation">Depreciation</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="efficiency">Efficiency</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        {/* Depreciation Tab */}
        <TabsContent value="depreciation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Equipment Depreciation Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={depreciationData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip formatter={(value) => `GHS ${value.toLocaleString()}`} />
                  <Legend />
                  <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} name="Equipment Value" />
                  <Line type="monotone" dataKey="depreciation" stroke="#ef4444" strokeWidth={2} name="Annual Depreciation" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Equipment Depreciation Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {equipmentDepreciation.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedEquipment(item.id)}
                  className={`p-4 border rounded-lg cursor-pointer transition ${
                    selectedEquipment === item.id ? 'bg-blue-50 border-blue-500' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold">{item.name}</h3>
                      <p className="text-sm text-gray-600">Purchased: {new Date(item.purchaseDate).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">GHS {item.currentValue.toLocaleString()}</p>
                      <p className="text-xs text-gray-600">Current Value</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-5 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Purchase Price</p>
                      <p className="font-medium">GHS {item.purchasePrice.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Total Depreciation</p>
                      <p className="font-medium text-red-600">GHS {item.depreciation.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Depreciation Rate</p>
                      <p className="font-medium">{item.depreciationRate}%</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Useful Life</p>
                      <p className="font-medium">{item.usefulLife} years</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Years in Use</p>
                      <p className="font-medium">{item.yearsInUse} years</p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Depreciation Schedule (Straight-Line Method)</CardTitle>
              <CardDescription>John Deere Tractor - 10 Year Useful Life</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {taxDepreciation.map((row) => (
                  <div key={row.year} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold">Year {row.year}</span>
                      <span className="text-sm text-gray-600">{((row.year / 10) * 100).toFixed(0)}% depreciated</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-red-500 h-2 rounded-full"
                          style={{ width: `${(row.year / 10) * 100}%` }}
                        />
                      </div>
                      <div className="text-right w-48">
                        <p className="text-sm text-gray-600">Annual: GHS {row.depreciation.toLocaleString()}</p>
                        <p className="text-sm text-gray-600">Book Value: GHS {row.bookValue.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tax Implications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Annual Depreciation Deduction</p>
                <p className="text-2xl font-bold text-blue-600">GHS 4,500</p>
                <p className="text-xs text-gray-600 mt-1">Reduces taxable income annually</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">5-Year Cumulative Deduction</p>
                <p className="text-2xl font-bold text-green-600">GHS 22,500</p>
                <p className="text-xs text-gray-600 mt-1">Total tax savings over 5 years</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Efficiency Tab */}
        <TabsContent value="efficiency" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Equipment Efficiency Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {efficiencyMetrics.map((item, idx) => (
                <div key={idx} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-semibold">{item.equipment}</h3>
                    <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                      item.overall >= 85 ? 'bg-green-100 text-green-800' :
                      item.overall >= 75 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      Overall: {item.overall}%
                    </div>
                  </div>
                  <div className="space-y-3">
                    {[
                      { label: 'Utilization Rate', value: item.utilization },
                      { label: 'Maintenance Score', value: item.maintenance },
                      { label: 'Reliability Score', value: item.reliability },
                    ].map((metric) => (
                      <div key={metric.label}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">{metric.label}</span>
                          <span className="text-sm font-medium">{metric.value}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              metric.value >= 80 ? 'bg-green-500' :
                              metric.value >= 60 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${metric.value}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Equipment Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                {
                  equipment: 'John Deere Tractor',
                  recommendation: 'Schedule preventive maintenance to improve reliability from 90% to 95%',
                  priority: 'medium',
                  impact: 'Extend useful life by 2 years',
                },
                {
                  equipment: 'Kubota Harvester',
                  recommendation: 'Consider equipment upgrade in 2-3 years - depreciation rate is 35.4%',
                  priority: 'high',
                  impact: 'Plan capital expenditure',
                },
                {
                  equipment: 'AGCO Cultivator',
                  recommendation: 'Maintain current performance - excellent efficiency and reliability',
                  priority: 'low',
                  impact: 'Continue routine maintenance',
                },
              ].map((item, idx) => (
                <div key={idx} className="p-4 border rounded-lg">
                  <div className="flex items-start gap-3 mb-2">
                    <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-semibold">{item.equipment}</p>
                      <p className="text-sm text-gray-600 mt-1">{item.recommendation}</p>
                      <p className="text-xs text-gray-500 mt-2">Impact: {item.impact}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-semibold flex-shrink-0 ${
                      item.priority === 'high' ? 'bg-red-100 text-red-800' :
                      item.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {item.priority.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Financial Impact Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between p-3 border-b">
                <span>Total Equipment Investment</span>
                <span className="font-bold">GHS 385,000</span>
              </div>
              <div className="flex justify-between p-3 border-b">
                <span>Current Book Value</span>
                <span className="font-bold text-green-600">GHS 260,000</span>
              </div>
              <div className="flex justify-between p-3 border-b">
                <span>Total Depreciation</span>
                <span className="font-bold text-red-600">GHS 125,000</span>
              </div>
              <div className="flex justify-between p-3">
                <span>Estimated Remaining Value (10 years)</span>
                <span className="font-bold text-blue-600">GHS 77,000</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
