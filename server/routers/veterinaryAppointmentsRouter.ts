import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { db } from '../db';

/**
 * Veterinary Appointments Router
 * Handles appointment scheduling, management, and tracking
 */
export const veterinaryAppointmentsRouter = router({
  /**
   * List all appointments for a farm with filtering
   */
  list: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        status: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        limit: z.number().default(10),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      const query = `
        SELECT 
          va.id,
          va.farmId,
          va.animalId,
          va.veterinarianId,
          va.appointmentDate,
          va.appointmentType,
          va.status,
          va.reason,
          va.notes,
          va.cost,
          va.currency,
          va.createdAt,
          a.name as animalName,
          a.type as animalType,
          a.breed as animalBreed
        FROM veterinary_appointments va
        LEFT JOIN animals a ON va.animalId = a.id
        WHERE va.farmId = ?
        ${input.status ? 'AND va.status = ?' : ''}
        ${input.startDate ? 'AND DATE(va.appointmentDate) >= ?' : ''}
        ${input.endDate ? 'AND DATE(va.appointmentDate) <= ?' : ''}
        ORDER BY va.appointmentDate DESC
        LIMIT ? OFFSET ?
      `;

      const params: any[] = [input.farmId];
      if (input.status) params.push(input.status);
      if (input.startDate) params.push(input.startDate);
      if (input.endDate) params.push(input.endDate);
      params.push(input.limit, input.offset);

      const appointments = await db.raw(query, params);
      return appointments || [];
    }),

  /**
   * Get single appointment details
   */
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const query = `
        SELECT 
          va.*,
          a.name as animalName,
          a.type as animalType,
          a.breed as animalBreed,
          a.weight,
          a.healthStatus
        FROM veterinary_appointments va
        LEFT JOIN animals a ON va.animalId = a.id
        WHERE va.id = ?
      `;

      const [appointment] = await db.raw(query, [input.id]);
      return appointment || null;
    }),

  /**
   * Create new appointment
   */
  create: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        animalId: z.number(),
        veterinarianId: z.number(),
        appointmentDate: z.string(),
        appointmentType: z.string(),
        reason: z.string().optional(),
        notes: z.string().optional(),
        cost: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const query = `
        INSERT INTO veterinary_appointments 
        (farmId, animalId, veterinarianId, appointmentDate, appointmentType, reason, notes, cost, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'scheduled')
      `;

      const params = [
        input.farmId,
        input.animalId,
        input.veterinarianId,
        input.appointmentDate,
        input.appointmentType,
        input.reason || null,
        input.notes || null,
        input.cost || null,
      ];

      const result = await db.raw(query, params);
      return {
        id: result.insertId,
        ...input,
        status: 'scheduled',
        createdAt: new Date().toISOString(),
      };
    }),

  /**
   * Update appointment
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        appointmentDate: z.string().optional(),
        status: z.string().optional(),
        notes: z.string().optional(),
        cost: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const updates: string[] = [];
      const params: any[] = [];

      if (input.appointmentDate) {
        updates.push('appointmentDate = ?');
        params.push(input.appointmentDate);
      }
      if (input.status) {
        updates.push('status = ?');
        params.push(input.status);
      }
      if (input.notes) {
        updates.push('notes = ?');
        params.push(input.notes);
      }
      if (input.cost) {
        updates.push('cost = ?');
        params.push(input.cost);
      }

      if (updates.length === 0) {
        return { success: false, message: 'No updates provided' };
      }

      params.push(input.id);
      const query = `UPDATE veterinary_appointments SET ${updates.join(', ')} WHERE id = ?`;

      await db.raw(query, params);
      return { success: true, message: 'Appointment updated' };
    }),

  /**
   * Cancel appointment
   */
  cancel: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const query = `
        UPDATE veterinary_appointments 
        SET status = 'cancelled', notes = CONCAT(COALESCE(notes, ''), '\nCancellation reason: ', ?)
        WHERE id = ?
      `;

      await db.raw(query, [input.reason || 'No reason provided', input.id]);
      return { success: true, message: 'Appointment cancelled' };
    }),

  /**
   * Reschedule appointment
   */
  reschedule: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        newDate: z.string(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const query = `
        UPDATE veterinary_appointments 
        SET appointmentDate = ?, status = 'rescheduled', notes = CONCAT(COALESCE(notes, ''), '\nRescheduled reason: ', ?)
        WHERE id = ?
      `;

      await db.raw(query, [input.newDate, input.reason || 'No reason provided', input.id]);
      return { success: true, message: 'Appointment rescheduled', newDate: input.newDate };
    }),

  /**
   * Get appointments for a specific veterinarian
   */
  getByVeterinarian: protectedProcedure
    .input(
      z.object({
        veterinarianId: z.number(),
        date: z.string().optional(),
        limit: z.number().default(20),
      })
    )
    .query(async ({ input }) => {
      const query = `
        SELECT 
          va.*,
          a.name as animalName,
          a.type as animalType,
          f.name as farmName
        FROM veterinary_appointments va
        LEFT JOIN animals a ON va.animalId = a.id
        LEFT JOIN farms f ON va.farmId = f.id
        WHERE va.veterinarianId = ?
        ${input.date ? 'AND DATE(va.appointmentDate) = ?' : ''}
        AND va.status != 'cancelled'
        ORDER BY va.appointmentDate ASC
        LIMIT ?
      `;

      const params: any[] = [input.veterinarianId];
      if (input.date) params.push(input.date);
      params.push(input.limit);

      const appointments = await db.raw(query, params);
      return appointments || [];
    }),

  /**
   * Get appointments for a specific animal
   */
  getByAnimal: protectedProcedure
    .input(z.object({ animalId: z.number() }))
    .query(async ({ input }) => {
      const query = `
        SELECT 
          va.*,
          f.name as farmName
        FROM veterinary_appointments va
        LEFT JOIN farms f ON va.farmId = f.id
        WHERE va.animalId = ?
        ORDER BY va.appointmentDate DESC
      `;

      const appointments = await db.raw(query, [input.animalId]);
      return appointments || [];
    }),

  /**
   * Get upcoming appointments for a farm
   */
  getUpcoming: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        days: z.number().default(30),
      })
    )
    .query(async ({ input }) => {
      const query = `
        SELECT 
          va.*,
          a.name as animalName,
          a.type as animalType
        FROM veterinary_appointments va
        LEFT JOIN animals a ON va.animalId = a.id
        WHERE va.farmId = ?
        AND va.status = 'scheduled'
        AND va.appointmentDate BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL ? DAY)
        ORDER BY va.appointmentDate ASC
      `;

      const appointments = await db.raw(query, [input.farmId, input.days]);
      return appointments || [];
    }),

  /**
   * Get appointment statistics for a farm
   */
  getStatistics: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ input }) => {
      const query = `
        SELECT 
          COUNT(*) as totalAppointments,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completedAppointments,
          SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) as scheduledAppointments,
          SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelledAppointments,
          COALESCE(SUM(CASE WHEN status = 'completed' THEN cost ELSE 0 END), 0) as totalCost,
          AVG(CASE WHEN status = 'completed' THEN cost ELSE NULL END) as averageCost
        FROM veterinary_appointments
        WHERE farmId = ?
      `;

      const [stats] = await db.raw(query, [input.farmId]);
      return stats || {
        totalAppointments: 0,
        completedAppointments: 0,
        scheduledAppointments: 0,
        cancelledAppointments: 0,
        totalCost: 0,
        averageCost: 0,
      };
    }),

  /**
   * Add appointment notes
   */
  addNotes: protectedProcedure
    .input(
      z.object({
        appointmentId: z.number(),
        noteType: z.string(),
        content: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const query = `
        INSERT INTO appointment_notes (appointmentId, noteType, content)
        VALUES (?, ?, ?)
      `;

      const result = await db.raw(query, [input.appointmentId, input.noteType, input.content]);
      return {
        id: result.insertId,
        ...input,
        createdAt: new Date().toISOString(),
      };
    }),

  /**
   * Get appointment notes
   */
  getNotes: protectedProcedure
    .input(z.object({ appointmentId: z.number() }))
    .query(async ({ input }) => {
      const query = `
        SELECT * FROM appointment_notes
        WHERE appointmentId = ?
        ORDER BY createdAt DESC
      `;

      const notes = await db.raw(query, [input.appointmentId]);
      return notes || [];
    }),
});
