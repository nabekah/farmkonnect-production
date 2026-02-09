import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';

export default function FinancialForecasting() {
  const [forecastMonths, setForecastMonths] = useState(12);
  const [activeTab, setActiveTab] = useState<'revenue' | 'expenses' | 'profitability' | 'cashflow' | 'recommendations'>('revenue');

  // Mock data for revenue forecast
  const revenueData = [
    { month: '2026-02', revenue: 4500, confidence: 95 },
    { month: '2026-03', revenue: 4800, confidence: 93 },
    { month: '2026-04', revenue: 5200, confidence: 91 },
    { month: '2026-05', revenue: 5800, confidence: 89 },
    { month: '2026-06', revenue: 6200, confidence: 87 },
    { month: '2026-07', revenue: 6500, confidence: 85 },
    { month: '2026-08', revenue: 6300, confidence: 83 },
    { month: '2026-09', revenue: 5800, confidence: 81 },
    { month: '2026-10', revenue: 5200, confidence: 79 },
    { month: '2026-11', revenue: 4800, confidence: 77 },
    { month: '2026-12', revenue: 4500, confidence: 75 }
  ];

  // Mock data for profitability forecast
  const profitabilityData = [
    { month: '2026-02', revenue: 4500, expense: 3200, profit: 1300 },
    { month: '2026-03', revenue: 4800, expense: 3100, profit: 1700 },
    { month: '2026-04', revenue: 5200, expense: 3000, profit: 2200 },
    { month: '2026-05', revenue: 5800, expense: 2900, profit: 2900 },
    { month: '2026-06', revenue: 6200, expense: 2800, profit: 3400 },
    { month: '2026-07', revenue: 6500, expense: 2900, profit: 3600 },
    { month: '2026-08', revenue: 6300, expense: 3000, profit: 3300 },
    { month: '2026-09', revenue: 5800, expense: 3100, profit: 2700 },
    { month: '2026-10', revenue: 5200, expense: 3200, profit: 2000 },
    { month: '2026-11', revenue: 4800, expense: 3300, profit: 1500 },
    { month: '2026-12', revenue: 4500, expense: 3400, profit: 1100 }
  ];

  // Mock data for cash flow
  const cashFlowData = [
    { month: '2026-02', inflow: 4500, outflow: 3200, cumulativeCash: 11300 },
    { month: '2026-03', inflow: 4800, outflow: 3100, cumulativeCash: 13000 },
    { month: '2026-04', inflow: 5200, outflow: 3000, cumulativeCash: 15200 },
    { month: '2026-05', inflow: 5800, outflow: 2900, cumulativeCash: 18100 },
    { month: '2026-06', inflow: 6200, outflow: 2800, cumulativeCash: 21500 }
  ];

  // Budget recommendations
  const recommendations = [
    {
      category: 'Feed Optimization',
      currentBudget: 1200,
      recommendedBudget: 1000,
      savings: 200,
      impact: 'High',
      description: 'Optimize feed sourcing and bulk purchasing to reduce costs by 15-20%'
    },
    {
      category: 'Labor Efficiency',
      currentBudget: 1500,
      recommendedBudget: 1400,
      savings: 100,
      impact: 'Medium',
      description: 'Implement scheduling optimization to reduce overtime expenses'
    },
    {
      category: 'Equipment Maintenance',
      currentBudget: 800,
      recommendedBudget: 900,
      savings: -100,
      impact: 'High',
      description: 'Increase preventive maintenance budget to avoid costly repairs'
    },
    {
      category: 'Utilities',
      currentBudget: 500,
      recommendedBudget: 400,
      savings: 100,
      impact: 'Medium',
      description: 'Upgrade to energy-efficient systems to reduce electricity costs'
    }
  ];

  const totalSavings = recommendations.reduce((sum, r) => sum + r.savings, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Financial Forecasting</h1>
        <p className="text-gray-600 mt-2">Predictive analytics for farm profitability and budget planning</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">GHS 5,450</div>
            <p className="text-xs text-green-600">+8% vs last year</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Monthly Expense</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">GHS 3,100</div>
            <p className="text-xs text-red-600">+5% vs last year</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Monthly Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">GHS 2,350</div>
            <p className="text-xs text-green-600">+12% vs last year</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">43%</div>
            <p className="text-xs text-green-600">Healthy margin</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b overflow-x-auto">
        {['revenue', 'expenses', 'profitability', 'cashflow', 'recommendations'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 font-medium whitespace-nowrap ${
              activeTab === tab ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Revenue Forecast */}
      {activeTab === 'revenue' && (
        <Card>
          <CardHeader>
            <CardTitle>Revenue Forecast (12 Months)</CardTitle>
            <CardDescription>Projected monthly revenue with confidence intervals</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `GHS ${value}`} />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#3b82f6" name="Revenue" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Profitability Forecast */}
      {activeTab === 'profitability' && (
        <Card>
          <CardHeader>
            <CardTitle>Profitability Forecast</CardTitle>
            <CardDescription>Revenue, expenses, and profit projections</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={profitabilityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `GHS ${value}`} />
                <Legend />
                <Area type="monotone" dataKey="revenue" stackId="1" stroke="#10b981" fill="#d1fae5" name="Revenue" />
                <Area type="monotone" dataKey="expense" stackId="1" stroke="#ef4444" fill="#fee2e2" name="Expense" />
                <Area type="monotone" dataKey="profit" stackId="1" stroke="#3b82f6" fill="#dbeafe" name="Profit" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Cash Flow Analysis */}
      {activeTab === 'cashflow' && (
        <Card>
          <CardHeader>
            <CardTitle>Cash Flow Analysis</CardTitle>
            <CardDescription>Cumulative cash position over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={cashFlowData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `GHS ${value}`} />
                <Legend />
                <Bar dataKey="inflow" fill="#10b981" name="Inflow" />
                <Bar dataKey="outflow" fill="#ef4444" name="Outflow" />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium">Current Cash Position: <span className="text-lg font-bold text-blue-600">GHS 21,500</span></p>
              <p className="text-sm text-gray-600 mt-2">Risk Level: <span className="text-green-600 font-semibold">Low</span></p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Budget Recommendations */}
      {activeTab === 'recommendations' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Budget Optimization Recommendations</CardTitle>
              <CardDescription>Potential savings: <span className="text-green-600 font-bold">GHS {totalSavings}</span></CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recommendations.map((rec, idx) => (
                  <div key={idx} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold">{rec.category}</h4>
                        <p className="text-sm text-gray-600">{rec.description}</p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                        rec.impact === 'High' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {rec.impact} Impact
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-3">
                      <div>
                        <p className="text-xs text-gray-600">Current Budget</p>
                        <p className="font-semibold">GHS {rec.currentBudget}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Recommended</p>
                        <p className="font-semibold">GHS {rec.recommendedBudget}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Potential Savings</p>
                        <p className={`font-semibold ${rec.savings > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {rec.savings > 0 ? '+' : ''}GHS {rec.savings}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
