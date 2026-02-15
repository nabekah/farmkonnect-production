import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { AlertTriangle, CheckCircle, Clock, TrendingUp, Users, AlertCircle, Loader } from 'lucide-react';
import { trpc } from '@/lib/trpc';

interface ComplianceViolation {
  id: number;
  workerId: number;
  workerName: string;
  date: string;
  violationType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'resolved' | 'pending';
  notes: string;
}

interface ComplianceTrend {
  date: string;
  violations: number;
  compliant: number;
  warnings: number;
}

export const ComplianceDashboard = ({ farmId = 1 }: { farmId?: number }) => {
  const [selectedViolation, setSelectedViolation] = useState<ComplianceViolation | null>(null);
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter'>('month');

  // Fetch compliance data
  const { data: violationsData, isLoading: violationsLoading } = trpc.laborManagement.compliance.list.useQuery({
    farmId,
    status: 'violation',
  });

  const { data: complianceTrends, isLoading: trendsLoading } = trpc.laborManagement.compliance.getTrends.useQuery({
    farmId,
    dateRange,
  });

  const { data: workerComplianceScores, isLoading: scoresLoading } = trpc.laborManagement.compliance.getWorkerScores.useQuery({
    farmId,
  });

  // Calculate statistics
  const stats = useMemo(() => {
    if (!violationsData) return null;

    const critical = violationsData.filter((v: any) => v.severity === 'critical').length;
    const high = violationsData.filter((v: any) => v.severity === 'high').length;
    const medium = violationsData.filter((v: any) => v.severity === 'medium').length;
    const low = violationsData.filter((v: any) => v.severity === 'low').length;

    const resolved = violationsData.filter((v: any) => v.status === 'resolved').length;
    const open = violationsData.filter((v: any) => v.status === 'open').length;
    const pending = violationsData.filter((v: any) => v.status === 'pending').length;

    return {
      totalViolations: violationsData.length,
      critical,
      high,
      medium,
      low,
      resolved,
      open,
      pending,
      complianceRate: Math.round(((violationsData.length - critical - high) / violationsData.length) * 100) || 100,
    };
  }, [violationsData]);

  const severityColors = {
    critical: '#dc2626',
    high: '#ea580c',
    medium: '#eab308',
    low: '#22c55e',
  };

  const isLoading = violationsLoading || trendsLoading || scoresLoading;

  if (isLoading) {
    return (
      <div className="w-full max-w-7xl mx-auto p-6 flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-2">
          <Loader className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Loading Compliance Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Compliance Dashboard</h1>
        <Button className="bg-blue-600 hover:bg-blue-700">Generate Report</Button>
      </div>

      {/* Critical Alerts */}
      {stats && stats.critical > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>{stats.critical} Critical Violations</strong> require immediate attention. Review and take corrective action.
          </AlertDescription>
        </Alert>
      )}

      {/* Key Metrics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Compliance Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.complianceRate}%</div>
              <p className="text-xs text-gray-500 mt-2">Target: 95%</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Violations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{stats.totalViolations}</div>
              <p className="text-xs text-gray-500 mt-2">{stats.open} Open</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Critical Issues</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{stats.critical}</div>
              <p className="text-xs text-gray-500 mt-2">Require Action</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Resolved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.resolved}</div>
              <p className="text-xs text-gray-500 mt-2">This Period</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="violations" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="violations">Violations</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="workers">Worker Scores</TabsTrigger>
        </TabsList>

        {/* Violations Tab */}
        <TabsContent value="violations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Violations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {violationsData && violationsData.length > 0 ? (
                  violationsData.slice(0, 10).map((violation: any) => (
                    <div
                      key={violation.id}
                      className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition"
                      onClick={() => setSelectedViolation(violation)}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold">{violation.workerName}</p>
                          <p className="text-sm text-gray-600">{violation.violationType}</p>
                          <p className="text-xs text-gray-500 mt-1">{violation.date}</p>
                        </div>
                        <div className="flex gap-2">
                          <Badge
                            className={`
                              ${violation.severity === 'critical' ? 'bg-red-100 text-red-800' : ''}
                              ${violation.severity === 'high' ? 'bg-orange-100 text-orange-800' : ''}
                              ${violation.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' : ''}
                              ${violation.severity === 'low' ? 'bg-green-100 text-green-800' : ''}
                            `}
                          >
                            {violation.severity}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`
                              ${violation.status === 'resolved' ? 'bg-green-50 text-green-700' : ''}
                              ${violation.status === 'open' ? 'bg-red-50 text-red-700' : ''}
                              ${violation.status === 'pending' ? 'bg-yellow-50 text-yellow-700' : ''}
                            `}
                          >
                            {violation.status}
                          </Badge>
                        </div>
                      </div>
                      {violation.notes && (
                        <p className="text-sm text-gray-600 mt-2 p-2 bg-gray-50 rounded">{violation.notes}</p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
                    <p className="text-gray-600">No violations recorded</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Compliance Trends</CardTitle>
                <div className="flex gap-2">
                  {(['week', 'month', 'quarter'] as const).map(range => (
                    <Button
                      key={range}
                      variant={dateRange === range ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setDateRange(range)}
                    >
                      {range.charAt(0).toUpperCase() + range.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {complianceTrends && complianceTrends.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={complianceTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="violations" stroke="#dc2626" name="Violations" />
                    <Line type="monotone" dataKey="compliant" stroke="#22c55e" name="Compliant" />
                    <Line type="monotone" dataKey="warnings" stroke="#eab308" name="Warnings" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-8 text-gray-600">No trend data available</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Worker Scores Tab */}
        <TabsContent value="workers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Worker Compliance Scores</CardTitle>
            </CardHeader>
            <CardContent>
              {workerComplianceScores && workerComplianceScores.length > 0 ? (
                <div className="space-y-3">
                  {workerComplianceScores.map((worker: any) => (
                    <div key={worker.workerId} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-semibold">{worker.workerName}</p>
                        <Badge
                          className={`
                            ${worker.score >= 90 ? 'bg-green-100 text-green-800' : ''}
                            ${worker.score >= 70 && worker.score < 90 ? 'bg-yellow-100 text-yellow-800' : ''}
                            ${worker.score < 70 ? 'bg-red-100 text-red-800' : ''}
                          `}
                        >
                          {worker.score}%
                        </Badge>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            worker.score >= 90
                              ? 'bg-green-600'
                              : worker.score >= 70
                              ? 'bg-yellow-600'
                              : 'bg-red-600'
                          }`}
                          style={{ width: `${worker.score}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-600 mt-2">
                        <span>Violations: {worker.violations}</span>
                        <span>Warnings: {worker.warnings}</span>
                        <span>Compliant Days: {worker.compliantDays}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-600">No worker data available</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Violation Details Modal */}
      {selectedViolation && (
        <Card className="border-2 border-blue-500">
          <CardHeader>
            <CardTitle>Violation Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Worker</p>
                <p className="font-semibold">{selectedViolation.workerName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Date</p>
                <p className="font-semibold">{selectedViolation.date}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Violation Type</p>
                <p className="font-semibold">{selectedViolation.violationType}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Severity</p>
                <Badge className={`
                  ${selectedViolation.severity === 'critical' ? 'bg-red-100 text-red-800' : ''}
                  ${selectedViolation.severity === 'high' ? 'bg-orange-100 text-orange-800' : ''}
                  ${selectedViolation.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' : ''}
                  ${selectedViolation.severity === 'low' ? 'bg-green-100 text-green-800' : ''}
                `}>
                  {selectedViolation.severity}
                </Badge>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">Notes</p>
              <p className="p-3 bg-gray-50 rounded">{selectedViolation.notes}</p>
            </div>
            <div className="flex gap-2">
              <Button className="bg-green-600 hover:bg-green-700">Mark as Resolved</Button>
              <Button variant="outline">Request Review</Button>
              <Button variant="outline" onClick={() => setSelectedViolation(null)}>Close</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
