import { router, protectedProcedure } from '../_core/trpc'
import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { broadcastShiftAssignment, broadcastTaskUpdate } from '../_core/websocket'
import { notifyOwner } from '../_core/notification'

/**
 * WebSocket Event Trigger Router
 * Hooks notification procedures into shift/task endpoints
 * Auto-sends notifications when events occur
 */

export const websocketEventTriggersRouter = router({
  /**
   * Trigger shift assignment notification
   * Called when a shift is assigned to workers
   */
  triggerShiftAssignmentNotification: protectedProcedure
    .input(
      z.object({
        shiftId: z.number(),
        farmId: z.number(),
        workerIds: z.array(z.number()),
        shiftDate: z.date(),
        startTime: z.string(),
        endTime: z.string(),
        location: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Broadcast to WebSocket clients
        await broadcastShiftAssignment({
          action: 'assigned',
          shiftId: input.shiftId,
          farmId: input.farmId,
          workerIds: input.workerIds,
          shift: {
            id: input.shiftId,
            date: input.shiftDate,
            startTime: input.startTime,
            endTime: input.endTime,
            location: input.location,
            status: 'scheduled',
          },
          timestamp: new Date(),
        })

        // Notify owner
        await notifyOwner({
          title: 'Shift Assignment',
          content: `${input.workerIds.length} workers assigned to shift at ${input.location} on ${input.shiftDate.toLocaleDateString()}`,
        })

        return {
          success: true,
          notificationsSent: input.workerIds.length,
          broadcastSent: true,
        }
      } catch (error) {
        console.error('[WebSocketEventTriggers] Error triggering shift assignment:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to trigger shift assignment notification',
        })
      }
    }),

  /**
   * Trigger task assignment notification
   * Called when a task is assigned to a worker
   */
  triggerTaskAssignmentNotification: protectedProcedure
    .input(
      z.object({
        taskId: z.number(),
        farmId: z.number(),
        workerId: z.number(),
        taskTitle: z.string(),
        dueDate: z.date(),
        priority: z.enum(['critical', 'high', 'medium', 'low']),
        location: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Broadcast to WebSocket clients
        await broadcastTaskUpdate({
          action: 'assigned',
          taskId: input.taskId,
          farmId: input.farmId,
          workerId: input.workerId,
          task: {
            id: input.taskId,
            title: input.taskTitle,
            dueDate: input.dueDate,
            priority: input.priority,
            location: input.location,
            status: 'pending',
          },
          timestamp: new Date(),
        })

        // Notify owner
        await notifyOwner({
          title: 'Task Assignment',
          content: `Task "${input.taskTitle}" assigned to worker. Priority: ${input.priority}. Due: ${input.dueDate.toLocaleDateString()}`,
        })

        return {
          success: true,
          notificationSent: true,
          broadcastSent: true,
        }
      } catch (error) {
        console.error('[WebSocketEventTriggers] Error triggering task assignment:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to trigger task assignment notification',
        })
      }
    }),

  /**
   * Trigger task status change notification
   * Called when a task status changes
   */
  triggerTaskStatusChangeNotification: protectedProcedure
    .input(
      z.object({
        taskId: z.number(),
        farmId: z.number(),
        workerId: z.number(),
        taskTitle: z.string(),
        oldStatus: z.enum(['pending', 'in_progress', 'completed', 'cancelled']),
        newStatus: z.enum(['pending', 'in_progress', 'completed', 'cancelled']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Broadcast to WebSocket clients
        await broadcastTaskUpdate({
          action: 'status_changed',
          taskId: input.taskId,
          farmId: input.farmId,
          workerId: input.workerId,
          task: {
            id: input.taskId,
            title: input.taskTitle,
            status: input.newStatus,
          },
          oldStatus: input.oldStatus,
          newStatus: input.newStatus,
          timestamp: new Date(),
        })

        // Notify owner for critical status changes
        if (input.newStatus === 'completed' || input.oldStatus === 'pending') {
          await notifyOwner({
            title: 'Task Status Update',
            content: `Task "${input.taskTitle}" status changed from ${input.oldStatus} to ${input.newStatus}`,
          })
        }

        return {
          success: true,
          notificationSent: input.newStatus === 'completed',
          broadcastSent: true,
        }
      } catch (error) {
        console.error('[WebSocketEventTriggers] Error triggering task status change:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to trigger task status change notification',
        })
      }
    }),

  /**
   * Trigger bulk shift assignment notification
   * Called when multiple shifts are assigned
   */
  triggerBulkShiftAssignmentNotification: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        assignments: z.array(
          z.object({
            shiftId: z.number(),
            workerIds: z.array(z.number()),
            shiftDate: z.date(),
            location: z.string(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        let totalNotifications = 0

        // Broadcast each shift assignment
        for (const assignment of input.assignments) {
          await broadcastShiftAssignment({
            action: 'assigned',
            shiftId: assignment.shiftId,
            farmId: input.farmId,
            workerIds: assignment.workerIds,
            shift: {
              id: assignment.shiftId,
              date: assignment.shiftDate,
              location: assignment.location,
            },
            timestamp: new Date(),
          })

          totalNotifications += assignment.workerIds.length
        }

        // Notify owner
        await notifyOwner({
          title: 'Bulk Shift Assignment',
          content: `${input.assignments.length} shifts assigned to ${totalNotifications} workers`,
        })

        return {
          success: true,
          shiftsAssigned: input.assignments.length,
          totalNotifications,
          broadcastSent: true,
        }
      } catch (error) {
        console.error('[WebSocketEventTriggers] Error triggering bulk shift assignment:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to trigger bulk shift assignment notification',
        })
      }
    }),

  /**
   * Trigger compliance alert notification
   * Called when compliance issues are detected
   */
  triggerComplianceAlertNotification: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        alertType: z.enum(['safety', 'labor_law', 'certification', 'health', 'environmental']),
        severity: z.enum(['critical', 'high', 'medium', 'low']),
        message: z.string(),
        affectedWorkerIds: z.array(z.number()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Broadcast compliance alert
        await broadcastTaskUpdate({
          action: 'compliance_alert',
          farmId: input.farmId,
          alertType: input.alertType,
          severity: input.severity,
          message: input.message,
          affectedWorkers: input.affectedWorkerIds || [],
          timestamp: new Date(),
        })

        // Always notify owner for compliance alerts
        await notifyOwner({
          title: `Compliance Alert - ${input.severity.toUpperCase()}`,
          content: `${input.alertType.replace(/_/g, ' ')}: ${input.message}`,
        })

        return {
          success: true,
          alertBroadcast: true,
          ownerNotified: true,
        }
      } catch (error) {
        console.error('[WebSocketEventTriggers] Error triggering compliance alert:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to trigger compliance alert notification',
        })
      }
    }),

  /**
   * Trigger time-off approval notification
   * Called when time-off requests are approved/rejected
   */
  triggerTimeOffApprovalNotification: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        workerId: z.number(),
        startDate: z.date(),
        endDate: z.date(),
        approved: z.boolean(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Broadcast time-off approval
        await broadcastTaskUpdate({
          action: 'timeoff_approval',
          farmId: input.farmId,
          workerId: input.workerId,
          startDate: input.startDate,
          endDate: input.endDate,
          approved: input.approved,
          reason: input.reason,
          timestamp: new Date(),
        })

        // Notify owner
        const status = input.approved ? 'Approved' : 'Rejected'
        await notifyOwner({
          title: `Time-Off ${status}`,
          content: `Worker time-off request from ${input.startDate.toLocaleDateString()} to ${input.endDate.toLocaleDateString()} has been ${status.toLowerCase()}`,
        })

        return {
          success: true,
          notificationSent: true,
          broadcastSent: true,
        }
      } catch (error) {
        console.error('[WebSocketEventTriggers] Error triggering time-off approval:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to trigger time-off approval notification',
        })
      }
    }),

  /**
   * Get event trigger status
   * Returns current status of event triggers
   */
  getEventTriggerStatus: protectedProcedure.query(async ({ ctx }) => {
    return {
      shiftAssignmentTrigger: true,
      taskAssignmentTrigger: true,
      taskStatusChangeTrigger: true,
      bulkShiftAssignmentTrigger: true,
      complianceAlertTrigger: true,
      timeOffApprovalTrigger: true,
      allTriggersActive: true,
      lastUpdated: new Date(),
    }
  }),
})
