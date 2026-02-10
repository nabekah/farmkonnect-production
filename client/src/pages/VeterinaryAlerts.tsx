import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Bell, Calendar, CheckCircle, Trash2, Archive, Plus } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function VeterinaryAlerts() {
  const [selectedAlert, setSelectedAlert] = useState<number | null>(null);

  // Fetch alerts
  const { data: alerts = [], isLoading } = trpc.veterinary.getPrescriptionAlerts.useQuery({
    farmId: 1,
  });

  const getAlertTypeColor = (type: string) => {
    switch (type) {
      case "expiry":
        return "bg-red-100 text-red-800";
      case "compliance":
        return "bg-orange-100 text-orange-800";
      case "refill":
        return "bg-yellow-100 text-yellow-800";
      case "appointment":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "expiry":
        return <AlertCircle className="w-4 h-4" />;
      case "compliance":
        return <AlertCircle className="w-4 h-4" />;
      case "refill":
        return <Bell className="w-4 h-4" />;
      case "appointment":
        return <Calendar className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Prescription & Health Alerts</h1>
          <p className="text-muted-foreground mt-2">Monitor medication compliance, expiry dates, and health reminders</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Create Alert
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alerts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Expiry Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {alerts.filter(a => a.alertType === "expiry").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Compliance Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {alerts.filter(a => a.alertType === "compliance").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Unresolved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {alerts.filter(a => !a.resolved).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {isLoading ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">Loading alerts...</p>
            </CardContent>
          </Card>
        ) : alerts.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-center py-8">No alerts at this time</p>
            </CardContent>
          </Card>
        ) : (
          alerts.map((alert) => (
            <Card key={alert.id} className={`hover:shadow-md transition-shadow ${alert.resolved ? "opacity-75" : ""}`}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-lg ${getAlertTypeColor(alert.alertType)}`}>
                        {getAlertIcon(alert.alertType)}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">{alert.title}</h3>
                        <p className="text-sm text-muted-foreground">{alert.message}</p>
                      </div>
                      {alert.resolved && (
                        <Badge variant="outline" className="ml-auto">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Resolved
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">Animal</p>
                        <p className="font-medium">{alert.animalName || "Not specified"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Medication</p>
                        <p className="font-medium">{alert.medicationName || "Not specified"}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-muted-foreground text-xs">Alert Date</p>
                          <p className="font-medium">{new Date(alert.alertDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Priority</p>
                        <p className="font-medium">
                          <Badge variant={alert.priority === "high" ? "destructive" : alert.priority === "medium" ? "outline" : "secondary"}>
                            {alert.priority.charAt(0).toUpperCase() + alert.priority.slice(1)}
                          </Badge>
                        </p>
                      </div>
                    </div>

                    {alert.notes && (
                      <div className="text-sm text-muted-foreground">
                        <strong>Notes:</strong> {alert.notes}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    {!alert.resolved && (
                      <Button size="sm" className="gap-1">
                        <CheckCircle className="w-4 h-4" />
                        Mark Resolved
                      </Button>
                    )}
                    <Button variant="outline" size="sm" className="gap-1">
                      <Archive className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1 text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
