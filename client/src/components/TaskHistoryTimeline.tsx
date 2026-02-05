import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, AlertCircle, Edit, Clock } from 'lucide-react';
import { trpc } from '@/lib/trpc';

interface TaskHistoryTimelineProps {
  taskId: string;
}

const CHANGE_TYPE_LABELS: Record<string, string> = {
  created: 'Task Created',
  status_changed: 'Status Changed',
  priority_changed: 'Priority Changed',
  due_date_changed: 'Due Date Changed',
  reassigned: 'Reassigned',
  notes_added: 'Notes Added',
  completed: 'Task Completed',
  cancelled: 'Task Cancelled',
  edited: 'Task Edited',
};

const CHANGE_TYPE_COLORS: Record<string, string> = {
  created: 'bg-blue-100 text-blue-800',
  status_changed: 'bg-purple-100 text-purple-800',
  priority_changed: 'bg-orange-100 text-orange-800',
  due_date_changed: 'bg-yellow-100 text-yellow-800',
  reassigned: 'bg-pink-100 text-pink-800',
  notes_added: 'bg-green-100 text-green-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  edited: 'bg-gray-100 text-gray-800',
};

export function TaskHistoryTimeline({ taskId }: TaskHistoryTimelineProps) {
  const { data: history, isLoading, error } = trpc.fieldWorker.getTaskHistory.useQuery({
    taskId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Task History</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Task History</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-2 text-red-600 py-8">
          <AlertCircle className="h-5 w-5" />
          <span>Failed to load task history</span>
        </CardContent>
      </Card>
    );
  }

  if (!history || !history.history || history.history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Task History</CardTitle>
          <CardDescription>No changes recorded yet</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8 text-muted-foreground">
          This task hasn't been modified since creation
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Task History</CardTitle>
        <CardDescription>Complete audit trail of all changes</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {history.history && history.history.map((entry: any, index: number) => (
            <div key={entry.id} className="flex gap-4">
              {/* Timeline dot and line */}
              <div className="flex flex-col items-center">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  {entry.changeType === 'completed' ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : entry.changeType === 'cancelled' ? (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  ) : (
                    <Edit className="h-5 w-5 text-primary" />
                  )}
                </div>
                {history.history && index < history.history.length - 1 && (
                  <div className="w-0.5 h-12 bg-border mt-2" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pt-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-foreground">
                        {CHANGE_TYPE_LABELS[entry.changeType] || entry.changeType}
                      </h4>
                      <Badge className={CHANGE_TYPE_COLORS[entry.changeType]}>
                        {entry.changeType}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {entry.description}
                    </p>
                    {entry.oldValue && entry.newValue && (
                      <div className="mt-2 p-2 bg-muted rounded text-xs space-y-1">
                        <div>
                          <span className="font-medium">From:</span> {entry.oldValue}
                        </div>
                        <div>
                          <span className="font-medium">To:</span> {entry.newValue}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(entry.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                </div>

                {/* Changed by */}
                <div className="mt-2 text-xs text-muted-foreground">
                  Changed by: <span className="font-medium">{entry.changedByName}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
