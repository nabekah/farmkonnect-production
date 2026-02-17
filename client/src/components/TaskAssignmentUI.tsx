import { useState, useEffect } from 'react';
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
  const [selectedFarmId, setSelectedFarmId] = useState<number | string>(1); // Default to 1 instead of 'all'
  const [farmId, setFarmId] = useState<number>(1); // Track actual farm ID for queries
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

  // Fetch farms from database
  const { data: farms = [], isLoading: farmsLoading } = trpc.farmTaskFiltering.getUserFarms.useQuery(
    {},
    { enabled: true }
  );

  // Get the default farm ID (first farm or fallback to 1)
  const defaultFarmId = farms.length > 0 ? farms[0].id : 1;

  // Update farmId when selectedFarmId changes
  useEffect(() => {
    const newFarmId = selectedFarmId === 'all' ? defaultFarmId : (typeof selectedFarmId === 'number' ? selectedFarmId : defaultFarmId);
    setFarmId(newFarmId);
  }, [selectedFarmId, defaultFarmId]);

  // Fetch workers - ALWAYS ENABLED, not conditional
  const { data: workers = [], isLoading: workersLoading, error: workersError } = trpc.workforce.workers.list.useQuery(
    { farmId },
    { enabled: true } // Always fetch workers
  );

  // Debug logging
  useEffect(() => {
    console.log('Workers data updated:', { workers, farmId, workersLoading, workersError });
  }, [workers, farmId, workersLoading, workersError]);

  // Fetch tasks from database
  const { data: tasks = [], isLoading, refetch } = trpc.taskAssignmentDatabase.getAllTasks.useQuery(
    { farmId },
    { enabled: true }
  );

  const handleAssignTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.workerId || !formData.dueDate) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      // TODO: Implement task assignment mutation
      console.log('Assigning task:', formData);
      setShowForm(false);
      setFormData({
        title: '',
        description: '',
        workerId: '',
        taskType: 'planting',
        priority: 'medium' as const,
        dueDate: '',
        estimatedHours: 4,
        workerName: ''
      });
      refetch();
    } catch (error) {
      console.error('Error assigning task:', error);
      alert('Failed to assign task');
    }
  };

  const mockTasks: Task[] = [
    {
      id: '1',
      title: 'Prepare Field A',
      description: 'Clear and prepare field A for planting',
      workerId: '1',
      workerName: 'John Doe',
      taskType: 'planting',
      priority: 'high',
      status: 'pending',
      dueDate: '2026-02-20',
      estimatedHours: 8
    }
  ];

  return (
    <div className="w-full space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Task Assignment & Tracking</h1>
        <div className="flex gap-4">
          <select
            value={selectedFarmId}
            onChange={(e) => setSelectedFarmId(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="all">All Farms</option>
            {farms.map((farm: any) => (
              <option key={farm.id} value={farm.id}>
                {farm.name}
              </option>
            ))}
          </select>
          <Button onClick={() => setShowForm(!showForm)} className="gap-2">
            <Plus className="w-4 h-4" />
            Assign New Task
          </Button>
        </div>
      </div>

      {showForm && (
        <Card className="border-2 border-blue-500">
          <CardHeader>
            <CardTitle>Create New Task</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAssignTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Task Title *</label>
                <input
                  type="text"
                  placeholder="e.g., Prepare Field A"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Task Type *</label>
                <select
                  value={formData.taskType}
                  onChange={(e) => setFormData({ ...formData, taskType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="planting">Planting</option>
                  <option value="weeding">Weeding</option>
                  <option value="irrigation">Irrigation</option>
                  <option value="harvesting">Harvesting</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  placeholder="Task details..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Assign To *</label>
                <select
                  value={formData.workerId}
                  onChange={(e) => {
                    const workerId = e.target.value;
                    const worker = workers.find((w: any) => w.id === parseInt(workerId));
                    setFormData({
                      ...formData,
                      workerId,
                      workerName: worker?.name || ''
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  disabled={workersLoading || workers.length === 0}
                  required
                >
                  <option value="">
                    {workersLoading ? 'Loading workers...' : workers.length === 0 ? 'No workers available' : 'Select Worker'}
                  </option>
                  {workers.map((worker: any) => (
                    <option key={worker.id} value={worker.id}>
                      {worker.name} ({worker.role})
                    </option>
                  ))}
                </select>
                {workersError && <p className="text-red-500 text-sm mt-1">Error loading workers</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Due Date *</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Estimated Hours</label>
                <input
                  type="number"
                  placeholder="Estimated Hours"
                  value={formData.estimatedHours}
                  onChange={(e) => setFormData({ ...formData, estimatedHours: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  min="1"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-green-600 hover:bg-green-700">
                  Assign Task
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Task Statistics */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Clock className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
              <p className="text-2xl font-bold">0</p>
              <p className="text-gray-600">Pending Tasks</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 text-blue-500" />
              <p className="text-2xl font-bold">0</p>
              <p className="text-gray-600">In Progress</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold">0</p>
              <p className="text-gray-600">Completed</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tasks List */}
      <Card>
        <CardHeader>
          <CardTitle>Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All Tasks (0)</TabsTrigger>
              <TabsTrigger value="pending">Pending (0)</TabsTrigger>
              <TabsTrigger value="progress">In Progress (0)</TabsTrigger>
              <TabsTrigger value="completed">Completed (0)</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4 mt-4">
              {mockTasks.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No tasks found</p>
              ) : (
                mockTasks.map((task) => (
                  <div key={task.id} className="border rounded-lg p-4 flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold">{task.title}</h3>
                      <p className="text-sm text-gray-600">Assigned to: {task.workerName}</p>
                      <p className="text-sm text-gray-600">Due: {task.dueDate}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
