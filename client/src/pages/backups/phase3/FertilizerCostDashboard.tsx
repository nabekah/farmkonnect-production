import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, DollarSign, Target, AlertCircle } from 'lucide-react';
import { trpc } from '@/lib/trpc';

export function FertilizerCostDashboard() {
  const [selectedCycle, setSelectedCycle] = useState<number | null>(null);
  const [selectedFertilizer, setSelectedFertilizer] = useState<string>('');

  // Fetch cost analysis
  const costAnalysisMutation = trpc.fertilizerManagement.costAnalysis.analyzeCycleCosts.useMutation();
  const costAnalysis = costAnalysisMutation.data;
  const costLoading = costAnalysisMutation.isPending;
  
  const handleAnalyzeCosts = () => {
    if (selectedCycle) {
      costAnalysisMutation.mutate({ cycleId: selectedCycle });
    }
  };

  // Fetch cost trend
  const { data: costTrend, isLoading: trendLoading } = trpc.fertilizerManagement.costAnalysis.getCostTrend.useQuery(
    { fertilizerType: selectedFertilizer, days: 90 },
    { enabled: !!selectedFertilizer }
  );

  // Fetch fertilizer comparison
  const { data: fertilizerComparison } = trpc.fertilizerManagement.costAnalysis.compareFertilizerCosts.useQuery();

  const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Fertilizer Cost Dashboard</h1>
          <p className="text-gray-600">Analyze costs, trends, and ROI for your fertilizer applications</p>
        </div>
      </div>

      {/* Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Select Crop Cycle</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedCycle?.toString() || ''} onValueChange={(val) => setSelectedCycle(parseInt(val))}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a crop cycle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Cycle 1 - 2024</SelectItem>
                <SelectItem value="2">Cycle 2 - 2024</SelectItem>
                <SelectItem value="3">Cycle 3 - 2024</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Select Fertilizer Type</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedFertilizer} onValueChange={setSelectedFertilizer}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a fertilizer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Urea">Urea (46-0-0)</SelectItem>
                <SelectItem value="DAP">DAP (18-46-0)</SelectItem>
                <SelectItem value="NPK">NPK (10-10-10)</SelectItem>
                <SelectItem value="Potassium">Potassium Chloride</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      {/* Key Metrics */}
      {costAnalysis && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Total Cost Spent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${costAnalysis.totalCostSpent.toFixed(2)}</div>
              <p className="text-xs text-gray-500 mt-1">For this crop cycle</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Target className="w-4 h-4" />
                Cost per Hectare
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${costAnalysis.costPerHectare.toFixed(2)}</div>
              <p className="text-xs text-gray-500 mt-1">Average cost</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                ROI Percentage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${(costAnalysis.roiPercentage || 0) > 100 ? 'text-green-600' : 'text-red-600'}`}>
                {(costAnalysis.roiPercentage || 0).toFixed(1)}%
              </div>
              <p className="text-xs text-gray-500 mt-1">Return on investment</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Most Expensive
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{costAnalysis.mostExpensiveType}</div>
              <p className="text-xs text-gray-500 mt-1">Fertilizer type</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Cost Breakdown Chart */}
      {costAnalysis && (
        <Card>
          <CardHeader>
            <CardTitle>Cost Breakdown by Fertilizer Type</CardTitle>
            <CardDescription>Distribution of fertilizer costs for this cycle</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={Object.entries(costAnalysis.costBreakdown).map(([name, value]) => ({
                      name,
                      value: typeof value === 'number' ? value : 0,
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: $${value.toFixed(0)}`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {Object.entries(costAnalysis.costBreakdown).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => `$${typeof value === 'number' ? value.toFixed(2) : value}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cost Trend Chart */}
      {costTrend && costTrend.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Cost Trend - {selectedFertilizer}</CardTitle>
            <CardDescription>Cost per kg over the last 90 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={costTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => `$${typeof value === 'number' ? value.toFixed(4) : value}`} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="costPerKg"
                    stroke="#3b82f6"
                    dot={false}
                    name="Cost per kg"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fertilizer Comparison */}
      {fertilizerComparison && (
        <Card>
          <CardHeader>
            <CardTitle>Fertilizer Cost Comparison</CardTitle>
            <CardDescription>Current market prices for different fertilizer types</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={fertilizerComparison.map((item) => ({
                    type: item.type,
                    cost: item.currentCostPerKg,
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip formatter={(value: any) => `$${typeof value === 'number' ? value.toFixed(4) : value}`} />
                  <Bar dataKey="cost" fill="#10b981" name="Cost per kg" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {costAnalysis && costAnalysis.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Cost-Saving Recommendations</CardTitle>
            <CardDescription>Based on your fertilizer usage patterns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {costAnalysis.recommendations.map((rec: string, idx: number) => (
                <div key={idx} className="flex gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-900">{rec}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!costAnalysis && !costLoading && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-gray-500">Select a crop cycle to view cost analysis</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
