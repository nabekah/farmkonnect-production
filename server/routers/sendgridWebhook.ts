import { router, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { emailAnalytics } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

/**
 * SendGrid Webhook Event Types
 */
interface SendGridEvent {
  event: string;
  email?: string;
  timestamp?: number;
  "message-id"?: string;
  sg_message_id?: string;
  sg_event_id?: string;
  reason?: string;
  status?: string;
  type?: string;
  url?: string;
  useragent?: string;
  ip?: string;
  [key: string]: any;
}

/**
 * Verify SendGrid webhook signature
 * SendGrid signs each webhook with a signature header
 */
function verifyWebhookSignature(
  payload: string,
  signature: string,
  timestamp: string,
  webhookKey: string
): boolean {
  try {
    const signedContent = `${timestamp}${payload}`;
    const hash = crypto
      .createHmac("sha256", webhookKey)
      .update(signedContent)
      .digest("base64");
    return hash === signature;
  } catch (error) {
    console.error("Error verifying webhook signature:", error);
    return false;
  }
}

/**
 * Get message ID from SendGrid event
 */
function getMessageId(event: SendGridEvent): string | null {
  return event["message-id"] || event.sg_message_id || null;
}

/**
 * Handle SendGrid delivery event
 */
async function handleDeliveryEvent(event: SendGridEvent) {
  const db = await getDb();
  const messageId = getMessageId(event);

  if (!messageId || !event.email) return;

  await db
    .update(emailAnalytics)
    .set({
      status: "delivered",
      deliveryTime: new Date(event.timestamp! * 1000),
      sendGridEventId: event.sg_event_id,
    })
    .where(eq(emailAnalytics.messageId, messageId));
}

/**
 * Handle SendGrid open event
 */
async function handleOpenEvent(event: SendGridEvent) {
  const db = await getDb();
  const messageId = getMessageId(event);

  if (!messageId || !event.email) return;

  await db
    .update(emailAnalytics)
    .set({
      status: "opened",
      openTime: new Date(event.timestamp! * 1000),
      sendGridEventId: event.sg_event_id,
      metadata: {
        userAgent: event.useragent,
        ip: event.ip,
      },
    })
    .where(eq(emailAnalytics.messageId, messageId));
}

/**
 * Handle SendGrid click event
 */
async function handleClickEvent(event: SendGridEvent) {
  const db = await getDb();
  const messageId = getMessageId(event);

  if (!messageId || !event.email) return;

  await db
    .update(emailAnalytics)
    .set({
      status: "clicked",
      clickTime: new Date(event.timestamp! * 1000),
      sendGridEventId: event.sg_event_id,
      metadata: {
        url: event.url,
        userAgent: event.useragent,
        ip: event.ip,
      },
    })
    .where(eq(emailAnalytics.messageId, messageId));
}

/**
 * Handle SendGrid bounce event
 */
async function handleBounceEvent(event: SendGridEvent) {
  const db = await getDb();
  const messageId = getMessageId(event);

  if (!messageId || !event.email) return;

  const bounceType = event.type === "permanent" ? "permanent" : "temporary";

  await db
    .update(emailAnalytics)
    .set({
      status: "bounced",
      bounceType: bounceType as "permanent" | "temporary",
      bounceReason: event.reason || "Unknown",
      sendGridEventId: event.sg_event_id,
    })
    .where(eq(emailAnalytics.messageId, messageId));
}

/**
 * Handle SendGrid complaint event
 */
async function handleComplaintEvent(event: SendGridEvent) {
  const db = await getDb();
  const messageId = getMessageId(event);

  if (!messageId || !event.email) return;

  const complaintType = event.type || "other";

  await db
    .update(emailAnalytics)
    .set({
      status: "complained",
      complaintType: complaintType as
        | "abuse"
        | "fraud"
        | "not_requested"
        | "other",
      sendGridEventId: event.sg_event_id,
    })
    .where(eq(emailAnalytics.messageId, messageId));
}

/**
 * Process SendGrid webhook event
 */
async function processWebhookEvent(event: SendGridEvent) {
  try {
    switch (event.event) {
      case "delivered":
        await handleDeliveryEvent(event);
        break;
      case "open":
        await handleOpenEvent(event);
        break;
      case "click":
        await handleClickEvent(event);
        break;
      case "bounce":
        await handleBounceEvent(event);
        break;
      case "spamreport":
      case "complaint":
        await handleComplaintEvent(event);
        break;
      case "processed":
      case "dropped":
      case "deferred":
        // These events are informational only
        console.log(`Received ${event.event} event for ${event.email}`);
        break;
      default:
        console.log(`Unknown event type: ${event.event}`);
    }
  } catch (error) {
    console.error(`Error processing webhook event:`, error);
    throw error;
  }
}

export const sendgridWebhookRouter = router({
  /**
   * Receive and process SendGrid webhook events
   * This endpoint receives events from SendGrid
   */
  handleWebhook: publicProcedure
    .input(z.any()) // Accept raw webhook payload
    .mutation(async ({ input }) => {
      try {
        // Input is an array of events from SendGrid
        const events = Array.isArray(input) ? input : [input];

        const results = [];
        for (const event of events) {
          try {
            await processWebhookEvent(event);
            results.push({
              event: event.event,
              email: event.email,
              status: "processed",
            });
          } catch (error: any) {
            results.push({
              event: event.event,
              email: event.email,
              status: "error",
              error: error.message,
            });
          }
        }

        return {
          success: true,
          processed: results.length,
          results,
        };
      } catch (error: any) {
        console.error("Webhook processing error:", error);
        return {
          success: false,
          error: error.message,
        };
      }
    }),

  /**
   * Verify webhook signature (for testing)
   */
  verifySignature: publicProcedure
    .input(
      z.object({
        payload: z.string(),
        signature: z.string(),
        timestamp: z.string(),
        webhookKey: z.string(),
      })
    )
    .query(({ input }) => {
      const isValid = verifyWebhookSignature(
        input.payload,
        input.signature,
        input.timestamp,
        input.webhookKey
      );

      return {
        valid: isValid,
        message: isValid
          ? "Signature is valid"
          : "Signature verification failed",
      };
    }),

  /**
   * Get webhook configuration info
   */
  getWebhookInfo: publicProcedure.query(() => {
    return {
      endpoint: "/api/trpc/sendgridWebhook.handleWebhook",
      events: [
        "processed",
        "dropped",
        "delivered",
        "deferred",
        "bounce",
        "open",
        "click",
        "spamreport",
        "complaint",
      ],
      description:
        "SendGrid webhook endpoint for tracking email events and analytics",
    };
  }),

  /**
   * Test webhook with sample event
   */
  testWebhook: publicProcedure
    .input(
      z.object({
        event: z.enum([
          "delivered",
          "open",
          "click",
          "bounce",
          "complaint",
        ]),
        email: z.string().email(),
      })
    )
    .mutation(async ({ input }) => {
      const testEvent: SendGridEvent = {
        event: input.event,
        email: input.email,
        timestamp: Math.floor(Date.now() / 1000),
        "message-id": `test-${Date.now()}`,
        sg_event_id: `test-event-${Date.now()}`,
      };

      try {
        await processWebhookEvent(testEvent);
        return {
          success: true,
          message: `Test ${input.event} event processed successfully`,
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message,
        };
      }
    }),
});
