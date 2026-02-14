'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Area, ScatterChart, Scatter } from 'recharts';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle, DollarSign } from 'lucide-react';

interface BudgetItem {
  category: string;
  budgeted: number;
  actual: number;
  variance: number;
  variancePercent: number;
  status: 'on_track' | 'over' | 'under';
}

interface MonthlyComparison {
  month: string;
  budgetedTotal: number;
  actualTotal: number;
  variance: number;
}

interface CropBudget {
  crop: string;
  budgeted: number;
  actual: number;
  variance: number;
  variancePercent: number;
}

export const BudgetVsActualDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyComparison[]>([]);
  const [cropBudgets, setCropBudgets] = useState<CropBudget[]>([]);

  useEffect(() => {
    // Mock budget data
    setBudgetItems([
      { category: 'Labor', budgeted: 50000, actual: 48500, variance: 1500, variancePercent: 3, status: 'on_track' },
      { category: 'Seeds & Fertilizer', budgeted: 35000, actual: 38200, variance: -3200, variancePercent: -9.1, status: 'over' },
      { category: 'Equipment & Maintenance', budgeted: 30000, actual: 29800, variance: 200, variancePercent: 0.7, status: 'on_track' },
      { category: 'Water & Irrigation', budgeted: 20000, actual: 22500, variance: -2500, variancePercent: -12.5, status: 'over' },
      { category: 'Pesticides & Chemicals', budgeted: 15000, actual: 14200, variance: 800, variancePercent: 5.3, status: 'on_track' },
      { category: 'Transportation', budgeted: 12000, actual: 11800, variance: 200, variancePercent: 1.7, status: 'on_track' },
      { category: 'Storage & Handling', budgeted: 8000, actual: 7500, variance: 500, variancePercent: 6.3, status: 'on_track' },
      { category: 'Other', budgeted: 5000, actual: 4800, variance: 200, variancePercent: 4, status: 'on_track' }
    ]);

    setMonthlyData([
      { month: 'Jan', budgetedTotal: 175000, actualTotal: 172000, variance: 3000 },
      { month: 'Feb', budgetedTotal: 175000, actualTotal: 178500, variance: -3500 },
      { month: 'Mar', budgetedTotal: 175000, actualTotal: 176200, variance: -1200 },
      { month: 'Apr', budgetedTotal: 180000, actualTotal: 185300, variance: -5300 },
      { month: 'May', budgetedTotal: 180000, actualTotal: 179800, variance: 200 },
      { month: 'Jun', budgetedTotal: 185000, actualTotal: 188500, variance: -3500 }
    ]);

    setCropBudgets([
      { crop: 'Corn', budgeted: 120000, actual: 118500, variance: 1500, variancePercent: 1.3 },
      { crop: 'Wheat', budgeted: 90000, actual: 92200, variance: -2200, variancePercent: -2.4 },
      { crop: 'Rice', budgeted: 110000, actual: 108800, variance: 1200, variancePercent: 1.1 },
      { crop: 'Soybean', budgeted: 80000, actual: 83500, variance: -3500, variancePercent: -4.4 },
      { crop: 'Cotton', budgeted: 70000, actual: 68900, variance: 1100, variancePercent: 1.6 }
    ]);
  }, []);

  const totalBudgeted = budgetItems.reduce((sum, item) => sum + item.budgeted, 0);
  const totalActual = budgetItems.reduce((sum, item) => sum + item.actual, 0);
  const totalVariance = totalBudgeted - totalActual;
  const variancePercent = ((totalVariance / totalBudgeted) * 100).toFixed(1);

  const overBudgetItems = budgetItems.filter(item => item.status === 'over').length;
  const onTrackItems = budgetItems.filter(item => item.status === 'on_track').length;

  const comparisonData = budgetItems.map(item => ({
    category: item.category.substring(0, 10),
    budgeted: item.budgeted,
    actual: item.actual
  }));

  const varianceData = budgetItems.map(item => ({
    category: item.category.substring(0, 10),
    variance: item.variance,
    status: item.status
  }));

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Budget vs Actual Analysis</h1>
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="monthly">Monthly</option>
          <option value="quarterly">Quarterly</option>
          <option value="yearly">Yearly</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <DollarSign className="w-4 h-4" /> Total Budgeted
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">${(totalBudgeted / 1000).toFixed(0)}K</p>
            <p className="text-xs text-gray-500 mt-2">All categories</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <DollarSign className="w-4 h-4" /> Total Actual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">${(totalActual / 1000).toFixed(0)}K</p>
            <p className="text-xs text-gray-500 mt-2">Spent to date</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              {totalVariance > 0 ? <TrendingDown className="w-4 h-4 text-green-600" /> : <TrendingUp className="w-4 h-4 text-red-600" />}
              Total Variance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${totalVariance > 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${Math.abs(totalVariance / 1000).toFixed(0)}K
            </p>
            <p className="text-xs text-gray-500 mt-2">{variancePercent}% variance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{onTrackItems}/{budgetItems.length}</p>
            <p className="text-xs text-gray-500 mt-2">{overBudgetItems} over budget</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="crops">By Crop</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Budget vs Actual Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip formatter={(value) => `$${value}`} />
                  <Legend />
                  <Bar dataKey="budgeted" fill="#3b82f6" name="Budgeted" />
                  <Bar dataKey="actual" fill="#ef4444" name="Actual" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Variance Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={varianceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip formatter={(value) => `$${value}`} />
                  <Bar dataKey="variance" fill="#10b981" name="Variance (Positive = Under Budget)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Budget Variance by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {budgetItems.map((item, idx) => (
                  <div key={idx} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-semibold">{item.category}</p>
                        <p className="text-xs text-gray-600">Budgeted: ${(item.budgeted / 1000).toFixed(0)}K | Actual: ${(item.actual / 1000).toFixed(0)}K</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          {item.status === 'on_track' ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-red-600" />
                          )}
                          <span className={`text-lg font-bold ${item.variance > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ${Math.abs(item.variance / 1000).toFixed(1)}K
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">{item.variancePercent > 0 ? '+' : ''}{item.variancePercent}%</p>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${item.variance > 0 ? 'bg-green-500' : 'bg-red-500'}`}
                        style={{ width: `${Math.min((item.actual / item.budgeted) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Budget Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `$${value}`} />
                  <Legend />
                  <Bar dataKey="budgetedTotal" fill="#3b82f6" name="Budgeted" />
                  <Bar dataKey="actualTotal" fill="#ef4444" name="Actual" />
                  <Line type="monotone" dataKey="variance" stroke="#10b981" strokeWidth={2} name="Variance" />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cumulative Variance Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `$${value}`} />
                  <Legend />
                  <Line type="monotone" dataKey="variance" stroke="#10b981" strokeWidth={2} name="Monthly Variance" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="crops" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Budget Analysis by Crop</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={cropBudgets}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="crop" />
                  <YAxis />
                  <Tooltip formatter={(value) => `$${value}`} />
                  <Legend />
                  <Bar dataKey="budgeted" fill="#3b82f6" name="Budgeted" />
                  <Bar dataKey="actual" fill="#ef4444" name="Actual" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Crop Budget Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {cropBudgets.map((crop, idx) => (
                  <div key={idx} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold">{crop.crop}</p>
                      <span className={`text-sm font-bold ${crop.variance > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {crop.variance > 0 ? '+' : ''}{crop.variancePercent}%
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Budget: ${(crop.budgeted / 1000).toFixed(0)}K</span>
                      <span>Actual: ${(crop.actual / 1000).toFixed(0)}K</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${crop.variance > 0 ? 'bg-green-500' : 'bg-red-500'}`}
                        style={{ width: `${Math.min((crop.actual / crop.budgeted) * 100, 100)}%` }}
                      ></div>
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
};

export default BudgetVsActualDashboard;
