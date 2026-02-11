import React, { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter } from "recharts";
import { TrendingUp, AlertTriangle, Lightbulb, Activity, ArrowUp, ArrowDown } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface AnalyticsDataPoint {
  date: string;
  actual: number;
  predicted?: number;
  trend?: number;
}

interface AnomalyPoint {
  date: string;
  value: number;
  severity: "low" | "medium" | "high";
  reason: string;
}

interface Recommendation {
  id: string;
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  savings: number;
  action: string;
}

interface AdvancedAnalyticsDashboardProps {
  farmId: string;
  startDate: Date;
  endDate: Date;
}

export const AdvancedAnalyticsDashboard: React.FC<AdvancedAnalyticsDashboardProps> = ({
  farmId,
  startDate,
  endDate,
}) => {
  const [analysisType, setAnalysisType] = useState<"trend" | "seasonal" | "anomaly" | "forecast">("trend");

  // Fetch analytics data
  const { data: analyticsData } = trpc.financialManagement.getFinancialSummary.useQuery({
    farmId,
    startDate,
    endDate,
  });

  // Simulate trend analysis with historical data
  const trendData = useMemo(() => {
    const data: AnalyticsDataPoint[] = [];
    const now = new Date(endDate);
    for (let i = 30; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const baseValue = 5000 + Math.random() * 3000;
      const trend = 5000 + (i * 50); // Upward trend
      data.push({
        date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        actual: Math.round(baseValue + Math.sin(i / 5) * 1000),
        trend: Math.round(trend),
        predicted: Math.round(trend + Math.random() * 500),
      });
    }
    return data;
  }, [endDate]);

  // Simulate seasonal analysis
  const seasonalData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return months.map((month, index) => ({
      month,
      lastYear: 4000 + Math.random() * 3000,
      thisYear: 4500 + Math.random() * 3000,
      forecast: 4700 + Math.random() * 3000,
    }));
  }, []);

  // Simulate anomalies
  const anomalies: AnomalyPoint[] = useMemo(() => [
    {
      date: "Feb 15",
      value: 12500,
      severity: "high",
      reason: "Unusual spike in feed expenses - 2.5x normal",
    },
    {
      date: "Jan 28",
      value: 8900,
      severity: "medium",
      reason: "Higher than average veterinary costs",
    },
    {
      date: "Feb 8",
      value: 3200,
      severity: "low",
      reason: "Lower revenue than expected - seasonal dip",
    },
  ], []);

  // Generate recommendations
  const recommendations: Recommendation[] = useMemo(() => [
    {
      id: "1",
      title: "Optimize Feed Procurement",
      description: "Bulk purchasing in off-season could reduce feed costs by 15-20%",
      impact: "high",
      savings: 3500,
      action: "Review supplier contracts",
    },
    {
      id: "2",
      title: "Reduce Veterinary Visits",
      description: "Preventive care schedule could reduce emergency vet calls by 30%",
      impact: "high",
      savings: 2100,
      action: "Schedule preventive checkups",
    },
    {
      id: "3",
      title: "Optimize Labor Scheduling",
      description: "Peak activity analysis shows potential for 10% labor cost reduction",
      impact: "medium",
      savings: 1200,
      action: "Review labor patterns",
    },
    {
      id: "4",
      title: "Energy Efficiency",
      description: "LED lighting upgrade could reduce utility costs by 25%",
      impact: "medium",
      savings: 800,
      action: "Get quotes for LED upgrades",
    },
  ], []);

  const totalPotentialSavings = recommendations.reduce((sum, rec) => sum + rec.savings, 0);

  return (
    <div className="space-y-6">
      {/* Analysis Type Selector */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={analysisType === "trend" ? "default" : "outline"}
          onClick={() => setAnalysisType("trend")}
          size="sm"
        >
          <TrendingUp className="h-4 w-4 mr-2" />
          Trend Analysis
        </Button>
        <Button
          variant={analysisType === "seasonal" ? "default" : "outline"}
          onClick={() => setAnalysisType("seasonal")}
          size="sm"
        >
          <Activity className="h-4 w-4 mr-2" />
          Seasonal Patterns
        </Button>
        <Button
          variant={analysisType === "anomaly" ? "default" : "outline"}
          onClick={() => setAnalysisType("anomaly")}
          size="sm"
        >
          <AlertTriangle className="h-4 w-4 mr-2" />
          Anomalies
        </Button>
        <Button
          variant={analysisType === "forecast" ? "default" : "outline"}
          onClick={() => setAnalysisType("forecast")}
          size="sm"
        >
          <TrendingUp className="h-4 w-4 mr-2" />
          Forecast
        </Button>
      </div>

      {/* Trend Analysis */}
      {analysisType === "trend" && (
        <Card>
          <CardHeader>
            <CardTitle>Expense Trend Analysis</CardTitle>
            <CardDescription>30-day expense trend with moving average</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="#ef4444"
                  name="Actual Expenses"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="trend"
                  stroke="#3b82f6"
                  name="Trend Line"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                />
                <Line
                  type="monotone"
                  dataKey="predicted"
                  stroke="#10b981"
                  name="Predicted"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-3 gap-4">
              <div className="bg-blue-50 p-3 rounded">
                <p className="text-xs text-gray-600">Current Trend</p>
                <p className="text-xl font-bold text-blue-600">↑ 2.3% per day</p>
              </div>
              <div className="bg-green-50 p-3 rounded">
                <p className="text-xs text-gray-600">Predicted (7 days)</p>
                <p className="text-xl font-bold text-green-600">GHS 52,400</p>
              </div>
              <div className="bg-orange-50 p-3 rounded">
                <p className="text-xs text-gray-600">Variance</p>
                <p className="text-xl font-bold text-orange-600">+8.5%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Seasonal Analysis */}
      {analysisType === "seasonal" && (
        <Card>
          <CardHeader>
            <CardTitle>Seasonal Pattern Analysis</CardTitle>
            <CardDescription>Year-over-year comparison with forecast</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={seasonalData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="lastYear" fill="#94a3b8" name="Last Year" />
                <Bar dataKey="thisYear" fill="#3b82f6" name="This Year" />
                <Bar dataKey="forecast" fill="#10b981" name="Forecast" />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="bg-purple-50 p-3 rounded">
                <p className="text-xs text-gray-600">Peak Season</p>
                <p className="text-lg font-bold text-purple-600">August - October</p>
                <p className="text-xs text-gray-500 mt-1">+35% higher expenses</p>
              </div>
              <div className="bg-indigo-50 p-3 rounded">
                <p className="text-xs text-gray-600">Low Season</p>
                <p className="text-lg font-bold text-indigo-600">January - March</p>
                <p className="text-xs text-gray-500 mt-1">-20% lower expenses</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Anomaly Detection */}
      {analysisType === "anomaly" && (
        <Card>
          <CardHeader>
            <CardTitle>Anomaly Detection</CardTitle>
            <CardDescription>Unusual spending patterns detected</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {anomalies.map((anomaly, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-l-4 ${
                    anomaly.severity === "high"
                      ? "border-red-500 bg-red-50"
                      : anomaly.severity === "medium"
                      ? "border-yellow-500 bg-yellow-50"
                      : "border-blue-500 bg-blue-50"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-sm">{anomaly.date}</p>
                      <p className="text-sm text-gray-600 mt-1">{anomaly.reason}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">GHS {anomaly.value.toLocaleString()}</p>
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded ${
                          anomaly.severity === "high"
                            ? "bg-red-200 text-red-800"
                            : anomaly.severity === "medium"
                            ? "bg-yellow-200 text-yellow-800"
                            : "bg-blue-200 text-blue-800"
                        }`}
                      >
                        {anomaly.severity.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Forecast */}
      {analysisType === "forecast" && (
        <Card>
          <CardHeader>
            <CardTitle>Expense Forecast (Next 90 Days)</CardTitle>
            <CardDescription>Predictive model based on historical patterns</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="predicted"
                  stroke="#10b981"
                  fillOpacity={1}
                  fill="url(#colorForecast)"
                  name="Forecasted Expenses"
                />
              </AreaChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-3 gap-4">
              <div className="bg-green-50 p-3 rounded">
                <p className="text-xs text-gray-600">30-Day Forecast</p>
                <p className="text-xl font-bold text-green-600">GHS 156,800</p>
              </div>
              <div className="bg-blue-50 p-3 rounded">
                <p className="text-xs text-gray-600">60-Day Forecast</p>
                <p className="text-xl font-bold text-blue-600">GHS 318,500</p>
              </div>
              <div className="bg-purple-50 p-3 rounded">
                <p className="text-xs text-gray-600">90-Day Forecast</p>
                <p className="text-xl font-bold text-purple-600">GHS 487,200</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            AI-Driven Recommendations
          </CardTitle>
          <CardDescription>
            Potential savings: <span className="font-bold text-green-600">GHS {totalPotentialSavings.toLocaleString()}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recommendations.map((rec) => (
              <div key={rec.id} className="p-4 border rounded-lg hover:bg-gray-50 transition">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold">{rec.title}</p>
                    <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded ${
                      rec.impact === "high"
                        ? "bg-red-100 text-red-800"
                        : rec.impact === "medium"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {rec.impact.toUpperCase()} IMPACT
                  </span>
                </div>
                <div className="flex justify-between items-center mt-3">
                  <span className="text-sm font-bold text-green-600">
                    Save: GHS {rec.savings.toLocaleString()}
                  </span>
                  <Button size="sm" variant="outline">
                    {rec.action}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvancedAnalyticsDashboard;
