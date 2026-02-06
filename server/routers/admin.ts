/**
 * Admin Router
 * tRPC procedures for admin operations including validation rule management
 */

import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { getDb } from '../db';
import { validationRules, auditLogs } from '../../drizzle/schema';
import { eq, desc } from 'drizzle-orm';
import { getWebSocketServer } from '../_core/websocket';

// ============================================================================
// VALIDATION RULE PROCEDURES
// ============================================================================

export const adminRouter = router({
  /**
   * Get all validation rules
   */
  getValidationRules: protectedProcedure
    .input(z.object({
      entityType: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      // Check if user is admin
      if (ctx.user?.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins can access validation rules',
        });
      }

      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Database not available',
        });
      }

      let rules;
      if (input.entityType) {
        rules = await db.select().from(validationRules).where(eq(validationRules.entityType, input.entityType));
      } else {
        rules = await db.select().from(validationRules);
      }
      return { rules };
    }),

  /**
   * Create a new validation rule
   */
  createValidationRule: protectedProcedure
    .input(z.object({
      entityType: z.string(),
      fieldName: z.string(),
      ruleType: z.enum(['required', 'min', 'max', 'pattern', 'enum', 'custom']),
      ruleValue: z.string().optional(),
      errorMessage: z.string(),
      isActive: z.boolean().default(true),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check if user is admin
      if (ctx.user?.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins can create validation rules',
        });
      }

      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Database not available',
        });
      }

      try {
        // Insert validation rule
        const result = await db.execute(
          `INSERT INTO validationRules (entityType, fieldName, ruleType, ruleValue, errorMessage, isActive, createdBy, createdAt, updatedAt)
           VALUES (${input.entityType}, ${input.fieldName}, ${input.ruleType}, ${input.ruleValue || null}, ${input.errorMessage}, ${input.isActive ? 1 : 0}, ${ctx.user?.id || 1}, NOW(), NOW())`
        );

        // Log audit trail
        await db.execute(
          `INSERT INTO auditLogs (entityType, entityId, action, changes, changedByUserId, createdAt)
           VALUES ('validationRule', LAST_INSERT_ID(), 'created', ${JSON.stringify(input)}, ${ctx.user?.id || 1}, NOW())`
        );

        // Broadcast to all connected clients
        const wsServer = getWebSocketServer();
        if (wsServer) {
          wsServer.broadcastToAll({
            type: 'validation_rule_created',
            rule: input,
            timestamp: new Date().toISOString(),
          });
        }

        return { success: true, message: 'Validation rule created' };
      } catch (error) {
        console.error('Error creating validation rule:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create validation rule',
        });
      }
    }),

  /**
   * Update a validation rule
   */
  updateValidationRule: protectedProcedure
    .input(z.object({
      ruleId: z.number(),
      entityType: z.string().optional(),
      fieldName: z.string().optional(),
      ruleType: z.enum(['required', 'min', 'max', 'pattern', 'enum', 'custom']).optional(),
      ruleValue: z.string().optional(),
      errorMessage: z.string().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check if user is admin
      if (ctx.user?.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins can update validation rules',
        });
      }

      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Database not available',
        });
      }

      try {
        // Build update query
        const updates: string[] = [];
        if (input.entityType !== undefined) updates.push(`entityType = ${input.entityType}`);
        if (input.fieldName !== undefined) updates.push(`fieldName = ${input.fieldName}`);
        if (input.ruleType !== undefined) updates.push(`ruleType = ${input.ruleType}`);
        if (input.ruleValue !== undefined) updates.push(`ruleValue = ${input.ruleValue}`);
        if (input.errorMessage !== undefined) updates.push(`errorMessage = ${input.errorMessage}`);
        if (input.isActive !== undefined) updates.push(`isActive = ${input.isActive ? 1 : 0}`);
        updates.push(`updatedAt = NOW()`);

        const updateQuery = `UPDATE validationRules SET ${updates.join(', ')} WHERE id = ${input.ruleId}`;
        await db.execute(updateQuery);

        // Log audit trail
        await db.execute(
          `INSERT INTO auditLogs (entityType, entityId, action, changes, changedByUserId, createdAt)
           VALUES ('validationRule', ${input.ruleId}, 'updated', ${JSON.stringify(input)}, ${ctx.user?.id || 1}, NOW())`
        );

        // Broadcast to all connected clients
        const wsServer = getWebSocketServer();
        if (wsServer) {
          wsServer.broadcastToAll({
            type: 'validation_rule_updated',
            ruleId: input.ruleId,
            changes: input,
            timestamp: new Date().toISOString(),
          });
        }

        return { success: true, message: 'Validation rule updated' };
      } catch (error) {
        console.error('Error updating validation rule:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update validation rule',
        });
      }
    }),

  /**
   * Delete a validation rule
   */
  deleteValidationRule: protectedProcedure
    .input(z.object({
      ruleId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check if user is admin
      if (ctx.user?.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins can delete validation rules',
        });
      }

      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Database not available',
        });
      }

      try {
        // Delete validation rule
        await db.execute(`DELETE FROM validationRules WHERE id = ${input.ruleId}`);

        // Log audit trail
        await db.execute(
          `INSERT INTO auditLogs (entityType, entityId, action, changes, changedByUserId, createdAt)
           VALUES ('validationRule', ${input.ruleId}, 'deleted', 'null', ${ctx.user?.id || 1}, NOW())`
        );

        // Broadcast to all connected clients
        const wsServer = getWebSocketServer();
        if (wsServer) {
          wsServer.broadcastToAll({
            type: 'validation_rule_deleted',
            ruleId: input.ruleId,
            timestamp: new Date().toISOString(),
          });
        }

        return { success: true, message: 'Validation rule deleted' };
      } catch (error) {
        console.error('Error deleting validation rule:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete validation rule',
        });
      }
    }),

  /**
   * Broadcast validation rules to all connected clients
   * Used when admin wants to force sync
   */
  syncValidationRules: protectedProcedure
    .mutation(async ({ ctx }) => {
      // Check if user is admin
      if (ctx.user?.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins can sync validation rules',
        });
      }

      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Database not available',
        });
      }

      try {
        // Get all active validation rules
        const rules = await db.select().from(validationRules).where(eq(validationRules.isActive, true));

        // Broadcast to all connected clients
        const wsServer = getWebSocketServer();
        if (wsServer) {
          wsServer.broadcastToAll({
            type: 'validation_rules_sync',
            rules,
            timestamp: new Date().toISOString(),
          });
        }

        return { success: true, message: 'Validation rules synced', rulesCount: rules.length };
      } catch (error) {
        console.error('Error syncing validation rules:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to sync validation rules',
        });
      }
    }),
});
