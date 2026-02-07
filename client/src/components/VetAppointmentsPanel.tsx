import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, Clock, User, MapPin, Plus } from "lucide-react";
import { toast } from "sonner";

interface VetAppointmentsPanelProps {
  farmId?: number;
  animalId?: number;
}

export function VetAppointmentsPanel({ farmId, animalId }: VetAppointmentsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    appointmentDate: "",
    appointmentTime: "",
    veterinarian: "",
    clinic: "",
    reason: "",
    notes: "",
  });

  const { data: appointments, isLoading, refetch } = animalId
    ? trpc.vetAppointments.getAnimalAppointments.useQuery({ animalId })
    : trpc.vetAppointments.getUpcomingAppointments.useQuery({ farmId });

  const createAppointmentMutation = trpc.vetAppointments.createAppointment.useMutation({
    onSuccess: () => {
      toast.success("Appointment scheduled");
      setFormData({
        appointmentDate: "",
        appointmentTime: "",
        veterinarian: "",
        clinic: "",
        reason: "",
        notes: "",
      });
      setIsOpen(false);
      refetch();
    },
  });

  const cancelAppointmentMutation = trpc.vetAppointments.cancelAppointment.useMutation({
    onSuccess: () => {
      toast.success("Appointment cancelled");
      refetch();
    },
  });

  const handleCreateAppointment = () => {
    if (!formData.appointmentDate || !formData.appointmentTime || !formData.veterinarian || !formData.reason) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!animalId) {
      toast.error("Please select an animal");
      return;
    }

    createAppointmentMutation.mutate({
      animalId,
      appointmentDate: formData.appointmentDate,
      appointmentTime: formData.appointmentTime,
      veterinarian: formData.veterinarian,
      clinic: formData.clinic,
      reason: formData.reason,
      notes: formData.notes,
      status: "scheduled",
    });
  };

  if (isLoading) {
    return <Card className="p-6"><div>Loading appointments...</div></Card>;
  }

  const appointmentsList = appointments || [];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-lg">Veterinary Appointments</h3>
        {animalId && (
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Schedule
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Schedule Veterinary Appointment</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold">Date</label>
                  <input
                    type="date"
                    value={formData.appointmentDate}
                    onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
                    className="w-full border rounded px-2 py-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold">Time</label>
                  <input
                    type="time"
                    value={formData.appointmentTime}
                    onChange={(e) => setFormData({ ...formData, appointmentTime: e.target.value })}
                    className="w-full border rounded px-2 py-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold">Veterinarian</label>
                  <input
                    type="text"
                    placeholder="Dr. Name"
                    value={formData.veterinarian}
                    onChange={(e) => setFormData({ ...formData, veterinarian: e.target.value })}
                    className="w-full border rounded px-2 py-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold">Clinic</label>
                  <input
                    type="text"
                    placeholder="Clinic name (optional)"
                    value={formData.clinic}
                    onChange={(e) => setFormData({ ...formData, clinic: e.target.value })}
                    className="w-full border rounded px-2 py-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold">Reason</label>
                  <input
                    type="text"
                    placeholder="Checkup, vaccination, treatment..."
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    className="w-full border rounded px-2 py-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold">Notes</label>
                  <textarea
                    placeholder="Additional notes..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full border rounded px-2 py-1 h-20"
                  />
                </div>
                <Button
                  onClick={handleCreateAppointment}
                  disabled={createAppointmentMutation.isPending}
                  className="w-full"
                >
                  Schedule Appointment
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {appointmentsList.length === 0 ? (
        <Card className="p-6 text-center">
          <p className="text-gray-600">No appointments scheduled</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {appointmentsList.map((apt: any) => (
            <Card key={apt.id} className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="font-semibold">{apt.tagId || "Appointment"}</p>
                    <Badge variant={apt.status === "scheduled" ? "default" : "secondary"}>
                      {apt.status}
                    </Badge>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {new Date(apt.appointmentDate).toLocaleDateString()}
                    </p>
                    <p className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {apt.appointmentTime}
                    </p>
                    <p className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Dr. {apt.veterinarian}
                    </p>
                    {apt.clinic && (
                      <p className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {apt.clinic}
                      </p>
                    )}
                    <p className="text-sm">{apt.reason}</p>
                  </div>
                  {apt.notes && (
                    <p className="text-xs text-gray-500 mt-2">Notes: {apt.notes}</p>
                  )}
                </div>
                {apt.status === "scheduled" && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => cancelAppointmentMutation.mutate({ id: apt.id })}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
