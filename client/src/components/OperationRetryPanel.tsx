import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, RotateCcw, CheckCircle, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";

interface OperationRetryPanelProps {
  operationId: string;
}

export function OperationRetryPanel({ operationId }: OperationRetryPanelProps) {
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { data: retryStatus, isLoading, refetch } = trpc.retryManagement.getRetryStatus.useQuery(
    { operationId },
    { refetchInterval: autoRefresh ? 5000 : false }
  );

  const { data: retryHistory } = trpc.retryManagement.getRetryHistory.useQuery({
    operationId,
  });

  const retryMutation = trpc.retryManagement.manualRetry.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const handleRetry = async () => {
    await retryMutation.mutateAsync({ operationId });
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading retry status...</div>;
  }

  if (!retryStatus) {
    return <div className="text-sm text-muted-foreground">Operation not found</div>;
  }

  const progressPercent = (retryStatus.retryCount / retryStatus.maxRetries) * 100;

  return (
    <div className="space-y-4">
      {/* Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Retry Status</CardTitle>
          <CardDescription className="text-xs">
            {retryStatus.operationId.slice(0, 8)}...
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Current Status:</span>
            <Badge
              variant={
                retryStatus.status === "completed"
                  ? "default"
                  : retryStatus.status === "failed"
                    ? "destructive"
                    : "secondary"
              }
            >
              {retryStatus.status}
            </Badge>
          </div>

          {/* Retry Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Retry Attempts:</span>
              <span className="font-medium">
                {retryStatus.retryCount} / {retryStatus.maxRetries}
              </span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>

          {/* Can Retry Alert */}
          {retryStatus.canRetry && retryStatus.status === "failed" && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-sm text-yellow-800">
                This operation can be retried. Click the button below to retry.
              </AlertDescription>
            </Alert>
          )}

          {/* Max Retries Exceeded Alert */}
          {!retryStatus.canRetry && retryStatus.status === "failed" && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-sm text-red-800">
                Maximum retry attempts ({retryStatus.maxRetries}) exceeded. Manual intervention required.
              </AlertDescription>
            </Alert>
          )}

          {/* Retry Button */}
          {retryStatus.canRetry && (
            <Button
              onClick={handleRetry}
              disabled={retryMutation.isPending}
              className="w-full"
              size="sm"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              {retryMutation.isPending ? "Retrying..." : "Retry Operation"}
            </Button>
          )}

          {/* Last Retry Info */}
          {retryStatus.lastRetry && (
            <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
              <div>
                <span className="font-medium">Last Attempt:</span>{" "}
                {new Date(retryStatus.lastRetry.createdAt).toLocaleString()}
              </div>
              {retryStatus.lastRetry.nextRetryAt && (
                <div>
                  <span className="font-medium">Next Retry:</span>{" "}
                  {new Date(retryStatus.lastRetry.nextRetryAt).toLocaleString()}
                </div>
              )}
              {retryStatus.lastRetry.errorMessage && (
                <div>
                  <span className="font-medium">Error:</span> {retryStatus.lastRetry.errorMessage}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Retry History */}
      {retryHistory && retryHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Retry History</CardTitle>
            <CardDescription className="text-xs">{retryHistory.length} attempts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {retryHistory.map((retry, index) => (
                <div
                  key={retry.id}
                  className="flex items-start gap-3 p-2 rounded border border-gray-200"
                >
                  <div className="pt-1">
                    {retry.status === "completed" && (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    )}
                    {retry.status === "failed" && (
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                    )}
                    {retry.status === "pending" && (
                      <Clock className="w-4 h-4 text-blue-600" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium">
                        Attempt #{retry.retryAttempt}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {retry.status}
                      </Badge>
                    </div>
                    {retry.errorMessage && (
                      <p className="text-xs text-muted-foreground mt-1">{retry.errorMessage}</p>
                    )}
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(retry.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Auto Refresh Toggle */}
      <div className="flex items-center gap-2 text-xs">
        <input
          type="checkbox"
          id="autoRefresh"
          checked={autoRefresh}
          onChange={(e) => setAutoRefresh(e.target.checked)}
          className="rounded"
        />
        <label htmlFor="autoRefresh" className="cursor-pointer">
          Auto-refresh every 5 seconds
        </label>
      </div>
    </div>
  );
}
