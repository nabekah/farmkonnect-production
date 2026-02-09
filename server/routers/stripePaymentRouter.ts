import { router, protectedProcedure, publicProcedure } from '../_core/trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import {
  createPaymentIntent,
  confirmPaymentIntent,
  getPaymentIntentDetails,
  processStripeWebhook,
  refundPayment,
  getPaymentStatistics,
  getStripePublishableKey,
  verifyWebhookSignature,
} from '../services/stripePaymentService';

export const stripePaymentRouter = router({
  /**
   * Create a payment intent for checkout
   */
  createPaymentIntent: protectedProcedure
    .input(
      z.object({
        orderId: z.number(),
        amount: z.number().positive(),
        currency: z.string().default('GHS'),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const result = await createPaymentIntent(input.orderId, input.amount, input.currency);

        if (!result.success) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: result.error || 'Failed to create payment intent',
          });
        }

        return {
          success: true,
          paymentIntentId: result.paymentIntentId,
          clientSecret: result.clientSecret,
          status: result.status,
        };
      } catch (error) {
        console.error('Error creating payment intent:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create payment intent',
        });
      }
    }),

  /**
   * Confirm a payment intent
   */
  confirmPayment: protectedProcedure
    .input(
      z.object({
        paymentIntentId: z.string(),
        paymentMethodId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const result = await confirmPaymentIntent(input.paymentIntentId, input.paymentMethodId);

        if (!result.success) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: result.error || 'Failed to confirm payment',
          });
        }

        return {
          success: true,
          paymentIntentId: result.paymentIntentId,
          status: result.status,
        };
      } catch (error) {
        console.error('Error confirming payment:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to confirm payment',
        });
      }
    }),

  /**
   * Get payment intent details
   */
  getPaymentDetails: protectedProcedure
    .input(z.object({ paymentIntentId: z.string() }))
    .query(async ({ input }) => {
      try {
        const details = getPaymentIntentDetails(input.paymentIntentId);

        if (!details) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Payment intent not found',
          });
        }

        return {
          id: details.id,
          status: details.status,
          amount: details.amount,
          currency: details.currency,
          createdAt: details.createdAt,
          confirmedAt: details.confirmedAt,
        };
      } catch (error) {
        console.error('Error getting payment details:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get payment details',
        });
      }
    }),

  /**
   * Refund a payment
   */
  refundPayment: protectedProcedure
    .input(
      z.object({
        orderId: z.number(),
        amount: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const result = await refundPayment(input.orderId, input.amount);

        if (!result.success) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: result.error || 'Failed to refund payment',
          });
        }

        return {
          success: true,
          refundId: result.refundId,
        };
      } catch (error) {
        console.error('Error refunding payment:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to refund payment',
        });
      }
    }),

  /**
   * Process Stripe webhook
   */
  processWebhook: publicProcedure
    .input(
      z.object({
        event: z.object({
          id: z.string(),
          type: z.string(),
          data: z.object({
            object: z.object({
              id: z.string(),
              status: z.string(),
              amount: z.number(),
              metadata: z.record(z.string()).optional(),
            }),
          }),
        }),
        signature: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Verify webhook signature
        if (!verifyWebhookSignature(JSON.stringify(input.event), input.signature)) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Invalid webhook signature',
          });
        }

        const result = await processStripeWebhook(input.event);

        return {
          success: result.success,
          message: result.message,
        };
      } catch (error) {
        console.error('Error processing webhook:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to process webhook',
        });
      }
    }),

  /**
   * Get Stripe publishable key for frontend
   */
  getPublishableKey: publicProcedure.query(async () => {
    try {
      const key = getStripePublishableKey();

      if (!key) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Stripe is not configured',
        });
      }

      return {
        publishableKey: key,
      };
    } catch (error) {
      console.error('Error getting publishable key:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get Stripe configuration',
      });
    }
  }),

  /**
   * Get payment statistics (admin only)
   */
  getStatistics: protectedProcedure.query(async ({ ctx }) => {
    try {
      // Check if user is admin or seller
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins can view payment statistics',
        });
      }

      const stats = getPaymentStatistics();

      return {
        totalPaymentIntents: stats.totalPaymentIntents,
        succeeded: stats.succeeded,
        failed: stats.failed,
        pending: stats.pending,
        totalAmount: stats.totalAmount,
        successRate: stats.totalPaymentIntents > 0 ? (stats.succeeded / stats.totalPaymentIntents) * 100 : 0,
      };
    } catch (error) {
      console.error('Error getting payment statistics:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get payment statistics',
      });
    }
  }),
});
