import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  Download,
  FileText,
  TrendingUp,
  Calendar,
  Filter,
  Share2,
  PieChart,
  LineChart,
  Settings,
} from "lucide-react";

/**
 * Advanced Reporting Dashboard Component
 * Custom report builder with data export and visual analytics
 */
export const AdvancedReportingDashboard: React.FC = () => {
  const [viewMode, setViewMode] = useState<
    "templates" | "reports" | "analytics" | "export" | "scheduled" | "compare"
  >("templates");
  const [selectedReport, setSelectedReport] = useState<number | null>(null);

  // Mock data
  const templates = [
    {
      id: 1,
      name: "Farm Performance Report",
      description: "Comprehensive farm metrics and KPIs",
      category: "Performance",
    },
    {
      id: 2,
      name: "Financial Summary",
      description: "Income, expenses, and profit analysis",
      category: "Finance",
    },
    {
      id: 3,
      name: "Crop Production Report",
      description: "Crop yields and production metrics",
      category: "Production",
    },
    {
      id: 4,
      name: "Equipment Status Report",
      description: "Equipment maintenance and utilization",
      category: "Equipment",
    },
    {
      id: 5,
      name: "Compliance Report",
      description: "Certifications and regulatory compliance",
      category: "Compliance",
    },
  ];

  const reportData = {
    summary: {
      totalRevenue: 125000,
      totalExpenses: 45000,
      netProfit: 80000,
      profitMargin: 64,
    },
    monthlyData: [
      { month: "Jan", revenue: 10000, expenses: 3500, profit: 6500 },
      { month: "Feb", revenue: 12000, expenses: 4000, profit: 8000 },
      { month: "Mar", revenue: 11500, expenses: 3800, profit: 7700 },
    ],
    cropData: [
      { crop: "Maize", area: 5, yield: 2.5, revenue: 50000 },
      { crop: "Rice", area: 3, yield: 2.0, revenue: 40000 },
      { crop: "Beans", area: 2, yield: 1.8, revenue: 35000 },
    ],
  };

  const insights = [
    {
      title: "Revenue Trend",
      description: "Revenue increased by 15% this quarter",
      impact: "positive",
    },
    {
      title: "Cost Optimization",
      description: "Fertilizer costs can be reduced by 20%",
      impact: "opportunity",
    },
    {
      title: "Yield Improvement",
      description: "Maize yield improved by 12% compared to last year",
      impact: "positive",
    },
  ];

  const savedReports = [
    {
      id: 1,
      name: "Q4 2025 Performance Report",
      type: "Farm Performance",
      createdAt: "2025-12-15",
    },
    {
      id: 2,
      name: "Annual Financial Summary 2025",
      type: "Financial",
      createdAt: "2025-12-20",
    },
    {
      id: 3,
      name: "Crop Production Analysis",
      type: "Production",
      createdAt: "2025-12-10",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Advanced Reporting Dashboard</h1>
            <p className="text-gray-600 mt-1">Create custom reports and analyze farm performance</p>
          </div>
          <BarChart3 className="w-12 h-12 text-blue-600 opacity-20" />
        </div>

        {/* View Mode Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          <Button
            onClick={() => setViewMode("templates")}
            variant={viewMode === "templates" ? "default" : "outline"}
            className={viewMode === "templates" ? "bg-blue-600 text-white" : ""}
          >
            <FileText className="w-4 h-4 mr-2" />
            Templates
          </Button>
          <Button
            onClick={() => setViewMode("reports")}
            variant={viewMode === "reports" ? "default" : "outline"}
            className={viewMode === "reports" ? "bg-blue-600 text-white" : ""}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            My Reports
          </Button>
          <Button
            onClick={() => setViewMode("analytics")}
            variant={viewMode === "analytics" ? "default" : "outline"}
            className={viewMode === "analytics" ? "bg-blue-600 text-white" : ""}
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Analytics
          </Button>
          <Button
            onClick={() => setViewMode("export")}
            variant={viewMode === "export" ? "default" : "outline"}
            className={viewMode === "export" ? "bg-blue-600 text-white" : ""}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button
            onClick={() => setViewMode("scheduled")}
            variant={viewMode === "scheduled" ? "default" : "outline"}
            className={viewMode === "scheduled" ? "bg-blue-600 text-white" : ""}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Scheduled
          </Button>
          <Button
            onClick={() => setViewMode("compare")}
            variant={viewMode === "compare" ? "default" : "outline"}
            className={viewMode === "compare" ? "bg-blue-600 text-white" : ""}
          >
            <Filter className="w-4 h-4 mr-2" />
            Compare
          </Button>
        </div>

        {/* Templates View */}
        {viewMode === "templates" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <Card key={template.id} className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-gray-900">{template.name}</p>
                    <p className="text-sm text-gray-600">{template.description}</p>
                  </div>
                  <FileText className="w-5 h-5 text-blue-600 opacity-50" />
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-sm">Use Template</Button>
                  <Button variant="outline" className="flex-1 text-sm">Preview</Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* My Reports View */}
        {viewMode === "reports" && (
          <div className="space-y-4">
            {savedReports.map((report) => (
              <Card key={report.id} className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-gray-900">{report.name}</p>
                    <p className="text-sm text-gray-600">{report.type}</p>
                    <p className="text-xs text-gray-500 mt-1">Created: {report.createdAt}</p>
                  </div>
                  <BarChart3 className="w-6 h-6 text-blue-600 opacity-50" />
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-sm">View Report</Button>
                  <Button variant="outline" className="flex-1 text-sm">
                    <Download className="w-4 h-4 mr-1" />
                    Export
                  </Button>
                  <Button variant="outline" className="flex-1 text-sm">
                    <Share2 className="w-4 h-4 mr-1" />
                    Share
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Analytics View */}
        {viewMode === "analytics" && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-6 bg-blue-50 border-blue-200">
                <p className="text-gray-600 text-sm">Total Revenue</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">
                  GH₵{(reportData.summary.totalRevenue / 1000).toFixed(1)}K
                </p>
              </Card>
              <Card className="p-6 bg-red-50 border-red-200">
                <p className="text-gray-600 text-sm">Total Expenses</p>
                <p className="text-3xl font-bold text-red-600 mt-2">
                  GH₵{(reportData.summary.totalExpenses / 1000).toFixed(1)}K
                </p>
              </Card>
              <Card className="p-6 bg-green-50 border-green-200">
                <p className="text-gray-600 text-sm">Net Profit</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  GH₵{(reportData.summary.netProfit / 1000).toFixed(1)}K
                </p>
              </Card>
              <Card className="p-6 bg-purple-50 border-purple-200">
                <p className="text-gray-600 text-sm">Profit Margin</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">{reportData.summary.profitMargin}%</p>
              </Card>
            </div>

            {/* Insights */}
            <Card className="p-6">
              <p className="font-bold text-gray-900 mb-4">Key Insights</p>
              <div className="space-y-3">
                {insights.map((insight, idx) => (
                  <div key={idx} className={`p-4 rounded-lg ${insight.impact === "positive" ? "bg-green-50 border border-green-200" : "bg-blue-50 border border-blue-200"}`}>
                    <p className="font-bold text-gray-900">{insight.title}</p>
                    <p className="text-sm text-gray-700 mt-1">{insight.description}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Crop Performance */}
            <Card className="p-6">
              <p className="font-bold text-gray-900 mb-4">Crop Performance</p>
              <div className="space-y-3">
                {reportData.cropData.map((crop, idx) => (
                  <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-bold text-gray-900">{crop.crop}</p>
                      <p className="text-sm font-bold text-blue-600">GH₵{(crop.revenue / 1000).toFixed(1)}K</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-gray-600">Area</p>
                        <p className="font-bold text-gray-900">{crop.area} hectares</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Yield</p>
                        <p className="font-bold text-gray-900">{crop.yield} tons/ha</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Export View */}
        {viewMode === "export" && (
          <div className="space-y-4">
            <Card className="p-6">
              <p className="font-bold text-gray-900 mb-4">Export Report</p>
              <div className="space-y-3">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-gray-900">Export to PDF</p>
                      <p className="text-sm text-gray-600">High-quality PDF format</p>
                    </div>
                    <Button className="bg-red-600 hover:bg-red-700">
                      <Download className="w-4 h-4 mr-2" />
                      Export PDF
                    </Button>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-gray-900">Export to Excel</p>
                      <p className="text-sm text-gray-600">Editable spreadsheet format</p>
                    </div>
                    <Button className="bg-green-600 hover:bg-green-700">
                      <Download className="w-4 h-4 mr-2" />
                      Export Excel
                    </Button>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-gray-900">Export to CSV</p>
                      <p className="text-sm text-gray-600">Data analysis format</p>
                    </div>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <Download className="w-4 h-4 mr-2" />
                      Export CSV
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Scheduled Reports View */}
        {viewMode === "scheduled" && (
          <div className="space-y-4">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="font-bold text-gray-900">Scheduled Reports</p>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule New
                </Button>
              </div>
              <div className="space-y-3">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="font-bold text-gray-900">Monthly Performance Report</p>
                  <p className="text-sm text-gray-600 mt-1">Sent every 1st of the month</p>
                  <p className="text-xs text-gray-500 mt-2">Recipients: manager@farm.com, owner@farm.com</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="font-bold text-gray-900">Weekly Financial Summary</p>
                  <p className="text-sm text-gray-600 mt-1">Sent every Monday at 9:00 AM</p>
                  <p className="text-xs text-gray-500 mt-2">Recipients: accountant@farm.com</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Compare View */}
        {viewMode === "compare" && (
          <div className="space-y-4">
            <Card className="p-6">
              <p className="font-bold text-gray-900 mb-4">Compare Farm Performance</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-2 font-bold">Metric</th>
                      <th className="text-right py-2 px-2 font-bold">Farm A</th>
                      <th className="text-right py-2 px-2 font-bold">Farm B</th>
                      <th className="text-right py-2 px-2 font-bold">Average</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2 px-2">Revenue</td>
                      <td className="text-right py-2 px-2 font-bold text-green-600">GH₵125K</td>
                      <td className="text-right py-2 px-2">GH₵98K</td>
                      <td className="text-right py-2 px-2">GH₵111.5K</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 px-2">Profit Margin</td>
                      <td className="text-right py-2 px-2 font-bold text-green-600">64%</td>
                      <td className="text-right py-2 px-2">58%</td>
                      <td className="text-right py-2 px-2">61%</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-2">Average Yield</td>
                      <td className="text-right py-2 px-2 font-bold text-green-600">2.3 t/ha</td>
                      <td className="text-right py-2 px-2">2.1 t/ha</td>
                      <td className="text-right py-2 px-2">2.2 t/ha</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedReportingDashboard;
