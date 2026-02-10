import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Bell, Clock } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface AppointmentRemindersProps {
  farmId: number;
}

export function AppointmentReminders({ farmId }: AppointmentRemindersProps) {
  const [reminders, setReminders] = useState<any[]>([]);

  // Fetch appointment reminders (due in next 3 days)
  const { data: reminderData = [] } = trpc.vetAppointments.getAppointmentReminders.useQuery(
    { farmId },
    { refetchInterval: 60000 } // Refetch every minute
  );

  useEffect(() => {
    setReminders(reminderData);
  }, [reminderData]);

  if (reminders.length === 0) {
    return null;
  }

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-orange-600" />
          <CardTitle className="text-base">Upcoming Appointments</CardTitle>
          <Badge variant="outline" className="ml-auto">
            {reminders.length} due soon
          </Badge>
        </div>
        <CardDescription>Appointments scheduled for the next 3 days</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {reminders.map((reminder) => (
            <div key={reminder.id} className="flex items-start gap-3 pb-3 border-b last:border-b-0">
              <AlertCircle className="w-4 h-4 text-orange-600 mt-1 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">
                  {reminder.tagId || `Animal ${reminder.animalId}`}
                  {reminder.breed && <span className="text-muted-foreground"> • {reminder.breed}</span>}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  <strong>{reminder.reason}</strong>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(reminder.appointmentDate).toLocaleDateString()} at{" "}
                    {new Date(reminder.appointmentDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  {reminder.daysUntil !== undefined && (
                    <span className="font-medium">
                      {reminder.daysUntil === 0 ? "Today" : reminder.daysUntil === 1 ? "Tomorrow" : `In ${reminder.daysUntil} days`}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
