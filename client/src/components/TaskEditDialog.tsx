import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';

interface TaskEditDialogProps {
  taskId: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate: Date;
  notes?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function TaskEditDialog({
  taskId,
  title: initialTitle,
  description: initialDescription,
  priority: initialPriority,
  dueDate: initialDueDate,
  notes: initialNotes,
  isOpen,
  onClose,
  onSuccess,
}: TaskEditDialogProps) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>(initialPriority);
  const [dueDate, setDueDate] = useState(initialDueDate.toISOString().split('T')[0]);
  const [notes, setNotes] = useState(initialNotes || '');
  const [error, setError] = useState('');

  const updateTaskMutation = trpc.fieldWorker.updateTask.useMutation({
    onSuccess: () => {
      onSuccess();
      onClose();
    },
    onError: (err) => {
      setError(err.message || 'Failed to update task');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    updateTaskMutation.mutate({
      taskId,
      title: title !== initialTitle ? title : undefined,
      description: description !== initialDescription ? description : undefined,
      priority: priority !== initialPriority ? priority : undefined,
      dueDate: dueDate !== initialDueDate.toISOString().split('T')[0] ? dueDate : undefined,
      notes: notes !== (initialNotes || '') ? notes : undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
          <DialogDescription>Update task details and information</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Task Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title"
              disabled={updateTaskMutation.isPending}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter task description"
              rows={3}
              disabled={updateTaskMutation.isPending}
            />
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
              <SelectTrigger id="priority" disabled={updateTaskMutation.isPending}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              disabled={updateTaskMutation.isPending}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes"
              rows={2}
              disabled={updateTaskMutation.isPending}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={updateTaskMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateTaskMutation.isPending}
            >
              {updateTaskMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
