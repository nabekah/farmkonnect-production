import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import {
  getInventoryStatus,
  createInventoryAlert,
  getActiveAlerts,
  acknowledgeAlert,
  calculateSalesVelocity,
  generateInventoryForecast,
  updateProductStock,
  getLowStockProducts,
} from '../services/inventoryManagementService';

export const inventoryManagementRouter = router({
  /**
   * Get inventory status for all seller's products
   */
  getInventoryStatus: protectedProcedure.query(async ({ ctx }) => {
    try {
      const inventory = await getInventoryStatus(ctx.user.id);
      return inventory;
    } catch (error) {
      console.error('Error getting inventory status:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get inventory status',
      });
    }
  }),

  /**
   * Get active inventory alerts
   */
  getActiveAlerts: protectedProcedure.query(async ({ ctx }) => {
    try {
      const alerts = await getActiveAlerts(ctx.user.id);
      return alerts;
    } catch (error) {
      console.error('Error getting active alerts:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get active alerts',
      });
    }
  }),

  /**
   * Acknowledge an inventory alert
   */
  acknowledgeAlert: protectedProcedure
    .input(z.object({ alertId: z.number() }))
    .mutation(async ({ input }) => {
      try {
        const result = await acknowledgeAlert(input.alertId);
        return { success: result };
      } catch (error) {
        console.error('Error acknowledging alert:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to acknowledge alert',
        });
      }
    }),

  /**
   * Get low stock products
   */
  getLowStockProducts: protectedProcedure
    .input(
      z.object({
        threshold: z.number().default(10),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const products = await getLowStockProducts(ctx.user.id, input.threshold);
        return products;
      } catch (error) {
        console.error('Error getting low stock products:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get low stock products',
        });
      }
    }),

  /**
   * Generate inventory forecast for a product
   */
  generateForecast: protectedProcedure
    .input(
      z.object({
        productId: z.number(),
        productName: z.string(),
        currentStock: z.number(),
        dailySalesAverage: z.number(),
        leadTimeDays: z.number().default(7),
      })
    )
    .query(async ({ input }) => {
      try {
        const forecast = generateInventoryForecast(
          input.productId,
          input.productName,
          input.currentStock,
          input.dailySalesAverage,
          input.leadTimeDays
        );
        return forecast;
      } catch (error) {
        console.error('Error generating forecast:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to generate forecast',
        });
      }
    }),

  /**
   * Calculate sales velocity
   */
  calculateSalesVelocity: protectedProcedure
    .input(
      z.object({
        productName: z.string(),
        dailySales: z.array(z.number()),
        weeklySales: z.array(z.number()),
        monthlySales: z.array(z.number()),
      })
    )
    .query(async ({ input }) => {
      try {
        const velocity = calculateSalesVelocity(
          input.productName,
          input.dailySales,
          input.weeklySales,
          input.monthlySales
        );
        return velocity;
      } catch (error) {
        console.error('Error calculating sales velocity:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to calculate sales velocity',
        });
      }
    }),

  /**
   * Update product stock
   */
  updateStock: protectedProcedure
    .input(
      z.object({
        productId: z.number(),
        newQuantity: z.number().nonnegative(),
        reason: z.enum(['restock', 'sale', 'adjustment']),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const result = await updateProductStock(input.productId, input.newQuantity, input.reason);
        return { success: result };
      } catch (error) {
        console.error('Error updating stock:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update stock',
        });
      }
    }),

  /**
   * Create inventory alert
   */
  createAlert: protectedProcedure
    .input(
      z.object({
        productId: z.number(),
        alertType: z.enum(['low_stock', 'out_of_stock', 'overstock']),
        currentStock: z.number(),
        threshold: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const alert = await createInventoryAlert(
          input.productId,
          input.alertType,
          input.currentStock,
          input.threshold
        );
        return alert;
      } catch (error) {
        console.error('Error creating alert:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create alert',
        });
      }
    }),
});
