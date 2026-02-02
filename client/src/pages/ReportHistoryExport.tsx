import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  Archive,
  FileText,
  Calendar,
  Clock,
  Users,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { trpc } from "@/lib/trpc";

interface ExportFormat {
  format: "pdf" | "excel" | "csv";
  label: string;
  icon: any;
}

const EXPORT_FORMATS: ExportFormat[] = [
  { format: "pdf", label: "PDF", icon: FileText },
  { format: "excel", label: "Excel", icon: FileText },
  { format: "csv", label: "CSV", icon: FileText },
];

export default function ReportHistoryExport() {
  const [farms] = trpc.farms.list.useSuspenseQuery();
  const [selectedFarm, setSelectedFarm] = useState<number | null>(farms?.[0]?.id || null);

  const [selectedFormat, setSelectedFormat] = useState<"pdf" | "excel" | "csv">("pdf");
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });

  const [expandedReport, setExpandedReport] = useState<number | null>(null);

  // Fetch export statistics
  const { data: exportStats } = trpc.reportExport.getExportStats.useQuery(
    { farmId: selectedFarm || 0 },
    { enabled: !!selectedFarm }
  );

  // Fetch farm archives
  const { data: archives, refetch: refetchArchives } = trpc.reportExport.getFarmArchives.useQuery(
    { farmId: selectedFarm || 0 },
    { enabled: !!selectedFarm }
  );

  // Mutations
  const exportReport = trpc.reportExport.exportReport.useMutation();
  const archiveReport = trpc.reportExport.archiveReport.useMutation();
  const restoreArchive = trpc.reportExport.restoreArchive.useMutation();
  const deleteExpiredArchives = trpc.reportExport.deleteExpiredArchives.useMutation();

  const handleExport = async (reportId: number) => {
    try {
      const result = await exportReport.mutateAsync({
        reportHistoryId: reportId,
        farmId: selectedFarm || 0,
        format: selectedFormat,
        reportData: {
          reportId,
          exportedAt: new Date().toISOString(),
        },
      });

      // Download the file
      if (result.downloadUrl) {
        window.open(result.downloadUrl, "_blank");
      }
    } catch (error) {
      alert(`Failed to export report: ${error}`);
    }
  };

  const handleArchive = async (reportId: number) => {
    try {
      await archiveReport.mutateAsync({
        reportHistoryId: reportId,
        farmId: selectedFarm || 0,
        reportData: {
          reportId,
          archivedAt: new Date().toISOString(),
        },
        retentionDays: 365,
      });

      alert("Report archived successfully!");
      refetchArchives();
    } catch (error) {
      alert(`Failed to archive report: ${error}`);
    }
  };

  const handleRestoreArchive = async (archivalId: number) => {
    try {
      await restoreArchive.mutateAsync({ archivalId });
      alert("Archive restored successfully!");
      refetchArchives();
    } catch (error) {
      alert(`Failed to restore archive: ${error}`);
    }
  };

  const handleDeleteExpiredArchives = async () => {
    if (!confirm("Delete all expired archives?")) return;

    try {
      await deleteExpiredArchives.mutateAsync({ farmId: selectedFarm || 0 });
      refetchArchives();
    } catch (error) {
      alert(`Failed to delete archives: ${error}`);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      success: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
      pending: "bg-yellow-100 text-yellow-800",
      generating: "bg-blue-100 text-blue-800",
    };
    return variants[status] || "bg-gray-100 text-gray-800";
  };

  const isExpired = (expiresAt: Date | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Report History & Export</h1>
        <p className="text-muted-foreground mt-2">
          Download, archive, and manage your report history
        </p>
      </div>

      {/* Statistics Cards */}
      {exportStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Exports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{exportStats.totalExports}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {exportStats.totalDownloads} downloads
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Archives
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{exportStats.activeArchives}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {exportStats.expiredArchives} expired
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg Downloads
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {exportStats.averageDownloadsPerExport.toFixed(1)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">per export</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Expired Exports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{exportStats.expiredExports}</div>
              <p className="text-xs text-muted-foreground mt-1">no longer available</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Farm & Format Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Export Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Select Farm</Label>
              <Select
                value={selectedFarm?.toString() || ""}
                onValueChange={(value) => setSelectedFarm(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a farm" />
                </SelectTrigger>
                <SelectContent>
                  {farms?.map((farm) => (
                    <SelectItem key={farm.id} value={farm.id.toString()}>
                      {farm.farmName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Export Format</Label>
              <Select value={selectedFormat} onValueChange={(value: any) => setSelectedFormat(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPORT_FORMATS.map((fmt) => (
                    <SelectItem key={fmt.format} value={fmt.format}>
                      {fmt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Date Range</Label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, startDate: e.target.value })
                  }
                />
                <Input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, endDate: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Archives Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Archive className="w-5 h-5" />
                Archived Reports
              </CardTitle>
              <CardDescription>
                Long-term storage of reports with retention policies
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeleteExpiredArchives}
              disabled={deleteExpiredArchives.isPending}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Expired
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {archives && archives.length > 0 ? (
            <div className="space-y-2">
              {archives.map((archive) => (
                <div
                  key={archive.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <span className="font-semibold">Report #{archive.reportHistoryId}</span>
                      {isExpired(archive.expiresAt) && (
                        <Badge variant="destructive">Expired</Badge>
                      )}
                      {archive.isRestored && (
                        <Badge variant="outline">Restored</Badge>
                      )}
                    </div>
                    <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(archive.archivedAt).toLocaleDateString()}
                      </span>
                      <span>
                        Retention: {archive.retentionDays} days
                      </span>
                      {archive.expiresAt && (
                        <span>
                          Expires: {new Date(archive.expiresAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRestoreArchive(archive.id)}
                      disabled={restoreArchive.isPending || archive.isRestored}
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Archive className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No archived reports yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Reports Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Recent Reports
          </CardTitle>
          <CardDescription>
            Export or archive your recent reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Report ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Generated</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Recipients</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>#1001</TableCell>
                  <TableCell>Financial</TableCell>
                  <TableCell>2026-02-01</TableCell>
                  <TableCell>
                    <Badge className={getStatusBadge("success")}>Success</Badge>
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />3
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleExport(1001)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleArchive(1001)}
                      >
                        <Archive className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>#1000</TableCell>
                  <TableCell>Livestock</TableCell>
                  <TableCell>2026-01-29</TableCell>
                  <TableCell>
                    <Badge className={getStatusBadge("success")}>Success</Badge>
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />2
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleExport(1000)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleArchive(1000)}
                      >
                        <Archive className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
