import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Beaker,
  CheckCircle,
  Clock,
  TrendingUp,
  MapPin,
  Phone,
  Mail,
  Star,
  AlertCircle,
  Download,
  Plus,
} from "lucide-react";

/**
 * Soil Testing & Lab Integration Component
 * Enable farmers to order soil tests, track results, and integrate with agricultural labs
 */
export const SoilTestingLabIntegration: React.FC = () => {
  const [viewMode, setViewMode] = useState<
    "tests" | "results" | "labs" | "tracking" | "history" | "comparison"
  >("tests");

  // Mock data
  const availableTests = [
    {
      id: 1,
      name: "Basic Soil Analysis",
      parameters: ["pH", "Nitrogen", "Phosphorus", "Potassium"],
      turnaroundDays: 7,
      price: 250,
      description: "Essential nutrients and pH level",
    },
    {
      id: 2,
      name: "Comprehensive Soil Test",
      parameters: [
        "pH",
        "Nitrogen",
        "Phosphorus",
        "Potassium",
        "Calcium",
        "Magnesium",
        "Sulfur",
        "Organic Matter",
      ],
      turnaroundDays: 10,
      price: 450,
      description: "Complete nutrient profile and organic matter",
    },
    {
      id: 3,
      name: "Micronutrient Analysis",
      parameters: ["Iron", "Zinc", "Copper", "Manganese", "Boron"],
      turnaroundDays: 14,
      price: 350,
      description: "Trace elements and micronutrients",
    },
    {
      id: 4,
      name: "Soil Contamination Test",
      parameters: ["Heavy Metals", "Pesticide Residues", "Salinity"],
      turnaroundDays: 21,
      price: 600,
      description: "Safety and contamination screening",
    },
  ];

  const testResults = [
    {
      id: 1,
      testName: "Basic Soil Analysis",
      testDate: "2025-12-15",
      labName: "Ashanti Agricultural Lab",
      status: "completed",
      parameters: {
        pH: { value: 6.5, optimal: "6.0-7.0", status: "good" },
        nitrogen: { value: 45, optimal: "40-60", status: "good" },
        phosphorus: { value: 22, optimal: "20-30", status: "good" },
        potassium: { value: 180, optimal: "150-200", status: "good" },
      },
    },
  ];

  const labs = [
    {
      id: 1,
      name: "Ashanti Agricultural Lab",
      location: "Kumasi",
      phone: "+233 24 123 4567",
      email: "info@ashanti-lab.com",
      certifications: ["ISO 17025", "AOAC"],
      turnaroundDays: 7,
      rating: 4.8,
    },
    {
      id: 2,
      name: "Kumasi Soil Lab",
      location: "Kumasi",
      phone: "+233 24 234 5678",
      email: "contact@kumasi-lab.com",
      certifications: ["ISO 17025"],
      turnaroundDays: 10,
      rating: 4.6,
    },
    {
      id: 3,
      name: "Ghana Agricultural Research Lab",
      location: "Accra",
      phone: "+233 30 345 6789",
      email: "lab@gar.org.gh",
      certifications: ["ISO 17025", "AOAC", "CAC"],
      turnaroundDays: 14,
      rating: 4.9,
    },
  ];

  const trackingData = {
    status: "in_progress",
    progress: 65,
    stages: [
      { name: "Sample Received", completed: true, date: "2025-12-16" },
      { name: "Sample Preparation", completed: true, date: "2025-12-17" },
      { name: "Analysis", completed: true, date: "2025-12-18" },
      { name: "Quality Check", completed: false, date: null },
      { name: "Report Generation", completed: false, date: null },
    ],
    expectedCompletion: "2025-12-22",
  };

  const history = [
    {
      date: "2025-12-15",
      fieldName: "North Field",
      testType: "Basic",
      status: "completed",
      labName: "Ashanti Agricultural Lab",
    },
    {
      date: "2025-11-20",
      fieldName: "South Field",
      testType: "Comprehensive",
      status: "completed",
      labName: "Kumasi Soil Lab",
    },
    {
      date: "2025-10-10",
      fieldName: "East Field",
      testType: "Micronutrient",
      status: "completed",
      labName: "Ashanti Agricultural Lab",
    },
  ];

  const comparisonData = [
    {
      date: "2024-09-01",
      nitrogen: 35,
      phosphorus: 15,
      potassium: 140,
      organicMatter: 2.5,
    },
    {
      date: "2024-12-15",
      nitrogen: 42,
      phosphorus: 18,
      potassium: 160,
      organicMatter: 2.8,
    },
    {
      date: "2025-09-10",
      nitrogen: 45,
      phosphorus: 22,
      potassium: 180,
      organicMatter: 3.2,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Soil Testing & Lab Integration</h1>
            <p className="text-gray-600 mt-1">Order tests, track results, and get recommendations</p>
          </div>
          <Beaker className="w-12 h-12 text-blue-600 opacity-20" />
        </div>

        {/* View Mode Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          <Button
            onClick={() => setViewMode("tests")}
            variant={viewMode === "tests" ? "default" : "outline"}
            className={viewMode === "tests" ? "bg-blue-600 text-white" : ""}
          >
            <Plus className="w-4 h-4 mr-2" />
            Order Tests
          </Button>
          <Button
            onClick={() => setViewMode("results")}
            variant={viewMode === "results" ? "default" : "outline"}
            className={viewMode === "results" ? "bg-blue-600 text-white" : ""}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Results
          </Button>
          <Button
            onClick={() => setViewMode("labs")}
            variant={viewMode === "labs" ? "default" : "outline"}
            className={viewMode === "labs" ? "bg-blue-600 text-white" : ""}
          >
            <MapPin className="w-4 h-4 mr-2" />
            Labs
          </Button>
          <Button
            onClick={() => setViewMode("tracking")}
            variant={viewMode === "tracking" ? "default" : "outline"}
            className={viewMode === "tracking" ? "bg-blue-600 text-white" : ""}
          >
            <Clock className="w-4 h-4 mr-2" />
            Tracking
          </Button>
          <Button
            onClick={() => setViewMode("history")}
            variant={viewMode === "history" ? "default" : "outline"}
            className={viewMode === "history" ? "bg-blue-600 text-white" : ""}
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            History
          </Button>
          <Button
            onClick={() => setViewMode("comparison")}
            variant={viewMode === "comparison" ? "default" : "outline"}
            className={viewMode === "comparison" ? "bg-blue-600 text-white" : ""}
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Trends
          </Button>
        </div>

        {/* Order Tests View */}
        {viewMode === "tests" && (
          <div className="space-y-4">
            {availableTests.map((test) => (
              <Card key={test.id} className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-gray-900">{test.name}</p>
                    <p className="text-sm text-gray-600 mt-1">{test.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">GH₵{test.price}</p>
                    <p className="text-xs text-gray-600">{test.turnaroundDays} days</p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm font-bold text-gray-900 mb-2">Parameters:</p>
                  <div className="flex flex-wrap gap-2">
                    {test.parameters.map((param, idx) => (
                      <span key={idx} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                        {param}
                      </span>
                    ))}
                  </div>
                </div>

                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  Order This Test
                </Button>
              </Card>
            ))}
          </div>
        )}

        {/* Results View */}
        {viewMode === "results" && (
          <div className="space-y-4">
            {testResults.map((result) => (
              <Card key={result.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="font-bold text-gray-900">{result.testName}</p>
                    <p className="text-sm text-gray-600">
                      {result.testDate} • {result.labName}
                    </p>
                  </div>
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded text-sm font-bold">
                    {result.status.toUpperCase()}
                  </span>
                </div>

                <div className="space-y-3 mb-4">
                  {Object.entries(result.parameters).map(([key, value]: any) => (
                    <div key={key} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-bold text-gray-900 capitalize">{key}</p>
                        <span
                          className={`text-sm font-bold ${
                            value.status === "good"
                              ? "text-green-600"
                              : value.status === "low"
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}
                        >
                          {value.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Value: {value.value}</span>
                        <span>Optimal: {value.optimal}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <Button className="w-full bg-green-600 hover:bg-green-700">
                  <Download className="w-4 h-4 mr-2" />
                  Download Report
                </Button>
              </Card>
            ))}
          </div>
        )}

        {/* Labs View */}
        {viewMode === "labs" && (
          <div className="space-y-4">
            {labs.map((lab) => (
              <Card key={lab.id} className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-gray-900">{lab.name}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {lab.location}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {lab.turnaroundDays} days
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500" />
                        {lab.rating}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mb-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-gray-600" />
                    {lab.phone}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-gray-600" />
                    {lab.email}
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm font-bold text-gray-900 mb-2">Certifications:</p>
                  <div className="flex flex-wrap gap-2">
                    {lab.certifications.map((cert, idx) => (
                      <span key={idx} className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                        {cert}
                      </span>
                    ))}
                  </div>
                </div>

                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  Contact Lab
                </Button>
              </Card>
            ))}
          </div>
        )}

        {/* Tracking View */}
        {viewMode === "tracking" && (
          <Card className="p-6">
            <p className="font-bold text-gray-900 mb-4">Test Order #12345</p>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-bold text-gray-900">Progress</p>
                <p className="text-sm font-bold text-blue-600">{trackingData.progress}%</p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full"
                  style={{ width: `${trackingData.progress}%` }}
                ></div>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              {trackingData.stages.map((stage, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  {stage.completed ? (
                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                  ) : (
                    <div className="w-6 h-6 border-2 border-gray-300 rounded-full flex-shrink-0"></div>
                  )}
                  <div className="flex-1">
                    <p className={`font-bold ${stage.completed ? "text-gray-900" : "text-gray-600"}`}>
                      {stage.name}
                    </p>
                    {stage.date && <p className="text-xs text-gray-600">{stage.date}</p>}
                  </div>
                </div>
              ))}
            </div>

            <Card className="p-4 bg-blue-50 border-blue-200">
              <p className="text-sm text-gray-600">Expected Completion</p>
              <p className="text-lg font-bold text-blue-600">{trackingData.expectedCompletion}</p>
            </Card>
          </Card>
        )}

        {/* History View */}
        {viewMode === "history" && (
          <div className="space-y-4">
            {history.map((item, idx) => (
              <Card key={idx} className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold text-gray-900">{item.fieldName}</p>
                    <p className="text-sm text-gray-600 mt-1">{item.testType} Test</p>
                    <p className="text-xs text-gray-600 mt-1">{item.labName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">{item.date}</p>
                    <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-bold mt-1">
                      {item.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Comparison View */}
        {viewMode === "comparison" && (
          <Card className="p-6">
            <p className="font-bold text-gray-900 mb-6">Soil Quality Trends Over Time</p>

            <div className="space-y-4">
              {["nitrogen", "phosphorus", "potassium", "organicMatter"].map((nutrient) => (
                <div key={nutrient} className="p-4 bg-gray-50 rounded-lg">
                  <p className="font-bold text-gray-900 mb-3 capitalize">{nutrient}</p>
                  <div className="space-y-2">
                    {comparisonData.map((data, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{data.date}</span>
                        <div className="flex items-center gap-3">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{
                                width: `${
                                  (data[nutrient as keyof typeof data] as number / 50) * 100
                                }%`,
                              }}
                            ></div>
                          </div>
                          <span className="text-sm font-bold text-gray-900 w-12">
                            {data[nutrient as keyof typeof data]}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-green-600 mt-2">✓ Improving trend</p>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SoilTestingLabIntegration;
