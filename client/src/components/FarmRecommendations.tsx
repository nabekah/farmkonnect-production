import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Lightbulb,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Droplets,
  Leaf,
  Thermometer,
  Zap,
} from "lucide-react";

interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  category: "irrigation" | "fertilization" | "pest" | "weather" | "efficiency" | "health";
  actionUrl?: string;
  icon?: React.ReactNode;
}

interface FarmRecommendationsProps {
  farmId?: number;
  farmName?: string;
  cropType?: string;
  soilType?: string;
  weatherCondition?: string;
  recommendations?: Recommendation[];
}

/**
 * Farm Recommendations Component
 * Displays AI-generated recommendations based on farm conditions
 */
export function FarmRecommendations({
  farmId,
  farmName = "Your Farm",
  cropType = "Mixed Crops",
  soilType = "Loamy",
  weatherCondition = "Moderate",
  recommendations: customRecommendations,
}: FarmRecommendationsProps) {
  // Generate default recommendations based on farm conditions
  const defaultRecommendations: Recommendation[] = [
    {
      id: "irrigation-1",
      title: "Increase Irrigation Schedule",
      description: `Based on current weather conditions (${weatherCondition}), increase irrigation frequency to maintain optimal soil moisture for ${cropType}.`,
      priority: "high",
      category: "irrigation",
      icon: <Droplets className="w-5 h-5" />,
    },
    {
      id: "fertilization-1",
      title: "Apply Nitrogen Fertilizer",
      description: `${cropType} in ${soilType} soil requires nitrogen application during this growth phase. Consider applying in the next 2-3 days.`,
      priority: "medium",
      category: "fertilization",
      icon: <Leaf className="w-5 h-5" />,
    },
    {
      id: "pest-1",
      title: "Monitor for Pest Activity",
      description: "Current weather conditions are favorable for common crop pests. Conduct field inspections and consider preventive measures.",
      priority: "medium",
      category: "pest",
      icon: <AlertCircle className="w-5 h-5" />,
    },
    {
      id: "efficiency-1",
      title: "Optimize Equipment Usage",
      description: "Schedule equipment maintenance during low-activity hours to maximize field preparation efficiency.",
      priority: "low",
      category: "efficiency",
      icon: <Zap className="w-5 h-5" />,
    },
    {
      id: "health-1",
      title: "Soil Health Assessment",
      description: `Conduct soil testing to assess nutrient levels and pH balance for ${soilType} soil. Results will guide fertilization strategy.`,
      priority: "medium",
      category: "health",
      icon: <Thermometer className="w-5 h-5" />,
    },
  ];

  const recommendations = customRecommendations || defaultRecommendations;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
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

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "irrigation":
        return <Droplets className="w-4 h-4" />;
      case "fertilization":
        return <Leaf className="w-4 h-4" />;
      case "pest":
        return <AlertCircle className="w-4 h-4" />;
      case "weather":
        return <Thermometer className="w-4 h-4" />;
      case "efficiency":
        return <Zap className="w-4 h-4" />;
      case "health":
        return <CheckCircle2 className="w-4 h-4" />;
      default:
        return <Lightbulb className="w-4 h-4" />;
    }
  };

  const highPriorityCount = recommendations.filter((r) => r.priority === "high").length;
  const mediumPriorityCount = recommendations.filter((r) => r.priority === "medium").length;

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              Farm Recommendations
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              AI-powered insights for {farmName}
            </p>
          </div>
          <div className="flex gap-2">
            {highPriorityCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {highPriorityCount} High Priority
              </Badge>
            )}
            {mediumPriorityCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {mediumPriorityCount} Medium
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Farm Info Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4 p-3 bg-muted rounded-lg">
            <div className="text-xs">
              <p className="text-muted-foreground">Crop Type</p>
              <p className="font-medium">{cropType}</p>
            </div>
            <div className="text-xs">
              <p className="text-muted-foreground">Soil Type</p>
              <p className="font-medium">{soilType}</p>
            </div>
            <div className="text-xs">
              <p className="text-muted-foreground">Weather</p>
              <p className="font-medium">{weatherCondition}</p>
            </div>
            <div className="text-xs">
              <p className="text-muted-foreground">Recommendations</p>
              <p className="font-medium">{recommendations.length} Total</p>
            </div>
          </div>

          {/* Recommendations List */}
          <div className="space-y-3">
            {recommendations.map((rec) => (
              <div
                key={rec.id}
                className="p-3 border rounded-lg hover:bg-muted/50 transition-colors animate-slide-up"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5 text-muted-foreground">
                    {rec.icon || getCategoryIcon(rec.category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm">{rec.title}</h4>
                      <Badge className={`text-xs ${getPriorityColor(rec.priority)}`}>
                        {rec.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{rec.description}</p>
                    {rec.actionUrl && (
                      <a
                        href={rec.actionUrl}
                        className="text-xs text-primary hover:underline mt-2 inline-block"
                      >
                        Take Action →
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {recommendations.length === 0 && (
            <div className="text-center py-6">
              <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                No recommendations at this time. Farm is operating optimally!
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
