import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { db } from '../db';

/**
 * Prescriptions Router
 * Handles prescription management, tracking, and renewals
 */
export const prescriptionsRouter = router({
  /**
   * List all prescriptions for a farm
   */
  list: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        status: z.string().optional(),
        limit: z.number().default(10),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      const query = `
        SELECT 
          p.id,
          p.appointmentId,
          p.animalId,
          p.veterinarianId,
          p.farmId,
          p.prescriptionDate,
          p.expiryDate,
          p.status,
          p.notes,
          p.totalCost,
          p.currency,
          p.createdAt,
          a.name as animalName,
          a.type as animalType,
          a.breed as animalBreed
        FROM prescriptions p
        LEFT JOIN animals a ON p.animalId = a.id
        WHERE p.farmId = ?
        ${input.status ? 'AND p.status = ?' : ''}
        ORDER BY p.expiryDate ASC
        LIMIT ? OFFSET ?
      `;

      const params: any[] = [input.farmId];
      if (input.status) params.push(input.status);
      params.push(input.limit, input.offset);

      const prescriptions = await db.raw(query, params);
      return prescriptions || [];
    }),

  /**
   * Get single prescription with items
   */
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const query = `
        SELECT 
          p.*,
          a.name as animalName,
          a.type as animalType,
          a.breed as animalBreed,
          a.weight
        FROM prescriptions p
        LEFT JOIN animals a ON p.animalId = a.id
        WHERE p.id = ?
      `;

      const [prescription] = await db.raw(query, [input.id]);

      if (!prescription) return null;

      // Get prescription items
      const itemsQuery = `
        SELECT * FROM prescription_items
        WHERE prescriptionId = ?
        ORDER BY createdAt ASC
      `;
      const items = await db.raw(itemsQuery, [input.id]);

      return {
        ...prescription,
        items: items || [],
      };
    }),

  /**
   * Create new prescription
   */
  create: protectedProcedure
    .input(
      z.object({
        appointmentId: z.number().optional(),
        animalId: z.number(),
        veterinarianId: z.number(),
        farmId: z.number(),
        prescriptionDate: z.string(),
        expiryDate: z.string(),
        notes: z.string().optional(),
        totalCost: z.string().optional(),
        items: z
          .array(
            z.object({
              drugName: z.string(),
              dosage: z.string(),
              frequency: z.string(),
              duration: z.string(),
              quantity: z.number(),
              unit: z.string(),
              instructions: z.string().optional(),
              cost: z.string().optional(),
            })
          )
          .optional(),
      })
    )
    .mutation(async ({ input }) => {
      const query = `
        INSERT INTO prescriptions 
        (appointmentId, animalId, veterinarianId, farmId, prescriptionDate, expiryDate, notes, totalCost, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')
      `;

      const params = [
        input.appointmentId || null,
        input.animalId,
        input.veterinarianId,
        input.farmId,
        input.prescriptionDate,
        input.expiryDate,
        input.notes || null,
        input.totalCost || null,
      ];

      const result = await db.raw(query, params);
      const prescriptionId = result.insertId;

      // Add prescription items if provided
      if (input.items && input.items.length > 0) {
        for (const item of input.items) {
          const itemQuery = `
            INSERT INTO prescription_items 
            (prescriptionId, drugName, dosage, frequency, duration, quantity, unit, instructions, cost)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;
          await db.raw(itemQuery, [
            prescriptionId,
            item.drugName,
            item.dosage,
            item.frequency,
            item.duration,
            item.quantity,
            item.unit,
            item.instructions || null,
            item.cost || null,
          ]);
        }
      }

      return {
        id: prescriptionId,
        ...input,
        status: 'active',
        createdAt: new Date().toISOString(),
      };
    }),

  /**
   * Update prescription
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.string().optional(),
        expiryDate: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const updates: string[] = [];
      const params: any[] = [];

      if (input.status) {
        updates.push('status = ?');
        params.push(input.status);
      }
      if (input.expiryDate) {
        updates.push('expiryDate = ?');
        params.push(input.expiryDate);
      }
      if (input.notes) {
        updates.push('notes = ?');
        params.push(input.notes);
      }

      if (updates.length === 0) {
        return { success: false, message: 'No updates provided' };
      }

      params.push(input.id);
      const query = `UPDATE prescriptions SET ${updates.join(', ')} WHERE id = ?`;

      await db.raw(query, params);
      return { success: true, message: 'Prescription updated' };
    }),

  /**
   * Get expiring prescriptions
   */
  getExpiring: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        daysUntilExpiry: z.number().default(30),
      })
    )
    .query(async ({ input }) => {
      const query = `
        SELECT 
          p.*,
          a.name as animalName,
          a.type as animalType,
          DATEDIFF(p.expiryDate, CURDATE()) as daysUntilExpiry
        FROM prescriptions p
        LEFT JOIN animals a ON p.animalId = a.id
        WHERE p.farmId = ?
        AND p.status = 'active'
        AND p.expiryDate BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)
        ORDER BY p.expiryDate ASC
      `;

      const prescriptions = await db.raw(query, [input.farmId, input.daysUntilExpiry]);
      return prescriptions || [];
    }),

  /**
   * Get expired prescriptions
   */
  getExpired: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ input }) => {
      const query = `
        SELECT 
          p.*,
          a.name as animalName,
          a.type as animalType
        FROM prescriptions p
        LEFT JOIN animals a ON p.animalId = a.id
        WHERE p.farmId = ?
        AND (p.status = 'expired' OR (p.status = 'active' AND p.expiryDate < CURDATE()))
        ORDER BY p.expiryDate DESC
      `;

      const prescriptions = await db.raw(query, [input.farmId]);
      return prescriptions || [];
    }),

  /**
   * Get prescriptions for a specific animal
   */
  getByAnimal: protectedProcedure
    .input(z.object({ animalId: z.number() }))
    .query(async ({ input }) => {
      const query = `
        SELECT 
          p.*,
          f.name as farmName
        FROM prescriptions p
        LEFT JOIN farms f ON p.farmId = f.id
        WHERE p.animalId = ?
        ORDER BY p.prescriptionDate DESC
      `;

      const prescriptions = await db.raw(query, [input.animalId]);
      return prescriptions || [];
    }),

  /**
   * Request prescription renewal
   */
  requestRenewal: protectedProcedure
    .input(
      z.object({
        prescriptionId: z.number(),
        renewalDate: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const query = `
        INSERT INTO prescription_renewals (prescriptionId, renewalDate, status)
        VALUES (?, ?, 'pending')
      `;

      const result = await db.raw(query, [input.prescriptionId, input.renewalDate]);
      return {
        id: result.insertId,
        ...input,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
    }),

  /**
   * Get pending renewal requests
   */
  getPendingRenewals: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ input }) => {
      const query = `
        SELECT 
          pr.*,
          p.animalId,
          a.name as animalName,
          a.type as animalType
        FROM prescription_renewals pr
        JOIN prescriptions p ON pr.prescriptionId = p.id
        LEFT JOIN animals a ON p.animalId = a.id
        WHERE p.farmId = ?
        AND pr.status = 'pending'
        ORDER BY pr.requestDate ASC
      `;

      const renewals = await db.raw(query, [input.farmId]);
      return renewals || [];
    }),

  /**
   * Approve renewal request
   */
  approveRenewal: protectedProcedure
    .input(
      z.object({
        renewalId: z.number(),
        veterinarianId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const query = `
        UPDATE prescription_renewals 
        SET status = 'approved', approvedBy = ?, approvalDate = NOW()
        WHERE id = ?
      `;

      await db.raw(query, [input.veterinarianId, input.renewalId]);
      return { success: true, message: 'Renewal approved' };
    }),

  /**
   * Reject renewal request
   */
  rejectRenewal: protectedProcedure
    .input(
      z.object({
        renewalId: z.number(),
        reason: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const query = `
        UPDATE prescription_renewals 
        SET status = 'rejected', notes = ?
        WHERE id = ?
      `;

      await db.raw(query, [input.reason, input.renewalId]);
      return { success: true, message: 'Renewal rejected' };
    }),

  /**
   * Get prescription statistics
   */
  getStatistics: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ input }) => {
      const query = `
        SELECT 
          COUNT(*) as totalPrescriptions,
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as activePrescriptions,
          SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) as expiredPrescriptions,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completedPrescriptions,
          COALESCE(SUM(totalCost), 0) as totalCost,
          AVG(totalCost) as averageCost
        FROM prescriptions
        WHERE farmId = ?
      `;

      const [stats] = await db.raw(query, [input.farmId]);
      return stats || {
        totalPrescriptions: 0,
        activePrescriptions: 0,
        expiredPrescriptions: 0,
        completedPrescriptions: 0,
        totalCost: 0,
        averageCost: 0,
      };
    }),

  /**
   * Add prescription item
   */
  addItem: protectedProcedure
    .input(
      z.object({
        prescriptionId: z.number(),
        drugName: z.string(),
        dosage: z.string(),
        frequency: z.string(),
        duration: z.string(),
        quantity: z.number(),
        unit: z.string(),
        instructions: z.string().optional(),
        cost: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const query = `
        INSERT INTO prescription_items 
        (prescriptionId, drugName, dosage, frequency, duration, quantity, unit, instructions, cost)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const result = await db.raw(query, [
        input.prescriptionId,
        input.drugName,
        input.dosage,
        input.frequency,
        input.duration,
        input.quantity,
        input.unit,
        input.instructions || null,
        input.cost || null,
      ]);

      return {
        id: result.insertId,
        ...input,
        createdAt: new Date().toISOString(),
      };
    }),

  /**
   * Get prescription items
   */
  getItems: protectedProcedure
    .input(z.object({ prescriptionId: z.number() }))
    .query(async ({ input }) => {
      const query = `
        SELECT * FROM prescription_items
        WHERE prescriptionId = ?
        ORDER BY createdAt ASC
      `;

      const items = await db.raw(query, [input.prescriptionId]);
      return items || [];
    }),
});
