import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { getDb } from '../db';
import { sql, eq } from 'drizzle-orm';
import { fieldWorkerTasks, taskTemplates as taskTemplatesTable } from '../../drizzle/schema';

export const taskTemplatesRouter = router({
  /**
   * Create a new task template
   */
  createTemplate: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, 'Template name is required'),
        description: z.string().optional(),
        taskType: z.string(),
        priority: z.enum(['low', 'medium', 'high', 'urgent']),
        estimatedHours: z.number().positive(),
        farmId: z.number(),
        schedule: z.enum(['once', 'daily', 'weekly', 'monthly']).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      const result = await db.execute(
        sql`
          INSERT INTO taskTemplates (name, description, taskType, priority, estimatedHours, farmId, schedule, createdAt, updatedAt)
          VALUES (${input.name}, ${input.description || ''}, ${input.taskType}, ${input.priority}, ${input.estimatedHours}, ${input.farmId}, ${input.schedule || 'once'}, NOW(), NOW())
        `
      );

      return {
        success: true,
        templateId: result.insertId,
        message: 'Template created successfully',
      };
    }),

  /**
   * Get all templates for a farm
   */
  getTemplates: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();

      const templates = await db.execute(
        sql`
          SELECT id, name, description, taskType, priority, estimatedHours, schedule, createdAt
          FROM taskTemplates
          WHERE farmId = ${input.farmId}
          ORDER BY createdAt DESC
        `
      );

      return templates || [];
    }),

  /**
   * Get a specific template
   */
  getTemplate: protectedProcedure
    .input(z.object({ templateId: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();

      const template = await db.execute(
        sql`
          SELECT * FROM taskTemplates WHERE id = ${input.templateId}
        `
      );

      return template?.[0] || null;
    }),

  /**
   * Update a template
   */
  updateTemplate: protectedProcedure
    .input(
      z.object({
        templateId: z.string(),
        name: z.string().optional(),
        description: z.string().optional(),
        taskType: z.string().optional(),
        priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
        estimatedHours: z.number().positive().optional(),
        schedule: z.enum(['once', 'daily', 'weekly', 'monthly']).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      const updates = [];
      if (input.name) updates.push(`name = '${input.name}'`);
      if (input.description) updates.push(`description = '${input.description}'`);
      if (input.taskType) updates.push(`taskType = '${input.taskType}'`);
      if (input.priority) updates.push(`priority = '${input.priority}'`);
      if (input.estimatedHours) updates.push(`estimatedHours = ${input.estimatedHours}`);
      if (input.schedule) updates.push(`schedule = '${input.schedule}'`);

      if (updates.length === 0) {
        return { success: false, error: 'No fields to update' };
      }

      updates.push(`updatedAt = NOW()`);

      await db.execute(
        sql.raw(`UPDATE taskTemplates SET ${updates.join(', ')} WHERE id = '${input.templateId}'`)
      );

      return {
        success: true,
        message: 'Template updated successfully',
      };
    }),

  /**
   * Delete a template
   */
  deleteTemplate: protectedProcedure
    .input(z.object({ templateId: z.string() }))
    .mutation(async ({ input }) => {
      const db = getDb();

      await db.execute(
        sql`DELETE FROM taskTemplates WHERE id = ${input.templateId}`
      );

      return {
        success: true,
        message: 'Template deleted successfully',
      };
    }),

  /**
   * Create tasks from a template
   */
  createTasksFromTemplate: protectedProcedure
    .input(
      z.object({
        templateId: z.string(),
        workerIds: z.array(z.string()).min(1),
        dueDate: z.string(),
        farmId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      // Get template
      const templateResult = await db.execute(
        sql`SELECT * FROM taskTemplates WHERE id = ${input.templateId}`
      );

      if (!templateResult || templateResult.length === 0) {
        return { success: false, error: 'Template not found' };
      }

      const template = templateResult[0];
      const createdTasks = [];
      const errors = [];

      // Create task for each worker
      for (const workerId of input.workerIds) {
        try {
          const newTask = await db.insert(fieldWorkerTasks).values({
            title: template.name,
            description: template.description || '',
            workerId: workerId,
            workerName: '',
            taskType: template.taskType,
            priority: template.priority,
            status: 'pending',
            dueDate: input.dueDate,
            estimatedHours: template.estimatedHours,
            actualHours: 0,
            farmId: input.farmId,
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          createdTasks.push({
            workerId,
            taskId: newTask[0].insertId,
          });
        } catch (error) {
          errors.push({
            workerId,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      return {
        success: errors.length === 0,
        createdCount: createdTasks.length,
        failedCount: errors.length,
        createdTasks,
        errors,
        message: `Created ${createdTasks.length} task(s) from template`,
      };
    }),

  /**
   * Get template usage statistics
   */
  getTemplateStats: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();

      const totalTemplates = await db.execute(
        sql`SELECT COUNT(*) as count FROM taskTemplates WHERE farmId = ${input.farmId}`
      );

      const dailyTemplates = await db.execute(
        sql`SELECT COUNT(*) as count FROM taskTemplates WHERE farmId = ${input.farmId} AND schedule = 'daily'`
      );

      const weeklyTemplates = await db.execute(
        sql`SELECT COUNT(*) as count FROM taskTemplates WHERE farmId = ${input.farmId} AND schedule = 'weekly'`
      );

      const monthlyTemplates = await db.execute(
        sql`SELECT COUNT(*) as count FROM taskTemplates WHERE farmId = ${input.farmId} AND schedule = 'monthly'`
      );

      return {
        totalTemplates: totalTemplates ? Object.values(totalTemplates)[0] : 0,
        dailyTemplates: dailyTemplates ? Object.values(dailyTemplates)[0] : 0,
        weeklyTemplates: weeklyTemplates ? Object.values(weeklyTemplates)[0] : 0,
        monthlyTemplates: monthlyTemplates ? Object.values(monthlyTemplates)[0] : 0,
      };
    }),

  /**
   * Create template from existing task
   */
  createTemplateFromTask: protectedProcedure
    .input(
      z.object({
        taskId: z.string(),
        templateName: z.string().min(1),
        schedule: z.enum(['once', 'daily', 'weekly', 'monthly']).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      // Get task
      const taskResult = await db.execute(
        sql`SELECT * FROM tasks WHERE id = ${input.taskId}`
      );

      if (!taskResult || taskResult.length === 0) {
        return { success: false, error: 'Task not found' };
      }

      const task = taskResult[0];

      // Create template
      const result = await db.execute(
        sql`
          INSERT INTO taskTemplates (name, description, taskType, priority, estimatedHours, farmId, schedule, createdAt, updatedAt)
          VALUES (${input.templateName}, ${task.description || ''}, ${task.taskType}, ${task.priority}, ${task.estimatedHours}, ${task.farmId}, ${input.schedule || 'once'}, NOW(), NOW())
        `
      );

      return {
        success: true,
        templateId: result.insertId,
        message: 'Template created from task successfully',
      };
    }),
});
