import React, { useState } from "react";
import { useAuth } from "@/lib/auth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

export default function BreedingAnalytics() {
  const { user } = useAuth();
  const [selectedFarmId, setSelectedFarmId] = useState<number>(1);

  // Fetch breeding analytics
  const { data: analytics, isLoading: analyticsLoading } = trpc.breedingSimplified.getBreedingAnalytics.useQuery(
    { farmId: selectedFarmId },
    { enabled: !!selectedFarmId }
  );

  // Fetch breeding records
  const { data: breedingRecords } = trpc.breedingSimplified.getBreedingRecords.useQuery(
    { farmId: selectedFarmId },
    { enabled: !!selectedFarmId }
  );

  // Fetch recommended breeding pairs
  const { data: recommendedPairs } = trpc.breedingSimplified.getRecommendedBreedingPairs.useQuery(
    { farmId: selectedFarmId },
    { enabled: !!selectedFarmId }
  );

  if (analyticsLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg text-gray-500">Loading breeding analytics...</p>
      </div>
    );
  }

  // Prepare chart data
  const outcomeData = [
    { name: "Successful", value: analytics?.successfulBreedings || 0, color: "#10b981" },
    { name: "Failed", value: analytics?.failedBreedings || 0, color: "#ef4444" },
    { name: "Pending", value: analytics?.pendingBreedings || 0, color: "#f59e0b" },
  ].filter(item => item.value > 0);

  const breedingTrendData = breedingRecords?.map((record, index) => ({
    month: `Month ${index + 1}`,
    successful: record.outcome === "successful" ? 1 : 0,
    failed: record.outcome === "unsuccessful" ? 1 : 0,
  })) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Livestock Breeding Analytics</h1>
          <p className="text-slate-600">Monitor and optimize your breeding program with data-driven insights</p>
        </div>

        {/* Farm Selection */}
        <div className="mb-8 flex gap-4">
          <Select value={selectedFarmId.toString()} onValueChange={(val) => setSelectedFarmId(parseInt(val))}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select a farm" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Farm 1</SelectItem>
              <SelectItem value="2">Farm 2</SelectItem>
              <SelectItem value="3">Farm 3</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Breeding Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{analytics?.totalBreedingEvents || 0}</div>
              <p className="text-xs text-slate-500 mt-1">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Success Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{analytics?.successRate || 0}%</div>
              <p className="text-xs text-slate-500 mt-1">{analytics?.successfulBreedings || 0} successful</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Breeding Animals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{analytics?.totalBreedingAnimals || 0}</div>
              <p className="text-xs text-slate-500 mt-1">Active animals</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Avg. Breeding Age</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{analytics?.averageBreedingAge || 0} yrs</div>
              <p className="text-xs text-slate-500 mt-1">Optimal range: 2-8 years</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Breeding Outcome Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Breeding Outcome Distribution</CardTitle>
              <CardDescription>Success, failure, and pending breeding events</CardDescription>
            </CardHeader>
            <CardContent>
              {outcomeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={outcomeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {outcomeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-300 flex items-center justify-center text-gray-500">
                  No breeding data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Breeding Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Breeding Trend</CardTitle>
              <CardDescription>Success and failure trends over time</CardDescription>
            </CardHeader>
            <CardContent>
              {breedingTrendData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={breedingTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="successful" stackId="a" fill="#10b981" />
                    <Bar dataKey="failed" stackId="a" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-300 flex items-center justify-center text-gray-500">
                  No trend data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recommended Breeding Pairs */}
        <Card>
          <CardHeader>
            <CardTitle>Recommended Breeding Pairs</CardTitle>
            <CardDescription>Top matches based on genetic compatibility analysis</CardDescription>
          </CardHeader>
          <CardContent>
            {recommendedPairs && recommendedPairs.length > 0 ? (
              <div className="space-y-4">
                {recommendedPairs.map((pair, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition">
                    <div className="flex-1">
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <p className="font-semibold text-slate-900">{pair.sireName}</p>
                          <p className="text-xs text-slate-500">Sire</p>
                        </div>
                        <div className="text-slate-400">×</div>
                        <div className="text-center">
                          <p className="font-semibold text-slate-900">{pair.damName}</p>
                          <p className="text-xs text-slate-500">Dam</p>
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 mt-2">Breed: {pair.breed}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={pair.compatibilityScore >= 80 ? "default" : "secondary"}>
                        {pair.compatibilityScore}% Compatible
                      </Badge>
                      <Button variant="outline" size="sm" className="mt-2">
                        Schedule Breeding
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No recommended breeding pairs available</p>
                <p className="text-sm mt-1">Add more animals to your farm to get recommendations</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Breeding Records */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Recent Breeding Records</CardTitle>
            <CardDescription>Latest breeding events and outcomes</CardDescription>
          </CardHeader>
          <CardContent>
            {breedingRecords && breedingRecords.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Breeding Date</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Expected Due Date</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Outcome</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {breedingRecords.slice(0, 10).map((record, index) => (
                      <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-4">{new Date(record.breedingDate).toLocaleDateString()}</td>
                        <td className="py-3 px-4">{record.expectedDueDate ? new Date(record.expectedDueDate).toLocaleDateString() : "N/A"}</td>
                        <td className="py-3 px-4">
                          <Badge
                            variant={
                              record.outcome === "successful"
                                ? "default"
                                : record.outcome === "unsuccessful"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {record.outcome}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{record.notes || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No breeding records available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
