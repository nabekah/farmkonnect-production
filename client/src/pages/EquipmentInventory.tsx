import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Plus, Edit2, Trash2, AlertTriangle, TrendingDown, DollarSign, Wrench } from 'lucide-react';

export default function EquipmentInventory() {
  const { user } = useAuth();
  const [selectedEquipment, setSelectedEquipment] = useState<number>(1);

  const equipmentStats = [
    { label: 'Total Equipment', value: '12', icon: '🚜' },
    { label: 'Active', value: '10', color: 'text-green-600' },
    { label: 'Needs Service', value: '3', color: 'text-orange-600' },
    { label: 'Total Value', value: 'GHS 385,000', color: 'text-blue-600' },
  ];

  const equipmentList = [
    {
      id: 1,
      name: 'John Deere Tractor',
      type: 'Tractor',
      manufacturer: 'John Deere',
      model: '5075E',
      serialNumber: 'JD-2020-001',
      purchaseDate: '2020-05-15',
      purchasePrice: 45000,
      currentValue: 32500,
      status: 'active',
      location: 'Farm A - Equipment Shed',
      utilization: 72,
    },
    {
      id: 2,
      name: 'Kubota Harvester',
      type: 'Harvester',
      manufacturer: 'Kubota',
      model: 'DC95',
      serialNumber: 'KB-2019-045',
      purchaseDate: '2019-08-20',
      purchasePrice: 65000,
      currentValue: 42000,
      status: 'active',
      location: 'Farm B - Equipment Shed',
      utilization: 68,
    },
    {
      id: 3,
      name: 'AGCO Cultivator',
      type: 'Cultivator',
      manufacturer: 'AGCO',
      model: 'MT865',
      serialNumber: 'AG-2021-023',
      purchaseDate: '2021-03-10',
      purchasePrice: 28000,
      currentValue: 24500,
      status: 'maintenance',
      location: 'Farm C - Equipment Shed',
      utilization: 45,
    },
  ];

  const depreciationData = [
    { year: 2020, value: 45000 },
    { year: 2021, value: 40950 },
    { year: 2022, value: 36900 },
    { year: 2023, value: 32850 },
    { year: 2024, value: 28800 },
    { year: 2025, value: 24750 },
    { year: 2026, value: 32500 },
  ];

  const equipmentByType = [
    { name: 'Tractors', value: 3 },
    { name: 'Harvesters', value: 2 },
    { name: 'Cultivators', value: 4 },
    { name: 'Other', value: 3 },
  ];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  const maintenanceSchedule = [
    { equipment: 'John Deere Tractor', type: 'Oil Change', dueDate: '2026-02-12', priority: 'high' },
    { equipment: 'Kubota Harvester', type: 'Inspection', dueDate: '2026-02-04', priority: 'critical' },
    { equipment: 'AGCO Cultivator', type: 'Belt Replacement', dueDate: '2026-02-20', priority: 'medium' },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Equipment Inventory</h1>
          <p className="text-gray-600">Manage farm equipment, maintenance, and depreciation</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Add Equipment
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {equipmentStats.map((stat, idx) => (
          <Card key={idx}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stat.color || ''}`}>{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="inventory" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="depreciation">Depreciation</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="efficiency">Efficiency</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        {/* Inventory Tab */}
        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Equipment List</CardTitle>
              <CardDescription>All farm equipment with current status and value</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {equipmentList.map((equipment) => (
                  <div
                    key={equipment.id}
                    onClick={() => setSelectedEquipment(equipment.id)}
                    className={`p-4 border rounded-lg cursor-pointer transition ${
                      selectedEquipment === equipment.id ? 'bg-blue-50 border-blue-500' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold">{equipment.name}</h3>
                        <p className="text-sm text-gray-600">{equipment.manufacturer} {equipment.model}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        equipment.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                      }`}>
                        {equipment.status.charAt(0).toUpperCase() + equipment.status.slice(1)}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm mb-3">
                      <div>
                        <p className="text-gray-600">Type</p>
                        <p className="font-medium">{equipment.type}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Purchase Price</p>
                        <p className="font-medium">GHS {equipment.purchasePrice.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Current Value</p>
                        <p className="font-medium">GHS {equipment.currentValue.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Utilization</p>
                        <p className="font-medium">{equipment.utilization}%</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Equipment Details */}
          <Card>
            <CardHeader>
              <CardTitle>Equipment Specifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Serial Number</p>
                  <p className="font-medium">JD-2020-001</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Location</p>
                  <p className="font-medium">Farm A - Equipment Shed</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Horsepower</p>
                  <p className="font-medium">75 HP</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Fuel Capacity</p>
                  <p className="font-medium">90 Liters</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Depreciation Tab */}
        <TabsContent value="depreciation" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Depreciation Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={depreciationData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip formatter={(value) => `GHS ${value.toLocaleString()}`} />
                    <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Equipment by Type</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={equipmentByType}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {equipmentByType.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Depreciation Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  { year: 1, depreciation: 4050, accumulated: 4050, bookValue: 40950 },
                  { year: 2, depreciation: 4050, accumulated: 8100, bookValue: 36900 },
                  { year: 3, depreciation: 4050, accumulated: 12150, bookValue: 32850 },
                ].map((row) => (
                  <div key={row.year} className="flex justify-between p-2 border-b">
                    <span className="font-medium">Year {row.year}</span>
                    <span>Depreciation: GHS {row.depreciation.toLocaleString()}</span>
                    <span>Book Value: GHS {row.bookValue.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Maintenance Tab */}
        <TabsContent value="maintenance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="w-5 h-5" />
                Maintenance Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {maintenanceSchedule.map((item, idx) => (
                  <div key={idx} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">{item.equipment}</p>
                        <p className="text-sm text-gray-600">{item.type}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        item.priority === 'critical' ? 'bg-red-100 text-red-800' :
                        item.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {item.priority.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">Due: {new Date(item.dueDate).toLocaleDateString()}</p>
                  </div>
                ))}
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
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Utilization Rate</p>
                  <p className="text-2xl font-bold text-blue-600">72%</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600">Maintenance Score</p>
                  <p className="text-2xl font-bold text-green-600">85%</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-gray-600">Fuel Efficiency</p>
                  <p className="text-2xl font-bold text-purple-600">2.15 L/h</p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg">
                  <p className="text-sm text-gray-600">Cost per Hour</p>
                  <p className="text-2xl font-bold text-orange-600">GHS 12.50</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Active Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { type: 'Maintenance Due', message: 'Oil change due in 3 days', severity: 'high' },
                { type: 'Inspection Overdue', message: 'Annual inspection overdue by 5 days', severity: 'critical' },
                { type: 'Low Utilization', message: 'Equipment utilization below 50%', severity: 'medium' },
              ].map((alert, idx) => (
                <div key={idx} className="p-3 border rounded-lg flex justify-between items-start">
                  <div>
                    <p className="font-medium">{alert.type}</p>
                    <p className="text-sm text-gray-600">{alert.message}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    alert.severity === 'critical' ? 'bg-red-100 text-red-800' :
                    alert.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {alert.severity.toUpperCase()}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
