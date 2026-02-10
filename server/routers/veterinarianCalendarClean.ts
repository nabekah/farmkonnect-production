import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';

export const veterinarianCalendarRouter = router({
  /**
   * Get veterinarian availability
   */
  getVeterinarianAvailability: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        veterinarianId: z.number(),
        startDate: z.date(),
        endDate: z.date(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        // Mock implementation - in production would call veterinarianCalendarService
        const availableSlots = [];
        const currentDate = new Date(input.startDate);

        while (currentDate <= input.endDate) {
          const dayOfWeek = currentDate.getDay();
          // Skip weekends
          if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            for (let hour = 8; hour < 17; hour++) {
              for (let min = 0; min < 60; min += 30) {
                const slotStart = new Date(currentDate);
                slotStart.setHours(hour, min, 0, 0);
                const slotEnd = new Date(slotStart);
                slotEnd.setMinutes(slotEnd.getMinutes() + 30);

                availableSlots.push({
                  startTime: slotStart,
                  endTime: slotEnd,
                  available: true,
                  booked: false,
                });
              }
            }
          }
          currentDate.setDate(currentDate.getDate() + 1);
        }

        return {
          veterinarianId: input.veterinarianId,
          availableSlots: availableSlots.slice(0, 20), // Return first 20 slots
          total: availableSlots.length,
        };
      } catch (error) {
        console.error('Failed to get veterinarian availability:', error);
        throw new Error('Failed to get veterinarian availability');
      }
    }),

  /**
   * Book appointment slot
   */
  bookAppointmentSlot: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        veterinarianId: z.number(),
        veterinarianEmail: z.string().email(),
        appointmentTitle: z.string(),
        startTime: z.date(),
        endTime: z.date(),
        farmerEmail: z.string().email(),
        farmerPhone: z.string(),
        animalName: z.string(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Mock implementation - in production would call veterinarianCalendarService.bookAppointmentSlot
        return {
          success: true,
          eventId: `event-${Date.now()}`,
          appointmentTitle: input.appointmentTitle,
          startTime: input.startTime,
          endTime: input.endTime,
          veterinarianEmail: input.veterinarianEmail,
          farmerEmail: input.farmerEmail,
          confirmationSent: true,
        };
      } catch (error) {
        console.error('Failed to book appointment:', error);
        throw new Error('Failed to book appointment');
      }
    }),

  /**
   * Cancel appointment
   */
  cancelAppointment: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        veterinarianId: z.number(),
        veterinarianEmail: z.string().email(),
        eventId: z.string(),
        cancellationReason: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Mock implementation - in production would call veterinarianCalendarService.cancelAppointment
        return {
          success: true,
          eventId: input.eventId,
          cancellationSent: true,
        };
      } catch (error) {
        console.error('Failed to cancel appointment:', error);
        throw new Error('Failed to cancel appointment');
      }
    }),

  /**
   * Reschedule appointment
   */
  rescheduleAppointment: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        veterinarianId: z.number(),
        veterinarianEmail: z.string().email(),
        eventId: z.string(),
        newStartTime: z.date(),
        newEndTime: z.date(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Mock implementation - in production would call veterinarianCalendarService.rescheduleAppointment
        return {
          success: true,
          eventId: input.eventId,
          newStartTime: input.newStartTime,
          newEndTime: input.newEndTime,
          notificationSent: true,
        };
      } catch (error) {
        console.error('Failed to reschedule appointment:', error);
        throw new Error('Failed to reschedule appointment');
      }
    }),

  /**
   * Get next available slot
   */
  getNextAvailableSlot: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        veterinarianId: z.number(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        // Mock implementation - in production would call veterinarianCalendarService.getNextAvailableSlot
        const nextSlot = new Date();
        nextSlot.setDate(nextSlot.getDate() + 1);
        nextSlot.setHours(9, 0, 0, 0);

        const endSlot = new Date(nextSlot);
        endSlot.setMinutes(endSlot.getMinutes() + 30);

        return {
          startTime: nextSlot,
          endTime: endSlot,
          available: true,
        };
      } catch (error) {
        console.error('Failed to get next available slot:', error);
        throw new Error('Failed to get next available slot');
      }
    }),

  /**
   * Get veterinarian working hours
   */
  getVeterinarianWorkingHours: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        veterinarianId: z.number(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        // Mock implementation
        return {
          veterinarianId: input.veterinarianId,
          workingHours: {
            monday: { start: '08:00', end: '17:00', available: true },
            tuesday: { start: '08:00', end: '17:00', available: true },
            wednesday: { start: '08:00', end: '17:00', available: true },
            thursday: { start: '08:00', end: '17:00', available: true },
            friday: { start: '08:00', end: '17:00', available: true },
            saturday: { start: '09:00', end: '13:00', available: true },
            sunday: { start: '00:00', end: '00:00', available: false },
          },
          timezone: 'Africa/Accra',
        };
      } catch (error) {
        console.error('Failed to get veterinarian working hours:', error);
        throw new Error('Failed to get veterinarian working hours');
      }
    }),

  /**
   * Sync calendar with Google Calendar
   */
  syncCalendarWithGoogle: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        veterinarianId: z.number(),
        veterinarianEmail: z.string().email(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Mock implementation - in production would call veterinarianCalendarService.syncVeterinarianAvailability
        return {
          success: true,
          syncedAt: new Date(),
          slotsGenerated: 120,
          veterinarianEmail: input.veterinarianEmail,
        };
      } catch (error) {
        console.error('Failed to sync calendar:', error);
        throw new Error('Failed to sync calendar');
      }
    }),
});
