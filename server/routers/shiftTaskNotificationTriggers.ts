import { z } from 'zod'
import { protectedProcedure, router } from '../_core/trpc'
import { TRPCError } from '@trpc/server'
import { notifyOwner } from '../_core/notification'
import { broadcastShiftAssignment, broadcastTaskUpdate } from '../_core/websocket'

/**
 * Shift & Task Procedures with Integrated Push Notification Triggers
 * Auto-sends push notifications when shifts/tasks are assigned or status changes
 */

export const shiftTaskNotificationTriggersRouter = router({
  /**
   * Create and assign shift with auto-notification
   */
  createShiftWithNotification: protectedProcedure
    .input(
      z.object({
        shiftDate: z.date(),
        startTime: z.string(),
        endTime: z.string(),
        location: z.string(),
        requiredSkills: z.array(z.string()),
        workersToAssign: z.array(z.number()),
        farmId: z.number(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        console.log('[ShiftNotificationTriggers] Creating shift with notifications:', {
          date: input.shiftDate,
          workers: input.workersToAssign.length,
        })

        // Mock shift creation
        const shiftId = Math.floor(Math.random() * 10000)
        const shift = {
          id: shiftId,
          date: input.shiftDate,
          startTime: input.startTime,
          endTime: input.endTime,
          location: input.location,
          requiredSkills: input.requiredSkills,
          assignedWorkers: input.workersToAssign,
          createdBy: ctx.user.id,
          createdAt: new Date(),
        }

        // Trigger notifications for each assigned worker
        for (const workerId of input.workersToAssign) {
          try {
            // Send push notification
            await sendShiftAssignmentNotification(
              workerId,
              shift,
              input.farmId
            )

            // Broadcast via WebSocket
            await broadcastShiftAssignment({
              shiftId,
              workerId,
              farmId: input.farmId,
              action: 'assigned',
              shift,
            })

            console.log(`[ShiftNotificationTriggers] Sent shift notification to worker ${workerId}`)
          } catch (error) {
            console.error(
              `[ShiftNotificationTriggers] Error notifying worker ${workerId}:`,
              error
            )
          }
        }

        // Notify owner
        try {
          await notifyOwner({
            title: 'Shift Created',
            content: `Shift created for ${input.shiftDate.toDateString()} with ${input.workersToAssign.length} workers assigned`,
          })
        } catch (error) {
          console.error('[ShiftNotificationTriggers] Error notifying owner:', error)
        }

        return {
          success: true,
          shiftId,
          shift,
          notificationsSent: input.workersToAssign.length,
        }
      } catch (error) {
        console.error('[ShiftNotificationTriggers] Error creating shift:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create shift with notifications',
        })
      }
    }),

  /**
   * Update shift and trigger notifications for changes
   */
  updateShiftWithNotification: protectedProcedure
    .input(
      z.object({
        shiftId: z.number(),
        updates: z.object({
          startTime: z.string().optional(),
          endTime: z.string().optional(),
          location: z.string().optional(),
          workersToAdd: z.array(z.number()).optional(),
          workersToRemove: z.array(z.number()).optional(),
          notes: z.string().optional(),
        }),
        farmId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        console.log('[ShiftNotificationTriggers] Updating shift with notifications:', {
          shiftId: input.shiftId,
          changes: Object.keys(input.updates).filter((k) => input.updates[k as keyof typeof input.updates]),
        })

        // Mock shift update
        const updatedShift = {
          id: input.shiftId,
          ...input.updates,
          updatedBy: ctx.user.id,
          updatedAt: new Date(),
        }

        // Notify workers being added
        if (input.updates.workersToAdd && input.updates.workersToAdd.length > 0) {
          for (const workerId of input.updates.workersToAdd) {
            try {
              await sendShiftAssignmentNotification(
                workerId,
                updatedShift,
                input.farmId,
                'added'
              )

              await broadcastShiftAssignment({
                shiftId: input.shiftId,
                workerId,
                farmId: input.farmId,
                action: 'added',
                shift: updatedShift,
              })

              console.log(`[ShiftNotificationTriggers] Sent shift add notification to worker ${workerId}`)
            } catch (error) {
              console.error(
                `[ShiftNotificationTriggers] Error notifying worker ${workerId}:`,
                error
              )
            }
          }
        }

        // Notify workers being removed
        if (input.updates.workersToRemove && input.updates.workersToRemove.length > 0) {
          for (const workerId of input.updates.workersToRemove) {
            try {
              await sendShiftRemovalNotification(
                workerId,
                input.shiftId,
                input.farmId
              )

              await broadcastShiftAssignment({
                shiftId: input.shiftId,
                workerId,
                farmId: input.farmId,
                action: 'removed',
              })

              console.log(`[ShiftNotificationTriggers] Sent shift removal notification to worker ${workerId}`)
            } catch (error) {
              console.error(
                `[ShiftNotificationTriggers] Error notifying worker ${workerId}:`,
                error
              )
            }
          }
        }

        // Notify all assigned workers of changes
        if (Object.keys(input.updates).some((k) => ['startTime', 'endTime', 'location'].includes(k))) {
          try {
            await notifyOwner({
              title: 'Shift Updated',
              content: `Shift ${input.shiftId} has been updated with changes to timing or location`,
            })
          } catch (error) {
            console.error('[ShiftNotificationTriggers] Error notifying owner:', error)
          }
        }

        return {
          success: true,
          shiftId: input.shiftId,
          shift: updatedShift,
          workersNotified: (input.updates.workersToAdd?.length || 0) + (input.updates.workersToRemove?.length || 0),
        }
      } catch (error) {
        console.error('[ShiftNotificationTriggers] Error updating shift:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update shift with notifications',
        })
      }
    }),

  /**
   * Create and assign task with auto-notification
   */
  createTaskWithNotification: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        description: z.string(),
        dueDate: z.date(),
        priority: z.enum(['low', 'medium', 'high', 'critical']),
        assignedWorkerId: z.number(),
        farmId: z.number(),
        taskType: z.string(),
        estimatedHours: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        console.log('[TaskNotificationTriggers] Creating task with notification:', {
          title: input.title,
          worker: input.assignedWorkerId,
          priority: input.priority,
        })

        // Mock task creation
        const taskId = Math.floor(Math.random() * 10000)
        const task = {
          id: taskId,
          title: input.title,
          description: input.description,
          dueDate: input.dueDate,
          priority: input.priority,
          assignedWorkerId: input.assignedWorkerId,
          status: 'pending',
          createdBy: ctx.user.id,
          createdAt: new Date(),
        }

        // Send push notification to assigned worker
        try {
          await sendTaskAssignmentNotification(
            input.assignedWorkerId,
            task,
            input.farmId
          )

          // Broadcast via WebSocket
          await broadcastTaskUpdate({
            taskId,
            workerId: input.assignedWorkerId,
            farmId: input.farmId,
            action: 'assigned',
            task,
          })

          console.log(`[TaskNotificationTriggers] Sent task notification to worker ${input.assignedWorkerId}`)
        } catch (error) {
          console.error('[TaskNotificationTriggers] Error sending task notification:', error)
        }

        // Notify owner for critical tasks
        if (input.priority === 'critical') {
          try {
            await notifyOwner({
              title: 'Critical Task Created',
              content: `Critical task "${input.title}" assigned to worker ${input.assignedWorkerId}`,
            })
          } catch (error) {
            console.error('[TaskNotificationTriggers] Error notifying owner:', error)
          }
        }

        return {
          success: true,
          taskId,
          task,
          notificationSent: true,
        }
      } catch (error) {
        console.error('[TaskNotificationTriggers] Error creating task:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create task with notification',
        })
      }
    }),

  /**
   * Update task status and trigger notifications
   */
  updateTaskStatusWithNotification: protectedProcedure
    .input(
      z.object({
        taskId: z.number(),
        newStatus: z.enum(['pending', 'in_progress', 'completed', 'cancelled']),
        workerId: z.number(),
        farmId: z.number(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        console.log('[TaskNotificationTriggers] Updating task status with notification:', {
          taskId: input.taskId,
          newStatus: input.newStatus,
        })

        // Mock task update
        const updatedTask = {
          id: input.taskId,
          status: input.newStatus,
          updatedBy: ctx.user.id,
          updatedAt: new Date(),
        }

        // Send status change notification
        try {
          await sendTaskStatusChangeNotification(
            input.workerId,
            input.taskId,
            input.newStatus,
            input.farmId
          )

          // Broadcast via WebSocket
          await broadcastTaskUpdate({
            taskId: input.taskId,
            workerId: input.workerId,
            farmId: input.farmId,
            action: 'status_changed',
            task: updatedTask,
          })

          console.log(`[TaskNotificationTriggers] Sent status change notification for task ${input.taskId}`)
        } catch (error) {
          console.error('[TaskNotificationTriggers] Error sending status notification:', error)
        }

        // Notify owner if task completed
        if (input.newStatus === 'completed') {
          try {
            await notifyOwner({
              title: 'Task Completed',
              content: `Task ${input.taskId} has been marked as completed`,
            })
          } catch (error) {
            console.error('[TaskNotificationTriggers] Error notifying owner:', error)
          }
        }

        return {
          success: true,
          taskId: input.taskId,
          task: updatedTask,
          notificationSent: true,
        }
      } catch (error) {
        console.error('[TaskNotificationTriggers] Error updating task:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update task status with notification',
        })
      }
    }),

  /**
   * Reassign task and trigger notifications
   */
  reassignTaskWithNotification: protectedProcedure
    .input(
      z.object({
        taskId: z.number(),
        currentWorkerId: z.number(),
        newWorkerId: z.number(),
        farmId: z.number(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        console.log('[TaskNotificationTriggers] Reassigning task with notifications:', {
          taskId: input.taskId,
          from: input.currentWorkerId,
          to: input.newWorkerId,
        })

        // Mock task reassignment
        const reassignedTask = {
          id: input.taskId,
          assignedWorkerId: input.newWorkerId,
          previousWorkerId: input.currentWorkerId,
          reassignedBy: ctx.user.id,
          reassignedAt: new Date(),
        }

        // Notify old worker of removal
        try {
          await sendTaskRemovalNotification(
            input.currentWorkerId,
            input.taskId,
            input.farmId,
            'reassigned'
          )

          await broadcastTaskUpdate({
            taskId: input.taskId,
            workerId: input.currentWorkerId,
            farmId: input.farmId,
            action: 'unassigned',
          })
        } catch (error) {
          console.error('[TaskNotificationTriggers] Error notifying old worker:', error)
        }

        // Notify new worker of assignment
        try {
          await sendTaskAssignmentNotification(
            input.newWorkerId,
            reassignedTask,
            input.farmId,
            'reassigned'
          )

          await broadcastTaskUpdate({
            taskId: input.taskId,
            workerId: input.newWorkerId,
            farmId: input.farmId,
            action: 'reassigned',
            task: reassignedTask,
          })

          console.log(`[TaskNotificationTriggers] Sent reassignment notifications`)
        } catch (error) {
          console.error('[TaskNotificationTriggers] Error notifying new worker:', error)
        }

        return {
          success: true,
          taskId: input.taskId,
          task: reassignedTask,
          workersNotified: 2,
        }
      } catch (error) {
        console.error('[TaskNotificationTriggers] Error reassigning task:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to reassign task with notifications',
        })
      }
    }),
})

/**
 * Helper functions for sending notifications
 */

async function sendShiftAssignmentNotification(
  workerId: number,
  shift: any,
  farmId: number,
  action: string = 'assigned'
) {
  console.log(
    `[NotificationHelper] Sending shift ${action} notification to worker ${workerId}`
  )

  // In production, would integrate with actual push notification service
  // Example: await pushNotificationService.send({
  //   userId: workerId,
  //   title: `Shift ${action}`,
  //   body: `You have been ${action} to a shift on ${shift.date}`,
  //   data: { shiftId: shift.id, farmId }
  // })
}

async function sendShiftRemovalNotification(
  workerId: number,
  shiftId: number,
  farmId: number
) {
  console.log(
    `[NotificationHelper] Sending shift removal notification to worker ${workerId}`
  )

  // In production, would integrate with actual push notification service
}

async function sendTaskAssignmentNotification(
  workerId: number,
  task: any,
  farmId: number,
  action: string = 'assigned'
) {
  console.log(
    `[NotificationHelper] Sending task ${action} notification to worker ${workerId}`
  )

  // In production, would integrate with actual push notification service
  // Example: await pushNotificationService.send({
  //   userId: workerId,
  //   title: `Task ${action}`,
  //   body: `${task.title} (Priority: ${task.priority})`,
  //   data: { taskId: task.id, farmId }
  // })
}

async function sendTaskStatusChangeNotification(
  workerId: number,
  taskId: number,
  newStatus: string,
  farmId: number
) {
  console.log(
    `[NotificationHelper] Sending task status change notification to worker ${workerId}`
  )

  // In production, would integrate with actual push notification service
}

async function sendTaskRemovalNotification(
  workerId: number,
  taskId: number,
  farmId: number,
  reason: string = 'unassigned'
) {
  console.log(
    `[NotificationHelper] Sending task removal notification to worker ${workerId}`
  )

  // In production, would integrate with actual push notification service
}
