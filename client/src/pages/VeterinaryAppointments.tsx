import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Calendar, Clock, MapPin, Phone, User } from 'lucide-react';

/**
 * Veterinary Appointments Management Page
 * Displays appointment calendar, scheduling, and management
 */
export default function VeterinaryAppointments() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [appointments, setAppointments] = useState([
    {
      id: 1,
      animalName: 'Bessie',
      animalType: 'Cattle',
      appointmentDate: '2024-02-15T10:00:00',
      appointmentType: 'Vaccination',
      veterinarian: 'Dr. Kwame Asante',
      status: 'scheduled',
      cost: 250,
      reason: 'Annual vaccination',
    },
    {
      id: 2,
      animalName: 'Daisy',
      animalType: 'Cattle',
      appointmentDate: '2024-02-15T14:00:00',
      appointmentType: 'Consultation',
      veterinarian: 'Dr. Ama Boateng',
      status: 'scheduled',
      cost: 150,
      reason: 'Health check',
    },
    {
      id: 3,
      animalName: 'Goat-01',
      animalType: 'Goat',
      appointmentDate: '2024-02-16T09:00:00',
      appointmentType: 'Treatment',
      veterinarian: 'Dr. Kwame Asante',
      status: 'completed',
      cost: 300,
      reason: 'Wound treatment',
    },
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
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
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const upcomingAppointments = appointments.filter(
    (apt) => new Date(apt.appointmentDate) >= new Date() && apt.status === 'scheduled'
  );

  const completedAppointments = appointments.filter((apt) => apt.status === 'completed');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Veterinary Appointments</h1>
          <p className="text-gray-600 mt-1">Schedule and manage veterinary care for your livestock</p>
        </div>
        <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700">
              <Calendar className="w-4 h-4 mr-2" />
              Book Appointment
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Book New Appointment</DialogTitle>
              <DialogDescription>Schedule a veterinary appointment for your livestock</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Animal</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select animal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bessie">Bessie (Cattle)</SelectItem>
                    <SelectItem value="daisy">Daisy (Cattle)</SelectItem>
                    <SelectItem value="goat-01">Goat-01 (Goat)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Appointment Type</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="consultation">Consultation</SelectItem>
                    <SelectItem value="vaccination">Vaccination</SelectItem>
                    <SelectItem value="treatment">Treatment</SelectItem>
                    <SelectItem value="surgery">Surgery</SelectItem>
                    <SelectItem value="follow-up">Follow-up</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Veterinarian</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select veterinarian" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kwame">Dr. Kwame Asante</SelectItem>
                    <SelectItem value="ama">Dr. Ama Boateng</SelectItem>
                    <SelectItem value="john">Dr. John Mensah</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date & Time</label>
                <Input type="datetime-local" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Reason</label>
                <Input placeholder="Reason for appointment" />
              </div>
              <Button className="w-full bg-green-600 hover:bg-green-700">Confirm Booking</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{upcomingAppointments.length}</div>
              <p className="text-sm text-gray-600 mt-1">Upcoming Appointments</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{completedAppointments.length}</div>
              <p className="text-sm text-gray-600 mt-1">Completed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">
                {appointments.reduce((sum, apt) => sum + apt.cost, 0).toLocaleString()}
              </div>
              <p className="text-sm text-gray-600 mt-1">Total Cost (GHS)</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {(appointments.reduce((sum, apt) => sum + apt.cost, 0) / appointments.length).toFixed(0)}
              </div>
              <p className="text-sm text-gray-600 mt-1">Avg. Cost (GHS)</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Appointments */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Appointments</CardTitle>
          <CardDescription>Your scheduled veterinary appointments</CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingAppointments.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No upcoming appointments scheduled</p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingAppointments.map((apt) => (
                <div key={apt.id} className="border rounded-lg p-4 hover:bg-gray-50 transition">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{apt.animalName}</h3>
                      <p className="text-sm text-gray-600">{apt.animalType}</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={getTypeColor(apt.appointmentType)}>{apt.appointmentType}</Badge>
                      <Badge className={getStatusColor(apt.status)}>{apt.status}</Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span>{new Date(apt.appointmentDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span>{new Date(apt.appointmentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <span>{apt.veterinarian}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-green-600">GHS {apt.cost}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-3">Reason: {apt.reason}</p>
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm">
                      Reschedule
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600">
                      Cancel
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Completed Appointments */}
      <Card>
        <CardHeader>
          <CardTitle>Appointment History</CardTitle>
          <CardDescription>Previously completed veterinary appointments</CardDescription>
        </CardHeader>
        <CardContent>
          {completedAppointments.length === 0 ? (
            <p className="text-center text-gray-600 py-8">No completed appointments yet</p>
          ) : (
            <div className="space-y-3">
              {completedAppointments.map((apt) => (
                <div key={apt.id} className="border rounded-lg p-3 bg-gray-50">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold">{apt.animalName}</p>
                      <p className="text-sm text-gray-600">
                        {apt.appointmentType} • {new Date(apt.appointmentDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge className={getStatusColor(apt.status)}>{apt.status}</Badge>
                      <p className="text-sm font-semibold mt-1">GHS {apt.cost}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
