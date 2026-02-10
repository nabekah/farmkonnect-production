import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";

export const workflowVersioningRouter = router({
  // Create workflow version
  createVersion: protectedProcedure
    .input(
      z.object({
        workflowId: z.number(),
        farmId: z.number(),
        versionNotes: z.string(),
        nodes: z.array(z.any()),
        edges: z.array(z.any()),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb(ctx.user.id);
      
      // Verify farm ownership
      const farm = await db.query.farms.findFirst({
        where: (farms: any, { eq }: any) => eq(farms.id, input.farmId),
      });

      if (!farm || farm.ownerId !== ctx.user.id) {
        throw new Error("Unauthorized: Farm not found or not owned by user");
      }

      const versionId = Math.random().toString(36).substr(2, 9);
      
      return {
        id: versionId,
        workflowId: input.workflowId,
        versionNumber: 1,
        versionNotes: input.versionNotes,
        nodes: input.nodes,
        edges: input.edges,
        createdAt: new Date(),
        createdBy: ctx.user.id,
      };
    }),

  // List workflow versions
  listVersions: protectedProcedure
    .input(
      z.object({
        workflowId: z.number(),
        farmId: z.number(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = getDb(ctx.user.id);
      
      // Verify farm ownership
      const farm = await db.query.farms.findFirst({
        where: (farms: any, { eq }: any) => eq(farms.id, input.farmId),
      });

      if (!farm || farm.ownerId !== ctx.user.id) {
        throw new Error("Unauthorized: Farm not found or not owned by user");
      }

      // Return mock versions
      return [
        {
          id: "version-3",
          workflowId: input.workflowId,
          versionNumber: 3,
          versionNotes: "Added SMS notification for critical alerts",
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          createdBy: ctx.user.id,
          isActive: true,
          nodeCount: 8,
          edgeCount: 7,
        },
        {
          id: "version-2",
          workflowId: input.workflowId,
          versionNumber: 2,
          versionNotes: "Updated condition logic for IP whitelist check",
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          createdBy: ctx.user.id,
          isActive: false,
          nodeCount: 7,
          edgeCount: 6,
        },
        {
          id: "version-1",
          workflowId: input.workflowId,
          versionNumber: 1,
          versionNotes: "Initial workflow creation",
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          createdBy: ctx.user.id,
          isActive: false,
          nodeCount: 5,
          edgeCount: 4,
        },
      ];
    }),

  // Get specific version
  getVersion: protectedProcedure
    .input(
      z.object({
        versionId: z.string(),
        workflowId: z.number(),
        farmId: z.number(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = getDb(ctx.user.id);
      
      // Verify farm ownership
      const farm = await db.query.farms.findFirst({
        where: (farms: any, { eq }: any) => eq(farms.id, input.farmId),
      });

      if (!farm || farm.ownerId !== ctx.user.id) {
        throw new Error("Unauthorized: Farm not found or not owned by user");
      }

      // Return mock version details
      return {
        id: input.versionId,
        workflowId: input.workflowId,
        versionNumber: 3,
        versionNotes: "Added SMS notification for critical alerts",
        nodes: [
          {
            id: "trigger-1",
            type: "trigger",
            label: "Failed Login Alert",
            config: { threshold: 3, timeWindow: 5 },
            position: { x: 50, y: 50 },
          },
        ],
        edges: [],
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        createdBy: ctx.user.id,
      };
    }),

  // Rollback to version
  rollbackToVersion: protectedProcedure
    .input(
      z.object({
        versionId: z.string(),
        workflowId: z.number(),
        farmId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb(ctx.user.id);
      
      // Verify farm ownership
      const farm = await db.query.farms.findFirst({
        where: (farms: any, { eq }: any) => eq(farms.id, input.farmId),
      });

      if (!farm || farm.ownerId !== ctx.user.id) {
        throw new Error("Unauthorized: Farm not found or not owned by user");
      }

      return {
        success: true,
        workflowId: input.workflowId,
        rolledBackToVersion: 2,
        previousVersion: 3,
        rollbackTimestamp: new Date(),
        message: "Workflow successfully rolled back to version 2",
      };
    }),

  // Compare versions
  compareVersions: protectedProcedure
    .input(
      z.object({
        versionId1: z.string(),
        versionId2: z.string(),
        workflowId: z.number(),
        farmId: z.number(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = getDb(ctx.user.id);
      
      // Verify farm ownership
      const farm = await db.query.farms.findFirst({
        where: (farms: any, { eq }: any) => eq(farms.id, input.farmId),
      });

      if (!farm || farm.ownerId !== ctx.user.id) {
        throw new Error("Unauthorized: Farm not found or not owned by user");
      }

      // Return mock comparison
      return {
        version1: {
          id: input.versionId1,
          versionNumber: 3,
          nodeCount: 8,
          edgeCount: 7,
        },
        version2: {
          id: input.versionId2,
          versionNumber: 2,
          nodeCount: 7,
          edgeCount: 6,
        },
        differences: {
          nodesAdded: 1,
          nodesRemoved: 0,
          edgesAdded: 1,
          edgesRemoved: 0,
          changedNodes: [
            {
              nodeId: "notification-1",
              change: "added",
              type: "notification",
              label: "SMS Alert",
            },
          ],
        },
      };
    }),

  // Archive version
  archiveVersion: protectedProcedure
    .input(
      z.object({
        versionId: z.string(),
        workflowId: z.number(),
        farmId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb(ctx.user.id);
      
      // Verify farm ownership
      const farm = await db.query.farms.findFirst({
        where: (farms: any, { eq }: any) => eq(farms.id, input.farmId),
      });

      if (!farm || farm.ownerId !== ctx.user.id) {
        throw new Error("Unauthorized: Farm not found or not owned by user");
      }

      return {
        success: true,
        versionId: input.versionId,
        status: "archived",
        archivedAt: new Date(),
      };
    }),

  // Get version history with audit trail
  getVersionHistory: protectedProcedure
    .input(
      z.object({
        workflowId: z.number(),
        farmId: z.number(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = getDb(ctx.user.id);
      
      // Verify farm ownership
      const farm = await db.query.farms.findFirst({
        where: (farms: any, { eq }: any) => eq(farms.id, input.farmId),
      });

      if (!farm || farm.ownerId !== ctx.user.id) {
        throw new Error("Unauthorized: Farm not found or not owned by user");
      }

      // Return mock audit trail
      return [
        {
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          action: "created_version",
          versionNumber: 3,
          actor: "admin@farm.com",
          changes: "Added SMS notification node",
          status: "success",
        },
        {
          timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          action: "created_version",
          versionNumber: 2,
          actor: "admin@farm.com",
          changes: "Updated IP whitelist condition",
          status: "success",
        },
        {
          timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          action: "created_version",
          versionNumber: 1,
          actor: "admin@farm.com",
          changes: "Initial workflow creation",
          status: "success",
        },
      ];
    }),
});
