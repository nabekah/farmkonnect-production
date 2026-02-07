import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, AlertCircle, Clock, RotateCcw, Search, Download } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";

interface OperationHistoryPanelProps {
  farmId: number;
}

export function OperationHistoryPanel({ farmId }: OperationHistoryPanelProps) {
  const [operationType, setOperationType] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: history, isLoading } = trpc.operationHistory.getFarmOperationHistory.useQuery({
    farmId,
    operationType: operationType as any,
    status: status as any,
    limit: 50,
  });

  const { data: stats } = trpc.operationHistory.getOperationStats.useQuery({
    farmId,
  });

  const retryMutation = trpc.retryManagement.manualRetry.useMutation();

  const handleRetry = async (operationId: string) => {
    await retryMutation.mutateAsync({ operationId });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "failed":
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case "in-progress":
        return <Clock className="w-4 h-4 text-blue-600 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      case "in-progress":
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Pending</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">Total Operations</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
              <p className="text-xs text-muted-foreground">Completed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
              <p className="text-xs text-muted-foreground">Failed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
              <p className="text-xs text-muted-foreground">In Progress</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Search operation ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8"
              />
            </div>
            <Select value={operationType} onValueChange={setOperationType}>
              <SelectTrigger className="w-40 h-8">
                <SelectValue placeholder="Operation Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                <SelectItem value="batch-edit">Batch Edit</SelectItem>
                <SelectItem value="import">Import</SelectItem>
                <SelectItem value="export">Export</SelectItem>
                <SelectItem value="bulk-register">Bulk Register</SelectItem>
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-40 h-8">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* History Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Operation History</CardTitle>
          <CardDescription className="text-xs">
            {history?.total || 0} operations found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4 text-sm text-muted-foreground">Loading...</div>
          ) : history?.operations.length === 0 ? (
            <div className="text-center py-4 text-sm text-muted-foreground">No operations found</div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="text-xs">
                <TableHeader>
                  <TableRow>
                    <TableHead>Operation ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Success</TableHead>
                    <TableHead>Failed</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history?.operations.map((op) => (
                    <TableRow key={op.id}>
                      <TableCell className="font-mono text-xs">{op.id.slice(0, 8)}...</TableCell>
                      <TableCell className="capitalize">{op.operationType.replace("-", " ")}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(op.status)}
                          {getStatusBadge(op.status)}
                        </div>
                      </TableCell>
                      <TableCell>{op.totalItems}</TableCell>
                      <TableCell className="text-green-600">{op.successCount}</TableCell>
                      <TableCell className="text-red-600">{op.failureCount}</TableCell>
                      <TableCell>
                        {op.duration ? `${Math.round(op.duration / 1000)}s` : "-"}
                      </TableCell>
                      <TableCell className="text-xs">
                        {new Date(op.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {op.status === "failed" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 text-xs"
                            onClick={() => handleRetry(op.id)}
                            disabled={retryMutation.isPending}
                          >
                            <RotateCcw className="w-3 h-3 mr-1" />
                            Retry
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
