import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Clock, XCircle } from "lucide-react";

interface WorkflowExecution {
  id: number;
  workflowName: string;
  status: "pending" | "running" | "completed" | "failed";
  triggeredBy: string;
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  errorMessage?: string;
  executedActions: string[];
}

export function WorkflowExecutionMonitor() {
  const [executions, setExecutions] = useState<WorkflowExecution[]>([
    {
      id: 1,
      workflowName: "Critical Alert Response",
      status: "completed",
      triggeredBy: "system",
      startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000 + 45 * 1000),
      duration: 45,
      executedActions: ["Lock Account", "Send Alert", "Create Ticket"],
    },
    {
      id: 2,
      workflowName: "Failed Login Lockout",
      status: "completed",
      triggeredBy: "system",
      startedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 1 * 60 * 60 * 1000 + 30 * 1000),
      duration: 30,
      executedActions: ["Disable User", "Email Admin"],
    },
    {
      id: 3,
      workflowName: "Suspicious Device Detection",
      status: "running",
      triggeredBy: "system",
      startedAt: new Date(Date.now() - 5 * 60 * 1000),
      executedActions: ["Verify Device"],
    },
    {
      id: 4,
      workflowName: "Budget Exceeded Alert",
      status: "failed",
      triggeredBy: "system",
      startedAt: new Date(Date.now() - 30 * 60 * 1000),
      completedAt: new Date(Date.now() - 30 * 60 * 1000 + 10 * 1000),
      duration: 10,
      errorMessage: "Failed to send email notification",
      executedActions: ["Check Budget"],
    },
  ]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "running":
        return <Clock className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "running":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const stats = {
    total: executions.length,
    completed: executions.filter((e) => e.status === "completed").length,
    failed: executions.filter((e) => e.status === "failed").length,
    running: executions.filter((e) => e.status === "running").length,
  };

  const avgDuration =
    executions
      .filter((e) => e.duration)
      .reduce((sum, e) => sum + (e.duration || 0), 0) /
      executions.filter((e) => e.duration).length || 0;

  return (
    <div className="space-y-4">
      {/* Statistics */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total Executions</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
              <p className="text-sm text-muted-foreground">Failed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.running}</p>
              <p className="text-sm text-muted-foreground">Running</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{Math.round(avgDuration)}s</p>
              <p className="text-sm text-muted-foreground">Avg Duration</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Execution History */}
      <Card>
        <CardHeader>
          <CardTitle>Workflow Execution History</CardTitle>
          <CardDescription>
            Real-time monitoring of workflow executions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {executions.map((execution) => (
              <div
                key={execution.id}
                className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start gap-3 flex-1">
                  {getStatusIcon(execution.status)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{execution.workflowName}</h4>
                      <Badge className={getStatusColor(execution.status)}>
                        {execution.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Triggered by: {execution.triggeredBy}
                    </p>
                    <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                      <span>
                        Started: {execution.startedAt.toLocaleString()}
                      </span>
                      {execution.completedAt && (
                        <span>
                          Completed: {execution.completedAt.toLocaleString()}
                        </span>
                      )}
                      {execution.duration && (
                        <span>Duration: {execution.duration}s</span>
                      )}
                    </div>

                    {/* Executed Actions */}
                    {execution.executedActions.length > 0 && (
                      <div className="mt-2 flex gap-2 flex-wrap">
                        {execution.executedActions.map((action, idx) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className="text-xs"
                          >
                            {action}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Error Message */}
                    {execution.errorMessage && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                        <p className="font-semibold">Error:</p>
                        <p>{execution.errorMessage}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Execution Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Execution Timeline</CardTitle>
          <CardDescription>
            Visual timeline of workflow executions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {executions.map((execution) => (
              <div key={execution.id} className="flex items-center gap-4">
                <div className="w-32 text-sm font-medium truncate">
                  {execution.workflowName}
                </div>
                <div className="flex-1 h-8 bg-gray-100 rounded-full overflow-hidden relative">
                  <div
                    className={`h-full rounded-full ${
                      execution.status === "completed"
                        ? "bg-green-500"
                        : execution.status === "failed"
                        ? "bg-red-500"
                        : execution.status === "running"
                        ? "bg-blue-500"
                        : "bg-yellow-500"
                    }`}
                    style={{
                      width: execution.status === "running" ? "50%" : "100%",
                    }}
                  />
                </div>
                <div className="w-20 text-right text-sm text-muted-foreground">
                  {execution.duration ? `${execution.duration}s` : "..."}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
