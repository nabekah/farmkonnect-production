'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit2, Trash2, CheckCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';

interface Task {
  id: string;
  title: string;
  description: string;
  workerId: string;
  workerName: string;
  taskType: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  dueDate: string;
  estimatedHours: number;
  actualHours?: number;
}

export const TaskAssignmentUI = () => {
  const authData = useAuth();
  const user = authData?.user || { farmId: 1 };
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    workerId: '',
    taskType: 'planting',
    priority: 'medium' as const,
    dueDate: '',
    estimatedHours: 4,
    workerName: ''
  });

  // Fetch tasks from database
  const { data: tasks = [], isLoading, refetch } = trpc.taskAssignmentDatabase.getAllTasks.useQuery(
    { farmId: user?.farmId || 1 },
    { enabled: !!user?.farmId }
  );

  // Fetch workers from database
  const { data: workers = [], isLoading: workersLoading } = trpc.workers.getAllWorkers.useQuery(
    { farmId: user?.farmId || 1 },
    { enabled: !!user?.farmId }
  );

  // Mutations
  const createTaskMutation = trpc.taskAssignmentDatabase.createTask.useMutation({
    onSuccess: () => {
      refetch();
      setShowForm(false);
      setFormData({
        title: '',
        description: '',
        workerId: '',
        taskType: 'planting',
        priority: 'medium',
        dueDate: '',
        estimatedHours: 4,
        workerName: ''
      });
    }
  });

  const updateTaskMutation = trpc.taskAssignmentDatabase.updateTask.useMutation({
    onSuccess: () => {
      refetch();
      setEditingId(null);
      setShowForm(false);
    }
  });

  const deleteTaskMutation = trpc.taskAssignmentDatabase.deleteTask.useMutation({
    onSuccess: () => {
      refetch();
    }
  });

  const updateStatusMutation = trpc.taskAssignmentDatabase.updateTaskStatus.useMutation({
    onSuccess: () => {
      refetch();
    }
  });

  const handleSubmit = () => {
    if (!formData.title || !formData.workerId) {
      alert('Please fill in all required fields');
      return;
    }

    if (editingId) {
      updateTaskMutation.mutate({
        id: editingId,
        title: formData.title,
        description: formData.description,
        workerId: formData.workerId,
        workerName: formData.workerName,
        taskType: formData.taskType,
        priority: formData.priority,
        dueDate: formData.dueDate,
        estimatedHours: formData.estimatedHours,
        farmId: user?.farmId || 1
      });
    } else {
      createTaskMutation.mutate({
        title: formData.title,
        description: formData.description,
        workerId: formData.workerId,
        workerName: formData.workerName,
        taskType: formData.taskType,
        priority: formData.priority,
        dueDate: formData.dueDate,
        estimatedHours: formData.estimatedHours,
        farmId: user?.farmId || 1
      });
    }
  };

  const handleEdit = (task: any) => {
    setFormData({
      title: task.title,
      description: task.description,
      workerId: task.workerId,
      workerName: task.workerName,
      taskType: task.taskType,
      priority: task.priority,
      dueDate: task.dueDate,
      estimatedHours: task.estimatedHours
    });
    setEditingId(task.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      deleteTaskMutation.mutate({ id, farmId: user?.farmId || 1 });
    }
  };

  const handleStatusChange = (id: string, newStatus: string) => {
    updateStatusMutation.mutate({
      id,
      status: newStatus as 'pending' | 'in_progress' | 'completed',
      farmId: user?.farmId || 1
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const pendingCount = tasks.filter((t: any) => t.status === 'pending').length;
  const inProgressCount = tasks.filter((t: any) => t.status === 'in_progress').length;
  const completedCount = tasks.filter((t: any) => t.status === 'completed').length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Task Assignment & Tracking</h1>
        <Button onClick={() => { setShowForm(!showForm); setEditingId(null); }} className="gap-2">
          <Plus className="w-4 h-4" />
          Assign New Task
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-gray-600">Pending Tasks</p>
              <p className="text-3xl font-bold">{pendingCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-gray-600">In Progress</p>
              <p className="text-3xl font-bold text-blue-600">{inProgressCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-gray-600">Completed</p>
              <p className="text-3xl font-bold text-green-600">{completedCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Task' : 'Create New Task'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="e.g., Prepare Field A"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="px-3 py-2 border rounded-md"
              />
              <select
                value={formData.workerId}
                onChange={(e) => {
                  const selectedWorker = workers.find(w => w.id.toString() === e.target.value);
                  setFormData({
                    ...formData,
                    workerId: e.target.value,
                    workerName: selectedWorker?.name || ''
                  });
                }}
                className="px-3 py-2 border rounded-md"
              >
                <option value="">Select Worker</option>
                {workers.map((worker: any) => (
                  <option key={worker.id} value={worker.id}>
                    {worker.name}
                  </option>
                ))}
              </select>
              <select
                value={formData.taskType}
                onChange={(e) => setFormData({ ...formData, taskType: e.target.value })}
                className="px-3 py-2 border rounded-md"
              >
                <option value="planting">Planting</option>
                <option value="weeding">Weeding</option>
                <option value="irrigation">Irrigation</option>
                <option value="harvesting">Harvesting</option>
                <option value="maintenance">Maintenance</option>
              </select>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                className="px-3 py-2 border rounded-md"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="px-3 py-2 border rounded-md"
              />
              <input
                type="number"
                placeholder="Estimated Hours"
                value={formData.estimatedHours}
                onChange={(e) => setFormData({ ...formData, estimatedHours: parseInt(e.target.value) })}
                className="px-3 py-2 border rounded-md"
              />
            </div>
            <textarea
              placeholder="Task details..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
              rows={4}
            />
            <div className="flex gap-2">
              <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700">
                {editingId ? 'Update Task' : 'Assign Task'}
              </Button>
              <Button onClick={() => { setShowForm(false); setEditingId(null); }} variant="outline">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tasks List */}
      <Card>
        <CardHeader>
          <CardTitle>Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">All Tasks ({tasks.length})</TabsTrigger>
              <TabsTrigger value="pending">Pending ({pendingCount})</TabsTrigger>
              <TabsTrigger value="progress">In Progress ({inProgressCount})</TabsTrigger>
              <TabsTrigger value="completed">Completed ({completedCount})</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4 mt-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : tasks.length === 0 ? (
                <p className="text-gray-500">No tasks found</p>
              ) : (
                tasks.map((task: any) => (
                  <Card key={task.id}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{task.title}</h3>
                          <p className="text-gray-600">{task.description}</p>
                          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                            <div><span className="font-semibold">Assigned To:</span> {task.workerName}</div>
                            <div><span className="font-semibold">Due Date:</span> {task.dueDate}</div>
                            <div><span className="font-semibold">Estimated Hours:</span> {task.estimatedHours}h</div>
                            <div><span className="font-semibold">Type:</span> {task.taskType}</div>
                          </div>
                          <div className="mt-3 flex gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(task.status)}`}>
                              {task.status}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {task.status === 'pending' && (
                            <Button size="sm" onClick={() => handleStatusChange(task.id, 'in_progress')} className="bg-blue-600">
                              Start
                            </Button>
                          )}
                          {task.status === 'in_progress' && (
                            <Button size="sm" onClick={() => handleStatusChange(task.id, 'completed')} className="bg-green-600">
                              Complete
                            </Button>
                          )}
                          <Button size="sm" variant="outline" onClick={() => handleEdit(task)}>
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDelete(task.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="pending" className="space-y-4 mt-4">
              {tasks.filter((t: any) => t.status === 'pending').map((task: any) => (
                <Card key={task.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{task.title}</h3>
                        <p className="text-sm text-gray-600">Assigned to: {task.workerName}</p>
                      </div>
                      <Button size="sm" onClick={() => handleStatusChange(task.id, 'in_progress')} className="bg-blue-600">
                        Start
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="progress" className="space-y-4 mt-4">
              {tasks.filter((t: any) => t.status === 'in_progress').map((task: any) => (
                <Card key={task.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{task.title}</h3>
                        <p className="text-sm text-gray-600">Assigned to: {task.workerName}</p>
                      </div>
                      <Button size="sm" onClick={() => handleStatusChange(task.id, 'completed')} className="bg-green-600">
                        Complete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4 mt-4">
              {tasks.filter((t: any) => t.status === 'completed').map((task: any) => (
                <Card key={task.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-1" />
                      <div>
                        <h3 className="font-semibold">{task.title}</h3>
                        <p className="text-sm text-gray-600">Completed by: {task.workerName}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
