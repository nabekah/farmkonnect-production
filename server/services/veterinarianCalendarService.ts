import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

// Initialize Google Calendar API
const calendar = google.calendar('v3');

export interface VeterinarianAvailability {
  veterinarianId: number;
  veterinarianName: string;
  veterinarianEmail: string;
  availableSlots: TimeSlot[];
  workingHours: WorkingHours;
  timezone: string;
}

export interface TimeSlot {
  startTime: Date;
  endTime: Date;
  available: boolean;
  booked?: boolean;
}

export interface WorkingHours {
  monday: { start: string; end: string; available: boolean };
  tuesday: { start: string; end: string; available: boolean };
  wednesday: { start: string; end: string; available: boolean };
  thursday: { start: string; end: string; available: boolean };
  friday: { start: string; end: string; available: boolean };
  saturday: { start: string; end: string; available: boolean };
  sunday: { start: string; end: string; available: boolean };
}

/**
 * Get Google Calendar auth client
 */
function getAuthClient(): JWT {
  const credentials = JSON.parse(process.env.GOOGLE_CALENDAR_CREDENTIALS || '{}');
  
  return new JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.readonly',
    ],
  });
}

/**
 * Sync veterinarian availability from Google Calendar
 */
export async function syncVeterinarianAvailability(
  veterinarianEmail: string,
  veterinarianName: string,
  workingHours: WorkingHours,
  timezone: string = 'Africa/Accra'
): Promise<VeterinarianAvailability> {
  try {
    const auth = getAuthClient();
    const now = new Date();
    const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days ahead

    // Fetch events from Google Calendar
    const response = await calendar.events.list({
      auth,
      calendarId: veterinarianEmail,
      timeMin: now.toISOString(),
      timeMax: endDate.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      timeZone: timezone,
    });

    const events = response.data.items || [];
    const availableSlots = generateAvailableSlots(
      workingHours,
      events,
      now,
      endDate,
      timezone
    );

    return {
      veterinarianId: 0, // Will be set by caller
      veterinarianName,
      veterinarianEmail,
      availableSlots,
      workingHours,
      timezone,
    };
  } catch (error) {
    console.error('Failed to sync veterinarian availability:', error);
    throw error;
  }
}

/**
 * Generate available time slots based on working hours and booked events
 */
function generateAvailableSlots(
  workingHours: WorkingHours,
  bookedEvents: any[],
  startDate: Date,
  endDate: Date,
  timezone: string
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const slotDuration = 30; // 30-minute slots

  // Create a set of booked time ranges
  const bookedRanges = bookedEvents.map(event => ({
    start: new Date(event.start.dateTime || event.start.date),
    end: new Date(event.end.dateTime || event.end.date),
  }));

  // Generate slots for each day
  let currentDate = new Date(startDate);
  while (currentDate < endDate) {
    const dayOfWeek = getDayOfWeek(currentDate);
    const dayHours = workingHours[dayOfWeek as keyof WorkingHours];

    if (dayHours && dayHours.available) {
      const [startHour, startMin] = dayHours.start.split(':').map(Number);
      const [endHour, endMin] = dayHours.end.split(':').map(Number);

      const dayStart = new Date(currentDate);
      dayStart.setHours(startHour, startMin, 0, 0);

      const dayEnd = new Date(currentDate);
      dayEnd.setHours(endHour, endMin, 0, 0);

      // Generate 30-minute slots
      let slotStart = new Date(dayStart);
      while (slotStart < dayEnd) {
        const slotEnd = new Date(slotStart.getTime() + slotDuration * 60 * 1000);

        // Check if slot is booked
        const isBooked = bookedRanges.some(range => 
          (slotStart >= range.start && slotStart < range.end) ||
          (slotEnd > range.start && slotEnd <= range.end)
        );

        slots.push({
          startTime: new Date(slotStart),
          endTime: new Date(slotEnd),
          available: !isBooked,
          booked: isBooked,
        });

        slotStart = slotEnd;
      }
    }

    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return slots;
}

/**
 * Get day of week name from date
 */
function getDayOfWeek(date: Date): string {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[date.getDay()];
}

/**
 * Book an appointment slot on veterinarian's calendar
 */
export async function bookAppointmentSlot(
  veterinarianEmail: string,
  appointmentTitle: string,
  startTime: Date,
  endTime: Date,
  farmerEmail: string,
  farmerPhone: string,
  animalName: string,
  notes: string
): Promise<{ success: boolean; eventId?: string; error?: string }> {
  try {
    const auth = getAuthClient();

    const event = {
      summary: `Appointment: ${appointmentTitle} - ${animalName}`,
      description: `
Farmer: ${farmerEmail}
Phone: ${farmerPhone}
Animal: ${animalName}
Notes: ${notes}
      `.trim(),
      start: {
        dateTime: startTime.toISOString(),
        timeZone: 'Africa/Accra',
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: 'Africa/Accra',
      },
      attendees: [
        { email: veterinarianEmail },
        { email: farmerEmail },
      ],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 24 hours before
          { method: 'email', minutes: 60 }, // 1 hour before
        ],
      },
    };

    const response = await calendar.events.insert({
      auth,
      calendarId: veterinarianEmail,
      requestBody: event as any,
      sendUpdates: 'all',
    });

    return {
      success: true,
      eventId: response.data.id,
    };
  } catch (error) {
    console.error('Failed to book appointment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Cancel an appointment
 */
export async function cancelAppointment(
  veterinarianEmail: string,
  eventId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const auth = getAuthClient();

    await calendar.events.delete({
      auth,
      calendarId: veterinarianEmail,
      eventId,
      sendUpdates: 'all',
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to cancel appointment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Reschedule an appointment
 */
export async function rescheduleAppointment(
  veterinarianEmail: string,
  eventId: string,
  newStartTime: Date,
  newEndTime: Date
): Promise<{ success: boolean; error?: string }> {
  try {
    const auth = getAuthClient();

    const response = await calendar.events.get({
      auth,
      calendarId: veterinarianEmail,
      eventId,
    });

    const event = response.data;
    event.start = {
      dateTime: newStartTime.toISOString(),
      timeZone: 'Africa/Accra',
    };
    event.end = {
      dateTime: newEndTime.toISOString(),
      timeZone: 'Africa/Accra',
    };

    await calendar.events.update({
      auth,
      calendarId: veterinarianEmail,
      eventId,
      requestBody: event as any,
      sendUpdates: 'all',
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to reschedule appointment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get next available appointment slot
 */
export async function getNextAvailableSlot(
  veterinarianEmail: string,
  workingHours: WorkingHours,
  timezone: string = 'Africa/Accra'
): Promise<TimeSlot | null> {
  try {
    const availability = await syncVeterinarianAvailability(
      veterinarianEmail,
      '', // name not needed for this operation
      workingHours,
      timezone
    );

    const availableSlots = availability.availableSlots.filter(slot => slot.available);
    return availableSlots.length > 0 ? availableSlots[0] : null;
  } catch (error) {
    console.error('Failed to get next available slot:', error);
    return null;
  }
}

/**
 * Get available slots for a specific date range
 */
export async function getAvailableSlotsForDateRange(
  veterinarianEmail: string,
  startDate: Date,
  endDate: Date,
  workingHours: WorkingHours,
  timezone: string = 'Africa/Accra'
): Promise<TimeSlot[]> {
  try {
    const auth = getAuthClient();

    const response = await calendar.events.list({
      auth,
      calendarId: veterinarianEmail,
      timeMin: startDate.toISOString(),
      timeMax: endDate.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      timeZone: timezone,
    });

    const events = response.data.items || [];
    const slots = generateAvailableSlots(
      workingHours,
      events,
      startDate,
      endDate,
      timezone
    );

    return slots.filter(slot => slot.available);
  } catch (error) {
    console.error('Failed to get available slots:', error);
    return [];
  }
}

/**
 * Create recurring working hours pattern
 */
export function createWorkingHoursPattern(
  startTime: string = '08:00',
  endTime: string = '17:00',
  workDays: string[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
): WorkingHours {
  const allDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  
  const pattern: WorkingHours = {
    monday: { start: startTime, end: endTime, available: workDays.includes('monday') },
    tuesday: { start: startTime, end: endTime, available: workDays.includes('tuesday') },
    wednesday: { start: startTime, end: endTime, available: workDays.includes('wednesday') },
    thursday: { start: startTime, end: endTime, available: workDays.includes('thursday') },
    friday: { start: startTime, end: endTime, available: workDays.includes('friday') },
    saturday: { start: startTime, end: endTime, available: workDays.includes('saturday') },
    sunday: { start: startTime, end: endTime, available: workDays.includes('sunday') },
  };

  return pattern;
}
