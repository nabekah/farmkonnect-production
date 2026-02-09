import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { farms } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { reportTemplateService, DEFAULT_SECTIONS } from "../_core/reportTemplateService";

export const reportTemplatesRouter = router({
  /**
   * Create a new report template
   */
  createTemplate: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        name: z.string().min(1),
        reportType: z.enum(["financial", "livestock", "complete"]),
        sections: z.array(z.string()),
        branding: z.object({
          logoUrl: z.string().optional(),
          primaryColor: z.string().optional(),
          secondaryColor: z.string().optional(),
          companyName: z.string().optional(),
          footerText: z.string().optional(),
        }).optional(),
        dataFilters: z.object({
          startDate: z.date().optional(),
          endDate: z.date().optional(),
          categories: z.array(z.string()).optional(),
          minValue: z.number().optional(),
          maxValue: z.number().optional(),
        }).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      // Verify farm ownership
      const farm = await db
        .select()
        .from(farms)
        .where(and(eq(farms.id, input.farmId), eq(farms.farmerUserId, ctx.user.id)))
        .limit(1);

      if (!farm.length) {
        throw new Error("Farm not found or you don't have permission to access it");
      }

      const templateId = await reportTemplateService.createTemplate(
        input.farmId,
        input.name,
        input.reportType,
        input.sections,
        input.branding,
        input.dataFilters
      );

      return {
        success: true,
        templateId,
        message: "Template created successfully",
      };
    }),

  /**
   * Get template by ID
   */
  getTemplate: protectedProcedure
    .input(z.object({ templateId: z.number() }))
    .query(async ({ input, ctx }) => {
      const template = await reportTemplateService.getTemplate(input.templateId);
      if (!template) throw new Error("Template not found");

      // Verify ownership
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const farm = await db
        .select()
        .from(farms)
        .where(and(eq(farms.id, template.farmId), eq(farms.farmerUserId, ctx.user.id)))
        .limit(1);

      if (!farm.length) {
        throw new Error("You don't have permission to access this template");
      }

      return template;
    }),

  /**
   * Get all templates for a farm
   */
  getTemplatesForFarm: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      // Verify farm ownership
      const farm = await db
        .select()
        .from(farms)
        .where(and(eq(farms.id, input.farmId), eq(farms.farmerUserId, ctx.user.id)))
        .limit(1);

      if (!farm.length) {
        throw new Error("Farm not found or you don't have permission to access it");
      }

      return reportTemplateService.getTemplatesForFarm(input.farmId);
    }),

  /**
   * Update template
   */
  updateTemplate: protectedProcedure
    .input(
      z.object({
        templateId: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        includeSections: z.array(z.string()).optional(),
        customBranding: z.object({
          logoUrl: z.string().optional(),
          primaryColor: z.string().optional(),
          secondaryColor: z.string().optional(),
          companyName: z.string().optional(),
          footerText: z.string().optional(),
        }).optional(),
        dataFilters: z.object({
          startDate: z.date().optional(),
          endDate: z.date().optional(),
          categories: z.array(z.string()).optional(),
          minValue: z.number().optional(),
          maxValue: z.number().optional(),
        }).optional(),
        isDefault: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const template = await reportTemplateService.getTemplate(input.templateId);
      if (!template) throw new Error("Template not found");

      // Verify ownership
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const farm = await db
        .select()
        .from(farms)
        .where(and(eq(farms.id, template.farmId), eq(farms.farmerUserId, ctx.user.id)))
        .limit(1);

      if (!farm.length) {
        throw new Error("You don't have permission to modify this template");
      }

      const updated = await reportTemplateService.updateTemplate(input.templateId, {
        name: input.name,
        description: input.description,
        includeSections: input.includeSections,
        customBranding: input.customBranding,
        dataFilters: input.dataFilters,
        isDefault: input.isDefault,
      });

      return {
        success: true,
        template: updated,
        message: "Template updated successfully",
      };
    }),

  /**
   * Delete template
   */
  deleteTemplate: protectedProcedure
    .input(z.object({ templateId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const template = await reportTemplateService.getTemplate(input.templateId);
      if (!template) throw new Error("Template not found");

      // Verify ownership
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const farm = await db
        .select()
        .from(farms)
        .where(and(eq(farms.id, template.farmId), eq(farms.farmerUserId, ctx.user.id)))
        .limit(1);

      if (!farm.length) {
        throw new Error("You don't have permission to delete this template");
      }

      await reportTemplateService.deleteTemplate(input.templateId);

      return {
        success: true,
        message: "Template deleted successfully",
      };
    }),

  /**
   * Clone template
   */
  cloneTemplate: protectedProcedure
    .input(z.object({ templateId: z.number(), newName: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const template = await reportTemplateService.getTemplate(input.templateId);
      if (!template) throw new Error("Template not found");

      // Verify ownership
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const farm = await db
        .select()
        .from(farms)
        .where(and(eq(farms.id, template.farmId), eq(farms.farmerUserId, ctx.user.id)))
        .limit(1);

      if (!farm.length) {
        throw new Error("You don't have permission to clone this template");
      }

      const newTemplateId = await reportTemplateService.cloneTemplate(input.templateId, input.newName);

      return {
        success: true,
        templateId: newTemplateId,
        message: "Template cloned successfully",
      };
    }),

  /**
   * Set template as default
   */
  setDefaultTemplate: protectedProcedure
    .input(z.object({ farmId: z.number(), templateId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      // Verify farm ownership
      const farm = await db
        .select()
        .from(farms)
        .where(and(eq(farms.id, input.farmId), eq(farms.farmerUserId, ctx.user.id)))
        .limit(1);

      if (!farm.length) {
        throw new Error("Farm not found or you don't have permission to access it");
      }

      const template = await reportTemplateService.getTemplate(input.templateId);
      if (!template) throw new Error("Template not found");

      if (template.farmId !== input.farmId) {
        throw new Error("Template does not belong to this farm");
      }

      await reportTemplateService.setDefaultTemplate(input.farmId, input.templateId);

      return {
        success: true,
        message: "Default template set successfully",
      };
    }),

  /**
   * Get available sections for report type
   */
  getAvailableSections: protectedProcedure
    .input(z.object({ reportType: z.enum(["financial", "livestock", "complete"]) }))
    .query(({ input }) => {
      return reportTemplateService.getSectionsForReportType(input.reportType);
    }),

  /**
   * Add field to template
   */
  addFieldToTemplate: protectedProcedure
    .input(
      z.object({
        templateId: z.number(),
        fieldName: z.string(),
        displayName: z.string(),
        fieldType: z.enum(["text", "number", "date", "currency", "percentage", "chart"]),
        aggregationType: z.enum(["sum", "average", "count", "min", "max", "none"]).optional(),
        displayOrder: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const template = await reportTemplateService.getTemplate(input.templateId);
      if (!template) throw new Error("Template not found");

      // Verify ownership
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const farm = await db
        .select()
        .from(farms)
        .where(and(eq(farms.id, template.farmId), eq(farms.farmerUserId, ctx.user.id)))
        .limit(1);

      if (!farm.length) {
        throw new Error("You don't have permission to modify this template");
      }

      const fieldId = await reportTemplateService.addFieldToTemplate(
        input.templateId,
        input.fieldName,
        input.displayName,
        input.fieldType,
        input.aggregationType,
        input.displayOrder
      );

      return {
        success: true,
        fieldId,
        message: "Field added successfully",
      };
    }),
});
