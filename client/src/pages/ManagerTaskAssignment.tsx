import React, { useState, useMemo } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Loader2, CheckCircle2, AlertCircle, Clock, Trash2 } from 'lucide-react';
import { useLocation } from 'wouter';

const TASK_TYPES = [
  { value: 'planting', label: 'Planting' },
  { value: 'monitoring', label: 'Monitoring' },
  { value: 'irrigation', label: 'Irrigation' },
  { value: 'fertilization', label: 'Fertilization' },
  { value: 'pest_control', label: 'Pest Control' },
  { value: 'weed_control', label: 'Weed Control' },
  { value: 'harvest', label: 'Harvest' },
  { value: 'equipment_maintenance', label: 'Equipment Maintenance' },
  { value: 'soil_testing', label: 'Soil Testing' },
  { value: 'other', label: 'Other' },
];

const PRIORITIES = [
  { value: 'low', label: 'Low', color: 'bg-blue-500' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-500' },
  { value: 'high', label: 'High', color: 'bg-orange-500' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-500' },
];

const STATUSES = [
  { value: 'pending', label: 'Pending', icon: Clock },
  { value: 'in_progress', label: 'In Progress', icon: Clock },
  { value: 'completed', label: 'Completed', icon: CheckCircle2 },
  { value: 'cancelled', label: 'Cancelled', icon: AlertCircle },
];

interface NewTask {
  title: string;
  description: string;
  taskType: string;
  priority: string;
  dueDate: string;
  dueTime: string;
  assignedToUserId: number;
  fieldId?: number;
}

export function ManagerTaskAssignment() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [farmId, setFarmId] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [newTask, setNewTask] = useState<NewTask>({
    title: '',
    description: '',
    taskType: 'monitoring',
    priority: 'medium',
    dueDate: new Date().toISOString().split('T')[0],
    dueTime: '09:00',
    assignedToUserId: 0,
    fieldId: undefined,
  });

  // Mock field workers - TODO: Fetch from API
  const fieldWorkers = [
    { id: 1, name: 'John Doe' },
    { id: 2, name: 'Jane Smith' },
    { id: 3, name: 'Mike Johnson' },
  ];

  // Mock tasks - TODO: Fetch from API
  const allTasks = [
    {
      id: '1',
      title: 'Monitor crop health in Field A',
      taskType: 'monitoring',
      priority: 'high',
      status: 'in_progress',
      assignedTo: 'John Doe',
      dueDate: new Date(Date.now() + 86400000).toISOString(),
      createdAt: new Date().toISOString(),
    },
    {
      id: '2',
      title: 'Apply irrigation to Field B',
      taskType: 'irrigation',
      priority: 'medium',
      status: 'pending',
      assignedTo: 'Jane Smith',
      dueDate: new Date(Date.now() + 172800000).toISOString(),
      createdAt: new Date().toISOString(),
    },
    {
      id: '3',
      title: 'Pest control in Field C',
      taskType: 'pest_control',
      priority: 'urgent',
      status: 'pending',
      assignedTo: 'Mike Johnson',
      dueDate: new Date(Date.now() + 3600000).toISOString(),
      createdAt: new Date().toISOString(),
    },
  ];

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return allTasks.filter((task) => {
      const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
      const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
      const matchesSearch =
        searchQuery === '' ||
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.assignedTo.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesStatus && matchesPriority && matchesSearch;
    });
  }, [filterStatus, filterPriority, searchQuery]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newTask.title.trim() || newTask.assignedToUserId === 0) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      // TODO: Call createTask mutation
      console.log('Creating task:', newTask);

      // Reset form
      setNewTask({
        title: '',
        description: '',
        taskType: 'monitoring',
        priority: 'medium',
        dueDate: new Date().toISOString().split('T')[0],
        dueTime: '09:00',
        assignedToUserId: 0,
        fieldId: undefined,
      });
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to create task:', error);
      alert('Failed to create task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    return PRIORITIES.find((p) => p.value === priority)?.color || 'bg-gray-500';
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'in_progress':
        return 'bg-blue-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Task Management</h1>
            <p className="text-muted-foreground">Assign and monitor field worker tasks</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create Task
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
                <DialogDescription>Assign a task to a field worker</DialogDescription>
              </DialogHeader>

              <form onSubmit={handleCreateTask} className="space-y-4">
                {/* Task Title */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">
                    Task Title <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    placeholder="e.g., Monitor crop health in Field A"
                    required
                  />
                </div>

                {/* Task Type */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">
                    Task Type <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={newTask.taskType}
                    onValueChange={(value) => setNewTask({ ...newTask, taskType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TASK_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">
                    Description
                  </label>
                  <Textarea
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    placeholder="Detailed instructions for the task"
                    rows={3}
                  />
                </div>

                {/* Assign To */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">
                    Assign To <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={newTask.assignedToUserId.toString()}
                    onValueChange={(value) =>
                      setNewTask({ ...newTask, assignedToUserId: parseInt(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select field worker" />
                    </SelectTrigger>
                    <SelectContent>
                      {fieldWorkers.map((worker) => (
                        <SelectItem key={worker.id} value={worker.id.toString()}>
                          {worker.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">
                    Priority
                  </label>
                  <Select
                    value={newTask.priority}
                    onValueChange={(value) => setNewTask({ ...newTask, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map((priority) => (
                        <SelectItem key={priority.value} value={priority.value}>
                          {priority.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Due Date & Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-foreground">
                      Due Date <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="date"
                      value={newTask.dueDate}
                      onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-foreground">
                      Due Time
                    </label>
                    <Input
                      type="time"
                      value={newTask.dueTime}
                      onChange={(e) => setNewTask({ ...newTask, dueTime: e.target.value })}
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex gap-3 pt-4">
                  <Button type="submit" disabled={isSubmitting} className="flex-1">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Task'
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Search</label>
                <Input
                  placeholder="Search tasks or workers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Status</label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    {STATUSES.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Priority</label>
                <Select value={filterPriority} onValueChange={setFilterPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    {PRIORITIES.map((priority) => (
                      <SelectItem key={priority.value} value={priority.value}>
                        {priority.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setSearchQuery('');
                    setFilterStatus('all');
                    setFilterPriority('all');
                  }}
                >
                  Reset Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tasks List */}
        <div className="space-y-4">
          {filteredTasks.length === 0 ? (
            <Card>
              <CardContent className="pt-8 text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No tasks found matching your filters</p>
              </CardContent>
            </Card>
          ) : (
            filteredTasks.map((task) => (
              <Card key={task.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-foreground">{task.title}</h3>
                        <Badge className={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                        <Badge className={getStatusBadgeVariant(task.status)}>
                          {task.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Type</p>
                          <p className="font-medium text-foreground">{task.taskType}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Assigned To</p>
                          <p className="font-medium text-foreground">{task.assignedTo}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Due Date</p>
                          <p className="font-medium text-foreground">
                            {new Date(task.dueDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Created</p>
                          <p className="font-medium text-foreground">
                            {new Date(task.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-sm">Total Tasks</p>
              <p className="text-3xl font-bold text-foreground">{allTasks.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-sm">Pending</p>
              <p className="text-3xl font-bold text-yellow-600">
                {allTasks.filter((t) => t.status === 'pending').length}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-sm">In Progress</p>
              <p className="text-3xl font-bold text-blue-600">
                {allTasks.filter((t) => t.status === 'in_progress').length}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-sm">Completed</p>
              <p className="text-3xl font-bold text-green-600">
                {allTasks.filter((t) => t.status === 'completed').length}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
