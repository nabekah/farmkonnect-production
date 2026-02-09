import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { and, eq, gte, lte, desc } from "drizzle-orm";
import { vetAppointments, telemedicineSessions } from "../../drizzle/schema";

export const telemedicineManagementRouter = router({
  /**
   * Schedule a telemedicine appointment
   */
  scheduleTelemedicineAppointment: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        veterinarianId: z.number(),
        animalId: z.number().optional(),
        appointmentDate: z.date(),
        duration: z.number().default(30),
        reason: z.string().min(1),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      const [appointmentResult] = await db.insert(vetAppointments).values({
        farmId: input.farmId,
        veterinarianId: input.veterinarianId,
        animalId: input.animalId,
        appointmentType: "telemedicine",
        appointmentDate: input.appointmentDate,
        duration: input.duration,
        status: "scheduled",
        reason: input.reason,
        notes: input.notes,
      });

      return {
        success: true,
        appointmentId: appointmentResult.insertId,
        message: "Telemedicine appointment scheduled",
      };
    }),

  /**
   * Create telemedicine session
   */
  createTelemedicineSession: protectedProcedure
    .input(
      z.object({
        appointmentId: z.number(),
        farmId: z.number(),
        veterinarianId: z.number(),
        platform: z.enum(["zoom", "google_meet", "custom_webrtc"]),
        sessionLink: z.string().url(),
        sessionType: z.enum(["consultation", "follow_up", "emergency"]).default("consultation"),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      const [sessionResult] = await db.insert(telemedicineSessions).values({
        appointmentId: input.appointmentId,
        farmId: input.farmId,
        veterinarianId: input.veterinarianId,
        platform: input.platform,
        sessionLink: input.sessionLink,
        sessionType: input.sessionType,
        status: "scheduled",
      });

      // Update appointment with telemedicine link
      await db
        .update(vetAppointments)
        .set({ telemedicineLink: input.sessionLink })
        .where(eq(vetAppointments.id, input.appointmentId));

      return {
        success: true,
        sessionId: sessionResult.insertId,
        sessionLink: input.sessionLink,
        message: "Telemedicine session created",
      };
    }),

  /**
   * Start telemedicine session
   */
  startTelemedicineSession: protectedProcedure
    .input(z.object({ sessionId: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();

      await db
        .update(telemedicineSessions)
        .set({ status: "in_progress", startTime: new Date() })
        .where(eq(telemedicineSessions.id, input.sessionId));

      return { success: true, message: "Session started" };
    }),

  /**
   * End telemedicine session
   */
  endTelemedicineSession: protectedProcedure
    .input(
      z.object({
        sessionId: z.number(),
        recordingUrl: z.string().optional(),
        transcriptUrl: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      const now = new Date();
      const session = await db
        .select()
        .from(telemedicineSessions)
        .where(eq(telemedicineSessions.id, input.sessionId))
        .limit(1);

      if (!session || session.length === 0) {
        return { error: "Session not found" };
      }

      const s = session[0];
      const duration = s.startTime
        ? Math.floor((now.getTime() - s.startTime.getTime()) / 60000)
        : 0;

      await db
        .update(telemedicineSessions)
        .set({
          status: "completed",
          endTime: now,
          duration,
          recordingUrl: input.recordingUrl,
          transcriptUrl: input.transcriptUrl,
          notes: input.notes,
        })
        .where(eq(telemedicineSessions.id, input.sessionId));

      return { success: true, duration, message: "Session ended" };
    }),

  /**
   * Get upcoming telemedicine appointments
   */
  getUpcomingAppointments: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        daysAhead: z.number().default(30),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();

      const now = new Date();
      const futureDate = new Date(now.getTime() + input.daysAhead * 24 * 60 * 60 * 1000);

      const appointments = await db
        .select()
        .from(vetAppointments)
        .where(
          and(
            eq(vetAppointments.farmId, input.farmId),
            eq(vetAppointments.appointmentType, "telemedicine"),
            gte(vetAppointments.appointmentDate, now),
            lte(vetAppointments.appointmentDate, futureDate)
          )
        )
        .orderBy(vetAppointments.appointmentDate);

      return appointments.map((apt) => ({
        id: apt.id,
        veterinarianId: apt.veterinarianId,
        animalId: apt.animalId,
        appointmentDate: apt.appointmentDate,
        duration: apt.duration,
        status: apt.status,
        reason: apt.reason,
        telemedicineLink: apt.telemedicineLink,
      }));
    }),

  /**
   * Get appointment history
   */
  getAppointmentHistory: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        limit: z.number().default(20),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();

      const appointments = await db
        .select()
        .from(vetAppointments)
        .where(eq(vetAppointments.farmId, input.farmId))
        .orderBy(desc(vetAppointments.appointmentDate))
        .limit(input.limit);

      return appointments.map((apt) => ({
        id: apt.id,
        veterinarianId: apt.veterinarianId,
        animalId: apt.animalId,
        appointmentType: apt.appointmentType,
        appointmentDate: apt.appointmentDate,
        status: apt.status,
        reason: apt.reason,
        diagnosis: apt.diagnosis,
        treatment: apt.treatment,
        recommendations: apt.recommendations,
        cost: apt.cost ? parseFloat(apt.cost.toString()) : 0,
        paymentStatus: apt.paymentStatus,
      }));
    }),

  /**
   * Cancel appointment
   */
  cancelAppointment: protectedProcedure
    .input(
      z.object({
        appointmentId: z.number(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      await db
        .update(vetAppointments)
        .set({ status: "cancelled", notes: input.reason })
        .where(eq(vetAppointments.id, input.appointmentId));

      return { success: true, message: "Appointment cancelled" };
    }),

  /**
   * Reschedule appointment
   */
  rescheduleAppointment: protectedProcedure
    .input(
      z.object({
        appointmentId: z.number(),
        newDate: z.date(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      await db
        .update(vetAppointments)
        .set({ appointmentDate: input.newDate, status: "scheduled" })
        .where(eq(vetAppointments.id, input.appointmentId));

      return { success: true, message: "Appointment rescheduled" };
    }),

  /**
   * Get appointment statistics
   */
  getAppointmentStats: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();

      const appointments = await db
        .select()
        .from(vetAppointments)
        .where(eq(vetAppointments.farmId, input.farmId));

      const completed = appointments.filter((a) => a.status === "completed").length;
      const scheduled = appointments.filter((a) => a.status === "scheduled").length;
      const cancelled = appointments.filter((a) => a.status === "cancelled").length;

      const totalCost = appointments.reduce(
        (sum, a) => sum + (a.cost ? parseFloat(a.cost.toString()) : 0),
        0
      );

      const telemedicineCount = appointments.filter(
        (a) => a.appointmentType === "telemedicine"
      ).length;

      return {
        totalAppointments: appointments.length,
        completedAppointments: completed,
        scheduledAppointments: scheduled,
        cancelledAppointments: cancelled,
        telemedicineAppointments: telemedicineCount,
        totalCost: parseFloat(totalCost.toFixed(2)),
        averageCost:
          appointments.length > 0
            ? parseFloat((totalCost / appointments.length).toFixed(2))
            : 0,
      };
    }),

  /**
   * Get telemedicine session details
   */
  getSessionDetails: protectedProcedure
    .input(z.object({ sessionId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();

      const session = await db
        .select()
        .from(telemedicineSessions)
        .where(eq(telemedicineSessions.id, input.sessionId))
        .limit(1);

      if (!session || session.length === 0) {
        return { error: "Session not found" };
      }

      const s = session[0];

      return {
        id: s.id,
        appointmentId: s.appointmentId,
        platform: s.platform,
        sessionLink: s.sessionLink,
        startTime: s.startTime,
        endTime: s.endTime,
        duration: s.duration,
        status: s.status,
        recordingUrl: s.recordingUrl,
        transcriptUrl: s.transcriptUrl,
        notes: s.notes,
      };
    }),
});
