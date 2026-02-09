import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';

// Define appointment table structure for query
const appointmentSchema = z.object({
  id: z.number().optional(),
  farmId: z.number(),
  animalId: z.number().optional(),
  appointmentType: z.enum(['Consultation', 'Vaccination', 'Treatment', 'Surgery', 'Follow-up']),
  appointmentDate: z.date(),
  appointmentTime: z.string(),
  veterinarian: z.string(),
  reason: z.string(),
  estimatedCost: z.string().optional(),
  status: z.enum(['scheduled', 'completed', 'cancelled', 'rescheduled']).default('scheduled'),
  notes: z.string().optional(),
  createdAt: z.date().optional(),
});

export const veterinaryAppointmentsRouter = router({
  /**
   * List all veterinary appointments for a farm
   */
  list: protectedProcedure
    .input(z.object({
      farmId: z.number(),
      status: z.enum(['scheduled', 'completed', 'cancelled', 'rescheduled']).optional(),
    }))
      .query(async ({ input }) => {
      try {
        // Mock data - replace with actual database query
        const appointments = [
          {
            id: 1,
            farmId: input.farmId,
            animalId: 1,
            animalName: 'Bessie',
            animalType: 'Cattle',
            appointmentType: 'Vaccination',
            appointmentDate: new Date('2024-02-15'),
            appointmentTime: '10:00',
            veterinarian: 'Dr. Kwame Asante',
            reason: 'Annual vaccination',
            estimatedCost: '250',
            status: input.status || 'scheduled',
            notes: 'Routine vaccination',
            createdAt: new Date(),
          },
          {
            id: 2,
            farmId: input.farmId,
            animalId: 2,
            animalName: 'Daisy',
            animalType: 'Cattle',
            appointmentType: 'Consultation',
            appointmentDate: new Date('2024-02-16'),
            appointmentTime: '14:00',
            veterinarian: 'Dr. Ama Boateng',
            reason: 'Health check',
            estimatedCost: '150',
            status: input.status || 'scheduled',
            notes: 'General health assessment',
            createdAt: new Date(),
          },
        ];

        return appointments;
      } catch (error) {
        console.error('Error listing appointments:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch appointments',
        });
      }
    }),

  /**
   * Get a single appointment by ID
   */
  getById: protectedProcedure
    .input(z.number())
    .query(async ({ input }) => {
      try {
        // Mock data
        const appointments: Record<number, any> = {
          1: {
            id: 1,
            farmId: 1,
            animalId: 1,
            animalName: 'Bessie',
            appointmentType: 'Vaccination',
            appointmentDate: new Date('2024-02-15'),
            appointmentTime: '10:00',
            veterinarian: 'Dr. Kwame Asante',
            reason: 'Annual vaccination',
            estimatedCost: '250',
            status: 'scheduled',
            notes: 'Routine vaccination',
          },
        };

        const appointment = appointments[input];
        if (!appointment) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Appointment not found',
          });
        }

        return appointment;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch appointment',
        });
      }
    }),

  /**
   * Create a new veterinary appointment
   */
  create: protectedProcedure
    .input(appointmentSchema.omit({ id: true, createdAt: true }))
    .mutation(async ({ input }) => {
      try {
        // Validate input
        if (!input.farmId || !input.appointmentDate || !input.veterinarian) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Missing required fields',
          });
        }

        // Mock creation - replace with actual database insert
        const newAppointment = {
          id: Math.floor(Math.random() * 10000),
          ...input,
          createdAt: new Date(),
        };

        return newAppointment;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error('Error creating appointment:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create appointment',
        });
      }
    }),

  /**
   * Update an existing appointment
   */
  update: protectedProcedure
    .input(appointmentSchema)
    .mutation(async ({ input }) => {
      try {
        if (!input.id) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Appointment ID is required',
          });
        }

        // Mock update - replace with actual database update
        return {
          ...input,
          updatedAt: new Date(),
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error('Error updating appointment:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update appointment',
        });
      }
    }),

  /**
   * Delete an appointment
   */
  delete: protectedProcedure
    .input(z.number())
    .mutation(async ({ input }) => {
      try {
        // Mock delete - replace with actual database delete
        return { success: true, id: input };
      } catch (error) {
        console.error('Error deleting appointment:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete appointment',
        });
      }
    }),

  /**
   * Reschedule an appointment
   */
  reschedule: protectedProcedure
    .input(z.object({
      id: z.number(),
      newDate: z.date(),
      newTime: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        // Mock reschedule - replace with actual database update
        return {
          id: input.id,
          appointmentDate: input.newDate,
          appointmentTime: input.newTime,
          status: 'rescheduled',
          updatedAt: new Date(),
        };
      } catch (error) {
        console.error('Error rescheduling appointment:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to reschedule appointment',
        });
      }
    }),

  /**
   * Cancel an appointment
   */
  cancel: protectedProcedure
    .input(z.object({
      id: z.number(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        // Mock cancel - replace with actual database update
        return {
          id: input.id,
          status: 'cancelled',
          cancellationReason: input.reason,
          updatedAt: new Date(),
        };
      } catch (error) {
        console.error('Error cancelling appointment:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to cancel appointment',
        });
      }
    }),

  /**
   * Get appointments for a specific date range
   */
  getByDateRange: protectedProcedure
    .input(z.object({
      farmId: z.number(),
      startDate: z.date(),
      endDate: z.date(),
    }))
    .query(async ({ input }) => {
      try {
        // Mock data - replace with actual database query
        const appointments = [
          {
            id: 1,
            farmId: input.farmId,
            appointmentDate: input.startDate,
            appointmentTime: '10:00',
            veterinarian: 'Dr. Kwame Asante',
            status: 'scheduled',
          },
        ];

        return appointments;
      } catch (error) {
        console.error('Error fetching appointments by date range:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch appointments',
        });
      }
    }),

  /**
   * Get appointment statistics
   */
  getStatistics: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ input }) => {
      try {
        // Mock statistics
        return {
          totalAppointments: 12,
          scheduledAppointments: 5,
          completedAppointments: 6,
          cancelledAppointments: 1,
          averageCost: 225,
          upcomingAppointments: 5,
        };
      } catch (error) {
        console.error('Error fetching appointment statistics:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch statistics',
        });
      }
    }),
});
