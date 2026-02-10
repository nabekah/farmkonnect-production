import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Droplets,
  Cloud,
  Thermometer,
  Wind,
  Zap,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  Settings,
  Play,
  Pause,
  Plus,
  BarChart3,
} from "lucide-react";

/**
 * Weather-Based Irrigation Automation Component
 * Automated scheduling with sensor integration and cost optimization
 */
export const WeatherIrrigationAutomation: React.FC = () => {
  const [viewMode, setViewMode] = useState<
    "dashboard" | "schedule" | "sensors" | "weather" | "analytics" | "settings"
  >("dashboard");
  const [autoMode, setAutoMode] = useState(true);

  // Mock schedule data
  const schedule = [
    {
      day: "Monday",
      time: "06:00",
      duration: 45,
      waterVolume: 500,
      reason: "Soil moisture below threshold",
      confidence: 92,
    },
    {
      day: "Wednesday",
      time: "06:00",
      duration: 30,
      waterVolume: 350,
      reason: "Moderate soil moisture",
      confidence: 88,
    },
    {
      day: "Friday",
      time: "06:00",
      duration: 60,
      waterVolume: 600,
      reason: "High evapotranspiration",
      confidence: 90,
    },
  ];

  // Mock sensor data
  const sensors = [
    {
      id: 1,
      type: "Soil Moisture",
      location: "Zone A",
      value: 35,
      unit: "%",
      threshold: 40,
      status: "low",
    },
    {
      id: 2,
      type: "Soil Moisture",
      location: "Zone B",
      value: 55,
      unit: "%",
      threshold: 40,
      status: "optimal",
    },
    {
      id: 3,
      type: "Temperature",
      location: "Field Center",
      value: 28.5,
      unit: "°C",
      threshold: 30,
      status: "normal",
    },
    {
      id: 4,
      type: "Humidity",
      location: "Field Center",
      value: 65,
      unit: "%",
      threshold: 70,
      status: "normal",
    },
  ];

  // Mock weather forecast
  const forecast = [
    {
      date: "2026-02-10",
      condition: "Partly Cloudy",
      high: 32,
      low: 24,
      rainfall: 0,
      humidity: 60,
      windSpeed: 12,
      irrigationRequired: true,
    },
    {
      date: "2026-02-11",
      condition: "Rainy",
      high: 28,
      low: 22,
      rainfall: 25,
      humidity: 85,
      windSpeed: 8,
      irrigationRequired: false,
    },
    {
      date: "2026-02-12",
      condition: "Sunny",
      high: 35,
      low: 26,
      rainfall: 0,
      humidity: 50,
      windSpeed: 15,
      irrigationRequired: true,
    },
  ];

  // Mock analytics
  const analytics = {
    totalWaterUsed: 4850,
    averagePerDay: 692,
    totalCost: 7275,
    waterSavings: 1200,
    savingsPercentage: 19.8,
    efficiency: 82,
  };

  // Mock recommendations
  const recommendations = [
    {
      id: 1,
      title: "Optimize Irrigation Timing",
      description: "Water early morning (5-7 AM) to reduce evaporation",
      potentialSavings: 15,
      priority: "high",
    },
    {
      id: 2,
      title: "Install Soil Moisture Sensors",
      description: "Reduce overwatering with real-time soil monitoring",
      potentialSavings: 25,
      priority: "high",
    },
    {
      id: 3,
      title: "Switch to Drip Irrigation",
      description: "More efficient than sprinkler irrigation",
      potentialSavings: 30,
      priority: "medium",
    },
  ];

  const getSensorStatusColor = (status: string) => {
    switch (status) {
      case "low":
        return "bg-red-100 text-red-800 border-red-300";
      case "optimal":
        return "bg-green-100 text-green-800 border-green-300";
      case "normal":
        return "bg-blue-100 text-blue-800 border-blue-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getSensorIcon = (type: string) => {
    switch (type) {
      case "Soil Moisture":
        return <Droplets className="w-5 h-5" />;
      case "Temperature":
        return <Thermometer className="w-5 h-5" />;
      case "Humidity":
        return <Cloud className="w-5 h-5" />;
      default:
        return <Zap className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Irrigation Automation</h1>
            <p className="text-gray-600 mt-1">Weather-based scheduling with sensor integration and cost optimization</p>
          </div>
          <Droplets className="w-12 h-12 text-blue-600 opacity-20" />
        </div>

        {/* Auto Mode Toggle */}
        <Card className="p-4 mb-6 flex items-center justify-between bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <div>
            <p className="font-bold text-gray-900">Automatic Mode</p>
            <p className="text-sm text-gray-600">System automatically adjusts irrigation based on weather and sensors</p>
          </div>
          <Button
            onClick={() => setAutoMode(!autoMode)}
            className={autoMode ? "bg-green-600 hover:bg-green-700" : "bg-gray-400 hover:bg-gray-500"}
          >
            {autoMode ? <Zap className="w-4 h-4 mr-2" /> : <Pause className="w-4 h-4 mr-2" />}
            {autoMode ? "ON" : "OFF"}
          </Button>
        </Card>

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
            onClick={() => setViewMode("schedule")}
            variant={viewMode === "schedule" ? "default" : "outline"}
            className={viewMode === "schedule" ? "bg-blue-600 text-white" : ""}
          >
            <Clock className="w-4 h-4 mr-2" />
            Schedule
          </Button>
          <Button
            onClick={() => setViewMode("sensors")}
            variant={viewMode === "sensors" ? "default" : "outline"}
            className={viewMode === "sensors" ? "bg-blue-600 text-white" : ""}
          >
            <Zap className="w-4 h-4 mr-2" />
            Sensors
          </Button>
          <Button
            onClick={() => setViewMode("weather")}
            variant={viewMode === "weather" ? "default" : "outline"}
            className={viewMode === "weather" ? "bg-blue-600 text-white" : ""}
          >
            <Cloud className="w-4 h-4 mr-2" />
            Weather
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
            onClick={() => setViewMode("settings")}
            variant={viewMode === "settings" ? "default" : "outline"}
            className={viewMode === "settings" ? "bg-blue-600 text-white" : ""}
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>

        {/* Dashboard View */}
        {viewMode === "dashboard" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
              <Card className="p-6">
                <p className="text-gray-600 text-sm">Water Usage</p>
                <p className="text-3xl font-bold text-blue-600">{analytics.totalWaterUsed}L</p>
                <p className="text-xs text-gray-500 mt-1">This week</p>
              </Card>
              <Card className="p-6">
                <p className="text-gray-600 text-sm">Daily Average</p>
                <p className="text-3xl font-bold text-gray-900">{analytics.averagePerDay}L</p>
                <p className="text-xs text-gray-500 mt-1">Per day</p>
              </Card>
              <Card className="p-6">
                <p className="text-gray-600 text-sm">Total Cost</p>
                <p className="text-3xl font-bold text-green-600">GH₵{analytics.totalCost}</p>
                <p className="text-xs text-gray-500 mt-1">This week</p>
              </Card>
              <Card className="p-6">
                <p className="text-gray-600 text-sm">Water Saved</p>
                <p className="text-3xl font-bold text-green-600">{analytics.waterSavings}L</p>
                <p className="text-xs text-green-600 mt-1">+{analytics.savingsPercentage}%</p>
              </Card>
              <Card className="p-6">
                <p className="text-gray-600 text-sm">Efficiency</p>
                <p className="text-3xl font-bold text-blue-600">{analytics.efficiency}%</p>
                <p className="text-xs text-gray-500 mt-1">System efficiency</p>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-6 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setViewMode("schedule")}>
                <Clock className="w-8 h-8 text-blue-600 mb-3" />
                <p className="font-bold text-gray-900">Next Irrigation</p>
                <p className="text-sm text-gray-600 mt-2">Monday 06:00 - 45 minutes</p>
              </Card>
              <Card className="p-6 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setViewMode("sensors")}>
                <Zap className="w-8 h-8 text-yellow-600 mb-3" />
                <p className="font-bold text-gray-900">Sensor Status</p>
                <p className="text-sm text-gray-600 mt-2">1 zone needs irrigation</p>
              </Card>
              <Card className="p-6 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setViewMode("weather")}>
                <Cloud className="w-8 h-8 text-gray-600 mb-3" />
                <p className="font-bold text-gray-900">Weather Alert</p>
                <p className="text-sm text-gray-600 mt-2">Rain expected tomorrow</p>
              </Card>
            </div>
          </>
        )}

        {/* Schedule View */}
        {viewMode === "schedule" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Irrigation Schedule</h2>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Schedule
              </Button>
            </div>

            {schedule.map((item, idx) => (
              <Card key={idx} className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-gray-900">{item.day} at {item.time}</p>
                    <p className="text-sm text-gray-600">{item.reason}</p>
                  </div>
                  <span className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded">
                    {item.confidence}% confidence
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-gray-600 text-xs">Duration</p>
                    <p className="font-bold text-gray-900">{item.duration} min</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-xs">Water Volume</p>
                    <p className="font-bold text-gray-900">{item.waterVolume}L</p>
                  </div>
                  <div>
                    <Button variant="outline" className="w-full">
                      Edit
                    </Button>
                  </div>
                </div>
              </Card>
            ))}

            <Card className="p-6 bg-green-50 border-green-200">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <div>
                  <p className="font-bold text-gray-900">Weekly Total</p>
                  <p className="text-sm text-gray-600">1,450L water scheduled</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Sensors View */}
        {viewMode === "sensors" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Real-Time Sensor Data</h2>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Sensor
              </Button>
            </div>

            {sensors.map((sensor) => (
              <Card key={sensor.id} className={`p-6 border-l-4 ${getSensorStatusColor(sensor.status)}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    {getSensorIcon(sensor.type)}
                    <div>
                      <p className="font-bold text-gray-900">{sensor.type}</p>
                      <p className="text-sm text-gray-600">{sensor.location}</p>
                    </div>
                  </div>
                  <span className={`inline-block px-3 py-1 rounded text-sm font-medium ${getSensorStatusColor(sensor.status)}`}>
                    {sensor.status.charAt(0).toUpperCase() + sensor.status.slice(1)}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-gray-600 text-xs">Current Value</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {sensor.value}{sensor.unit}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-xs">Threshold</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {sensor.threshold}{sensor.unit}
                    </p>
                  </div>
                  <div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-blue-600"
                        style={{ width: `${(sensor.value / 100) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Weather View */}
        {viewMode === "weather" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">7-Day Weather Forecast</h2>

            {forecast.map((day) => (
              <Card key={day.date} className={`p-6 ${day.irrigationRequired ? "border-l-4 border-blue-500" : ""}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-gray-900">{day.date}</p>
                    <p className="text-sm text-gray-600">{day.condition}</p>
                  </div>
                  <span className={`inline-block px-3 py-1 rounded text-sm font-medium ${
                    day.irrigationRequired
                      ? "bg-blue-100 text-blue-800"
                      : "bg-green-100 text-green-800"
                  }`}>
                    {day.irrigationRequired ? "Irrigation Required" : "No Irrigation"}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div>
                    <p className="text-gray-600 text-xs">High/Low</p>
                    <p className="font-bold text-gray-900">{day.high}°C / {day.low}°C</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-xs">Rainfall</p>
                    <p className="font-bold text-gray-900">{day.rainfall}mm</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-xs">Humidity</p>
                    <p className="font-bold text-gray-900">{day.humidity}%</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-xs">Wind Speed</p>
                    <p className="font-bold text-gray-900">{day.windSpeed} km/h</p>
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

        {/* Analytics View */}
        {viewMode === "analytics" && (
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Water Usage Analytics</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-gray-600 text-xs">Total Used</p>
                  <p className="text-2xl font-bold text-blue-600">{analytics.totalWaterUsed}L</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-gray-600 text-xs">Water Saved</p>
                  <p className="text-2xl font-bold text-green-600">{analytics.waterSavings}L</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-gray-600 text-xs">Total Cost</p>
                  <p className="text-2xl font-bold text-purple-600">GH₵{analytics.totalCost}</p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg">
                  <p className="text-gray-600 text-xs">Efficiency</p>
                  <p className="text-2xl font-bold text-orange-600">{analytics.efficiency}%</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Cost Optimization Recommendations</h2>
              <div className="space-y-3">
                {recommendations.map((rec) => (
                  <div key={rec.id} className={`p-4 border rounded-lg ${
                    rec.priority === "high" ? "border-red-300 bg-red-50" : "border-yellow-300 bg-yellow-50"
                  }`}>
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-bold text-gray-900">{rec.title}</p>
                      <span className={`text-xs font-medium px-2 py-1 rounded ${
                        rec.priority === "high"
                          ? "bg-red-200 text-red-800"
                          : "bg-yellow-200 text-yellow-800"
                      }`}>
                        {rec.priority.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                    <p className="text-sm font-bold text-green-600">
                      Potential Savings: {rec.potentialSavings}%
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Settings View */}
        {viewMode === "settings" && (
          <Card className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Automation Settings</h2>
            <div className="space-y-6">
              <div className="p-4 border border-gray-200 rounded-lg">
                <p className="font-bold text-gray-900 mb-2">Soil Moisture Threshold</p>
                <input type="range" min="20" max="80" defaultValue="40" className="w-full" />
                <p className="text-sm text-gray-600 mt-2">Current: 40%</p>
              </div>

              <div className="p-4 border border-gray-200 rounded-lg">
                <p className="font-bold text-gray-900 mb-2">Max Daily Water Usage</p>
                <input type="number" defaultValue="1000" className="w-full px-3 py-2 border border-gray-300 rounded" />
                <p className="text-sm text-gray-600 mt-2">Liters</p>
              </div>

              <div className="p-4 border border-gray-200 rounded-lg">
                <p className="font-bold text-gray-900 mb-2">Preferred Irrigation Time</p>
                <input type="time" defaultValue="06:00" className="w-full px-3 py-2 border border-gray-300 rounded" />
              </div>

              <div className="p-4 border border-gray-200 rounded-lg">
                <label className="flex items-center gap-3">
                  <input type="checkbox" defaultChecked className="w-4 h-4" />
                  <span className="font-bold text-gray-900">Cost Optimization</span>
                </label>
              </div>

              <Button className="w-full bg-blue-600 hover:bg-blue-700 h-12">
                Save Settings
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default WeatherIrrigationAutomation;
