import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, AlertTriangle, CheckCircle, Wifi, WifiOff } from "lucide-react";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from "chart.js";
import { toast } from "sonner";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function IoTDashboard() {
  const { user } = useAuth();
  const [selectedFarmId, setSelectedFarmId] = useState<number | null>(null);
  const [selectedDeviceId, setSelectedDeviceId] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const [deviceForm, setDeviceForm] = useState({
    deviceSerial: "",
    deviceType: "soil_sensor" as const,
    installationDate: "",
  });

  const { data: farms = [] } = trpc.farms.list.useQuery();
  const { data: devices = [] } = trpc.iot.listDevices.useQuery(
    { farmId: selectedFarmId! },
    { enabled: !!selectedFarmId }
  );
  const { data: readings = [] } = trpc.iot.getSensorReadings.useQuery(
    { deviceId: selectedDeviceId! },
    { enabled: !!selectedDeviceId }
  );
  const { data: alerts = [] } = trpc.iot.getAlerts.useQuery(
    { farmId: selectedFarmId! },
    { enabled: !!selectedFarmId }
  );

  const registerDeviceMutation = trpc.iot.registerDevice.useMutation({
    onSuccess: () => {
      setDeviceForm({
        deviceSerial: "",
        deviceType: "soil_sensor",
        installationDate: "",
      });
      setOpen(false);
      toast.success("Device registered successfully!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to register device");
    },
  });

  const handleRegisterDevice = async () => {
    if (!selectedFarmId || !deviceForm.deviceSerial) {
      toast.error("Farm and device serial are required");
      return;
    }

    await registerDeviceMutation.mutateAsync({
      farmId: selectedFarmId,
      deviceSerial: deviceForm.deviceSerial,
      deviceType: deviceForm.deviceType,
      installationDate: deviceForm.installationDate || undefined,
    });
  };

  if (!user) return null;

  const selectedDevice = devices.find((d: any) => d.id === selectedDeviceId);
  const chartData = readings.length > 0 ? {
    labels: readings.slice(-24).map((r: any) => new Date(r.readingTimestamp).toLocaleTimeString()),
    datasets: [
      {
        label: `${selectedDevice?.deviceType || "Sensor"} (${readings[0]?.unit || "unit"})`,
        data: readings.slice(-24).map((r: any) => parseFloat(r.value)),
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        tension: 0.4,
      },
    ],
  } : null;

  const activeDevices = devices.filter((d: any) => d.status === "active").length;
  const unresolvedAlerts = alerts.filter((a: any) => !a.isResolved).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">IoT Monitoring</h1>
          <p className="text-muted-foreground">Register and monitor farm sensors and devices</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Register Device
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Register IoT Device</DialogTitle>
              <DialogDescription>Add a new sensor or device to monitor your farm</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="farm">Select Farm *</Label>
                <Select value={selectedFarmId?.toString() || ""} onValueChange={(v) => setSelectedFarmId(parseInt(v))}>
                  <SelectTrigger id="farm">
                    <SelectValue placeholder="Choose a farm" />
                  </SelectTrigger>
                  <SelectContent>
                    {farms.map((farm: any) => (
                      <SelectItem key={farm.id} value={farm.id.toString()}>
                        {farm.farmName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="deviceSerial">Device Serial *</Label>
                <Input
                  id="deviceSerial"
                  placeholder="e.g., SOIL-001"
                  value={deviceForm.deviceSerial}
                  onChange={(e) => setDeviceForm({ ...deviceForm, deviceSerial: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="deviceType">Device Type *</Label>
                <Select value={deviceForm.deviceType} onValueChange={(v: any) => setDeviceForm({ ...deviceForm, deviceType: v })}>
                  <SelectTrigger id="deviceType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="soil_sensor">Soil Sensor</SelectItem>
                    <SelectItem value="weather_station">Weather Station</SelectItem>
                    <SelectItem value="animal_monitor">Animal Monitor</SelectItem>
                    <SelectItem value="water_meter">Water Meter</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="installationDate">Installation Date</Label>
                <Input
                  id="installationDate"
                  type="date"
                  value={deviceForm.installationDate}
                  onChange={(e) => setDeviceForm({ ...deviceForm, installationDate: e.target.value })}
                />
              </div>
              <Button onClick={handleRegisterDevice} disabled={registerDeviceMutation.isPending} className="w-full">
                {registerDeviceMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Register Device
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{devices.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Registered sensors</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active Devices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeDevices}</div>
            <p className="text-xs text-muted-foreground mt-1">Currently online</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{unresolvedAlerts}</div>
            <p className="text-xs text-muted-foreground mt-1">Unresolved</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Last Reading</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {readings.length > 0 ? new Date(readings[readings.length - 1].readingTimestamp).toLocaleTimeString() : "—"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Most recent</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="devices" className="space-y-4">
        <TabsList>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="readings">Readings</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="devices" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {devices.map((device: any) => (
              <Card
                key={device.id}
                className={`cursor-pointer transition-all ${selectedDeviceId === device.id ? "ring-2 ring-primary" : ""}`}
                onClick={() => setSelectedDeviceId(device.id)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{device.deviceSerial}</CardTitle>
                    <Badge variant={device.status === "active" ? "default" : "secondary"}>
                      {device.status === "active" ? <Wifi className="h-3 w-3 mr-1" /> : <WifiOff className="h-3 w-3 mr-1" />}
                      {device.status}
                    </Badge>
                  </div>
                  <CardDescription>{device.deviceType.replace(/_/g, " ")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {device.installationDate && <p><span className="font-medium">Installed:</span> {new Date(device.installationDate).toLocaleDateString()}</p>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="readings" className="space-y-4">
          {selectedDevice && chartData ? (
            <Card>
              <CardHeader>
                <CardTitle>Sensor Readings - {selectedDevice.deviceSerial}</CardTitle>
                <CardDescription>Last 24 readings</CardDescription>
              </CardHeader>
              <CardContent>
                <Line data={chartData} options={{ responsive: true, plugins: { legend: { position: "top" as const } } }} />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">Select a device to view sensor readings</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          {alerts.length > 0 ? (
            <div className="space-y-3">
              {alerts.map((alert: any) => (
                <Card key={alert.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {alert.severity === "critical" ? (
                          <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                        )}
                        <div>
                          <p className="font-medium">{alert.message}</p>
                          <p className="text-sm text-muted-foreground">{new Date(alert.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                      <Badge variant={alert.severity === "critical" ? "destructive" : "secondary"}>
                        {alert.isResolved ? "Resolved" : alert.severity}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="h-12 w-12 mx-auto text-green-600 mb-4" />
                <p className="text-lg font-medium">No alerts</p>
                <p className="text-muted-foreground">All sensors are operating normally</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
