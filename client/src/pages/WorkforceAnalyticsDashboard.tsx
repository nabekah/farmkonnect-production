import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, TrendingUp, Users, DollarSign, BarChart3, Download } from "lucide-react";

export default function WorkforceAnalyticsDashboard() {
  const [selectedTab, setSelectedTab] = useState("overview");

  // Mock analytics data
  const summary = {
    totalWorkers: 45,
    activeWorkers: 42,
    inactiveWorkers: 3,
    avgSalary: 2778,
    avgProductivity: 78,
    turnoverRisk: {
      critical: 2,
      high: 5,
      total: 7,
    },
  };

  const highRiskWorkers = [
    {
      id: 1,
      name: "Kwame Mensah",
      role: "Field Worker",
      riskScore: 92,
      riskLevel: "critical",
      riskFactors: ["New hire (less than 6 months)", "Below average salary for role"],
      recommendation: "Immediate action required: Schedule meeting with worker, review salary",
    },
    {
      id: 2,
      name: "Ama Osei",
      role: "Farm Manager",
      riskScore: 88,
      riskLevel: "critical",
      riskFactors: ["Low attendance rate", "Declining performance trend"],
      recommendation: "Immediate action required: Conduct performance review and engagement meeting",
    },
    {
      id: 3,
      name: "Kofi Boateng",
      role: "Technician",
      riskScore: 72,
      riskLevel: "high",
      riskFactors: ["Below average salary for role"],
      recommendation: "Proactive engagement: Provide career development opportunities",
    },
    {
      id: 4,
      name: "Akosua Addo",
      role: "Worker",
      riskScore: 65,
      riskLevel: "high",
      riskFactors: ["Relatively new (less than 1 year)"],
      recommendation: "Monitor closely: Regular check-ins and performance feedback",
    },
    {
      id: 5,
      name: "Yaw Mensah",
      role: "Driver",
      riskScore: 58,
      riskLevel: "high",
      riskFactors: ["Below average attendance"],
      recommendation: "Monitor closely: Discuss attendance and provide support",
    },
  ];

  const salaryBenchmarks = [
    {
      role: "Manager",
      farmAverage: 3200,
      industryAverage: 3500,
      percentile: 91,
      recommendation: "Salaries are competitive with industry standards",
    },
    {
      role: "Supervisor",
      farmAverage: 2200,
      industryAverage: 2500,
      percentile: 88,
      recommendation: "Salaries are competitive with industry standards",
    },
    {
      role: "Technician",
      farmAverage: 1800,
      industryAverage: 2000,
      percentile: 90,
      recommendation: "Salaries are competitive with industry standards",
    },
    {
      role: "Worker",
      farmAverage: 1300,
      industryAverage: 1500,
      percentile: 87,
      recommendation: "Salaries are competitive with industry standards",
    },
  ];

  const productivityMetrics = [
    { workerId: 1, name: "Kwame Mensah", tasksCompleted: 45, qualityScore: 82, efficiencyScore: 75, trend: "stable" },
    { workerId: 2, name: "Ama Osei", tasksCompleted: 52, qualityScore: 88, efficiencyScore: 85, trend: "improving" },
    { workerId: 3, name: "Kofi Boateng", tasksCompleted: 48, qualityScore: 85, efficiencyScore: 80, trend: "stable" },
    { workerId: 4, name: "Akosua Addo", tasksCompleted: 38, qualityScore: 78, efficiencyScore: 72, trend: "declining" },
    { workerId: 5, name: "Yaw Mensah", tasksCompleted: 42, qualityScore: 80, efficiencyScore: 76, trend: "stable" },
  ];

  const recommendations = [
    {
      priority: "critical",
      category: "Turnover Risk",
      message: "2 workers at critical risk of leaving. Immediate intervention required.",
      action: "Schedule meetings with high-risk workers and review retention strategies",
    },
    {
      priority: "high",
      category: "Turnover Risk",
      message: "5 workers at high risk of leaving.",
      action: "Provide career development opportunities and conduct stay interviews",
    },
    {
      priority: "medium",
      category: "Productivity",
      message: "Average workforce productivity is 78%. Below target of 80%.",
      action: "Implement training programs and performance improvement plans",
    },
  ];

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "improving":
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "declining":
        return <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />;
      default:
        return <TrendingUp className="h-4 w-4 text-gray-600" />;
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-300";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      default:
        return "bg-green-100 text-green-800 border-green-300";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Workforce Analytics</h1>
          <p className="text-gray-600 mt-2">Predictive analytics for turnover, salary benchmarking, and productivity</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Total Workers</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{summary.totalWorkers}</p>
            <p className="text-xs text-gray-600 mt-2">{summary.activeWorkers} active</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Avg Salary</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">GHS {summary.avgSalary}</p>
            <p className="text-xs text-gray-600 mt-2">Per worker</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Avg Productivity</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{summary.avgProductivity}%</p>
            <p className="text-xs text-gray-600 mt-2">Target: 80%</p>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-sm text-red-700 font-semibold">Critical Risk</p>
            <p className="text-2xl font-bold text-red-900 mt-1">{summary.turnoverRisk.critical}</p>
            <p className="text-xs text-red-700 mt-2">Workers at risk</p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <p className="text-sm text-orange-700 font-semibold">High Risk</p>
            <p className="text-2xl font-bold text-orange-900 mt-1">{summary.turnoverRisk.high}</p>
            <p className="text-xs text-orange-700 mt-2">Workers at risk</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {[
          { id: "overview", label: "Overview" },
          { id: "turnover", label: "Turnover Risk" },
          { id: "salary", label: "Salary Benchmarking" },
          { id: "productivity", label: "Productivity" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedTab(tab.id)}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              selectedTab === tab.id
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {selectedTab === "overview" && (
        <div className="space-y-6">
          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>Recommendations</CardTitle>
              <CardDescription>Actionable insights based on workforce analytics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recommendations.map((rec, idx) => (
                <Alert key={idx} className={`border-2 ${getRiskColor(rec.priority)}`}>
                  <AlertTriangle className="h-4 w-4" />
                  <div className="ml-2">
                    <p className="font-semibold">{rec.category}</p>
                    <p className="text-sm mt-1">{rec.message}</p>
                    <p className="text-xs mt-2 italic">Action: {rec.action}</p>
                  </div>
                </Alert>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Turnover Risk Tab */}
      {selectedTab === "turnover" && (
        <Card>
          <CardHeader>
            <CardTitle>Turnover Risk Predictions</CardTitle>
            <CardDescription>Workers ranked by turnover risk score</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {highRiskWorkers.map((worker) => (
                <div key={worker.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-gray-900">{worker.name}</p>
                      <p className="text-sm text-gray-600">{worker.role}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-semibold border ${getRiskColor(worker.riskLevel)}`}>
                      {worker.riskScore}% Risk
                    </div>
                  </div>

                  <div className="mb-3">
                    <p className="text-xs font-semibold text-gray-700 mb-2">Risk Factors:</p>
                    <div className="flex flex-wrap gap-2">
                      {worker.riskFactors.map((factor, idx) => (
                        <span key={idx} className="text-xs bg-gray-200 text-gray-800 px-2 py-1 rounded">
                          {factor}
                        </span>
                      ))}
                    </div>
                  </div>

                  <p className="text-sm text-gray-700 bg-blue-50 p-2 rounded">
                    <span className="font-semibold">Recommendation:</span> {worker.recommendation}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Salary Benchmarking Tab */}
      {selectedTab === "salary" && (
        <Card>
          <CardHeader>
            <CardTitle>Salary Benchmarking</CardTitle>
            <CardDescription>Farm vs industry average salaries by role</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {salaryBenchmarks.map((benchmark, idx) => (
                <div key={idx} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-semibold text-gray-900">{benchmark.role}</p>
                    <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      benchmark.percentile >= 100
                        ? "bg-green-100 text-green-800"
                        : benchmark.percentile >= 90
                        ? "bg-blue-100 text-blue-800"
                        : "bg-orange-100 text-orange-800"
                    }`}>
                      {benchmark.percentile}% of industry
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-gray-600">Farm Average</p>
                      <p className="text-lg font-semibold text-gray-900">GHS {benchmark.farmAverage.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Industry Average</p>
                      <p className="text-lg font-semibold text-gray-900">GHS {benchmark.industryAverage.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${Math.min(benchmark.percentile, 100)}%` }}
                    ></div>
                  </div>

                  <p className="text-sm text-gray-700">{benchmark.recommendation}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Productivity Tab */}
      {selectedTab === "productivity" && (
        <Card>
          <CardHeader>
            <CardTitle>Productivity Metrics</CardTitle>
            <CardDescription>Worker productivity scores and trends</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {productivityMetrics.map((metric) => (
                <div key={metric.workerId} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-semibold text-gray-900">{metric.name}</p>
                      <p className="text-sm text-gray-600">{metric.tasksCompleted} tasks completed</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getTrendIcon(metric.trend)}
                      <span className="text-sm font-semibold text-gray-700 capitalize">{metric.trend}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Quality Score</p>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${metric.qualityScore}%` }}
                        ></div>
                      </div>
                      <p className="text-sm font-semibold text-gray-900 mt-1">{metric.qualityScore}%</p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-600 mb-1">Efficiency Score</p>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${metric.efficiencyScore}%` }}
                        ></div>
                      </div>
                      <p className="text-sm font-semibold text-gray-900 mt-1">{metric.efficiencyScore}%</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
