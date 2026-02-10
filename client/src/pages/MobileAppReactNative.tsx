import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Smartphone,
  Wifi,
  WifiOff,
  Bell,
  CheckCircle,
  AlertCircle,
  MapPin,
  Clock,
  Zap,
  BarChart3,
  Download,
  Upload,
  Sync,
} from "lucide-react";

/**
 * Mobile App with React Native Component
 * Native iOS/Android app with offline-first sync and push notifications
 */
export const MobileAppReactNative: React.FC = () => {
  const [viewMode, setViewMode] = useState<
    "overview" | "tasks" | "notifications" | "offline" | "analytics" | "sync"
  >("overview");
  const [isOnline, setIsOnline] = useState(true);

  // Mock data
  const dashboard = {
    activeTasksCount: 5,
    pendingAlertsCount: 2,
    equipmentStatusOk: true,
  };

  const tasks = [
    {
      id: 1,
      title: "Water crops in Field A",
      description: "Irrigate maize field",
      dueDate: "2026-02-11",
      priority: "high",
      status: "pending",
      location: { lat: 5.6037, lng: -0.187 },
    },
    {
      id: 2,
      title: "Check equipment",
      description: "Inspect pump condition",
      dueDate: "2026-02-12",
      priority: "medium",
      status: "pending",
      location: { lat: 5.6038, lng: -0.188 },
    },
  ];

  const notifications = [
    {
      id: 1,
      title: "Maintenance Alert",
      message: "Pump maintenance due today",
      type: "alert",
      read: false,
    },
    {
      id: 2,
      title: "Weather Update",
      message: "Rain expected tomorrow",
      type: "weather",
      read: false,
    },
  ];

  const analytics = {
    tasksCompleted: 45,
    tasksOverdue: 2,
    equipmentDowntime: 0,
    productivityScore: 0.92,
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mobile App - React Native</h1>
            <p className="text-gray-600 mt-1">Native iOS/Android app with offline-first sync</p>
          </div>
          <Smartphone className="w-12 h-12 text-blue-600 opacity-20" />
        </div>

        {/* Connection Status */}
        <Card className={`p-4 mb-6 ${isOnline ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isOnline ? (
                <>
                  <Wifi className="w-5 h-5 text-green-600" />
                  <span className="font-bold text-green-800">Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-5 h-5 text-red-600" />
                  <span className="font-bold text-red-800">Offline</span>
                </>
              )}
            </div>
            <Button
              onClick={() => setIsOnline(!isOnline)}
              variant="outline"
              className="text-sm"
            >
              {isOnline ? "Go Offline" : "Go Online"}
            </Button>
          </div>
        </Card>

        {/* View Mode Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          <Button
            onClick={() => setViewMode("overview")}
            variant={viewMode === "overview" ? "default" : "outline"}
            className={viewMode === "overview" ? "bg-blue-600 text-white" : ""}
          >
            <Smartphone className="w-4 h-4 mr-2" />
            Overview
          </Button>
          <Button
            onClick={() => setViewMode("tasks")}
            variant={viewMode === "tasks" ? "default" : "outline"}
            className={viewMode === "tasks" ? "bg-blue-600 text-white" : ""}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Tasks
          </Button>
          <Button
            onClick={() => setViewMode("notifications")}
            variant={viewMode === "notifications" ? "default" : "outline"}
            className={viewMode === "notifications" ? "bg-blue-600 text-white" : ""}
          >
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </Button>
          <Button
            onClick={() => setViewMode("offline")}
            variant={viewMode === "offline" ? "default" : "outline"}
            className={viewMode === "offline" ? "bg-blue-600 text-white" : ""}
          >
            <WifiOff className="w-4 h-4 mr-2" />
            Offline Mode
          </Button>
          <Button
            onClick={() => setViewMode("analytics")}
            variant={viewMode === "analytics" ? "default" : "outline"}
            className={viewMode === "analytics" ? "bg-blue-600 text-white" : ""}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </Button>
          <Button
            onClick={() => setViewMode("sync")}
            variant={viewMode === "sync" ? "default" : "outline"}
            className={viewMode === "sync" ? "bg-blue-600 text-white" : ""}
          >
            <Sync className="w-4 h-4 mr-2" />
            Sync
          </Button>
        </div>

        {/* Overview View */}
        {viewMode === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-6 bg-blue-50 border-blue-200">
                <p className="text-gray-600 text-sm">Active Tasks</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">{dashboard.activeTasksCount}</p>
              </Card>
              <Card className="p-6 bg-red-50 border-red-200">
                <p className="text-gray-600 text-sm">Pending Alerts</p>
                <p className="text-3xl font-bold text-red-600 mt-2">{dashboard.pendingAlertsCount}</p>
              </Card>
              <Card className="p-6 bg-green-50 border-green-200">
                <p className="text-gray-600 text-sm">Equipment Status</p>
                <p className="text-3xl font-bold text-green-600 mt-2">OK</p>
              </Card>
            </div>

            <Card className="p-6">
              <p className="font-bold text-gray-900 mb-4">Mobile App Features</p>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded">
                  <Download className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-gray-900">Offline-First Sync</p>
                    <p className="text-sm text-gray-600">Work offline and sync when connected</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded">
                  <Bell className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-gray-900">Push Notifications</p>
                    <p className="text-sm text-gray-600">Real-time alerts and updates</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded">
                  <MapPin className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-gray-900">Location Tracking</p>
                    <p className="text-sm text-gray-600">GPS-based task navigation</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Tasks View */}
        {viewMode === "tasks" && (
          <div className="space-y-4">
            {tasks.map((task) => (
              <Card key={task.id} className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-gray-900">{task.title}</p>
                    <p className="text-sm text-gray-600">{task.description}</p>
                  </div>
                  <span className={`px-3 py-1 rounded text-sm font-medium ${task.priority === "high" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}`}>
                    {task.priority === "high" ? "High" : "Medium"}
                  </span>
                </div>

                <div className="flex items-center gap-4 mb-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4 text-gray-600" />
                    <span className="text-gray-600">{task.dueDate}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-gray-600" />
                    <span className="text-gray-600">
                      {task.location.lat.toFixed(4)}, {task.location.lng.toFixed(4)}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button className="flex-1 bg-blue-600 hover:bg-blue-700">Start Task</Button>
                  <Button variant="outline" className="flex-1">View Details</Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Notifications View */}
        {viewMode === "notifications" && (
          <div className="space-y-4">
            {notifications.map((notif) => (
              <Card key={notif.id} className={`p-6 ${notif.type === "alert" ? "bg-red-50 border-red-200" : "bg-blue-50 border-blue-200"}`}>
                <div className="flex items-start gap-3">
                  {notif.type === "alert" ? (
                    <AlertCircle className="w-6 h-6 text-red-600 mt-1 flex-shrink-0" />
                  ) : (
                    <Bell className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
                  )}
                  <div>
                    <p className="font-bold text-gray-900">{notif.title}</p>
                    <p className="text-sm text-gray-700 mt-1">{notif.message}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Offline Mode View */}
        {viewMode === "offline" && (
          <div className="space-y-4">
            <Card className="p-6 bg-yellow-50 border-yellow-200">
              <p className="font-bold text-gray-900 mb-2">Offline Mode</p>
              <p className="text-sm text-gray-700">
                Your device is currently {isOnline ? "online" : "offline"}. Changes will be synced when connection is restored.
              </p>
            </Card>

            <Card className="p-6">
              <p className="font-bold text-gray-900 mb-4">Cached Data</p>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between p-3 bg-gray-50 rounded">
                  <span className="text-gray-600">Tasks</span>
                  <span className="font-bold text-gray-900">5 items</span>
                </div>
                <div className="flex justify-between p-3 bg-gray-50 rounded">
                  <span className="text-gray-600">Notifications</span>
                  <span className="font-bold text-gray-900">12 items</span>
                </div>
                <div className="flex justify-between p-3 bg-gray-50 rounded">
                  <span className="text-gray-600">Farm Data</span>
                  <span className="font-bold text-gray-900">Complete</span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <p className="font-bold text-gray-900 mb-4">Pending Changes</p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 p-2 bg-blue-50 rounded">
                  <Upload className="w-4 h-4 text-blue-600" />
                  <span className="text-gray-700">2 tasks marked as completed</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-blue-50 rounded">
                  <Upload className="w-4 h-4 text-blue-600" />
                  <span className="text-gray-700">1 field note added</span>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Analytics View */}
        {viewMode === "analytics" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <p className="text-gray-600 text-sm">Tasks Completed</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{analytics.tasksCompleted}</p>
            </Card>
            <Card className="p-6">
              <p className="text-gray-600 text-sm">Tasks Overdue</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{analytics.tasksOverdue}</p>
            </Card>
            <Card className="p-6">
              <p className="text-gray-600 text-sm">Equipment Downtime</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{analytics.equipmentDowntime}h</p>
            </Card>
            <Card className="p-6">
              <p className="text-gray-600 text-sm">Productivity Score</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">{(analytics.productivityScore * 100).toFixed(0)}%</p>
            </Card>
          </div>
        )}

        {/* Sync View */}
        {viewMode === "sync" && (
          <div className="space-y-4">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="font-bold text-gray-900">Sync Status</p>
                <Button className="bg-green-600 hover:bg-green-700">
                  <Sync className="w-4 h-4 mr-2" />
                  Sync Now
                </Button>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded">
                  <span className="text-gray-700">Last Sync</span>
                  <span className="font-bold text-green-600">2 minutes ago</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <span className="text-gray-700">Pending Changes</span>
                  <span className="font-bold text-gray-900">3 items</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <span className="text-gray-700">Sync Conflicts</span>
                  <span className="font-bold text-gray-900">0</span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <p className="font-bold text-gray-900 mb-3">Recent Syncs</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between p-2 bg-gray-50 rounded">
                  <span className="text-gray-600">Today 2:30 PM</span>
                  <span className="text-green-600">✓ Success</span>
                </div>
                <div className="flex justify-between p-2 bg-gray-50 rounded">
                  <span className="text-gray-600">Today 12:15 PM</span>
                  <span className="text-green-600">✓ Success</span>
                </div>
                <div className="flex justify-between p-2 bg-gray-50 rounded">
                  <span className="text-gray-600">Today 9:45 AM</span>
                  <span className="text-green-600">✓ Success</span>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileAppReactNative;
