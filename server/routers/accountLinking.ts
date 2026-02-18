import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { users, userAuthProviders } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const accountLinkingRouter = router({
  // Get all auth providers linked to current user
  getLinkedProviders: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const providers = await db.query.userAuthProviders.findMany({
      where: eq(userAuthProviders.userId, ctx.user.id),
    });
    return providers;
  }),

  // Link Google account to existing Manus account
  linkGoogleAccount: protectedProcedure
    .input(
      z.object({
        googleId: z.string(),
        googleEmail: z.string().email(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      // Check if this Google ID is already linked to another account
      const existingLink = await db.query.users.findFirst({
        where: eq(users.googleId, input.googleId),
      });

      if (existingLink && existingLink.id !== ctx.user.id) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "This Google account is already linked to another FarmKonnect account",
        });
      }

      // Update user with Google ID
      await db
        .update(users)
        .set({
          googleId: input.googleId,
          email: input.googleEmail, // Update email if different
        })
        .where(eq(users.id, ctx.user.id));

      // Add auth provider record
      const existingProvider = await db.query.userAuthProviders.findFirst({
        where: and(
          eq(userAuthProviders.userId, ctx.user.id),
          eq(userAuthProviders.provider, "google")
        ),
      })

      if (!existingProvider) {
        await db.insert(userAuthProviders).values({
          userId: ctx.user.id,
          provider: "google",
          providerId: input.googleId,
          email: input.googleEmail,
          linkedAt: new Date(),
        });
      }

      return { success: true, message: "Google account linked successfully" };
    }),

  // Link Manus account to existing Google account
  linkManusAccount: protectedProcedure
    .input(
      z.object({
        manusId: z.string(),
        manusEmail: z.string().email(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      // Add auth provider record for Manus
      const existingProvider = await db.query.userAuthProviders.findFirst({
        where: and(
          eq(userAuthProviders.userId, ctx.user.id),
          eq(userAuthProviders.provider, "manus")
        ),
      });

      if (!existingProvider) {
        await db.insert(userAuthProviders).values({
          userId: ctx.user.id,
          provider: "manus",
          providerId: input.manusId,
          email: input.manusEmail,
          linkedAt: new Date(),
        });
      }

      return { success: true, message: "Manus account linked successfully" };
    }),

  // Unlink an authentication provider
  unlinkProvider: protectedProcedure
    .input(
      z.object({
        provider: z.enum(["google", "manus"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      // Get all providers for this user
      const providers = await db.query.userAuthProviders.findMany({
        where: eq(userAuthProviders.userId, ctx.user.id),
      });

      // Ensure user has at least one provider remaining
      if (providers.length <= 1) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You must keep at least one authentication method linked",
        });
      }

      // Delete the provider
      await db
        .delete(userAuthProviders)
        .where(
          and(
            eq(userAuthProviders.userId, ctx.user.id),
            eq(userAuthProviders.provider, input.provider)
          )
        );

      // If unlinking Google, remove googleId from user
      if (input.provider === "google") {
        await db
          .update(users)
          .set({ googleId: null })
          .where(eq(users.id, ctx.user.id));
      }

      return { success: true, message: `${input.provider} account unlinked successfully` };
    }),

  // Check if an email is already linked to an account
  checkEmailExists: protectedProcedure
    .input(z.object({ email: z.string().email() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const user = await db.query.users.findFirst({
        where: eq(users.email, input.email),
      });
      return { exists: !!user, isCurrentUser: user?.id === ctx.user.id };
    }),

  // Get account linking status
  getLinkingStatus: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const user = await db.query.users.findFirst({
      where: eq(users.id, ctx.user.id),
    });

    const providers = await db.query.userAuthProviders.findMany({
      where: eq(userAuthProviders.userId, ctx.user.id),
    });

    return {
      email: user?.email,
      googleId: user?.googleId,
      providers: providers.map((p) => ({
        provider: p.provider,
        email: p.email,
        linkedAt: p.linkedAt,
      })),
      canUnlink: providers.length > 1,
    };
  }),
});
