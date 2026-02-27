import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle2, Clock, DollarSign, Zap, Droplet } from "lucide-react";

interface FarmMetrics {
  totalFarms: number;
  totalAcreage: number;
  activeAnimals: number;
  totalCrops: number;
}

interface CropYield {
  cropName: string;
  yield: number;
  target: number;
  unit: string;
  trend: "up" | "down" | "stable";
}

interface LivestockHealth {
  species: string;
  healthy: number;
  sick: number;
  vaccinated: number;
  total: number;
}

interface FinancialSummary {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  topExpenseCategory: string;
}

interface PredictiveInsight {
  id: string;
  title: string;
  description: string;
  severity: "low" | "medium" | "high";
  action: string;
}

export function FarmerDashboard() {
  const [farmMetrics, setFarmMetrics] = useState<FarmMetrics>({
    totalFarms: 3,
    totalAcreage: 250,
    activeAnimals: 450,
    totalCrops: 8,
  });

  const [cropYields, setCropYields] = useState<CropYield[]>([
    { cropName: "Maize", yield: 85, target: 100, unit: "bags/acre", trend: "up" },
    { cropName: "Rice", yield: 72, target: 80, unit: "bags/acre", trend: "down" },
    { cropName: "Cassava", yield: 120, target: 110, unit: "tons/acre", trend: "up" },
    { cropName: "Tomato", yield: 45, target: 50, unit: "tons/acre", trend: "stable" },
  ]);

  const [livestockHealth, setLivestockHealth] = useState<LivestockHealth[]>([
    { species: "Cattle", healthy: 150, sick: 5, vaccinated: 145, total: 155 },
    { species: "Poultry", healthy: 280, sick: 15, vaccinated: 270, total: 295 },
    { species: "Goats", healthy: 85, sick: 3, vaccinated: 82, total: 88 },
  ]);

  const [financialSummary, setFinancialSummary] = useState<FinancialSummary>({
    totalRevenue: 125000,
    totalExpenses: 45000,
    netProfit: 80000,
    profitMargin: 64,
    topExpenseCategory: "Feed & Fertilizer",
  });

  const [predictiveInsights, setPredictiveInsights] = useState<PredictiveInsight[]>([
    {
      id: "1",
      title: "Drought Risk Alert",
      description: "Weather forecast indicates 60% probability of drought in next 30 days",
      severity: "high",
      action: "Prepare irrigation systems and water storage",
    },
    {
      id: "2",
      title: "Disease Outbreak Warning",
      description: "Similar symptoms detected in neighboring farms - Newcastle disease suspected",
      severity: "high",
      action: "Increase biosecurity measures and schedule vet visit",
    },
    {
      id: "3",
      title: "Market Price Opportunity",
      description: "Maize prices expected to rise 15% in next 2 weeks",
      severity: "low",
      action: "Consider delaying harvest to maximize profit",
    },
  ]);

  // Mock revenue trend data
  const revenueTrendData = [
    { month: "Jan", revenue: 8500, expenses: 3200 },
    { month: "Feb", revenue: 9200, expenses: 3500 },
    { month: "Mar", revenue: 11000, expenses: 4000 },
    { month: "Apr", revenue: 10500, expenses: 3800 },
    { month: "May", revenue: 12000, expenses: 4200 },
    { month: "Jun", revenue: 14000, expenses: 4500 },
  ];

  // Mock crop performance data
  const cropPerformanceData = [
    { crop: "Maize", current: 85, target: 100 },
    { crop: "Rice", current: 72, target: 80 },
    { crop: "Cassava", current: 120, target: 110 },
    { crop: "Tomato", current: 45, target: 50 },
  ];

  // Mock livestock distribution
  const livestockDistribution = [
    { name: "Cattle", value: 155, color: "#8b5cf6" },
    { name: "Poultry", value: 295, color: "#ec4899" },
    { name: "Goats", value: 88, color: "#f59e0b" },
  ];

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case "down":
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <Zap className="w-4 h-4 text-gray-600" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Farmer Dashboard</h1>
        <p className="text-gray-600 mt-2">Comprehensive farm performance, analytics, and insights</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Farms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{farmMetrics.totalFarms}</div>
            <p className="text-xs text-gray-600 mt-1">Active farms</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Acreage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{farmMetrics.totalAcreage}</div>
            <p className="text-xs text-gray-600 mt-1">Acres under cultivation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Animals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{farmMetrics.activeAnimals}</div>
            <p className="text-xs text-gray-600 mt-1">Total livestock</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Crop Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{farmMetrics.totalCrops}</div>
            <p className="text-xs text-gray-600 mt-1">Different crops</p>
          </CardContent>
        </Card>
      </div>

      {/* Financial Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Financial Summary</CardTitle>
          <CardDescription>Year-to-date financial performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold">${financialSummary.totalRevenue.toLocaleString()}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Expenses</p>
                <p className="text-2xl font-bold">${financialSummary.totalExpenses.toLocaleString()}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Net Profit</p>
                <p className="text-2xl font-bold">${financialSummary.netProfit.toLocaleString()}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Zap className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Profit Margin</p>
                <p className="text-2xl font-bold">{financialSummary.profitMargin}%</p>
              </div>
            </div>
          </div>

          {/* Revenue Trend Chart */}
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} name="Revenue" />
              <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} name="Expenses" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Tabs for detailed analytics */}
      <Tabs defaultValue="crops" className="w-full">
        <TabsList>
          <TabsTrigger value="crops">Crop Performance</TabsTrigger>
          <TabsTrigger value="livestock">Livestock Health</TabsTrigger>
          <TabsTrigger value="insights">Predictive Insights</TabsTrigger>
        </TabsList>

        {/* Crop Performance Tab */}
        <TabsContent value="crops">
          <Card>
            <CardHeader>
              <CardTitle>Crop Yield Performance</CardTitle>
              <CardDescription>Current yields vs. targets</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mb-6">
                {cropYields.map((crop) => (
                  <div key={crop.cropName} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-semibold">{crop.cropName}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="w-32 h-2 bg-gray-200 rounded-full">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${(crop.yield / crop.target) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600">
                          {crop.yield}/{crop.target} {crop.unit}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getTrendIcon(crop.trend)}
                      <span className="text-sm font-semibold">{((crop.yield / crop.target) * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Crop Performance Chart */}
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={cropPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="crop" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="current" fill="#3b82f6" name="Current Yield" />
                  <Bar dataKey="target" fill="#10b981" name="Target Yield" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Livestock Health Tab */}
        <TabsContent value="livestock">
          <Card>
            <CardHeader>
              <CardTitle>Livestock Health Status</CardTitle>
              <CardDescription>Health metrics by species</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Livestock Distribution Chart */}
                <div>
                  <h4 className="font-semibold mb-4">Livestock Distribution</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={livestockDistribution} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}`} outerRadius={80} fill="#8884d8" dataKey="value">
                        {livestockDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Health Metrics Table */}
                <div className="space-y-4">
                  {livestockHealth.map((animal) => (
                    <div key={animal.species} className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-3">{animal.species}</h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-gray-600">Healthy</p>
                          <p className="text-lg font-bold text-green-600">{animal.healthy}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Sick</p>
                          <p className="text-lg font-bold text-red-600">{animal.sick}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Vaccinated</p>
                          <p className="text-lg font-bold text-blue-600">{animal.vaccinated}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Total</p>
                          <p className="text-lg font-bold">{animal.total}</p>
                        </div>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <Badge variant="outline" className="bg-green-50">
                          {((animal.healthy / animal.total) * 100).toFixed(0)}% Healthy
                        </Badge>
                        <Badge variant="outline" className="bg-blue-50">
                          {((animal.vaccinated / animal.total) * 100).toFixed(0)}% Vaccinated
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Predictive Insights Tab */}
        <TabsContent value="insights">
          <Card>
            <CardHeader>
              <CardTitle>Predictive Insights & Alerts</CardTitle>
              <CardDescription>AI-powered recommendations and alerts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {predictiveInsights.map((insight) => (
                  <div key={insight.id} className={`border-l-4 p-4 rounded-lg ${getSeverityColor(insight.severity)}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold">{insight.title}</h4>
                        <p className="text-sm mt-1">{insight.description}</p>
                        <div className="mt-3 p-3 bg-white bg-opacity-50 rounded">
                          <p className="text-sm font-medium">Recommended Action:</p>
                          <p className="text-sm mt-1">{insight.action}</p>
                        </div>
                      </div>
                      <Badge className={getSeverityColor(insight.severity)}>{insight.severity}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
