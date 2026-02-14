'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, AlertTriangle, Clock, CheckCircle, Plus, X } from 'lucide-react';

interface WorkerSchedule {
  workerId: number;
  workerName: string;
  date: string;
  availableHours: number;
  scheduledHours: number;
  tasks: ScheduledTask[];
  status: 'available' | 'busy' | 'overbooked' | 'off';
}

interface ScheduledTask {
  taskId: string;
  title: string;
  estimatedHours: number;
  priority: string;
  status: string;
}

interface ConflictWarning {
  workerId: number;
  workerName: string;
  date: string;
  overageHours: number;
  tasks: string[];
}

export const WorkerAvailabilityCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 1, 14)); // Feb 14, 2026
  const [selectedWorker, setSelectedWorker] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  const workers = [
    { id: 1, name: 'John Smith' },
    { id: 2, name: 'Maria Garcia' },
    { id: 3, name: 'Ahmed Hassan' },
    { id: 4, name: 'Sarah Johnson' },
    { id: 5, name: 'David Chen' },
    { id: 6, name: 'Emma Wilson' },
  ];

  // Mock schedule data
  const scheduleData: WorkerSchedule[] = [
    {
      workerId: 1,
      workerName: 'John Smith',
      date: '2026-02-14',
      availableHours: 8,
      scheduledHours: 8,
      status: 'busy',
      tasks: [
        { taskId: 'task_1', title: 'Prepare Field A', estimatedHours: 4, priority: 'high', status: 'in_progress' },
        { taskId: 'task_2', title: 'Equipment Check', estimatedHours: 2, priority: 'medium', status: 'pending' },
        { taskId: 'task_3', title: 'Irrigation Setup', estimatedHours: 2, priority: 'medium', status: 'pending' },
      ],
    },
    {
      workerId: 1,
      workerName: 'John Smith',
      date: '2026-02-15',
      availableHours: 8,
      scheduledHours: 6,
      status: 'available',
      tasks: [
        { taskId: 'task_4', title: 'Weeding Field B', estimatedHours: 4, priority: 'medium', status: 'pending' },
        { taskId: 'task_5', title: 'Pest Inspection', estimatedHours: 2, priority: 'high', status: 'pending' },
      ],
    },
    {
      workerId: 1,
      workerName: 'John Smith',
      date: '2026-02-16',
      availableHours: 8,
      scheduledHours: 10,
      status: 'overbooked',
      tasks: [
        { taskId: 'task_6', title: 'Harvesting', estimatedHours: 5, priority: 'high', status: 'pending' },
        { taskId: 'task_7', title: 'Field Maintenance', estimatedHours: 3, priority: 'medium', status: 'pending' },
        { taskId: 'task_8', title: 'Equipment Repair', estimatedHours: 2, priority: 'low', status: 'pending' },
      ],
    },
    {
      workerId: 2,
      workerName: 'Maria Garcia',
      date: '2026-02-14',
      availableHours: 8,
      scheduledHours: 5,
      status: 'available',
      tasks: [
        { taskId: 'task_9', title: 'Irrigation Check', estimatedHours: 2, priority: 'high', status: 'in_progress' },
        { taskId: 'task_10', title: 'Water System Maintenance', estimatedHours: 3, priority: 'medium', status: 'pending' },
      ],
    },
    {
      workerId: 2,
      workerName: 'Maria Garcia',
      date: '2026-02-15',
      availableHours: 0,
      scheduledHours: 0,
      status: 'off',
      tasks: [],
    },
    {
      workerId: 3,
      workerName: 'Ahmed Hassan',
      date: '2026-02-14',
      availableHours: 8,
      scheduledHours: 7,
      status: 'available',
      tasks: [
        { taskId: 'task_11', title: 'Crop Spraying', estimatedHours: 4, priority: 'high', status: 'in_progress' },
        { taskId: 'task_12', title: 'Disease Monitoring', estimatedHours: 3, priority: 'high', status: 'pending' },
      ],
    },
  ];

  const getScheduleForDate = (date: string) => {
    return scheduleData.filter(s => s.date === date);
  };

  const getConflicts = () => {
    return scheduleData.filter(s => s.status === 'overbooked').map(s => ({
      workerId: s.workerId,
      workerName: s.workerName,
      date: s.date,
      overageHours: s.scheduledHours - s.availableHours,
      tasks: s.tasks.map(t => t.title),
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-50 border-green-200';
      case 'busy':
        return 'bg-yellow-50 border-yellow-200';
      case 'overbooked':
        return 'bg-red-50 border-red-200';
      case 'off':
        return 'bg-gray-50 border-gray-200';
      default:
        return 'bg-white border-gray-200';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge className="bg-green-600">Available</Badge>;
      case 'busy':
        return <Badge className="bg-yellow-600">Busy</Badge>;
      case 'overbooked':
        return <Badge variant="destructive">Overbooked</Badge>;
      case 'off':
        return <Badge variant="secondary">Off</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  const conflicts = getConflicts();

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const days = [];

  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Worker Availability Calendar</h1>
        <p className="text-gray-600">View worker schedules, identify conflicts, and optimize task assignments</p>
      </div>

      {/* Conflict Warnings */}
      {conflicts.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" /> Scheduling Conflicts Detected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {conflicts.map((conflict, idx) => (
                <div key={idx} className="text-sm">
                  <p className="font-semibold text-red-900">
                    {conflict.workerName} - {new Date(conflict.date).toLocaleDateString()}
                  </p>
                  <p className="text-red-800">
                    Overbooked by {conflict.overageHours} hours ({conflict.tasks.length} tasks)
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="calendar" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="list">Worker List</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-6">
          {/* Calendar Header */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <Button variant="outline" size="sm" onClick={previousMonth}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <h2 className="text-xl font-bold">
                  {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h2>
                <Button variant="outline" size="sm" onClick={nextMonth}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
          </Card>

          {/* Worker Selection */}
          <div>
            <label className="text-sm font-medium">Select Worker</label>
            <Select value={selectedWorker?.toString() || ''} onValueChange={(val) => setSelectedWorker(parseInt(val))}>
              <SelectTrigger>
                <SelectValue placeholder="Select a worker to view schedule" />
              </SelectTrigger>
              <SelectContent>
                {workers.map(w => (
                  <SelectItem key={w.id} value={w.id.toString()}>
                    {w.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Calendar Grid */}
          {selectedWorker && (
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-7 gap-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center font-semibold text-gray-600 py-2">
                      {day}
                    </div>
                  ))}

                  {days.map((day, idx) => {
                    if (day === null) {
                      return <div key={`empty-${idx}`} className="aspect-square" />;
                    }

                    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const schedules = getScheduleForDate(dateStr).filter(s => s.workerId === selectedWorker);
                    const schedule = schedules[0];

                    return (
                      <Dialog key={day}>
                        <DialogTrigger asChild>
                          <div
                            className={`aspect-square p-2 border rounded-lg cursor-pointer transition-colors ${
                              schedule ? getStatusColor(schedule.status) : 'bg-white border-gray-200'
                            }`}
                          >
                            <div className="text-sm font-semibold">{day}</div>
                            {schedule && (
                              <div className="text-xs mt-1 space-y-1">
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {schedule.scheduledHours}/{schedule.availableHours}h
                                </div>
                                {schedule.status === 'overbooked' && (
                                  <div className="text-red-600 font-semibold">Conflict!</div>
                                )}
                              </div>
                            )}
                          </div>
                        </DialogTrigger>
                        {schedule && (
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>
                                {workers.find(w => w.id === selectedWorker)?.name} - {new Date(dateStr).toLocaleDateString()}
                              </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Status</span>
                                {getStatusBadge(schedule.status)}
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Hours</span>
                                <span className={schedule.status === 'overbooked' ? 'text-red-600 font-semibold' : ''}>
                                  {schedule.scheduledHours}/{schedule.availableHours} hours
                                </span>
                              </div>

                              <div>
                                <h4 className="font-semibold mb-2">Scheduled Tasks ({schedule.tasks.length})</h4>
                                <div className="space-y-2">
                                  {schedule.tasks.map(task => (
                                    <div key={task.taskId} className="p-2 bg-gray-50 rounded border">
                                      <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                          <p className="text-sm font-medium">{task.title}</p>
                                          <p className="text-xs text-gray-600">{task.estimatedHours}h • {task.priority}</p>
                                        </div>
                                        <Badge variant="outline" className="text-xs">
                                          {task.status}
                                        </Badge>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {schedule.status === 'overbooked' && (
                                <Button className="w-full gap-2">
                                  <AlertTriangle className="w-4 h-4" /> Resolve Conflict
                                </Button>
                              )}

                              {schedule.status === 'available' && (
                                <Button className="w-full gap-2">
                                  <Plus className="w-4 h-4" /> Assign Task
                                </Button>
                              )}
                            </div>
                          </DialogContent>
                        )}
                      </Dialog>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          {workers.map(worker => {
            const workerSchedules = scheduleData.filter(s => s.workerId === worker.id);
            const totalScheduled = workerSchedules.reduce((sum, s) => sum + s.scheduledHours, 0);
            const totalAvailable = workerSchedules.reduce((sum, s) => sum + s.availableHours, 0);
            const hasConflict = workerSchedules.some(s => s.status === 'overbooked');

            return (
              <Card key={worker.id} className={hasConflict ? 'border-red-200 bg-red-50' : ''}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{worker.name}</CardTitle>
                      <p className="text-sm text-gray-600">
                        {totalScheduled}/{totalAvailable} hours scheduled this week
                      </p>
                    </div>
                    {hasConflict && (
                      <Badge variant="destructive" className="gap-1">
                        <AlertTriangle className="w-3 h-3" /> Conflict
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {workerSchedules.map((schedule, idx) => (
                      <div key={idx} className={`p-3 rounded border ${getStatusColor(schedule.status)}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{new Date(schedule.date).toLocaleDateString()}</span>
                          {getStatusBadge(schedule.status)}
                        </div>
                        <div className="text-sm text-gray-700 mb-2">
                          {schedule.scheduledHours}/{schedule.availableHours} hours
                          {schedule.status === 'overbooked' && (
                            <span className="text-red-600 font-semibold ml-2">
                              (+{schedule.scheduledHours - schedule.availableHours}h overbooked)
                            </span>
                          )}
                        </div>
                        <div className="space-y-1">
                          {schedule.tasks.map(task => (
                            <div key={task.taskId} className="text-xs text-gray-600">
                              • {task.title} ({task.estimatedHours}h)
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WorkerAvailabilityCalendar;
