import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Brain, TrendingUp, Calendar, AlertTriangle, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function PredictiveAnalytics() {
  const [selectedAnimalId, setSelectedAnimalId] = useState<number | null>(null);
  const [selectedPondId, setSelectedPondId] = useState<number | null>(null);

  // Fetch data for dropdowns
  const { data: animals = [] } = trpc.livestock.animals.list.useQuery({ farmId: 1 });
  const { data: ponds = [] } = trpc.fishFarming.ponds.list.useQuery({ farmId: 1 });

  // Predictions
  const { data: healthPrediction, isLoading: healthLoading, refetch: refetchHealth } = trpc.analytics.predictLivestockHealth.useQuery(
    { animalId: selectedAnimalId! },
    { enabled: !!selectedAnimalId }
  );

  const { data: feedOptimization, isLoading: feedLoading, refetch: refetchFeed } = trpc.analytics.optimizeFeedCosts.useQuery(
    { farmId: 1 },
    { enabled: true }
  );

  const { data: harvestPrediction, isLoading: harvestLoading, refetch: refetchHarvest } = trpc.analytics.predictHarvestTime.useQuery(
    { pondId: selectedPondId! },
    { enabled: !!selectedPondId }
  );

  const getHealthStatusIcon = (prediction: string) => {
    switch (prediction) {
      case 'healthy':
        return <CheckCircle2 className="h-8 w-8 text-green-500" />;
      case 'at_risk':
        return <AlertTriangle className="h-8 w-8 text-yellow-500" />;
      case 'critical':
        return <XCircle className="h-8 w-8 text-red-500" />;
      default:
        return <Brain className="h-8 w-8 text-gray-400" />;
    }
  };

  const getHealthStatusColor = (prediction: string) => {
    switch (prediction) {
      case 'healthy':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'at_risk':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="container py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Brain className="h-8 w-8 text-purple-600" />
          Predictive Analytics
        </h1>
        <p className="text-muted-foreground mt-2">
          AI-powered insights to optimize farm operations and predict future outcomes
        </p>
      </div>

      {/* Livestock Health Prediction */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-blue-600" />
            Livestock Health Prediction
          </CardTitle>
          <CardDescription>
            Analyze historical health data to predict animal health status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Select Animal</label>
              <Select
                value={selectedAnimalId?.toString() || ""}
                onValueChange={(value) => setSelectedAnimalId(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose an animal" />
                </SelectTrigger>
                <SelectContent>
                  {animals.map((animal: any) => (
                    <SelectItem key={animal.id} value={animal.id.toString()}>
                      {animal.tagNumber} - {animal.breed}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={() => refetchHealth()} disabled={!selectedAnimalId || healthLoading}>
                {healthLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Analyze"}
              </Button>
            </div>
          </div>

          {healthPrediction && healthPrediction.prediction !== 'insufficient_data' && (
            <div className="space-y-4 mt-6">
              <div className={`p-6 rounded-lg border-2 ${getHealthStatusColor(healthPrediction.prediction)}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {getHealthStatusIcon(healthPrediction.prediction)}
                    <div>
                      <h3 className="text-xl font-bold capitalize">{healthPrediction.prediction.replace('_', ' ')}</h3>
                      <p className="text-sm opacity-80">Health Status Prediction</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold">{Math.round(healthPrediction.healthScore * 100)}%</div>
                    <div className="text-sm opacity-80">Health Score</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Confidence Level</span>
                    <span className="font-medium">{Math.round(healthPrediction.confidence * 100)}%</span>
                  </div>
                  <Progress value={healthPrediction.confidence * 100} className="h-2" />
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Recommendations
                </h4>
                <ul className="space-y-2">
                  {healthPrediction.recommendations.map((rec: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span className="text-sm">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {healthPrediction?.prediction === 'insufficient_data' && (
            <div className="text-center py-8 text-muted-foreground">
              <Brain className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>{healthPrediction.message}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Feed Cost Optimization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Feed Cost Optimization
          </CardTitle>
          <CardDescription>
            Analyze feed expenses and identify cost-saving opportunities
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={() => refetchFeed()} disabled={feedLoading}>
            {feedLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Analyze Feed Costs
          </Button>

          {feedOptimization && feedOptimization.currentCost > 0 && (
            <div className="space-y-4 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-200">
                  <div className="text-sm text-blue-600 mb-1">Current 90-Day Cost</div>
                  <div className="text-3xl font-bold text-blue-900">
                    GH₵{feedOptimization.currentCost.toLocaleString()}
                  </div>
                </div>
                <div className="bg-green-50 p-6 rounded-lg border-2 border-green-200">
                  <div className="text-sm text-green-600 mb-1">Potential Savings</div>
                  <div className="text-3xl font-bold text-green-900">
                    GH₵{feedOptimization.estimatedSavings.toLocaleString()}
                  </div>
                  <div className="text-sm text-green-600 mt-1">
                    ({Math.round((feedOptimization.estimatedSavings / feedOptimization.currentCost) * 100)}% reduction)
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-4">Optimization Recommendations</h4>
                <div className="space-y-3">
                  {feedOptimization.recommendations.map((rec: any, idx: number) => (
                    <div key={idx} className="bg-white p-4 rounded-lg border">
                      <div className="flex justify-between items-start mb-2">
                        <h5 className="font-medium">{rec.action}</h5>
                        <span className="text-green-600 font-bold">GH₵{rec.savings.toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{rec.impact}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Harvest Time Prediction */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-orange-600" />
            Optimal Harvest Time Prediction
          </CardTitle>
          <CardDescription>
            Predict the best time to harvest based on growth data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Select Pond</label>
              <Select
                value={selectedPondId?.toString() || ""}
                onValueChange={(value) => setSelectedPondId(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a pond" />
                </SelectTrigger>
                <SelectContent>
                  {ponds.map((pond: any) => (
                    <SelectItem key={pond.id} value={pond.id.toString()}>
                      {pond.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={() => refetchHarvest()} disabled={!selectedPondId || harvestLoading}>
                {harvestLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Predict"}
              </Button>
            </div>
          </div>

          {harvestPrediction && harvestPrediction.prediction === 'ready' && (
            <div className="space-y-4 mt-6">
              <div className="bg-orange-50 p-6 rounded-lg border-2 border-orange-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-orange-600 mb-1">Optimal Harvest Date</div>
                    <div className="text-xl font-bold text-orange-900">
                      {harvestPrediction.optimalHarvestDate ? new Date(harvestPrediction.optimalHarvestDate).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-orange-600 mb-1">Days Until Harvest</div>
                    <div className="text-xl font-bold text-orange-900">
                      {harvestPrediction.daysUntilHarvest} days
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-orange-600 mb-1">Estimated Weight</div>
                    <div className="text-xl font-bold text-orange-900">
                      {harvestPrediction.currentEstimatedWeight}g / {harvestPrediction.targetWeight}g
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-orange-600">Confidence Level</span>
                    <span className="font-medium text-orange-900">{Math.round(harvestPrediction.confidence * 100)}%</span>
                  </div>
                  <Progress value={harvestPrediction.confidence * 100} className="h-2" />
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-3">Pre-Harvest Checklist</h4>
                <ul className="space-y-2">
                  {(harvestPrediction.recommendations || []).map((rec: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-orange-600 mt-1">•</span>
                      <span className="text-sm">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {harvestPrediction && harvestPrediction.prediction !== 'ready' && (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>{harvestPrediction.message || 'No prediction available'}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
