import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, CheckCircle, Cloud, Droplets, Wind, Thermometer } from "lucide-react";

export default function WeatherAlerts() {
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [farmFilter, setFarmFilter] = useState<string>("all");

  const { data: alerts = [], refetch } = trpc.weatherNotifications.getWeatherAlerts.useQuery();
  const { data: farms = [] } = trpc.farms.list.useQuery();

  // Filter alerts based on selected filters
  const filteredAlerts = alerts.filter((alert) => {
    const matchesSeverity = severityFilter === "all" || alert.severity === severityFilter;
    const matchesFarm = farmFilter === "all" || alert.farmName === farmFilter;
    return matchesSeverity && matchesFarm;
  });

  // Group alerts by severity
  const highAlerts = filteredAlerts.filter((a) => a.severity === "critical");
  const mediumAlerts = filteredAlerts.filter((a) => a.severity === "warning");
  const lowAlerts = filteredAlerts.filter((a) => a.severity === "info");

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-300";
      case "warning":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "info":
        return "bg-blue-100 text-blue-800 border-blue-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getAlertIcon = (type: string) => {
    if (type.includes("frost") || type.includes("cold")) {
      return <Thermometer className="h-5 w-5" />;
    } else if (type.includes("heat") || type.includes("hot")) {
      return <Thermometer className="h-5 w-5 text-red-500" />;
    } else if (type.includes("rain") || type.includes("precipitation")) {
      return <Droplets className="h-5 w-5" />;
    } else if (type.includes("wind")) {
      return <Wind className="h-5 w-5" />;
    } else if (type.includes("humidity")) {
      return <Cloud className="h-5 w-5" />;
    }
    return <AlertTriangle className="h-5 w-5" />;
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Weather Alerts</h1>
          <p className="text-muted-foreground">Monitor weather conditions across all your farms</p>
        </div>
        <Button onClick={() => refetch()} variant="outline">
          <CheckCircle className="mr-2 h-4 w-4" />
          Refresh Alerts
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              High Priority
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{highAlerts.length}</div>
            <p className="text-sm text-muted-foreground">Immediate action required</p>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Medium Priority
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{mediumAlerts.length}</div>
            <p className="text-sm text-muted-foreground">Monitor closely</p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-blue-600" />
              Low Priority
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{lowAlerts.length}</div>
            <p className="text-sm text-muted-foreground">Informational</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Alerts</CardTitle>
          <CardDescription>Narrow down alerts by severity and farm</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Severity</label>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All severities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Farm</label>
              <Select value={farmFilter} onValueChange={setFarmFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All farms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Farms</SelectItem>
                  {farms.map((farm) => (
                    <SelectItem key={farm.id} value={farm.farmName}>
                      {farm.farmName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alert List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">
          Active Alerts ({filteredAlerts.length})
        </h2>

        {filteredAlerts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Active Alerts</h3>
              <p className="text-muted-foreground">
                All farms are operating under normal weather conditions
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredAlerts.map((alert, index) => (
              <Card
                key={index}
                className={`border-2 ${getSeverityColor(alert.severity)}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {getAlertIcon(alert.alertType)}
                      <div>
                        <CardTitle className="text-lg">{alert.message}</CardTitle>
                        <CardDescription className="mt-1">
                          <span className="font-medium">{alert.farmName}</span>
                        </CardDescription>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={getSeverityColor(alert.severity)}
                    >
                      {alert.severity.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      {alert.temperature && (
                        <div>
                          <span className="font-medium">Temperature:</span> {alert.temperature}°C
                        </div>
                      )}
                      {alert.humidity && (
                        <div>
                          <span className="font-medium">Humidity:</span> {alert.humidity}%
                        </div>
                      )}
                      {alert.windSpeed && (
                        <div>
                          <span className="font-medium">Wind Speed:</span> {alert.windSpeed} m/s
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
