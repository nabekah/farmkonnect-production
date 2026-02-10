import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  TrendingUp,
  Bug,
  Calendar,
  Zap,
  BookOpen,
  CheckCircle,
  Clock,
  Droplet,
} from "lucide-react";

/**
 * Pest Early Warning System Component
 * Predictive pest alerts based on weather patterns, crop stage, and historical data
 */
export const PestEarlyWarningSystem: React.FC = () => {
  const [viewMode, setViewMode] = useState<
    "alerts" | "forecast" | "treatments" | "history" | "calendar" | "guide"
  >("alerts");

  // Mock data
  const alerts = [
    {
      id: 1,
      pestName: "Armyworm",
      severity: "high",
      riskScore: 85,
      probability: "Very High",
      affectedCrops: ["Maize", "Rice"],
      expectedDate: "2026-02-15",
      description: "High risk of armyworm outbreak based on weather and crop stage",
    },
    {
      id: 2,
      pestName: "Leaf Spot",
      severity: "medium",
      riskScore: 65,
      probability: "High",
      affectedCrops: ["Rice", "Beans"],
      expectedDate: "2026-02-18",
      description: "Moderate risk of leaf spot disease due to high humidity",
    },
    {
      id: 3,
      pestName: "Aphids",
      severity: "low",
      riskScore: 35,
      probability: "Moderate",
      affectedCrops: ["Beans", "Vegetables"],
      expectedDate: "2026-02-20",
      description: "Low risk of aphid infestation",
    },
  ];

  const forecast = [
    {
      date: "2026-02-11",
      armywormRisk: 45,
      leafSpotRisk: 35,
      aphidRisk: 20,
      overallRisk: "Low",
    },
    {
      date: "2026-02-12",
      armywormRisk: 55,
      leafSpotRisk: 45,
      aphidRisk: 25,
      overallRisk: "Medium",
    },
    {
      date: "2026-02-13",
      armywormRisk: 70,
      leafSpotRisk: 65,
      aphidRisk: 30,
      overallRisk: "High",
    },
    {
      date: "2026-02-14",
      armywormRisk: 75,
      leafSpotRisk: 70,
      aphidRisk: 35,
      overallRisk: "High",
    },
    {
      date: "2026-02-15",
      armywormRisk: 85,
      leafSpotRisk: 75,
      aphidRisk: 40,
      overallRisk: "Very High",
    },
  ];

  const treatments = [
    {
      method: "Biological Control",
      description: "Release natural predators (Trichogramma wasps)",
      effectiveness: 75,
      cost: 500,
      timing: "Immediately",
      safetyRating: "High",
    },
    {
      method: "Chemical Control",
      description: "Apply pyrethroid insecticide (Cypermethrin 10%)",
      effectiveness: 90,
      cost: 150,
      timing: "Early morning or late evening",
      safetyRating: "Medium",
    },
    {
      method: "Cultural Control",
      description: "Remove affected leaves, improve field hygiene",
      effectiveness: 60,
      cost: 50,
      timing: "Ongoing",
      safetyRating: "High",
    },
  ];

  const history = [
    {
      date: "2025-12-01",
      pest: "Armyworm",
      crop: "Maize",
      severity: "high",
      treatment: "Cypermethrin 10%",
      outcome: "Controlled",
      cost: 150,
    },
    {
      date: "2025-10-15",
      pest: "Leaf Spot",
      crop: "Rice",
      severity: "medium",
      treatment: "Fungicide spray",
      outcome: "Controlled",
      cost: 200,
    },
    {
      date: "2025-09-20",
      pest: "Aphids",
      crop: "Beans",
      severity: "low",
      treatment: "Neem oil spray",
      outcome: "Controlled",
      cost: 100,
    },
  ];

  const calendar = [
    {
      month: "January",
      activities: [
        "Monitor for armyworm in early plantings",
        "Scout for leaf spot in wet areas",
        "Apply preventive fungicide if needed",
      ],
      riskLevel: "Medium",
    },
    {
      month: "February",
      activities: [
        "High armyworm risk - weekly scouting required",
        "Apply biological or chemical control if threshold reached",
        "Monitor weather for disease conditions",
      ],
      riskLevel: "High",
    },
    {
      month: "March",
      activities: [
        "Continue pest monitoring",
        "Prepare for end-of-season pests",
        "Plan crop rotation to break pest cycle",
      ],
      riskLevel: "Medium",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Pest Early Warning System</h1>
            <p className="text-gray-600 mt-1">Predictive alerts and treatment recommendations</p>
          </div>
          <Bug className="w-12 h-12 text-red-600 opacity-20" />
        </div>

        {/* View Mode Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          <Button
            onClick={() => setViewMode("alerts")}
            variant={viewMode === "alerts" ? "default" : "outline"}
            className={viewMode === "alerts" ? "bg-red-600 text-white" : ""}
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            Alerts
          </Button>
          <Button
            onClick={() => setViewMode("forecast")}
            variant={viewMode === "forecast" ? "default" : "outline"}
            className={viewMode === "forecast" ? "bg-red-600 text-white" : ""}
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Forecast
          </Button>
          <Button
            onClick={() => setViewMode("treatments")}
            variant={viewMode === "treatments" ? "default" : "outline"}
            className={viewMode === "treatments" ? "bg-red-600 text-white" : ""}
          >
            <Zap className="w-4 h-4 mr-2" />
            Treatments
          </Button>
          <Button
            onClick={() => setViewMode("history")}
            variant={viewMode === "history" ? "default" : "outline"}
            className={viewMode === "history" ? "bg-red-600 text-white" : ""}
          >
            <Clock className="w-4 h-4 mr-2" />
            History
          </Button>
          <Button
            onClick={() => setViewMode("calendar")}
            variant={viewMode === "calendar" ? "default" : "outline"}
            className={viewMode === "calendar" ? "bg-red-600 text-white" : ""}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Calendar
          </Button>
          <Button
            onClick={() => setViewMode("guide")}
            variant={viewMode === "guide" ? "default" : "outline"}
            className={viewMode === "guide" ? "bg-red-600 text-white" : ""}
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Guide
          </Button>
        </div>

        {/* Alerts View */}
        {viewMode === "alerts" && (
          <div className="space-y-4">
            {alerts.map((alert) => (
              <Card
                key={alert.id}
                className={`p-6 border-l-4 ${
                  alert.severity === "high"
                    ? "bg-red-50 border-l-red-600"
                    : alert.severity === "medium"
                    ? "bg-yellow-50 border-l-yellow-600"
                    : "bg-blue-50 border-l-blue-600"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-gray-900 text-lg">{alert.pestName}</p>
                    <p className="text-sm text-gray-700 mt-1">{alert.description}</p>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-3xl font-bold ${
                        alert.severity === "high"
                          ? "text-red-600"
                          : alert.severity === "medium"
                          ? "text-yellow-600"
                          : "text-blue-600"
                      }`}
                    >
                      {alert.riskScore}%
                    </div>
                    <p className="text-xs text-gray-600">Risk Score</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4 text-sm">
                  <div>
                    <p className="text-gray-600">Probability</p>
                    <p className="font-bold text-gray-900">{alert.probability}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Expected Date</p>
                    <p className="font-bold text-gray-900">{alert.expectedDate}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Affected Crops</p>
                    <p className="font-bold text-gray-900">{alert.affectedCrops.join(", ")}</p>
                  </div>
                </div>

                <Button className="w-full bg-red-600 hover:bg-red-700">
                  View Treatment Options
                </Button>
              </Card>
            ))}
          </div>
        )}

        {/* Forecast View */}
        {viewMode === "forecast" && (
          <div className="space-y-4">
            {forecast.map((day, idx) => (
              <Card key={idx} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="font-bold text-gray-900">{day.date}</p>
                  <span
                    className={`px-3 py-1 rounded font-bold text-sm ${
                      day.overallRisk === "Very High"
                        ? "bg-red-200 text-red-800"
                        : day.overallRisk === "High"
                        ? "bg-orange-200 text-orange-800"
                        : day.overallRisk === "Medium"
                        ? "bg-yellow-200 text-yellow-800"
                        : "bg-green-200 text-green-800"
                    }`}
                  >
                    {day.overallRisk}
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <p className="text-sm font-bold text-gray-900">Armyworm Risk</p>
                      <p className="text-sm font-bold text-red-600">{day.armywormRisk}%</p>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-red-600 h-2 rounded-full"
                        style={{ width: `${day.armywormRisk}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <p className="text-sm font-bold text-gray-900">Leaf Spot Risk</p>
                      <p className="text-sm font-bold text-orange-600">{day.leafSpotRisk}%</p>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-orange-600 h-2 rounded-full"
                        style={{ width: `${day.leafSpotRisk}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <p className="text-sm font-bold text-gray-900">Aphid Risk</p>
                      <p className="text-sm font-bold text-yellow-600">{day.aphidRisk}%</p>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-600 h-2 rounded-full"
                        style={{ width: `${day.aphidRisk}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Treatments View */}
        {viewMode === "treatments" && (
          <div className="space-y-4">
            {treatments.map((treatment, idx) => (
              <Card key={idx} className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-gray-900">{treatment.method}</p>
                    <p className="text-sm text-gray-600 mt-1">{treatment.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">{treatment.effectiveness}%</p>
                    <p className="text-xs text-gray-600">Effectiveness</p>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-3 mb-4 text-sm">
                  <div>
                    <p className="text-gray-600">Cost</p>
                    <p className="font-bold text-gray-900">GH₵{treatment.cost}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Timing</p>
                    <p className="font-bold text-gray-900">{treatment.timing}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Safety</p>
                    <p className="font-bold text-gray-900">{treatment.safetyRating}</p>
                  </div>
                  <div>
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-xs">
                      Apply
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* History View */}
        {viewMode === "history" && (
          <div className="space-y-4">
            {history.map((item, idx) => (
              <Card key={idx} className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-gray-900">{item.pest}</p>
                    <p className="text-sm text-gray-600">
                      {item.crop} • {item.date}
                    </p>
                  </div>
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>

                <div className="grid grid-cols-4 gap-3 text-sm">
                  <div>
                    <p className="text-gray-600">Severity</p>
                    <p className="font-bold text-gray-900 capitalize">{item.severity}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Treatment</p>
                    <p className="font-bold text-gray-900">{item.treatment}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Outcome</p>
                    <p className="font-bold text-green-600">{item.outcome}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Cost</p>
                    <p className="font-bold text-gray-900">GH₵{item.cost}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Calendar View */}
        {viewMode === "calendar" && (
          <div className="space-y-4">
            {calendar.map((month, idx) => (
              <Card
                key={idx}
                className={`p-6 border-l-4 ${
                  month.riskLevel === "High"
                    ? "bg-red-50 border-l-red-600"
                    : "bg-yellow-50 border-l-yellow-600"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="font-bold text-gray-900 text-lg">{month.month}</p>
                  <span
                    className={`px-3 py-1 rounded font-bold text-sm ${
                      month.riskLevel === "High"
                        ? "bg-red-200 text-red-800"
                        : "bg-yellow-200 text-yellow-800"
                    }`}
                  >
                    {month.riskLevel} Risk
                  </span>
                </div>

                <ul className="space-y-2">
                  {month.activities.map((activity, aidx) => (
                    <li key={aidx} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-gray-400 mt-1">•</span>
                      {activity}
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        )}

        {/* Guide View */}
        {viewMode === "guide" && (
          <Card className="p-6">
            <p className="font-bold text-gray-900 mb-4">Armyworm Identification Guide</p>

            <div className="space-y-6">
              <div>
                <p className="font-bold text-gray-900 mb-2">Description</p>
                <p className="text-gray-700">
                  Small moths with gray-brown wings, wingspan 30-40mm. Larvae are green or brown
                  with distinctive stripes.
                </p>
              </div>

              <div>
                <p className="font-bold text-gray-900 mb-3">How to Identify</p>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">✓</span>
                    Look for small holes in leaves
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">✓</span>
                    Find dark droppings on leaves
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">✓</span>
                    Observe wilting of young plants
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">✓</span>
                    Check for larvae inside leaf rolls
                  </li>
                </ul>
              </div>

              <div>
                <p className="font-bold text-gray-900 mb-2">Favorable Conditions</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-gray-600">Temperature</p>
                    <p className="font-bold text-gray-900">25-30°C</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-gray-600">Humidity</p>
                    <p className="font-bold text-gray-900">70-80%</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-gray-600">Crop Stage</p>
                    <p className="font-bold text-gray-900">V4-V6</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-gray-600">Season</p>
                    <p className="font-bold text-gray-900">Rainy season</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PestEarlyWarningSystem;
