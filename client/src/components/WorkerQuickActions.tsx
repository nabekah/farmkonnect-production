import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CheckCircle2,
  MessageSquare,
  Calendar,
  Phone,
  Mail,
  X,
} from "lucide-react";

interface Worker {
  id: number;
  name: string;
  role: string;
  email: string | null | undefined;
  contact: string | null | undefined;
  status: string | null;
  farmId: number;
}

interface WorkerQuickActionsProps {
  workers: Worker[] | undefined;
  onAssignTask?: (worker: Worker) => void;
  onViewSchedule?: (worker: Worker) => void;
}

/**
 * Worker Quick Actions Component
 * Provides inline actions for workers: assign tasks, view schedules, contact
 */
export function WorkerQuickActions({
  workers,
  onAssignTask,
  onViewSchedule,
}: WorkerQuickActionsProps) {
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);

  if (!workers || workers.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">No workers available</p>
        </CardContent>
      </Card>
    );
  }

  const activeWorkers = workers.filter((w) => w.status === "active").slice(0, 5);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Worker Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {activeWorkers.map((worker) => (
              <div
                key={worker.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex-1">
                  <p className="font-medium text-sm">{worker.name}</p>
                  <p className="text-xs text-muted-foreground">{worker.role}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setSelectedWorker(worker);
                      setShowAssignDialog(true);
                      onAssignTask?.(worker);
                    }}
                    title="Assign task"
                    className="h-8 w-8 p-0"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setSelectedWorker(worker);
                      onViewSchedule?.(worker);
                    }}
                    title="View schedule"
                    className="h-8 w-8 p-0"
                  >
                    <Calendar className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setSelectedWorker(worker);
                      setShowContactDialog(true);
                    }}
                    title="Contact worker"
                    className="h-8 w-8 p-0"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Contact Dialog */}
      <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contact {selectedWorker?.name}</DialogTitle>
            <DialogDescription>Choose how to contact this worker</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {selectedWorker?.contact && (
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  window.location.href = `tel:${selectedWorker.contact}`;
                  setShowContactDialog(false);
                }}
              >
                <Phone className="w-4 h-4 mr-2" />
                Call: {selectedWorker.contact}
              </Button>
            )}
            {selectedWorker?.email && (
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  window.location.href = `mailto:${selectedWorker.email}`;
                  setShowContactDialog(false);
                }}
              >
                <Mail className="w-4 h-4 mr-2" />
                Email: {selectedWorker.email}
              </Button>
            )}
            {!selectedWorker?.contact && !selectedWorker?.email && (
              <p className="text-sm text-muted-foreground">
                No contact information available for this worker
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Task Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Task to {selectedWorker?.name}</DialogTitle>
            <DialogDescription>
              This feature will be available soon. You can manage tasks in the task management section.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Task assignment functionality is coming soon. For now, please use the workforce management section to assign tasks to workers.
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowAssignDialog(false)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
