import { router, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { users, userAuthProviders } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { getSessionCookieOptions } from "../_core/cookies";
import { COOKIE_NAME } from "../_core/constants";

export const oauthCallbackRouter = router({
  /**
   * Handle Google OAuth callback
   */
  handleGoogleCallback: publicProcedure
    .input(z.object({
      googleId: z.string(),
      email: z.string().email(),
      name: z.string(),
      picture: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Check if user exists by googleId
      let [existingUser] = await db.select().from(users).where(
        eq(users.googleId, input.googleId)
      );

      if (existingUser) {
        // User exists, update last signed in
        await db.update(users)
          .set({ lastSignedIn: new Date() })
          .where(eq(users.id, existingUser.id));

        return {
          success: true,
          user: existingUser,
          message: "Google login successful",
        };
      }

      // Check if user exists by email
      [existingUser] = await db.select().from(users).where(
        eq(users.email, input.email)
      );

      if (existingUser) {
        // Link Google account to existing user
        await db.update(users)
          .set({
            googleId: input.googleId,
            lastSignedIn: new Date(),
          })
          .where(eq(users.id, existingUser.id));

        // Create auth provider record
        await db.insert(userAuthProviders).values({
          userId: existingUser.id,
          provider: "google",
          providerId: input.googleId,
        });

        return {
          success: true,
          user: existingUser,
          message: "Google account linked to existing user",
        };
      }

      // Create new user with Google OAuth
      const result = await db.insert(users).values({
        googleId: input.googleId,
        email: input.email,
        name: input.name,
        loginMethod: "google",
        role: "farmer", // Default role
        approvalStatus: "pending", // Requires admin approval
        accountStatus: "active",
        emailVerified: true, // Google verifies email
        lastSignedIn: new Date(),
      });

      const newUserId = result.insertId;

      // Create auth provider record
      await db.insert(userAuthProviders).values({
        userId: newUserId,
        provider: "google",
        providerId: input.googleId,
      });

      // Get the newly created user
      const [newUser] = await db.select().from(users).where(
        eq(users.id, newUserId)
      );

      return {
        success: true,
        user: newUser,
        message: "Google account registered successfully",
      };
    }),

  /**
   * Handle Manus OAuth callback
   */
  handleManusCallback: publicProcedure
    .input(z.object({
      openId: z.string(),
      email: z.string().email(),
      name: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Check if user exists by openId
      let [existingUser] = await db.select().from(users).where(
        eq(users.openId, input.openId)
      );

      if (existingUser) {
        // User exists, update last signed in
        await db.update(users)
          .set({ lastSignedIn: new Date() })
          .where(eq(users.id, existingUser.id));

        return {
          success: true,
          user: existingUser,
          message: "Manus login successful",
        };
      }

      // Check if user exists by email
      [existingUser] = await db.select().from(users).where(
        eq(users.email, input.email)
      );

      if (existingUser) {
        // Link Manus account to existing user
        await db.update(users)
          .set({
            openId: input.openId,
            lastSignedIn: new Date(),
          })
          .where(eq(users.id, existingUser.id));

        // Create auth provider record
        await db.insert(userAuthProviders).values({
          userId: existingUser.id,
          provider: "manus",
          providerId: input.openId,
        });

        return {
          success: true,
          user: existingUser,
          message: "Manus account linked to existing user",
        };
      }

      // Create new user with Manus OAuth
      const result = await db.insert(users).values({
        openId: input.openId,
        email: input.email,
        name: input.name,
        loginMethod: "manus",
        role: "farmer", // Default role
        approvalStatus: "pending", // Requires admin approval
        accountStatus: "active",
        emailVerified: true, // Manus verifies email
        lastSignedIn: new Date(),
      });

      const newUserId = result.insertId;

      // Create auth provider record
      await db.insert(userAuthProviders).values({
        userId: newUserId,
        provider: "manus",
        providerId: input.openId,
      });

      // Get the newly created user
      const [newUser] = await db.select().from(users).where(
        eq(users.id, newUserId)
      );

      return {
        success: true,
        user: newUser,
        message: "Manus account registered successfully",
      };
    }),

  /**
   * Link additional OAuth provider to existing user
   */
  linkOAuthProvider: publicProcedure
    .input(z.object({
      provider: z.enum(["google", "manus"]),
      providerId: z.string(),
      email: z.string().email().optional(),
      name: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to link OAuth providers",
        });
      }

      // Check if provider is already linked to another user
      const [existingProvider] = await db.select().from(userAuthProviders).where(
        and(
          eq(userAuthProviders.provider, input.provider),
          eq(userAuthProviders.providerId, input.providerId)
        )
      );

      if (existingProvider && existingProvider.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "This OAuth provider is already linked to another account",
        });
      }

      if (existingProvider) {
        return {
          success: true,
          message: "This OAuth provider is already linked to your account",
        };
      }

      // Create new provider link
      await db.insert(userAuthProviders).values({
        userId: ctx.user.id,
        provider: input.provider,
        providerId: input.providerId,
      });

      // Update user if needed
      if (input.provider === "google") {
        await db.update(users)
          .set({ googleId: input.providerId })
          .where(eq(users.id, ctx.user.id));
      } else if (input.provider === "manus") {
        await db.update(users)
          .set({ openId: input.providerId })
          .where(eq(users.id, ctx.user.id));
      }

      return {
        success: true,
        message: `${input.provider} account linked successfully`,
      };
    }),

  /**
   * Unlink OAuth provider from user account
   */
  unlinkOAuthProvider: publicProcedure
    .input(z.object({
      provider: z.enum(["google", "manus"]),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to unlink OAuth providers",
        });
      }

      // Check if user has other authentication methods
      const [user] = await db.select().from(users).where(eq(users.id, ctx.user.id));
      
      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      // Count active providers
      const providers = await db.select().from(userAuthProviders).where(
        eq(userAuthProviders.userId, ctx.user.id)
      );

      // Check if this is the only provider
      if (providers.length <= 1 && !user.passwordHash) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot unlink the only authentication method. Set a password first.",
        });
      }

      // Delete provider link
      await db.delete(userAuthProviders).where(
        and(
          eq(userAuthProviders.userId, ctx.user.id),
          eq(userAuthProviders.provider, input.provider)
        )
      );

      // Clear provider ID from user
      if (input.provider === "google") {
        await db.update(users)
          .set({ googleId: null })
          .where(eq(users.id, ctx.user.id));
      } else if (input.provider === "manus") {
        await db.update(users)
          .set({ openId: null })
          .where(eq(users.id, ctx.user.id));
      }

      return {
        success: true,
        message: `${input.provider} account unlinked successfully`,
      };
    }),

  /**
   * Get user's linked OAuth providers
   */
  getLinkedProviders: publicProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    if (!ctx.user) {
      return [];
    }

    const providers = await db.select().from(userAuthProviders).where(
      eq(userAuthProviders.userId, ctx.user.id)
    );

    return providers.map(p => ({
      provider: p.provider,
      linkedAt: p.createdAt,
    }));
  }),
});
