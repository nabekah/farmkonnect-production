import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Calendar, Clock, MapPin, Phone, User, Plus } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/hooks/useAuth';

/**
 * Veterinary Appointments Management Page
 * Displays appointment calendar, scheduling, and management
 */
export default function VeterinaryAppointments() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [selectedFarmId] = useState(1);

  // Fetch appointments using tRPC
  const { data: appointments = [], isLoading, refetch } = trpc.veterinaryAppointments.list.useQuery(
    { farmId: selectedFarmId },
    { enabled: !!selectedFarmId }
  );

  // Fetch appointment statistics
  const { data: stats } = trpc.veterinaryAppointments.getStatistics.useQuery(
    { farmId: selectedFarmId },
    { enabled: !!selectedFarmId }
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'rescheduled':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Vaccination':
        return 'bg-purple-100 text-purple-800';
      case 'Consultation':
        return 'bg-blue-100 text-blue-800';
      case 'Treatment':
        return 'bg-orange-100 text-orange-800';
      case 'Surgery':
        return 'bg-red-100 text-red-800';
      case 'Follow-up':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-lg font-semibold">Please log in to view appointments</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Veterinary Appointments</h1>
          <p className="text-gray-600 mt-2">Schedule and manage veterinary appointments for your animals</p>
        </div>
        <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Schedule Appointment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Schedule New Appointment</DialogTitle>
              <DialogDescription>Book a new veterinary appointment for your animal</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Animal</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select animal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Bessie (Cattle)</SelectItem>
                    <SelectItem value="2">Daisy (Cattle)</SelectItem>
                    <SelectItem value="3">Goat-01 (Goat)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Appointment Type</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Consultation">Consultation</SelectItem>
                    <SelectItem value="Vaccination">Vaccination</SelectItem>
                    <SelectItem value="Treatment">Treatment</SelectItem>
                    <SelectItem value="Surgery">Surgery</SelectItem>
                    <SelectItem value="Follow-up">Follow-up</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Date</label>
                <Input type="date" />
              </div>

              <div>
                <label className="text-sm font-medium">Time</label>
                <Input type="time" />
              </div>

              <div>
                <label className="text-sm font-medium">Veterinarian</label>
                <Input placeholder="Enter veterinarian name" />
              </div>

              <div>
                <label className="text-sm font-medium">Reason</label>
                <Input placeholder="Reason for appointment" />
              </div>

              <Button className="w-full bg-blue-600 hover:bg-blue-700">Schedule Appointment</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Appointments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAppointments}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Scheduled</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.scheduledAppointments}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.completedAppointments}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Average Cost</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">GHS {stats.averageCost}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Appointments List */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming & Recent Appointments</CardTitle>
          <CardDescription>Manage your veterinary appointments</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading appointments...</p>
            </div>
          ) : appointments.length > 0 ? (
            <div className="space-y-4">
              {appointments.map((appointment: any) => (
                <div key={appointment.id} className="border rounded-lg p-4 hover:bg-gray-50 transition">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{appointment.animalName}</h3>
                      <p className="text-sm text-gray-600">{appointment.animalType}</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={getTypeColor(appointment.appointmentType)}>
                        {appointment.appointmentType}
                      </Badge>
                      <Badge className={getStatusColor(appointment.status)}>
                        {appointment.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      {new Date(appointment.appointmentDate).toLocaleDateString()}
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Clock className="w-4 h-4 mr-2" />
                      {appointment.appointmentTime}
                    </div>
                    <div className="flex items-center text-gray-600">
                      <User className="w-4 h-4 mr-2" />
                      {appointment.veterinarian}
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Phone className="w-4 h-4 mr-2" />
                      GHS {appointment.cost}
                    </div>
                  </div>

                  {appointment.reason && (
                    <div className="mt-3 p-2 bg-gray-100 rounded text-sm">
                      <p className="text-gray-700"><strong>Reason:</strong> {appointment.reason}</p>
                    </div>
                  )}

                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm">Edit</Button>
                    <Button variant="outline" size="sm">Reschedule</Button>
                    {appointment.status === 'scheduled' && (
                      <Button variant="outline" size="sm" className="text-red-600">Cancel</Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">No appointments found</p>
              <p className="text-gray-500 text-sm mt-1">Schedule your first veterinary appointment</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
