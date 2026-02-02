import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { marketplaceCart } from "../drizzle/schema";
import { lt, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

/**
 * Cart expiration management router
 * Handles automatic cleanup of expired cart items
 */
export const cartExpirationRouter = router({
  /**
   * Clean up expired cart items (older than 30 days)
   * This can be called by a scheduled job or manually
   */
  cleanupExpiredCarts: publicProcedure.mutation(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    try {
      const now = new Date();
      
      // Delete cart items that have expired
      const result = await db.delete(marketplaceCart)
        .where(lt(marketplaceCart.expiresAt, now));

      return {
        success: true,
        deletedCount: 0,
        timestamp: now.toISOString(),
      };
    } catch (error) {
      console.error("Cart expiration cleanup error:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to cleanup expired carts",
      });
    }
  }),

  /**
   * Get count of expired cart items
   */
  getExpiredCartCount: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return 0;

    try {
      const now = new Date();
      
      const result = await db.select().from(marketplaceCart)
        .where(lt(marketplaceCart.expiresAt, now));

      return result.length;
    } catch (error) {
      console.error("Error getting expired cart count:", error);
      return 0;
    }
  }),

  /**
   * Extend cart item expiration for a user
   * Called when user interacts with their cart
   */
  extendCartExpiration: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    try {
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      // Update expiration for all cart items of this user
      const result = await db.update(marketplaceCart)
        .set({ expiresAt: thirtyDaysFromNow })
        .where(eq(marketplaceCart.userId, ctx.user.id));

      return {
        success: true,
        updatedCount: 0,
        newExpiryDate: thirtyDaysFromNow.toISOString(),
      };
    } catch (error) {
      console.error("Error extending cart expiration:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to extend cart expiration",
      });
    }
  }),

  /**
   * Get user's cart expiration status
   */
  getCartExpirationStatus: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;

    try {
      // Get earliest expiration date for user's cart
      const result = await db.select().from(marketplaceCart)
        .where(eq(marketplaceCart.userId, ctx.user.id));

      if (!result || result.length === 0) return null;

      // Find the earliest expiration date
      const earliestExpiry = result.reduce((min, item) => {
        const itemExpiry = new Date(item.expiresAt as any);
        return itemExpiry < min ? itemExpiry : min;
      }, new Date(result[0].expiresAt as any));

      const now = new Date();
      const daysRemaining = Math.ceil((earliestExpiry.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

      return {
        itemCount: result.length,
        earliestExpiry: earliestExpiry.toISOString(),
        daysRemaining: Math.max(0, daysRemaining),
        isExpiring: daysRemaining <= 7, // Alert if expiring within 7 days
      };
    } catch (error) {
      console.error("Error getting cart expiration status:", error);
      return null;
    }
  }),
});
