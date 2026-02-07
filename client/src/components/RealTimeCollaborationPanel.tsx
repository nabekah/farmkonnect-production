import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, Activity, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { BulkOperationEvent } from "@/hooks/useWebSocketProgress";

interface RealTimeCollaborationPanelProps {
  operations: BulkOperationEvent[];
  farmId: number;
}

export function RealTimeCollaborationPanel({
  operations,
  farmId,
}: RealTimeCollaborationPanelProps) {
  const farmOperations = operations.filter((op) => op.farmId === farmId);

  if (farmOperations.length === 0) {
    return null;
  }

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600" />
          <CardTitle className="text-sm">Live Collaboration</CardTitle>
        </div>
        <CardDescription className="text-xs">
          {farmOperations.length} active operation{farmOperations.length !== 1 ? "s" : ""}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {farmOperations.map((operation) => {
          const progress = (operation.current / operation.total) * 100;
          const isCompleted = operation.status === "completed";
          const isFailed = operation.status === "failed";
          const isInProgress = operation.status === "in-progress";

          return (
            <div
              key={operation.id}
              className="space-y-2 p-2 bg-white rounded-lg border border-blue-100"
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {isCompleted && <CheckCircle className="w-4 h-4 text-green-600" />}
                  {isFailed && <AlertCircle className="w-4 h-4 text-red-600" />}
                  {isInProgress && <Activity className="w-4 h-4 text-blue-600 animate-pulse" />}

                  <div>
                    <p className="text-xs font-medium capitalize">
                      {operation.type.replace("-", " ")}
                    </p>
                    {operation.message && (
                      <p className="text-xs text-muted-foreground">{operation.message}</p>
                    )}
                  </div>
                </div>

                <Badge
                  variant={
                    isCompleted
                      ? "default"
                      : isFailed
                        ? "destructive"
                        : isInProgress
                          ? "secondary"
                          : "outline"
                  }
                  className="text-xs"
                >
                  {operation.status}
                </Badge>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {operation.current} / {operation.total}
                  </span>
                  <span className="font-medium">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-1.5" />
              </div>

              {/* Stats */}
              {(operation.successCount !== undefined || operation.failureCount !== undefined) && (
                <div className="flex items-center gap-2 text-xs">
                  {operation.successCount !== undefined && (
                    <span className="text-green-600">
                      ✓ {operation.successCount} success
                    </span>
                  )}
                  {operation.failureCount !== undefined && operation.failureCount > 0 && (
                    <span className="text-red-600">
                      ✗ {operation.failureCount} failed
                    </span>
                  )}
                </div>
              )}

              {/* Timestamp */}
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>
                  {new Date(operation.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

/**
 * Compact version for sidebar or header
 */
export function RealTimeCollaborationBadge({
  operations,
  farmId,
}: RealTimeCollaborationPanelProps) {
  const farmOperations = operations.filter((op) => op.farmId === farmId);
  const activeCount = farmOperations.filter((op) => op.status === "in-progress").length;

  if (activeCount === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-full">
      <Activity className="w-4 h-4 text-blue-600 animate-pulse" />
      <span className="text-xs font-medium text-blue-600">
        {activeCount} operation{activeCount !== 1 ? "s" : ""} running
      </span>
    </div>
  );
}

/**
 * Mini card for dashboard
 */
export function RealTimeCollaborationMini({
  operations,
  farmId,
}: RealTimeCollaborationPanelProps) {
  const farmOperations = operations.filter((op) => op.farmId === farmId);

  if (farmOperations.length === 0) {
    return null;
  }

  const inProgressCount = farmOperations.filter((op) => op.status === "in-progress").length;
  const completedCount = farmOperations.filter((op) => op.status === "completed").length;
  const failedCount = farmOperations.filter((op) => op.status === "failed").length;

  return (
    <Card className="border-blue-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Users className="w-4 h-4" />
          Live Operations
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-2">
        {inProgressCount > 0 && (
          <div className="flex items-center gap-2 text-xs">
            <Activity className="w-3 h-3 text-blue-600 animate-pulse" />
            <span>{inProgressCount} in progress</span>
          </div>
        )}

        {completedCount > 0 && (
          <div className="flex items-center gap-2 text-xs">
            <CheckCircle className="w-3 h-3 text-green-600" />
            <span>{completedCount} completed</span>
          </div>
        )}

        {failedCount > 0 && (
          <div className="flex items-center gap-2 text-xs">
            <AlertCircle className="w-3 h-3 text-red-600" />
            <span>{failedCount} failed</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
