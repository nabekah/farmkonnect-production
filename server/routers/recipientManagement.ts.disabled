import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { recipientGroupService } from "../_core/recipientGroupService";
import { TRPCError } from "@trpc/server";

export const recipientManagementRouter = router({
  // ============================================================================
  // GROUP MANAGEMENT
  // ============================================================================

  createGroup: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        name: z.string().min(1, "Group name is required"),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const groupId = await recipientGroupService.createGroup(
          input.farmId,
          input.name,
          input.description
        );

        return {
          success: true,
          groupId,
          message: "Recipient group created successfully",
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to create recipient group: ${error}`,
        });
      }
    }),

  getGroup: protectedProcedure
    .input(z.object({ groupId: z.number() }))
    .query(async ({ input }) => {
      try {
        const group = await recipientGroupService.getGroup(input.groupId);

        if (!group) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Recipient group not found",
          });
        }

        return group;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch recipient group: ${error}`,
        });
      }
    }),

  getGroupsForFarm: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ input }) => {
      try {
        const groups = await recipientGroupService.getGroupsForFarm(input.farmId);
        return groups;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch recipient groups: ${error}`,
        });
      }
    }),

  updateGroup: protectedProcedure
    .input(
      z.object({
        groupId: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const updated = await recipientGroupService.updateGroup(input.groupId, {
          name: input.name,
          description: input.description,
          isActive: input.isActive,
        });

        return {
          success: true,
          group: updated,
          message: "Recipient group updated successfully",
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to update recipient group: ${error}`,
        });
      }
    }),

  deleteGroup: protectedProcedure
    .input(z.object({ groupId: z.number() }))
    .mutation(async ({ input }) => {
      try {
        await recipientGroupService.deleteGroup(input.groupId);

        return {
          success: true,
          message: "Recipient group deleted successfully",
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to delete recipient group: ${error}`,
        });
      }
    }),

  cloneGroup: protectedProcedure
    .input(
      z.object({
        groupId: z.number(),
        newName: z.string().min(1, "New group name is required"),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const newGroupId = await recipientGroupService.cloneGroup(
          input.groupId,
          input.newName
        );

        return {
          success: true,
          groupId: newGroupId,
          message: "Recipient group cloned successfully",
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to clone recipient group: ${error}`,
        });
      }
    }),

  // ============================================================================
  // MEMBER MANAGEMENT
  // ============================================================================

  addMember: protectedProcedure
    .input(
      z.object({
        groupId: z.number(),
        email: z.string().email("Invalid email address"),
        name: z.string().optional(),
        role: z.string().optional(),
        isPrimary: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const memberId = await recipientGroupService.addMember(
          input.groupId,
          input.email,
          input.name,
          input.role,
          input.isPrimary || false
        );

        return {
          success: true,
          memberId,
          message: "Member added to recipient group successfully",
        };
      } catch (error: any) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error.message || `Failed to add member: ${error}`,
        });
      }
    }),

  removeMember: protectedProcedure
    .input(z.object({ memberId: z.number() }))
    .mutation(async ({ input }) => {
      try {
        await recipientGroupService.removeMember(input.memberId);

        return {
          success: true,
          message: "Member removed from recipient group successfully",
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to remove member: ${error}`,
        });
      }
    }),

  updateMember: protectedProcedure
    .input(
      z.object({
        memberId: z.number(),
        name: z.string().optional(),
        role: z.string().optional(),
        isPrimary: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        await recipientGroupService.updateMember(input.memberId, {
          name: input.name,
          role: input.role,
          isPrimary: input.isPrimary,
        });

        return {
          success: true,
          message: "Member updated successfully",
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to update member: ${error}`,
        });
      }
    }),

  addMembers: protectedProcedure
    .input(
      z.object({
        groupId: z.number(),
        members: z.array(
          z.object({
            email: z.string().email(),
            name: z.string().optional(),
            role: z.string().optional(),
            isPrimary: z.boolean().optional(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const insertedIds = await recipientGroupService.addMembers(
          input.groupId,
          input.members
        );

        return {
          success: true,
          insertedCount: insertedIds.length,
          message: `${insertedIds.length} members added to recipient group`,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to add members: ${error}`,
        });
      }
    }),

  getGroupEmails: protectedProcedure
    .input(z.object({ groupId: z.number() }))
    .query(async ({ input }) => {
      try {
        const emails = await recipientGroupService.getGroupEmails(input.groupId);
        return emails;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch group emails: ${error}`,
        });
      }
    }),

  // ============================================================================
  // STATISTICS
  // ============================================================================

  getGroupStats: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ input }) => {
      try {
        const stats = await recipientGroupService.getGroupStats(input.farmId);
        return stats;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch group statistics: ${error}`,
        });
      }
    }),
});
