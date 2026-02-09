import React from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, AlertTriangle, Info, CheckCircle, Bell, X } from "lucide-react";

interface PerformanceAlertsWidgetProps {
  farmId: string;
}

export const PerformanceAlertsWidget: React.FC<PerformanceAlertsWidgetProps> = ({ farmId }) => {
  const { data: alerts = [] } = trpc.performanceAlerts.getMyAlerts.useQuery(
    { farmId, unreadOnly: true },
    { enabled: !!farmId }
  );

  const { data: summary } = trpc.performanceAlerts.getAlertSummary.useQuery(
    { farmId },
    { enabled: !!farmId }
  );

  const markAsReadMutation = trpc.performanceAlerts.markAsRead.useMutation({
    onSuccess: () => {
      // Refetch alerts
    }
  });

  const handleMarkAsRead = async (alertId: number) => {
    try {
      await markAsReadMutation.mutateAsync({ alertId });
    } catch (error) {
      console.error("Error marking alert as read:", error);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case "high":
        return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      case "medium":
        return <Info className="h-5 w-5 text-yellow-600" />;
      case "low":
        return <Info className="h-5 w-5 text-blue-600" />;
      default:
        return <Bell className="h-5 w-5 text-gray-600" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return <Badge className="bg-red-100 text-red-800">Critical</Badge>;
      case "high":
        return <Badge className="bg-orange-100 text-orange-800">High</Badge>;
      case "medium":
        return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>;
      case "low":
        return <Badge className="bg-blue-100 text-blue-800">Low</Badge>;
      default:
        return <Badge>{severity}</Badge>;
    }
  };

  const getAlertTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      low_activity: "Low Activity",
      low_quality: "Low Quality",
      high_absence: "High Absence",
      task_overdue: "Task Overdue",
      attendance_drop: "Attendance Drop"
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      {/* Alert Summary */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{summary?.totalAlerts || 0}</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Unread</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold text-blue-600">{summary?.unreadAlerts || 0}</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Critical</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold text-red-600">{summary?.criticalAlerts || 0}</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">High</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold text-orange-600">{summary?.highAlerts || 0}</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Medium</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold text-yellow-600">{summary?.mediumAlerts || 0}</span>
          </CardContent>
        </Card>
      </div>

      {/* Alerts List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Alerts</CardTitle>
          <CardDescription>Real-time performance alerts for workers</CardDescription>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
              <p>No active alerts</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert: any) => (
                <div
                  key={alert.id}
                  className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-shrink-0 mt-1">
                    {getSeverityIcon(alert.severity)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm">{getAlertTypeLabel(alert.alertType)}</p>
                      {getSeverityBadge(alert.severity)}
                    </div>
                    <p className="text-sm text-gray-600">{alert.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(alert.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleMarkAsRead(alert.id)}
                    disabled={markAsReadMutation.isPending}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alert Guidelines */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-sm">Alert Guidelines</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2 text-gray-700">
          <p>🔴 <strong>Critical:</strong> Immediate action required - worker performance severely impacted</p>
          <p>🟠 <strong>High:</strong> Urgent attention needed - significant performance issues detected</p>
          <p>🟡 <strong>Medium:</strong> Monitor closely - performance trending downward</p>
          <p>🔵 <strong>Low:</strong> Informational - minor performance variations noted</p>
        </CardContent>
      </Card>
    </div>
  );
};
