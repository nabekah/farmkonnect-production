import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Cloud, Droplets, Wind, AlertTriangle, ThermometerSun, Eye } from "lucide-react";

interface WeatherWidgetProps {
  farmId?: number;
  latitude: number;
  longitude: number;
  showForecast?: boolean;
}

export function WeatherWidget({ farmId, latitude, longitude, showForecast = false }: WeatherWidgetProps) {
  const [selectedCrop, setSelectedCrop] = useState<string>("wheat");

  // Check if coordinates are valid
  const hasValidCoordinates = typeof latitude === 'number' && typeof longitude === 'number' && !isNaN(latitude) && !isNaN(longitude);

  // Queries - only fetch if coordinates are valid
  const { data: currentWeather, isLoading: weatherLoading } = trpc.weather.getCurrentWeather.useQuery(
    {
      latitude: latitude || 0,
      longitude: longitude || 0,
    },
    {
      enabled: hasValidCoordinates,
    }
  );

  const { data: forecast } = trpc.weather.getForecast.useQuery(
    {
      latitude: latitude || 0,
      longitude: longitude || 0,
      days: 5,
    },
    {
      enabled: showForecast && hasValidCoordinates,
    }
  );

  const { data: alerts } = trpc.weather.getWeatherAlerts.useQuery(
    {
      latitude: latitude || 0,
      longitude: longitude || 0,
    },
    {
      enabled: hasValidCoordinates,
    }
  );

  const { data: cropRecommendations } = trpc.weather.getCropRecommendations.useQuery(
    {
      cropType: selectedCrop,
      latitude: latitude || 0,
      longitude: longitude || 0,
    },
    {
      enabled: hasValidCoordinates,
    }
  );

  if (weatherLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Weather</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading weather data...</p>
        </CardContent>
      </Card>
    );
  }

  if (!currentWeather) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Weather</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Weather data unavailable</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Current Weather Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            Current Weather
          </CardTitle>
          <CardDescription>Real-time conditions for your farm location</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 text-muted-foreground">
                <ThermometerSun className="h-4 w-4" />
                <span className="text-sm">Temperature</span>
              </div>
              <p className="text-2xl font-bold">{currentWeather.temperature.toFixed(1)}°C</p>
              <p className="text-xs text-muted-foreground">Feels like {currentWeather.feelsLike.toFixed(1)}°C</p>
            </div>
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Droplets className="h-4 w-4" />
                <span className="text-sm">Humidity</span>
              </div>
              <p className="text-2xl font-bold">{currentWeather.humidity}%</p>
              <p className="text-xs text-muted-foreground">{currentWeather.pressure} hPa</p>
            </div>
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Wind className="h-4 w-4" />
                <span className="text-sm">Wind Speed</span>
              </div>
              <p className="text-2xl font-bold">{currentWeather.windSpeed.toFixed(1)} m/s</p>
              <p className="text-xs text-muted-foreground">{currentWeather.cloudiness}% clouds</p>
            </div>
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Eye className="h-4 w-4" />
                <span className="text-sm">Conditions</span>
              </div>
              <p className="text-lg font-semibold capitalize">{currentWeather.description}</p>
              <div className="flex gap-1 text-xs text-muted-foreground">
                <span>☀️ {new Date(currentWeather.sunrise).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                <span>🌙 {new Date(currentWeather.sunset).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weather Alerts */}
      {alerts && alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Weather Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {alerts.map((alert: any, index: number) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    alert.severity === "critical"
                      ? "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800"
                      : alert.severity === "warning"
                      ? "bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800"
                      : "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium capitalize">{alert.type.replace(/_/g, " ")}</p>
                      <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                    </div>
                    <Badge
                      variant={alert.severity === "critical" ? "destructive" : "secondary"}
                    >
                      {alert.severity}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Crop Recommendations */}
      {cropRecommendations && cropRecommendations.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Agricultural Recommendations
              <span className="text-sm font-normal text-muted-foreground">• Weather-based farming advice</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {cropRecommendations.recommendations.map((rec: any, index: number) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    rec.priority === "high"
                      ? "bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800"
                      : "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium capitalize">{rec.action.replace(/_/g, " ")}</p>
                      <p className="text-sm text-muted-foreground mt-1">{rec.message}</p>
                    </div>
                    <Badge variant={rec.priority === "high" ? "destructive" : "secondary"}>
                      {rec.priority}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 5-Day Forecast */}
      {showForecast && forecast && forecast.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>5-Day Forecast</CardTitle>
            <CardDescription>Upcoming weather conditions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex overflow-x-auto gap-3 pb-2 md:grid md:grid-cols-5 snap-x snap-mandatory touch-pan-x scrollbar-hide">
              {forecast.slice(0, 5).map((day: any, index: number) => (
                <div key={index} className="p-3 rounded-lg border bg-card text-center min-w-[140px] md:min-w-0 flex-shrink-0 snap-center">
                  <p className="text-sm font-medium">
                    {new Date(day.timestamp).toLocaleDateString([], { weekday: "short" })}
                  </p>
                  <p className="text-xs text-muted-foreground mb-2">
                    {new Date(day.timestamp).toLocaleDateString([], { month: "short", day: "numeric" })}
                  </p>
                  <p className="text-2xl font-bold">{day.temperature.toFixed(0)}°C</p>
                  <p className="text-xs capitalize text-muted-foreground mt-1">{day.description}</p>
                  <div className="flex items-center justify-center gap-2 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Droplets className="h-3 w-3" />
                      {day.humidity}%
                    </span>
                    <span className="flex items-center gap-1">
                      <Wind className="h-3 w-3" />
                      {day.windSpeed.toFixed(1)}
                    </span>
                  </div>
                  {day.rainProbability > 30 && (
                    <Badge variant="secondary" className="mt-2 text-xs">
                      {day.rainProbability.toFixed(0)}% rain
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
