/**
 * SMS Notification Service for Ghana
 * 
 * This module provides SMS sending functionality using Ghana SMS gateways.
 * Currently configured for Hubtel SMS API.
 * 
 * To use this service:
 * 1. Sign up at https://hubtel.com/
 * 2. Get your API Key and Client ID
 * 3. Add to environment variables:
 *    - HUBTEL_API_KEY
 *    - HUBTEL_CLIENT_ID
 */

interface SMSOptions {
  to: string; // Phone number in international format (e.g., +233XXXXXXXXX)
  message: string;
  from?: string; // Sender ID (optional, defaults to "FarmKonnect")
}

interface SMSResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send SMS via Hubtel API
 */
export async function sendSMS(options: SMSOptions): Promise<SMSResponse> {
  const apiKey = process.env.HUBTEL_API_KEY;
  const clientId = process.env.HUBTEL_CLIENT_ID;

  // If SMS credentials are not configured, log and return success (dev mode)
  if (!apiKey || !clientId) {
    console.log("[SMS] Credentials not configured. SMS would have been sent:");
    console.log(`  To: ${options.to}`);
    console.log(`  Message: ${options.message}`);
    return { success: true, messageId: "dev-mode-" + Date.now() };
  }

  try {
    // Hubtel SMS API endpoint
    const url = "https://smsc.hubtel.com/v1/messages/send";

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(`${clientId}:${apiKey}`).toString("base64")}`,
      },
      body: JSON.stringify({
        From: options.from || "FarmKonnect",
        To: options.to,
        Content: options.message,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("[SMS] Failed to send:", error);
      return { success: false, error: `HTTP ${response.status}: ${error}` };
    }

    const data = await response.json();
    console.log("[SMS] Sent successfully:", data);

    return {
      success: true,
      messageId: data.MessageId || data.messageId,
    };
  } catch (error: any) {
    console.error("[SMS] Error sending SMS:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Send order notification SMS to buyer
 */
export async function sendOrderNotificationToBuyer(
  phone: string,
  orderNumber: string,
  status: string,
  trackingNumber?: string
): Promise<SMSResponse> {
  const statusMessages: Record<string, string> = {
    pending: `Your order ${orderNumber} has been placed successfully. We'll notify you when it's confirmed.`,
    confirmed: `Good news! Your order ${orderNumber} has been confirmed and is being prepared for shipping.`,
    shipped: `Your order ${orderNumber} has been shipped! ${trackingNumber ? `Track it with: ${trackingNumber}` : ""}`,
    delivered: `Your order ${orderNumber} has been delivered. Thank you for shopping with FarmKonnect!`,
    cancelled: `Your order ${orderNumber} has been cancelled. Contact support if you have questions.`,
  };

  const message = statusMessages[status] || `Order ${orderNumber} status: ${status}`;

  return sendSMS({ to: phone, message });
}

/**
 * Send order notification SMS to seller
 */
export async function sendOrderNotificationToSeller(
  phone: string,
  orderNumber: string,
  buyerName: string,
  totalAmount: string
): Promise<SMSResponse> {
  const message = `New order ${orderNumber} from ${buyerName}. Amount: GH₵${totalAmount}. Log in to FarmKonnect to confirm.`;

  return sendSMS({ to: phone, message });
}

/**
 * Validate Ghana phone number format
 */
export function validateGhanaPhone(phone: string): { valid: boolean; formatted?: string; error?: string } {
  // Remove spaces, dashes, and parentheses
  const cleaned = phone.replace(/[\s\-\(\)]/g, "");

  // Check if it starts with +233 or 233 or 0
  let formatted: string;

  if (cleaned.startsWith("+233")) {
    formatted = cleaned;
  } else if (cleaned.startsWith("233")) {
    formatted = "+" + cleaned;
  } else if (cleaned.startsWith("0")) {
    formatted = "+233" + cleaned.slice(1);
  } else {
    return { valid: false, error: "Phone number must start with +233, 233, or 0" };
  }

  // Check if the number has the correct length (+233 + 9 digits = 13 characters)
  if (formatted.length !== 13) {
    return { valid: false, error: "Phone number must have 10 digits after country code" };
  }

  // Check if all characters after +233 are digits
  if (!/^\+233\d{9}$/.test(formatted)) {
    return { valid: false, error: "Phone number contains invalid characters" };
  }

  return { valid: true, formatted };
}
