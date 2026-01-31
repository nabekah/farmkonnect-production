import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  Filler,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export default function WeatherTrends() {
  const [selectedFarmId, setSelectedFarmId] = useState<number | null>(null);
  const [timeRange, setTimeRange] = useState<string>("7");

  const { data: farms } = trpc.farms.list.useQuery();
  const { data: weatherTrends, isLoading } = trpc.weatherNotifications.getWeatherTrends.useQuery(
    {
      farmId: selectedFarmId!,
      startDate: new Date(Date.now() - parseInt(timeRange) * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date().toISOString(),
    },
    { enabled: !!selectedFarmId }
  );

  const temperatureData = {
    labels: weatherTrends?.map((w: any) => new Date(w.recordedAt).toLocaleDateString()).reverse() || [],
    datasets: [
      {
        label: "Temperature (°C)",
        data: weatherTrends?.map((w: any) => parseFloat(w.temperature || "0")).reverse() || [],
        borderColor: "rgb(255, 99, 132)",
        backgroundColor: "rgba(255, 99, 132, 0.1)",
        fill: true,
        tension: 0.4,
      },
      {
        label: "Feels Like (°C)",
        data: weatherTrends?.map((w: any) => parseFloat(w.feelsLike || "0")).reverse() || [],
        borderColor: "rgb(255, 159, 64)",
        backgroundColor: "rgba(255, 159, 64, 0.1)",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const humidityData = {
    labels: weatherTrends?.map((w: any) => new Date(w.recordedAt).toLocaleDateString()).reverse() || [],
    datasets: [
      {
        label: "Humidity (%)",
        data: weatherTrends?.map((w: any) => w.humidity || 0).reverse() || [],
        borderColor: "rgb(54, 162, 235)",
        backgroundColor: "rgba(54, 162, 235, 0.1)",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const windData = {
    labels: weatherTrends?.map((w: any) => new Date(w.recordedAt).toLocaleDateString()).reverse() || [],
    datasets: [
      {
        label: "Wind Speed (m/s)",
        data: weatherTrends?.map((w: any) => parseFloat(w.windSpeed || "0")).reverse() || [],
        borderColor: "rgb(75, 192, 192)",
        backgroundColor: "rgba(75, 192, 192, 0.1)",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const precipitationData = {
    labels: weatherTrends?.map((w: any) => new Date(w.recordedAt).toLocaleDateString()).reverse() || [],
    datasets: [
      {
        label: "Precipitation (mm)",
        data: weatherTrends?.map((w: any) => parseFloat(w.precipitation || "0")).reverse() || [],
        borderColor: "rgb(153, 102, 255)",
        backgroundColor: "rgba(153, 102, 255, 0.1)",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Weather Trends Analysis</h1>
        <p className="text-muted-foreground mt-2">
          Historical weather data and trends for your farms
        </p>
      </div>

      <div className="flex gap-4">
        <Select
          value={selectedFarmId?.toString() || ""}
          onValueChange={(value) => setSelectedFarmId(parseInt(value))}
        >
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Select farm" />
          </SelectTrigger>
          <SelectContent>
            {farms?.map((farm) => (
              <SelectItem key={farm.id} value={farm.id.toString()}>
                {farm.farmName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="14">Last 14 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {!selectedFarmId && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Please select a farm to view weather trends
            </p>
          </CardContent>
        </Card>
      )}

      {selectedFarmId && isLoading && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Loading weather trends...</p>
          </CardContent>
        </Card>
      )}

      {selectedFarmId && !isLoading && weatherTrends && weatherTrends.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              No historical weather data available for this farm. Weather data is collected
              automatically when you run weather checks.
            </p>
          </CardContent>
        </Card>
      )}

      {selectedFarmId && !isLoading && weatherTrends && weatherTrends.length > 0 && (
        <>
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Temperature Trends</CardTitle>
                <CardDescription>Temperature and feels-like temperature over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <Line data={temperatureData} options={chartOptions} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Humidity Trends</CardTitle>
                <CardDescription>Relative humidity percentage over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <Line data={humidityData} options={chartOptions} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Wind Speed Trends</CardTitle>
                <CardDescription>Wind speed measurements over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <Line data={windData} options={chartOptions} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Precipitation Trends</CardTitle>
                <CardDescription>Rainfall measurements over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <Line data={precipitationData} options={chartOptions} />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Weather Summary Statistics</CardTitle>
              <CardDescription>Key metrics for the selected time period</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Avg Temperature</p>
                  <p className="text-2xl font-bold">
                    {(
                      weatherTrends.reduce((sum: number, w: any) => sum + parseFloat(w.temperature || "0"), 0) /
                      weatherTrends.length
                    ).toFixed(1)}
                    °C
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Avg Humidity</p>
                  <p className="text-2xl font-bold">
                    {(
                      weatherTrends.reduce((sum: number, w: any) => sum + (w.humidity || 0), 0) /
                      weatherTrends.length
                    ).toFixed(0)}
                    %
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Avg Wind Speed</p>
                  <p className="text-2xl font-bold">
                    {(
                      weatherTrends.reduce((sum: number, w: any) => sum + parseFloat(w.windSpeed || "0"), 0) /
                      weatherTrends.length
                    ).toFixed(1)}{" "}
                    m/s
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Total Precipitation</p>
                  <p className="text-2xl font-bold">
                    {weatherTrends
                      .reduce((sum: number, w: any) => sum + parseFloat(w.precipitation || "0"), 0)
                      .toFixed(1)}{" "}
                    mm
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
