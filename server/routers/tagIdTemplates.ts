import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { sql } from "drizzle-orm";

export const tagIdTemplatesRouter = router({
  // Create a new tag ID template
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "Template name is required"),
        prefix: z.string().min(1, "Prefix is required"),
        description: z.string().optional(),
        paddingLength: z.number().int().min(1).max(10).default(3),
        startNumber: z.number().int().min(0).default(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const result = await db.execute(
        sql`
          INSERT INTO tagIdTemplates (userId, farmId, name, prefix, description, paddingLength, startNumber, createdAt)
          VALUES (${ctx.user.id}, ${ctx.user.farmId || 1}, ${input.name}, ${input.prefix}, ${input.description || null}, ${input.paddingLength}, ${input.startNumber}, NOW())
        `
      );

      return {
        id: (result as any).insertId,
        name: input.name,
        prefix: input.prefix,
      };
    }),

  // Get all templates for the user
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    const templates = await db.execute(
      sql`
        SELECT id, name, prefix, description, paddingLength, startNumber, createdAt
        FROM tagIdTemplates
        WHERE userId = ${ctx.user.id}
        ORDER BY createdAt DESC
      `
    );

    return (templates as any).rows || [];
  }),

  // Get a specific template
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const template = await db.execute(
        sql`
          SELECT id, name, prefix, description, paddingLength, startNumber, createdAt
          FROM tagIdTemplates
          WHERE id = ${input.id} AND userId = ${ctx.user.id}
          LIMIT 1
        `
      );

      const rows = (template as any).rows || [];
      return rows[0] || null;
    }),

  // Update a template
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        prefix: z.string().min(1).optional(),
        description: z.string().optional(),
        paddingLength: z.number().int().min(1).max(10).optional(),
        startNumber: z.number().int().min(0).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const updates: string[] = [];
      const values: any[] = [];

      if (input.name !== undefined) {
        updates.push("name = ?");
        values.push(input.name);
      }
      if (input.prefix !== undefined) {
        updates.push("prefix = ?");
        values.push(input.prefix);
      }
      if (input.description !== undefined) {
        updates.push("description = ?");
        values.push(input.description);
      }
      if (input.paddingLength !== undefined) {
        updates.push("paddingLength = ?");
        values.push(input.paddingLength);
      }
      if (input.startNumber !== undefined) {
        updates.push("startNumber = ?");
        values.push(input.startNumber);
      }

      if (updates.length === 0) {
        throw new Error("No fields to update");
      }

      values.push(input.id);
      values.push(ctx.user.id);

      await db.execute(
        sql`
          UPDATE tagIdTemplates
          SET ${sql.raw(updates.join(", "))}
          WHERE id = ? AND userId = ?
        `,
        values
      );

      return { success: true };
    }),

  // Delete a template
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      await db.execute(
        sql`
          DELETE FROM tagIdTemplates
          WHERE id = ${input.id} AND userId = ${ctx.user.id}
        `
      );

      return { success: true };
    }),

  // Generate tag IDs from a template
  generateTagIds: protectedProcedure
    .input(
      z.object({
        templateId: z.number(),
        count: z.number().int().min(1).max(1000),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const template = await db.execute(
        sql`
          SELECT prefix, paddingLength, startNumber
          FROM tagIdTemplates
          WHERE id = ${input.templateId} AND userId = ${ctx.user.id}
          LIMIT 1
        `
      );

      const rows = (template as any).rows || [];
      if (rows.length === 0) {
        throw new Error("Template not found");
      }

      const { prefix, paddingLength, startNumber } = rows[0];

      const tagIds: string[] = [];
      for (let i = 0; i < input.count; i++) {
        const number = startNumber + i;
        const paddedNumber = String(number).padStart(paddingLength, "0");
        tagIds.push(`${prefix}-${paddedNumber}`);
      }

      return tagIds;
    }),
});
