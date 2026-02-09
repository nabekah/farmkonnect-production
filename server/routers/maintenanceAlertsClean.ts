import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  checkAndSendMaintenanceAlerts,
  assignTechnician,
  updateMaintenanceProgress,
  getTechnicianAssignments,
  getMaintenanceAlertStats,
  sendEscalationAlert,
} from "../services/maintenanceAlertsService";

/**
 * Real-time Maintenance Alerts Router
 * Handles SMS/email notifications, technician assignment, and completion tracking
 */
export const maintenanceAlertsCleanRouter = router({
  /**
   * Check for maintenance due and send alerts
   */
  checkAndSendAlerts: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      const alerts = await checkAndSendMaintenanceAlerts();
      return {
        success: true,
        alertsSent: alerts.length,
        alerts,
        overdue: alerts.filter((a) => a.status === "overdue").length,
        dueSoon: alerts.filter((a) => a.status === "due_soon").length,
      };
    } catch (error) {
      throw new Error(`Failed to check maintenance alerts: ${error}`);
    }
  }),

  /**
   * Get pending maintenance alerts
   */
  getPendingAlerts: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ input }) => {
      try {
        const alerts = await checkAndSendMaintenanceAlerts();
        return {
          alerts: alerts.filter((a) => a.status === "due_soon" || a.status === "overdue"),
          totalAlerts: alerts.length,
          overdueCount: alerts.filter((a) => a.status === "overdue").length,
        };
      } catch (error) {
        throw new Error(`Failed to fetch pending alerts: ${error}`);
      }
    }),

  /**
   * Assign technician to maintenance task
   */
  assignTechnician: protectedProcedure
    .input(
      z.object({
        maintenanceId: z.number(),
        technicianId: z.number(),
        technicianName: z.string(),
        technicianPhone: z.string().optional(),
        technicianEmail: z.string().email().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const assignment = await assignTechnician(
          input.maintenanceId,
          input.technicianId,
          input.technicianName,
          input.technicianPhone,
          input.technicianEmail
        );

        if (!assignment) {
          throw new Error("Failed to assign technician");
        }

        return {
          success: true,
          assignmentId: assignment.assignmentId,
          message: `${input.technicianName} assigned to maintenance task. Notifications sent.`,
        };
      } catch (error) {
        throw new Error(`Failed to assign technician: ${error}`);
      }
    }),

  /**
   * Update maintenance progress
   */
  updateProgress: protectedProcedure
    .input(
      z.object({
        assignmentId: z.number(),
        status: z.enum(["in_progress", "completed", "cancelled"]),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const result = await updateMaintenanceProgress(input.assignmentId, input.status, input.notes);

        return result;
      } catch (error) {
        throw new Error(`Failed to update maintenance progress: ${error}`);
      }
    }),

  /**
   * Get technician's active assignments
   */
  getTechnicianAssignments: protectedProcedure
    .input(z.object({ technicianId: z.number() }))
    .query(async ({ input }) => {
      try {
        const assignments = await getTechnicianAssignments(input.technicianId);
        return {
          assignments,
          totalAssignments: assignments.length,
          inProgress: assignments.filter((a) => a.status === "in_progress").length,
          assigned: assignments.filter((a) => a.status === "assigned").length,
        };
      } catch (error) {
        throw new Error(`Failed to fetch technician assignments: ${error}`);
      }
    }),

  /**
   * Get maintenance alert statistics
   */
  getAlertStatistics: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ input }) => {
      try {
        const stats = await getMaintenanceAlertStats(input.farmId);
        return {
          stats,
          alertLevel:
            stats.overdue > 0
              ? "critical"
              : stats.dueSoon > 0
                ? "warning"
                : "normal",
        };
      } catch (error) {
        throw new Error(`Failed to fetch alert statistics: ${error}`);
      }
    }),

  /**
   * Send escalation alert for overdue maintenance
   */
  sendEscalationAlert: protectedProcedure
    .input(
      z.object({
        maintenanceId: z.number(),
        equipmentName: z.string(),
        daysOverdue: z.number(),
        supervisorEmail: z.string().email(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const result = await sendEscalationAlert(
          input.maintenanceId,
          input.equipmentName,
          input.daysOverdue,
          input.supervisorEmail
        );

        return result;
      } catch (error) {
        throw new Error(`Failed to send escalation alert: ${error}`);
      }
    }),

  /**
   * Get maintenance history for equipment
   */
  getEquipmentMaintenanceHistory: protectedProcedure
    .input(z.object({ equipmentId: z.number() }))
    .query(async ({ input }) => {
      try {
        // Mock data - in production, query database
        return {
          equipmentId: input.equipmentId,
          history: [
            {
              maintenanceId: 1,
              type: "Oil Change",
              completedDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
              technician: "John Smith",
              cost: 250,
            },
            {
              maintenanceId: 2,
              type: "Filter Replacement",
              completedDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
              technician: "Sarah Johnson",
              cost: 150,
            },
          ],
          totalCost: 400,
        };
      } catch (error) {
        throw new Error(`Failed to fetch maintenance history: ${error}`);
      }
    }),

  /**
   * Schedule preventive maintenance
   */
  schedulePreventiveMaintenance: protectedProcedure
    .input(
      z.object({
        equipmentId: z.number(),
        maintenanceType: z.string(),
        scheduledDate: z.string().datetime(),
        estimatedCost: z.number(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // In production, save to database
        return {
          success: true,
          maintenanceId: Math.floor(Math.random() * 1000000),
          message: "Preventive maintenance scheduled successfully",
          scheduledDate: input.scheduledDate,
        };
      } catch (error) {
        throw new Error(`Failed to schedule maintenance: ${error}`);
      }
    }),
});
