import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { users, specialistProfiles } from "../drizzle/schema";
import { eq, and, or, like, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

/**
 * Role Management Router
 * Handles user role assignment, specialist profiles, and licensing
 */
export const roleManagementRouter = router({
  // ============================================================================
  // USER ROLE MANAGEMENT
  // ============================================================================

  /**
   * Get all users with their roles and specialist profiles
   */
  getAllUsers: protectedProcedure
    .input(
      z
        .object({
          role: z.enum(["farmer", "agent", "veterinarian", "buyer", "transporter", "admin", "user"]).optional(),
          search: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      let query = db.select().from(users);

      // Filter by role if provided
      if (input?.role) {
        query = query.where(eq(users.role, input.role)) as any;
      }

      // Search by name or email
      if (input?.search) {
        query = query.where(
          or(like(users.name, `%${input.search}%`), like(users.email, `%${input.search}%`))
        ) as any;
      }

      const allUsers = await query.orderBy(desc(users.createdAt));

      // Get specialist profiles for agents and vets
      const userIds = allUsers.map((u) => u.id);
      const profiles = await db
        .select()
        .from(specialistProfiles)
        .where(
          or(
            ...userIds.map((id) => eq(specialistProfiles.userId, id))
          )
        );

      // Merge profiles with users
      return allUsers.map((user) => ({
        ...user,
        specialistProfile: profiles.find((p) => p.userId === user.id),
      }));
    }),

  /**
   * Update user role (admin only)
   */
  updateUserRole: protectedProcedure
    .input(
      z.object({
        userId: z.number(),
        role: z.enum(["farmer", "agent", "veterinarian", "buyer", "transporter", "admin", "user"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Only admins can change roles
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can change user roles",
        });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db.update(users).set({ role: input.role }).where(eq(users.id, input.userId));

      return { success: true };
    }),

  /**
   * Get current user's role and permissions
   */
  getMyRole: protectedProcedure.query(async ({ ctx }) => {
    return {
      role: ctx.user.role,
      permissions: getRolePermissions(ctx.user.role),
    };
  }),

  // ============================================================================
  // SPECIALIST PROFILE MANAGEMENT
  // ============================================================================

  /**
   * Create or update specialist profile
   */
  upsertSpecialistProfile: protectedProcedure
    .input(
      z.object({
        licenseNumber: z.string().optional(),
        specialization: z.string().optional(),
        licenseExpiryDate: z.string().optional(), // ISO date string
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Check if user is agent or veterinarian
      if (ctx.user.role !== "agent" && ctx.user.role !== "veterinarian") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only agents and veterinarians can have specialist profiles",
        });
      }

      // Check if profile exists
      const existing = await db
        .select()
        .from(specialistProfiles)
        .where(eq(specialistProfiles.userId, ctx.user.id));

      if (existing.length > 0) {
        // Update existing profile
        await db
          .update(specialistProfiles)
          .set({
            licenseNumber: input.licenseNumber,
            specialization: input.specialization,
            licenseExpiryDate: input.licenseExpiryDate ? new Date(input.licenseExpiryDate) : undefined,
          })
          .where(eq(specialistProfiles.userId, ctx.user.id));
      } else {
        // Create new profile
        await db.insert(specialistProfiles).values({
          userId: ctx.user.id,
          licenseNumber: input.licenseNumber || undefined,
          specialization: input.specialization || undefined,
          licenseExpiryDate: input.licenseExpiryDate ? new Date(input.licenseExpiryDate) : undefined,
          accreditationStatus: "pending",
        });
      }

      return { success: true };
    }),

  /**
   * Get specialist profile by user ID
   */
  getSpecialistProfile: protectedProcedure
    .input(z.object({ userId: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return null;

      const userId = input.userId || ctx.user.id;

      const profiles = await db
        .select()
        .from(specialistProfiles)
        .where(eq(specialistProfiles.userId, userId));

      return profiles[0] || null;
    }),

  /**
   * Update accreditation status (admin only)
   */
  updateAccreditationStatus: protectedProcedure
    .input(
      z.object({
        profileId: z.number(),
        status: z.enum(["pending", "verified", "expired", "revoked"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can update accreditation status",
        });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db
        .update(specialistProfiles)
        .set({ accreditationStatus: input.status })
        .where(eq(specialistProfiles.id, input.profileId));

      return { success: true };
    }),

  /**
   * Get all specialists (agents and veterinarians)
   */
  getAllSpecialists: protectedProcedure
    .input(
      z
        .object({
          type: z.enum(["agent", "veterinarian"]).optional(),
          accreditationStatus: z.enum(["pending", "verified", "expired", "revoked"]).optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      // Get users with specialist roles
      let userQuery = db.select().from(users);

      if (input?.type) {
        userQuery = userQuery.where(eq(users.role, input.type)) as any;
      } else {
        userQuery = userQuery.where(or(eq(users.role, "agent"), eq(users.role, "veterinarian"))) as any;
      }

      const specialists = await userQuery;

      // Get their profiles
      const userIds = specialists.map((s) => s.id);
      let profileQuery = db.select().from(specialistProfiles);

      if (userIds.length > 0) {
        profileQuery = profileQuery.where(
          or(...userIds.map((id) => eq(specialistProfiles.userId, id)))
        ) as any;
      }

      if (input?.accreditationStatus) {
        profileQuery = profileQuery.where(
          eq(specialistProfiles.accreditationStatus, input.accreditationStatus)
        ) as any;
      }

      const profiles = await profileQuery;

      // Merge
      return specialists.map((specialist) => ({
        ...specialist,
        profile: profiles.find((p) => p.userId === specialist.id),
      }));
    }),
});

/**
 * Helper function to get role permissions
 */
function getRolePermissions(role: string) {
  const permissions: Record<string, string[]> = {
    admin: ["all"],
    farmer: ["manage_own_farms", "manage_own_crops", "manage_own_animals", "view_marketplace", "create_orders"],
    agent: [
      "view_all_farms",
      "create_training",
      "manage_training",
      "view_farmers",
      "create_reports",
      "view_merl",
    ],
    veterinarian: [
      "view_all_animals",
      "manage_health_records",
      "manage_vaccinations",
      "create_reports",
      "view_merl",
    ],
    buyer: ["view_marketplace", "create_orders", "view_products", "manage_own_orders"],
    transporter: ["view_transport_requests", "manage_deliveries", "update_delivery_status"],
    user: ["view_own_data"],
  };

  return permissions[role] || [];
}
