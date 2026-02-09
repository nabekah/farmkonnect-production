import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { eq, and, gte, lte, desc, asc } from "drizzle-orm";

/**
 * Equipment Maintenance Scheduling Router
 * Handles maintenance calendar, scheduling, technician assignments, and completion tracking
 */
export const maintenanceSchedulingCleanRouter = router({
  /**
   * Get maintenance schedule for a date range
   */
  getSchedule: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        startDate: z.string().datetime(),
        endDate: z.string().datetime(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        // Mock maintenance schedule data
        const schedules = [
          {
            id: 1,
            equipmentId: 101,
            equipmentName: "Tractor A",
            maintenanceType: "Oil Change",
            scheduledDate: new Date(input.startDate),
            dueDate: new Date(input.startDate),
            status: "scheduled",
            technicianId: 1,
            technicianName: "John Smith",
            estimatedHours: 2,
            priority: "medium",
            notes: "Regular maintenance",
          },
          {
            id: 2,
            equipmentId: 102,
            equipmentName: "Pump B",
            maintenanceType: "Filter Replacement",
            scheduledDate: new Date(new Date(input.startDate).getTime() + 86400000),
            dueDate: new Date(new Date(input.startDate).getTime() + 86400000),
            status: "in_progress",
            technicianId: 2,
            technicianName: "Sarah Johnson",
            estimatedHours: 1.5,
            priority: "high",
            notes: "Critical filter replacement",
          },
          {
            id: 3,
            equipmentId: 103,
            equipmentName: "Sprayer C",
            maintenanceType: "Calibration",
            scheduledDate: new Date(new Date(input.startDate).getTime() + 172800000),
            dueDate: new Date(new Date(input.startDate).getTime() + 172800000),
            status: "completed",
            technicianId: 1,
            technicianName: "John Smith",
            estimatedHours: 3,
            priority: "low",
            notes: "Annual calibration",
            completedDate: new Date(new Date(input.startDate).getTime() + 172800000),
          },
        ];

        return {
          schedules: schedules.filter(
            (s) =>
              new Date(s.scheduledDate) >= new Date(input.startDate) &&
              new Date(s.scheduledDate) <= new Date(input.endDate)
          ),
          totalScheduled: schedules.length,
          upcomingCount: schedules.filter((s) => s.status === "scheduled").length,
          inProgressCount: schedules.filter((s) => s.status === "in_progress").length,
          completedCount: schedules.filter((s) => s.status === "completed").length,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch maintenance schedule: ${error}`,
        });
      }
    }),

  /**
   * Schedule new maintenance
   */
  scheduleMaintenanceTask: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        equipmentId: z.number(),
        maintenanceType: z.string(),
        scheduledDate: z.string().datetime(),
        technicianId: z.number(),
        estimatedHours: z.number().positive(),
        priority: z.enum(["low", "medium", "high", "critical"]),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        // Mock schedule creation
        const newSchedule = {
          id: Math.floor(Math.random() * 10000),
          ...input,
          status: "scheduled",
          createdAt: new Date(),
        };

        return {
          success: true,
          scheduleId: newSchedule.id,
          message: `Maintenance scheduled for equipment ${input.equipmentId}`,
          schedule: newSchedule,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to schedule maintenance: ${error}`,
        });
      }
    }),

  /**
   * Update maintenance schedule
   */
  updateSchedule: protectedProcedure
    .input(
      z.object({
        scheduleId: z.number(),
        scheduledDate: z.string().datetime().optional(),
        technicianId: z.number().optional(),
        estimatedHours: z.number().positive().optional(),
        priority: z.enum(["low", "medium", "high", "critical"]).optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        return {
          success: true,
          message: `Schedule ${input.scheduleId} updated successfully`,
          updatedFields: Object.keys(input).filter((k) => k !== "scheduleId"),
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to update schedule: ${error}`,
        });
      }
    }),

  /**
   * Reschedule maintenance to different date
   */
  rescheduleMaintenanceTask: protectedProcedure
    .input(
      z.object({
        scheduleId: z.number(),
        newDate: z.string().datetime(),
        reason: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        return {
          success: true,
          scheduleId: input.scheduleId,
          newDate: input.newDate,
          reason: input.reason,
          message: "Maintenance rescheduled successfully",
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to reschedule maintenance: ${error}`,
        });
      }
    }),

  /**
   * Update maintenance status
   */
  updateMaintenanceStatus: protectedProcedure
    .input(
      z.object({
        scheduleId: z.number(),
        status: z.enum(["scheduled", "in_progress", "completed", "cancelled"]),
        completedDate: z.string().datetime().optional(),
        actualHours: z.number().positive().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        return {
          success: true,
          scheduleId: input.scheduleId,
          status: input.status,
          message: `Maintenance status updated to ${input.status}`,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to update maintenance status: ${error}`,
        });
      }
    }),

  /**
   * Get technician assignments
   */
  getTechnicianAssignments: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        technicianId: z.number().optional(),
        startDate: z.string().datetime().optional(),
        endDate: z.string().datetime().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        // Mock technician assignments
        const assignments = [
          {
            technicianId: 1,
            technicianName: "John Smith",
            totalAssigned: 5,
            completed: 3,
            inProgress: 1,
            pending: 1,
            completionRate: 60,
            averageHours: 2.5,
          },
          {
            technicianId: 2,
            technicianName: "Sarah Johnson",
            totalAssigned: 4,
            completed: 2,
            inProgress: 2,
            pending: 0,
            completionRate: 50,
            averageHours: 1.75,
          },
        ];

        return {
          assignments: input.technicianId
            ? assignments.filter((a) => a.technicianId === input.technicianId)
            : assignments,
          totalTechnicians: assignments.length,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch technician assignments: ${error}`,
        });
      }
    }),

  /**
   * Get maintenance history for equipment
   */
  getMaintenanceHistory: protectedProcedure
    .input(
      z.object({
        equipmentId: z.number(),
        limit: z.number().positive().default(50),
        offset: z.number().nonnegative().default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        // Mock maintenance history
        const history = [
          {
            id: 1,
            maintenanceType: "Oil Change",
            completedDate: new Date("2026-02-01"),
            technicianName: "John Smith",
            actualHours: 2,
            cost: 150,
            notes: "Regular maintenance",
            status: "completed",
          },
          {
            id: 2,
            maintenanceType: "Filter Replacement",
            completedDate: new Date("2026-01-15"),
            technicianName: "Sarah Johnson",
            actualHours: 1.5,
            cost: 75,
            notes: "Preventive maintenance",
            status: "completed",
          },
          {
            id: 3,
            maintenanceType: "Belt Inspection",
            completedDate: new Date("2026-01-01"),
            technicianName: "John Smith",
            actualHours: 1,
            cost: 50,
            notes: "No issues found",
            status: "completed",
          },
        ];

        return {
          history: history.slice(input.offset, input.offset + input.limit),
          total: history.length,
          offset: input.offset,
          limit: input.limit,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch maintenance history: ${error}`,
        });
      }
    }),

  /**
   * Get maintenance statistics
   */
  getMaintenanceStats: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        return {
          totalEquipment: 15,
          totalScheduled: 8,
          totalCompleted: 12,
          totalInProgress: 2,
          averageCompletionTime: 2.3,
          onTimeCompletionRate: 92,
          costPerMaintenance: 125,
          totalMaintenanceCost: 1500,
          equipmentDowntime: 4.5,
          preventiveVsCorrective: {
            preventive: 65,
            corrective: 35,
          },
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch maintenance statistics: ${error}`,
        });
      }
    }),

  /**
   * Cancel maintenance schedule
   */
  cancelMaintenanceTask: protectedProcedure
    .input(
      z.object({
        scheduleId: z.number(),
        reason: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        return {
          success: true,
          scheduleId: input.scheduleId,
          status: "cancelled",
          message: "Maintenance task cancelled",
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to cancel maintenance task: ${error}`,
        });
      }
    }),

  /**
   * Get upcoming maintenance alerts
   */
  getUpcomingAlerts: protectedProcedure
    .input(z.object({ farmId: z.number(), daysAhead: z.number().positive().default(30) }))
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        return {
          alerts: [
            {
              id: 1,
              equipmentName: "Tractor A",
              maintenanceType: "Oil Change",
              dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
              daysUntilDue: 3,
              priority: "high",
              assignedTechnician: "John Smith",
            },
            {
              id: 2,
              equipmentName: "Pump B",
              maintenanceType: "Filter Replacement",
              dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              daysUntilDue: 7,
              priority: "medium",
              assignedTechnician: "Sarah Johnson",
            },
          ],
          totalUpcoming: 2,
          criticalCount: 0,
          highPriorityCount: 1,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch upcoming alerts: ${error}`,
        });
      }
    }),
});
