import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Bug,
  AlertTriangle,
  Upload,
  Zap,
  CheckCircle,
  Clock,
  Leaf,
  Droplet,
  TrendingDown,
  Shield,
} from "lucide-react";

/**
 * Pest & Disease Management Component
 * Image recognition for pest identification and treatment recommendations
 */
export const PestDiseaseManagement: React.FC = () => {
  const [viewMode, setViewMode] = useState<
    "detection" | "database" | "history" | "alerts" | "ipm" | "compliance"
  >("detection");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  // Mock data
  const detectionResult = {
    pestType: "Armyworm",
    confidence: 0.92,
    severity: "moderate",
    affectedArea: "5%",
  };

  const treatments = [
    {
      method: "Biological Control",
      description: "Use natural predators",
      effectiveness: 0.85,
      cost: "Low",
      timeToEffect: "7-10 days",
    },
    {
      method: "Chemical Spray",
      description: "Apply approved pesticide",
      effectiveness: 0.95,
      cost: "Medium",
      timeToEffect: "2-3 days",
    },
    {
      method: "Cultural Practice",
      description: "Crop rotation and field sanitation",
      effectiveness: 0.7,
      cost: "Low",
      timeToEffect: "30 days",
    },
  ];

  const pestDatabase = [
    {
      name: "Armyworm",
      scientificName: "Spodoptera frugiperda",
      crops: ["Maize", "Sorghum", "Rice"],
      symptoms: "Leaf damage, defoliation",
      season: "Rainy season",
    },
    {
      name: "Aphids",
      scientificName: "Aphis spp.",
      crops: ["Vegetables", "Fruits"],
      symptoms: "Yellowing leaves, sticky residue",
      season: "Year-round",
    },
    {
      name: "Leaf Spot Disease",
      scientificName: "Cercospora spp.",
      crops: ["Maize", "Beans"],
      symptoms: "Brown spots on leaves",
      season: "Wet season",
    },
  ];

  const history = [
    {
      date: "2026-02-05",
      pestType: "Armyworm",
      severity: "moderate",
      treatment: "Chemical Spray",
      status: "treated",
    },
    {
      date: "2026-01-28",
      pestType: "Aphids",
      severity: "low",
      treatment: "Biological Control",
      status: "monitoring",
    },
    {
      date: "2026-01-15",
      pestType: "Leaf Spot",
      severity: "moderate",
      treatment: "Fungicide",
      status: "resolved",
    },
  ];

  const alerts = [
    {
      type: "High Risk",
      disease: "Armyworm outbreak predicted",
      probability: 0.85,
      recommendation: "Increase monitoring frequency",
    },
    {
      type: "Medium Risk",
      disease: "Leaf spot disease possible",
      probability: 0.65,
      recommendation: "Apply preventive fungicide",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Pest & Disease Management</h1>
            <p className="text-gray-600 mt-1">AI-powered pest identification and treatment recommendations</p>
          </div>
          <Bug className="w-12 h-12 text-red-600 opacity-20" />
        </div>

        {/* View Mode Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          <Button
            onClick={() => setViewMode("detection")}
            variant={viewMode === "detection" ? "default" : "outline"}
            className={viewMode === "detection" ? "bg-blue-600 text-white" : ""}
          >
            <Upload className="w-4 h-4 mr-2" />
            Detection
          </Button>
          <Button
            onClick={() => setViewMode("database")}
            variant={viewMode === "database" ? "default" : "outline"}
            className={viewMode === "database" ? "bg-blue-600 text-white" : ""}
          >
            <Leaf className="w-4 h-4 mr-2" />
            Database
          </Button>
          <Button
            onClick={() => setViewMode("history")}
            variant={viewMode === "history" ? "default" : "outline"}
            className={viewMode === "history" ? "bg-blue-600 text-white" : ""}
          >
            <Clock className="w-4 h-4 mr-2" />
            History
          </Button>
          <Button
            onClick={() => setViewMode("alerts")}
            variant={viewMode === "alerts" ? "default" : "outline"}
            className={viewMode === "alerts" ? "bg-blue-600 text-white" : ""}
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            Alerts
          </Button>
          <Button
            onClick={() => setViewMode("ipm")}
            variant={viewMode === "ipm" ? "default" : "outline"}
            className={viewMode === "ipm" ? "bg-blue-600 text-white" : ""}
          >
            <Shield className="w-4 h-4 mr-2" />
            IPM Strategy
          </Button>
          <Button
            onClick={() => setViewMode("compliance")}
            variant={viewMode === "compliance" ? "default" : "outline"}
            className={viewMode === "compliance" ? "bg-blue-600 text-white" : ""}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Compliance
          </Button>
        </div>

        {/* Detection View */}
        {viewMode === "detection" && (
          <div className="space-y-6">
            <Card className="p-6">
              <p className="font-bold text-gray-900 mb-4">Upload Crop Image</p>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="font-bold text-gray-900">Click to upload or drag and drop</p>
                <p className="text-sm text-gray-600">PNG, JPG up to 10MB</p>
              </div>
            </Card>

            {uploadedImage && (
              <>
                <Card className="p-6">
                  <p className="font-bold text-gray-900 mb-4">Detection Result</p>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <div className="flex items-start gap-4">
                      <Bug className="w-8 h-8 text-red-600 mt-1 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-bold text-gray-900 text-lg">{detectionResult.pestType}</p>
                        <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                          <div>
                            <p className="text-gray-600">Confidence</p>
                            <p className="font-bold text-gray-900">{(detectionResult.confidence * 100).toFixed(0)}%</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Severity</p>
                            <p className="font-bold text-gray-900 capitalize">{detectionResult.severity}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Affected Area</p>
                            <p className="font-bold text-gray-900">{detectionResult.affectedArea}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <p className="font-bold text-gray-900 mb-4">Treatment Recommendations</p>
                  <div className="space-y-3">
                    {treatments.map((treatment, idx) => (
                      <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-start justify-between mb-2">
                          <p className="font-bold text-gray-900">{treatment.method}</p>
                          <span className="text-sm font-bold text-green-600">
                            {(treatment.effectiveness * 100).toFixed(0)}% effective
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mb-3">{treatment.description}</p>
                        <div className="grid grid-cols-3 gap-3 text-sm mb-3">
                          <div>
                            <p className="text-gray-600">Cost</p>
                            <p className="font-bold text-gray-900">{treatment.cost}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Time to Effect</p>
                            <p className="font-bold text-gray-900">{treatment.timeToEffect}</p>
                          </div>
                        </div>
                        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-sm">
                          Apply Treatment
                        </Button>
                      </div>
                    ))}
                  </div>
                </Card>
              </>
            )}
          </div>
        )}

        {/* Database View */}
        {viewMode === "database" && (
          <div className="space-y-4">
            {pestDatabase.map((pest, idx) => (
              <Card key={idx} className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-gray-900 text-lg">{pest.name}</p>
                    <p className="text-sm text-gray-600 italic">{pest.scientificName}</p>
                  </div>
                  <Leaf className="w-6 h-6 text-green-600 opacity-50" />
                </div>

                <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                  <div>
                    <p className="text-gray-600">Symptoms</p>
                    <p className="font-bold text-gray-900">{pest.symptoms}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Season</p>
                    <p className="font-bold text-gray-900">{pest.season}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-2">Affected Crops</p>
                  <div className="flex flex-wrap gap-2">
                    {pest.crops.map((crop, cidx) => (
                      <span key={cidx} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                        {crop}
                      </span>
                    ))}
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
                    <p className="font-bold text-gray-900">{item.pestType}</p>
                    <p className="text-sm text-gray-600">{item.date}</p>
                  </div>
                  <span className={`px-3 py-1 rounded text-sm font-medium ${
                    item.status === "resolved" ? "bg-green-100 text-green-800" :
                    item.status === "treated" ? "bg-blue-100 text-blue-800" :
                    "bg-yellow-100 text-yellow-800"
                  }`}>
                    {item.status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Severity</p>
                    <p className="font-bold text-gray-900 capitalize">{item.severity}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Treatment</p>
                    <p className="font-bold text-gray-900">{item.treatment}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Alerts View */}
        {viewMode === "alerts" && (
          <div className="space-y-4">
            {alerts.map((alert, idx) => (
              <Card key={idx} className={`p-6 ${alert.type === "High Risk" ? "bg-red-50 border-red-200" : "bg-yellow-50 border-yellow-200"}`}>
                <div className="flex items-start gap-3">
                  <AlertTriangle className={`w-6 h-6 mt-1 flex-shrink-0 ${alert.type === "High Risk" ? "text-red-600" : "text-yellow-600"}`} />
                  <div className="flex-1">
                    <p className="font-bold text-gray-900">{alert.disease}</p>
                    <p className="text-sm text-gray-700 mt-1">{alert.recommendation}</p>
                    <p className="text-xs text-gray-600 mt-2">
                      Probability: {(alert.probability * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* IPM Strategy View */}
        {viewMode === "ipm" && (
          <div className="space-y-4">
            <Card className="p-6">
              <p className="font-bold text-gray-900 mb-4">Integrated Pest Management Strategy</p>
              
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="font-bold text-gray-900 mb-2">Prevention</p>
                  <ul className="space-y-1 text-sm text-gray-700">
                    <li>• Crop rotation</li>
                    <li>• Field sanitation</li>
                    <li>• Resistant varieties</li>
                  </ul>
                </div>

                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="font-bold text-gray-900 mb-2">Monitoring</p>
                  <ul className="space-y-1 text-sm text-gray-700">
                    <li>• Regular field scouting</li>
                    <li>• Pest traps</li>
                    <li>• Weather monitoring</li>
                  </ul>
                </div>

                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="font-bold text-gray-900 mb-2">Intervention</p>
                  <ul className="space-y-1 text-sm text-gray-700">
                    <li>• Biological control</li>
                    <li>• Cultural practices</li>
                    <li>• Chemical control as last resort</li>
                  </ul>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="font-bold text-gray-900 mb-2">Documentation</p>
                  <ul className="space-y-1 text-sm text-gray-700">
                    <li>• Keep detailed records</li>
                    <li>• Track pesticide use</li>
                    <li>• Monitor effectiveness</li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Compliance View */}
        {viewMode === "compliance" && (
          <div className="space-y-4">
            <Card className="p-6">
              <p className="font-bold text-gray-900 mb-4">Pesticide Compliance</p>
              
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-gray-600 text-sm">Total Applications</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">12</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-gray-600 text-sm">Compliant</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">11</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-gray-600 text-sm">Compliance Rate</p>
                  <p className="text-2xl font-bold text-purple-600 mt-1">92%</p>
                </div>
              </div>

              <div className="p-4 bg-red-50 rounded-lg border border-red-200 mb-4">
                <p className="font-bold text-gray-900 mb-2">Violations</p>
                <p className="text-sm text-gray-700">1 violation on 2026-01-15: Banned pesticide used (High severity)</p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="font-bold text-gray-900 mb-3">Recommendations</p>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• Use only approved pesticides</li>
                  <li>• Follow recommended dosages</li>
                  <li>• Maintain proper records</li>
                </ul>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default PestDiseaseManagement;
