import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { sql } from "drizzle-orm";

export const vetAppointmentsRouter = router({
  // Create appointment
  createAppointment: protectedProcedure
    .input(
      z.object({
        animalId: z.number(),
        appointmentDate: z.string(),
        appointmentTime: z.string(),
        veterinarian: z.string(),
        clinic: z.string().optional(),
        reason: z.string(),
        notes: z.string().optional(),
        status: z.enum(["scheduled", "completed", "cancelled"]).default("scheduled"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const result = await db.execute(
        sql`
          INSERT INTO vetAppointments (animalId, appointmentDate, appointmentTime, veterinarian, clinic, reason, notes, status, createdAt)
          VALUES (${input.animalId}, ${input.appointmentDate}, ${input.appointmentTime}, ${input.veterinarian}, ${input.clinic || null}, ${input.reason}, ${input.notes || null}, ${input.status}, NOW())
        `
      );

      return { id: (result as any).insertId, ...input };
    }),

  // Get appointments for animal
  getAnimalAppointments: protectedProcedure
    .input(z.object({ animalId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const appointments = await db.execute(
        sql`
          SELECT id, animalId, appointmentDate, appointmentTime, veterinarian, clinic, reason, notes, status, createdAt
          FROM vetAppointments
          WHERE animalId = ${input.animalId}
          ORDER BY appointmentDate DESC
        `
      );

      return (appointments as any).rows || [];
    }),

  // Get upcoming appointments
  getUpcomingAppointments: protectedProcedure
    .input(z.object({ farmId: z.number().optional(), days: z.number().default(30) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const farmId = input.farmId || 1;

      const appointments = await db.execute(
        sql`
          SELECT 
            v.id, v.animalId, a.tagId, a.breed, v.appointmentDate, v.appointmentTime, 
            v.veterinarian, v.clinic, v.reason, v.status
          FROM vetAppointments v
          JOIN animals a ON v.animalId = a.id
          WHERE a.farmId = ${farmId} AND v.status = 'scheduled' 
            AND v.appointmentDate BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ${input.days} DAY)
          ORDER BY v.appointmentDate ASC, v.appointmentTime ASC
        `
      );

      return (appointments as any).rows || [];
    }),

  // Update appointment
  updateAppointment: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        appointmentDate: z.string().optional(),
        appointmentTime: z.string().optional(),
        veterinarian: z.string().optional(),
        clinic: z.string().optional(),
        reason: z.string().optional(),
        notes: z.string().optional(),
        status: z.enum(["scheduled", "completed", "cancelled"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const updates: string[] = [];
      const values: any[] = [];

      if (input.appointmentDate) {
        updates.push("appointmentDate = ?");
        values.push(input.appointmentDate);
      }
      if (input.appointmentTime) {
        updates.push("appointmentTime = ?");
        values.push(input.appointmentTime);
      }
      if (input.veterinarian) {
        updates.push("veterinarian = ?");
        values.push(input.veterinarian);
      }
      if (input.clinic) {
        updates.push("clinic = ?");
        values.push(input.clinic);
      }
      if (input.reason) {
        updates.push("reason = ?");
        values.push(input.reason);
      }
      if (input.notes) {
        updates.push("notes = ?");
        values.push(input.notes);
      }
      if (input.status) {
        updates.push("status = ?");
        values.push(input.status);
      }

      if (updates.length === 0) return { success: false };

      values.push(input.id);

      await db.execute(
        sql`
          UPDATE vetAppointments
          SET ${sql.raw(updates.join(", "))}
          WHERE id = ?
        `,
        values
      );

      return { success: true };
    }),

  // Cancel appointment
  cancelAppointment: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      await db.execute(
        sql`
          UPDATE vetAppointments
          SET status = 'cancelled'
          WHERE id = ${input.id}
        `
      );

      return { success: true };
    }),

  // Get appointment statistics
  getAppointmentStats: protectedProcedure
    .input(z.object({ farmId: z.number().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const farmId = input.farmId || 1;

      const stats = await db.execute(
        sql`
          SELECT 
            status,
            COUNT(*) as count,
            COUNT(DISTINCT animalId) as uniqueAnimals
          FROM vetAppointments v
          JOIN animals a ON v.animalId = a.id
          WHERE a.farmId = ${farmId}
          GROUP BY status
        `
      );

      return (stats as any).rows || [];
    }),

  // Get appointment reminders (due in next 3 days)
  getAppointmentReminders: protectedProcedure
    .input(z.object({ farmId: z.number().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const farmId = input.farmId || 1;

      const reminders = await db.execute(
        sql`
          SELECT 
            v.id, v.animalId, a.tagId, a.breed, v.appointmentDate, v.appointmentTime, 
            v.veterinarian, v.clinic, v.reason,
            DATEDIFF(v.appointmentDate, CURDATE()) as daysUntil
          FROM vetAppointments v
          JOIN animals a ON v.animalId = a.id
          WHERE a.farmId = ${farmId} AND v.status = 'scheduled'
            AND v.appointmentDate BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 3 DAY)
          ORDER BY v.appointmentDate ASC
        `
      );

      return (reminders as any).rows || [];
    }),

  // Get all appointments for a farm
  getAppointmentsByFarm: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const appointments = await db.execute(
        sql`
          SELECT 
            v.id, v.farmId, v.animalId, a.uniqueTagId, a.breed, v.appointmentDate, v.appointmentTime, 
            v.veterinarian, v.clinic, v.reason, v.notes, v.status, v.cost,
            v.appointmentType, v.duration, v.diagnosis, v.treatment, v.recommendations
          FROM vetAppointments v
          LEFT JOIN animals a ON v.animalId = a.id
          WHERE v.farmId = ${input.farmId}
          ORDER BY v.appointmentDate DESC
        `
      );

      return (appointments as any).rows || [];
    }),
});
