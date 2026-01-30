import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Cpu, Activity, AlertTriangle, CheckCircle, XCircle, TrendingUp } from "lucide-react";
import { DatePickerPopover } from "@/components/DatePickerPopover";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function IoTManagement() {
  const [selectedFarm, setSelectedFarm] = useState<number | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<number | null>(null);
  const [showDeviceDialog, setShowDeviceDialog] = useState(false);
  const [showReadingDialog, setShowReadingDialog] = useState(false);

  // Queries
  const { data: farms = [] } = trpc.farms.list.useQuery();
  const { data: devices = [], refetch: refetchDevices } = trpc.iot.listDevices.useQuery(
    { farmId: selectedFarm || 0 },
    { enabled: !!selectedFarm }
  );
  const { data: readings = [], refetch: refetchReadings } = trpc.iot.getSensorReadings.useQuery(
    { deviceId: selectedDevice || 0, limit: 50 },
    { enabled: !!selectedDevice }
  );
  const { data: alerts = [], refetch: refetchAlerts } = trpc.iot.getAlerts.useQuery(
    { farmId: selectedFarm || 0 },
    { enabled: !!selectedFarm }
  );
  const { data: unresolvedAlerts = [] } = trpc.iot.getUnresolvedAlerts.useQuery(
    { farmId: selectedFarm || 0 },
    { enabled: !!selectedFarm }
  );

  // Mutations
  const registerDevice = trpc.iot.registerDevice.useMutation({
    onSuccess: () => {
      refetchDevices();
      setShowDeviceDialog(false);
    },
  });

  const recordReading = trpc.iot.recordSensorReading.useMutation({
    onSuccess: () => {
      refetchReadings();
      setShowReadingDialog(false);
    },
  });

  const updateStatus = trpc.iot.updateDeviceStatus.useMutation({
    onSuccess: () => refetchDevices(),
  });

  const resolveAlert = trpc.iot.resolveAlert.useMutation({
    onSuccess: () => refetchAlerts(),
  });

  // Form states
  const [newDevice, setNewDevice] = useState({
    farmId: 0,
    deviceSerial: "",
    deviceType: "soil_sensor" as "soil_sensor" | "weather_station" | "animal_monitor" | "water_meter" | "other",
    installationDate: new Date(),
  });

  const [newReading, setNewReading] = useState({
    deviceId: 0,
    value: "",
    unit: "",
    readingType: "sensor_reading",
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      active: "default",
      inactive: "destructive",
      maintenance: "secondary",
      retired: "outline",
    };
    const icons: Record<string, any> = {
      active: CheckCircle,
      inactive: XCircle,
      maintenance: AlertTriangle,
    };
    const Icon = icons[status];
    return (
      <Badge variant={variants[status] || "default"}>
        {Icon && <Icon className="w-3 h-3 mr-1" />}
        {status}
      </Badge>
    );
  };

  const getDeviceTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      soil_sensor: "Soil Sensor",
      weather_station: "Weather Station",
      animal_monitor: "Animal Monitor",
      water_meter: "Water Meter",
      other: "Other",
    };
    return labels[type] || type;
  };

  // Prepare chart data for sensor readings
  const chartData = {
    labels: readings.map((r) => new Date(r.readingTimestamp).toLocaleTimeString()),
    datasets: [
      {
        label: `Sensor Reading (${readings[0]?.unit || ""})`,
        data: readings.map((r) => parseFloat(r.value)),
        borderColor: "rgb(75, 192, 192)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Sensor Readings Over Time",
      },
    },
    scales: {
      y: {
        beginAtZero: false,
      },
    },
  };

  const activeDevices = devices.filter((d) => d.status === "active");
  const criticalAlerts = unresolvedAlerts.filter((a) => a.severity === "critical");

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">IoT Management</h1>
          <p className="text-muted-foreground mt-2">
            Monitor and manage IoT devices and sensor data
          </p>
        </div>
        <div className="flex gap-2">
          <Select
            value={selectedFarm?.toString() || ""}
            onValueChange={(value) => {
              setSelectedFarm(parseInt(value));
              setSelectedDevice(null);
            }}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select farm" />
            </SelectTrigger>
            <SelectContent>
              {farms.map((f) => (
                <SelectItem key={f.id} value={f.id.toString()}>
                  {f.farmName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={showDeviceDialog} onOpenChange={setShowDeviceDialog}>
            <DialogTrigger asChild>
              <Button disabled={!selectedFarm}>
                <Cpu className="w-4 h-4 mr-2" />
                Register Device
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Register IoT Device</DialogTitle>
                <DialogDescription>Add a new IoT device to your farm</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Device Serial Number</Label>
                  <Input
                    value={newDevice.deviceSerial}
                    onChange={(e) => setNewDevice({ ...newDevice, deviceSerial: e.target.value })}
                    placeholder="e.g., SN-12345-ABCD"
                  />
                </div>
                <div>
                  <Label>Device Type</Label>
                  <Select
                    value={newDevice.deviceType}
                    onValueChange={(value: any) => setNewDevice({ ...newDevice, deviceType: value })}
                  >
                    <SelectTrigger>
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
                  <Label>Installation Date</Label>
                  <DatePickerPopover
                    value={newDevice.installationDate}
                    onChange={(date) => setNewDevice({ ...newDevice, installationDate: date || new Date() })}
                  />
                </div>
                <Button
                  onClick={() => registerDevice.mutate({
                    ...newDevice,
                    farmId: selectedFarm || 0,
                    installationDate: newDevice.installationDate.toISOString(),
                  })}
                  disabled={!newDevice.deviceSerial}
                  className="w-full"
                >
                  Register Device
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {!selectedFarm ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Please select a farm to view IoT devices and sensor data.
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
                <Cpu className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{devices.length}</div>
                <p className="text-xs text-muted-foreground">
                  {activeDevices.length} active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sensor Readings</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{readings.length}</div>
                <p className="text-xs text-muted-foreground">
                  {selectedDevice ? "From selected device" : "Select a device"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{unresolvedAlerts.length}</div>
                <p className="text-xs text-muted-foreground">
                  {criticalAlerts.length} critical
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Data Points</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {devices.reduce((sum, d) => sum + (d.id === selectedDevice ? readings.length : 0), 0)}
                </div>
                <p className="text-xs text-muted-foreground">Collected today</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="devices" className="space-y-6">
            <TabsList>
              <TabsTrigger value="devices">Devices</TabsTrigger>
              <TabsTrigger value="readings">Sensor Data</TabsTrigger>
              <TabsTrigger value="alerts">Alerts</TabsTrigger>
            </TabsList>

            <TabsContent value="devices" className="space-y-4">
              {devices.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    No devices registered yet. Register a device to get started.
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {devices.map((device) => (
                    <Card
                      key={device.id}
                      className={`hover:shadow-lg transition-shadow cursor-pointer ${
                        selectedDevice === device.id ? "ring-2 ring-primary" : ""
                      }`}
                      onClick={() => setSelectedDevice(device.id)}
                    >
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              <Cpu className="w-5 h-5" />
                              {getDeviceTypeLabel(device.deviceType)}
                            </CardTitle>
                            <CardDescription className="mt-2">
                              {device.deviceSerial}
                            </CardDescription>
                          </div>
                          {device.status && getStatusBadge(device.status)}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">
                            Installed: {device.installationDate ? new Date(device.installationDate).toLocaleDateString() : "N/A"}
                          </p>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateStatus.mutate({ deviceId: device.id, status: "maintenance" });
                              }}
                            >
                              Maintenance
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateStatus.mutate({ deviceId: device.id, status: "active" });
                              }}
                            >
                              Activate
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="readings" className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <Label>Select Device</Label>
                  <Select
                    value={selectedDevice?.toString() || ""}
                    onValueChange={(value) => setSelectedDevice(parseInt(value))}
                  >
                    <SelectTrigger className="w-[250px]">
                      <SelectValue placeholder="Select device" />
                    </SelectTrigger>
                    <SelectContent>
                      {devices.map((d) => (
                        <SelectItem key={d.id} value={d.id.toString()}>
                          {getDeviceTypeLabel(d.deviceType)} - {d.deviceSerial}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Dialog open={showReadingDialog} onOpenChange={setShowReadingDialog}>
                  <DialogTrigger asChild>
                    <Button disabled={!selectedDevice}>
                      <Activity className="w-4 h-4 mr-2" />
                      Record Reading
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Record Sensor Reading</DialogTitle>
                      <DialogDescription>Manually record a sensor reading</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Value</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={newReading.value}
                          onChange={(e) => setNewReading({ ...newReading, value: e.target.value })}
                          placeholder="e.g., 25.5"
                        />
                      </div>
                      <div>
                        <Label>Unit</Label>
                        <Input
                          value={newReading.unit}
                          onChange={(e) => setNewReading({ ...newReading, unit: e.target.value })}
                          placeholder="e.g., °C, %, cm"
                        />
                      </div>
                      <div>
                        <Label>Reading Type</Label>
                        <Input
                          value={newReading.readingType}
                          onChange={(e) => setNewReading({ ...newReading, readingType: e.target.value })}
                          placeholder="e.g., temperature, humidity"
                        />
                      </div>
                      <Button
                        onClick={() => recordReading.mutate({
                          deviceId: selectedDevice || 0,
                          value: parseFloat(newReading.value),
                          unit: newReading.unit,
                          readingType: newReading.readingType,
                        })}
                        disabled={!newReading.value || !newReading.unit}
                        className="w-full"
                      >
                        Record Reading
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {!selectedDevice ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    Select a device to view sensor readings.
                  </CardContent>
                </Card>
              ) : readings.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    No sensor readings recorded yet.
                  </CardContent>
                </Card>
              ) : (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle>Sensor Data Visualization</CardTitle>
                      <CardDescription>Real-time sensor readings over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Line data={chartData} options={chartOptions} />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Readings</CardTitle>
                      <CardDescription>Latest {readings.length} sensor readings</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {readings.slice(0, 10).map((reading) => (
                          <div
                            key={reading.id}
                            className="flex justify-between items-center p-3 border rounded-lg"
                          >
                            <div>
                              <p className="font-medium">
                                {reading.value} {reading.unit}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {reading.readingType}
                              </p>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {new Date(reading.readingTimestamp).toLocaleString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

            <TabsContent value="alerts" className="space-y-4">
              {alerts.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    No alerts generated yet.
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {alerts.map((alert: any) => {
                    const device = devices.find((d) => d.id === alert.deviceId);
                    return (
                      <Card key={alert.id}>
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5" />
                                {alert.alertType}
                              </CardTitle>
                              <CardDescription className="mt-2">
                                {device && `${getDeviceTypeLabel(device.deviceType)} - ${device.deviceSerial}`}
                              </CardDescription>
                            </div>
                            <div className="flex gap-2">
                              <Badge variant={alert.severity === "critical" ? "destructive" : "default"}>
                                {alert.severity}
                              </Badge>
                              {alert.isResolved ? (
                                <Badge variant="outline">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Resolved
                                </Badge>
                              ) : (
                                <Badge variant="destructive">
                                  <XCircle className="w-3 h-3 mr-1" />
                                  Active
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm mb-4">{alert.message}</p>
                          <div className="flex justify-between items-center">
                            <p className="text-xs text-muted-foreground">
                              {new Date(alert.createdAt).toLocaleString()}
                            </p>
                            {!alert.isResolved && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => resolveAlert.mutate({ alertId: alert.id })}
                              >
                                Resolve Alert
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
