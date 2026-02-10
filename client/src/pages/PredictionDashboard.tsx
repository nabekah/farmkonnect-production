import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { AlertTriangle, TrendingUp, TrendingDown, Activity, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface CropPrediction {
  cropType: string;
  predictedYield: number;
  confidence: number;
  factors: {
    rainfall: number;
    temperature: number;
    soilHealth: number;
    fertilizer: number;
    pesticide: number;
  };
  recommendation: string;
}

interface DiseasePrediction {
  diseaseType: string;
  riskLevel: "low" | "medium" | "high";
  probability: number;
  affectedAnimals: string[];
  preventiveMeasures: string[];
  urgency: "immediate" | "soon" | "monitor";
}

interface MarketPrediction {
  productType: string;
  predictedPrice: number;
  priceChange: number;
  confidence: number;
  trend: "up" | "down" | "stable";
  recommendation: "sell_now" | "hold" | "wait";
}

export default function PredictionDashboard() {
  const [farmId] = useState("farm-1"); // Replace with actual farm ID from context
  const [activeTab, setActiveTab] = useState<"crops" | "disease" | "market">("crops");
  const [cropPredictions, setCropPredictions] = useState<CropPrediction[]>([]);
  const [diseasePredictions, setDiseasePredictions] = useState<DiseasePrediction[]>([]);
  const [marketPredictions, setMarketPredictions] = useState<MarketPrediction[]>([]);
  const [loading, setLoading] = useState(false);

  // Mock data for demonstration
  useEffect(() => {
    setLoading(true);
    
    // Simulate API calls
    setTimeout(() => {
      setCropPredictions([
        {
          cropType: "Maize",
          predictedYield: 4.5,
          confidence: 0.85,
          factors: { rainfall: 0.9, temperature: 0.95, soilHealth: 0.8, fertilizer: 0.85, pesticide: 0.7 },
          recommendation: "Excellent conditions - optimize harvest timing for maximum quality",
        },
        {
          cropType: "Wheat",
          predictedYield: 3.2,
          confidence: 0.72,
          factors: { rainfall: 0.7, temperature: 0.8, soilHealth: 0.75, fertilizer: 0.6, pesticide: 0.8 },
          recommendation: "Increase fertilizer and improve irrigation to boost yield",
        },
      ]);

      setDiseasePredictions([
        {
          diseaseType: "Newcastle Disease",
          riskLevel: "high",
          probability: 0.75,
          affectedAnimals: ["Poultry"],
          preventiveMeasures: ["Increase biosecurity", "Update vaccinations", "Monitor symptoms"],
          urgency: "immediate",
        },
        {
          diseaseType: "Mastitis",
          riskLevel: "medium",
          probability: 0.45,
          affectedAnimals: ["Cattle"],
          preventiveMeasures: ["Improve milking hygiene", "Clean housing", "Monitor milk quality"],
          urgency: "soon",
        },
      ]);

      setMarketPredictions([
        {
          productType: "Maize",
          predictedPrice: 245.5,
          priceChange: 12.3,
          confidence: 0.78,
          trend: "up",
          recommendation: "wait",
        },
        {
          productType: "Wheat",
          predictedPrice: 180.2,
          priceChange: -5.2,
          confidence: 0.65,
          trend: "down",
          recommendation: "sell_now",
        },
      ]);

      setLoading(false);
    }, 500);
  }, []);

  const getRiskColor = (level: string) => {
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

  const getTrendIcon = (trend: string) => {
    return trend === "up" ? (
      <TrendingUp className="w-4 h-4 text-green-600" />
    ) : trend === "down" ? (
      <TrendingDown className="w-4 h-4 text-red-600" />
    ) : (
      <Activity className="w-4 h-4 text-gray-600" />
    );
  };

  const getRecommendationColor = (recommendation: string) => {
    if (recommendation.includes("Excellent")) return "bg-green-50 border-green-200";
    if (recommendation.includes("Increase")) return "bg-yellow-50 border-yellow-200";
    return "bg-blue-50 border-blue-200";
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">AI Predictions</h1>
          <p className="text-gray-600 mt-1">Real-time crop, disease, and market predictions</p>
        </div>
        <Button variant="outline">Refresh Data</Button>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab("crops")}
          className={`px-4 py-2 font-medium ${
            activeTab === "crops"
              ? "border-b-2 border-green-600 text-green-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Crop Yields
        </button>
        <button
          onClick={() => setActiveTab("disease")}
          className={`px-4 py-2 font-medium ${
            activeTab === "disease"
              ? "border-b-2 border-red-600 text-red-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Disease Risk
        </button>
        <button
          onClick={() => setActiveTab("market")}
          className={`px-4 py-2 font-medium ${
            activeTab === "market"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Market Prices
        </button>
      </div>

      {/* Crop Predictions Tab */}
      {activeTab === "crops" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cropPredictions.map((crop, idx) => (
              <Card key={idx} className={`border-l-4 border-l-green-600 ${getRecommendationColor(crop.recommendation)}`}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{crop.cropType}</CardTitle>
                      <CardDescription>Yield Prediction</CardDescription>
                    </div>
                    <Badge variant="outline">{(crop.confidence * 100).toFixed(0)}% Confidence</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Predicted Yield</p>
                      <p className="text-2xl font-bold">{crop.predictedYield} tons/ha</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Confidence</p>
                      <p className="text-2xl font-bold">{(crop.confidence * 100).toFixed(0)}%</p>
                    </div>
                  </div>

                  {/* Factors Chart */}
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          { name: "Rainfall", value: crop.factors.rainfall * 100 },
                          { name: "Temp", value: crop.factors.temperature * 100 },
                          { name: "Soil", value: crop.factors.soilHealth * 100 },
                          { name: "Fert", value: crop.factors.fertilizer * 100 },
                          { name: "Pest", value: crop.factors.pesticide * 100 },
                        ]}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" fontSize={12} />
                        <YAxis fontSize={12} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#10b981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <Alert className="bg-blue-50 border-blue-200">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">{crop.recommendation}</AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Disease Risk Tab */}
      {activeTab === "disease" && (
        <div className="space-y-4">
          {diseasePredictions.map((disease, idx) => (
            <Card key={idx} className={disease.riskLevel === "high" ? "border-l-4 border-l-red-600" : ""}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    {disease.urgency === "immediate" && <AlertTriangle className="w-5 h-5 text-red-600" />}
                    <div>
                      <CardTitle>{disease.diseaseType}</CardTitle>
                      <CardDescription>Risk Assessment</CardDescription>
                    </div>
                  </div>
                  <Badge className={getRiskColor(disease.riskLevel)}>
                    {disease.riskLevel.toUpperCase()} - {(disease.probability * 100).toFixed(0)}%
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">Affected Animals</p>
                  <div className="flex gap-2 flex-wrap">
                    {disease.affectedAnimals.map((animal, i) => (
                      <Badge key={i} variant="secondary">
                        {animal}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Preventive Measures</p>
                  <ul className="space-y-1">
                    {disease.preventiveMeasures.map((measure, i) => (
                      <li key={i} className="text-sm text-gray-700 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-green-600 rounded-full"></span>
                        {measure}
                      </li>
                    ))}
                  </ul>
                </div>

                <Alert className={`${disease.urgency === "immediate" ? "bg-red-50 border-red-200" : "bg-yellow-50 border-yellow-200"}`}>
                  <AlertCircle className={`h-4 w-4 ${disease.urgency === "immediate" ? "text-red-600" : "text-yellow-600"}`} />
                  <AlertDescription className={disease.urgency === "immediate" ? "text-red-800" : "text-yellow-800"}>
                    Urgency: {disease.urgency.toUpperCase()}
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Market Prices Tab */}
      {activeTab === "market" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {marketPredictions.map((market, idx) => (
            <Card key={idx}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{market.productType}</CardTitle>
                    <CardDescription>Price Prediction</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {getTrendIcon(market.trend)}
                    <Badge variant="outline">{(market.confidence * 100).toFixed(0)}%</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Predicted Price</p>
                    <p className="text-2xl font-bold">${market.predictedPrice.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Expected Change</p>
                    <p className={`text-2xl font-bold ${market.priceChange > 0 ? "text-green-600" : "text-red-600"}`}>
                      {market.priceChange > 0 ? "+" : ""}{market.priceChange.toFixed(1)}%
                    </p>
                  </div>
                </div>

                <Alert className={market.recommendation === "sell_now" ? "bg-red-50 border-red-200" : market.recommendation === "wait" ? "bg-green-50 border-green-200" : "bg-blue-50 border-blue-200"}>
                  <AlertCircle className={`h-4 w-4 ${market.recommendation === "sell_now" ? "text-red-600" : market.recommendation === "wait" ? "text-green-600" : "text-blue-600"}`} />
                  <AlertDescription className={market.recommendation === "sell_now" ? "text-red-800" : market.recommendation === "wait" ? "text-green-800" : "text-blue-800"}>
                    Recommendation: {market.recommendation.toUpperCase().replace("_", " ")}
                  </AlertDescription>
                </Alert>

                <Button className="w-full" variant={market.recommendation === "sell_now" ? "default" : "outline"}>
                  {market.recommendation === "sell_now" ? "Sell Now" : market.recommendation === "wait" ? "Hold & Monitor" : "View Market"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
