import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  BarChart3,
  Leaf,
  DollarSign,
  Calendar,
  Droplet,
  CheckCircle,
} from "lucide-react";

/**
 * Crop Variety Recommendation Engine Component
 * Suggests optimal crop varieties based on soil, weather, market demand, and expertise
 */
export const CropVarietyRecommendation: React.FC = () => {
  const [viewMode, setViewMode] = useState<
    "recommendations" | "details" | "compare" | "market" | "rotation" | "history"
  >("recommendations");
  const [selectedVariety, setSelectedVariety] = useState<string>("ZM623");

  // Mock data
  const recommendations = [
    {
      id: 1,
      cropName: "Maize",
      variety: "ZM623",
      suitability: 95,
      reason: "Excellent match for your soil and climate conditions",
      expectedYield: "8-10 tons/ha",
      marketPrice: "GH₵ 2,500/bag",
      demand: "High",
      maturityDays: 120,
      waterRequirement: "600-800mm",
      soilPH: "6.0-7.0",
      profitMargin: "35%",
    },
    {
      id: 2,
      cropName: "Rice",
      variety: "NERICA 4",
      suitability: 88,
      reason: "Good performance in your rainfall zone",
      expectedYield: "6-7 tons/ha",
      marketPrice: "GH₵ 3,200/bag",
      demand: "Very High",
      maturityDays: 90,
      waterRequirement: "1000-1500mm",
      soilPH: "5.5-7.0",
      profitMargin: "40%",
    },
    {
      id: 3,
      cropName: "Beans",
      variety: "Adzuki",
      suitability: 82,
      reason: "Suitable for crop rotation and soil improvement",
      expectedYield: "2-3 tons/ha",
      marketPrice: "GH₵ 4,500/bag",
      demand: "Medium",
      maturityDays: 75,
      waterRequirement: "400-600mm",
      soilPH: "6.0-7.5",
      profitMargin: "45%",
    },
  ];

  const varietyDetails = {
    name: "ZM623 Maize",
    origin: "Zimbabwe",
    characteristics: {
      plantHeight: "180-200cm",
      earHeight: "80-100cm",
      cob: "Red",
      kernelColor: "Yellow",
    },
    agronomicTraits: {
      maturity: "120 days",
      plantDensity: "25,000-30,000 plants/ha",
      rowSpacing: "75cm",
      plantSpacing: "25cm",
    },
    yieldPotential: {
      averageYield: "8-10 tons/ha",
      potentialYield: "12-14 tons/ha",
    },
    diseaseResistance: {
      turcicum: "Moderate",
      blight: "Moderate",
      rust: "Susceptible",
    },
  };

  const marketDemand = [
    {
      crop: "Rice",
      demand: "Very High",
      trend: "Increasing",
      avgPrice: "GH₵ 3,200/bag",
      priceChange: "+5% YoY",
      buyersCount: 45,
    },
    {
      crop: "Maize",
      demand: "High",
      trend: "Stable",
      avgPrice: "GH₵ 2,500/bag",
      priceChange: "+2% YoY",
      buyersCount: 38,
    },
    {
      crop: "Beans",
      demand: "Medium",
      trend: "Increasing",
      avgPrice: "GH₵ 4,500/bag",
      priceChange: "+8% YoY",
      buyersCount: 22,
    },
  ];

  const rotationPlan = [
    {
      year: 1,
      crop: "Maize",
      benefit: "Nitrogen depletion",
      soilImpact: "Negative",
    },
    {
      year: 2,
      crop: "Beans",
      benefit: "Nitrogen fixation",
      soilImpact: "Positive",
    },
    {
      year: 3,
      crop: "Groundnuts",
      benefit: "Nitrogen fixation + pest break",
      soilImpact: "Positive",
    },
  ];

  const performanceHistory = [
    {
      season: "2025 Main Season",
      areaPlanted: "2 hectares",
      yield: "18 tons",
      yieldPerHa: "9 tons/ha",
      revenue: "GH₵ 45,000",
      profit: "GH₵ 27,000",
      rating: 4.5,
    },
    {
      season: "2024 Main Season",
      areaPlanted: "1.5 hectares",
      yield: "12 tons",
      yieldPerHa: "8 tons/ha",
      revenue: "GH₵ 30,000",
      profit: "GH₵ 18,000",
      rating: 4,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Crop Variety Recommendation Engine
            </h1>
            <p className="text-gray-600 mt-1">
              Find the best crop varieties for your farm conditions
            </p>
          </div>
          <Leaf className="w-12 h-12 text-green-600 opacity-20" />
        </div>

        {/* View Mode Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          <Button
            onClick={() => setViewMode("recommendations")}
            variant={viewMode === "recommendations" ? "default" : "outline"}
            className={viewMode === "recommendations" ? "bg-green-600 text-white" : ""}
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Recommendations
          </Button>
          <Button
            onClick={() => setViewMode("details")}
            variant={viewMode === "details" ? "default" : "outline"}
            className={viewMode === "details" ? "bg-green-600 text-white" : ""}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Details
          </Button>
          <Button
            onClick={() => setViewMode("market")}
            variant={viewMode === "market" ? "default" : "outline"}
            className={viewMode === "market" ? "bg-green-600 text-white" : ""}
          >
            <DollarSign className="w-4 h-4 mr-2" />
            Market Demand
          </Button>
          <Button
            onClick={() => setViewMode("rotation")}
            variant={viewMode === "rotation" ? "default" : "outline"}
            className={viewMode === "rotation" ? "bg-green-600 text-white" : ""}
          >
            <Leaf className="w-4 h-4 mr-2" />
            Rotation Plan
          </Button>
          <Button
            onClick={() => setViewMode("history")}
            variant={viewMode === "history" ? "default" : "outline"}
            className={viewMode === "history" ? "bg-green-600 text-white" : ""}
          >
            <Calendar className="w-4 h-4 mr-2" />
            History
          </Button>
        </div>

        {/* Recommendations View */}
        {viewMode === "recommendations" && (
          <div className="space-y-4">
            {recommendations.map((rec) => (
              <Card
                key={rec.id}
                className="p-6 border-l-4 border-l-green-600 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="font-bold text-gray-900 text-lg">{rec.cropName}</p>
                    <p className="text-sm text-gray-600 mt-1">{rec.variety}</p>
                    <p className="text-sm text-gray-700 mt-2">{rec.reason}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-green-600">{rec.suitability}%</div>
                    <p className="text-xs text-gray-600">Suitability</p>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-3 mb-4 text-sm">
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-gray-600">Expected Yield</p>
                    <p className="font-bold text-gray-900">{rec.expectedYield}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-gray-600">Market Price</p>
                    <p className="font-bold text-gray-900">{rec.marketPrice}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-gray-600">Profit Margin</p>
                    <p className="font-bold text-green-600">{rec.profitMargin}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-gray-600">Demand Level</p>
                    <p className="font-bold text-gray-900">{rec.demand}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4 text-sm">
                  <div>
                    <p className="text-gray-600">Maturity</p>
                    <p className="font-bold text-gray-900">{rec.maturityDays} days</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Water Requirement</p>
                    <p className="font-bold text-gray-900">{rec.waterRequirement}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Soil pH</p>
                    <p className="font-bold text-gray-900">{rec.soilPH}</p>
                  </div>
                </div>

                <Button
                  onClick={() => {
                    setSelectedVariety(rec.variety);
                    setViewMode("details");
                  }}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  View Details
                </Button>
              </Card>
            ))}
          </div>
        )}

        {/* Details View */}
        {viewMode === "details" && (
          <Card className="p-6">
            <p className="font-bold text-gray-900 text-lg mb-4">{varietyDetails.name}</p>

            <div className="space-y-6">
              <div>
                <p className="font-bold text-gray-900 mb-3">Characteristics</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-gray-600">Plant Height</p>
                    <p className="font-bold text-gray-900">
                      {varietyDetails.characteristics.plantHeight}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-gray-600">Ear Height</p>
                    <p className="font-bold text-gray-900">
                      {varietyDetails.characteristics.earHeight}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-gray-600">Cob Color</p>
                    <p className="font-bold text-gray-900">{varietyDetails.characteristics.cob}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-gray-600">Kernel Color</p>
                    <p className="font-bold text-gray-900">
                      {varietyDetails.characteristics.kernelColor}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <p className="font-bold text-gray-900 mb-3">Agronomic Traits</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-gray-600">Maturity</p>
                    <p className="font-bold text-gray-900">
                      {varietyDetails.agronomicTraits.maturity}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-gray-600">Plant Density</p>
                    <p className="font-bold text-gray-900">
                      {varietyDetails.agronomicTraits.plantDensity}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-gray-600">Row Spacing</p>
                    <p className="font-bold text-gray-900">
                      {varietyDetails.agronomicTraits.rowSpacing}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-gray-600">Plant Spacing</p>
                    <p className="font-bold text-gray-900">
                      {varietyDetails.agronomicTraits.plantSpacing}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <p className="font-bold text-gray-900 mb-3">Yield Potential</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 bg-green-50 rounded border border-green-200">
                    <p className="text-gray-600">Average Yield</p>
                    <p className="font-bold text-green-700">
                      {varietyDetails.yieldPotential.averageYield}
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 rounded border border-green-200">
                    <p className="text-gray-600">Potential Yield</p>
                    <p className="font-bold text-green-700">
                      {varietyDetails.yieldPotential.potentialYield}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <p className="font-bold text-gray-900 mb-3">Disease Resistance</p>
                <div className="space-y-2 text-sm">
                  {Object.entries(varietyDetails.diseaseResistance).map(([disease, level]) => (
                    <div key={disease} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <p className="text-gray-700 capitalize">{disease.replace("_", " ")}</p>
                      <span
                        className={`px-3 py-1 rounded font-bold text-xs ${
                          level === "High"
                            ? "bg-green-200 text-green-800"
                            : level === "Moderate"
                            ? "bg-yellow-200 text-yellow-800"
                            : "bg-red-200 text-red-800"
                        }`}
                      >
                        {level}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Market Demand View */}
        {viewMode === "market" && (
          <div className="space-y-4">
            {marketDemand.map((item, idx) => (
              <Card key={idx} className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-bold text-gray-900 text-lg">{item.crop}</p>
                  <span
                    className={`px-3 py-1 rounded font-bold text-sm ${
                      item.demand === "Very High"
                        ? "bg-green-200 text-green-800"
                        : item.demand === "High"
                        ? "bg-blue-200 text-blue-800"
                        : "bg-gray-200 text-gray-800"
                    }`}
                  >
                    {item.demand} Demand
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-3 text-sm">
                  <div>
                    <p className="text-gray-600">Avg Price</p>
                    <p className="font-bold text-gray-900">{item.avgPrice}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Price Trend</p>
                    <p className="font-bold text-green-600">{item.priceChange}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Market Trend</p>
                    <p className="font-bold text-gray-900">{item.trend}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Active Buyers</p>
                    <p className="font-bold text-gray-900">{item.buyersCount}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Rotation Plan View */}
        {viewMode === "rotation" && (
          <div className="space-y-4">
            {rotationPlan.map((plan, idx) => (
              <Card
                key={idx}
                className={`p-6 border-l-4 ${
                  plan.soilImpact === "Positive"
                    ? "bg-green-50 border-l-green-600"
                    : "bg-yellow-50 border-l-yellow-600"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-bold text-gray-900">Year {plan.year}: {plan.crop}</p>
                    <p className="text-sm text-gray-600 mt-1">{plan.benefit}</p>
                  </div>
                  <CheckCircle
                    className={`w-6 h-6 ${
                      plan.soilImpact === "Positive" ? "text-green-600" : "text-yellow-600"
                    }`}
                  />
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <span className="font-bold text-gray-900">Soil Impact:</span>
                  <span
                    className={`px-2 py-1 rounded text-xs font-bold ${
                      plan.soilImpact === "Positive"
                        ? "bg-green-200 text-green-800"
                        : "bg-yellow-200 text-yellow-800"
                    }`}
                  >
                    {plan.soilImpact}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* History View */}
        {viewMode === "history" && (
          <div className="space-y-4">
            {performanceHistory.map((item, idx) => (
              <Card key={idx} className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-gray-900">{item.season}</p>
                    <p className="text-sm text-gray-600">Area: {item.areaPlanted}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">⭐ {item.rating}</p>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-3 text-sm">
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-gray-600">Total Yield</p>
                    <p className="font-bold text-gray-900">{item.yield}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-gray-600">Yield/Ha</p>
                    <p className="font-bold text-green-600">{item.yieldPerHa}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-gray-600">Revenue</p>
                    <p className="font-bold text-gray-900">{item.revenue}</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded">
                    <p className="text-gray-600">Profit</p>
                    <p className="font-bold text-green-700">{item.profit}</p>
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

export default CropVarietyRecommendation;
