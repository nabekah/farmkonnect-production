import React, { useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, TrendingUp, CheckCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface BudgetAlertsWidgetProps {
  farmId: string;
}

export const BudgetAlertsWidget: React.FC<BudgetAlertsWidgetProps> = ({ farmId }) => {
  const utils = trpc.useUtils();

  // Get unread alerts
  const { data: alerts = [], isLoading: alertsLoading } = trpc.budgetAlerts.getAlerts.useQuery(
    { farmId, includeRead: false },
    { enabled: !!farmId }
  );

  // Get budget summary
  const { data: summary } = trpc.budgetAlerts.getBudgetSummary.useQuery(
    { farmId },
    { enabled: !!farmId }
  );

  // Get budget vs actual
  const { data: budgetVsActual = [] } = trpc.budgetAlerts.getBudgetVsActual.useQuery(
    { farmId },
    { enabled: !!farmId }
  );

  // Check budgets mutation
  const checkBudgetsMutation = trpc.budgetAlerts.checkBudgets.useMutation({
    onSuccess: (data) => {
      if (data.alerts.length > 0) {
        toast.warning(`${data.alerts.length} budget alert(s) created!`);
      } else {
        toast.success("All budgets are within limits");
      }
      utils.budgetAlerts.getAlerts.invalidate();
      utils.budgetAlerts.getBudgetSummary.invalidate();
    },
    onError: (error) => {
      toast.error("Failed to check budgets");
    }
  });

  // Mark alert as read
  const markAsReadMutation = trpc.budgetAlerts.markAsRead.useMutation({
    onSuccess: () => {
      utils.budgetAlerts.getAlerts.invalidate();
    },
    onError: () => {
      toast.error("Failed to mark alert as read");
    }
  });

  // Auto-check budgets on mount
  useEffect(() => {
    if (farmId) {
      checkBudgetsMutation.mutate({ farmId, warningThreshold: 75, criticalThreshold: 90 });
    }
  }, [farmId]);

  const getAlertIcon = (alertType: string) => {
    switch (alertType) {
      case "exceeded":
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case "critical":
        return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      case "warning":
        return <TrendingUp className="h-5 w-5 text-yellow-600" />;
      default:
        return <CheckCircle className="h-5 w-5 text-green-600" />;
    }
  };

  const getAlertColor = (alertType: string) => {
    switch (alertType) {
      case "exceeded":
        return "bg-red-50 border-red-200";
      case "critical":
        return "bg-orange-50 border-orange-200";
      case "warning":
        return "bg-yellow-50 border-yellow-200";
      default:
        return "bg-green-50 border-green-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Budget Summary Card */}
      {summary && (
        <Card>
          <CardHeader>
            <CardTitle>Budget Summary</CardTitle>
            <CardDescription>Overview of all budgets for this farm</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Total Allocated</p>
                <p className="text-2xl font-bold">GHS {summary.totalAllocated?.toLocaleString('en-US', { maximumFractionDigits: 2 }) || '0'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Spent</p>
                <p className="text-2xl font-bold">GHS {summary.totalSpent?.toLocaleString('en-US', { maximumFractionDigits: 2 }) || '0'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Remaining</p>
                <p className="text-2xl font-bold text-green-600">GHS {summary.remaining?.toLocaleString('en-US', { maximumFractionDigits: 2 }) || '0'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Usage</p>
                <p className={`text-2xl font-bold ${summary.percentageUsed > 90 ? 'text-red-600' : summary.percentageUsed > 75 ? 'text-yellow-600' : 'text-green-600'}`}>
                  {summary.percentageUsed}%
                </p>
              </div>
            </div>

            {/* Budget Status */}
            <div className="pt-4 border-t">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Total Budgets</p>
                  <p className="text-xl font-bold">{summary.totalBudgets}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">At Risk</p>
                  <p className={`text-xl font-bold ${summary.budgetsAtRisk > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                    {summary.budgetsAtRisk}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Exceeded</p>
                  <p className={`text-xl font-bold ${summary.budgetsExceeded > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {summary.budgetsExceeded}
                  </p>
                </div>
              </div>
            </div>

            <Button 
              onClick={() => checkBudgetsMutation.mutate({ farmId, warningThreshold: 75, criticalThreshold: 90 })}
              disabled={checkBudgetsMutation.isPending}
              className="w-full mt-4"
            >
              {checkBudgetsMutation.isPending ? "Checking..." : "Check Budgets Now"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Active Alerts */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Budget Alerts ({alerts.length})</CardTitle>
            <CardDescription>Budgets that need your attention</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.map((alert: any) => (
              <div
                key={alert.id}
                className={`border rounded-lg p-4 flex items-start justify-between ${getAlertColor(alert.alert_type)}`}
              >
                <div className="flex items-start gap-3 flex-1">
                  {getAlertIcon(alert.alert_type)}
                  <div className="flex-1">
                    <p className="font-semibold">{alert.budget_name}</p>
                    <p className="text-sm text-gray-600">
                      {alert.threshold_percentage}% of budget used
                    </p>
                    <p className="text-sm text-gray-600">
                      Spent: GHS {alert.current_spending?.toLocaleString('en-US', { maximumFractionDigits: 2 }) || '0'} / 
                      GHS {alert.budget_amount?.toLocaleString('en-US', { maximumFractionDigits: 2 }) || '0'}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => markAsReadMutation.mutate({ alertId: alert.id.toString() })}
                  disabled={markAsReadMutation.isPending}
                >
                  Dismiss
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Budget vs Actual Table */}
      {budgetVsActual.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Budget vs Actual</CardTitle>
            <CardDescription>Detailed breakdown of all budgets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Budget</th>
                    <th className="text-right py-2">Allocated</th>
                    <th className="text-right py-2">Spent</th>
                    <th className="text-right py-2">Remaining</th>
                    <th className="text-right py-2">Usage</th>
                    <th className="text-center py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {budgetVsActual.map((budget: any) => (
                    <tr key={budget.budgetId} className="border-b hover:bg-gray-50">
                      <td className="py-3">{budget.budgetName}</td>
                      <td className="text-right">GHS {budget.allocated?.toLocaleString('en-US', { maximumFractionDigits: 2 })}</td>
                      <td className="text-right">GHS {budget.spent?.toLocaleString('en-US', { maximumFractionDigits: 2 })}</td>
                      <td className="text-right">GHS {budget.remaining?.toLocaleString('en-US', { maximumFractionDigits: 2 })}</td>
                      <td className="text-right font-semibold">{budget.percentageUsed}%</td>
                      <td className="text-center">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          budget.status === 'exceeded' ? 'bg-red-100 text-red-800' :
                          budget.status === 'critical' ? 'bg-orange-100 text-orange-800' :
                          budget.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {budget.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {alerts.length === 0 && !alertsLoading && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <p className="text-lg font-semibold text-gray-800">All Budgets Healthy</p>
              <p className="text-gray-500">No budget alerts at this time</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BudgetAlertsWidget;
