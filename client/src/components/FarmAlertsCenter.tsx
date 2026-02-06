import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle2,
  X,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export interface FarmAlert {
  id: string;
  farmId: number;
  farmName: string;
  type: "error" | "warning" | "info" | "success";
  title: string;
  message: string;
  timestamp: Date;
  actionUrl?: string;
  actionLabel?: string;
}

interface FarmAlertsCenterProps {
  alerts: FarmAlert[];
  onDismiss?: (alertId: string) => void;
  maxVisible?: number;
}

/**
 * Farm Alerts Center Component
 * Displays farm-specific alerts centrally with filtering and actions
 */
export function FarmAlertsCenter({
  alerts,
  onDismiss,
  maxVisible = 5,
}: FarmAlertsCenterProps) {
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(
    new Set()
  );
  const [filterType, setFilterType] = useState<string>("all");

  const visibleAlerts = useMemo(() => {
    return alerts
      .filter((a) => !dismissedAlerts.has(a.id))
      .filter((a) => filterType === "all" || a.type === filterType)
      .slice(0, maxVisible);
  }, [alerts, dismissedAlerts, filterType, maxVisible]);

  const handleDismiss = (alertId: string) => {
    setDismissedAlerts((prev) => {
      const newSet = new Set(prev);
      newSet.add(alertId);
      return newSet;
    });
    onDismiss?.(alertId);
  };

  const alertCounts = useMemo(() => {
    return {
      error: alerts.filter((a) => a.type === "error").length,
      warning: alerts.filter((a) => a.type === "warning").length,
      info: alerts.filter((a) => a.type === "info").length,
      success: alerts.filter((a) => a.type === "success").length,
    };
  }, [alerts]);

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "error":
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case "success":
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      default:
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getAlertBgColor = (type: string) => {
    switch (type) {
      case "error":
        return "bg-red-50 border-red-200";
      case "warning":
        return "bg-yellow-50 border-yellow-200";
      case "success":
        return "bg-green-50 border-green-200";
      default:
        return "bg-blue-50 border-blue-200";
    }
  };

  const getAlertBadgeColor = (type: string) => {
    switch (type) {
      case "error":
        return "bg-red-100 text-red-800";
      case "warning":
        return "bg-yellow-100 text-yellow-800";
      case "success":
        return "bg-green-100 text-green-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  if (alerts.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span>All systems operational - no alerts</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Farm Alerts Center</CardTitle>
          <div className="flex items-center gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-1 text-sm border rounded-md bg-background"
            >
              <option value="all">All Alerts</option>
              <option value="error">Errors ({alertCounts.error})</option>
              <option value="warning">Warnings ({alertCounts.warning})</option>
              <option value="info">Info ({alertCounts.info})</option>
              <option value="success">Success ({alertCounts.success})</option>
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {visibleAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 border rounded-lg flex gap-4 ${getAlertBgColor(
                alert.type
              )}`}
            >
              <div className="flex-shrink-0 pt-0.5">
                {getAlertIcon(alert.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm">{alert.title}</h4>
                      <Badge className={`text-xs ${getAlertBadgeColor(alert.type)}`}>
                        {alert.farmName}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {alert.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {alert.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDismiss(alert.id)}
                    className="h-6 w-6 p-0 flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                {alert.actionUrl && alert.actionLabel && (
                  <Button
                    variant="link"
                    size="sm"
                    className="mt-2 h-auto p-0 text-xs"
                    onClick={() => {
                      window.location.href = alert.actionUrl!;
                    }}
                  >
                    {alert.actionLabel} →
                  </Button>
                )}
              </div>
            </div>
          ))}

          {visibleAlerts.length === 0 && filterType !== "all" && (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">
                No {filterType} alerts at this time
              </p>
            </div>
          )}

          {alerts.length > maxVisible && (
            <div className="text-center pt-2">
              <p className="text-xs text-muted-foreground">
                Showing {visibleAlerts.length} of {alerts.length} alerts
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
