import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Info, Trash2, Eye, Filter } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function AlertHistory() {
  const [selectedFarmId, setSelectedFarmId] = useState<number | null>(null);
  const [severity, setSeverity] = useState<"critical" | "warning" | "info" | "all">("all");
  const [alertType, setAlertType] = useState<"health" | "water_quality" | "weather" | "maintenance" | "other" | "all">("all");
  const [isRead, setIsRead] = useState<"all" | "read" | "unread">("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const utils = trpc.useUtils();

  // Fetch farms
  const { data: farms = [] } = trpc.farms.list.useQuery();

  // Fetch alerts
  const { data: alertData, isLoading } = trpc.alertHistory.list.useQuery({
    farmId: selectedFarmId || undefined,
    severity: severity !== "all" ? severity : undefined,
    alertType: alertType !== "all" ? alertType : undefined,
    isRead: isRead === "all" ? undefined : isRead === "read",
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    limit: 50,
    offset: 0,
  });

  // Fetch unread count
  const { data: unreadCount = 0 } = trpc.alertHistory.unreadCount.useQuery({
    farmId: selectedFarmId || undefined,
  });

  // Mutations
  const markAsRead = trpc.alertHistory.markAsRead.useMutation({
    onSuccess: () => {
      utils.alertHistory.list.invalidate();
      utils.alertHistory.unreadCount.invalidate();
    },
  });

  const markAllAsRead = trpc.alertHistory.markAllAsRead.useMutation({
    onSuccess: () => {
      utils.alertHistory.list.invalidate();
      utils.alertHistory.unreadCount.invalidate();
    },
  });

  const deleteAlert = trpc.alertHistory.delete.useMutation({
    onSuccess: () => {
      utils.alertHistory.list.invalidate();
      utils.alertHistory.unreadCount.invalidate();
    },
  });

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case "warning":
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case "info":
        return <Info className="w-5 h-5 text-blue-500" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    const variants: Record<string, "destructive" | "default" | "secondary"> = {
      critical: "destructive",
      warning: "default",
      info: "secondary",
    };
    return (
      <Badge variant={variants[severity] || "default"}>
        {severity.toUpperCase()}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    return (
      <Badge variant="outline">
        {type.replace("_", " ").toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Alert History</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            View and manage past notifications ({unreadCount} unread)
          </p>
        </div>
        <Button
          onClick={() => markAllAsRead.mutate({ farmId: selectedFarmId || undefined })}
          disabled={unreadCount === 0 || markAllAsRead.isPending}
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Mark All Read
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
          <CardDescription>Filter alerts by farm, severity, type, and date range</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Farm</label>
              <Select
                value={selectedFarmId?.toString() || "all"}
                onValueChange={(val) => setSelectedFarmId(val === "all" ? null : parseInt(val))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Farms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Farms</SelectItem>
                  {farms.map((farm) => (
                    <SelectItem key={farm.id} value={farm.id.toString()}>
                      {farm.farmName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Severity</label>
              <Select value={severity} onValueChange={(val: any) => setSeverity(val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Type</label>
              <Select value={alertType} onValueChange={(val: any) => setAlertType(val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="health">Health</SelectItem>
                  <SelectItem value="water_quality">Water Quality</SelectItem>
                  <SelectItem value="weather">Weather</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={isRead} onValueChange={(val: any) => setIsRead(val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts List */}
      <div className="space-y-3">
        {isLoading ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Loading alerts...
            </CardContent>
          </Card>
        ) : alertData?.alerts.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No alerts found matching your filters
            </CardContent>
          </Card>
        ) : (
          alertData?.alerts.map((alert) => (
            <Card
              key={alert.id}
              className={`${!alert.isRead ? "border-l-4 border-l-blue-500" : ""}`}
            >
              <CardContent className="py-4">
                <div className="flex items-start gap-4">
                  <div className="mt-1">{getSeverityIcon(alert.severity)}</div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <h3 className="font-semibold">{alert.title}</h3>
                        <p className="text-sm text-muted-foreground">{alert.message}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {!alert.isRead && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => markAsRead.mutate({ id: alert.id })}
                            disabled={markAsRead.isPending}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteAlert.mutate({ id: alert.id })}
                          disabled={deleteAlert.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {getSeverityBadge(alert.severity)}
                      {getTypeBadge(alert.alertType)}
                      <span className="text-xs text-muted-foreground">
                        {new Date(alert.createdAt).toLocaleString()}
                      </span>
                      {alert.isRead && alert.readAt && (
                        <span className="text-xs text-muted-foreground">
                          Read: {new Date(alert.readAt).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {alertData && alertData.hasMore && (
        <div className="text-center">
          <Button variant="outline">Load More</Button>
        </div>
      )}
    </div>
  );
}
