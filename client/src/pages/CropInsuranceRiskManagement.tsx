import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  FileText,
  Download,
  Plus,
  Search,
  Zap,
  BarChart3,
} from "lucide-react";

/**
 * Crop Insurance & Risk Management Component
 * Insurance recommendations, claims processing, and risk assessment
 */
export const CropInsuranceRiskManagement: React.FC = () => {
  const [viewMode, setViewMode] = useState<
    "dashboard" | "policies" | "claims" | "risk" | "recommendations"
  >("dashboard");

  // Mock policies
  const policies = [
    {
      id: 1,
      policyNumber: "GIC-2025-001",
      productName: "Comprehensive Crop Insurance",
      provider: "Ghana Insurance Company",
      cropType: "Maize",
      coverage: 50000,
      premium: 5000,
      startDate: "2025-01-01",
      expiryDate: "2025-12-31",
      status: "active",
      claimsRemaining: 2,
    },
    {
      id: 2,
      policyNumber: "ARC-2025-002",
      productName: "Weather-Based Insurance",
      provider: "African Risk Capacity",
      cropType: "Tomato",
      coverage: 30000,
      premium: 3000,
      startDate: "2025-02-01",
      expiryDate: "2026-01-31",
      status: "active",
      claimsRemaining: 3,
    },
  ];

  // Mock claims
  const claims = [
    {
      id: 1,
      claimNumber: "CLM-2025-001",
      policyNumber: "GIC-2025-001",
      claimType: "Pest Outbreak",
      lossAmount: 15000,
      claimAmount: 12000,
      status: "approved",
      submissionDate: "2025-02-01",
      paymentDate: "2025-02-10",
    },
    {
      id: 2,
      claimNumber: "CLM-2025-002",
      policyNumber: "ARC-2025-002",
      claimType: "Drought",
      lossAmount: 10000,
      claimAmount: 8000,
      status: "pending",
      submissionDate: "2025-02-05",
      paymentDate: null,
    },
  ];

  // Mock risk assessment
  const riskAssessment = {
    overallRiskLevel: "medium",
    riskScore: 65,
    riskFactors: [
      {
        factor: "Weather Risk",
        level: "high",
        score: 75,
        description: "High rainfall variability in region",
      },
      {
        factor: "Pest Risk",
        level: "medium",
        score: 60,
        description: "Moderate pest pressure historically",
      },
      {
        factor: "Market Risk",
        level: "low",
        score: 40,
        description: "Stable market prices for crop",
      },
      {
        factor: "Disease Risk",
        level: "medium",
        score: 55,
        description: "Common diseases in region",
      },
    ],
  };

  // Mock dashboard
  const dashboard = {
    activePolicies: 2,
    totalCoverage: 80000,
    totalPremiums: 8000,
    claimsProcessed: 3,
    claimsApproved: 2,
    totalClaimsAmount: 25000,
  };

  // Mock recommendations
  const recommendations = [
    {
      id: 1,
      productName: "Comprehensive Crop Insurance",
      provider: "Ghana Insurance Company",
      coverage: "Weather, pests, diseases, market price",
      premium: 5000,
      coverageAmount: 50000,
      deductible: 2500,
      claimProcessing: "7-10 days",
      rating: 4.7,
      recommended: true,
    },
    {
      id: 2,
      productName: "Weather-Based Insurance",
      provider: "African Risk Capacity",
      coverage: "Drought, excessive rainfall, hail",
      premium: 3000,
      coverageAmount: 30000,
      deductible: 1500,
      claimProcessing: "5-7 days",
      rating: 4.5,
      recommended: false,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-300";
      case "approved":
        return "bg-green-100 text-green-800 border-green-300";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Insurance & Risk Management</h1>
            <p className="text-gray-600 mt-1">Protect your crops with comprehensive insurance and risk assessment</p>
          </div>
          <Shield className="w-12 h-12 text-blue-600 opacity-20" />
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
            onClick={() => setViewMode("policies")}
            variant={viewMode === "policies" ? "default" : "outline"}
            className={viewMode === "policies" ? "bg-blue-600 text-white" : ""}
          >
            <FileText className="w-4 h-4 mr-2" />
            Policies
          </Button>
          <Button
            onClick={() => setViewMode("claims")}
            variant={viewMode === "claims" ? "default" : "outline"}
            className={viewMode === "claims" ? "bg-blue-600 text-white" : ""}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Claims
          </Button>
          <Button
            onClick={() => setViewMode("risk")}
            variant={viewMode === "risk" ? "default" : "outline"}
            className={viewMode === "risk" ? "bg-blue-600 text-white" : ""}
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            Risk Assessment
          </Button>
          <Button
            onClick={() => setViewMode("recommendations")}
            variant={viewMode === "recommendations" ? "default" : "outline"}
            className={viewMode === "recommendations" ? "bg-blue-600 text-white" : ""}
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Recommendations
          </Button>
        </div>

        {/* Dashboard View */}
        {viewMode === "dashboard" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
              <Card className="p-6">
                <p className="text-gray-600 text-sm">Active Policies</p>
                <p className="text-3xl font-bold text-blue-600">{dashboard.activePolicies}</p>
              </Card>
              <Card className="p-6">
                <p className="text-gray-600 text-sm">Total Coverage</p>
                <p className="text-3xl font-bold text-green-600">GH₵{dashboard.totalCoverage}K</p>
              </Card>
              <Card className="p-6">
                <p className="text-gray-600 text-sm">Total Premiums</p>
                <p className="text-3xl font-bold text-purple-600">GH₵{dashboard.totalPremiums}K</p>
              </Card>
              <Card className="p-6">
                <p className="text-gray-600 text-sm">Claims Processed</p>
                <p className="text-3xl font-bold text-orange-600">{dashboard.claimsProcessed}</p>
              </Card>
              <Card className="p-6">
                <p className="text-gray-600 text-sm">Approved Claims</p>
                <p className="text-3xl font-bold text-green-600">{dashboard.claimsApproved}</p>
              </Card>
              <Card className="p-6">
                <p className="text-gray-600 text-sm">Claims Amount</p>
                <p className="text-3xl font-bold text-gray-900">GH₵{dashboard.totalClaimsAmount}K</p>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-6 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setViewMode("policies")}>
                <FileText className="w-8 h-8 text-blue-600 mb-3" />
                <p className="font-bold text-gray-900">Active Policies</p>
                <p className="text-sm text-gray-600 mt-2">View and manage your insurance policies</p>
              </Card>
              <Card className="p-6 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setViewMode("claims")}>
                <CheckCircle className="w-8 h-8 text-green-600 mb-3" />
                <p className="font-bold text-gray-900">File a Claim</p>
                <p className="text-sm text-gray-600 mt-2">Submit and track insurance claims</p>
              </Card>
              <Card className="p-6 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setViewMode("risk")}>
                <AlertTriangle className="w-8 h-8 text-red-600 mb-3" />
                <p className="font-bold text-gray-900">Risk Assessment</p>
                <p className="text-sm text-gray-600 mt-2">Understand your farm's risk profile</p>
              </Card>
            </div>
          </>
        )}

        {/* Policies View */}
        {viewMode === "policies" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Insurance Policies</h2>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Policy
              </Button>
            </div>

            {policies.map((policy) => (
              <Card key={policy.id} className="p-6 border-l-4 border-blue-500">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-gray-900 text-lg">{policy.productName}</p>
                    <p className="text-sm text-gray-600">{policy.provider}</p>
                  </div>
                  <span className={`inline-block px-3 py-1 rounded text-sm font-medium ${getStatusColor(policy.status)}`}>
                    {policy.status.charAt(0).toUpperCase() + policy.status.slice(1)}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-4">
                  <div>
                    <p className="text-gray-600 text-xs">Policy #</p>
                    <p className="font-bold text-gray-900 text-sm">{policy.policyNumber}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-xs">Crop Type</p>
                    <p className="font-bold text-gray-900">{policy.cropType}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-xs">Coverage</p>
                    <p className="font-bold text-green-600">GH₵{policy.coverage}K</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-xs">Premium</p>
                    <p className="font-bold text-gray-900">GH₵{policy.premium}K</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-xs">Expires</p>
                    <p className="font-bold text-gray-900">{policy.expiryDate}</p>
                  </div>
                  <div>
                    <Button variant="outline" className="w-full">
                      Details
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Claims View */}
        {viewMode === "claims" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Insurance Claims</h2>
              <Button className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 mr-2" />
                File Claim
              </Button>
            </div>

            {claims.map((claim) => (
              <Card key={claim.id} className={`p-6 border-l-4 ${getStatusColor(claim.status)}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-gray-900 text-lg">{claim.claimNumber}</p>
                    <p className="text-sm text-gray-600">{claim.claimType}</p>
                  </div>
                  <span className={`inline-block px-3 py-1 rounded text-sm font-medium ${getStatusColor(claim.status)}`}>
                    {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                  <div>
                    <p className="text-gray-600 text-xs">Policy #</p>
                    <p className="font-bold text-gray-900 text-sm">{claim.policyNumber}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-xs">Loss Amount</p>
                    <p className="font-bold text-red-600">GH₵{claim.lossAmount}K</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-xs">Claim Amount</p>
                    <p className="font-bold text-green-600">GH₵{claim.claimAmount}K</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-xs">Submitted</p>
                    <p className="font-bold text-gray-900">{claim.submissionDate}</p>
                  </div>
                  <div>
                    <Button variant="outline" className="w-full">
                      View Details
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Risk Assessment View */}
        {viewMode === "risk" && (
          <div className="space-y-4">
            <Card className="p-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-orange-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-bold text-gray-900 text-lg">Overall Risk Assessment</p>
                  <p className="text-sm text-gray-600">Based on your farm's location and crop type</p>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-bold text-orange-600">{riskAssessment.riskScore}</p>
                  <p className="text-sm text-gray-600">Risk Score</p>
                </div>
              </div>
              <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${getRiskLevelColor(riskAssessment.overallRiskLevel)}`}>
                {riskAssessment.overallRiskLevel.charAt(0).toUpperCase() + riskAssessment.overallRiskLevel.slice(1)} Risk
              </span>
            </Card>

            <div className="space-y-3">
              <h3 className="font-bold text-gray-900">Risk Factors</h3>
              {riskAssessment.riskFactors.map((factor, idx) => (
                <Card key={idx} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-bold text-gray-900">{factor.factor}</p>
                      <p className="text-sm text-gray-600">{factor.description}</p>
                    </div>
                    <span className={`inline-block px-3 py-1 rounded text-sm font-medium ${getRiskLevelColor(factor.level)}`}>
                      {factor.level.toUpperCase()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        factor.level === "high"
                          ? "bg-red-600"
                          : factor.level === "medium"
                          ? "bg-yellow-600"
                          : "bg-green-600"
                      }`}
                      style={{ width: `${factor.score}%` }}
                    />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations View */}
        {viewMode === "recommendations" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Insurance Recommendations</h2>

            {recommendations.map((rec) => (
              <Card key={rec.id} className={`p-6 ${rec.recommended ? "border-l-4 border-green-500 bg-green-50" : ""}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-gray-900 text-lg">{rec.productName}</p>
                    <p className="text-sm text-gray-600">{rec.provider}</p>
                  </div>
                  {rec.recommended && (
                    <span className="inline-block px-3 py-1 bg-green-200 text-green-800 rounded text-sm font-medium">
                      RECOMMENDED
                    </span>
                  )}
                </div>

                <p className="text-sm text-gray-600 mb-4">{rec.coverage}</p>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                  <div>
                    <p className="text-gray-600 text-xs">Premium</p>
                    <p className="font-bold text-gray-900">GH₵{rec.premium}K</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-xs">Coverage</p>
                    <p className="font-bold text-green-600">GH₵{rec.coverageAmount}K</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-xs">Deductible</p>
                    <p className="font-bold text-gray-900">GH₵{rec.deductible}K</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-xs">Processing</p>
                    <p className="font-bold text-gray-900">{rec.claimProcessing}</p>
                  </div>
                  <div>
                    <Button className="w-full bg-blue-600 hover:bg-blue-700">
                      Purchase
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

export default CropInsuranceRiskManagement;
