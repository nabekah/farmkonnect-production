import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  AlertCircle,
  CheckCircle,
  BarChart3,
  LineChart as LineChartIcon,
  PieChart,
  Target,
  Zap,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";
import { LineChart, Line, BarChart, Bar, PieChart as PieChartComponent, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

/**
 * Financial Forecasting & Predictive Analytics Dashboard
 * Provides cash flow projections, expense forecasts, and revenue predictions
 */
export const FinancialForecastingDashboard: React.FC = () => {
  const [forecastPeriod, setForecastPeriod] = useState<"3months" | "6months" | "12months">("6months");
  const [selectedMetric, setSelectedMetric] = useState<"cashflow" | "expenses" | "revenue" | "profit">("cashflow");

  // Mock forecast data for 6 months
  const cashFlowForecast = [
    { month: "Feb 2026", projected: 45000, actual: 42000, confidence: 95 },
    { month: "Mar 2026", projected: 48000, actual: null, confidence: 92 },
    { month: "Apr 2026", projected: 52000, actual: null, confidence: 88 },
    { month: "May 2026", projected: 55000, actual: null, confidence: 85 },
    { month: "Jun 2026", projected: 58000, actual: null, confidence: 82 },
    { month: "Jul 2026", projected: 62000, actual: null, confidence: 78 },
  ];

  const expenseForecast = [
    { month: "Feb 2026", projected: 28000, actual: 26500, category: "Equipment" },
    { month: "Mar 2026", projected: 29500, actual: null, category: "Equipment" },
    { month: "Apr 2026", projected: 31000, actual: null, category: "Equipment" },
    { month: "May 2026", projected: 32500, actual: null, category: "Equipment" },
    { month: "Jun 2026", projected: 34000, actual: null, category: "Equipment" },
    { month: "Jul 2026", projected: 35500, actual: null, category: "Equipment" },
  ];

  const revenueForecast = [
    { month: "Feb 2026", projected: 73000, actual: 68500, crop: "Maize" },
    { month: "Mar 2026", projected: 76000, actual: null, crop: "Maize" },
    { month: "Apr 2026", projected: 83000, actual: null, crop: "Tomatoes" },
    { month: "May 2026", projected: 87000, actual: null, crop: "Tomatoes" },
    { month: "Jun 2026", projected: 92000, actual: null, crop: "Mixed" },
    { month: "Jul 2026", projected: 97500, actual: null, crop: "Mixed" },
  ];

  const profitForecast = [
    { month: "Feb 2026", projected: 45000, actual: 42000, status: "on-track" },
    { month: "Mar 2026", projected: 46500, actual: null, status: "on-track" },
    { month: "Apr 2026", projected: 52000, actual: null, status: "on-track" },
    { month: "May 2026", projected: 54500, actual: null, status: "optimistic" },
    { month: "Jun 2026", projected: 58000, actual: null, status: "optimistic" },
    { month: "Jul 2026", projected: 62000, actual: null, status: "optimistic" },
  ];

  // Key metrics
  const metrics = {
    avgMonthlyProfit: 52500,
    projectedAnnualProfit: 630000,
    bestMonth: "July 2026",
    bestMonthProfit: 62000,
    riskFactors: ["Weather volatility", "Input cost inflation", "Market price fluctuation"],
    opportunities: ["Crop diversification", "Equipment efficiency", "Labor optimization"],
  };

  // Scenario analysis
  const scenarios = [
    {
      name: "Optimistic",
      description: "20% higher yields, stable prices",
      annualProfit: 756000,
      probability: 25,
      color: "#10b981",
    },
    {
      name: "Base Case",
      description: "Current trends continue",
      annualProfit: 630000,
      probability: 50,
      color: "#3b82f6",
    },
    {
      name: "Pessimistic",
      description: "10% lower yields, price drop",
      annualProfit: 441000,
      probability: 25,
      color: "#ef4444",
    },
  ];

  const scenarioData = scenarios.map((s) => ({
    name: s.name,
    value: s.probability,
    color: s.color,
  }));

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Financial Forecasting & Analytics</h1>
        <div className="flex gap-2">
          <Button
            variant={forecastPeriod === "3months" ? "default" : "outline"}
            size="sm"
            onClick={() => setForecastPeriod("3months")}
          >
            3 Months
          </Button>
          <Button
            variant={forecastPeriod === "6months" ? "default" : "outline"}
            size="sm"
            onClick={() => setForecastPeriod("6months")}
          >
            6 Months
          </Button>
          <Button
            variant={forecastPeriod === "12months" ? "default" : "outline"}
            size="sm"
            onClick={() => setForecastPeriod("12months")}
          >
            12 Months
          </Button>
        </div>
      </div>

      {/* Key Forecast Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Avg Monthly Profit</p>
              <p className="text-2xl font-bold">₵{metrics.avgMonthlyProfit.toLocaleString()}</p>
              <p className="text-green-600 text-sm flex items-center mt-2">
                <TrendingUp className="w-4 h-4 mr-1" />
                +8% from last month
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Projected Annual Profit</p>
              <p className="text-2xl font-bold">₵{metrics.projectedAnnualProfit.toLocaleString()}</p>
              <p className="text-blue-600 text-sm flex items-center mt-2">
                <Target className="w-4 h-4 mr-1" />
                On track
              </p>
            </div>
            <BarChart3 className="w-8 h-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Best Forecast Month</p>
              <p className="text-2xl font-bold">₵{metrics.bestMonthProfit.toLocaleString()}</p>
              <p className="text-purple-600 text-sm flex items-center mt-2">
                <Calendar className="w-4 h-4 mr-1" />
                {metrics.bestMonth}
              </p>
            </div>
            <LineChartIcon className="w-8 h-8 text-purple-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Forecast Confidence</p>
              <p className="text-2xl font-bold">92%</p>
              <p className="text-orange-600 text-sm flex items-center mt-2">
                <Zap className="w-4 h-4 mr-1" />
                High accuracy
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-orange-600" />
          </div>
        </Card>
      </div>

      {/* Forecast Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cash Flow Forecast */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Cash Flow Projection</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={cashFlowForecast}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip
                formatter={(value) => `₵${value.toLocaleString()}`}
                labelFormatter={(label) => `${label}`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="actual"
                stroke="#10b981"
                strokeWidth={2}
                name="Actual"
                dot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="projected"
                stroke="#3b82f6"
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Projected"
                dot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Expense Forecast */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Expense Forecast</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={expenseForecast}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => `₵${value.toLocaleString()}`} />
              <Legend />
              <Bar dataKey="actual" fill="#ef4444" name="Actual" />
              <Bar dataKey="projected" fill="#fbbf24" name="Projected" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Revenue Forecast */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Revenue Forecast</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueForecast}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => `₵${value.toLocaleString()}`} />
              <Legend />
              <Line
                type="monotone"
                dataKey="actual"
                stroke="#8b5cf6"
                strokeWidth={2}
                name="Actual"
                dot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="projected"
                stroke="#ec4899"
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Projected"
                dot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Profit Forecast */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Profit Forecast</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={profitForecast}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => `₵${value.toLocaleString()}`} />
              <Legend />
              <Bar dataKey="actual" fill="#10b981" name="Actual" />
              <Bar dataKey="projected" fill="#3b82f6" name="Projected" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Scenario Analysis */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Scenario Analysis</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Scenarios List */}
          <div className="space-y-4">
            {scenarios.map((scenario) => (
              <div
                key={scenario.name}
                className="p-4 border rounded-lg"
                style={{ borderLeftColor: scenario.color, borderLeftWidth: 4 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold">{scenario.name}</h3>
                  <span className="text-sm font-medium" style={{ color: scenario.color }}>
                    {scenario.probability}% probability
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{scenario.description}</p>
                <p className="text-lg font-bold">
                  Annual Profit: ₵{scenario.annualProfit.toLocaleString()}
                </p>
              </div>
            ))}
          </div>

          {/* Scenario Distribution */}
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChartComponent>
                <Pie
                  data={scenarioData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name} (${value}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {scenarioData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
              </PieChartComponent>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>

      {/* Risk & Opportunity Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Factors */}
        <Card className="p-6 border-red-200 bg-red-50">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            Risk Factors
          </h2>
          <div className="space-y-3">
            {metrics.riskFactors.map((risk, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-2 h-2 bg-red-600 rounded-full mt-2"></div>
                <p className="text-sm text-gray-700">{risk}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-red-100 rounded-lg">
            <p className="text-sm font-medium text-red-800">
              Mitigation: Diversify crops, maintain emergency fund, secure crop insurance
            </p>
          </div>
        </Card>

        {/* Opportunities */}
        <Card className="p-6 border-green-200 bg-green-50">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Growth Opportunities
          </h2>
          <div className="space-y-3">
            {metrics.opportunities.map((opportunity, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                <p className="text-sm text-gray-700">{opportunity}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-green-100 rounded-lg">
            <p className="text-sm font-medium text-green-800">
              Potential: Could increase annual profit by 20-30% with strategic investments
            </p>
          </div>
        </Card>
      </div>

      {/* Forecast Confidence Details */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Forecast Confidence by Month</h2>
        <div className="space-y-3">
          {cashFlowForecast.map((month) => (
            <div key={month.month} className="space-y-2">
              <div className="flex justify-between items-center">
                <p className="font-medium">{month.month}</p>
                <span className="text-sm font-bold">{month.confidence}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    month.confidence >= 90
                      ? "bg-green-600"
                      : month.confidence >= 80
                      ? "bg-yellow-600"
                      : "bg-orange-600"
                  }`}
                  style={{ width: `${month.confidence}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* AI Insights */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-blue-600" />
          AI-Powered Insights
        </h2>
        <div className="space-y-3 text-sm text-gray-700">
          <p>
            📈 <strong>Positive Trend:</strong> Your farm shows consistent profit growth over the forecast period, with
            projected 20% increase from current levels.
          </p>
          <p>
            ⚠️ <strong>Attention Needed:</strong> Equipment costs are rising faster than revenue. Consider maintenance
            optimization or equipment upgrades to improve efficiency.
          </p>
          <p>
            💡 <strong>Recommendation:</strong> Diversify crop portfolio to reduce revenue volatility. Tomato cultivation
            shows strong profit potential in Q2.
          </p>
          <p>
            🎯 <strong>Action Item:</strong> Lock in input prices for next 3 months to protect against inflation. Current
            market conditions are favorable for bulk purchasing.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default FinancialForecastingDashboard;
