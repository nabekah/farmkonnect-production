import React, { useMemo } from 'react';
import { trpc } from '../lib/trpc';
import { useAuth } from '../hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, TrendingUp, CheckCircle, AlertTriangle } from 'lucide-react';

interface ComplianceMetric {
  label: string;
  value: number;
  unit: string;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  icon: React.ReactNode;
}

export default function ComplianceDashboard() {
  const { user } = useAuth();
  const [selectedFarmId, setSelectedFarmId] = React.useState<number | null>(null);

  // Fetch compliance dashboard data
  const { data: dashboardData, isLoading: dashboardLoading } =
    trpc.medicationCompliance.getDashboard.useQuery(
      { farmId: selectedFarmId || 1 },
      { enabled: !!selectedFarmId || selectedFarmId === 0 }
    );

  // Fetch compliance alerts
  const { data: alertsData, isLoading: alertsLoading } =
    trpc.medicationCompliance.getAlerts.useQuery(
      { farmId: selectedFarmId || 1 },
      { enabled: !!selectedFarmId || selectedFarmId === 0 }
    );

  // Fetch farms for selection
  const { data: farmsData } = trpc.farms.list.useQuery({ limit: 100 });

  React.useEffect(() => {
    if (farmsData?.data && farmsData.data.length > 0 && !selectedFarmId) {
      setSelectedFarmId(farmsData.data[0].id);
    }
  }, [farmsData, selectedFarmId]);

  const complianceMetrics: ComplianceMetric[] = useMemo(() => {
    if (!dashboardData) return [];

    return [
      {
        label: 'Overall Compliance',
        value: dashboardData.averageCompliance,
        unit: '%',
        status:
          dashboardData.averageCompliance >= 90
            ? 'excellent'
            : dashboardData.averageCompliance >= 70
              ? 'good'
              : dashboardData.averageCompliance >= 50
                ? 'warning'
                : 'critical',
        icon: <TrendingUp className="w-6 h-6" />,
      },
      {
        label: 'Animals on Medication',
        value: dashboardData.totalAnimalsOnMedication,
        unit: '',
        status: 'good',
        icon: <CheckCircle className="w-6 h-6" />,
      },
      {
        label: 'Perfect Compliance',
        value: dashboardData.animalsWithPerfectCompliance,
        unit: '',
        status: 'excellent',
        icon: <CheckCircle className="w-6 h-6" />,
      },
      {
        label: 'Recent Missed Doses',
        value: dashboardData.recentMissedDoses,
        unit: '',
        status: dashboardData.recentMissedDoses > 0 ? 'warning' : 'good',
        icon: <AlertTriangle className="w-6 h-6" />,
      },
    ];
  }, [dashboardData]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'bg-green-50 border-green-200 text-green-900';
      case 'good':
        return 'bg-blue-50 border-blue-200 text-blue-900';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-900';
      case 'critical':
        return 'bg-red-50 border-red-200 text-red-900';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-900';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'bg-green-100 text-green-800';
      case 'good':
        return 'bg-blue-100 text-blue-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!user) {
    return <div className="p-4">Please log in to view compliance dashboard</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Medication Compliance Dashboard</h1>
            <p className="text-gray-600 mt-1">Monitor and manage medication compliance across your farm</p>
          </div>

          {/* Farm Selector */}
          {farmsData?.data && farmsData.data.length > 0 && (
            <select
              value={selectedFarmId || ''}
              onChange={(e) => setSelectedFarmId(parseInt(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {farmsData.data.map((farm) => (
                <option key={farm.id} value={farm.id}>
                  {farm.farmName}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {complianceMetrics.map((metric, idx) => (
            <Card key={idx} className={`border-2 ${getStatusColor(metric.status)}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">{metric.label}</CardTitle>
                  <div className="text-gray-600">{metric.icon}</div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {metric.value}
                  <span className="text-lg text-gray-600">{metric.unit}</span>
                </div>
                <span className={`inline-block mt-2 px-2 py-1 rounded text-xs font-semibold ${getStatusBadgeColor(metric.status)}`}>
                  {metric.status.charAt(0).toUpperCase() + metric.status.slice(1)}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Alerts Section */}
        {alertsData && alertsData.length > 0 && (
          <Card className="border-2 border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-900">
                <AlertCircle className="w-5 h-5" />
                Active Alerts ({alertsData.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alertsData.slice(0, 5).map((alert: any, idx: number) => (
                  <Alert key={idx} className="border-red-300 bg-white">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-900">
                      <strong>{alert.animalName}</strong>: {alert.message}
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Compliance Trend Chart */}
        {dashboardData?.complianceTrend && (
          <Card>
            <CardHeader>
              <CardTitle>30-Day Compliance Trend</CardTitle>
              <CardDescription>Daily medication compliance percentage over the last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-100 rounded-lg p-4 flex items-end justify-between gap-1">
                {dashboardData.complianceTrend.map((day: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex-1 bg-blue-500 rounded-t hover:bg-blue-600 transition-colors"
                    style={{ height: `${Math.max(day.compliance, 5)}%` }}
                    title={`${day.date}: ${day.compliance}%`}
                  />
                ))}
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Trend shows daily compliance percentage. Hover over bars for details.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Animal Compliance Breakdown */}
        {dashboardData?.animalComplianceBreakdown && (
          <Card>
            <CardHeader>
              <CardTitle>Animal Compliance Breakdown</CardTitle>
              <CardDescription>Individual compliance status for each animal on medication</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboardData.animalComplianceBreakdown.map((animal: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{animal.animalName}</p>
                      <div className="w-full bg-gray-300 rounded-full h-2 mt-2">
                        <div
                          className={`h-2 rounded-full ${
                            animal.status === 'excellent'
                              ? 'bg-green-500'
                              : animal.status === 'good'
                                ? 'bg-blue-500'
                                : 'bg-yellow-500'
                          }`}
                          style={{ width: `${animal.compliance}%` }}
                        />
                      </div>
                    </div>
                    <div className="ml-4 text-right">
                      <p className="text-lg font-bold text-gray-900">{animal.compliance}%</p>
                      <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${getStatusBadgeColor(animal.status)}`}>
                        {animal.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {(dashboardLoading || alertsLoading) && (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="ml-3 text-gray-600">Loading compliance data...</p>
          </div>
        )}

        {/* Empty State */}
        {!dashboardLoading && !dashboardData && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-gray-600">No compliance data available for this farm</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
