import { router, protectedProcedure, adminProcedure } from '../_core/trpc'
import { z } from 'zod'
import { TRPCError } from '@trpc/server'

/**
 * Notification Templates Router
 * Manages customizable notification templates for different event types
 */

interface NotificationTemplate {
  id: number
  farmId: number
  eventType: string
  name: string
  subject: string
  body: string
  variables: string[]
  enabled: boolean
  createdAt: Date
  updatedAt: Date
}

// Mock storage - in production would use database
const templates: Map<number, NotificationTemplate> = new Map()
let templateIdCounter = 1

export const notificationTemplatesRouter = router({
  /**
   * Get all templates for a farm
   */
  getTemplates: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ ctx, input }) => {
      try {
        const farmTemplates = Array.from(templates.values()).filter(
          (t) => t.farmId === input.farmId
        )

        return {
          success: true,
          templates: farmTemplates,
          count: farmTemplates.length,
        }
      } catch (error) {
        console.error('[NotificationTemplates] Error getting templates:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get templates',
        })
      }
    }),

  /**
   * Get template by ID
   */
  getTemplate: protectedProcedure
    .input(z.object({ templateId: z.number() }))
    .query(async ({ ctx, input }) => {
      try {
        const template = templates.get(input.templateId)

        if (!template) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Template not found',
          })
        }

        return {
          success: true,
          template,
        }
      } catch (error) {
        console.error('[NotificationTemplates] Error getting template:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get template',
        })
      }
    }),

  /**
   * Create new template
   */
  createTemplate: adminProcedure
    .input(
      z.object({
        farmId: z.number(),
        eventType: z.enum([
          'shift_assignment',
          'task_assignment',
          'task_status_change',
          'approval',
          'compliance_alert',
          'time_off_approval',
        ]),
        name: z.string().min(1),
        subject: z.string().min(1),
        body: z.string().min(1),
        variables: z.array(z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const id = templateIdCounter++
        const template: NotificationTemplate = {
          id,
          farmId: input.farmId,
          eventType: input.eventType,
          name: input.name,
          subject: input.subject,
          body: input.body,
          variables: input.variables,
          enabled: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        templates.set(id, template)

        return {
          success: true,
          template,
          message: 'Template created successfully',
        }
      } catch (error) {
        console.error('[NotificationTemplates] Error creating template:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create template',
        })
      }
    }),

  /**
   * Update template
   */
  updateTemplate: adminProcedure
    .input(
      z.object({
        templateId: z.number(),
        name: z.string().optional(),
        subject: z.string().optional(),
        body: z.string().optional(),
        variables: z.array(z.string()).optional(),
        enabled: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const template = templates.get(input.templateId)

        if (!template) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Template not found',
          })
        }

        const updated: NotificationTemplate = {
          ...template,
          name: input.name ?? template.name,
          subject: input.subject ?? template.subject,
          body: input.body ?? template.body,
          variables: input.variables ?? template.variables,
          enabled: input.enabled ?? template.enabled,
          updatedAt: new Date(),
        }

        templates.set(input.templateId, updated)

        return {
          success: true,
          template: updated,
          message: 'Template updated successfully',
        }
      } catch (error) {
        console.error('[NotificationTemplates] Error updating template:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update template',
        })
      }
    }),

  /**
   * Delete template
   */
  deleteTemplate: adminProcedure
    .input(z.object({ templateId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const template = templates.get(input.templateId)

        if (!template) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Template not found',
          })
        }

        templates.delete(input.templateId)

        return {
          success: true,
          message: 'Template deleted successfully',
        }
      } catch (error) {
        console.error('[NotificationTemplates] Error deleting template:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete template',
        })
      }
    }),

  /**
   * Render template with variables
   */
  renderTemplate: protectedProcedure
    .input(
      z.object({
        templateId: z.number(),
        variables: z.record(z.string(), z.string()),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const template = templates.get(input.templateId)

        if (!template) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Template not found',
          })
        }

        // Replace variables in subject and body
        let subject = template.subject
        let body = template.body

        for (const [key, value] of Object.entries(input.variables)) {
          const placeholder = `{{${key}}}`
          subject = subject.replace(new RegExp(placeholder, 'g'), value)
          body = body.replace(new RegExp(placeholder, 'g'), value)
        }

        return {
          success: true,
          subject,
          body,
          variables: input.variables,
        }
      } catch (error) {
        console.error('[NotificationTemplates] Error rendering template:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to render template',
        })
      }
    }),

  /**
   * Get default templates for event types
   */
  getDefaultTemplates: protectedProcedure.query(async ({ ctx }) => {
    try {
      const defaults = [
        {
          eventType: 'shift_assignment',
          name: 'Shift Assignment',
          subject: 'New Shift Assignment: {{location}}',
          body: 'You have been assigned to a shift at {{location}} on {{date}} from {{startTime}} to {{endTime}}. Please confirm your availability.',
          variables: ['location', 'date', 'startTime', 'endTime'],
        },
        {
          eventType: 'task_assignment',
          name: 'Task Assignment',
          subject: 'New Task: {{taskTitle}}',
          body: 'You have been assigned the task "{{taskTitle}}" at {{location}}. Due date: {{dueDate}}. Priority: {{priority}}.',
          variables: ['taskTitle', 'location', 'dueDate', 'priority'],
        },
        {
          eventType: 'task_status_change',
          name: 'Task Status Update',
          subject: 'Task Status Changed: {{taskTitle}}',
          body: 'The task "{{taskTitle}}" status has changed from {{oldStatus}} to {{newStatus}}.',
          variables: ['taskTitle', 'oldStatus', 'newStatus'],
        },
        {
          eventType: 'approval',
          name: 'Approval Decision',
          subject: 'Your {{requestType}} Request - {{decision}}',
          body: 'Your {{requestType}} request for {{dateRange}} has been {{decision}}. {{reason}}',
          variables: ['requestType', 'dateRange', 'decision', 'reason'],
        },
        {
          eventType: 'compliance_alert',
          name: 'Compliance Alert',
          subject: 'Compliance Alert: {{alertType}}',
          body: 'A compliance issue has been detected: {{message}}. Please take action immediately.',
          variables: ['alertType', 'message'],
        },
        {
          eventType: 'time_off_approval',
          name: 'Time Off Decision',
          subject: 'Time Off Request - {{decision}}',
          body: 'Your time off request from {{startDate}} to {{endDate}} has been {{decision}}.',
          variables: ['decision', 'startDate', 'endDate'],
        },
      ]

      return {
        success: true,
        templates: defaults,
        count: defaults.length,
      }
    } catch (error) {
      console.error('[NotificationTemplates] Error getting default templates:', error)
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get default templates',
      })
    }
  }),

  /**
   * Validate template
   */
  validateTemplate: protectedProcedure
    .input(
      z.object({
        subject: z.string(),
        body: z.string(),
        variables: z.array(z.string()),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const errors: string[] = []

        // Check subject
        if (!input.subject || input.subject.trim().length === 0) {
          errors.push('Subject cannot be empty')
        }

        // Check body
        if (!input.body || input.body.trim().length === 0) {
          errors.push('Body cannot be empty')
        }

        // Check for unmatched variables
        const subjectVars = input.subject.match(/\{\{(\w+)\}\}/g) || []
        const bodyVars = input.body.match(/\{\{(\w+)\}\}/g) || []
        const allVars = new Set([...subjectVars, ...bodyVars])

        for (const varMatch of allVars) {
          const varName = varMatch.replace(/\{\{|\}\}/g, '')
          if (!input.variables.includes(varName)) {
            errors.push(`Variable {{${varName}}} is used but not defined`)
          }
        }

        return {
          success: errors.length === 0,
          errors,
          isValid: errors.length === 0,
        }
      } catch (error) {
        console.error('[NotificationTemplates] Error validating template:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to validate template',
        })
      }
    }),
})
