import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { getDb } from '../db';
import { fieldWorkerTasks } from '../../drizzle/schema';
import { eq, and, lt } from 'drizzle-orm';

export const taskPriorityEscalationRouter = router({
  /**
   * Automatically escalate task priority based on due date
   * Rules:
   * - If due in 24 hours and priority is LOW/MEDIUM -> escalate to HIGH
   * - If due in 12 hours and priority is HIGH -> escalate to URGENT
   * - If overdue -> escalate to URGENT
   */
  escalateTasksByDueDate: protectedProcedure
    .input(z.object({
      farmId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database connection failed');

      try {
        const now = new Date();
        const in12Hours = new Date(now.getTime() + 12 * 60 * 60 * 1000);
        const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        // Get all pending and in-progress tasks
        const tasks = await db
          .select()
          .from(fieldWorkerTasks)
          .where(
            and(
              eq(fieldWorkerTasks.farmId, input.farmId),
              fieldWorkerTasks.status.notInArray(['completed'])
            )
          );

        const escalations = [];

        for (const task of tasks) {
          const dueDate = new Date(task.dueDate);
          let newPriority = task.priority;
          let escalated = false;

          // Check if overdue
          if (dueDate < now && task.priority !== 'urgent') {
            newPriority = 'urgent';
            escalated = true;
          }
          // Check if due in 12 hours
          else if (dueDate <= in12Hours && task.priority === 'high') {
            newPriority = 'urgent';
            escalated = true;
          }
          // Check if due in 24 hours
          else if (dueDate <= in24Hours && ['low', 'medium'].includes(task.priority)) {
            newPriority = 'high';
            escalated = true;
          }

          if (escalated) {
            await db
              .update(fieldWorkerTasks)
              .set({ priority: newPriority })
              .where(eq(fieldWorkerTasks.id, task.id));

            escalations.push({
              taskId: task.id,
              title: task.title,
              oldPriority: task.priority,
              newPriority: newPriority,
              reason: dueDate < now ? 'overdue' : dueDate <= in12Hours ? 'due_in_12h' : 'due_in_24h',
            });
          }
        }

        return {
          success: true,
          escalatedCount: escalations.length,
          escalations: escalations,
        };
      } catch (error) {
        console.error('Error escalating task priorities:', error);
        throw error;
      }
    }),

  /**
   * Manually escalate a specific task
   */
  escalateTask: protectedProcedure
    .input(z.object({
      taskId: z.number(),
      newPriority: z.enum(['low', 'medium', 'high', 'urgent']),
      reason: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database connection failed');

      try {
        const task = await db
          .select()
          .from(fieldWorkerTasks)
          .where(eq(fieldWorkerTasks.id, input.taskId))
          .limit(1);

        if (task.length === 0) {
          throw new Error('Task not found');
        }

        const oldPriority = task[0].priority;

        // Update task priority
        await db
          .update(fieldWorkerTasks)
          .set({ priority: input.newPriority })
          .where(eq(fieldWorkerTasks.id, input.taskId));

        return {
          success: true,
          taskId: input.taskId,
          oldPriority: oldPriority,
          newPriority: input.newPriority,
          reason: input.reason,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        console.error('Error escalating task:', error);
        throw error;
      }
    }),

  /**
   * Get escalation candidates (tasks that should be escalated)
   */
  getEscalationCandidates: protectedProcedure
    .input(z.object({
      farmId: z.number(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      try {
        const now = new Date();
        const in12Hours = new Date(now.getTime() + 12 * 60 * 60 * 1000);
        const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        const tasks = await db
          .select()
          .from(fieldWorkerTasks)
          .where(
            and(
              eq(fieldWorkerTasks.farmId, input.farmId),
              fieldWorkerTasks.status.notInArray(['completed'])
            )
          );

        const candidates = [];

        for (const task of tasks) {
          const dueDate = new Date(task.dueDate);
          let escalationReason = null;
          let suggestedPriority = null;

          if (dueDate < now && task.priority !== 'urgent') {
            escalationReason = 'overdue';
            suggestedPriority = 'urgent';
          } else if (dueDate <= in12Hours && task.priority === 'high') {
            escalationReason = 'due_in_12_hours';
            suggestedPriority = 'urgent';
          } else if (dueDate <= in24Hours && ['low', 'medium'].includes(task.priority)) {
            escalationReason = 'due_in_24_hours';
            suggestedPriority = 'high';
          }

          if (escalationReason) {
            candidates.push({
              taskId: task.id,
              title: task.title,
              currentPriority: task.priority,
              suggestedPriority: suggestedPriority,
              dueDate: task.dueDate,
              escalationReason: escalationReason,
              hoursUntilDue: Math.round((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60)),
            });
          }
        }

        return candidates.sort((a, b) => a.hoursUntilDue - b.hoursUntilDue);
      } catch (error) {
        console.error('Error getting escalation candidates:', error);
        return [];
      }
    }),

  /**
   * Get escalation history for a task
   */
  getTaskEscalationHistory: protectedProcedure
    .input(z.object({
      taskId: z.number(),
    }))
    .query(async ({ input }) => {
      // This would require a separate escalation_history table
      // For now, returning placeholder
      return {
        taskId: input.taskId,
        escalations: [],
        message: 'Escalation history tracking requires a dedicated table',
      };
    }),
});
