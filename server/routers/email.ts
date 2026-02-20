import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { NotificationService } from "../_core/notificationService";

const notificationService = new NotificationService();

export const emailRouter = router({
  // Send a test email to verify email functionality
  sendTestEmail: protectedProcedure
    .input(
      z.object({
        recipientEmail: z.string().email("Invalid email address"),
        subject: z.string().optional().default("FarmKonnect Test Email"),
        testType: z.enum(["basic", "welcome", "alert"]).optional().default("basic"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { recipientEmail, subject, testType } = input;
      const userName = ctx.user.name || "User";

      // Generate HTML content based on test type
      let htmlContent = "";

      switch (testType) {
        case "welcome":
          htmlContent = `
            <html>
              <body style="font-family: Arial, sans-serif; background-color: #f5f5f5;">
                <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px;">
                  <h1 style="color: #2c3e50; margin-bottom: 20px;">Welcome to FarmKonnect!</h1>
                  <p style="color: #555; font-size: 16px; line-height: 1.6;">
                    Hello ${userName},
                  </p>
                  <p style="color: #555; font-size: 16px; line-height: 1.6;">
                    This is a test email to confirm that your email notifications are working correctly.
                  </p>
                  <p style="color: #555; font-size: 16px; line-height: 1.6;">
                    You can now receive important updates about your farms, crops, and tasks directly in your inbox.
                  </p>
                  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #999; font-size: 12px;">
                    <p>FarmKonnect Team</p>
                    <p>© 2026 FarmKonnect. All rights reserved.</p>
                  </div>
                </div>
              </body>
            </html>
          `;
          break;

        case "alert":
          htmlContent = `
            <html>
              <body style="font-family: Arial, sans-serif; background-color: #f5f5f5;">
                <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; border-left: 4px solid #e74c3c;">
                  <h1 style="color: #e74c3c; margin-bottom: 20px;">⚠️ Alert Notification Test</h1>
                  <p style="color: #555; font-size: 16px; line-height: 1.6;">
                    Hello ${userName},
                  </p>
                  <p style="color: #555; font-size: 16px; line-height: 1.6;">
                    This is a test alert email to verify that critical notifications are being delivered to your inbox.
                  </p>
                  <div style="background-color: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 4px; margin: 20px 0;">
                    <p style="color: #856404; margin: 0;">
                      <strong>Test Alert:</strong> This is a sample alert to demonstrate notification delivery.
                    </p>
                  </div>
                  <p style="color: #555; font-size: 16px; line-height: 1.6;">
                    If you received this email, your alert notifications are working properly.
                  </p>
                  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #999; font-size: 12px;">
                    <p>FarmKonnect Team</p>
                    <p>© 2026 FarmKonnect. All rights reserved.</p>
                  </div>
                </div>
              </body>
            </html>
          `;
          break;

        case "basic":
        default:
          htmlContent = `
            <html>
              <body style="font-family: Arial, sans-serif; background-color: #f5f5f5;">
                <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px;">
                  <h1 style="color: #2c3e50; margin-bottom: 20px;">FarmKonnect Test Email</h1>
                  <p style="color: #555; font-size: 16px; line-height: 1.6;">
                    Hello ${userName},
                  </p>
                  <p style="color: #555; font-size: 16px; line-height: 1.6;">
                    This is a test email from FarmKonnect to verify that your email notifications are working correctly.
                  </p>
                  <div style="background-color: #e8f4f8; border: 1px solid #b3d9e8; padding: 15px; border-radius: 4px; margin: 20px 0;">
                    <p style="color: #2c3e50; margin: 0;">
                      <strong>✓ Email Delivery Confirmed</strong><br/>
                      Your email notifications are active and working properly.
                    </p>
                  </div>
                  <p style="color: #555; font-size: 16px; line-height: 1.6;">
                    You can manage your notification preferences in your account settings.
                  </p>
                  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #999; font-size: 12px;">
                    <p>FarmKonnect Team</p>
                    <p>© 2026 FarmKonnect. All rights reserved.</p>
                  </div>
                </div>
              </body>
            </html>
          `;
      }

      try {
        const result = await notificationService.sendEmail(
          recipientEmail,
          subject,
          htmlContent
        );

        if (result.success) {
          return {
            success: true,
            message: `Test email sent successfully to ${recipientEmail}`,
            recipient: recipientEmail,
            testType,
          };
        } else {
          return {
            success: false,
            message: `Failed to send test email: ${result.error}`,
            error: result.error,
          };
        }
      } catch (error: any) {
        console.error("[emailRouter] Error sending test email:", error);
        return {
          success: false,
          message: `Error sending test email: ${error.message}`,
          error: error.message,
        };
      }
    }),

  // Send email to owner
  sendEmailToOwner: protectedProcedure
    .input(
      z.object({
        subject: z.string(),
        html: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { subject, html } = input;

      // Only allow admins to send emails to owner
      if (ctx.user.role !== "admin") {
        throw new Error("Only administrators can send emails to the owner");
      }

      const ownerEmail = process.env.OWNER_EMAIL || "owner@farmkonnect.com";

      try {
        const result = await notificationService.sendEmail(
          ownerEmail,
          subject,
          html
        );

        if (result.success) {
          return {
            success: true,
            message: `Email sent successfully to owner`,
          };
        } else {
          return {
            success: false,
            message: `Failed to send email to owner: ${result.error}`,
            error: result.error,
          };
        }
      } catch (error: any) {
        console.error("[emailRouter] Error sending email to owner:", error);
        return {
          success: false,
          message: `Error sending email to owner: ${error.message}`,
          error: error.message,
        };
      }
    }),
});
