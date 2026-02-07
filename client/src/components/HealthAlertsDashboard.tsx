import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Clock } from "lucide-react";
import { toast } from "sonner";

export function HealthAlertsDashboard({ farmId }: { farmId?: number }) {
  const [selectedAlerts, setSelectedAlerts] = useState<number[]>([]);

  const { data: alerts, isLoading, refetch } = trpc.healthAlerts.getActiveAlerts.useQuery(
    { farmId },
    { refetchInterval: 60000 } // Refetch every minute
  );

  const resolveAlertMutation = trpc.healthAlerts.resolveAlert.useMutation({
    onSuccess: () => {
      toast.success("Alert resolved");
      refetch();
      setSelectedAlerts([]);
    },
  });

  const sendNotificationsMutation = trpc.healthAlerts.sendAlertNotifications.useMutation({
    onSuccess: (data) => {
      toast.success(`Notifications sent to ${data.notified} alerts`);
      refetch();
    },
  });

  const handleResolveAlert = (alertId: number) => {
    resolveAlertMutation.mutate({ alertId });
  };

  const handleSendNotifications = () => {
    if (selectedAlerts.length === 0) {
      toast.error("Please select alerts to notify");
      return;
    }
    sendNotificationsMutation.mutate({ alertIds: selectedAlerts });
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <Clock className="h-6 w-6 animate-spin" />
        </div>
      </Card>
    );
  }

  const totalAlerts = alerts?.totalAlerts || 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-sm text-gray-600">Overdue Vaccinations</div>
          <div className="text-3xl font-bold text-red-600">
            {alerts?.overdueVaccinations.length || 0}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Health Issues</div>
          <div className="text-3xl font-bold text-orange-600">
            {alerts?.healthIssues.length || 0}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Performance Anomalies</div>
          <div className="text-3xl font-bold text-yellow-600">
            {alerts?.performanceAnomalies.length || 0}
          </div>
        </Card>
      </div>

      {/* Alerts List */}
      {totalAlerts === 0 ? (
        <Card className="p-8 text-center">
          <CheckCircle className="h-12 w-12 mx-auto text-green-600 mb-4" />
          <p className="text-lg font-semibold">All Clear!</p>
          <p className="text-gray-600">No active health alerts</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Overdue Vaccinations */}
          {(alerts?.overdueVaccinations.length || 0) > 0 && (
            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                Overdue Vaccinations ({alerts?.overdueVaccinations.length})
              </h3>
              <div className="space-y-2">
                {alerts?.overdueVaccinations.map((alert: any) => (
                  <div key={alert.id} className="flex items-center justify-between p-2 bg-red-50 rounded">
                    <div>
                      <p className="font-semibold">{alert.tagId}</p>
                      <p className="text-sm text-gray-600">{alert.vaccineName} - Due: {alert.nextDueDate}</p>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="checkbox"
                        checked={selectedAlerts.includes(alert.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedAlerts([...selectedAlerts, alert.id]);
                          } else {
                            setSelectedAlerts(selectedAlerts.filter((id) => id !== alert.id));
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleResolveAlert(alert.id)}
                      >
                        Resolve
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Health Issues */}
          {(alerts?.healthIssues.length || 0) > 0 && (
            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                Health Issues ({alerts?.healthIssues.length})
              </h3>
              <div className="space-y-2">
                {alerts?.healthIssues.map((alert: any) => (
                  <div key={alert.id} className="flex items-center justify-between p-2 bg-orange-50 rounded">
                    <div>
                      <p className="font-semibold">{alert.tagId}</p>
                      <p className="text-sm text-gray-600">{alert.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="destructive">{alert.severity}</Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleResolveAlert(alert.id)}
                      >
                        Resolve
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Performance Anomalies */}
          {(alerts?.performanceAnomalies.length || 0) > 0 && (
            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                Performance Anomalies ({alerts?.performanceAnomalies.length})
              </h3>
              <div className="space-y-2">
                {alerts?.performanceAnomalies.map((alert: any) => (
                  <div key={alert.id} className="flex items-center justify-between p-2 bg-yellow-50 rounded">
                    <div>
                      <p className="font-semibold">{alert.tagId}</p>
                      <p className="text-sm text-gray-600">
                        {alert.metricType}: {alert.value} {alert.unit}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleResolveAlert(alert.id)}
                    >
                      Resolve
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Action Buttons */}
          {selectedAlerts.length > 0 && (
            <div className="flex gap-2">
              <Button
                onClick={handleSendNotifications}
                disabled={sendNotificationsMutation.isPending}
              >
                Send Notifications ({selectedAlerts.length})
              </Button>
              <Button
                variant="outline"
                onClick={() => setSelectedAlerts([])}
              >
                Clear Selection
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
