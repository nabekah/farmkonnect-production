import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Upload,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Users,
  TrendingDown,
  Pill,
  Leaf,
  Calendar,
  DollarSign,
  Phone,
  Video,
  MapPin,
  Star,
} from "lucide-react";

/**
 * Crop Disease Detection Component
 * AI-powered disease identification with treatment recommendations
 */
export const CropDiseaseDetection: React.FC = () => {
  const [viewMode, setViewMode] = useState<
    "upload" | "history" | "details" | "recommendations" | "experts" | "dashboard"
  >("dashboard");
  const [selectedAnalysis, setSelectedAnalysis] = useState<number | null>(null);

  // Mock analysis history
  const analysisHistory = [
    {
      id: 1,
      cropType: "Tomato",
      diseaseName: "Early Blight",
      severity: "medium",
      confidence: 92,
      analysisDate: "2026-02-08",
      status: "treated",
      affectedArea: 15,
    },
    {
      id: 2,
      cropType: "Maize",
      diseaseName: "Leaf Spot",
      severity: "low",
      confidence: 85,
      analysisDate: "2026-02-05",
      status: "monitored",
      affectedArea: 5,
    },
    {
      id: 3,
      cropType: "Pepper",
      diseaseName: "Anthracnose",
      severity: "high",
      confidence: 95,
      analysisDate: "2026-01-31",
      status: "treated",
      affectedArea: 30,
    },
  ];

  // Mock disease details
  const diseaseDetails = {
    name: "Early Blight",
    scientificName: "Alternaria solani",
    cropAffected: "Tomato",
    severity: "medium",
    affectedArea: 15,
    confidence: 92,
    symptoms: [
      "Brown circular spots on lower leaves",
      "Concentric rings on affected areas",
      "Yellow halo around lesions",
      "Leaf yellowing and defoliation",
    ],
    treatmentPlan: [
      {
        step: 1,
        action: "Remove affected leaves",
        timing: "Immediate",
        materials: "Pruning shears",
        cost: 500,
      },
      {
        step: 2,
        action: "Apply fungicide",
        timing: "Every 7-10 days",
        materials: "Copper-based fungicide",
        cost: 2000,
      },
      {
        step: 3,
        action: "Improve air circulation",
        timing: "Ongoing",
        materials: "Pruning, spacing adjustment",
        cost: 1000,
      },
    ],
    estimatedRecoveryTime: "2-3 weeks",
    totalEstimatedCost: 3500,
  };

  // Mock experts
  const experts = [
    {
      id: 1,
      name: "Dr. Kwame Mensah",
      specialty: "Crop Pathology",
      experience: 15,
      rating: 4.8,
      availability: "Available",
      consultationFee: 5000,
    },
    {
      id: 2,
      name: "Ama Boateng",
      specialty: "Organic Farming",
      experience: 10,
      rating: 4.6,
      availability: "Available",
      consultationFee: 3000,
    },
  ];

  // Mock dashboard
  const dashboard = {
    totalAnalyses: 12,
    diseaseDetected: 8,
    healthyFields: 4,
    criticalCases: 1,
    recoveredCases: 5,
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "low":
        return "bg-green-100 text-green-800 border-green-300";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "critical":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "low":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "medium":
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case "high":
        return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      case "critical":
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      default:
        return <Leaf className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Crop Disease Detection</h1>
            <p className="text-gray-600 mt-1">AI-powered disease identification and treatment recommendations</p>
          </div>
          <Leaf className="w-12 h-12 text-green-600 opacity-20" />
        </div>

        {/* View Mode Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          <Button
            onClick={() => setViewMode("dashboard")}
            variant={viewMode === "dashboard" ? "default" : "outline"}
            className={viewMode === "dashboard" ? "bg-blue-600 text-white" : ""}
          >
            Dashboard
          </Button>
          <Button
            onClick={() => setViewMode("upload")}
            variant={viewMode === "upload" ? "default" : "outline"}
            className={viewMode === "upload" ? "bg-blue-600 text-white" : ""}
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Image
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
            onClick={() => setViewMode("experts")}
            variant={viewMode === "experts" ? "default" : "outline"}
            className={viewMode === "experts" ? "bg-blue-600 text-white" : ""}
          >
            <Users className="w-4 h-4 mr-2" />
            Experts
          </Button>
        </div>

        {/* Dashboard View */}
        {viewMode === "dashboard" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
              <Card className="p-6">
                <p className="text-gray-600 text-sm">Total Analyses</p>
                <p className="text-3xl font-bold text-gray-900">{dashboard.totalAnalyses}</p>
              </Card>
              <Card className="p-6">
                <p className="text-gray-600 text-sm">Disease Detected</p>
                <p className="text-3xl font-bold text-orange-600">{dashboard.diseaseDetected}</p>
              </Card>
              <Card className="p-6">
                <p className="text-gray-600 text-sm">Healthy Fields</p>
                <p className="text-3xl font-bold text-green-600">{dashboard.healthyFields}</p>
              </Card>
              <Card className="p-6">
                <p className="text-gray-600 text-sm">Critical Cases</p>
                <p className="text-3xl font-bold text-red-600">{dashboard.criticalCases}</p>
              </Card>
              <Card className="p-6">
                <p className="text-gray-600 text-sm">Recovered</p>
                <p className="text-3xl font-bold text-blue-600">{dashboard.recoveredCases}</p>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setViewMode("upload")}>
                <Upload className="w-8 h-8 text-blue-600 mb-3" />
                <p className="font-bold text-gray-900">Analyze New Image</p>
                <p className="text-sm text-gray-600 mt-2">Upload crop image for AI analysis</p>
              </Card>
              <Card className="p-6 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setViewMode("history")}>
                <Clock className="w-8 h-8 text-purple-600 mb-3" />
                <p className="font-bold text-gray-900">Recent Analyses</p>
                <p className="text-sm text-gray-600 mt-2">{analysisHistory.length} analyses on record</p>
              </Card>
            </div>
          </>
        )}

        {/* Upload Image View */}
        {viewMode === "upload" && (
          <Card className="p-8">
            <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
              <Upload className="w-16 h-16 text-gray-400 mb-4" />
              <p className="text-lg font-semibold text-gray-900 mb-2">Upload Crop Image</p>
              <p className="text-gray-600 text-center mb-6">
                Drag and drop your crop image or click to browse
              </p>
              <Button className="bg-blue-600 hover:bg-blue-700 mb-4">Choose Image</Button>
              <p className="text-xs text-gray-500">Supported formats: JPG, PNG, WebP (Max 10MB)</p>
            </div>

            <div className="mt-8 p-6 bg-blue-50 rounded-lg">
              <p className="font-bold text-gray-900 mb-3">How it works:</p>
              <ol className="space-y-2 text-sm text-gray-700">
                <li>1. Upload a clear image of the affected crop area</li>
                <li>2. AI analyzes the image for disease signs</li>
                <li>3. Get detailed disease identification and confidence score</li>
                <li>4. Receive treatment recommendations and expert consultation options</li>
              </ol>
            </div>
          </Card>
        )}

        {/* History View */}
        {viewMode === "history" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Analysis History</h2>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Upload className="w-4 h-4 mr-2" />
                New Analysis
              </Button>
            </div>

            {analysisHistory.map((analysis) => (
              <Card
                key={analysis.id}
                className={`p-6 cursor-pointer hover:shadow-lg transition-shadow border-l-4 ${getSeverityColor(analysis.severity)}`}
                onClick={() => {
                  setSelectedAnalysis(analysis.id);
                  setViewMode("details");
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    {getSeverityIcon(analysis.severity)}
                    <div>
                      <p className="font-bold text-gray-900">{analysis.diseaseName}</p>
                      <p className="text-sm text-gray-600">{analysis.cropType}</p>
                      <p className="text-xs text-gray-500 mt-1">{analysis.analysisDate}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-3 py-1 rounded text-sm font-medium ${getSeverityColor(analysis.severity)}`}>
                      {analysis.severity.charAt(0).toUpperCase() + analysis.severity.slice(1)}
                    </span>
                    <p className="text-xs text-gray-600 mt-2">{analysis.confidence}% confidence</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Disease Details View */}
        {viewMode === "details" && (
          <div className="space-y-6">
            {/* Disease Overview */}
            <Card className="p-6 bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-orange-600 font-bold text-lg">{diseaseDetails.name}</p>
                  <p className="text-gray-600 text-sm italic">{diseaseDetails.scientificName}</p>
                </div>
                <span className={`inline-block px-4 py-2 rounded font-medium ${getSeverityColor(diseaseDetails.severity)}`}>
                  {diseaseDetails.severity.toUpperCase()} - {diseaseDetails.confidence}% Confidence
                </span>
              </div>
              <p className="text-gray-700">Affected Area: <span className="font-bold">{diseaseDetails.affectedArea}%</span></p>
            </Card>

            {/* Symptoms */}
            <Card className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Symptoms</h3>
              <ul className="space-y-2">
                {diseaseDetails.symptoms.map((symptom, idx) => (
                  <li key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{symptom}</span>
                  </li>
                ))}
              </ul>
            </Card>

            {/* Treatment Plan */}
            <Card className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Treatment Plan</h3>
              <div className="space-y-4">
                {diseaseDetails.treatmentPlan.map((step) => (
                  <div key={step.step} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-bold text-gray-900">Step {step.step}: {step.action}</p>
                      <span className="text-green-600 font-bold">GH₵{step.cost}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{step.materials}</p>
                    <p className="text-xs text-gray-500">Timing: {step.timing}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-4 bg-blue-50 rounded-lg flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Estimated Recovery Time</p>
                  <p className="font-bold text-gray-900">{diseaseDetails.estimatedRecoveryTime}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-600 text-sm">Total Estimated Cost</p>
                  <p className="font-bold text-green-600 text-lg">GH₵{diseaseDetails.totalEstimatedCost}</p>
                </div>
              </div>
            </Card>

            {/* Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button className="bg-green-600 hover:bg-green-700 h-12">
                <Pill className="w-4 h-4 mr-2" />
                Start Treatment
              </Button>
              <Button
                variant="outline"
                className="h-12"
                onClick={() => setViewMode("experts")}
              >
                <Users className="w-4 h-4 mr-2" />
                Consult Expert
              </Button>
            </div>
          </div>
        )}

        {/* Experts View */}
        {viewMode === "experts" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Agricultural Experts</h2>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Users className="w-4 h-4 mr-2" />
                View All Experts
              </Button>
            </div>

            {experts.map((expert) => (
              <Card key={expert.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="font-bold text-gray-900">{expert.name}</p>
                    <p className="text-sm text-gray-600">{expert.specialty}</p>
                    <div className="flex items-center gap-4 mt-3">
                      <span className="text-xs text-gray-600">
                        <Zap className="w-4 h-4 inline mr-1" />
                        {expert.experience} years experience
                      </span>
                      <span className="text-xs text-gray-600 flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500" />
                        {expert.rating}/5.0
                      </span>
                    </div>
                  </div>
                  <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded text-sm font-medium">
                    {expert.availability}
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <p className="font-bold text-gray-900">GH₵{expert.consultationFee}</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Phone className="w-4 h-4 mr-1" />
                      Phone
                    </Button>
                    <Button variant="outline" size="sm">
                      <Video className="w-4 h-4 mr-1" />
                      Video
                    </Button>
                    <Button className="bg-blue-600 hover:bg-blue-700" size="sm">
                      Book Now
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CropDiseaseDetection;
