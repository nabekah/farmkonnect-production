import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { getDb } from '../db';
import { medicationCompliance, medicationComplianceSummary, prescriptions, animals, farms } from '../../drizzle/schema';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';

export const medicationComplianceRouter = router({
  /**
   * Get compliance records for a specific prescription
   */
  getByPrescription: protectedProcedure
    .input(z.object({
      prescriptionId: z.number(),
      status: z.string().optional(),
      limit: z.number().default(50),
      offset: z.number().default(0),
    }))
    .query(async ({ input }) => {
      try {
        const db = getDb();

        // Fetch compliance records
        const records = await db
          .select()
          .from(medicationCompliance)
          .where(
            and(
              eq(medicationCompliance.prescriptionId, input.prescriptionId.toString()),
              input.status ? eq(medicationCompliance.status, input.status as any) : undefined
            )
          )
          .orderBy(desc(medicationCompliance.scheduledDate))
          .limit(input.limit)
          .offset(input.offset);

        // Get total count
        const countResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(medicationCompliance)
          .where(
            and(
              eq(medicationCompliance.prescriptionId, input.prescriptionId.toString()),
              input.status ? eq(medicationCompliance.status, input.status as any) : undefined
            )
          );

        const total = countResult[0]?.count || 0;

        return {
          data: records,
          total,
          limit: input.limit,
          offset: input.offset,
          hasMore: input.offset + input.limit < total,
        };
      } catch (error) {
        console.error('Error fetching compliance records:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch compliance records',
        });
      }
    }),

  /**
   * Record medication administration
   */
  recordAdministration: protectedProcedure
    .input(z.object({
      prescriptionId: z.number(),
      animalId: z.number(),
      farmId: z.number(),
      medicationName: z.string(),
      scheduledDate: z.date(),
      administeredDate: z.date(),
      administeredTime: z.string(),
      dosageGiven: z.string(),
      notes: z.string().optional(),
      sideEffects: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const db = getDb();

        // Insert compliance record
        const result = await db.insert(medicationCompliance).values({
          prescriptionId: input.prescriptionId.toString(),
          animalId: input.animalId,
          farmId: input.farmId,
          medicationName: input.medicationName,
          scheduledDate: input.scheduledDate.toISOString().split('T')[0],
          administeredDate: input.administeredDate.toISOString().split('T')[0],
          administeredTime: input.administeredTime,
          dosageGiven: input.dosageGiven,
          administeredBy: ctx.user?.id,
          status: 'administered',
          notes: input.notes,
          sideEffects: input.sideEffects,
        });

        return {
          success: true,
          message: 'Medication administration recorded successfully',
        };
      } catch (error) {
        console.error('Error recording administration:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to record medication administration',
        });
      }
    }),

  /**
   * Mark dose as missed
   */
  markAsMissed: protectedProcedure
    .input(z.object({
      prescriptionId: z.number(),
      animalId: z.number(),
      farmId: z.number(),
      medicationName: z.string(),
      scheduledDate: z.date(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const db = getDb();

        // Insert missed dose record
        await db.insert(medicationCompliance).values({
          prescriptionId: input.prescriptionId.toString(),
          animalId: input.animalId,
          farmId: input.farmId,
          medicationName: input.medicationName,
          scheduledDate: input.scheduledDate.toISOString().split('T')[0],
          status: 'missed',
          notes: input.reason,
        });

        return {
          success: true,
          message: 'Missed dose recorded successfully',
        };
      } catch (error) {
        console.error('Error marking dose as missed:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to mark dose as missed',
        });
      }
    }),

  /**
   * Get compliance summary for a prescription
   */
  getSummary: protectedProcedure
    .input(z.object({
      prescriptionId: z.number(),
    }))
    .query(async ({ input }) => {
      try {
        const db = getDb();

        // Fetch summary
        const summary = await db
          .select()
          .from(medicationComplianceSummary)
          .where(eq(medicationComplianceSummary.prescriptionId, input.prescriptionId.toString()));

        if (summary.length === 0) {
          // Calculate from compliance records if summary doesn't exist
          const records = await db
            .select()
            .from(medicationCompliance)
            .where(eq(medicationCompliance.prescriptionId, input.prescriptionId.toString()));

          const total = records.length;
          const administered = records.filter((r) => r.status === 'administered').length;
          const missed = records.filter((r) => r.status === 'missed').length;
          const skipped = records.filter((r) => r.status === 'skipped').length;

          return {
            prescriptionId: input.prescriptionId,
            totalScheduled: total,
            totalAdministered: administered,
            totalMissed: missed,
            totalSkipped: skipped,
            compliancePercentage: total > 0 ? ((administered / total) * 100).toFixed(2) : '0',
          };
        }

        return summary[0];
      } catch (error) {
        console.error('Error fetching compliance summary:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch compliance summary',
        });
      }
    }),

  /**
   * Get farm-wide compliance dashboard
   */
  getDashboard: protectedProcedure
    .input(z.object({
      farmId: z.number(),
    }))
    .query(async ({ input }) => {
      try {
        const db = getDb();

        // Get all compliance records for the farm
        const records = await db
          .select()
          .from(medicationCompliance)
          .where(eq(medicationCompliance.farmId, input.farmId));

        // Calculate metrics
        const total = records.length;
        const administered = records.filter((r) => r.status === 'administered').length;
        const missed = records.filter((r) => r.status === 'missed').length;
        const pending = records.filter((r) => r.status === 'pending').length;

        const averageCompliance = total > 0 ? Math.round((administered / total) * 100) : 0;

        // Get unique animals on medication
        const uniqueAnimals = new Set(records.map((r) => r.animalId));
        const animalsWithPerfectCompliance = new Set();

        for (const animalId of uniqueAnimals) {
          const animalRecords = records.filter((r) => r.animalId === animalId);
          const animalAdministered = animalRecords.filter((r) => r.status === 'administered').length;
          if (animalRecords.length > 0 && animalAdministered === animalRecords.length) {
            animalsWithPerfectCompliance.add(animalId);
          }
        }

        // Recent missed doses
        const recentMissedDoses = records
          .filter((r) => r.status === 'missed')
          .sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime())
          .slice(0, 5).length;

        // Compliance trend (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const trendData = [];
        for (let i = 0; i < 30; i++) {
          const date = new Date(thirtyDaysAgo);
          date.setDate(date.getDate() + i);
          const dateStr = date.toISOString().split('T')[0];

          const dayRecords = records.filter(
            (r) => r.scheduledDate === dateStr
          );
          const dayAdministered = dayRecords.filter((r) => r.status === 'administered').length;
          const dayCompliance = dayRecords.length > 0 ? Math.round((dayAdministered / dayRecords.length) * 100) : 0;

          trendData.push({
            date: dateStr,
            compliance: dayCompliance,
          });
        }

        // Animal compliance breakdown
        const animalComplianceBreakdown = Array.from(uniqueAnimals).map((animalId) => {
          const animalRecords = records.filter((r) => r.animalId === animalId);
          const animalAdministered = animalRecords.filter((r) => r.status === 'administered').length;
          const compliance = animalRecords.length > 0 ? Math.round((animalAdministered / animalRecords.length) * 100) : 0;

          return {
            animalId,
            animalName: `Animal ${animalId}`,
            compliance,
            status: compliance >= 90 ? 'excellent' : compliance >= 70 ? 'good' : 'needs_attention',
          };
        });

        return {
          averageCompliance,
          totalAnimalsOnMedication: uniqueAnimals.size,
          animalsWithPerfectCompliance: animalsWithPerfectCompliance.size,
          recentMissedDoses,
          complianceTrend: trendData,
          animalComplianceBreakdown,
        };
      } catch (error) {
        console.error('Error fetching compliance dashboard:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch compliance dashboard',
        });
      }
    }),

  /**
   * Get compliance alerts
   */
  getAlerts: protectedProcedure
    .input(z.object({
      farmId: z.number(),
    }))
    .query(async ({ input }) => {
      try {
        const db = getDb();

        const alerts = [];

        // Get all compliance records for the farm
        const records = await db
          .select()
          .from(medicationCompliance)
          .where(eq(medicationCompliance.farmId, input.farmId));

        // Check for missed doses in last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const missedRecords = records.filter(
          (r) => r.status === 'missed' && new Date(r.scheduledDate) >= sevenDaysAgo
        );

        for (const record of missedRecords) {
          alerts.push({
            id: `alert-${record.id}`,
            animalId: record.animalId,
            animalName: `Animal ${record.animalId}`,
            severity: 'warning',
            message: `Missed dose of ${record.medicationName} on ${record.scheduledDate}`,
            type: 'missed_dose',
            createdAt: new Date(),
          });
        }

        // Check for low compliance animals
        const uniqueAnimals = new Set(records.map((r) => r.animalId));
        for (const animalId of uniqueAnimals) {
          const animalRecords = records.filter((r) => r.animalId === animalId);
          const animalAdministered = animalRecords.filter((r) => r.status === 'administered').length;
          const compliance = animalRecords.length > 0 ? (animalAdministered / animalRecords.length) * 100 : 0;

          if (compliance < 70) {
            alerts.push({
              id: `alert-compliance-${animalId}`,
              animalId,
              animalName: `Animal ${animalId}`,
              severity: compliance < 50 ? 'critical' : 'warning',
              message: `Low medication compliance (${Math.round(compliance)}%) for animal`,
              type: 'low_compliance',
              createdAt: new Date(),
            });
          }
        }

        return alerts;
      } catch (error) {
        console.error('Error fetching alerts:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch alerts',
        });
      }
    }),

  /**
   * Generate compliance report
   */
  generateReport: protectedProcedure
    .input(z.object({
      farmId: z.number(),
      format: z.enum(['json', 'csv', 'pdf']).default('json'),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
    }))
    .query(async ({ input }) => {
      try {
        const db = getDb();

        // Fetch compliance records
        const records = await db
          .select()
          .from(medicationCompliance)
          .where(eq(medicationCompliance.farmId, input.farmId));

        // Filter by date range if provided
        let filteredRecords = records;
        if (input.startDate && input.endDate) {
          const startStr = input.startDate.toISOString().split('T')[0];
          const endStr = input.endDate.toISOString().split('T')[0];
          filteredRecords = records.filter(
            (r) => r.scheduledDate >= startStr && r.scheduledDate <= endStr
          );
        }

        // Calculate summary
        const total = filteredRecords.length;
        const administered = filteredRecords.filter((r) => r.status === 'administered').length;
        const missed = filteredRecords.filter((r) => r.status === 'missed').length;
        const pending = filteredRecords.filter((r) => r.status === 'pending').length;

        const report = {
          generatedAt: new Date(),
          farmId: input.farmId,
          period: {
            startDate: input.startDate || new Date(new Date().setDate(new Date().getDate() - 30)),
            endDate: input.endDate || new Date(),
          },
          summary: {
            totalRecords: total,
            administered,
            missed,
            pending,
            compliancePercentage: total > 0 ? ((administered / total) * 100).toFixed(2) : '0',
          },
          details: filteredRecords,
        };

        return {
          success: true,
          format: input.format,
          data: report,
          message: `Report generated in ${input.format} format`,
        };
      } catch (error) {
        console.error('Error generating report:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to generate report',
        });
      }
    }),

  /**
   * Get animal compliance history
   */
  getAnimalHistory: protectedProcedure
    .input(z.object({
      animalId: z.number(),
      limit: z.number().default(100),
    }))
    .query(async ({ input }) => {
      try {
        const db = getDb();

        const history = await db
          .select()
          .from(medicationCompliance)
          .where(eq(medicationCompliance.animalId, input.animalId))
          .orderBy(desc(medicationCompliance.scheduledDate))
          .limit(input.limit);

        return {
          animalId: input.animalId,
          totalRecords: history.length,
          history,
        };
      } catch (error) {
        console.error('Error fetching animal history:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch animal history',
        });
      }
    }),
});
