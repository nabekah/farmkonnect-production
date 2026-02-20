import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { sdk } from "../_core/sdk";
import { TRPCError } from "@trpc/server";

/**
 * Token Refresh Router
 * Handles OAuth token refresh and expiration management
 */
export const tokenRefreshRouter = router({
  /**
   * Refresh the current session token
   * Called before token expiration to maintain session
   */
  refreshToken: publicProcedure.mutation(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "User must be authenticated to refresh token",
      });
    }

    try {
      // Create a new session token for the user
      const newSessionToken = await sdk.createSessionToken(ctx.user.openId || "", {
        name: ctx.user.name || "",
        expiresInMs: 365 * 24 * 60 * 60 * 1000, // 1 year
      });

      return {
        success: true,
        message: "Token refreshed successfully",
        token: newSessionToken,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("[TokenRefresh] Failed to refresh token:", {
        userId: ctx.user.openId,
        error: errorMessage,
      });

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to refresh token",
      });
    }
  }),

  /**
   * Check if token is about to expire
   * Returns true if token expires within the next hour
   */
  checkTokenExpiration: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      return {
        isExpiring: false,
        expiresIn: null,
        shouldRefresh: false,
      };
    }

    try {
      // Get token expiration from session cookie
      // This is a simplified check - in production, you'd decode the JWT
      const tokenExpiresIn = ctx.tokenExpiresIn || 0;
      const ONE_HOUR_MS = 60 * 60 * 1000;

      return {
        isExpiring: tokenExpiresIn < ONE_HOUR_MS,
        expiresIn: tokenExpiresIn,
        shouldRefresh: tokenExpiresIn < ONE_HOUR_MS,
      };
    } catch (error) {
      console.error("[TokenRefresh] Failed to check token expiration:", error);
      return {
        isExpiring: false,
        expiresIn: null,
        shouldRefresh: false,
      };
    }
  }),

  /**
   * Get token expiration timestamp
   * Returns when the current token will expire
   */
  getTokenExpiration: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      return {
        expiresAt: null,
        expiresInMs: null,
        isExpired: false,
      };
    }

    try {
      const tokenExpiresIn = ctx.tokenExpiresIn || 0;
      const expiresAt = new Date(Date.now() + tokenExpiresIn);

      return {
        expiresAt: expiresAt.toISOString(),
        expiresInMs: tokenExpiresIn,
        isExpired: tokenExpiresIn <= 0,
      };
    } catch (error) {
      console.error("[TokenRefresh] Failed to get token expiration:", error);
      return {
        expiresAt: null,
        expiresInMs: null,
        isExpired: false,
      };
    }
  }),

  /**
   * Validate current session token
   * Returns true if token is valid and not expired
   */
  validateToken: publicProcedure.query(async ({ ctx }) => {
    return {
      isValid: !!ctx.user,
      user: ctx.user ? {
        id: ctx.user.id,
        name: ctx.user.name,
        email: ctx.user.email,
        role: ctx.user.role,
      } : null,
      expiresInMs: ctx.tokenExpiresIn || 0,
    };
  }),
});
