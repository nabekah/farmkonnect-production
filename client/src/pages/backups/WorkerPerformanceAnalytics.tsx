import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  Award,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Download,
  Filter,
  Star,
  Clock,
  Users,
} from "lucide-react";

/**
 * Worker Performance Analytics Dashboard Component
 * Displays worker productivity, quality scores, certification compliance, and performance trends
 */
export const WorkerPerformanceAnalytics: React.FC = () => {
  const [selectedWorker, setSelectedWorker] = useState(1);
  const [selectedPeriod, setSelectedPeriod] = useState<"week" | "month" | "quarter" | "year">("month");
  const [viewMode, setViewMode] = useState<"individual" | "team" | "comparison">("individual");

  // Mock worker data
  const workers = [
    { id: 1, name: "John Smith", department: "Field Operations" },
    { id: 2, name: "Sarah Johnson", department: "Equipment Management" },
    { id: 3, name: "Michael Brown", department: "Field Operations" },
  ];

  // Mock individual metrics
  const individualMetrics = {
    tasksCompleted: 45,
    tasksOnTime: 42,
    onTimeRate: 93.3,
    qualityScore: 4.7,
    attendanceRate: 96,
    certificationCompliance: 100,
    productivityIndex: 92,
    safetyIncidents: 0,
  };

  // Mock team data
  const teamMembers = [
    {
      id: 1,
      name: "John Smith",
      tasksCompleted: 45,
      onTimeRate: 93.3,
      qualityScore: 4.7,
      attendanceRate: 96,
      productivityIndex: 92,
    },
    {
      id: 2,
      name: "Sarah Johnson",
      tasksCompleted: 38,
      onTimeRate: 89.5,
      qualityScore: 4.5,
      attendanceRate: 94,
      productivityIndex: 85,
    },
    {
      id: 3,
      name: "Michael Brown",
      tasksCompleted: 52,
      onTimeRate: 96.2,
      qualityScore: 4.8,
      attendanceRate: 98,
      productivityIndex: 95,
    },
  ];

  // Mock quality scores
  const qualityScores = {
    accuracy: 4.8,
    timeliness: 4.6,
    completeness: 4.7,
    safetyCompliance: 4.9,
    customerSatisfaction: 4.5,
    workQuality: 4.8,
  };

  // Mock productivity trends
  const productivityTrends = [
    { date: "Feb 1", score: 85, tasks: 4 },
    { date: "Feb 2", score: 88, tasks: 5 },
    { date: "Feb 3", score: 90, tasks: 6 },
    { date: "Feb 4", score: 92, tasks: 5 },
    { date: "Feb 5", score: 91, tasks: 6 },
    { date: "Feb 6", score: 94, tasks: 7 },
    { date: "Feb 7", score: 92, tasks: 5 },
  ];

  // Mock incentive recommendations
  const incentiveRecommendations = [
    {
      workerId: 3,
      workerName: "Michael Brown",
      reason: "Highest productivity index (95) and perfect on-time rate",
      incentiveType: "bonus",
      amount: 500,
    },
    {
      workerId: 1,
      workerName: "John Smith",
      reason: "Consistent high quality (4.7) and 100% certification compliance",
      incentiveType: "recognition",
      amount: 0,
    },
  ];

  const getScoreColor = (score: number) => {
    if (score >= 4.5) return "text-green-600";
    if (score >= 4.0) return "text-yellow-600";
    return "text-red-600";
  };

  const getMetricColor = (value: number, threshold: number = 90) => {
    if (value >= threshold) return "text-green-600";
    if (value >= threshold - 10) return "text-yellow-600";
    return "text-red-600";
  };

  const exportReport = () => {
    alert(`Performance report exported for ${selectedWorker}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Worker Performance Analytics</h1>
            <p className="text-gray-600 mt-1">Track productivity, quality, and compliance metrics</p>
          </div>
          <Button onClick={exportReport} variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>

        {/* View Mode Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            onClick={() => setViewMode("individual")}
            variant={viewMode === "individual" ? "default" : "outline"}
            className={viewMode === "individual" ? "bg-blue-600 text-white" : ""}
          >
            Individual
          </Button>
          <Button
            onClick={() => setViewMode("team")}
            variant={viewMode === "team" ? "default" : "outline"}
            className={viewMode === "team" ? "bg-blue-600 text-white" : ""}
          >
            <Users className="w-4 h-4 mr-2" />
            Team
          </Button>
          <Button
            onClick={() => setViewMode("comparison")}
            variant={viewMode === "comparison" ? "default" : "outline"}
            className={viewMode === "comparison" ? "bg-blue-600 text-white" : ""}
          >
            Comparison
          </Button>
        </div>

        {/* Individual View */}
        {viewMode === "individual" && (
          <>
            {/* Worker Selection & Period */}
            <div className="flex gap-4 mb-6">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Worker</label>
                <select
                  value={selectedWorker}
                  onChange={(e) => setSelectedWorker(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {workers.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} - {w.department}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Period</label>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="quarter">This Quarter</option>
                  <option value="year">This Year</option>
                </select>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Tasks Completed</p>
                    <p className={`text-3xl font-bold ${getMetricColor(individualMetrics.tasksCompleted, 40)}`}>
                      {individualMetrics.tasksCompleted}
                    </p>
                  </div>
                  <CheckCircle className="w-10 h-10 text-blue-600 opacity-20" />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">On-Time Rate</p>
                    <p className={`text-3xl font-bold ${getMetricColor(individualMetrics.onTimeRate)}`}>
                      {individualMetrics.onTimeRate}%
                    </p>
                  </div>
                  <Clock className="w-10 h-10 text-green-600 opacity-20" />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Quality Score</p>
                    <p className={`text-3xl font-bold ${getScoreColor(individualMetrics.qualityScore)}`}>
                      {individualMetrics.qualityScore}
                    </p>
                  </div>
                  <Star className="w-10 h-10 text-yellow-600 opacity-20" />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Attendance Rate</p>
                    <p className={`text-3xl font-bold ${getMetricColor(individualMetrics.attendanceRate)}`}>
                      {individualMetrics.attendanceRate}%
                    </p>
                  </div>
                  <CheckCircle className="w-10 h-10 text-green-600 opacity-20" />
                </div>
              </Card>
            </div>

            {/* Quality Scores Breakdown */}
            <Card className="p-6 mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Quality Scores Breakdown</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Object.entries(qualityScores).map(([category, score]) => (
                  <div key={category}>
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-gray-700 font-medium capitalize">{category.replace(/([A-Z])/g, " $1")}</p>
                      <p className={`font-bold ${getScoreColor(score)}`}>{score}</p>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${score >= 4.5 ? "bg-green-600" : score >= 4.0 ? "bg-yellow-600" : "bg-red-600"}`}
                        style={{ width: `${(score / 5) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Productivity Trends */}
            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Productivity Trends (Last 7 Days)</h2>
              <div className="space-y-4">
                {productivityTrends.map((trend, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-gray-700 font-medium">{trend.date}</p>
                      <div className="flex gap-2 mt-1">
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          Score: {trend.score}
                        </span>
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                          Tasks: {trend.tasks}
                        </span>
                      </div>
                    </div>
                    <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600"
                        style={{ width: `${(trend.score / 100) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}

        {/* Team View */}
        {viewMode === "team" && (
          <Card className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Team Performance Overview</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Worker Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Tasks</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">On-Time Rate</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Quality</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Attendance</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Productivity</th>
                  </tr>
                </thead>
                <tbody>
                  {teamMembers.map((member) => (
                    <tr key={member.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-900 font-medium">{member.name}</td>
                      <td className="py-3 px-4">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                          {member.tasksCompleted}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-600"
                              style={{ width: `${member.onTimeRate}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">{member.onTimeRate}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`font-bold ${getScoreColor(member.qualityScore)}`}>
                          {member.qualityScore}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm font-medium">{member.attendanceRate}%</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`font-bold ${getMetricColor(member.productivityIndex)}`}>
                          {member.productivityIndex}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Comparison View */}
        {viewMode === "comparison" && (
          <>
            <Card className="p-6 mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Performance vs Team Average</h2>
              <div className="space-y-4">
                {[
                  { label: "Tasks Completed", worker: 45, average: 42 },
                  { label: "On-Time Rate", worker: 93.3, average: 91.5 },
                  { label: "Quality Score", worker: 4.7, average: 4.6 },
                  { label: "Attendance Rate", worker: 96, average: 94 },
                  { label: "Productivity Index", worker: 92, average: 88 },
                ].map((metric) => (
                  <div key={metric.label}>
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-gray-700 font-medium">{metric.label}</p>
                      <div className="flex gap-4">
                        <span className="text-sm">
                          Worker: <span className="font-bold text-blue-600">{metric.worker}</span>
                        </span>
                        <span className="text-sm">
                          Average: <span className="font-bold text-gray-600">{metric.average}</span>
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1 h-3 bg-blue-600 rounded-full" style={{ width: `${(metric.worker / Math.max(metric.worker, metric.average)) * 100}%` }}></div>
                      <div className="flex-1 h-3 bg-gray-400 rounded-full" style={{ width: `${(metric.average / Math.max(metric.worker, metric.average)) * 100}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Incentive Recommendations</h2>
              <div className="space-y-4">
                {incentiveRecommendations.map((rec) => (
                  <div key={rec.workerId} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{rec.workerName}</p>
                        <p className="text-sm text-gray-600 mt-1">{rec.reason}</p>
                      </div>
                      <div className="text-right">
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 mb-2">
                          {rec.incentiveType === "bonus" ? "💰 Bonus" : "🏆 Recognition"}
                        </span>
                        {rec.amount > 0 && (
                          <p className="text-lg font-bold text-green-600">GH₵{rec.amount}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default WorkerPerformanceAnalytics;
