import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Clock, FileText, Loader2 } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate: Date;
  assignedTo: string;
  photoCount?: number;
}

interface BatchCompletionState {
  selectedTasks: Set<string>;
  sharedNotes: string;
  isSubmitting: boolean;
  successCount: number;
  errorCount: number;
}

export function BatchTaskCompletion({ tasks, onComplete }: { tasks: Task[]; onComplete?: (completedIds: string[]) => void }) {
  const [state, setState] = useState<BatchCompletionState>({
    selectedTasks: new Set(),
    sharedNotes: '',
    isSubmitting: false,
    successCount: 0,
    errorCount: 0,
  });

  const toggleTask = useCallback((taskId: string) => {
    setState((prev) => {
      const newSelected = new Set(prev.selectedTasks);
      if (newSelected.has(taskId)) {
        newSelected.delete(taskId);
      } else {
        newSelected.add(taskId);
      }
      return { ...prev, selectedTasks: newSelected };
    });
  }, []);

  const toggleAllTasks = useCallback(() => {
    setState((prev) => {
      if (prev.selectedTasks.size === tasks.length) {
        return { ...prev, selectedTasks: new Set() };
      } else {
        return { ...prev, selectedTasks: new Set(tasks.map((t) => t.id)) };
      }
    });
  }, [tasks]);

  const handleSubmit = async () => {
    if (state.selectedTasks.size === 0) {
      alert('Please select at least one task to complete');
      return;
    }

    setState((prev) => ({ ...prev, isSubmitting: true }));

    try {
      const completedIds: string[] = [];
      let success = 0;
      let errors = 0;

      const selectedArray = Array.from(state.selectedTasks);
      for (const taskId of selectedArray) {
        try {
          // TODO: Call tRPC mutation to complete task
          // await trpc.fieldWorker.completeTask.mutate({
          //   taskId,
          //   notes: state.sharedNotes,
          //   photoUrls: [],
          // });
          completedIds.push(taskId);
          success++;
        } catch (error) {
          console.error(`Failed to complete task ${taskId}:`, error);
          errors++;
        }
      }

      setState((prev) => ({
        ...prev,
        isSubmitting: false,
        successCount: success,
        errorCount: errors,
        selectedTasks: new Set(),
        sharedNotes: '',
      }));

      onComplete?.(completedIds);
    } catch (error) {
      console.error('Batch completion error:', error);
      setState((prev) => ({ ...prev, isSubmitting: false, errorCount: state.selectedTasks.size }));
    }
  };

  const getPriorityColor = (priority: Task['priority']) => {
    const colors = {
      low: 'bg-blue-100 text-blue-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800',
    };
    return colors[priority];
  };

  const isAllSelected = state.selectedTasks.size === tasks.length && tasks.length > 0;
  const isPartialSelected = state.selectedTasks.size > 0 && state.selectedTasks.size < tasks.length;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Batch Task Completion</CardTitle>
          <CardDescription>Complete multiple tasks at once with shared notes and photos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Selection Header */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={isPartialSelected ? 'indeterminate' : isAllSelected}
                onCheckedChange={toggleAllTasks}
                aria-label="Select all tasks"
              />
              <span className="text-sm font-medium">
                {state.selectedTasks.size} of {tasks.length} selected
              </span>
            </div>
            <Badge variant="outline">{state.selectedTasks.size} tasks</Badge>
          </div>

          {/* Task List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Checkbox
                  checked={state.selectedTasks.has(task.id)}
                  onCheckedChange={() => toggleTask(task.id)}
                  aria-label={`Select ${task.title}`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium truncate">{task.title}</h4>
                    <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">{task.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(task.dueDate).toLocaleDateString()}
                    </div>
                    {task.photoCount !== undefined && (
                      <div className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {task.photoCount} photos
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Shared Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Shared Notes (Optional)</label>
            <Textarea
              placeholder="Add notes that will be applied to all selected tasks..."
              value={state.sharedNotes}
              onChange={(e) => setState((prev) => ({ ...prev, sharedNotes: e.target.value }))}
              className="min-h-24"
              disabled={state.isSubmitting}
            />
          </div>

          {/* Status Messages */}
          {state.successCount > 0 && (
            <div className="flex items-center gap-2 p-3 bg-green-50 text-green-800 rounded-lg">
              <CheckCircle2 className="w-5 h-5" />
              <span>{state.successCount} tasks completed successfully</span>
            </div>
          )}

          {state.errorCount > 0 && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-800 rounded-lg">
              <AlertCircle className="w-5 h-5" />
              <span>{state.errorCount} tasks failed to complete</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t">
            <Button
              onClick={handleSubmit}
              disabled={state.selectedTasks.size === 0 || state.isSubmitting}
              className="flex-1"
            >
              {state.isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Completing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Complete {state.selectedTasks.size} Tasks
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                setState((prev) => ({
                  ...prev,
                  selectedTasks: new Set(),
                  sharedNotes: '',
                }))
              }
              disabled={state.isSubmitting}
            >
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
