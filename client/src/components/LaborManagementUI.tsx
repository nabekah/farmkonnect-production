'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, Calendar, CheckCircle, AlertCircle, TrendingUp, DollarSign, Clock } from 'lucide-react';

interface Worker {
  id: string;
  name: string;
  role: string;
  status: 'active' | 'on_leave' | 'inactive';
  hourlyRate: number;
  tasksCompleted: number;
  rating: number;
}

interface Task {
  id: string;
  title: string;
  assignedTo: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  estimatedHours: number;
}

interface ScheduleEntry {
  date: string;
  workerId: string;
  taskId: string;
  startTime: string;
  endTime: string;
}

export const LaborManagementUI = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [selectedWeek, setSelectedWeek] = useState('current');

  useEffect(() => {
    // Mock data
    setWorkers([
      { id: 'w1', name: 'John Doe', role: 'Field Worker', status: 'active', hourlyRate: 15, tasksCompleted: 24, rating: 4.8 },
      { id: 'w2', name: 'Jane Smith', role: 'Supervisor', status: 'active', hourlyRate: 25, tasksCompleted: 18, rating: 4.9 },
      { id: 'w3', name: 'Mike Johnson', role: 'Equipment Operator', status: 'active', hourlyRate: 20, tasksCompleted: 16, rating: 4.5 },
      { id: 'w4', name: 'Sarah Williams', role: 'Field Worker', status: 'on_leave', hourlyRate: 15, tasksCompleted: 20, rating: 4.7 }
    ]);

    setTasks([
      { id: 't1', title: 'Prepare field for planting', assignedTo: 'w1', status: 'in_progress', priority: 'high', dueDate: '2026-02-16', estimatedHours: 8 },
      { id: 't2', title: 'Irrigation system check', assignedTo: 'w2', status: 'pending', priority: 'medium', dueDate: '2026-02-18', estimatedHours: 6 },
      { id: 't3', title: 'Equipment maintenance', assignedTo: 'w3', status: 'completed', priority: 'medium', dueDate: '2026-02-14', estimatedHours: 4 },
      { id: 't4', title: 'Fertilizer application', assignedTo: 'w1', status: 'pending', priority: 'high', dueDate: '2026-02-17', estimatedHours: 6 }
    ]);

    setSchedule([
      { date: '2026-02-14', workerId: 'w1', taskId: 't1', startTime: '06:00', endTime: '14:00' },
      { date: '2026-02-14', workerId: 'w2', taskId: 't2', startTime: '08:00', endTime: '16:00' },
      { date: '2026-02-14', workerId: 'w3', taskId: 't3', startTime: '07:00', endTime: '15:00' }
    ]);
  }, []);

  const activeWorkers = workers.filter(w => w.status === 'active').length;
  const totalTasksCompleted = tasks.filter(t => t.status === 'completed').length;
  const averageRating = (workers.reduce((sum, w) => sum + w.rating, 0) / workers.length).toFixed(1);
  const totalPayroll = workers.reduce((sum, w) => sum + (w.tasksCompleted * 8 * w.hourlyRate), 0);

  const performanceData = workers.map(w => ({
    name: w.name.split(' ')[0],
    tasksCompleted: w.tasksCompleted,
    rating: w.rating * 10
  }));

  const taskStatusData = [
    { name: 'Completed', value: tasks.filter(t => t.status === 'completed').length, color: '#10b981' },
    { name: 'In Progress', value: tasks.filter(t => t.status === 'in_progress').length, color: '#3b82f6' },
    { name: 'Pending', value: tasks.filter(t => t.status === 'pending').length, color: '#f59e0b' }
  ];

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Labor Management</h1>
        <Button className="bg-blue-600 hover:bg-blue-700">+ Assign Task</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Users className="w-4 h-4" /> Active Workers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{activeWorkers}</p>
            <p className="text-xs text-gray-500 mt-2">{workers.length - activeWorkers} on leave</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> Tasks Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalTasksCompleted}</p>
            <p className="text-xs text-gray-500 mt-2">of {tasks.length} total tasks</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Avg Rating
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{averageRating}/5</p>
            <p className="text-xs text-gray-500 mt-2">Team performance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <DollarSign className="w-4 h-4" /> Payroll
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">${(totalPayroll / 1000).toFixed(0)}K</p>
            <p className="text-xs text-gray-500 mt-2">Monthly estimate</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="workers">Workers</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Task Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={taskStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {taskStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Active Tasks</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {tasks.filter(t => t.status !== 'completed').map(task => (
                  <div key={task.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-sm">{task.title}</p>
                      <span className={`text-xs px-2 py-1 rounded ${task.priority === 'high' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {task.priority}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">Due: {task.dueDate} | Est: {task.estimatedHours}h</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="workers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Worker Directory</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {workers.map(worker => (
                  <div key={worker.id} className="p-4 border rounded-lg flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{worker.name}</p>
                      <p className="text-sm text-gray-600">{worker.role}</p>
                      <div className="flex gap-4 mt-2 text-xs text-gray-500">
                        <span>Tasks: {worker.tasksCompleted}</span>
                        <span>Rating: {worker.rating}/5</span>
                        <span>${worker.hourlyRate}/hr</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${worker.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {worker.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Weekly Schedule</CardTitle>
                <select className="px-3 py-1 border rounded text-sm">
                  <option>Current Week</option>
                  <option>Next Week</option>
                  <option>Previous Week</option>
                </select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Worker</th>
                      <th className="text-left p-2">Date</th>
                      <th className="text-left p-2">Task</th>
                      <th className="text-left p-2">Time</th>
                      <th className="text-left p-2">Hours</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedule.map((entry, idx) => {
                      const worker = workers.find(w => w.id === entry.workerId);
                      const task = tasks.find(t => t.id === entry.taskId);
                      const startHour = parseInt(entry.startTime.split(':')[0]);
                      const endHour = parseInt(entry.endTime.split(':')[0]);
                      const hours = endHour - startHour;
                      return (
                        <tr key={idx} className="border-b hover:bg-gray-50">
                          <td className="p-2">{worker?.name}</td>
                          <td className="p-2">{entry.date}</td>
                          <td className="p-2">{task?.title}</td>
                          <td className="p-2">{entry.startTime} - {entry.endTime}</td>
                          <td className="p-2">{hours}h</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Worker Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="tasksCompleted" fill="#3b82f6" name="Tasks Completed" />
                  <Bar dataKey="rating" fill="#10b981" name="Rating (x10)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Performance Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {workers.map(worker => (
                <div key={worker.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold">{worker.name}</p>
                    <p className="text-sm text-gray-600">{worker.tasksCompleted} tasks</p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: `${(worker.rating / 5) * 100}%` }}></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Rating: {worker.rating}/5</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LaborManagementUI;
