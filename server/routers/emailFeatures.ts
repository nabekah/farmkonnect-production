import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import {
  emailTemplates,
  emailAnalytics,
  emailCampaigns,
  emailCampaignRecipients,
} from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY || "");

export const emailFeaturesRouter = router({
  // ============================================================================
  // EMAIL TEMPLATES
  // ============================================================================
  
  /**
   * Create a custom email template
   */
  createTemplate: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        description: z.string().optional(),
        subject: z.string().min(1).max(255),
        htmlContent: z.string().min(1),
        plainTextContent: z.string().optional(),
        isDefault: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      
      const result = await db.insert(emailTemplates).values({
        userId: ctx.user.id,
        name: input.name,
        description: input.description,
        templateType: "custom",
        subject: input.subject,
        htmlContent: input.htmlContent,
        plainTextContent: input.plainTextContent,
        isDefault: input.isDefault,
      });

      return {
        success: true,
        templateId: result[0],
        message: "Template created successfully",
      };
    }),

  /**
   * Get all templates for the user
   */
  getTemplates: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    
    const templates = await db
      .select()
      .from(emailTemplates)
      .where(and(eq(emailTemplates.userId, ctx.user.id), eq(emailTemplates.isActive, true)))
      .orderBy(desc(emailTemplates.createdAt));

    return templates;
  }),

  /**
   * Update an email template
   */
  updateTemplate: protectedProcedure
    .input(
      z.object({
        templateId: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        subject: z.string().optional(),
        htmlContent: z.string().optional(),
        plainTextContent: z.string().optional(),
        isDefault: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      
      const template = await db
        .select()
        .from(emailTemplates)
        .where(
          and(
            eq(emailTemplates.id, input.templateId),
            eq(emailTemplates.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!template.length) {
        return { success: false, message: "Template not found" };
      }

      await db
        .update(emailTemplates)
        .set({
          name: input.name || template[0].name,
          description: input.description || template[0].description,
          subject: input.subject || template[0].subject,
          htmlContent: input.htmlContent || template[0].htmlContent,
          plainTextContent: input.plainTextContent || template[0].plainTextContent,
          isDefault: input.isDefault !== undefined ? input.isDefault : template[0].isDefault,
        })
        .where(eq(emailTemplates.id, input.templateId));

      return { success: true, message: "Template updated successfully" };
    }),

  /**
   * Delete an email template
   */
  deleteTemplate: protectedProcedure
    .input(z.object({ templateId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      
      await db
        .update(emailTemplates)
        .set({ isActive: false })
        .where(
          and(
            eq(emailTemplates.id, input.templateId),
            eq(emailTemplates.userId, ctx.user.id)
          )
        );

      return { success: true, message: "Template deleted successfully" };
    }),

  // ============================================================================
  // BULK EMAIL SENDING
  // ============================================================================

  /**
   * Create a bulk email campaign
   */
  createBulkCampaign: protectedProcedure
    .input(
      z.object({
        templateId: z.number(),
        campaignName: z.string().min(1).max(255),
        description: z.string().optional(),
        recipients: z.array(z.string().email()),
        scheduledTime: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();

      // Create campaign
      const campaignResult = await db.insert(emailCampaigns).values({
        userId: ctx.user.id,
        templateId: input.templateId,
        campaignName: input.campaignName,
        description: input.description,
        recipientCount: input.recipients.length,
        status: input.scheduledTime ? "scheduled" : "draft",
        scheduledTime: input.scheduledTime,
      });

      const campaignId = campaignResult[0];

      // Add recipients
      await db.insert(emailCampaignRecipients).values(
        input.recipients.map((email) => ({
          campaignId,
          email,
          status: "pending" as const,
        }))
      );

      return {
        success: true,
        campaignId,
        message: "Campaign created successfully",
      };
    }),

  /**
   * Send a bulk email campaign
   */
  sendBulkCampaign: protectedProcedure
    .input(z.object({ campaignId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();

      // Get campaign
      const campaign = await db
        .select()
        .from(emailCampaigns)
        .where(
          and(
            eq(emailCampaigns.id, input.campaignId),
            eq(emailCampaigns.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!campaign.length) {
        return { success: false, message: "Campaign not found" };
      }

      // Get template
      const template = await db
        .select()
        .from(emailTemplates)
        .where(eq(emailTemplates.id, campaign[0].templateId))
        .limit(1);

      if (!template.length) {
        return { success: false, message: "Template not found" };
      }

      // Get recipients
      const recipients = await db
        .select()
        .from(emailCampaignRecipients)
        .where(
          and(
            eq(emailCampaignRecipients.campaignId, input.campaignId),
            eq(emailCampaignRecipients.status, "pending")
          )
        );

      // Update campaign status
      await db
        .update(emailCampaigns)
        .set({ status: "sending" })
        .where(eq(emailCampaigns.id, input.campaignId));

      let successCount = 0;
      let failureCount = 0;

      // Send emails
      for (const recipient of recipients) {
        try {
          const msg = {
            to: recipient.email,
            from: process.env.SENDGRID_FROM_EMAIL || "noreply@farmconnekt.com",
            subject: template[0].subject,
            html: template[0].htmlContent,
            text: template[0].plainTextContent,
            replyTo: process.env.SENDGRID_REPLY_EMAIL || "noreply@farmconnekt.com",
          };

          const response = await sgMail.send(msg);

          // Record analytics
          await db.insert(emailAnalytics).values({
            userId: ctx.user.id,
            templateId: template[0].id,
            messageId: response[0].headers["x-message-id"],
            recipientEmail: recipient.email,
            subject: template[0].subject,
            status: "sent",
            sendTime: new Date(),
          });

          // Update recipient status
          await db
            .update(emailCampaignRecipients)
            .set({ status: "sent", sentAt: new Date() })
            .where(eq(emailCampaignRecipients.id, recipient.id));

          successCount++;
        } catch (error: any) {
          failureCount++;

          // Update recipient status with error
          await db
            .update(emailCampaignRecipients)
            .set({
              status: "failed",
              errorMessage: error.message || "Unknown error",
            })
            .where(eq(emailCampaignRecipients.id, recipient.id));

          // Record failed analytics
          await db.insert(emailAnalytics).values({
            userId: ctx.user.id,
            templateId: template[0].id,
            recipientEmail: recipient.email,
            subject: template[0].subject,
            status: "bounced",
            bounceReason: error.message || "Unknown error",
          });
        }
      }

      // Update campaign final status
      await db
        .update(emailCampaigns)
        .set({
          status: "completed",
          successCount,
          failureCount,
          completedAt: new Date(),
        })
        .where(eq(emailCampaigns.id, input.campaignId));

      return {
        success: true,
        successCount,
        failureCount,
        message: `Campaign sent: ${successCount} successful, ${failureCount} failed`,
      };
    }),

  /**
   * Get bulk campaigns
   */
  getCampaigns: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();

    const campaigns = await db
      .select()
      .from(emailCampaigns)
      .where(eq(emailCampaigns.userId, ctx.user.id))
      .orderBy(desc(emailCampaigns.createdAt));

    return campaigns;
  }),

  // ============================================================================
  // EMAIL ANALYTICS
  // ============================================================================

  /**
   * Get email analytics
   */
  getAnalytics: protectedProcedure
    .input(
      z.object({
        days: z.number().default(30),
        templateId: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);

      let query = db
        .select()
        .from(emailAnalytics)
        .where(
          and(
            eq(emailAnalytics.userId, ctx.user.id),
            // Add date filter if needed
          )
        );

      if (input.templateId) {
        query = db
          .select()
          .from(emailAnalytics)
          .where(
            and(
              eq(emailAnalytics.userId, ctx.user.id),
              eq(emailAnalytics.templateId, input.templateId)
            )
          );
      }

      const analytics = await query.orderBy(desc(emailAnalytics.createdAt));

      // Calculate statistics
      const stats = {
        totalSent: analytics.filter((a) => a.status === "sent").length,
        totalDelivered: analytics.filter((a) => a.status === "delivered").length,
        totalOpened: analytics.filter((a) => a.status === "opened").length,
        totalClicked: analytics.filter((a) => a.status === "clicked").length,
        totalBounced: analytics.filter((a) => a.status === "bounced").length,
        totalComplained: analytics.filter((a) => a.status === "complained").length,
        deliveryRate: 0,
        openRate: 0,
        clickRate: 0,
      };

      if (stats.totalSent > 0) {
        stats.deliveryRate = (stats.totalDelivered / stats.totalSent) * 100;
        stats.openRate = (stats.totalOpened / stats.totalDelivered) * 100;
        stats.clickRate = (stats.totalClicked / stats.totalDelivered) * 100;
      }

      return {
        analytics,
        stats,
      };
    }),

  /**
   * Get email summary statistics
   */
  getSummary: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();

    const allAnalytics = await db
      .select()
      .from(emailAnalytics)
      .where(eq(emailAnalytics.userId, ctx.user.id));

    const summary = {
      totalEmailsSent: allAnalytics.length,
      totalDelivered: allAnalytics.filter((a) => a.status === "delivered").length,
      totalOpened: allAnalytics.filter((a) => a.status === "opened").length,
      totalClicked: allAnalytics.filter((a) => a.status === "clicked").length,
      totalBounced: allAnalytics.filter((a) => a.status === "bounced").length,
      totalCampaigns: (
        await db
          .select()
          .from(emailCampaigns)
          .where(eq(emailCampaigns.userId, ctx.user.id))
      ).length,
      totalTemplates: (
        await db
          .select()
          .from(emailTemplates)
          .where(eq(emailTemplates.userId, ctx.user.id))
      ).length,
    };

    return summary;
  }),
});
