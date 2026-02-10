import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from "recharts";
import { TrendingUp, TrendingDown, CheckCircle, AlertCircle } from "lucide-react";

interface PredictionRecord {
  id: string;
  type: "yield" | "disease" | "market";
  cropType?: string;
  predictedValue: number;
  actualValue?: number;
  confidence: number;
  accuracy?: number;
  predictionDate: string;
  recordedDate?: string;
}

interface AccuracyMetrics {
  totalPredictions: number;
  recordedOutcomes: number;
  averageAccuracy: number;
  trend: "improving" | "stable" | "declining";
  accuracyByType: {
    yield: number;
    disease: number;
    market: number;
  };
}

export default function PredictionHistoryComparison() {
  const [timeRange, setTimeRange] = useState<"week" | "month" | "quarter">("month");
  const [selectedType, setSelectedType] = useState<"all" | "yield" | "disease" | "market">("all");

  // Mock data for demonstration
  const predictions: PredictionRecord[] = [
    {
      id: "1",
      type: "yield",
      cropType: "Maize",
      predictedValue: 4.2,
      actualValue: 4.15,
      confidence: 0.85,
      accuracy: 98.8,
      predictionDate: "2026-02-01",
      recordedDate: "2026-02-15",
    },
    {
      id: "2",
      type: "yield",
      cropType: "Wheat",
      predictedValue: 3.5,
      actualValue: 3.2,
      confidence: 0.72,
      accuracy: 91.4,
      predictionDate: "2026-02-01",
      recordedDate: "2026-02-15",
    },
    {
      id: "3",
      type: "market",
      cropType: "Maize",
      predictedValue: 245,
      actualValue: 252,
      confidence: 0.78,
      accuracy: 97.2,
      predictionDate: "2026-02-05",
      recordedDate: "2026-02-10",
    },
    {
      id: "4",
      type: "disease",
      cropType: "Poultry",
      predictedValue: 0.75,
      actualValue: 0.68,
      confidence: 0.65,
      accuracy: 90.7,
      predictionDate: "2026-02-03",
      recordedDate: "2026-02-12",
    },
  ];

  const metrics: AccuracyMetrics = {
    totalPredictions: 24,
    recordedOutcomes: 18,
    averageAccuracy: 94.3,
    trend: "improving",
    accuracyByType: {
      yield: 95.1,
      disease: 88.5,
      market: 96.8,
    },
  };

  const accuracyTrend = [
    { week: "Week 1", accuracy: 88 },
    { week: "Week 2", accuracy: 90 },
    { week: "Week 3", accuracy: 92 },
    { week: "Week 4", accuracy: 94.3 },
  ];

  const predictionVsActual = predictions
    .filter((p) => p.actualValue !== undefined)
    .map((p) => ({
      name: `${p.cropType || p.type}`,
      predicted: p.predictedValue,
      actual: p.actualValue,
      accuracy: p.accuracy,
    }));

  const filteredPredictions = predictions.filter(
    (p) => selectedType === "all" || p.type === selectedType
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Prediction History & Analysis</h1>
        <p className="text-gray-600 mt-1">Track prediction accuracy and model performance over time</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Predictions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{metrics.totalPredictions}</p>
            <p className="text-xs text-gray-500 mt-1">In {timeRange}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Recorded Outcomes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{metrics.recordedOutcomes}</p>
            <p className="text-xs text-gray-500 mt-1">{((metrics.recordedOutcomes / metrics.totalPredictions) * 100).toFixed(0)}% completion</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Average Accuracy</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{metrics.averageAccuracy.toFixed(1)}%</p>
            <div className="flex items-center gap-1 mt-1">
              {metrics.trend === "improving" ? (
                <>
                  <TrendingUp className="w-3 h-3 text-green-600" />
                  <p className="text-xs text-green-600">Improving</p>
                </>
              ) : metrics.trend === "declining" ? (
                <>
                  <TrendingDown className="w-3 h-3 text-red-600" />
                  <p className="text-xs text-red-600">Declining</p>
                </>
              ) : (
                <p className="text-xs text-gray-500">Stable</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Best Performing</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{Math.max(...Object.values(metrics.accuracyByType)).toFixed(1)}%</p>
            <p className="text-xs text-gray-500 mt-1">
              {Object.entries(metrics.accuracyByType).find(([_, v]) => v === Math.max(...Object.values(metrics.accuracyByType)))?.[0] || "N/A"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Accuracy Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Accuracy Trend</CardTitle>
          <CardDescription>Model accuracy over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={accuracyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis domain={[80, 100]} />
                <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="accuracy"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: "#10b981", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Accuracy by Type */}
      <Card>
        <CardHeader>
          <CardTitle>Accuracy by Prediction Type</CardTitle>
          <CardDescription>Performance comparison across different prediction types</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { type: "Yield", accuracy: metrics.accuracyByType.yield },
                  { type: "Disease", accuracy: metrics.accuracyByType.disease },
                  { type: "Market", accuracy: metrics.accuracyByType.market },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
                <Bar dataKey="accuracy" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Predicted vs Actual Scatter Plot */}
      <Card>
        <CardHeader>
          <CardTitle>Predicted vs Actual Values</CardTitle>
          <CardDescription>Comparison of predicted and actual outcomes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={predictionVsActual}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="predicted" fill="#8b5cf6" name="Predicted" />
                <Bar dataKey="actual" fill="#10b981" name="Actual" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Prediction Records Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Prediction Records</CardTitle>
              <CardDescription>Detailed history of all predictions and outcomes</CardDescription>
            </div>
            <div className="flex gap-2">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as any)}
                className="px-3 py-1 border rounded-md text-sm"
              >
                <option value="all">All Types</option>
                <option value="yield">Yield</option>
                <option value="disease">Disease</option>
                <option value="market">Market</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="text-left py-2 px-4">Type</th>
                  <th className="text-left py-2 px-4">Crop/Product</th>
                  <th className="text-left py-2 px-4">Predicted</th>
                  <th className="text-left py-2 px-4">Actual</th>
                  <th className="text-left py-2 px-4">Accuracy</th>
                  <th className="text-left py-2 px-4">Confidence</th>
                  <th className="text-left py-2 px-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredPredictions.map((pred) => (
                  <tr key={pred.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <Badge variant="outline" className="capitalize">
                        {pred.type}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">{pred.cropType || "N/A"}</td>
                    <td className="py-3 px-4 font-medium">{pred.predictedValue}</td>
                    <td className="py-3 px-4">
                      {pred.actualValue !== undefined ? (
                        <span className="font-medium">{pred.actualValue}</span>
                      ) : (
                        <span className="text-gray-400">Pending</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {pred.accuracy !== undefined ? (
                        <span className="font-medium text-green-600">{pred.accuracy.toFixed(1)}%</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${pred.confidence * 100}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{(pred.confidence * 100).toFixed(0)}%</p>
                    </td>
                    <td className="py-3 px-4">
                      {pred.actualValue !== undefined ? (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          <span>Recorded</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-yellow-600">
                          <AlertCircle className="w-4 h-4" />
                          <span>Pending</span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
