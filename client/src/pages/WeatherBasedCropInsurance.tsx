import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Cloud,
  Droplet,
  Thermometer,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  FileText,
  Shield,
  Zap,
  BarChart3,
  Plus,
  Clock,
} from "lucide-react";

/**
 * Weather-Based Crop Insurance Component
 * Parametric insurance with automatic triggers and instant payouts
 */
export const WeatherBasedCropInsurance: React.FC = () => {
  const [viewMode, setViewMode] = useState<
    "products" | "policies" | "claims" | "monitoring" | "analytics" | "recommendations"
  >("products");

  // Mock data
  const products = [
    {
      id: 1,
      name: "Drought Protection - Maize",
      crop: "Maize",
      coverage: 5000,
      premium: 250,
      trigger: "Rainfall < 300mm",
      season: "June-October",
    },
    {
      id: 2,
      name: "Excess Rainfall - Vegetables",
      crop: "Vegetables",
      coverage: 3000,
      premium: 150,
      trigger: "Rainfall > 500mm",
      season: "Year-round",
    },
    {
      id: 3,
      name: "Temperature Stress - Cocoa",
      crop: "Cocoa",
      coverage: 8000,
      premium: 400,
      trigger: "Temperature > 35°C",
      season: "May-September",
    },
  ];

  const policies = [
    {
      id: 1,
      policyId: "POL-1707500000",
      product: "Drought Protection - Maize",
      coverage: 5000,
      premium: 250,
      status: "active",
      startDate: "2026-01-01",
      endDate: "2026-06-30",
    },
    {
      id: 2,
      policyId: "POL-1707510000",
      product: "Excess Rainfall - Vegetables",
      coverage: 3000,
      premium: 150,
      status: "active",
      startDate: "2026-02-01",
      endDate: "2026-12-31",
    },
  ];

  const claims = [
    {
      id: 1,
      claimId: "CLM-2026-001",
      product: "Drought Protection - Maize",
      payout: 5000,
      status: "paid",
      paymentDate: "2025-08-20",
    },
    {
      id: 2,
      claimId: "CLM-2026-002",
      product: "Excess Rainfall - Vegetables",
      payout: 3000,
      status: "processing",
      estimatedPayout: "2026-02-15",
    },
  ];

  const monitoring = {
    rainfall: { current: 280, threshold: 300, status: "critical" },
    temperature: { current: 28, threshold: 35, status: "normal" },
    humidity: 65,
  };

  const analytics = {
    activePolicies: 2,
    totalCoverage: 8000,
    totalPremiums: 400,
    totalPaid: 5000,
    roi: 12.5,
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Weather-Based Crop Insurance</h1>
            <p className="text-gray-600 mt-1">Parametric insurance with automatic triggers and instant payouts</p>
          </div>
          <Shield className="w-12 h-12 text-blue-600 opacity-20" />
        </div>

        {/* View Mode Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          <Button
            onClick={() => setViewMode("products")}
            variant={viewMode === "products" ? "default" : "outline"}
            className={viewMode === "products" ? "bg-blue-600 text-white" : ""}
          >
            <Plus className="w-4 h-4 mr-2" />
            Products
          </Button>
          <Button
            onClick={() => setViewMode("policies")}
            variant={viewMode === "policies" ? "default" : "outline"}
            className={viewMode === "policies" ? "bg-blue-600 text-white" : ""}
          >
            <FileText className="w-4 h-4 mr-2" />
            My Policies
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
            onClick={() => setViewMode("monitoring")}
            variant={viewMode === "monitoring" ? "default" : "outline"}
            className={viewMode === "monitoring" ? "bg-blue-600 text-white" : ""}
          >
            <Cloud className="w-4 h-4 mr-2" />
            Monitoring
          </Button>
          <Button
            onClick={() => setViewMode("analytics")}
            variant={viewMode === "analytics" ? "default" : "outline"}
            className={viewMode === "analytics" ? "bg-blue-600 text-white" : ""}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </Button>
          <Button
            onClick={() => setViewMode("recommendations")}
            variant={viewMode === "recommendations" ? "default" : "outline"}
            className={viewMode === "recommendations" ? "bg-blue-600 text-white" : ""}
          >
            <Zap className="w-4 h-4 mr-2" />
            Recommendations
          </Button>
        </div>

        {/* Products View */}
        {viewMode === "products" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {products.map((product) => (
              <Card key={product.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-gray-900">{product.name}</p>
                    <p className="text-sm text-gray-600">{product.crop}</p>
                  </div>
                  <Cloud className="w-6 h-6 text-blue-500" />
                </div>

                <div className="space-y-3 mb-4 text-sm">
                  <div>
                    <p className="text-gray-600">Coverage</p>
                    <p className="font-bold text-gray-900">GH₵{product.coverage}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Premium</p>
                    <p className="font-bold text-green-600">GH₵{product.premium}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Trigger</p>
                    <p className="font-bold text-gray-900">{product.trigger}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Season</p>
                    <p className="font-bold text-gray-900">{product.season}</p>
                  </div>
                </div>

                <Button className="w-full bg-blue-600 hover:bg-blue-700">Purchase Policy</Button>
              </Card>
            ))}
          </div>
        )}

        {/* Policies View */}
        {viewMode === "policies" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-6">
                <p className="text-gray-600 text-sm">Active Policies</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">{analytics.activePolicies}</p>
              </Card>
              <Card className="p-6">
                <p className="text-gray-600 text-sm">Total Coverage</p>
                <p className="text-3xl font-bold text-green-600 mt-2">GH₵{analytics.totalCoverage}</p>
              </Card>
              <Card className="p-6">
                <p className="text-gray-600 text-sm">Total Premiums</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">GH₵{analytics.totalPremiums}</p>
              </Card>
            </div>

            <div className="space-y-3">
              {policies.map((policy) => (
                <Card key={policy.id} className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-bold text-gray-900">{policy.product}</p>
                      <p className="text-sm text-gray-600">{policy.policyId}</p>
                    </div>
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded text-sm font-medium">
                      Active
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-4 mb-4 text-sm">
                    <div>
                      <p className="text-gray-600">Coverage</p>
                      <p className="font-bold text-gray-900">GH₵{policy.coverage}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Premium</p>
                      <p className="font-bold text-gray-900">GH₵{policy.premium}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Start Date</p>
                      <p className="font-bold text-gray-900">{policy.startDate}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">End Date</p>
                      <p className="font-bold text-gray-900">{policy.endDate}</p>
                    </div>
                  </div>

                  <Button className="w-full bg-blue-600 hover:bg-blue-700">View Details</Button>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Claims View */}
        {viewMode === "claims" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-6 bg-green-50 border-green-200">
                <p className="text-gray-600 text-sm">Total Paid</p>
                <p className="text-3xl font-bold text-green-600 mt-2">GH₵{analytics.totalPaid}</p>
              </Card>
              <Card className="p-6 bg-blue-50 border-blue-200">
                <p className="text-gray-600 text-sm">Claim Count</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">{claims.length}</p>
              </Card>
              <Card className="p-6 bg-purple-50 border-purple-200">
                <p className="text-gray-600 text-sm">ROI</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">{analytics.roi}%</p>
              </Card>
            </div>

            <div className="space-y-3">
              {claims.map((claim) => (
                <Card key={claim.id} className={`p-6 border-l-4 ${claim.status === "paid" ? "border-l-green-500 bg-green-50" : "border-l-yellow-500 bg-yellow-50"}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-bold text-gray-900">{claim.product}</p>
                      <p className="text-sm text-gray-600">{claim.claimId}</p>
                    </div>
                    <span className={`px-3 py-1 rounded text-sm font-medium ${claim.status === "paid" ? "bg-green-200 text-green-800" : "bg-yellow-200 text-yellow-800"}`}>
                      {claim.status === "paid" ? "Paid" : "Processing"}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Payout</p>
                      <p className="font-bold text-green-600">GH₵{claim.payout}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">{claim.status === "paid" ? "Payment Date" : "Est. Payout"}</p>
                      <p className="font-bold text-gray-900">{claim.paymentDate || claim.estimatedPayout}</p>
                    </div>
                    <div>
                      <Button variant="outline" className="w-full">
                        View Claim
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Monitoring View */}
        {viewMode === "monitoring" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Rainfall */}
              <Card className={`p-6 ${monitoring.rainfall.status === "critical" ? "bg-red-50 border-red-200" : "bg-blue-50 border-blue-200"}`}>
                <div className="flex items-center justify-between mb-3">
                  <p className="font-bold text-gray-900">Rainfall</p>
                  <Droplet className={`w-6 h-6 ${monitoring.rainfall.status === "critical" ? "text-red-600" : "text-blue-600"}`} />
                </div>
                <p className="text-3xl font-bold text-gray-900">{monitoring.rainfall.current}mm</p>
                <p className="text-sm text-gray-600 mt-2">Threshold: {monitoring.rainfall.threshold}mm</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                  <div
                    className={`h-2 rounded-full ${monitoring.rainfall.status === "critical" ? "bg-red-600" : "bg-blue-600"}`}
                    style={{ width: `${(monitoring.rainfall.current / monitoring.rainfall.threshold) * 100}%` }}
                  />
                </div>
                <p className={`text-xs font-bold mt-2 ${monitoring.rainfall.status === "critical" ? "text-red-600" : "text-blue-600"}`}>
                  Status: {monitoring.rainfall.status === "critical" ? "CRITICAL" : "NORMAL"}
                </p>
              </Card>

              {/* Temperature */}
              <Card className="p-6 bg-blue-50 border-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-bold text-gray-900">Temperature</p>
                  <Thermometer className="w-6 h-6 text-blue-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{monitoring.temperature.current}°C</p>
                <p className="text-sm text-gray-600 mt-2">Threshold: {monitoring.temperature.threshold}°C</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                  <div
                    className="h-2 rounded-full bg-blue-600"
                    style={{ width: `${(monitoring.temperature.current / monitoring.temperature.threshold) * 100}%` }}
                  />
                </div>
                <p className="text-xs font-bold text-blue-600 mt-2">Status: NORMAL</p>
              </Card>

              {/* Humidity */}
              <Card className="p-6 bg-blue-50 border-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-bold text-gray-900">Humidity</p>
                  <Cloud className="w-6 h-6 text-blue-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{monitoring.humidity}%</p>
                <p className="text-sm text-gray-600 mt-2">Optimal: 60-80%</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                  <div className="h-2 rounded-full bg-blue-600" style={{ width: `${monitoring.humidity}%` }} />
                </div>
                <p className="text-xs font-bold text-blue-600 mt-2">Status: OPTIMAL</p>
              </Card>
            </div>

            {/* Weather Alert */}
            <Card className="p-6 bg-red-50 border-red-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-red-600 mt-1 flex-shrink-0" />
                <div>
                  <p className="font-bold text-gray-900">Weather Alert</p>
                  <p className="text-sm text-gray-700 mt-1">Rainfall approaching threshold. Monitor closely for potential claim trigger.</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Analytics View */}
        {viewMode === "analytics" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6">
              <p className="text-gray-600 text-sm">Active Policies</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{analytics.activePolicies}</p>
            </Card>
            <Card className="p-6">
              <p className="text-gray-600 text-sm">Total Coverage</p>
              <p className="text-3xl font-bold text-green-600 mt-2">GH₵{analytics.totalCoverage}</p>
            </Card>
            <Card className="p-6">
              <p className="text-gray-600 text-sm">Return on Investment</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">{analytics.roi}%</p>
            </Card>
          </div>
        )}

        {/* Recommendations View */}
        {viewMode === "recommendations" && (
          <div className="space-y-4">
            <Card className="p-6 bg-blue-50 border-blue-200">
              <p className="font-bold text-gray-900 mb-3">Recommended Insurance Products</p>
              <p className="text-sm text-gray-700">Based on your farm location and crop types, we recommend the following coverage:</p>
            </Card>

            <Card className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-bold text-gray-900">Drought Protection</p>
                  <p className="text-sm text-gray-600">High drought risk in your region during dry season</p>
                </div>
                <span className="bg-red-100 text-red-800 px-3 py-1 rounded text-sm font-medium">High Priority</span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                <div>
                  <p className="text-gray-600">Recommended Coverage</p>
                  <p className="font-bold text-gray-900">GH₵5,000</p>
                </div>
                <div>
                  <p className="text-gray-600">Estimated Premium</p>
                  <p className="font-bold text-gray-900">GH₵250</p>
                </div>
                <div>
                  <p className="text-gray-600">Premium Rate</p>
                  <p className="font-bold text-gray-900">5%</p>
                </div>
              </div>
              <Button className="w-full bg-blue-600 hover:bg-blue-700">Purchase</Button>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default WeatherBasedCropInsurance;
