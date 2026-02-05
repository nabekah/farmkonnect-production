import React, { useState } from 'react';
import { useLocation, useRoute } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, ArrowLeft, Clock, MapPin, User, Calendar, CheckCircle2, AlertTriangle } from 'lucide-react';
import { TaskCompletionWorkflow } from '@/components/TaskCompletionWorkflow';

interface Task {
  id: number;
  title: string;
  description: string;
  taskType: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed';
  dueDate: Date;
  assignedTo: string;
  photoRequirements: number;
  photosAttached: number;
  notes?: string;
  createdAt: Date;
  completedAt?: Date;
}

// Mock task data - in production, this would come from tRPC
const MOCK_TASKS: Record<number, Task> = {
  1: {
    id: 1,
    title: 'Irrigation System Check',
    description: 'Inspect and test the main irrigation system in Field A',
    taskType: 'irrigation',
    priority: 'high',
    status: 'pending',
    dueDate: new Date(Date.now() + 86400000),
    assignedTo: 'John Doe',
    photoRequirements: 3,
    photosAttached: 0,
    notes: 'Check for leaks and verify water pressure',
    createdAt: new Date(Date.now() - 86400000),
  },
  2: {
    id: 2,
    title: 'Soil Testing',
    description: 'Collect soil samples from Field B for nutrient analysis',
    taskType: 'soil_testing',
    priority: 'medium',
    status: 'in_progress',
    dueDate: new Date(Date.now() + 172800000),
    assignedTo: 'Jane Smith',
    photoRequirements: 2,
    photosAttached: 1,
    notes: 'Use the standard sampling kit',
    createdAt: new Date(Date.now() - 172800000),
  },
  3: {
    id: 3,
    title: 'Pest Monitoring',
    description: 'Monitor for crop pests and diseases in Field C',
    taskType: 'pest_control',
    priority: 'urgent',
    status: 'pending',
    dueDate: new Date(Date.now() + 3600000),
    assignedTo: 'Mike Johnson',
    photoRequirements: 4,
    photosAttached: 0,
    notes: 'Look for signs of aphids and spider mites',
    createdAt: new Date(Date.now() - 259200000),
  },
};

const TASK_TYPE_LABELS: Record<string, string> = {
  irrigation: 'Irrigation',
  soil_testing: 'Soil Testing',
  pest_control: 'Pest Control',
  monitoring: 'Monitoring',
  planting: 'Planting',
  fertilization: 'Fertilization',
  weed_control: 'Weed Control',
  harvest: 'Harvest',
  equipment_maintenance: 'Equipment Maintenance',
};

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-blue-100 text-blue-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
};

export function TaskDetail() {
  const [, navigate] = useLocation();
  const [match, params] = useRoute('/field-worker/tasks/:id');
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);

  if (!match) {
    return <div>Task not found</div>;
  }

  const taskId = parseInt(params?.id || '0', 10);
  const task = MOCK_TASKS[taskId];

  if (!task) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate('/field-worker/tasks')}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tasks
          </Button>
          <Card>
            <CardContent className="pt-8 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Task Not Found</h2>
              <p className="text-muted-foreground">The task you're looking for doesn't exist.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const isOverdue = task.dueDate < new Date() && task.status !== 'completed';
  const photoCompliance = task.photosAttached >= task.photoRequirements;

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/field-worker/tasks')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tasks
          </Button>

          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">{task.title}</h1>
              <div className="flex flex-wrap gap-2">
                <Badge className={PRIORITY_COLORS[task.priority]}>
                  {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
                </Badge>
                <Badge className={STATUS_COLORS[task.status]}>
                  {task.status === 'in_progress' ? 'In Progress' : task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                </Badge>
                <Badge variant="outline">
                  {TASK_TYPE_LABELS[task.taskType] || task.taskType}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {isOverdue && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-red-900">This task is overdue!</p>
              <p className="text-sm text-red-700">Due date was {task.dueDate.toLocaleDateString()}</p>
            </div>
          </div>
        )}

        {!photoCompliance && task.status !== 'completed' && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-yellow-900">Photo requirements not met</p>
              <p className="text-sm text-yellow-700">
                {task.photosAttached} of {task.photoRequirements} photos attached
              </p>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Task Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{task.description}</p>
              </CardContent>
            </Card>

            {/* Notes */}
            {task.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{task.notes}</p>
                </CardContent>
              </Card>
            )}

            {/* Photo Requirements */}
            <Card>
              <CardHeader>
                <CardTitle>Photo Documentation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Photos Required</span>
                    <span className="text-sm text-muted-foreground">{task.photoRequirements}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Photos Attached</span>
                    <span className={`text-sm font-semibold ${photoCompliance ? 'text-green-600' : 'text-red-600'}`}>
                      {task.photosAttached}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${photoCompliance ? 'bg-green-500' : 'bg-yellow-500'}`}
                      style={{ width: `${Math.min((task.photosAttached / task.photoRequirements) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Task Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Task Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Assigned To</p>
                      <p className="text-sm font-medium">{task.assignedTo}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Due Date</p>
                      <p className="text-sm font-medium">{task.dueDate.toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Created</p>
                      <p className="text-sm font-medium">{task.createdAt.toLocaleDateString()}</p>
                    </div>
                  </div>

                  {task.completedAt && (
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="text-xs text-muted-foreground">Completed</p>
                        <p className="text-sm font-medium">{task.completedAt.toLocaleDateString()}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            {task.status !== 'completed' && (
              <div className="space-y-2">
                <Button
                  onClick={() => setShowCompletionDialog(true)}
                  className="w-full"
                  disabled={!photoCompliance}
                >
                  {task.status === 'in_progress' ? 'Continue Task' : 'Start Task'}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  {!photoCompliance && 'Upload required photos to complete this task'}
                </p>
              </div>
            )}

            {task.status === 'completed' && (
              <Card className="bg-green-50 border-green-200">
                <CardContent className="pt-6 text-center">
                  <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-green-900">Task Completed</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Task Completion Workflow */}
      {showCompletionDialog && (
        <TaskCompletionWorkflow
          taskId={task.id.toString()}
          taskTitle={task.title}
          taskDescription={task.description}
          requiredPhotos={task.photoRequirements}
          onComplete={async () => {
            setShowCompletionDialog(false);
            navigate('/field-worker/tasks');
          }}
        />
      )}
    </div>
  );
}
