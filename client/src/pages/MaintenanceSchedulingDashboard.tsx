import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Edit2,
  X,
  TrendingUp,
  Users,
  Wrench,
} from "lucide-react";

/**
 * Equipment Maintenance Scheduling Dashboard Component
 * Displays maintenance calendar, technician assignments, and completion tracking
 */
export const MaintenanceSchedulingDashboard: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"calendar" | "list" | "technician">("calendar");

  // Mock maintenance schedules
  const maintenanceSchedules = [
    {
      id: 1,
      equipmentName: "Tractor A",
      maintenanceType: "Oil Change",
      scheduledDate: new Date(2026, 1, 12),
      status: "scheduled",
      priority: "medium",
      technicianName: "John Smith",
      estimatedHours: 2,
      notes: "Regular maintenance",
    },
    {
      id: 2,
      equipmentName: "Pump B",
      maintenanceType: "Filter Replacement",
      scheduledDate: new Date(2026, 1, 13),
      status: "in_progress",
      priority: "high",
      technicianName: "Sarah Johnson",
      estimatedHours: 1.5,
      notes: "Critical filter replacement",
    },
    {
      id: 3,
      equipmentName: "Sprayer C",
      maintenanceType: "Calibration",
      scheduledDate: new Date(2026, 1, 14),
      status: "completed",
      priority: "low",
      technicianName: "John Smith",
      estimatedHours: 3,
      notes: "Annual calibration",
    },
    {
      id: 4,
      equipmentName: "Harvester D",
      maintenanceType: "Belt Inspection",
      scheduledDate: new Date(2026, 1, 15),
      status: "scheduled",
      priority: "high",
      technicianName: "Mike Davis",
      estimatedHours: 2.5,
      notes: "Pre-season inspection",
    },
    {
      id: 5,
      equipmentName: "Tractor A",
      maintenanceType: "Tire Rotation",
      scheduledDate: new Date(2026, 1, 18),
      status: "scheduled",
      priority: "medium",
      technicianName: "John Smith",
      estimatedHours: 1.5,
      notes: "Quarterly maintenance",
    },
  ];

  // Mock technician assignments
  const technicianAssignments = [
    {
      technicianId: 1,
      technicianName: "John Smith",
      totalAssigned: 5,
      completed: 3,
      inProgress: 1,
      pending: 1,
      completionRate: 60,
      averageHours: 2.5,
    },
    {
      technicianId: 2,
      technicianName: "Sarah Johnson",
      totalAssigned: 4,
      completed: 2,
      inProgress: 2,
      pending: 0,
      completionRate: 50,
      averageHours: 1.75,
    },
    {
      technicianId: 3,
      technicianName: "Mike Davis",
      totalAssigned: 3,
      completed: 3,
      inProgress: 0,
      pending: 0,
      completionRate: 100,
      averageHours: 2.3,
    },
  ];

  // Mock statistics
  const stats = {
    totalEquipment: 15,
    totalScheduled: 8,
    totalCompleted: 12,
    totalInProgress: 2,
    averageCompletionTime: 2.3,
    onTimeCompletionRate: 92,
    costPerMaintenance: 125,
    totalMaintenanceCost: 1500,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "completed":
        return "bg-green-100 text-green-800 border-green-300";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "text-red-600";
      case "high":
        return "text-orange-600";
      case "medium":
        return "text-yellow-600";
      case "low":
        return "text-green-600";
      default:
        return "text-gray-600";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "scheduled":
        return <Clock className="w-5 h-5 text-blue-600" />;
      case "in_progress":
        return <Wrench className="w-5 h-5 text-yellow-600" />;
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(selectedMonth);
    const firstDay = getFirstDayOfMonth(selectedMonth);
    const days = [];

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="bg-gray-50"></div>);
    }

    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), day);
      const daySchedules = maintenanceSchedules.filter(
        (s) =>
          s.scheduledDate.getDate() === day &&
          s.scheduledDate.getMonth() === selectedMonth.getMonth() &&
          s.scheduledDate.getFullYear() === selectedMonth.getFullYear()
      );

      days.push(
        <div
          key={day}
          className="border border-gray-200 p-2 min-h-24 bg-white hover:bg-gray-50 cursor-pointer"
        >
          <div className="font-semibold text-gray-900">{day}</div>
          <div className="mt-1 space-y-1">
            {daySchedules.map((schedule) => (
              <div
                key={schedule.id}
                className={`text-xs p-1 rounded ${getStatusColor(schedule.status)}`}
              >
                <div className="font-medium truncate">{schedule.equipmentName}</div>
                <div className="text-xs">{schedule.maintenanceType}</div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return days;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Maintenance Scheduling</h1>
            <p className="text-gray-600 mt-1">Manage equipment maintenance calendar and technician assignments</p>
          </div>
          <Button onClick={() => setShowScheduleForm(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Schedule Maintenance
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Equipment</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalEquipment}</p>
              </div>
              <Wrench className="w-10 h-10 text-blue-600 opacity-20" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Scheduled</p>
                <p className="text-3xl font-bold text-blue-600">{stats.totalScheduled}</p>
              </div>
              <Calendar className="w-10 h-10 text-blue-600 opacity-20" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Completed</p>
                <p className="text-3xl font-bold text-green-600">{stats.totalCompleted}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-600 opacity-20" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">On-Time Rate</p>
                <p className="text-3xl font-bold text-green-600">{stats.onTimeCompletionRate}%</p>
              </div>
              <TrendingUp className="w-10 h-10 text-green-600 opacity-20" />
            </div>
          </Card>
        </div>

        {/* View Mode Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            onClick={() => setViewMode("calendar")}
            variant={viewMode === "calendar" ? "default" : "outline"}
            className={viewMode === "calendar" ? "bg-blue-600 text-white" : ""}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Calendar
          </Button>
          <Button
            onClick={() => setViewMode("list")}
            variant={viewMode === "list" ? "default" : "outline"}
            className={viewMode === "list" ? "bg-blue-600 text-white" : ""}
          >
            List View
          </Button>
          <Button
            onClick={() => setViewMode("technician")}
            variant={viewMode === "technician" ? "default" : "outline"}
            className={viewMode === "technician" ? "bg-blue-600 text-white" : ""}
          >
            <Users className="w-4 h-4 mr-2" />
            Technicians
          </Button>
        </div>

        {/* Calendar View */}
        {viewMode === "calendar" && (
          <Card className="p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {selectedMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </h2>
              <div className="flex gap-2">
                <Button
                  onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1))}
                  variant="outline"
                >
                  Previous
                </Button>
                <Button
                  onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1))}
                  variant="outline"
                >
                  Next
                </Button>
              </div>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-0 mb-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="text-center font-semibold text-gray-700 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-0 border border-gray-200">{renderCalendar()}</div>
          </Card>
        )}

        {/* List View */}
        {viewMode === "list" && (
          <Card className="p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Maintenance Schedule</h2>
            <div className="space-y-4">
              {maintenanceSchedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4 flex-1">
                    {getStatusIcon(schedule.status)}
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{schedule.equipmentName}</p>
                      <p className="text-sm text-gray-600">{schedule.maintenanceType}</p>
                      <p className="text-xs text-gray-500">
                        Technician: {schedule.technicianName} | {schedule.estimatedHours}h
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        {schedule.scheduledDate.toLocaleDateString()}
                      </p>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(schedule.status)}`}>
                        {schedule.status === "scheduled"
                          ? "Scheduled"
                          : schedule.status === "in_progress"
                            ? "In Progress"
                            : "Completed"}
                      </span>
                    </div>
                    <span className={`font-semibold ${getPriorityColor(schedule.priority)}`}>
                      {schedule.priority.charAt(0).toUpperCase() + schedule.priority.slice(1)}
                    </span>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button
                      onClick={() => setSelectedSchedule(schedule.id)}
                      variant="outline"
                      size="sm"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Technician View */}
        {viewMode === "technician" && (
          <Card className="p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Technician Assignments</h2>
            <div className="space-y-4">
              {technicianAssignments.map((tech) => (
                <div key={tech.technicianId} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-semibold text-gray-900">{tech.technicianName}</p>
                      <p className="text-sm text-gray-600">
                        {tech.completed} completed | {tech.inProgress} in progress | {tech.pending} pending
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">{tech.completionRate}%</p>
                      <p className="text-xs text-gray-600">Completion Rate</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    <div className="bg-blue-50 p-2 rounded text-center">
                      <p className="text-2xl font-bold text-blue-600">{tech.totalAssigned}</p>
                      <p className="text-xs text-gray-600">Assigned</p>
                    </div>
                    <div className="bg-green-50 p-2 rounded text-center">
                      <p className="text-2xl font-bold text-green-600">{tech.completed}</p>
                      <p className="text-xs text-gray-600">Completed</p>
                    </div>
                    <div className="bg-yellow-50 p-2 rounded text-center">
                      <p className="text-2xl font-bold text-yellow-600">{tech.inProgress}</p>
                      <p className="text-xs text-gray-600">In Progress</p>
                    </div>
                    <div className="bg-gray-50 p-2 rounded text-center">
                      <p className="text-2xl font-bold text-gray-600">{tech.averageHours}h</p>
                      <p className="text-xs text-gray-600">Avg Hours</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Schedule Form Modal */}
        {showScheduleForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Schedule Maintenance</h2>
                  <button
                    onClick={() => setShowScheduleForm(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Equipment</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option>Select equipment...</option>
                      <option>Tractor A</option>
                      <option>Pump B</option>
                      <option>Sprayer C</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Maintenance Type</label>
                    <input
                      type="text"
                      placeholder="e.g., Oil Change"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Scheduled Date</label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Technician</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option>Select technician...</option>
                      <option>John Smith</option>
                      <option>Sarah Johnson</option>
                      <option>Mike Davis</option>
                    </select>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={() => setShowScheduleForm(false)}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => {
                        setShowScheduleForm(false);
                        alert("Maintenance scheduled successfully");
                      }}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      Schedule
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default MaintenanceSchedulingDashboard;
