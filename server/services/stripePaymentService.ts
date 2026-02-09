import { TRPCError } from '@trpc/server';
import { getDb } from '../db';
import { marketplaceOrders, marketplaceOrderItems, marketplaceTransactions } from '../../drizzle/schema';
import { eq, and } from 'drizzle-orm';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const STRIPE_PUBLISHABLE_KEY = process.env.VITE_STRIPE_PUBLISHABLE_KEY || '';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

interface PaymentIntent {
  id: string;
  clientSecret: string;
  amount: number;
  currency: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'requires_capture' | 'canceled' | 'succeeded';
}

interface PaymentResult {
  success: boolean;
  paymentIntentId?: string;
  clientSecret?: string;
  error?: string;
  status?: string;
}

interface WebhookEvent {
  id: string;
  type: string;
  data: {
    object: {
      id: string;
      status: string;
      amount: number;
      metadata?: Record<string, string>;
    };
  };
}

// In-memory storage for payment tracking (in production, use database)
const paymentIntents: Map<string, any> = new Map();
const webhookEvents: Map<string, WebhookEvent> = new Map();

/**
 * Create a payment intent for an order
 */
export async function createPaymentIntent(
  orderId: number,
  amount: number,
  currency: string = 'GHS'
): Promise<PaymentResult> {
  try {
    if (!STRIPE_SECRET_KEY) {
      console.warn('Stripe secret key not configured');
      return {
        success: false,
        error: 'Stripe is not configured',
      };
    }

    // In production, use actual Stripe SDK
    // const stripe = require('stripe')(STRIPE_SECRET_KEY);
    // const paymentIntent = await stripe.paymentIntents.create({
    //   amount: Math.round(amount * 100), // Convert to cents
    //   currency: currency.toLowerCase(),
    //   metadata: { orderId: orderId.toString() }
    // });

    // For now, simulate the API call
    const paymentIntentId = `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const clientSecret = `${paymentIntentId}_secret_${Math.random().toString(36).substr(2, 32)}`;

    const paymentIntent = {
      id: paymentIntentId,
      clientSecret,
      amount,
      currency,
      status: 'requires_payment_method',
      orderId,
      createdAt: new Date(),
      metadata: { orderId: orderId.toString() },
    };

    paymentIntents.set(paymentIntentId, paymentIntent);

    console.log(`[STRIPE] Payment intent created: ${paymentIntentId} for order ${orderId}`);

    return {
      success: true,
      paymentIntentId,
      clientSecret,
      status: 'requires_payment_method',
    };
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create payment intent',
    };
  }
}

/**
 * Confirm a payment intent
 */
export async function confirmPaymentIntent(
  paymentIntentId: string,
  paymentMethodId: string
): Promise<PaymentResult> {
  try {
    const paymentIntent = paymentIntents.get(paymentIntentId);

    if (!paymentIntent) {
      return {
        success: false,
        error: 'Payment intent not found',
      };
    }

    // In production, use actual Stripe SDK
    // const stripe = require('stripe')(STRIPE_SECRET_KEY);
    // const confirmed = await stripe.paymentIntents.confirm(paymentIntentId, {
    //   payment_method: paymentMethodId
    // });

    // Simulate payment confirmation
    paymentIntent.status = 'succeeded';
    paymentIntent.paymentMethodId = paymentMethodId;
    paymentIntent.confirmedAt = new Date();

    console.log(`[STRIPE] Payment confirmed: ${paymentIntentId}`);

    return {
      success: true,
      paymentIntentId,
      status: 'succeeded',
    };
  } catch (error) {
    console.error('Error confirming payment intent:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to confirm payment',
    };
  }
}

/**
 * Get payment intent details
 */
export function getPaymentIntentDetails(paymentIntentId: string): any {
  return paymentIntents.get(paymentIntentId) || null;
}

/**
 * Process webhook event from Stripe
 */
export async function processStripeWebhook(event: WebhookEvent): Promise<{ success: boolean; message: string }> {
  try {
    webhookEvents.set(event.id, event);

    const db = getDb();

    switch (event.type) {
      case 'payment_intent.succeeded':
        {
          const paymentIntentId = event.data.object.id;
          const paymentIntent = paymentIntents.get(paymentIntentId);

          if (paymentIntent) {
            const orderId = paymentIntent.orderId;

            // Update order status to paid
            await db
              .update(marketplaceOrders)
              .set({
                status: 'paid',
                paymentStatus: 'completed',
                paidAt: new Date(),
              })
              .where(eq(marketplaceOrders.id, orderId));

            // Record transaction
            await db.insert(marketplaceTransactions).values({
              orderId,
              transactionType: 'payment',
              amount: paymentIntent.amount.toString(),
              currency: paymentIntent.currency,
              status: 'completed',
              paymentMethod: 'stripe',
              stripePaymentIntentId: paymentIntentId,
              metadata: JSON.stringify({ event: event.type }),
            });

            console.log(`[WEBHOOK] Payment succeeded for order ${orderId}`);
          }
        }
        break;

      case 'payment_intent.payment_failed':
        {
          const paymentIntentId = event.data.object.id;
          const paymentIntent = paymentIntents.get(paymentIntentId);

          if (paymentIntent) {
            const orderId = paymentIntent.orderId;

            // Update order status to payment failed
            await db
              .update(marketplaceOrders)
              .set({
                status: 'payment_failed',
                paymentStatus: 'failed',
              })
              .where(eq(marketplaceOrders.id, orderId));

            console.log(`[WEBHOOK] Payment failed for order ${orderId}`);
          }
        }
        break;

      case 'charge.refunded':
        {
          const paymentIntentId = event.data.object.id;
          const paymentIntent = paymentIntents.get(paymentIntentId);

          if (paymentIntent) {
            const orderId = paymentIntent.orderId;

            // Record refund transaction
            await db.insert(marketplaceTransactions).values({
              orderId,
              transactionType: 'refund',
              amount: event.data.object.amount.toString(),
              currency: paymentIntent.currency,
              status: 'completed',
              paymentMethod: 'stripe',
              stripePaymentIntentId: paymentIntentId,
              metadata: JSON.stringify({ event: event.type }),
            });

            console.log(`[WEBHOOK] Refund processed for order ${orderId}`);
          }
        }
        break;

      default:
        console.log(`[WEBHOOK] Unhandled event type: ${event.type}`);
    }

    return {
      success: true,
      message: `Webhook processed: ${event.type}`,
    };
  } catch (error) {
    console.error('Error processing webhook:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to process webhook',
    };
  }
}

/**
 * Refund a payment
 */
export async function refundPayment(
  orderId: number,
  amount?: number
): Promise<{ success: boolean; refundId?: string; error?: string }> {
  try {
    const db = getDb();

    // Get order details
    const order = await db.select().from(marketplaceOrders).where(eq(marketplaceOrders.id, orderId)).limit(1);

    if (!order || order.length === 0) {
      return {
        success: false,
        error: 'Order not found',
      };
    }

    // In production, use actual Stripe SDK
    // const stripe = require('stripe')(STRIPE_SECRET_KEY);
    // const refund = await stripe.refunds.create({
    //   payment_intent: order[0].stripePaymentIntentId,
    //   amount: amount ? Math.round(amount * 100) : undefined
    // });

    // Simulate refund
    const refundId = `re_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Record refund transaction
    await db.insert(marketplaceTransactions).values({
      orderId,
      transactionType: 'refund',
      amount: (amount || parseFloat(order[0].totalAmount)).toString(),
      currency: 'GHS',
      status: 'completed',
      paymentMethod: 'stripe',
      metadata: JSON.stringify({ refundId }),
    });

    // Update order status
    await db
      .update(marketplaceOrders)
      .set({
        status: 'refunded',
        paymentStatus: 'refunded',
      })
      .where(eq(marketplaceOrders.id, orderId));

    console.log(`[STRIPE] Refund created: ${refundId} for order ${orderId}`);

    return {
      success: true,
      refundId,
    };
  } catch (error) {
    console.error('Error refunding payment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to refund payment',
    };
  }
}

/**
 * Get payment statistics
 */
export function getPaymentStatistics(): {
  totalPaymentIntents: number;
  succeeded: number;
  failed: number;
  pending: number;
  totalAmount: number;
} {
  let stats = {
    totalPaymentIntents: paymentIntents.size,
    succeeded: 0,
    failed: 0,
    pending: 0,
    totalAmount: 0,
  };

  for (const intent of paymentIntents.values()) {
    stats.totalAmount += intent.amount;

    switch (intent.status) {
      case 'succeeded':
        stats.succeeded += 1;
        break;
      case 'canceled':
        stats.failed += 1;
        break;
      default:
        stats.pending += 1;
    }
  }

  return stats;
}

/**
 * Get Stripe publishable key for frontend
 */
export function getStripePublishableKey(): string {
  return STRIPE_PUBLISHABLE_KEY;
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(payload: string, signature: string): boolean {
  try {
    if (!STRIPE_WEBHOOK_SECRET) {
      console.warn('Stripe webhook secret not configured');
      return false;
    }

    // In production, use actual Stripe SDK
    // const stripe = require('stripe')(STRIPE_SECRET_KEY);
    // const event = stripe.webhooks.constructEvent(payload, signature, STRIPE_WEBHOOK_SECRET);

    // For now, just verify the signature exists
    return signature && signature.length > 0;
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}
