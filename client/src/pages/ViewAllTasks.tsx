import React, { useState, useEffect } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Clock, CheckCircle2, AlertCircle, Trash2, ChevronLeft, Loader2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useWebSocket } from '@/hooks/useWebSocket';

interface Task {
  taskId: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  dueDate: string;
  createdAt: string;
  assignedToUserId?: number;
}

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
  { value: 'pending', label: 'Pending', icon: Clock, color: 'text-gray-500' },
  { value: 'in_progress', label: 'In Progress', icon: Clock, color: 'text-blue-500' },
  { value: 'completed', label: 'Completed', icon: CheckCircle2, color: 'text-green-500' },
  { value: 'cancelled', label: 'Cancelled', icon: AlertCircle, color: 'text-red-500' },
];

export function ViewAllTasks() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'status'>('dueDate');

  // Get farm ID from user - default to 1 for now
  const farmId = 1;

  // Fetch real tasks from database
  const { data: tasksData, isLoading, refetch } = trpc.fieldWorker.getTasks.useQuery(
    { farmId },
    { enabled: !!farmId }
  );

  // Set up WebSocket listeners for real-time updates
  useWebSocket({
    onTaskCreated: () => refetch(),
    onTaskUpdated: () => refetch(),
  });

  // Update tasks when data changes
  useEffect(() => {
    if (tasksData?.tasks) {
      const mappedTasks: Task[] = tasksData.tasks.map((t: any) => ({
        taskId: t.taskId,
        title: t.title,
        description: t.description || '',
        priority: t.priority,
        status: t.status,
        dueDate: t.dueDate instanceof Date ? t.dueDate.toISOString() : t.dueDate,
        createdAt: t.createdAt instanceof Date ? t.createdAt.toISOString() : t.createdAt,
        assignedToUserId: t.assignedToUserId,
      }));
      setTasks(mappedTasks);
    }
  }, [tasksData]);

  // Filter and sort tasks
  useEffect(() => {
    let filtered = tasks;

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter((task) => task.status === filterStatus);
    }

    // Filter by priority
    if (filterPriority !== 'all') {
      filtered = filtered.filter((task) => task.priority === filterPriority);
    }

    // Search by title or description
    if (searchQuery) {
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          task.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort
    if (sortBy === 'dueDate') {
      filtered.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    } else if (sortBy === 'priority') {
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      filtered.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    } else if (sortBy === 'status') {
      const statusOrder = { pending: 0, in_progress: 1, completed: 2, cancelled: 3 };
      filtered.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);
    }

    setFilteredTasks(filtered);
  }, [tasks, filterStatus, filterPriority, searchQuery, sortBy]);

  const getPriorityColor = (priority: string) => {
    return PRIORITIES.find((p) => p.value === priority)?.color || 'bg-gray-500';
  };

  const getStatusIcon = (status: string) => {
    const statusItem = STATUSES.find((s) => s.value === status);
    return statusItem ? statusItem.icon : Clock;
  };

  const getStatusColor = (status: string) => {
    const statusItem = STATUSES.find((s) => s.value === status);
    return statusItem ? statusItem.color : 'text-gray-500';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/field-worker/dashboard')}
                className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
            </div>
            <h1 className="text-3xl font-bold text-foreground">All Tasks</h1>
            <p className="text-muted-foreground">Manage and track your assigned tasks</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total Tasks</p>
            <p className="text-3xl font-bold">{filteredTasks.length}</p>
          </div>
        </div>

        {/* Filters and Search */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Search Tasks</label>
                <Input
                  placeholder="Search by title or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Priority</label>
                <Select value={filterPriority} onValueChange={setFilterPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Sort By</label>
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dueDate">Due Date</SelectItem>
                    <SelectItem value="priority">Priority</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="ml-2 text-muted-foreground">Loading tasks...</p>
          </div>
        )}

        {/* Tasks List */}
        <div className="space-y-4">
          {!isLoading && filteredTasks.length === 0 ? (
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <p className="text-muted-foreground">No tasks found matching your criteria</p>
              </CardContent>
            </Card>
          ) : (
            filteredTasks.map((task) => {
              const StatusIcon = getStatusIcon(task.status);
              return (
                <Card key={task.taskId} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start gap-3 mb-2">
                          <StatusIcon className={`h-5 w-5 mt-1 flex-shrink-0 ${getStatusColor(task.status)}`} />
                          <div>
                            <h3 className="text-lg font-semibold">{task.title}</h3>
                            <p className="text-sm text-muted-foreground">{task.description}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-3">
                          <Badge className={`${getPriorityColor(task.priority)} text-white`}>
                            {task.priority}
                          </Badge>
                          <Badge variant="secondary">{task.status}</Badge>
                          <span className="text-xs text-muted-foreground ml-2">
                            Due: {formatDate(task.dueDate)}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate(`/field-worker/tasks/${task.taskId}`)}
                        >
                          View
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
