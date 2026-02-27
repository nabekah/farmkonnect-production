import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  BarChart3,
  PieChart as PieChartIcon,
  Download,
  Filter,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

/**
 * Worker Status Dashboard
 * Shows worker availability, role distribution, and status across all farms
 */
export default function WorkerStatusDashboard() {
  const { user } = useAuth();
  const [selectedFarmId, setSelectedFarmId] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  // Fetch data
  const { data: farms } = trpc.farms.list.useQuery();
  const { data: allWorkers } = trpc.workforce.workers.getAllWorkers.useQuery({});
  const { data: farmWorkers } = trpc.workforce.workers.list.useQuery(
    selectedFarmId ? { farmId: selectedFarmId } : { farmId: farms?.[0]?.id || 1 },
    { enabled: !!selectedFarmId || !!farms }
  );

  // Use selected farm workers or all workers
  const workers = selectedFarmId ? farmWorkers : allWorkers;

  // Calculate statistics
  const stats = useMemo(() => {
    if (!workers) return { total: 0, active: 0, inactive: 0, onLeave: 0 };

    const filtered = workers.filter((w) => {
      if (selectedStatus === "all") return true;
      return w.status === selectedStatus;
    });

    return {
      total: filtered.length,
      active: filtered.filter((w) => w.status === "active").length,
      inactive: filtered.filter((w) => w.status === "inactive").length,
      onLeave: filtered.filter((w) => w.status === "on_leave").length,
    };
  }, [workers, selectedStatus]);

  // Group workers by role
  const workersByRole = useMemo(() => {
    if (!workers) return {};

    const grouped: Record<string, number> = {};
    workers.forEach((w) => {
      if (selectedStatus === "all" || w.status === selectedStatus) {
        grouped[w.role] = (grouped[w.role] || 0) + 1;
      }
    });
    return grouped;
  }, [workers, selectedStatus]);

  // Group workers by farm
  const workersByFarm = useMemo(() => {
    if (!workers) return {};

    const grouped: Record<string, number> = {};
    workers.forEach((w) => {
      const farmName = farms?.find((f) => f.id === w.farmId)?.farmName || `Farm ${w.farmId}`;
      if (selectedStatus === "all" || w.status === selectedStatus) {
        grouped[farmName] = (grouped[farmName] || 0) + 1;
      }
    });
    return grouped;
  }, [workers, farms, selectedStatus]);

  const handleExportCSV = () => {
    if (!workers) return;

    const headers = ["Name", "Role", "Farm", "Status", "Contact", "Email", "Hire Date"];
    const rows = workers.map((w) => [
      w.name,
      w.role,
      farms?.find((f) => f.id === w.farmId)?.farmName || `Farm ${w.farmId}`,
      w.status,
      w.contact || "",
      w.email || "",
      w.hireDate ? new Date(w.hireDate).toLocaleDateString() : "",
    ]);

    const csv = [headers, ...rows].map((row) => row.map(cell => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `worker-status-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Worker Status Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor worker availability, roles, and status across all farms
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4" />
          <label className="text-sm font-medium">Farm:</label>
          <select
            value={selectedFarmId || ""}
            onChange={(e) => setSelectedFarmId(e.target.value ? parseInt(e.target.value) : null)}
            className="px-3 py-2 border border-input rounded-md bg-background text-sm"
          >
            <option value="">All Farms</option>
            {farms?.map((farm) => (
              <option key={farm.id} value={farm.id}>
                {farm.farmName}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Status:</label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border border-input rounded-md bg-background text-sm"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="on_leave">On Leave</option>
          </select>
        </div>

        <Button onClick={handleExportCSV} variant="outline" size="sm" className="ml-auto">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Workers</CardTitle>
            <Users className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {selectedFarmId ? "Selected farm" : "All farms"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.total > 0 ? `${((stats.active / stats.total) * 100).toFixed(0)}%` : "0%"} of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On Leave</CardTitle>
            <Clock className="w-4 h-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.onLeave}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.total > 0 ? `${((stats.onLeave / stats.total) * 100).toFixed(0)}%` : "0%"} of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
            <AlertCircle className="w-4 h-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inactive}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.total > 0 ? `${((stats.inactive / stats.total) * 100).toFixed(0)}%` : "0%"} of total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Workers by Role */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Workers by Role
            </CardTitle>
            <CardDescription>Distribution of workers across different roles</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(workersByRole).length > 0 ? (
                Object.entries(workersByRole).map(([role, count]) => (
                  <div key={role} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{role}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${
                              stats.total > 0 ? (count / stats.total) * 100 : 0
                            }%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-bold w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No workers found</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Workers by Farm */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="w-4 h-4" />
              Workers by Farm
            </CardTitle>
            <CardDescription>Distribution of workers across farms</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(workersByFarm).length > 0 ? (
                Object.entries(workersByFarm).map(([farm, count]) => (
                  <div key={farm} className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate">{farm}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{
                            width: `${
                              stats.total > 0 ? (count / stats.total) * 100 : 0
                            }%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-bold w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No workers found</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Workers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Worker Details</CardTitle>
          <CardDescription>Complete list of workers with their information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4 font-medium">Name</th>
                  <th className="text-left py-2 px-4 font-medium">Role</th>
                  <th className="text-left py-2 px-4 font-medium">Farm</th>
                  <th className="text-left py-2 px-4 font-medium">Status</th>
                  <th className="text-left py-2 px-4 font-medium">Contact</th>
                  <th className="text-left py-2 px-4 font-medium">Hire Date</th>
                </tr>
              </thead>
              <tbody>
                {workers && workers.length > 0 ? (
                  workers
                    .filter((w) => selectedStatus === "all" || w.status === selectedStatus)
                    .map((worker) => (
                      <tr key={worker.id} className="border-b hover:bg-gray-50">
                        <td className="py-2 px-4">{worker.name}</td>
                        <td className="py-2 px-4">{worker.role}</td>
                        <td className="py-2 px-4">
                          {farms?.find((f) => f.id === worker.farmId)?.farmName || `Farm ${worker.farmId}`}
                        </td>
                        <td className="py-2 px-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              worker.status === "active"
                                ? "bg-green-100 text-green-800"
                                : worker.status === "on_leave"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-red-100 text-red-800"
                            }`}
                          >
                            {worker.status}
                          </span>
                        </td>
                        <td className="py-2 px-4">{worker.contact || "-"}</td>
                        <td className="py-2 px-4">
                          {worker.hireDate ? new Date(worker.hireDate).toLocaleDateString() : "-"}
                        </td>
                      </tr>
                    ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-4 px-4 text-center text-muted-foreground">
                      No workers found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
