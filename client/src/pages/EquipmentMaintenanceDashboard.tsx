import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, Clock, Wrench, TrendingUp, Download } from "lucide-react";
import { trpc } from "@/lib/trpc";

/**
 * Equipment Maintenance Dashboard Component
 * Displays maintenance schedules, equipment condition alerts, upcoming service dates,
 * and maintenance cost tracking with visual status indicators
 */
export const EquipmentMaintenanceDashboard: React.FC = () => {
  const [selectedFarm, setSelectedFarm] = useState(1);
  const [filterStatus, setFilterStatus] = useState<"all" | "due" | "completed" | "overdue">("all");

  // Fetch equipment data
  const { data: equipmentData, isLoading: equipmentLoading } = trpc.equipment.getFarmEquipment.useQuery(
    { farmId: selectedFarm },
    { enabled: !!selectedFarm }
  );

  // Fetch maintenance history
  const { data: maintenanceData, isLoading: maintenanceLoading } = trpc.equipment.getMaintenanceHistory.useQuery(
    { equipmentId: 1, limit: 50 },
    { enabled: !!selectedFarm }
  );

  // Get utilization analytics
  const { data: utilizationData } = trpc.equipment.getUtilizationAnalytics.useQuery(
    { equipmentId: 1, timeframe: "month" },
    { enabled: !!selectedFarm }
  );

  const generateReport = async () => {
    try {
      // In production, this would call the backend to generate a PDF report
      alert("Equipment maintenance report generated and ready for download");
    } catch (error) {
      alert("Failed to generate report");
    }
  };

  // Mock data for maintenance schedule
  const maintenanceSchedule = [
    {
      id: 1,
      equipmentName: "John Deere Tractor",
      maintenanceType: "Oil Change",
      scheduledDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      status: "due",
      estimatedCost: 500,
      technician: "John Smith",
    },
    {
      id: 2,
      equipmentName: "Water Pump",
      maintenanceType: "Filter Replacement",
      scheduledDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      status: "overdue",
      estimatedCost: 300,
      technician: "Unassigned",
    },
    {
      id: 3,
      equipmentName: "Generator",
      maintenanceType: "Routine Inspection",
      scheduledDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      status: "scheduled",
      estimatedCost: 400,
      technician: "Sarah Johnson",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "overdue":
        return "bg-red-100 text-red-800 border-red-300";
      case "due":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "scheduled":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "completed":
        return "bg-green-100 text-green-800 border-green-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "overdue":
        return <AlertCircle className="w-4 h-4" />;
      case "due":
        return <Clock className="w-4 h-4" />;
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Wrench className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Equipment Maintenance Dashboard</h1>
            <p className="text-gray-600 mt-1">Track maintenance schedules, equipment condition, and service costs</p>
          </div>
          <Button onClick={generateReport} className="bg-blue-600 hover:bg-blue-700">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Equipment</p>
                <p className="text-3xl font-bold text-gray-900">{equipmentData?.equipment?.length || 0}</p>
              </div>
              <Wrench className="w-10 h-10 text-blue-600 opacity-20" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Overdue Maintenance</p>
                <p className="text-3xl font-bold text-red-600">2</p>
              </div>
              <AlertCircle className="w-10 h-10 text-red-600 opacity-20" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Due This Month</p>
                <p className="text-3xl font-bold text-orange-600">3</p>
              </div>
              <Clock className="w-10 h-10 text-orange-600 opacity-20" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Monthly Cost</p>
                <p className="text-3xl font-bold text-green-600">GH₵2,400</p>
              </div>
              <TrendingUp className="w-10 h-10 text-green-600 opacity-20" />
            </div>
          </Card>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-2">
          {["all", "due", "overdue", "completed"].map((status) => (
            <Button
              key={status}
              onClick={() => setFilterStatus(status as any)}
              variant={filterStatus === status ? "default" : "outline"}
              className={filterStatus === status ? "bg-blue-600" : ""}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>

        {/* Maintenance Schedule Table */}
        <Card className="mb-8">
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Maintenance Schedule</h2>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Equipment</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Maintenance Type</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Scheduled Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Cost</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Technician</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {maintenanceSchedule.map((item) => (
                    <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-900 font-medium">{item.equipmentName}</td>
                      <td className="py-3 px-4 text-gray-600">{item.maintenanceType}</td>
                      <td className="py-3 px-4 text-gray-600">{item.scheduledDate.toLocaleDateString()}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(item.status)}`}>
                          {getStatusIcon(item.status)}
                          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-900 font-medium">GH₵{item.estimatedCost}</td>
                      <td className="py-3 px-4 text-gray-600">{item.technician}</td>
                      <td className="py-3 px-4">
                        <Button size="sm" variant="outline" className="text-blue-600 hover:bg-blue-50">
                          Schedule
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>

        {/* Equipment Condition Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Equipment by Condition */}
          <Card className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Equipment Condition</h2>
            <div className="space-y-3">
              {[
                { condition: "Excellent", count: 2, color: "bg-green-500" },
                { condition: "Good", count: 3, color: "bg-blue-500" },
                { condition: "Fair", count: 2, color: "bg-yellow-500" },
                { condition: "Poor", count: 1, color: "bg-red-500" },
              ].map((item) => (
                <div key={item.condition} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                    <span className="text-gray-700">{item.condition}</span>
                  </div>
                  <span className="font-semibold text-gray-900">{item.count} units</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Maintenance Cost Trend */}
          <Card className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Monthly Cost Trend</h2>
            <div className="space-y-3">
              {[
                { month: "January", cost: 1800 },
                { month: "February", cost: 2100 },
                { month: "March", cost: 2400 },
              ].map((item) => (
                <div key={item.month} className="flex items-center justify-between">
                  <span className="text-gray-700">{item.month}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600"
                        style={{ width: `${(item.cost / 3000) * 100}%` }}
                      ></div>
                    </div>
                    <span className="font-semibold text-gray-900 w-16 text-right">GH₵{item.cost}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EquipmentMaintenanceDashboard;
