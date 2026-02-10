import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Clock, User, MapPin, Plus, Edit, Trash2, CheckCircle, AlertCircle, X } from "lucide-react";
import { trpc } from "@/lib/trpc";

const toast = (options: any) => {
  console.log(options);
};

export default function VeterinaryAppointments() {
  const [selectedFarmId, setSelectedFarmId] = useState<number>(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingAppointmentId, setEditingAppointmentId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    animalId: "",
    appointmentDate: "",
    appointmentTime: "",
    veterinarian: "",
    clinic: "",
    reason: "",
    notes: "",
    appointmentType: "clinic_visit" as const,
    cost: "",
  });

  // Fetch user's farms
  const { data: farms = [] } = trpc.farm.getFarms.useQuery();

  // Fetch appointments for selected farm
  const { data: appointments = [], isLoading, refetch } = trpc.vetAppointments.getAppointmentsByFarm.useQuery(
    { farmId: selectedFarmId },
    { enabled: !!selectedFarmId }
  );

  // Fetch animals for the selected farm
  const { data: animals = [] } = trpc.livestock.getAnimals.useQuery(
    { farmId: selectedFarmId },
    { enabled: !!selectedFarmId }
  );

  // Mutations
  const createMutation = trpc.vetAppointments.createAppointment.useMutation({
    onSuccess: () => {
      toast({ title: "Success", description: "Appointment created successfully" });
      refetch();
      resetForm();
      setIsCreateDialogOpen(false);
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = trpc.vetAppointments.updateAppointment.useMutation({
    onSuccess: () => {
      toast({ title: "Success", description: "Appointment updated successfully" });
      refetch();
      resetForm();
      setIsCreateDialogOpen(false);
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const cancelMutation = trpc.vetAppointments.cancelAppointment.useMutation({
    onSuccess: () => {
      toast({ title: "Success", description: "Appointment cancelled successfully" });
      refetch();
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      animalId: "",
      appointmentDate: "",
      appointmentTime: "",
      veterinarian: "",
      clinic: "",
      reason: "",
      notes: "",
      appointmentType: "clinic_visit",
      cost: "",
    });
    setEditingAppointmentId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.appointmentDate || !formData.appointmentTime || !formData.veterinarian || !formData.reason) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    const appointmentDateTime = `${formData.appointmentDate}T${formData.appointmentTime}`;

    if (editingAppointmentId) {
      updateMutation.mutate({
        id: editingAppointmentId,
        appointmentDate: appointmentDateTime,
        appointmentTime: formData.appointmentTime,
        veterinarian: formData.veterinarian,
        clinic: formData.clinic || undefined,
        reason: formData.reason,
        notes: formData.notes || undefined,
      });
    } else {
      createMutation.mutate({
        animalId: formData.animalId ? parseInt(formData.animalId) : undefined,
        appointmentDate: appointmentDateTime,
        appointmentTime: formData.appointmentTime,
        veterinarian: formData.veterinarian,
        clinic: formData.clinic || undefined,
        reason: formData.reason,
        notes: formData.notes || undefined,
        status: "scheduled",
      });
    }
  };

  const handleEdit = (appointment: any) => {
    const date = new Date(appointment.appointmentDate);
    const dateStr = date.toISOString().split("T")[0];
    const timeStr = date.toTimeString().slice(0, 5);

    setFormData({
      animalId: appointment.animalId?.toString() || "",
      appointmentDate: dateStr,
      appointmentTime: timeStr,
      veterinarian: appointment.veterinarian,
      clinic: appointment.clinic || "",
      reason: appointment.reason,
      notes: appointment.notes || "",
      appointmentType: appointment.appointmentType || "clinic_visit",
      cost: appointment.cost?.toString() || "",
    });
    setEditingAppointmentId(appointment.id);
    setIsCreateDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "no_show":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      case "cancelled":
      case "no_show":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  // Calculate statistics
  const stats = useMemo(() => {
    return {
      total: appointments.length,
      scheduled: appointments.filter(a => a.status === "scheduled").length,
      completed: appointments.filter(a => a.status === "completed").length,
      upcoming: appointments.filter(a => {
        const date = new Date(a.appointmentDate);
        return date > new Date() && a.status === "scheduled";
      }).length,
    };
  }, [appointments]);

  const activeFarm = farms.find(f => f.id === selectedFarmId);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Veterinary Appointments</h1>
          <p className="text-muted-foreground mt-2">Schedule and manage veterinary visits for your livestock</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={() => resetForm()}>
              <Plus className="w-4 h-4" />
              New Appointment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingAppointmentId ? "Edit Appointment" : "Schedule New Appointment"}</DialogTitle>
              <DialogDescription>
                {editingAppointmentId ? "Update appointment details" : "Add a new veterinary appointment for your livestock"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="animalId">Animal (Optional)</Label>
                  <Select value={formData.animalId} onValueChange={(value) => setFormData({ ...formData, animalId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select animal" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Farm-level consultation</SelectItem>
                      {animals.map((animal) => (
                        <SelectItem key={animal.id} value={animal.id.toString()}>
                          {animal.uniqueTagId || `Animal ${animal.id}`} - {animal.breed}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="appointmentType">Appointment Type</Label>
                  <Select value={formData.appointmentType} onValueChange={(value) => setFormData({ ...formData, appointmentType: value as any })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="clinic_visit">Clinic Visit</SelectItem>
                      <SelectItem value="farm_visit">Farm Visit</SelectItem>
                      <SelectItem value="telemedicine">Telemedicine</SelectItem>
                      <SelectItem value="emergency">Emergency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="appointmentDate">Date *</Label>
                  <Input
                    id="appointmentDate"
                    type="date"
                    value={formData.appointmentDate}
                    onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="appointmentTime">Time *</Label>
                  <Input
                    id="appointmentTime"
                    type="time"
                    value={formData.appointmentTime}
                    onChange={(e) => setFormData({ ...formData, appointmentTime: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="veterinarian">Veterinarian *</Label>
                  <Input
                    id="veterinarian"
                    placeholder="Dr. Name"
                    value={formData.veterinarian}
                    onChange={(e) => setFormData({ ...formData, veterinarian: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clinic">Clinic/Location</Label>
                  <Input
                    id="clinic"
                    placeholder="Clinic name or address"
                    value={formData.clinic}
                    onChange={(e) => setFormData({ ...formData, clinic: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cost">Cost (GHS)</Label>
                  <Input
                    id="cost"
                    type="number"
                    placeholder="0.00"
                    step="0.01"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">Reason for Visit *</Label>
                  <Input
                    id="reason"
                    placeholder="e.g., Annual checkup, vaccination"
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes or special instructions"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingAppointmentId ? "Update" : "Schedule"} Appointment
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Farm Selector */}
      {farms.length > 1 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Label htmlFor="farm-select" className="font-medium">Select Farm:</Label>
              <Select value={selectedFarmId.toString()} onValueChange={(value) => setSelectedFarmId(parseInt(value))}>
                <SelectTrigger className="w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {farms.map((farm) => (
                    <SelectItem key={farm.id} value={farm.id.toString()}>
                      {farm.farmName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Scheduled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.scheduled}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Upcoming</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.upcoming}</div>
          </CardContent>
        </Card>
      </div>

      {/* Appointments List */}
      <div className="space-y-4">
        {isLoading ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">Loading appointments...</p>
            </CardContent>
          </Card>
        ) : appointments.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-center py-8">
                No appointments scheduled yet {activeFarm && `for ${activeFarm.farmName}`}
              </p>
            </CardContent>
          </Card>
        ) : (
          appointments.map((appointment) => (
            <Card key={appointment.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">
                        {appointment.uniqueTagId || "Farm-level Consultation"}
                      </h3>
                      <Badge className={getStatusColor(appointment.status)}>
                        <span className="flex items-center gap-1">
                          {getStatusIcon(appointment.status)}
                          {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1).replace(/_/g, " ")}
                        </span>
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>{new Date(appointment.appointmentDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span>{new Date(appointment.appointmentDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span>{appointment.veterinarian || "Not assigned"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span>{appointment.clinic || "TBD"}</span>
                      </div>
                    </div>

                    {appointment.breed && (
                      <div className="text-sm text-muted-foreground">
                        <strong>Breed:</strong> {appointment.breed}
                      </div>
                    )}

                    {appointment.reason && (
                      <div className="text-sm text-muted-foreground">
                        <strong>Reason:</strong> {appointment.reason}
                      </div>
                    )}

                    {appointment.notes && (
                      <div className="text-sm text-muted-foreground">
                        <strong>Notes:</strong> {appointment.notes}
                      </div>
                    )}

                    {appointment.cost && (
                      <div className="text-sm font-medium">
                        Cost: GHS {parseFloat(appointment.cost).toFixed(2)}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      onClick={() => handleEdit(appointment)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1 text-red-600"
                      onClick={() => cancelMutation.mutate({ id: appointment.id })}
                      disabled={cancelMutation.isPending || appointment.status === "cancelled"}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
