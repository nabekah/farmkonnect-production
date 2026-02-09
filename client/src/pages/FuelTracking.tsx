import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Fuel, TrendingUp, DollarSign, Plus } from 'lucide-react';

export default function FuelTracking() {
  const { user } = useAuth();
  const [selectedEquipment, setSelectedEquipment] = useState<number>(1);

  const fuelStats = [
    { label: 'Total Fuel Used', value: '1,250 L', color: 'text-blue-600' },
    { label: 'Total Fuel Cost', value: 'GHS 1,812.50', color: 'text-green-600' },
    { label: 'Average Efficiency', value: '2.15 L/h', color: 'text-purple-600' },
    { label: 'Cost per Hour', value: 'GHS 12.50', color: 'text-orange-600' },
  ];

  const fuelConsumption = [
    { date: '2026-02-01', diesel: 85, petrol: 0, cost: 123.25, hours: 42, efficiency: 2.02 },
    { date: '2026-01-28', diesel: 92, petrol: 0, cost: 130.64, hours: 45, efficiency: 2.04 },
    { date: '2026-01-25', diesel: 78, petrol: 0, cost: 111.30, hours: 38, efficiency: 2.05 },
    { date: '2026-01-22', diesel: 88, petrol: 0, cost: 125.20, hours: 42, efficiency: 2.10 },
  ];

  const monthlyTrend = [
    { month: 'Jan', consumption: 450, cost: 652.5 },
    { month: 'Feb', consumption: 380, cost: 551 },
    { month: 'Mar', consumption: 520, cost: 754 },
    { month: 'Apr', consumption: 410, cost: 594.5 },
    { month: 'May', consumption: 480, cost: 696 },
    { month: 'Jun', consumption: 390, cost: 565.5 },
  ];

  const costAllocation = [
    { crop: 'Maize', percentage: 60, cost: 1087.50 },
    { crop: 'Rice', percentage: 25, cost: 453.13 },
    { crop: 'Livestock Feed', percentage: 15, cost: 271.88 },
  ];

  const equipmentList = [
    { id: 1, name: 'John Deere Tractor', type: 'Tractor', fuelType: 'Diesel', consumption: 450 },
    { id: 2, name: 'Kubota Harvester', type: 'Harvester', fuelType: 'Diesel', consumption: 380 },
    { id: 3, name: 'AGCO Cultivator', type: 'Cultivator', fuelType: 'Diesel', consumption: 420 },
  ];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b'];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Fuel Tracking & Cost Allocation</h1>
          <p className="text-gray-600">Monitor fuel consumption and allocate costs to crops/animals</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Record Fuel
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {fuelStats.map((stat, idx) => (
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
      <Tabs defaultValue="consumption" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="consumption">Consumption</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="allocation">Allocation</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
        </TabsList>

        {/* Consumption Tab */}
        <TabsContent value="consumption" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Fuel className="w-5 h-5" />
                Recent Fuel Records
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {fuelConsumption.map((record, idx) => (
                  <div key={idx} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-semibold">{new Date(record.date).toLocaleDateString()}</p>
                        <p className="text-sm text-gray-600">John Deere Tractor</p>
                      </div>
                      <span className="text-lg font-bold text-blue-600">{record.diesel}L</span>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Fuel Type</p>
                        <p className="font-medium">Diesel</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Cost</p>
                        <p className="font-medium">GHS {record.cost.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Operating Hours</p>
                        <p className="font-medium">{record.hours}h</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Efficiency</p>
                        <p className="font-medium">{record.efficiency} L/h</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Equipment Fuel Consumption</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {equipmentList.map((equipment) => (
                  <button
                    key={equipment.id}
                    onClick={() => setSelectedEquipment(equipment.id)}
                    className={`w-full text-left p-3 border rounded-lg transition ${
                      selectedEquipment === equipment.id ? 'bg-blue-50 border-blue-500' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{equipment.name}</p>
                        <p className="text-sm text-gray-600">{equipment.type} • {equipment.fuelType}</p>
                      </div>
                      <span className="text-lg font-bold text-blue-600">{equipment.consumption}L</span>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Fuel Consumption Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="consumption" stroke="#3b82f6" name="Consumption (L)" />
                  <Line yAxisId="right" type="monotone" dataKey="cost" stroke="#10b981" name="Cost (GHS)" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Fuel Efficiency Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="consumption" fill="#3b82f6" name="Consumption (L)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Allocation Tab */}
        <TabsContent value="allocation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cost Allocation by Crop</CardTitle>
              <CardDescription>Fuel costs allocated to different crops and activities</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={costAllocation}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ crop, percentage }) => `${crop}: ${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="cost"
                  >
                    {costAllocation.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `GHS ${value.toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>

              <div className="space-y-2">
                {costAllocation.map((item, idx) => (
                  <div key={idx} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">{item.crop}</span>
                      <span className="text-lg font-bold">{item.percentage}%</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 mr-3">
                        <div
                          className={`h-2 rounded-full`}
                          style={{
                            width: `${item.percentage}%`,
                            backgroundColor: COLORS[idx % COLORS.length],
                          }}
                        />
                      </div>
                      <span className="text-gray-600">GHS {item.cost.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Allocation Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between p-3 border-b">
                  <span>Total Fuel Cost</span>
                  <span className="font-bold">GHS 1,812.50</span>
                </div>
                <div className="flex justify-between p-3 border-b">
                  <span>Allocated to Crops</span>
                  <span className="font-bold text-green-600">GHS 1,540.63</span>
                </div>
                <div className="flex justify-between p-3">
                  <span>Unallocated</span>
                  <span className="font-bold text-orange-600">GHS 271.88</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analysis Tab */}
        <TabsContent value="analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Fuel Efficiency Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Average Consumption</p>
                  <p className="text-2xl font-bold text-blue-600">2.15 L/hour</p>
                  <p className="text-xs text-gray-600 mt-1">Across all equipment</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600">Best Performer</p>
                  <p className="text-2xl font-bold text-green-600">1.85 L/h</p>
                  <p className="text-xs text-gray-600 mt-1">AGCO Cultivator</p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg">
                  <p className="text-sm text-gray-600">Worst Performer</p>
                  <p className="text-2xl font-bold text-orange-600">2.45 L/h</p>
                  <p className="text-xs text-gray-600 mt-1">Kubota Harvester</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-gray-600">Cost per Hour</p>
                  <p className="text-2xl font-bold text-purple-600">GHS 12.50</p>
                  <p className="text-xs text-gray-600 mt-1">Average operating cost</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recommendations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                'Schedule maintenance for Kubota Harvester to improve fuel efficiency',
                'Consider upgrading fuel injection system on John Deere Tractor',
                'Monitor AGCO Cultivator - excellent efficiency, maintain current performance',
                'Implement fuel monitoring system for real-time tracking',
              ].map((rec, idx) => (
                <div key={idx} className="flex items-start gap-2 p-2">
                  <span className="text-green-600 font-bold mt-1">✓</span>
                  <span className="text-sm">{rec}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
