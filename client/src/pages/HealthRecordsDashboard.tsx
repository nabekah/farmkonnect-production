import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { AlertCircle, Calendar, Heart, Thermometer, Activity, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";

export default function HealthRecordsDashboard() {
  const { user } = useAuth();
  const [selectedAnimalId, setSelectedAnimalId] = useState<number>(1);
  const [selectedFarmId, setSelectedFarmId] = useState<number>(1);

  // Fetch health records using tRPC
  const { data: healthRecords = [], isLoading: recordsLoading } = trpc.healthRecords.list.useQuery(
    { animalId: selectedAnimalId },
    { enabled: !!selectedAnimalId }
  );

  // Fetch vaccinations using tRPC
  const { data: vaccinations = [], isLoading: vaccinationsLoading } = trpc.vaccinations.listByAnimal.useQuery(
    { animalId: selectedAnimalId },
    { enabled: !!selectedAnimalId }
  );

  // Mock data for demonstration (replace with actual data when available)
  const healthSummary = {
    lastCheckup: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    nextVaccination: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    activeIncidents: 0,
    recentMetrics: {
      weight: 465,
      temperature: 38.6,
      heartRate: 72,
      bodyConditionScore: 3.5,
    },
    vaccinationStatus: vaccinations.length > 0 ? "up-to-date" : "pending",
    healthRisk: "low",
    recommendations: [
      "Schedule routine checkup in 2 weeks",
      "Monitor weight gain",
      "Ensure proper nutrition",
    ],
  };

  const healthMetrics = [
    { date: "Week 1", weight: 450, temperature: 38.5, heartRate: 68 },
    { date: "Week 2", weight: 455, temperature: 38.4, heartRate: 70 },
    { date: "Week 3", weight: 460, temperature: 38.6, heartRate: 72 },
    { date: "Week 4", weight: 465, temperature: 38.6, heartRate: 71 },
    { date: "Week 5", weight: 468, temperature: 38.5, heartRate: 72 },
  ];

  const vaccinationData = [
    { name: "FMD", value: 42, coverage: 93.3 },
    { name: "Brucellosis", value: 40, coverage: 88.9 },
    { name: "Anthrax", value: 38, coverage: 84.4 },
  ];

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b"];

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-lg font-semibold">Please log in to view health records</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Health Records Dashboard</h1>
          <p className="text-gray-600 mt-2">Monitor animal health, vaccinations, and medical history</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          New Health Record
        </Button>
      </div>

      {/* Health Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Last Checkup</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{healthSummary.lastCheckup.toLocaleDateString()}</div>
            <p className="text-xs text-gray-500 mt-1">7 days ago</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Next Vaccination</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{healthSummary.nextVaccination.toLocaleDateString()}</div>
            <p className="text-xs text-gray-500 mt-1">In 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Vaccination Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <CheckCircle className="w-6 h-6 text-green-500 mr-2" />
              <span className="text-lg font-semibold capitalize">{healthSummary.vaccinationStatus}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Health Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize text-green-600">{healthSummary.healthRisk}</div>
            <p className="text-xs text-gray-500 mt-1">Current status</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="metrics" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="metrics">Health Metrics</TabsTrigger>
          <TabsTrigger value="vaccinations">Vaccinations</TabsTrigger>
          <TabsTrigger value="records">Medical Records</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        {/* Health Metrics Tab */}
        <TabsContent value="metrics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Health Metrics Trend</CardTitle>
              <CardDescription>Weight, temperature, and heart rate over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={healthMetrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="weight" stroke="#3b82f6" name="Weight (kg)" />
                  <Line yAxisId="right" type="monotone" dataKey="temperature" stroke="#ef4444" name="Temperature (°C)" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Current Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Weight</span>
                  <span className="font-semibold">{healthSummary.recentMetrics.weight} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Temperature</span>
                  <span className="font-semibold">{healthSummary.recentMetrics.temperature}°C</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Heart Rate</span>
                  <span className="font-semibold">{healthSummary.recentMetrics.heartRate} bpm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Body Condition Score</span>
                  <span className="font-semibold">{healthSummary.recentMetrics.bodyConditionScore}/5</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Vaccination Coverage</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={vaccinationData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, coverage }) => `${name}: ${coverage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {vaccinationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Vaccinations Tab */}
        <TabsContent value="vaccinations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vaccination History</CardTitle>
              <CardDescription>All vaccinations and immunizations</CardDescription>
            </CardHeader>
            <CardContent>
              {vaccinationsLoading ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Loading vaccination records...</p>
                </div>
              ) : vaccinations.length > 0 ? (
                <div className="space-y-3">
                  {vaccinations.map((vac: any) => (
                    <div key={vac.id} className="border rounded-lg p-4 flex justify-between items-center">
                      <div>
                        <p className="font-semibold">{vac.eventType}</p>
                        <p className="text-sm text-gray-600">{new Date(vac.recordDate).toLocaleDateString()}</p>
                      </div>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                  <p className="text-gray-600">No vaccination records found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Medical Records Tab */}
        <TabsContent value="records" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Medical Records</CardTitle>
              <CardDescription>Health events and treatments</CardDescription>
            </CardHeader>
            <CardContent>
              {recordsLoading ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Loading health records...</p>
                </div>
              ) : healthRecords.length > 0 ? (
                <div className="space-y-3">
                  {healthRecords.map((record: any) => (
                    <div key={record.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold capitalize">{record.eventType}</p>
                          <p className="text-sm text-gray-600">{new Date(record.recordDate).toLocaleDateString()}</p>
                          {record.details && <p className="text-sm mt-2">{record.details}</p>}
                        </div>
                        <Activity className="w-5 h-5 text-blue-500" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">No health records found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Health Recommendations</CardTitle>
              <CardDescription>Personalized health care recommendations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {healthSummary.recommendations.map((rec, idx) => (
                  <div key={idx} className="flex items-start p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <TrendingUp className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                    <p className="text-sm">{rec}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

import { Plus } from "lucide-react";
