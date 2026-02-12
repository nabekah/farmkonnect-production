/**
 * Budget Alert Panel Component
 * Displays real-time budget alerts with severity levels
 * Allows users to acknowledge and dismiss alerts
 */

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { trpc } from "@/lib/trpc";

interface BudgetAlert {
  id: number;
  categoryName: string;
  variancePercentage: number;
  severity: "low" | "medium" | "high" | "critical";
  alertType: "over_budget" | "approaching_budget" | "under_budget";
  budgetedAmount: number;
  varianceAmount: number;
  acknowledged: boolean;
  createdAt: Date;
}

interface BudgetAlertPanelProps {
  farmId: string;
  onAlertAcknowledged?: () => void;
}

export function BudgetAlertPanel({
  farmId,
  onAlertAcknowledged,
}: BudgetAlertPanelProps) {
  const [expandedAlerts, setExpandedAlerts] = useState<Set<number>>(new Set());
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<number>>(new Set());

  // Fetch active alerts
  const { data: alertsData, refetch } = trpc.budgetAlerts.getActiveAlerts.useQuery(
    { farmId: parseInt(farmId) },
    { enabled: !!farmId }
  );

  // Acknowledge alert mutation
  const { mutate: acknowledgeAlert } = trpc.budgetAlerts.acknowledgeAlert.useMutation({
    onSuccess: () => {
      refetch();
      onAlertAcknowledged?.();
    },
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-GH", {
      style: "currency",
      currency: "GHS",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 border-red-300 text-red-900";
      case "high":
        return "bg-orange-100 border-orange-300 text-orange-900";
      case "medium":
        return "bg-yellow-100 border-yellow-300 text-yellow-900";
      case "low":
        return "bg-blue-100 border-blue-300 text-blue-900";
      default:
        return "bg-gray-100 border-gray-300 text-gray-900";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
      case "high":
        return <AlertCircle className="w-5 h-5" />;
      case "medium":
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return <CheckCircle className="w-5 h-5" />;
    }
  };

  const getAlertMessage = (alert: BudgetAlert) => {
    if (alert.alertType === "over_budget") {
      return `${alert.categoryName} has exceeded budget by ${formatCurrency(Math.abs(alert.varianceAmount))}`;
    } else if (alert.alertType === "approaching_budget") {
      return `${alert.categoryName} is approaching budget limit (${alert.variancePercentage.toFixed(1)}% spent)`;
    }
    return `${alert.categoryName} spending status`;
  };

  const toggleAlert = (alertId: number) => {
    const newExpanded = new Set(expandedAlerts);
    if (newExpanded.has(alertId)) {
      newExpanded.delete(alertId);
    } else {
      newExpanded.add(alertId);
    }
    setExpandedAlerts(newExpanded);
  };

  const dismissAlert = (alertId: number) => {
    const newDismissed = new Set(dismissedAlerts);
    newDismissed.add(alertId);
    setDismissedAlerts(newDismissed);
  };

  if (!alertsData || alertsData.alerts.length === 0) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-green-900">
            <CheckCircle className="w-5 h-5" />
            Budget Status
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-green-800">
          <p>All budget categories are within acceptable limits.</p>
        </CardContent>
      </Card>
    );
  }

  const visibleAlerts = alertsData.alerts.filter(
    (alert) => !dismissedAlerts.has(alert.id)
  );

  return (
    <div className="space-y-4">
      {/* Alert Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Budget Alerts</CardTitle>
          <CardDescription>
            {alertsData.criticalCount > 0 && (
              <span className="text-red-600 font-semibold">
                {alertsData.criticalCount} critical alert{alertsData.criticalCount !== 1 ? "s" : ""}
              </span>
            )}
            {alertsData.criticalCount > 0 && alertsData.highCount > 0 && ", "}
            {alertsData.highCount > 0 && (
              <span className="text-orange-600 font-semibold">
                {alertsData.highCount} high priority alert{alertsData.highCount !== 1 ? "s" : ""}
              </span>
            )}
            {alertsData.count > alertsData.criticalCount + alertsData.highCount && (
              <>
                {(alertsData.criticalCount > 0 || alertsData.highCount > 0) && ", "}
                <span className="text-gray-600">
                  {alertsData.count - alertsData.criticalCount - alertsData.highCount} other alert
                  {alertsData.count - alertsData.criticalCount - alertsData.highCount !== 1 ? "s" : ""}
                </span>
              </>
            )}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Individual Alerts */}
      <div className="space-y-3">
        {visibleAlerts.map((alert) => (
          <div
            key={alert.id}
            className={`border rounded-lg p-4 ${getSeverityColor(alert.severity)}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                {getSeverityIcon(alert.severity)}
                <div className="flex-1">
                  <p className="font-semibold">{getAlertMessage(alert)}</p>
                  <p className="text-sm opacity-75 mt-1">
                    Budget: {formatCurrency(alert.budgetedAmount)} | Spent: {formatCurrency(
                      alert.budgetedAmount + alert.varianceAmount
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleAlert(alert.id)}
                  className="p-1 hover:bg-white hover:bg-opacity-20 rounded"
                >
                  {expandedAlerts.has(alert.id) ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => dismissAlert(alert.id)}
                  className="p-1 hover:bg-white hover:bg-opacity-20 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Expanded Details */}
            {expandedAlerts.has(alert.id) && (
              <div className="mt-4 pt-4 border-t border-current border-opacity-20 space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="opacity-75">Spending Percentage</p>
                    <p className="font-semibold text-lg">
                      {alert.variancePercentage.toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="opacity-75">Variance Amount</p>
                    <p className="font-semibold text-lg">
                      {formatCurrency(alert.varianceAmount)}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="opacity-75 text-sm mb-2">Alert Type</p>
                  <div className="inline-block px-3 py-1 bg-white bg-opacity-30 rounded text-sm font-medium">
                    {alert.alertType === "over_budget"
                      ? "Over Budget"
                      : alert.alertType === "approaching_budget"
                        ? "Approaching Budget"
                        : "Under Budget"}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => acknowledgeAlert({ alertId: alert.id })}
                    className="flex-1"
                  >
                    Acknowledge
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => dismissAlert(alert.id)}
                    className="flex-1"
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Dismissed Alerts Notice */}
      {dismissedAlerts.size > 0 && (
        <div className="text-sm text-gray-600 text-center">
          {dismissedAlerts.size} alert{dismissedAlerts.size !== 1 ? "s" : ""} dismissed
        </div>
      )}
    </div>
  );
}
