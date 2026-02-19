import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { userSessions } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const sessionManagementRouter = router({
  // Get all active sessions for current user
  getActiveSessions: protectedProcedure.query(async ({ ctx }) => {
    const db = getDb();

    const sessions = await db
      .select()
      .from(userSessions)
      .where(
        and(
          eq(userSessions.userId, ctx.user.id),
          eq(userSessions.isActive, true)
        )
      )
      .orderBy(desc(userSessions.lastActivity));

    return sessions.map((session) => ({
      id: session.id,
      deviceName: session.deviceName || "Unknown Device",
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      lastActivity: session.lastActivity,
      createdAt: session.createdAt,
      isCurrent: session.sessionToken === ctx.sessionToken,
    }));
  }),

  // Get session details
  getSessionDetails: protectedProcedure
    .input(z.object({ sessionId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();

      const session = await db
        .select()
        .from(userSessions)
        .where(
          and(
            eq(userSessions.id, input.sessionId),
            eq(userSessions.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!session.length) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Session not found",
        });
      }

      const s = session[0];
      return {
        id: s.id,
        deviceName: s.deviceName || "Unknown Device",
        ipAddress: s.ipAddress,
        userAgent: s.userAgent,
        deviceFingerprint: s.deviceFingerprint,
        lastActivity: s.lastActivity,
        createdAt: s.createdAt,
        expiresAt: s.expiresAt,
        isActive: s.isActive,
        isCurrent: s.sessionToken === ctx.sessionToken,
      };
    }),

  // Logout from specific session (remote logout)
  logoutSession: protectedProcedure
    .input(z.object({ sessionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      const session = await db
        .select()
        .from(userSessions)
        .where(
          and(
            eq(userSessions.id, input.sessionId),
            eq(userSessions.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!session.length) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Session not found",
        });
      }

      // Cannot logout current session
      if (session[0].sessionToken === ctx.sessionToken) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot logout current session. Use logout instead.",
        });
      }

      // Deactivate the session
      await db
        .update(userSessions)
        .set({ isActive: false })
        .where(eq(userSessions.id, input.sessionId));

      return {
        success: true,
        message: "Session logged out successfully",
      };
    }),

  // Logout from all other sessions
  logoutAllOtherSessions: protectedProcedure.mutation(async ({ ctx }) => {
    const db = getDb();

    // Get current session token
    const currentSessionToken = ctx.sessionToken;

    // Deactivate all other sessions
    await db
      .update(userSessions)
      .set({ isActive: false })
      .where(
        and(
          eq(userSessions.userId, ctx.user.id),
          // This would need to be implemented differently in actual code
          // For now, we'll update all sessions and then reactivate current one
        )
      );

    // Reactivate current session
    await db
      .update(userSessions)
      .set({ isActive: true })
      .where(eq(userSessions.sessionToken, currentSessionToken));

    return {
      success: true,
      message: "All other sessions logged out successfully",
    };
  }),

  // Get session statistics
  getSessionStats: protectedProcedure.query(async ({ ctx }) => {
    const db = getDb();

    const sessions = await db
      .select()
      .from(userSessions)
      .where(eq(userSessions.userId, ctx.user.id));

    const activeSessions = sessions.filter((s) => s.isActive);
    const inactiveSessions = sessions.filter((s) => !s.isActive);

    // Group by device type
    const deviceTypes: Record<string, number> = {};
    activeSessions.forEach((session) => {
      const userAgent = session.userAgent || "";
      let deviceType = "Unknown";

      if (userAgent.includes("Mobile")) deviceType = "Mobile";
      else if (userAgent.includes("Tablet")) deviceType = "Tablet";
      else if (userAgent.includes("Windows")) deviceType = "Windows";
      else if (userAgent.includes("Mac")) deviceType = "Mac";
      else if (userAgent.includes("Linux")) deviceType = "Linux";

      deviceTypes[deviceType] = (deviceTypes[deviceType] || 0) + 1;
    });

    return {
      totalSessions: sessions.length,
      activeSessions: activeSessions.length,
      inactiveSessions: inactiveSessions.length,
      deviceTypes,
      oldestSession: sessions.length > 0 ? sessions[sessions.length - 1].createdAt : null,
      newestSession: sessions.length > 0 ? sessions[0].createdAt : null,
    };
  }),

  // Update session activity
  updateActivity: protectedProcedure
    .input(z.object({ sessionToken: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      await db
        .update(userSessions)
        .set({ lastActivity: new Date() })
        .where(
          and(
            eq(userSessions.sessionToken, input.sessionToken),
            eq(userSessions.userId, ctx.user.id)
          )
        );

      return { success: true };
    }),

  // Get suspicious sessions (different IP/device)
  getSuspiciousSessions: protectedProcedure.query(async ({ ctx }) => {
    const db = getDb();

    const sessions = await db
      .select()
      .from(userSessions)
      .where(
        and(
          eq(userSessions.userId, ctx.user.id),
          eq(userSessions.isActive, true)
        )
      )
      .orderBy(desc(userSessions.createdAt));

    if (sessions.length === 0) {
      return [];
    }

    // Compare with most recent session
    const recentSession = sessions[0];
    const suspicious = sessions.filter((session) => {
      // Different IP address
      if (session.ipAddress !== recentSession.ipAddress) {
        return true;
      }
      // Different device fingerprint
      if (
        session.deviceFingerprint &&
        recentSession.deviceFingerprint &&
        session.deviceFingerprint !== recentSession.deviceFingerprint
      ) {
        return true;
      }
      return false;
    });

    return suspicious.map((session) => ({
      id: session.id,
      deviceName: session.deviceName || "Unknown Device",
      ipAddress: session.ipAddress,
      createdAt: session.createdAt,
      lastActivity: session.lastActivity,
      reason: session.ipAddress !== recentSession.ipAddress ? "Different IP" : "Different Device",
    }));
  }),
});
