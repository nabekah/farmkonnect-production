'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, CheckCircle, Clock, TrendingDown, Award, AlertTriangle, X, RotateCcw, Zap } from 'lucide-react';

interface Alert {
  id: string;
  workerId: number;
  workerName: string;
  alertType: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  currentValue: string;
  taskId?: string;
  taskTitle?: string;
  createdAt: string;
  isResolved: boolean;
  resolvedAt?: string;
}

interface QuickAction {
  id: string;
  alertId: string;
  action: 'mark_complete' | 'reassign' | 'extend_deadline' | 'provide_training';
  label: string;
  icon: React.ReactNode;
}

export const AlertDashboard = () => {
  const [alerts, setAlerts] = useState<Alert[]>([
    {
      id: 'alert_1',
      workerId: 1,
      workerName: 'John Smith',
      alertType: 'low_efficiency',
      severity: 'warning',
      message: 'Worker efficiency is 78% (threshold: 85%)',
      currentValue: 'efficiency: 78%',
      taskId: 'task_1',
      taskTitle: 'Prepare Field A for Planting',
      createdAt: '2026-02-14T10:30:00',
      isResolved: false,
    },
    {
      id: 'alert_2',
      workerId: 2,
      workerName: 'Maria Garcia',
      alertType: 'time_overrun',
      severity: 'warning',
      message: '3 out of 5 recent tasks exceeded estimated time',
      currentValue: '3/5 tasks overrun',
      createdAt: '2026-02-14T09:15:00',
      isResolved: false,
    },
    {
      id: 'alert_3',
      workerId: 3,
      workerName: 'Ahmed Hassan',
      alertType: 'high_performer',
      severity: 'info',
      message: 'Excellent performance! Efficiency is 96%',
      currentValue: 'efficiency: 96%',
      createdAt: '2026-02-14T08:00:00',
      isResolved: false,
    },
    {
      id: 'alert_4',
      workerId: 4,
      workerName: 'Sarah Johnson',
      alertType: 'quality_issue',
      severity: 'critical',
      message: 'Average quality rating is 3.2/5 (threshold: 4.0)',
      currentValue: 'quality rating: 3.2/5',
      taskId: 'task_4',
      taskTitle: 'Irrigation System Check',
      createdAt: '2026-02-13T14:45:00',
      isResolved: false,
    },
    {
      id: 'alert_5',
      workerId: 5,
      workerName: 'David Chen',
      alertType: 'missed_deadline',
      severity: 'warning',
      message: '2 tasks were completed past their due date',
      currentValue: '2 tasks completed late',
      createdAt: '2026-02-13T11:20:00',
      isResolved: true,
      resolvedAt: '2026-02-14T09:00:00',
    },
  ]);

  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [showReassignDialog, setShowReassignDialog] = useState(false);
  const [showExtendDialog, setShowExtendDialog] = useState(false);
  const [showNotesDialog, setShowNotesDialog] = useState(false);
  const [notes, setNotes] = useState('');
  const [reassignWorker, setReassignWorker] = useState('');
  const [extendHours, setExtendHours] = useState('');

  const activeAlerts = alerts.filter(a => !a.isResolved);
  const resolvedAlerts = alerts.filter(a => a.isResolved);

  const criticalCount = activeAlerts.filter(a => a.severity === 'critical').length;
  const warningCount = activeAlerts.filter(a => a.severity === 'warning').length;
  const infoCount = activeAlerts.filter(a => a.severity === 'info').length;

  const handleResolveAlert = (alertId: string, action?: string) => {
    setAlerts(alerts.map(a =>
      a.id === alertId
        ? { ...a, isResolved: true, resolvedAt: new Date().toISOString() }
        : a
    ));
    setShowReassignDialog(false);
    setShowExtendDialog(false);
    setShowNotesDialog(false);
  };

  const handleReactivateAlert = (alertId: string) => {
    setAlerts(alerts.map(a =>
      a.id === alertId
        ? { ...a, isResolved: false, resolvedAt: undefined }
        : a
    ));
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      default:
        return <Clock className="w-5 h-5 text-blue-600" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const getAlertIcon = (alertType: string) => {
    switch (alertType) {
      case 'low_efficiency':
        return <TrendingDown className="w-4 h-4" />;
      case 'high_performer':
        return <Award className="w-4 h-4" />;
      case 'time_overrun':
        return <Clock className="w-4 h-4" />;
      case 'quality_issue':
        return <AlertCircle className="w-4 h-4" />;
      case 'missed_deadline':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const workers = [
    { id: 1, name: 'John Smith' },
    { id: 2, name: 'Maria Garcia' },
    { id: 3, name: 'Ahmed Hassan' },
    { id: 4, name: 'Sarah Johnson' },
    { id: 5, name: 'David Chen' },
    { id: 6, name: 'Emma Wilson' },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Alert Dashboard</h1>
        <p className="text-gray-600">Monitor worker performance alerts and take quick actions</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" /> Critical
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">{criticalCount}</p>
            <p className="text-xs text-gray-500 mt-2">Requires immediate action</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-600" /> Warnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-yellow-600">{warningCount}</p>
            <p className="text-xs text-gray-500 mt-2">Monitor closely</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" /> Info
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">{infoCount}</p>
            <p className="text-xs text-gray-500 mt-2">Informational only</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" /> Resolved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{resolvedAlerts.length}</p>
            <p className="text-xs text-gray-500 mt-2">Closed alerts</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active">Active Alerts ({activeAlerts.length})</TabsTrigger>
          <TabsTrigger value="resolved">Resolved ({resolvedAlerts.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activeAlerts.length === 0 ? (
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <p className="text-lg font-semibold">No Active Alerts</p>
                <p className="text-gray-600">All workers are performing within expected parameters</p>
              </CardContent>
            </Card>
          ) : (
            activeAlerts.map((alert) => (
              <Card key={alert.id} className={`border ${getSeverityColor(alert.severity)}`}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      {getSeverityIcon(alert.severity)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg">{alert.workerName}</h3>
                          <Badge variant="outline" className="gap-1">
                            {getAlertIcon(alert.alertType)}
                            {alert.alertType.replace(/_/g, ' ')}
                          </Badge>
                          <Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}>
                            {alert.severity.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{alert.message}</p>
                        {alert.taskTitle && (
                          <p className="text-xs text-gray-600 mb-2">
                            <span className="font-medium">Task:</span> {alert.taskTitle}
                          </p>
                        )}
                        <p className="text-xs text-gray-500">
                          Created: {new Date(alert.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      {alert.alertType === 'low_efficiency' && (
                        <>
                          <Dialog open={showNotesDialog && selectedAlert?.id === alert.id} onOpenChange={(open) => {
                            if (open) setSelectedAlert(alert);
                            setShowNotesDialog(open);
                          }}>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline" className="gap-1">
                                <Zap className="w-3 h-3" /> Provide Training
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Provide Training Notes</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <Textarea
                                  placeholder="Enter training notes or recommendations..."
                                  value={notes}
                                  onChange={(e) => setNotes(e.target.value)}
                                  className="min-h-24"
                                />
                                <Button
                                  className="w-full"
                                  onClick={() => handleResolveAlert(alert.id, 'training')}
                                >
                                  Save & Mark Complete
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </>
                      )}

                      {alert.alertType === 'time_overrun' && (
                        <>
                          <Dialog open={showExtendDialog && selectedAlert?.id === alert.id} onOpenChange={(open) => {
                            if (open) setSelectedAlert(alert);
                            setShowExtendDialog(open);
                          }}>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline" className="gap-1">
                                <Clock className="w-3 h-3" /> Extend Deadline
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Extend Task Deadline</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <label className="text-sm font-medium">Additional Hours</label>
                                  <input
                                    type="number"
                                    placeholder="2.5"
                                    value={extendHours}
                                    onChange={(e) => setExtendHours(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md"
                                  />
                                </div>
                                <Button
                                  className="w-full"
                                  onClick={() => handleResolveAlert(alert.id, 'extend')}
                                >
                                  Extend & Mark Complete
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </>
                      )}

                      {alert.alertType === 'quality_issue' && (
                        <>
                          <Dialog open={showReassignDialog && selectedAlert?.id === alert.id} onOpenChange={(open) => {
                            if (open) setSelectedAlert(alert);
                            setShowReassignDialog(open);
                          }}>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline" className="gap-1">
                                <RotateCcw className="w-3 h-3" /> Reassign
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Reassign Task</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <label className="text-sm font-medium">Assign to Worker</label>
                                  <Select value={reassignWorker} onValueChange={setReassignWorker}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select worker" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {workers.map((w) => (
                                        <SelectItem key={w.id} value={w.id.toString()}>
                                          {w.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <Button
                                  className="w-full"
                                  onClick={() => handleResolveAlert(alert.id, 'reassign')}
                                >
                                  Reassign & Mark Complete
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </>
                      )}

                      <Button
                        size="sm"
                        className="gap-1"
                        onClick={() => handleResolveAlert(alert.id)}
                      >
                        <CheckCircle className="w-3 h-3" /> Mark Complete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="resolved" className="space-y-4">
          {resolvedAlerts.length === 0 ? (
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-semibold">No Resolved Alerts</p>
                <p className="text-gray-600">Resolved alerts will appear here</p>
              </CardContent>
            </Card>
          ) : (
            resolvedAlerts.map((alert) => (
              <Card key={alert.id} className="opacity-75">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{alert.workerName}</h3>
                          <Badge variant="outline" className="gap-1">
                            {getAlertIcon(alert.alertType)}
                            {alert.alertType.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{alert.message}</p>
                        <p className="text-xs text-gray-500">
                          Resolved: {alert.resolvedAt ? new Date(alert.resolvedAt).toLocaleString() : 'N/A'}
                        </p>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1"
                      onClick={() => handleReactivateAlert(alert.id)}
                    >
                      <X className="w-3 h-3" /> Reopen
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AlertDashboard;
