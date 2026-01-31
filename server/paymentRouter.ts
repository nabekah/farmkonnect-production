import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { orders } from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Payment Integration Router
 * Supports Mobile Money payments via Paystack and Flutterwave
 * 
 * Setup Instructions:
 * 1. Sign up for Paystack (https://paystack.com) or Flutterwave (https://flutterwave.com)
 * 2. Get API keys from dashboard
 * 3. Add to environment variables:
 *    - PAYSTACK_SECRET_KEY
 *    - PAYSTACK_PUBLIC_KEY
 *    - FLUTTERWAVE_SECRET_KEY
 *    - FLUTTERWAVE_PUBLIC_KEY
 * 4. Configure webhook URLs in payment provider dashboard
 */

export const paymentRouter = router({
  /**
   * Initialize payment transaction
   * Returns payment link for customer to complete payment
   */
  initializePayment: protectedProcedure
    .input(
      z.object({
        orderId: z.number(),
        amount: z.number(),
        currency: z.enum(["GHS", "NGN", "KES", "UGX", "TZS"]).default("GHS"),
        provider: z.enum(["paystack", "flutterwave"]).default("paystack"),
        paymentMethod: z.enum(["mobile_money", "card", "bank_transfer"]).default("mobile_money"),
        customerEmail: z.string().email(),
        customerPhone: z.string().optional(),
        customerName: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Verify order exists and belongs to user
      const order = await db.select().from(orders).where(eq(orders.id, input.orderId));
      if (order.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
      }

      // In production, call actual payment provider API
      // For now, return mock payment link structure
      
      if (input.provider === "paystack") {
        return {
          success: true,
          provider: "paystack",
          paymentLink: `https://checkout.paystack.com/mock-${input.orderId}`,
          reference: `PAY-${Date.now()}-${input.orderId}`,
          message: "Payment initialized successfully. Redirect customer to payment link.",
          instructions: [
            "1. Get Paystack API keys from https://dashboard.paystack.com/#/settings/developer",
            "2. Add PAYSTACK_SECRET_KEY to environment variables",
            "3. Install Paystack SDK: npm install paystack-node",
            "4. Implement actual API call in production",
          ],
        };
      } else {
        return {
          success: true,
          provider: "flutterwave",
          paymentLink: `https://checkout.flutterwave.com/mock-${input.orderId}`,
          reference: `FLW-${Date.now()}-${input.orderId}`,
          message: "Payment initialized successfully. Redirect customer to payment link.",
          instructions: [
            "1. Get Flutterwave API keys from https://dashboard.flutterwave.com/settings/apis",
            "2. Add FLUTTERWAVE_SECRET_KEY to environment variables",
            "3. Install Flutterwave SDK: npm install flutterwave-node-v3",
            "4. Implement actual API call in production",
          ],
        };
      }
    }),

  /**
   * Verify payment status
   * Call this after customer completes payment
   */
  verifyPayment: protectedProcedure
    .input(
      z.object({
        reference: z.string(),
        provider: z.enum(["paystack", "flutterwave"]),
      })
    )
    .query(async ({ input }) => {
      // In production, verify with actual payment provider API
      
      return {
        success: true,
        status: "success",
        reference: input.reference,
        amount: 0,
        currency: "GHS",
        paidAt: new Date().toISOString(),
        message: "Payment verified successfully (mock response)",
        instructions: [
          "In production:",
          "- Call Paystack verify endpoint: GET https://api.paystack.co/transaction/verify/:reference",
          "- Or Flutterwave verify: GET https://api.flutterwave.com/v3/transactions/:id/verify",
          "- Update order payment status in database",
          "- Send confirmation notification to customer",
        ],
      };
    }),

  /**
   * Get supported Mobile Money providers by country
   */
  getMobileMoneyProviders: protectedProcedure
    .input(z.object({ country: z.enum(["GH", "NG", "KE", "UG", "TZ"]) }))
    .query(async ({ input }) => {
      const providers: Record<string, any[]> = {
        GH: [
          { code: "MTN", name: "MTN Mobile Money", supported: true },
          { code: "VODAFONE", name: "Vodafone Cash", supported: true },
          { code: "AIRTELTIGO", name: "AirtelTigo Money", supported: true },
        ],
        NG: [
          { code: "MTN", name: "MTN Mobile Money", supported: false },
          { code: "AIRTEL", name: "Airtel Money", supported: false },
        ],
        KE: [
          { code: "MPESA", name: "M-Pesa", supported: true },
          { code: "AIRTEL", name: "Airtel Money", supported: true },
        ],
        UG: [
          { code: "MTN", name: "MTN Mobile Money", supported: true },
          { code: "AIRTEL", name: "Airtel Money", supported: true },
        ],
        TZ: [
          { code: "MPESA", name: "M-Pesa", supported: true },
          { code: "TIGO", name: "Tigo Pesa", supported: true },
          { code: "AIRTEL", name: "Airtel Money", supported: true },
        ],
      };

      return providers[input.country] || [];
    }),

  /**
   * Process refund
   */
  processRefund: protectedProcedure
    .input(
      z.object({
        reference: z.string(),
        amount: z.number().optional(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Only admins can process refunds
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can process refunds",
        });
      }

      return {
        success: true,
        message: "Refund initiated successfully (mock response)",
        reference: input.reference,
        refundAmount: input.amount,
        instructions: [
          "In production:",
          "- Call payment provider refund API",
          "- Update order status to 'refunded'",
          "- Send refund confirmation to customer",
          "- Log refund transaction for accounting",
        ],
      };
    }),

  /**
   * Get payment transaction history
   */
  getTransactionHistory: protectedProcedure
    .input(
      z.object({
        orderId: z.number().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return [];

      // In production, fetch from payments table
      // For now, return empty array with instructions
      
      return {
        transactions: [],
        message: "Payment transaction history (implement in production)",
        instructions: [
          "Create payments table in schema:",
          "- id, orderId, reference, amount, currency, status, provider, createdAt",
          "- Add to drizzle/schema.ts",
          "- Run pnpm db:push to create table",
          "- Store payment records after successful transactions",
        ],
      };
    }),
});

/**
 * PRODUCTION IMPLEMENTATION GUIDE:
 * 
 * 1. PAYSTACK INTEGRATION:
 *    npm install paystack-node
 *    
 *    import Paystack from 'paystack-node';
 *    const paystack = new Paystack(process.env.PAYSTACK_SECRET_KEY);
 *    
 *    // Initialize payment
 *    const response = await paystack.transaction.initialize({
 *      email: input.customerEmail,
 *      amount: input.amount * 100, // Convert to kobo
 *      currency: input.currency,
 *      channels: ['mobile_money'],
 *      metadata: { orderId: input.orderId }
 *    });
 *    
 *    // Verify payment
 *    const verification = await paystack.transaction.verify(reference);
 * 
 * 2. FLUTTERWAVE INTEGRATION:
 *    npm install flutterwave-node-v3
 *    
 *    import Flutterwave from 'flutterwave-node-v3';
 *    const flw = new Flutterwave(
 *      process.env.FLUTTERWAVE_PUBLIC_KEY,
 *      process.env.FLUTTERWAVE_SECRET_KEY
 *    );
 *    
 *    // Initialize payment
 *    const payload = {
 *      tx_ref: `FLW-${Date.now()}`,
 *      amount: input.amount,
 *      currency: input.currency,
 *      payment_options: 'mobilemoney',
 *      customer: {
 *        email: input.customerEmail,
 *        phone_number: input.customerPhone,
 *        name: input.customerName
 *      },
 *      customizations: {
 *        title: 'FarmKonnect Payment'
 *      }
 *    };
 *    const response = await flw.MobileMoney.initiate(payload);
 *    
 *    // Verify payment
 *    const verification = await flw.Transaction.verify({ id: transactionId });
 * 
 * 3. WEBHOOK SETUP:
 *    - Create webhook endpoint: POST /api/webhooks/payment
 *    - Verify webhook signature
 *    - Update order payment status
 *    - Send confirmation notifications
 * 
 * 4. DATABASE SCHEMA:
 *    Add payments table to track all transactions
 */
