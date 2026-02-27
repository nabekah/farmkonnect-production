import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Leaf,
  Target,
  AlertCircle,
  Download,
  Calendar,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Mock data
const YIELD_DATA = [
  { month: 'Jan', tomato: 450, pepper: 320, maize: 280 },
  { month: 'Feb', tomato: 520, pepper: 380, maize: 320 },
  { month: 'Mar', tomato: 480, pepper: 350, maize: 290 },
  { month: 'Apr', tomato: 650, pepper: 420, maize: 380 },
  { month: 'May', tomato: 720, pepper: 480, maize: 420 },
  { month: 'Jun', tomato: 680, pepper: 450, maize: 400 },
];

const ROI_DATA = [
  { name: 'Tomato', value: 45, color: '#ef4444' },
  { name: 'Pepper', value: 32, color: '#f97316' },
  { name: 'Maize', value: 23, color: '#eab308' },
];

const COST_BREAKDOWN = [
  { category: 'Seeds', amount: 15000, percentage: 25 },
  { category: 'Fertilizer', amount: 18000, percentage: 30 },
  { category: 'Labor', amount: 12000, percentage: 20 },
  { category: 'Equipment', amount: 10000, percentage: 17 },
  { category: 'Other', amount: 5000, percentage: 8 },
];

const CROP_PERFORMANCE = [
  {
    crop: 'Tomato',
    planted: 2,
    harvested: 1.8,
    expectedYield: 2.2,
    actualYield: 1.95,
    roi: 45,
    status: 'excellent',
  },
  {
    crop: 'Pepper',
    planted: 1.5,
    harvested: 1.2,
    expectedYield: 1.6,
    actualYield: 1.35,
    roi: 32,
    status: 'good',
  },
  {
    crop: 'Maize',
    planted: 3,
    harvested: 2.4,
    expectedYield: 3.2,
    actualYield: 2.7,
    roi: 23,
    status: 'fair',
  },
];

const MONTHLY_REVENUE = [
  { month: 'Jan', revenue: 45000, expenses: 30000 },
  { month: 'Feb', revenue: 52000, expenses: 32000 },
  { month: 'Mar', revenue: 48000, expenses: 31000 },
  { month: 'Apr', revenue: 68000, expenses: 35000 },
  { month: 'May', revenue: 75000, expenses: 38000 },
  { month: 'Jun', revenue: 72000, expenses: 37000 },
];

const PREDICTIONS = [
  { month: 'Jul', predicted: 78000, confidence: 92 },
  { month: 'Aug', predicted: 82000, confidence: 88 },
  { month: 'Sep', predicted: 75000, confidence: 85 },
];

interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  change?: number;
  icon: React.ReactNode;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, unit, change, icon, color }) => (
  <Card>
    <CardContent className="pt-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold mt-2">
            {value}
            {unit && <span className="text-lg ml-1">{unit}</span>}
          </p>
          {change !== undefined && (
            <div className={`flex items-center mt-2 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change >= 0 ? (
                <TrendingUp className="h-4 w-4 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 mr-1" />
              )}
              <span className="text-sm">{Math.abs(change)}% vs last month</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>{icon}</div>
      </div>
    </CardContent>
  </Card>
);

export default function FarmAnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState('6months');
  const [selectedCrop, setSelectedCrop] = useState('all');

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Farm Analytics Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Comprehensive insights into your farm performance and profitability
          </p>
        </div>
        <Button>
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Time Range Selector */}
      <div className="flex gap-2">
        {['1month', '3months', '6months', '1year'].map((range) => (
          <Button
            key={range}
            variant={timeRange === range ? 'default' : 'outline'}
            onClick={() => setTimeRange(range)}
          >
            {range === '1month' && '1 Month'}
            {range === '3months' && '3 Months'}
            {range === '6months' && '6 Months'}
            {range === '1year' && '1 Year'}
          </Button>
        ))}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value="₦360,000"
          unit=""
          change={12}
          icon={<DollarSign className="h-6 w-6 text-white" />}
          color="bg-green-500"
        />
        <StatCard
          title="Total Expenses"
          value="₦203,000"
          unit=""
          change={-5}
          icon={<AlertCircle className="h-6 w-6 text-white" />}
          color="bg-red-500"
        />
        <StatCard
          title="Net Profit"
          value="₦157,000"
          unit=""
          change={18}
          icon={<TrendingUp className="h-6 w-6 text-white" />}
          color="bg-blue-500"
        />
        <StatCard
          title="Average ROI"
          value="33.4"
          unit="%"
          change={8}
          icon={<Target className="h-6 w-6 text-white" />}
          color="bg-purple-500"
        />
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="crops">Crop Performance</TabsTrigger>
          <TabsTrigger value="costs">Cost Analysis</TabsTrigger>
          <TabsTrigger value="forecast">Forecast</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Yield Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Yield Trends (Tons)</CardTitle>
                <CardDescription>6-month yield comparison by crop</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={YIELD_DATA}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="tomato" stroke="#ef4444" />
                    <Line type="monotone" dataKey="pepper" stroke="#f97316" />
                    <Line type="monotone" dataKey="maize" stroke="#eab308" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Revenue vs Expenses */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue vs Expenses</CardTitle>
                <CardDescription>Monthly financial performance</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={MONTHLY_REVENUE}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="revenue" fill="#10b981" />
                    <Bar dataKey="expenses" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* ROI by Crop */}
          <Card>
            <CardHeader>
              <CardTitle>ROI Distribution by Crop</CardTitle>
              <CardDescription>Return on investment percentage</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={ROI_DATA}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {ROI_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value}%`} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Crop Performance Tab */}
        <TabsContent value="crops" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Crop Performance Summary</CardTitle>
              <CardDescription>Detailed metrics for each crop</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Crop</th>
                      <th className="text-right py-3 px-4">Planted (ha)</th>
                      <th className="text-right py-3 px-4">Harvested (ha)</th>
                      <th className="text-right py-3 px-4">Expected (tons)</th>
                      <th className="text-right py-3 px-4">Actual (tons)</th>
                      <th className="text-right py-3 px-4">ROI</th>
                      <th className="text-left py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {CROP_PERFORMANCE.map((crop) => (
                      <tr key={crop.crop} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-semibold">{crop.crop}</td>
                        <td className="text-right py-3 px-4">{crop.planted}</td>
                        <td className="text-right py-3 px-4">{crop.harvested}</td>
                        <td className="text-right py-3 px-4">{crop.expectedYield}</td>
                        <td className="text-right py-3 px-4">{crop.actualYield}</td>
                        <td className="text-right py-3 px-4 font-semibold text-green-600">
                          {crop.roi}%
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            variant={
                              crop.status === 'excellent'
                                ? 'default'
                                : crop.status === 'good'
                                  ? 'secondary'
                                  : 'outline'
                            }
                          >
                            {crop.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cost Analysis Tab */}
        <TabsContent value="costs" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Cost Breakdown Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Cost Breakdown</CardTitle>
                <CardDescription>Total expenses: ₦60,000</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={COST_BREAKDOWN}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ category, percentage }) => `${category}: ${percentage}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="amount"
                    >
                      {COST_BREAKDOWN.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={['#ef4444', '#f97316', '#eab308', '#3b82f6', '#8b5cf6'][index]}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `₦${value}`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Cost Details */}
            <Card>
              <CardHeader>
                <CardTitle>Cost Details</CardTitle>
                <CardDescription>Expense breakdown by category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {COST_BREAKDOWN.map((cost, index) => (
                    <div key={cost.category} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor: [
                              '#ef4444',
                              '#f97316',
                              '#eab308',
                              '#3b82f6',
                              '#8b5cf6',
                            ][index],
                          }}
                        />
                        <span className="text-sm">{cost.category}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">₦{cost.amount.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">{cost.percentage}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Forecast Tab */}
        <TabsContent value="forecast" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Forecast</CardTitle>
              <CardDescription>AI-powered 3-month revenue prediction</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={[...MONTHLY_REVENUE.slice(-3), ...PREDICTIONS]}
                  margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `₦${value.toLocaleString()}`} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="Historical Revenue"
                  />
                  <Line
                    type="monotone"
                    dataKey="predicted"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Predicted Revenue"
                  />
                </LineChart>
              </ResponsiveContainer>

              {/* Predictions Table */}
              <div className="mt-6">
                <h4 className="font-semibold mb-3">Forecast Details</h4>
                <div className="space-y-2">
                  {PREDICTIONS.map((pred) => (
                    <div
                      key={pred.month}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-semibold">{pred.month}</p>
                        <p className="text-sm text-gray-600">
                          Confidence: {pred.confidence}%
                        </p>
                      </div>
                      <p className="text-lg font-bold text-blue-600">
                        ₦{pred.predicted.toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Recommendations */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-900">AI Recommendations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-blue-800">
            ✓ Your tomato yield is 11% above average. Consider expanding tomato cultivation.
          </p>
          <p className="text-sm text-blue-800">
            ✓ Fertilizer costs are 15% higher than optimal. Review supplier options.
          </p>
          <p className="text-sm text-blue-800">
            ✓ Predicted revenue for July: ₦78,000 (92% confidence). Plan accordingly.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
