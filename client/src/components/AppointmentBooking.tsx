import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, AlertCircle, CheckCircle } from 'lucide-react';

export default function AppointmentBooking() {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [animalType, setAnimalType] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [bookingStep, setBookingStep] = useState<'select' | 'confirm' | 'success'>('select');

  const availableSlots = [
    { date: '2026-02-10', times: ['09:00', '10:00', '14:00', '15:00'] },
    { date: '2026-02-11', times: ['09:00', '11:00', '16:00'] },
    { date: '2026-02-12', times: ['10:00', '13:00', '15:00', '17:00'] },
    { date: '2026-02-13', times: ['09:00', '10:00', '11:00', '14:00'] },
  ];

  const animalTypes = ['Cattle', 'Poultry', 'Goat', 'Sheep', 'Pig', 'Fish', 'Other'];
  const reasons = [
    'Health checkup',
    'Vaccination',
    'Treatment',
    'Emergency',
    'Follow-up',
    'Consultation',
  ];

  const handleBooking = () => {
    if (selectedDate && selectedTime && animalType && reason) {
      setBookingStep('confirm');
    }
  };

  const handleConfirmBooking = () => {
    setBookingStep('success');
  };

  if (bookingStep === 'success') {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-green-500" />
            Appointment Confirmed
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm font-medium text-green-900">
              Your appointment has been successfully booked!
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Confirmation Code</p>
              <p className="font-semibold text-lg">APT-ABC123XYZ</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Date & Time</p>
                <p className="font-semibold">{selectedDate} at {selectedTime}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Animal Type</p>
                <p className="font-semibold">{animalType}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Reason</p>
              <p className="font-semibold">{reason}</p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              A confirmation email has been sent to your registered email address. Please arrive 10 minutes early.
            </p>
          </div>

          <Button onClick={() => setBookingStep('select')} className="w-full">
            Book Another Appointment
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (bookingStep === 'confirm') {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Confirm Appointment Details</CardTitle>
          <CardDescription>Please review your appointment details before confirming</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Date & Time</span>
              <span className="font-semibold">{selectedDate} at {selectedTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Animal Type</span>
              <span className="font-semibold">{animalType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Reason</span>
              <span className="font-semibold">{reason}</span>
            </div>
            {notes && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Notes</span>
                <span className="font-semibold">{notes}</span>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setBookingStep('select')}
              className="flex-1"
            >
              Back
            </Button>
            <Button onClick={handleConfirmBooking} className="flex-1">
              Confirm Booking
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Book Veterinary Appointment</CardTitle>
        <CardDescription>Schedule an appointment with Dr. Kwame Osei</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Date Selection */}
        <div>
          <label className="text-sm font-medium flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4" />
            Select Date
          </label>
          <div className="grid grid-cols-2 gap-2">
            {availableSlots.map(slot => (
              <Button
                key={slot.date}
                variant={selectedDate === slot.date ? 'default' : 'outline'}
                onClick={() => {
                  setSelectedDate(slot.date);
                  setSelectedTime('');
                }}
                className="text-sm"
              >
                {new Date(slot.date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </Button>
            ))}
          </div>
        </div>

        {/* Time Selection */}
        {selectedDate && (
          <div>
            <label className="text-sm font-medium flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4" />
              Select Time
            </label>
            <div className="grid grid-cols-4 gap-2">
              {availableSlots
                .find(s => s.date === selectedDate)
                ?.times.map(time => (
                  <Button
                    key={time}
                    variant={selectedTime === time ? 'default' : 'outline'}
                    onClick={() => setSelectedTime(time)}
                    className="text-sm"
                  >
                    {time}
                  </Button>
                ))}
            </div>
          </div>
        )}

        {/* Animal Type */}
        <div>
          <label className="text-sm font-medium mb-3 block">Animal Type</label>
          <select
            value={animalType}
            onChange={(e) => setAnimalType(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="">Select animal type</option>
            {animalTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        {/* Reason for Visit */}
        <div>
          <label className="text-sm font-medium mb-3 block">Reason for Visit</label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="">Select reason</option>
            {reasons.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        {/* Additional Notes */}
        <div>
          <label className="text-sm font-medium mb-3 block">Additional Notes (Optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional information for the veterinarian..."
            className="w-full px-3 py-2 border rounded-md min-h-24"
          />
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-medium">Consultation Fee: GHS 150/hour</p>
            <p>Please arrive 10 minutes early. Bring relevant animal health records if available.</p>
          </div>
        </div>

        {/* Action Buttons */}
        <Button
          onClick={handleBooking}
          disabled={!selectedDate || !selectedTime || !animalType || !reason}
          className="w-full"
        >
          Continue to Confirmation
        </Button>
      </CardContent>
    </Card>
  );
}
