import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Bell, AlertTriangle, AlertCircle, CheckCircle, Trash2, Eye, EyeOff } from "lucide-react";

interface AlertMessage {
  id: string;
  type: "turnover_risk" | "salary_anomaly" | "attendance_alert" | "performance_alert" | "system_alert";
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  message: string;
  workerName?: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}

export default function RealtimeAlerts() {
  const [alerts, setAlerts] = useState<AlertMessage[]>([]);
  const [filter, setFilter] = useState<"all" | "unread" | "critical" | "high">("all");
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);

  // Mock alerts data
  useEffect(() => {
    const mockAlerts: AlertMessage[] = [
      {
        id: "1",
        type: "turnover_risk",
        severity: "critical",
        title: "High Turnover Risk: Kwame Mensah",
        message: "Kwame Mensah has a 92% turnover risk. Immediate intervention recommended.",
        workerName: "Kwame Mensah",
        timestamp: new Date(Date.now() - 5 * 60000),
        read: false,
        actionUrl: "/workforce-analytics?tab=turnover",
      },
      {
        id: "2",
        type: "turnover_risk",
        severity: "critical",
        title: "High Turnover Risk: Ama Osei",
        message: "Ama Osei has an 88% turnover risk. Immediate intervention recommended.",
        workerName: "Ama Osei",
        timestamp: new Date(Date.now() - 15 * 60000),
        read: false,
        actionUrl: "/workforce-analytics?tab=turnover",
      },
      {
        id: "3",
        type: "salary_anomaly",
        severity: "high",
        title: "Salary Alert: Technician",
        message: "Technician salaries are 90% of industry average. Consider salary adjustments.",
        timestamp: new Date(Date.now() - 30 * 60000),
        read: false,
        actionUrl: "/workforce-analytics?tab=salary",
      },
      {
        id: "4",
        type: "attendance_alert",
        severity: "high",
        title: "Attendance Alert: Yaw Mensah",
        message: "Yaw Mensah's attendance rate is 78%. Below target of 90%.",
        workerName: "Yaw Mensah",
        timestamp: new Date(Date.now() - 45 * 60000),
        read: true,
        actionUrl: "/attendance-kiosk",
      },
      {
        id: "5",
        type: "performance_alert",
        severity: "medium",
        title: "Performance Alert: Akosua Addo",
        message: "Akosua Addo's performance is declining. Score: 72%. Intervention needed.",
        workerName: "Akosua Addo",
        timestamp: new Date(Date.now() - 60 * 60000),
        read: true,
        actionUrl: "/workforce-analytics?tab=productivity",
      },
      {
        id: "6",
        type: "system_alert",
        severity: "medium",
        title: "Payroll Processing Complete",
        message: "Monthly payroll processing completed successfully. 45 workers processed.",
        timestamp: new Date(Date.now() - 2 * 60 * 60000),
        read: true,
      },
    ];

    setAlerts(mockAlerts);
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-300";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      default:
        return "bg-blue-100 text-blue-800 border-blue-300";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case "high":
        return <AlertCircle className="h-5 w-5 text-orange-600" />;
      case "medium":
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      default:
        return <CheckCircle className="h-5 w-5 text-blue-600" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "turnover_risk":
        return "Turnover Risk";
      case "salary_anomaly":
        return "Salary Alert";
      case "attendance_alert":
        return "Attendance";
      case "performance_alert":
        return "Performance";
      case "system_alert":
        return "System";
      default:
        return "Alert";
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return new Date(date).toLocaleDateString();
  };

  const filteredAlerts = alerts.filter((alert) => {
    if (filter === "unread") return !alert.read;
    if (filter === "critical") return alert.severity === "critical";
    if (filter === "high") return alert.severity === "critical" || alert.severity === "high";
    return true;
  });

  const unreadCount = alerts.filter((a) => !a.read).length;
  const criticalCount = alerts.filter((a) => a.severity === "critical").length;

  const markAsRead = (id: string) => {
    setAlerts(alerts.map((a) => (a.id === id ? { ...a, read: true } : a)));
  };

  const deleteAlert = (id: string) => {
    setAlerts(alerts.filter((a) => a.id !== id));
  };

  const clearAllAlerts = () => {
    setAlerts([]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Real-time Alerts</h1>
          <p className="text-gray-600 mt-2">Monitor critical workforce events and notifications</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-gray-600">Unread</p>
            <p className="text-2xl font-bold text-blue-600">{unreadCount}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Critical</p>
            <p className="text-2xl font-bold text-red-600">{criticalCount}</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b">
        {[
          { id: "all", label: "All Alerts", count: alerts.length },
          { id: "unread", label: "Unread", count: unreadCount },
          { id: "critical", label: "Critical", count: criticalCount },
          { id: "high", label: "High Priority", count: alerts.filter((a) => a.severity === "critical" || a.severity === "high").length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id as any)}
            className={`px-4 py-2 font-medium border-b-2 transition-colors flex items-center gap-2 ${
              filter === tab.id
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            {tab.label}
            <Badge variant="secondary" className="ml-1">
              {tab.count}
            </Badge>
          </button>
        ))}
      </div>

      {/* Action Buttons */}
      {alerts.length > 0 && (
        <div className="flex gap-2">
          <Button
            onClick={clearAllAlerts}
            variant="outline"
            className="text-red-600 hover:bg-red-50"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Clear All
          </Button>
        </div>
      )}

      {/* Alerts List */}
      {filteredAlerts.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="pt-12 pb-12 text-center">
            <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">No alerts</p>
            <p className="text-sm text-gray-500 mt-1">All systems operating normally</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map((alert) => (
            <Card
              key={alert.id}
              className={`border-l-4 transition-all ${
                alert.read ? "bg-gray-50 border-l-gray-300" : `border-l-red-600 bg-white`
              }`}
            >
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="mt-1">{getSeverityIcon(alert.severity)}</div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <p className="font-semibold text-gray-900">{alert.title}</p>
                        <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Badge className={getSeverityColor(alert.severity)}>
                          {alert.severity.toUpperCase()}
                        </Badge>
                        <Badge variant="outline">{getTypeLabel(alert.type)}</Badge>
                      </div>
                    </div>

                    {/* Expandable Details */}
                    {expandedAlert === alert.id && (
                      <div className="mt-3 pt-3 border-t bg-gray-50 p-3 rounded text-sm text-gray-700">
                        <p>
                          <strong>Time:</strong> {new Date(alert.timestamp).toLocaleString()}
                        </p>
                        {alert.workerName && (
                          <p>
                            <strong>Worker:</strong> {alert.workerName}
                          </p>
                        )}
                        <p className="mt-2">
                          <strong>Recommended Action:</strong> Review workforce analytics and take appropriate
                          intervention measures.
                        </p>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t">
                      <p className="text-xs text-gray-500">{formatTime(alert.timestamp)}</p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            setExpandedAlert(expandedAlert === alert.id ? null : alert.id)
                          }
                        >
                          {expandedAlert === alert.id ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>

                        {!alert.read && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => markAsRead(alert.id)}
                            className="text-blue-600 hover:bg-blue-50"
                          >
                            Mark as Read
                          </Button>
                        )}

                        {alert.actionUrl && (
                          <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700"
                            onClick={() => (window.location.href = alert.actionUrl!)}
                          >
                            View Details
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteAlert(alert.id)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
