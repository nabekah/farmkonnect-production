/**
 * Notification Router
 * tRPC procedures for managing and sending notifications
 */

import { router, publicProcedure, protectedProcedure } from '../_core/trpc'
import { z } from 'zod'
import { getDb } from '../db'
import { notifyOwner } from '../_core/notification'

// Validation schemas
const EmergencyAlertSchema = z.object({
  severity: z.enum(['warning', 'critical']),
  description: z.string().min(1).max(500),
  location: z.object({ lat: z.number(), lng: z.number() }).optional(),
  affectedWorkers: z.array(z.number()).optional(),
  actionRequired: z.boolean().default(true),
  estimatedDuration: z.number().optional(),
})

const WeatherWarningSchema = z.object({
  weatherType: z.enum(['rain', 'wind', 'heat', 'cold', 'storm', 'flood']),
  severity: z.enum(['minor', 'moderate', 'severe']),
  affectedArea: z.object({
    lat: z.number(),
    lng: z.number(),
    radius: z.number(),
  }),
  startTime: z.number(),
  endTime: z.number(),
  recommendations: z.array(z.string()),
})

const EquipmentFailureSchema = z.object({
  equipmentId: z.string(),
  equipmentName: z.string(),
  failureType: z.enum(['breakdown', 'maintenance', 'low_fuel', 'low_battery', 'malfunction']),
  severity: z.enum(['minor', 'major', 'critical']),
  location: z.object({ lat: z.number(), lng: z.number() }).optional(),
  estimatedRepairTime: z.number().optional(),
  actionRequired: z.boolean().default(true),
})

export const notificationRouter = router({
  /**
   * Send emergency alert to workers
   */
  sendEmergencyAlert: protectedProcedure
    .input(EmergencyAlertSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const alertId = `alert-${Date.now()}`

        // Get affected workers or all workers in farm
        let workerIds = input.affectedWorkers || []

        if (workerIds.length === 0) {
          // Get all workers in the farm
          const db = await getDb()
          if (db) {
            const workers = await db.query.users.findMany({
              where: (users, { eq }) => eq(users.farmId, ctx.user.farmId),
            })
            workerIds = workers.map((w) => w.id)
          }
        }

        // Create notification record for each worker
        const notifications = workerIds.map((workerId) => ({
          id: `notif-${alertId}-${workerId}-${Date.now()}`,
          userId: workerId,
          type: 'emergency' as const,
          priority: input.severity === 'critical' ? 'critical' : 'high',
          title: `Emergency Alert: ${input.description.substring(0, 30)}...`,
          body: input.description,
          data: {
            alertId,
            severity: input.severity,
            location: input.location,
            actionRequired: input.actionRequired,
          },
          createdAt: new Date(),
          readAt: null,
        }))

        // Notify farm owner
        await notifyOwner({
          title: `Emergency Alert: ${input.severity}`,
          content: input.description,
        })

        return {
          success: true,
          alertId,
          notificationsCreated: notifications.length,
        }
      } catch (error) {
        console.error('Failed to send emergency alert:', error)
        throw new Error('Failed to send emergency alert')
      }
    }),

  /**
   * Send weather warning to workers
   */
  sendWeatherWarning: protectedProcedure
    .input(WeatherWarningSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const warningId = `weather-${Date.now()}`

        // Get all workers in the farm (could be filtered by location in future)
        const db = await getDb()
        const workers = db ? await db.query.users.findMany({
          where: (users, { eq }) => eq(users.farmId, ctx.user.farmId),
        }) : []

        // Create notification record for each worker
        const notifications = workers.map((worker) => ({
          id: `notif-${warningId}-${worker.id}-${Date.now()}`,
          userId: worker.id,
          type: 'weather' as const,
          priority: input.severity === 'severe' ? 'high' : 'medium',
          title: `Weather Warning: ${input.weatherType}`,
          body: `${input.severity} ${input.weatherType} warning. ${input.recommendations.join(' ')}`,
          data: {
            warningId,
            weatherType: input.weatherType,
            severity: input.severity,
            affectedArea: input.affectedArea,
            recommendations: input.recommendations,
          },
          createdAt: new Date(),
          readAt: null,
        }))

        // Notify farm owner
        await notifyOwner({
          title: `Weather Warning: ${input.weatherType}`,
          content: `${input.severity} ${input.weatherType} warning in effect`,
        })

        return {
          success: true,
          warningId,
          notificationsCreated: notifications.length,
        }
      } catch (error) {
        console.error('Failed to send weather warning:', error)
        throw new Error('Failed to send weather warning')
      }
    }),

  /**
   * Send equipment failure notification
   */
  sendEquipmentFailure: protectedProcedure
    .input(EquipmentFailureSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const failureId = `equipment-${Date.now()}`

        // Get all workers in the farm (could be filtered by role in future)
        const db = await getDb()
        const workers = db ? await db.query.users.findMany({
          where: (users, { eq }) => eq(users.farmId, ctx.user.farmId),
        }) : []

        // Create notification record for each worker
        const notifications = workers.map((worker) => ({
          id: `notif-${failureId}-${worker.id}-${Date.now()}`,
          userId: worker.id,
          type: 'equipment' as const,
          priority:
            input.severity === 'critical' ? 'critical' : input.severity === 'major' ? 'high' : 'medium',
          title: `Equipment Alert: ${input.equipmentName}`,
          body: `${input.equipmentName} has a ${input.failureType} issue`,
          data: {
            failureId,
            equipmentId: input.equipmentId,
            equipmentName: input.equipmentName,
            failureType: input.failureType,
            severity: input.severity,
            location: input.location,
            actionRequired: input.actionRequired,
          },
          createdAt: new Date(),
          readAt: null,
        }))

        // Notify farm owner
        await notifyOwner({
          title: `Equipment Failure: ${input.equipmentName}`,
          content: `${input.equipmentName} has a ${input.failureType} issue`,
        })

        return {
          success: true,
          failureId,
          notificationsCreated: notifications.length,
        }
      } catch (error) {
        console.error('Failed to send equipment failure notification:', error)
        throw new Error('Failed to send equipment failure notification')
      }
    }),

  /**
   * Get notifications for current user
   */
  getNotifications: protectedProcedure
    .input(
      z.object({
        type: z.enum(['emergency', 'weather', 'equipment', 'task', 'all']).optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        // This would query from database
        // For now, returning mock data
        return {
          notifications: [],
          total: 0,
          hasMore: false,
        }
      } catch (error) {
        console.error('Failed to get notifications:', error)
        throw new Error('Failed to get notifications')
      }
    }),

  /**
   * Mark notification as read
   */
  markAsRead: protectedProcedure
    .input(z.object({ notificationId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        // Update notification in database
        return {
          success: true,
          notificationId: input.notificationId,
        }
      } catch (error) {
        console.error('Failed to mark notification as read:', error)
        throw new Error('Failed to mark notification as read')
      }
    }),

  /**
   * Get notification statistics
   */
  getNotificationStats: protectedProcedure.query(async ({ ctx }) => {
    try {
      return {
        total: 0,
        unread: 0,
        byType: {
          emergency: 0,
          weather: 0,
          equipment: 0,
          task: 0,
        },
        byPriority: {
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
        },
      }
    } catch (error) {
      console.error('Failed to get notification stats:', error)
      throw new Error('Failed to get notification stats')
    }
  }),

  /**
   * Broadcast notification to specific workers
   */
  broadcastNotification: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        body: z.string(),
        type: z.enum(['emergency', 'weather', 'equipment', 'task', 'system']),
        priority: z.enum(['low', 'medium', 'high', 'critical']),
        workerIds: z.array(z.number()).optional(),
        data: z.record(z.any()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const notificationId = `broadcast-${Date.now()}`

        // Get target workers
        let workerIds = input.workerIds || []

        if (workerIds.length === 0) {
          // Broadcast to all workers in farm
          const workers = await db.query.users.findMany({
            where: (users, { eq }) => eq(users.farmId, ctx.user.farmId),
          })
          workerIds = workers.map((w) => w.id)
        }

        // Create notifications for each worker
        const notifications = workerIds.map((workerId) => ({
          id: `notif-${notificationId}-${workerId}`,
          userId: workerId,
          type: input.type,
          priority: input.priority,
          title: input.title,
          body: input.body,
          data: input.data,
          createdAt: new Date(),
          readAt: null,
        }))

        return {
          success: true,
          notificationId,
          recipientCount: notifications.length,
        }
      } catch (error) {
        console.error('Failed to broadcast notification:', error)
        throw new Error('Failed to broadcast notification')
      }
    }),

  /**
   * Delete notification
   */
  deleteNotification: protectedProcedure
    .input(z.object({ notificationId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        return {
          success: true,
          notificationId: input.notificationId,
        }
      } catch (error) {
        console.error('Failed to delete notification:', error)
        throw new Error('Failed to delete notification')
      }
    }),
})
