import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { getDb } from '../db';
import { sql, eq, and } from 'drizzle-orm';

// Define task dependencies table schema
export const taskDependencies = {
  id: 'id',
  taskId: 'taskId',
  dependsOnTaskId: 'dependsOnTaskId',
  createdAt: 'createdAt',
};

export const taskDependenciesRouter = router({
  /**
   * Add a dependency between two tasks
   */
  addDependency: protectedProcedure
    .input(
      z.object({
        taskId: z.string(),
        dependsOnTaskId: z.string(),
        farmId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      // Check for circular dependency
      const circularCheck = await db.execute(
        sql`
          WITH RECURSIVE task_deps AS (
            SELECT taskId, dependsOnTaskId FROM taskDependencies 
            WHERE taskId = ${input.dependsOnTaskId}
            UNION ALL
            SELECT td.taskId, td.dependsOnTaskId FROM taskDependencies td
            JOIN task_deps ON td.dependsOnTaskId = task_deps.taskId
          )
          SELECT COUNT(*) as count FROM task_deps WHERE taskId = ${input.taskId}
        `
      );

      if (circularCheck && Object.values(circularCheck)[0] > 0) {
        return {
          success: false,
          error: 'Circular dependency detected. Task cannot depend on a task that depends on it.',
        };
      }

      // Check if dependency already exists
      const existing = await db.execute(
        sql`
          SELECT COUNT(*) as count FROM taskDependencies 
          WHERE taskId = ${input.taskId} AND dependsOnTaskId = ${input.dependsOnTaskId}
        `
      );

      if (existing && Object.values(existing)[0] > 0) {
        return {
          success: false,
          error: 'Dependency already exists',
        };
      }

      // Add dependency
      await db.execute(
        sql`
          INSERT INTO taskDependencies (taskId, dependsOnTaskId, createdAt)
          VALUES (${input.taskId}, ${input.dependsOnTaskId}, NOW())
        `
      );

      return {
        success: true,
        message: 'Dependency added successfully',
      };
    }),

  /**
   * Remove a dependency between two tasks
   */
  removeDependency: protectedProcedure
    .input(
      z.object({
        taskId: z.string(),
        dependsOnTaskId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      await db.execute(
        sql`
          DELETE FROM taskDependencies 
          WHERE taskId = ${input.taskId} AND dependsOnTaskId = ${input.dependsOnTaskId}
        `
      );

      return {
        success: true,
        message: 'Dependency removed successfully',
      };
    }),

  /**
   * Get all dependencies for a task
   */
  getTaskDependencies: protectedProcedure
    .input(z.object({ taskId: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();

      const dependencies = await db.execute(
        sql`
          SELECT td.dependsOnTaskId, t.title, t.status, t.dueDate
          FROM taskDependencies td
          JOIN tasks t ON td.dependsOnTaskId = t.id
          WHERE td.taskId = ${input.taskId}
        `
      );

      return dependencies || [];
    }),

  /**
   * Get all tasks that depend on a given task
   */
  getDependentTasks: protectedProcedure
    .input(z.object({ taskId: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();

      const dependents = await db.execute(
        sql`
          SELECT td.taskId, t.title, t.status, t.dueDate
          FROM taskDependencies td
          JOIN tasks t ON td.taskId = t.id
          WHERE td.dependsOnTaskId = ${input.taskId}
        `
      );

      return dependents || [];
    }),

  /**
   * Check if a task can be started (all dependencies completed)
   */
  canStartTask: protectedProcedure
    .input(z.object({ taskId: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();

      const incompleteDeps = await db.execute(
        sql`
          SELECT COUNT(*) as count FROM taskDependencies td
          JOIN tasks t ON td.dependsOnTaskId = t.id
          WHERE td.taskId = ${input.taskId} AND t.status != 'completed'
        `
      );

      const count = incompleteDeps ? Object.values(incompleteDeps)[0] : 0;
      const canStart = count === 0;

      return {
        canStart,
        incompleteDependencies: count,
        message: canStart
          ? 'All dependencies are completed'
          : `${count} dependencies are not yet completed`,
      };
    }),

  /**
   * Get dependency graph for visualization
   */
  getDependencyGraph: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();

      const edges = await db.execute(
        sql`
          SELECT td.taskId, td.dependsOnTaskId, t1.title as taskTitle, t2.title as dependsOnTitle
          FROM taskDependencies td
          JOIN tasks t1 ON td.taskId = t1.id
          JOIN tasks t2 ON td.dependsOnTaskId = t2.id
          WHERE t1.farmId = ${input.farmId}
        `
      );

      const nodes = await db.execute(
        sql`
          SELECT DISTINCT id, title, status FROM tasks WHERE farmId = ${input.farmId}
        `
      );

      return {
        nodes: nodes || [],
        edges: edges || [],
      };
    }),

  /**
   * Get dependency statistics for a farm
   */
  getDependencyStats: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();

      const totalDeps = await db.execute(
        sql`
          SELECT COUNT(*) as count FROM taskDependencies td
          JOIN tasks t ON td.taskId = t.id
          WHERE t.farmId = ${input.farmId}
        `
      );

      const tasksWithDeps = await db.execute(
        sql`
          SELECT COUNT(DISTINCT taskId) as count FROM taskDependencies td
          JOIN tasks t ON td.taskId = t.id
          WHERE t.farmId = ${input.farmId}
        `
      );

      const blockedTasks = await db.execute(
        sql`
          SELECT COUNT(DISTINCT td.taskId) as count FROM taskDependencies td
          JOIN tasks t1 ON td.taskId = t1.id
          JOIN tasks t2 ON td.dependsOnTaskId = t2.id
          WHERE t1.farmId = ${input.farmId} AND t2.status != 'completed'
        `
      );

      return {
        totalDependencies: totalDeps ? Object.values(totalDeps)[0] : 0,
        tasksWithDependencies: tasksWithDeps ? Object.values(tasksWithDeps)[0] : 0,
        blockedTasks: blockedTasks ? Object.values(blockedTasks)[0] : 0,
      };
    }),
});
