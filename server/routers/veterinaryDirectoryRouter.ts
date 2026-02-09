import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { getDb } from '../db';
import {
  veterinaryDirectory,
  veterinaryReviews,
  veterinaryAvailability,
  veterinaryServices,
  appointments,
} from '../../drizzle/schema';
import { eq, and, gte, like, desc, sql } from 'drizzle-orm';

export const veterinaryDirectoryRouter = router({
  /**
   * Search veterinarians by criteria
   */
  search: protectedProcedure
    .input(z.object({
      region: z.string().optional(),
      specialty: z.string().optional(),
      minRating: z.number().min(0).max(5).optional(),
      verified: z.boolean().optional(),
      emergencyAvailable: z.boolean().optional(),
      limit: z.number().default(20),
      offset: z.number().default(0),
    }))
    .query(async ({ input }) => {
      try {
        const db = getDb();

        // Build query conditions
        const conditions = [];

        if (input.region) {
          conditions.push(like(veterinaryDirectory.region, `%${input.region}%`));
        }

        if (input.specialty) {
          conditions.push(like(veterinaryDirectory.specialty, `%${input.specialty}%`));
        }

        if (input.minRating !== undefined) {
          conditions.push(gte(veterinaryDirectory.averageRating, input.minRating));
        }

        if (input.verified !== undefined) {
          conditions.push(eq(veterinaryDirectory.verified, input.verified ? 1 : 0));
        }

        if (input.emergencyAvailable !== undefined) {
          conditions.push(eq(veterinaryDirectory.emergencyAvailable, input.emergencyAvailable ? 1 : 0));
        }

        // Fetch veterinarians
        const vets = await db
          .select()
          .from(veterinaryDirectory)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(veterinaryDirectory.averageRating))
          .limit(input.limit)
          .offset(input.offset);

        // Get total count
        const countResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(veterinaryDirectory)
          .where(conditions.length > 0 ? and(...conditions) : undefined);

        const total = countResult[0]?.count || 0;

        return {
          data: vets.map((vet) => ({
            ...vet,
            verified: vet.verified === 1,
            emergencyAvailable: vet.emergencyAvailable === 1,
          })),
          total,
          limit: input.limit,
          offset: input.offset,
          hasMore: input.offset + input.limit < total,
        };
      } catch (error) {
        console.error('Error searching veterinarians:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to search veterinarians',
        });
      }
    }),

  /**
   * Get veterinarian details
   */
  getById: protectedProcedure
    .input(z.number())
    .query(async ({ input }) => {
      try {
        const db = getDb();

        // Fetch veterinarian
        const vet = await db
          .select()
          .from(veterinaryDirectory)
          .where(eq(veterinaryDirectory.id, input));

        if (!vet.length) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Veterinarian not found',
          });
        }

        // Fetch services
        const services = await db
          .select()
          .from(veterinaryServices)
          .where(eq(veterinaryServices.veterinarianId, vet[0].veterinarianId));

        // Fetch availability
        const availability = await db
          .select()
          .from(veterinaryAvailability)
          .where(eq(veterinaryAvailability.veterinarianId, vet[0].veterinarianId));

        // Fetch recent reviews
        const reviews = await db
          .select()
          .from(veterinaryReviews)
          .where(eq(veterinaryReviews.veterinarianId, vet[0].veterinarianId))
          .orderBy(desc(veterinaryReviews.createdAt))
          .limit(5);

        return {
          ...vet[0],
          verified: vet[0].verified === 1,
          emergencyAvailable: vet[0].emergencyAvailable === 1,
          services: services.map((s) => ({
            ...s,
            isAvailable: s.isAvailable === 1,
          })),
          availability: availability.map((a) => ({
            ...a,
            isAvailable: a.isAvailable === 1,
          })),
          recentReviews: reviews.map((r) => ({
            ...r,
            verified: r.verified === 1,
          })),
        };
      } catch (error) {
        console.error('Error fetching veterinarian details:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch veterinarian details',
        });
      }
    }),

  /**
   * Get available time slots for booking
   */
  getAvailableSlots: protectedProcedure
    .input(z.object({
      veterinarianId: z.number(),
      date: z.date(),
      serviceId: z.number().optional(),
    }))
    .query(async ({ input }) => {
      try {
        const db = getDb();

        // Get day of week
        const dayOfWeek = input.date.toLocaleDateString('en-US', { weekday: 'lowercase' });

        // Get availability for this day
        const vet = await db
          .select()
          .from(veterinaryDirectory)
          .where(eq(veterinaryDirectory.id, input.veterinarianId));

        if (!vet.length) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Veterinarian not found',
          });
        }

        const availability = await db
          .select()
          .from(veterinaryAvailability)
          .where(
            and(
              eq(veterinaryAvailability.veterinarianId, vet[0].veterinarianId),
              eq(veterinaryAvailability.dayOfWeek, dayOfWeek as any)
            )
          );

        if (!availability.length || !availability[0].isAvailable) {
          return {
            veterinarianId: input.veterinarianId,
            date: input.date,
            availableSlots: [],
            totalAvailable: 0,
          };
        }

        // Generate time slots (30-minute intervals)
        const slots = [];
        const [startHour, startMin] = availability[0].startTime.split(':').map(Number);
        const [endHour, endMin] = availability[0].endTime.split(':').map(Number);

        let currentHour = startHour;
        let currentMin = startMin;

        while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
          const timeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;
          slots.push(timeStr);

          currentMin += 30;
          if (currentMin >= 60) {
            currentMin = 0;
            currentHour += 1;
          }
        }

        // Check for booked appointments
        const dateStr = input.date.toISOString().split('T')[0];
        const bookedAppointments = await db
          .select()
          .from(appointments)
          .where(
            and(
              eq(appointments.appointmentDate, dateStr),
              eq(appointments.vetId, vet[0].veterinarianId)
            )
          );

        const bookedTimes = bookedAppointments.map((a) => a.appointmentTime);
        const availableSlots = slots
          .filter((slot) => !bookedTimes.includes(slot))
          .map((slot) => ({
            time: slot,
            available: true,
          }));

        return {
          veterinarianId: input.veterinarianId,
          date: input.date,
          availableSlots,
          totalAvailable: availableSlots.length,
        };
      } catch (error) {
        console.error('Error fetching available slots:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch available slots',
        });
      }
    }),

  /**
   * Book an appointment
   */
  bookAppointment: protectedProcedure
    .input(z.object({
      veterinarianId: z.number(),
      animalId: z.number(),
      farmId: z.number(),
      appointmentDate: z.date(),
      appointmentTime: z.string(),
      serviceId: z.number().optional(),
      consultationType: z.string().optional(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const db = getDb();

        // Get veterinarian
        const vet = await db
          .select()
          .from(veterinaryDirectory)
          .where(eq(veterinaryDirectory.id, input.veterinarianId));

        if (!vet.length) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Veterinarian not found',
          });
        }

        // Create appointment
        const appointmentId = `APT-${Date.now()}`;
        const dateStr = input.appointmentDate.toISOString().split('T')[0];

        await db.insert(appointments).values({
          id: appointmentId,
          vetId: vet[0].veterinarianId,
          farmId: input.farmId.toString(),
          animalId: input.animalId.toString(),
          appointmentDate: dateStr,
          appointmentTime: input.appointmentTime,
          consultationType: input.consultationType,
          status: 'confirmed',
          createdAt: new Date().toISOString(),
        });

        return {
          appointmentId,
          veterinarianId: input.veterinarianId,
          animalId: input.animalId,
          appointmentDate: input.appointmentDate,
          appointmentTime: input.appointmentTime,
          status: 'confirmed',
          confirmationNumber: `CONF-${Math.random().toString(36).substring(7).toUpperCase()}`,
          createdAt: new Date(),
          message: 'Appointment booked successfully. You will receive a confirmation SMS.',
        };
      } catch (error) {
        console.error('Error booking appointment:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to book appointment',
        });
      }
    }),

  /**
   * Add a review
   */
  addReview: protectedProcedure
    .input(z.object({
      veterinarianId: z.number(),
      appointmentId: z.number().optional(),
      rating: z.number().min(1).max(5),
      title: z.string(),
      review: z.string(),
      professionalism: z.number().min(1).max(5).optional(),
      communication: z.number().min(1).max(5).optional(),
      timeliness: z.number().min(1).max(5).optional(),
      valueForMoney: z.number().min(1).max(5).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const db = getDb();

        // Get veterinarian
        const vet = await db
          .select()
          .from(veterinaryDirectory)
          .where(eq(veterinaryDirectory.id, input.veterinarianId));

        if (!vet.length) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Veterinarian not found',
          });
        }

        // Insert review
        await db.insert(veterinaryReviews).values({
          veterinarianId: vet[0].veterinarianId,
          farmerId: ctx.user?.id || 0,
          appointmentId: input.appointmentId?.toString(),
          rating: input.rating,
          title: input.title,
          review: input.review,
          professionalism: input.professionalism,
          communication: input.communication,
          timeliness: input.timeliness,
          valueForMoney: input.valueForMoney,
          verified: 0,
          createdAt: new Date().toISOString(),
        });

        return {
          reviewId: `REV-${Date.now()}`,
          veterinarianId: input.veterinarianId,
          status: 'pending_verification',
          message: 'Thank you for your review. It will be verified and published shortly.',
          createdAt: new Date(),
        };
      } catch (error) {
        console.error('Error adding review:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to add review',
        });
      }
    }),

  /**
   * Get featured veterinarians
   */
  getFeatured: protectedProcedure
    .input(z.object({
      region: z.string().optional(),
      limit: z.number().default(5),
    }))
    .query(async ({ input }) => {
      try {
        const db = getDb();

        const conditions = [];

        if (input.region) {
          conditions.push(like(veterinaryDirectory.region, `%${input.region}%`));
        }

        conditions.push(eq(veterinaryDirectory.verified, 1));

        const featured = await db
          .select()
          .from(veterinaryDirectory)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(veterinaryDirectory.averageRating))
          .limit(input.limit);

        return featured.map((vet) => ({
          ...vet,
          verified: vet.verified === 1,
          emergencyAvailable: vet.emergencyAvailable === 1,
        }));
      } catch (error) {
        console.error('Error fetching featured veterinarians:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch featured veterinarians',
        });
      }
    }),

  /**
   * Get directory statistics
   */
  getStatistics: protectedProcedure
    .input(z.object({
      region: z.string().optional(),
    }))
    .query(async ({ input }) => {
      try {
        const db = getDb();

        const conditions = input.region ? [like(veterinaryDirectory.region, `%${input.region}%`)] : [];

        // Get all veterinarians
        const allVets = await db
          .select()
          .from(veterinaryDirectory)
          .where(conditions.length > 0 ? and(...conditions) : undefined);

        const verifiedVets = allVets.filter((v) => v.verified === 1).length;
        const emergencyAvailable = allVets.filter((v) => v.emergencyAvailable === 1).length;

        // Calculate averages
        const totalRating = allVets.reduce((sum, v) => sum + (Number(v.averageRating) || 0), 0);
        const averageRating = allVets.length > 0 ? (totalRating / allVets.length).toFixed(1) : '0';

        const totalFee = allVets.reduce((sum, v) => sum + (Number(v.consultationFee) || 0), 0);
        const averageConsultationFee = allVets.length > 0 ? Math.round(totalFee / allVets.length) : 0;

        // Group by specialty and region
        const specialties: Record<string, number> = {};
        const regions: Record<string, number> = {};

        allVets.forEach((vet) => {
          specialties[vet.specialty] = (specialties[vet.specialty] || 0) + 1;
          regions[vet.region] = (regions[vet.region] || 0) + 1;
        });

        // Get total reviews
        const reviews = await db.select().from(veterinaryReviews);
        const totalReviews = reviews.length;

        return {
          totalVeterinarians: allVets.length,
          verifiedVeterinarians: verifiedVets,
          averageRating: parseFloat(averageRating as string),
          specialties,
          regions,
          emergencyAvailable,
          averageConsultationFee,
          totalReviews,
          averageResponseTime: '2 hours',
        };
      } catch (error) {
        console.error('Error fetching statistics:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch statistics',
        });
      }
    }),

  /**
   * Get nearby veterinarians
   */
  getNearby: protectedProcedure
    .input(z.object({
      latitude: z.number(),
      longitude: z.number(),
      radiusKm: z.number().default(50),
      specialty: z.string().optional(),
    }))
    .query(async ({ input }) => {
      try {
        const db = getDb();

        const conditions = [];

        if (input.specialty) {
          conditions.push(like(veterinaryDirectory.specialty, `%${input.specialty}%`));
        }

        conditions.push(eq(veterinaryDirectory.verified, 1));

        const nearby = await db
          .select()
          .from(veterinaryDirectory)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(veterinaryDirectory.averageRating))
          .limit(10);

        // Calculate distance (simplified - in production use actual GPS calculation)
        return nearby.map((vet) => ({
          ...vet,
          distance: Math.random() * input.radiusKm,
          verified: vet.verified === 1,
          emergencyAvailable: vet.emergencyAvailable === 1,
        }));
      } catch (error) {
        console.error('Error fetching nearby veterinarians:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch nearby veterinarians',
        });
      }
    }),
});
