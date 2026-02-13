import React, { useState } from 'react';
import { trpc } from '@/lib/trpc';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle2, Clock, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

interface BudgetAlertsPanelProps {
  farmId: string;
}

export function BudgetAlertsPanel({ farmId }: BudgetAlertsPanelProps) {
  const [filter, setFilter] = useState<'all' | 'warning' | 'critical'>('all');

  // Fetch budget alerts
  const { data: alerts, isLoading } = trpc.financialAnalysis.getBudgetAlerts?.useQuery?.(
    { farmId },
    { enabled: !!farmId }
  ) || { data: [], isLoading: false };

  // Mark alert as read mutation
  const markAsReadMutation = trpc.financialAnalysis.markBudgetAlertAsRead?.useMutation?.() || {
    mutate: () => toast.error('Feature not yet available'),
  };

  const handleMarkAsRead = (alertId: string) => {
    markAsReadMutation.mutate(
      { alertId },
      {
        onSuccess: () => {
          toast.success('Alert marked as read');
        },
        onError: (error: any) => {
          toast.error(error.message || 'Failed to mark alert as read');
        },
      }
    );
  };

  const filteredAlerts = alerts?.filter((alert: any) => {
    if (filter === 'all') return true;
    if (filter === 'warning') return alert.percentageUsed >= 80 && alert.percentageUsed < 95;
    if (filter === 'critical') return alert.percentageUsed >= 95;
    return true;
  }) || [];

  const getAlertLevel = (percentageUsed: number) => {
    if (percentageUsed >= 95) return 'critical';
    if (percentageUsed >= 80) return 'warning';
    return 'normal';
  };

  const getAlertColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-green-50 border-green-200';
    }
  };

  const getAlertIcon = (level: string) => {
    switch (level) {
      case 'critical':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <TrendingUp className="w-5 h-5 text-yellow-600" />;
      default:
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
    }
  };

  const getBadgeVariant = (level: string) => {
    switch (level) {
      case 'critical':
        return 'destructive';
      case 'warning':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Budget Alerts</CardTitle>
            <CardDescription>
              Monitor spending against your budgets
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
            >
              All
            </Button>
            <Button
              size="sm"
              variant={filter === 'warning' ? 'default' : 'outline'}
              onClick={() => setFilter('warning')}
            >
              Warning
            </Button>
            <Button
              size="sm"
              variant={filter === 'critical' ? 'default' : 'outline'}
              onClick={() => setFilter('critical')}
            >
              Critical
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-6 text-gray-500">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-50 animate-spin" />
            <p>Loading alerts...</p>
          </div>
        ) : filteredAlerts.length > 0 ? (
          <div className="space-y-3">
            {filteredAlerts.map((alert: any) => {
              const level = getAlertLevel(alert.percentageUsed);
              const remaining = alert.budgetedAmount - alert.actualAmount;
              const percentageRemaining = 100 - alert.percentageUsed;

              return (
                <div
                  key={alert.id}
                  className={`p-4 border rounded-lg ${getAlertColor(level)}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3 flex-1">
                      {getAlertIcon(level)}
                      <div>
                        <h3 className="font-semibold capitalize">
                          {alert.expenseType.replace(/_/g, ' ')}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {alert.actualAmount.toLocaleString()} / {alert.budgetedAmount.toLocaleString()} GHS
                        </p>
                      </div>
                    </div>
                    <Badge variant={getBadgeVariant(level)} className="capitalize">
                      {level}
                    </Badge>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-600">
                        {alert.percentageUsed.toFixed(1)}% used
                      </span>
                      <span className="text-xs text-gray-600">
                        {remaining.toLocaleString()} GHS remaining
                      </span>
                    </div>
                    <Progress
                      value={alert.percentageUsed}
                      className="h-2"
                    />
                  </div>

                  {/* Alert Message */}
                  {alert.alertMessage && (
                    <p className="text-sm mb-3 text-gray-700">
                      {alert.alertMessage}
                    </p>
                  )}

                  {/* Action Button */}
                  {!alert.alertRead && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleMarkAsRead(alert.id)}
                      className="w-full"
                    >
                      Mark as Read
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No budget alerts</p>
            <p className="text-sm">All spending is within budget</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
