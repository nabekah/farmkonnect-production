import { invokeLLM } from "../_core/llm";

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || "noreply@farmkonnect.app";
const FRONTEND_URL = process.env.VITE_FRONTEND_URL || "https://farmkonnect.app";

interface EmailOptions {
  to: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
}

interface SendGridResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send email using SendGrid API
 */
export async function sendEmail(options: EmailOptions): Promise<SendGridResponse> {
  try {
    if (!SENDGRID_API_KEY) {
      console.error("SendGrid API key not configured");
      return { success: false, error: "Email service not configured" };
    }

    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SENDGRID_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: options.to }],
            subject: options.subject
          }
        ],
        from: { email: SENDGRID_FROM_EMAIL },
        content: [
          {
            type: "text/html",
            value: options.htmlContent
          },
          ...(options.textContent ? [{
            type: "text/plain",
            value: options.textContent
          }] : [])
        ]
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("SendGrid API error:", error);
      return { success: false, error: `SendGrid error: ${response.status}` };
    }

    const messageId = response.headers.get("X-Message-Id");
    return { success: true, messageId: messageId || undefined };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

/**
 * Send email verification link to user
 */
export async function sendVerificationEmail(
  email: string,
  name: string,
  verificationToken: string
): Promise<SendGridResponse> {
  const verificationUrl = `${FRONTEND_URL}/verify-email?token=${verificationToken}`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px;">
        <h2 style="color: #333; margin-bottom: 20px;">Welcome to FarmKonnect, ${name}!</h2>
        
        <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
          Thank you for registering with FarmKonnect. To complete your registration, please verify your email address by clicking the button below.
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">
            Verify Email Address
          </a>
        </div>

        <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;">
          If you didn't create this account, please ignore this email. This link will expire in 24 hours.
        </p>

        <p style="color: #999; font-size: 12px;">
          Or copy and paste this link in your browser:<br/>
          <span style="word-break: break-all;">${verificationUrl}</span>
        </p>
      </div>
    </div>
  `;

  const textContent = `
Welcome to FarmKonnect, ${name}!

Thank you for registering with FarmKonnect. To complete your registration, please verify your email address by clicking the link below.

${verificationUrl}

If you didn't create this account, please ignore this email. This link will expire in 24 hours.
  `;

  return sendEmail({
    to: email,
    subject: "Verify Your FarmKonnect Email Address",
    htmlContent,
    textContent
  });
}

/**
 * Send approval notification to user
 */
export async function sendApprovalEmail(
  email: string,
  name: string
): Promise<SendGridResponse> {
  const loginUrl = `${FRONTEND_URL}/login`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px;">
        <h2 style="color: #4CAF50; margin-bottom: 20px;">Your Registration Has Been Approved! ✓</h2>
        
        <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
          Hi ${name},
        </p>

        <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
          Great news! Your FarmKonnect account has been approved and is now active. You can now log in and start using all the features of FarmKonnect.
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${loginUrl}" style="background-color: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">
            Log In to FarmKonnect
          </a>
        </div>

        <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
          If you have any questions or need assistance, please don't hesitate to contact our support team.
        </p>

        <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;">
          Best regards,<br/>
          The FarmKonnect Team
        </p>
      </div>
    </div>
  `;

  const textContent = `
Your Registration Has Been Approved!

Hi ${name},

Great news! Your FarmKonnect account has been approved and is now active. You can now log in and start using all the features of FarmKonnect.

Log in here: ${loginUrl}

If you have any questions or need assistance, please don't hesitate to contact our support team.

Best regards,
The FarmKonnect Team
  `;

  return sendEmail({
    to: email,
    subject: "Your FarmKonnect Account Has Been Approved",
    htmlContent,
    textContent
  });
}

/**
 * Send rejection notification to user
 */
export async function sendRejectionEmail(
  email: string,
  name: string,
  reason: string
): Promise<SendGridResponse> {
  const supportEmail = "support@farmkonnect.app";

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px;">
        <h2 style="color: #d32f2f; margin-bottom: 20px;">Registration Status Update</h2>
        
        <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
          Hi ${name},
        </p>

        <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
          Thank you for your interest in FarmKonnect. Unfortunately, your registration request has been declined at this time.
        </p>

        <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="color: #856404; margin: 0;">
            <strong>Reason:</strong> ${reason}
          </p>
        </div>

        <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
          If you believe this decision was made in error or have questions about your application, please contact our support team at ${supportEmail}.
        </p>

        <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;">
          Best regards,<br/>
          The FarmKonnect Team
        </p>
      </div>
    </div>
  `;

  const textContent = `
Registration Status Update

Hi ${name},

Thank you for your interest in FarmKonnect. Unfortunately, your registration request has been declined at this time.

Reason: ${reason}

If you believe this decision was made in error or have questions about your application, please contact our support team at ${supportEmail}.

Best regards,
The FarmKonnect Team
  `;

  return sendEmail({
    to: email,
    subject: "FarmKonnect Registration Status",
    htmlContent,
    textContent
  });
}

/**
 * Send suspension notification to user
 */
export async function sendSuspensionEmail(
  email: string,
  name: string,
  reason: string
): Promise<SendGridResponse> {
  const supportEmail = "support@farmkonnect.app";

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px;">
        <h2 style="color: #d32f2f; margin-bottom: 20px;">Account Suspension Notice</h2>
        
        <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
          Hi ${name},
        </p>

        <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
          Your FarmKonnect account has been temporarily suspended.
        </p>

        <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="color: #856404; margin: 0;">
            <strong>Reason:</strong> ${reason}
          </p>
        </div>

        <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
          If you have questions about this suspension or would like to appeal this decision, please contact our support team at ${supportEmail}.
        </p>

        <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;">
          Best regards,<br/>
          The FarmKonnect Team
        </p>
      </div>
    </div>
  `;

  const textContent = `
Account Suspension Notice

Hi ${name},

Your FarmKonnect account has been temporarily suspended.

Reason: ${reason}

If you have questions about this suspension or would like to appeal this decision, please contact our support team at ${supportEmail}.

Best regards,
The FarmKonnect Team
  `;

  return sendEmail({
    to: email,
    subject: "FarmKonnect Account Suspension",
    htmlContent,
    textContent
  });
}
