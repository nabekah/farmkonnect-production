import { getDb } from "../db";
import {
  reportTemplates,
  reportTemplateSections,
  reportTemplateCustomization,
} from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

export class ReportTemplateCustomizationService {
  /**
   * Get all sections for a template
   */
  async getTemplateSections(templateId: number): Promise<any[]> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    return await db
      .select()
      .from(reportTemplateSections)
      .where(eq(reportTemplateSections.templateId, templateId))
      .orderBy(reportTemplateSections.displayOrder);
  }

  /**
   * Update section visibility
   */
  async updateSectionVisibility(
    sectionId: number,
    isEnabled: boolean
  ) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    return await db
      .update(reportTemplateSections)
      .set({ isEnabled })
      .where(eq(reportTemplateSections.id, sectionId));
  }

  /**
   * Reorder template sections
   */
  async reorderSections(
    templateId: number,
    sections: Array<{ id: number; displayOrder: number }>
  ) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    for (const section of sections) {
      await db
        .update(reportTemplateSections)
        .set({ displayOrder: section.displayOrder })
        .where(
          and(
            eq(reportTemplateSections.id, section.id),
            eq(reportTemplateSections.templateId, templateId)
          )
        );
    }
    return true;
  }

  /**
   * Add custom section to template
   */
  async addCustomSection(
    templateId: number,
    sectionName: string,
    customContent: string,
    displayOrder: number
  ) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const result = await db.insert(reportTemplateSections).values({
      templateId,
      sectionName,
      sectionType: "custom",
      customContent,
      displayOrder,
      isEnabled: true,
    });
    return result;
  }

  /**
   * Delete custom section
   */
  async deleteCustomSection(sectionId: number) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    return await db
      .delete(reportTemplateSections)
      .where(eq(reportTemplateSections.id, sectionId));
  }

  /**
   * Get template customization for a farm
   */
  async getCustomization(templateId: number, farmId: number) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const customization = await db
      .select()
      .from(reportTemplateCustomization)
      .where(
        and(
          eq(reportTemplateCustomization.templateId, templateId),
          eq(reportTemplateCustomization.farmId, farmId)
        )
      )
      .then((rows: any) => rows[0]);

    return customization;
  }

  /**
   * Update template customization
   */
  async updateCustomization(
    templateId: number,
    farmId: number,
    customization: {
      brandingColor?: string;
      headerText?: string;
      footerText?: string;
      logoUrl?: string;
      includeCharts?: boolean;
      includeMetrics?: boolean;
      includeRecommendations?: boolean;
      pageOrientation?: "portrait" | "landscape";
    }
  ) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const existing = await this.getCustomization(templateId, farmId);

    if (existing) {
      return await db
        .update(reportTemplateCustomization)
        .set(customization)
        .where(
          and(
            eq(reportTemplateCustomization.templateId, templateId),
            eq(reportTemplateCustomization.farmId, farmId)
          )
        );
    } else {
      return await db.insert(reportTemplateCustomization).values({
        templateId,
        farmId,
        ...customization,
      });
    }
  }

  /**
   * Get enabled sections for report generation
   */
  async getEnabledSections(templateId: number): Promise<any[]> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    return await db
      .select()
      .from(reportTemplateSections)
      .where(
        and(
          eq(reportTemplateSections.templateId, templateId),
          eq(reportTemplateSections.isEnabled, true)
        )
      )
      .orderBy(reportTemplateSections.displayOrder);
  }

  /**
   * Generate report with custom sections and branding
   */
  async generateCustomReport(
    templateId: number,
    farmId: number,
    reportData: any
  ) {
    const customization = await this.getCustomization(templateId, farmId);
    const enabledSections = await this.getEnabledSections(templateId);

    const reportConfig = {
      branding: {
        color: customization?.brandingColor || "#2563eb",
        headerText: customization?.headerText || "Farm Report",
        footerText: customization?.footerText || "",
        logoUrl: customization?.logoUrl || null,
      },
      layout: {
        orientation: customization?.pageOrientation || "portrait",
        includeCharts: customization?.includeCharts ?? true,
        includeMetrics: customization?.includeMetrics ?? true,
        includeRecommendations: customization?.includeRecommendations ?? true,
      },
      sections: enabledSections.map((section: any) => ({
        id: section.id,
        name: section.sectionName,
        type: section.sectionType,
        content: section.customContent,
        order: section.displayOrder,
      })),
      data: reportData,
    };

    return reportConfig;
  }

  /**
   * Clone template customization from one farm to another
   */
  async cloneCustomization(
    templateId: number,
    fromFarmId: number,
    toFarmId: number
  ) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const sourceCustomization = await this.getCustomization(
      templateId,
      fromFarmId
    );

    if (sourceCustomization) {
      const { id, createdAt, updatedAt, ...customizationData } =
        sourceCustomization;

      return await db.insert(reportTemplateCustomization).values({
        ...customizationData,
        farmId: toFarmId,
      });
    }

    return null;
  }

  /**
   * Get customization statistics
   */
  async getCustomizationStats(templateId: number) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const customizations = await db
      .select()
      .from(reportTemplateCustomization)
      .where(eq(reportTemplateCustomization.templateId, templateId));

    const sections = await db
      .select()
      .from(reportTemplateSections)
      .where(eq(reportTemplateSections.templateId, templateId));

    const enabledSections = sections.filter((s: any) => s.isEnabled).length;

    return {
      totalCustomizations: customizations.length,
      totalSections: sections.length,
      enabledSections,
      customizationsWithBranding: customizations.filter(
        (c: any) => c.brandingColor || c.logoUrl
      ).length,
      customizationsWithCustomContent: customizations.filter(
        (c: any) => c.headerText || c.footerText
      ).length,
    };
  }
}

export const reportTemplateCustomizationService =
  new ReportTemplateCustomizationService();
