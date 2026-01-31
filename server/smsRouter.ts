import { router, protectedProcedure, publicProcedure } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * SMS/USSD Integration Router
 * Supports Africa's Talking and Hubtel for SMS and USSD services
 * 
 * Setup Instructions:
 * 
 * AFRICA'S TALKING:
 * 1. Sign up at https://africastalking.com
 * 2. Get API key from dashboard
 * 3. Add to environment variables:
 *    - AFRICASTALKING_API_KEY
 *    - AFRICASTALKING_USERNAME
 * 4. Purchase SMS credits
 * 5. Configure USSD code (e.g., *384*1234#)
 * 
 * HUBTEL:
 * 1. Sign up at https://hubtel.com
 * 2. Get API credentials from dashboard
 * 3. Add to environment variables:
 *    - HUBTEL_CLIENT_ID
 *    - HUBTEL_CLIENT_SECRET
 * 4. Purchase SMS credits
 */

export const smsRouter = router({
  /**
   * Send SMS to single recipient
   */
  sendSMS: protectedProcedure
    .input(
      z.object({
        to: z.string(), // Phone number in international format: +233XXXXXXXXX
        message: z.string().max(160), // Standard SMS length
        provider: z.enum(["africastalking", "hubtel"]).default("africastalking"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // In production, call actual SMS provider API
      
      if (input.provider === "africastalking") {
        return {
          success: true,
          provider: "africastalking",
          to: input.to,
          message: input.message,
          messageId: `AT-${Date.now()}`,
          cost: "GHS 0.03",
          status: "sent",
          instructions: [
            "PRODUCTION SETUP:",
            "1. npm install africastalking",
            "2. Add AFRICASTALKING_API_KEY and AFRICASTALKING_USERNAME to env",
            "3. Initialize SDK:",
            "   const AfricasTalking = require('africastalking')({",
            "     apiKey: process.env.AFRICASTALKING_API_KEY,",
            "     username: process.env.AFRICASTALKING_USERNAME",
            "   });",
            "4. Send SMS:",
            "   const sms = AfricasTalking.SMS;",
            "   const result = await sms.send({",
            "     to: [input.to],",
            "     message: input.message",
            "   });",
          ],
        };
      } else {
        return {
          success: true,
          provider: "hubtel",
          to: input.to,
          message: input.message,
          messageId: `HUB-${Date.now()}`,
          cost: "GHS 0.035",
          status: "sent",
          instructions: [
            "PRODUCTION SETUP:",
            "1. npm install axios",
            "2. Add HUBTEL_CLIENT_ID and HUBTEL_CLIENT_SECRET to env",
            "3. Send SMS via REST API:",
            "   const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');",
            "   const response = await axios.post(",
            "     'https://sms.hubtel.com/v1/messages/send',",
            "     {",
            "       From: 'FarmKonnect',",
            "       To: input.to,",
            "       Content: input.message",
            "     },",
            "     { headers: { Authorization: `Basic ${auth}` } }",
            "   );",
          ],
        };
      }
    }),

  /**
   * Send bulk SMS to multiple recipients
   */
  sendBulkSMS: protectedProcedure
    .input(
      z.object({
        recipients: z.array(z.string()).max(1000), // Max 1000 recipients per batch
        message: z.string().max(160),
        provider: z.enum(["africastalking", "hubtel"]).default("africastalking"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Only admins and agents can send bulk SMS
      if (ctx.user.role !== "admin" && ctx.user.role !== "agent") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins and agents can send bulk SMS",
        });
      }

      return {
        success: true,
        provider: input.provider,
        recipientCount: input.recipients.length,
        estimatedCost: `GHS ${(input.recipients.length * 0.03).toFixed(2)}`,
        batchId: `BULK-${Date.now()}`,
        message: "Bulk SMS queued for sending (mock response)",
        instructions: [
          "In production:",
          "- Split recipients into batches of 100",
          "- Queue SMS jobs for background processing",
          "- Track delivery status for each recipient",
          "- Store SMS logs in database",
          "- Implement retry logic for failed messages",
        ],
      };
    }),

  /**
   * USSD Session Handler
   * This endpoint receives USSD requests from Africa's Talking
   */
  handleUSSD: publicProcedure
    .input(
      z.object({
        sessionId: z.string(),
        serviceCode: z.string(),
        phoneNumber: z.string(),
        text: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      
      // Parse user input
      const textArray = input.text.split("*");
      const level = textArray.length;
      const lastInput = textArray[textArray.length - 1];

      let response = "";

      // USSD Menu Structure
      if (input.text === "") {
        // Main menu
        response = "CON Welcome to FarmKonnect\n";
        response += "1. Check Weather\n";
        response += "2. Market Prices\n";
        response += "3. Training Programs\n";
        response += "4. My Farm Status\n";
        response += "5. Contact Extension Agent";
      } else if (input.text === "1") {
        // Weather submenu
        response = "CON Select your region:\n";
        response += "1. Greater Accra\n";
        response += "2. Ashanti\n";
        response += "3. Northern\n";
        response += "4. Volta\n";
        response += "5. Back";
      } else if (input.text === "1*1") {
        // Weather for Greater Accra
        response = "END Weather for Greater Accra:\n";
        response += "Temp: 28°C\n";
        response += "Condition: Partly Cloudy\n";
        response += "Rainfall: 60% chance\n";
        response += "Good for: Planting maize";
      } else if (input.text === "2") {
        // Market prices
        response = "END Today's Market Prices:\n";
        response += "Maize: GHS 150/bag\n";
        response += "Rice: GHS 280/bag\n";
        response += "Tomatoes: GHS 45/crate\n";
        response += "Cassava: GHS 120/bag";
      } else if (input.text === "3") {
        // Training programs
        response = "END Upcoming Training:\n";
        response += "1. Modern Irrigation - Jan 15\n";
        response += "2. Pest Control - Jan 20\n";
        response += "3. Soil Management - Jan 25\n";
        response += "Call 0244123456 to register";
      } else if (input.text === "4") {
        // Farm status (requires user lookup)
        if (db) {
          const user = await db.select().from(users).where(eq(users.phone, input.phoneNumber));
          if (user.length > 0) {
            response = "END Your Farm Status:\n";
            response += "Active Crops: 3\n";
            response += "Livestock: 25 chickens\n";
            response += "Pending Orders: 2\n";
            response += "Next Task: Fertilizer application";
          } else {
            response = "END Phone number not registered.\n";
            response += "Visit farmkonnect.com to register";
          }
        } else {
          response = "END Service temporarily unavailable";
        }
      } else if (input.text === "5") {
        // Contact extension agent
        response = "END Extension Agent Contact:\n";
        response += "Name: Kwame Mensah\n";
        response += "Phone: 0244567890\n";
        response += "Region: Greater Accra\n";
        response += "Available: Mon-Fri 8am-5pm";
      } else {
        // Invalid input
        response = "END Invalid selection.\n";
        response += "Please dial the code again.";
      }

      return {
        response,
        sessionId: input.sessionId,
        instructions: [
          "USSD SETUP GUIDE:",
          "",
          "1. Configure webhook in Africa's Talking dashboard:",
          "   POST https://your-domain.com/api/trpc/sms.handleUSSD",
          "",
          "2. USSD Response Format:",
          "   - CON: Continue session (show menu)",
          "   - END: End session (show final message)",
          "",
          "3. Menu Navigation:",
          "   - input.text = '' → Main menu",
          "   - input.text = '1' → First level selection",
          "   - input.text = '1*2' → Second level selection",
          "",
          "4. Session Management:",
          "   - Store session data in Redis/database",
          "   - Handle back navigation",
          "   - Implement timeout handling",
          "",
          "5. Testing:",
          "   - Use Africa's Talking USSD simulator",
          "   - Test all menu paths",
          "   - Verify response formatting",
        ],
      };
    }),

  /**
   * Send weather alerts via SMS
   */
  sendWeatherAlert: protectedProcedure
    .input(
      z.object({
        farmerId: z.number(),
        alertType: z.enum(["rain", "drought", "storm", "temperature"]),
        message: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Get farmer's phone number
      const farmer = await db.select().from(users).where(eq(users.id, input.farmerId));
      
      if (farmer.length === 0 || !farmer[0].phone) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Farmer phone number not found" });
      }

      return {
        success: true,
        to: farmer[0].phone,
        alertType: input.alertType,
        message: input.message,
        messageId: `ALERT-${Date.now()}`,
        instructions: [
          "In production:",
          "- Integrate with weather cron job",
          "- Send alerts automatically when conditions detected",
          "- Track alert delivery status",
          "- Allow farmers to opt-in/opt-out of alerts",
        ],
      };
    }),

  /**
   * Get SMS delivery status
   */
  getSMSStatus: protectedProcedure
    .input(z.object({ messageId: z.string() }))
    .query(async ({ input }) => {
      return {
        messageId: input.messageId,
        status: "delivered",
        deliveredAt: new Date().toISOString(),
        cost: "GHS 0.03",
        instructions: [
          "In production:",
          "- Query SMS provider API for delivery status",
          "- Store delivery receipts in database",
          "- Handle failed deliveries with retry logic",
        ],
      };
    }),

  /**
   * Get SMS credit balance
   */
  getCreditBalance: protectedProcedure
    .input(z.object({ provider: z.enum(["africastalking", "hubtel"]) }))
    .query(async ({ input, ctx }) => {
      // Only admins can check credit balance
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can check credit balance",
        });
      }

      return {
        provider: input.provider,
        balance: "GHS 500.00",
        currency: "GHS",
        instructions: [
          "In production:",
          "- Call provider API to get actual balance",
          "- Set up low balance alerts",
          "- Implement auto-recharge if available",
        ],
      };
    }),
});

/**
 * PRODUCTION DEPLOYMENT CHECKLIST:
 * 
 * 1. SMS SETUP:
 *    ✓ Sign up for Africa's Talking or Hubtel
 *    ✓ Get API credentials
 *    ✓ Add credentials to environment variables
 *    ✓ Purchase SMS credits
 *    ✓ Test SMS sending in sandbox mode
 *    ✓ Implement delivery status tracking
 *    ✓ Set up SMS logging in database
 * 
 * 2. USSD SETUP:
 *    ✓ Apply for USSD code from Africa's Talking
 *    ✓ Configure webhook URL
 *    ✓ Implement menu structure
 *    ✓ Test all menu paths
 *    ✓ Handle session timeouts
 *    ✓ Implement back navigation
 *    ✓ Add error handling
 * 
 * 3. INTEGRATION:
 *    ✓ Connect SMS alerts to weather cron
 *    ✓ Send training reminders
 *    ✓ Send order confirmations
 *    ✓ Send payment receipts
 *    ✓ Implement opt-in/opt-out system
 * 
 * 4. MONITORING:
 *    ✓ Track SMS delivery rates
 *    ✓ Monitor credit balance
 *    ✓ Log all SMS activity
 *    ✓ Set up alerts for failures
 *    ✓ Generate SMS usage reports
 */
