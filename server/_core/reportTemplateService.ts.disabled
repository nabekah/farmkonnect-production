import { getDb } from '../db';
import { reportTemplates, reportTemplateFields, ReportTemplate } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

export interface TemplateSection {
  name: string;
  label: string;
  fields: string[];
}

export interface TemplateBranding {
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  companyName?: string;
  footerText?: string;
}

export interface TemplateDataFilter {
  startDate?: Date;
  endDate?: Date;
  categories?: string[];
  minValue?: number;
  maxValue?: number;
}

export const DEFAULT_SECTIONS: TemplateSection[] = [
  {
    name: 'summary',
    label: 'Executive Summary',
    fields: ['totalRevenue', 'totalExpenses', 'netProfit', 'periodCovered'],
  },
  {
    name: 'financial',
    label: 'Financial Overview',
    fields: ['revenue', 'expenses', 'profitMargin', 'cashFlow', 'investments'],
  },
  {
    name: 'livestock',
    label: 'Livestock Status',
    fields: ['totalAnimals', 'healthStatus', 'productionMetrics', 'breeding', 'mortality'],
  },
  {
    name: 'crops',
    label: 'Crop Performance',
    fields: ['activeCycles', 'yield', 'soilHealth', 'treatments', 'harvest'],
  },
  {
    name: 'analytics',
    label: 'Analytics & Trends',
    fields: ['trends', 'predictions', 'comparisons', 'benchmarks'],
  },
  {
    name: 'recommendations',
    label: 'Recommendations',
    fields: ['actionItems', 'improvements', 'risks', 'opportunities'],
  },
];

export class ReportTemplateService {
  /**
   * Create a new report template
   */
  async createTemplate(
    farmId: number,
    name: string,
    reportType: 'financial' | 'livestock' | 'complete',
    sections: string[],
    branding?: TemplateBranding,
    dataFilters?: TemplateDataFilter
  ) {
    const db = await getDb();
    if (!db) throw new Error('Database connection failed');

    const [result] = await db.insert(reportTemplates).values({
      farmId,
      name,
      reportType,
      includeSections: JSON.stringify(sections),
      customBranding: branding ? JSON.stringify(branding) : null,
      dataFilters: dataFilters ? JSON.stringify(dataFilters) : null,
      isDefault: false,
    });

    return result.insertId;
  }

  /**
   * Get template by ID
   */
  async getTemplate(templateId: number) {
    const db = await getDb();
    if (!db) throw new Error('Database connection failed');

    const templates = await db
      .select()
      .from(reportTemplates)
      .where(eq(reportTemplates.id, templateId))
      .limit(1);

    if (!templates.length) return null;

    const template = templates[0];
    const fields = await db
      .select()
      .from(reportTemplateFields)
      .where(eq(reportTemplateFields.templateId, templateId));

    return {
      ...template,
      includeSections: JSON.parse(template.includeSections),
      customBranding: template.customBranding ? JSON.parse(template.customBranding) : null,
      dataFilters: template.dataFilters ? JSON.parse(template.dataFilters) : null,
      fields,
    };
  }

  /**
   * Get all templates for a farm
   */
  async getTemplatesForFarm(farmId: number) {
    const db = await getDb();
    if (!db) throw new Error('Database connection failed');

    const templates = await db
      .select()
      .from(reportTemplates)
      .where(eq(reportTemplates.farmId, farmId));

    return templates.map((t) => ({
      ...t,
      includeSections: JSON.parse(t.includeSections),
      customBranding: t.customBranding ? JSON.parse(t.customBranding) : null,
      dataFilters: t.dataFilters ? JSON.parse(t.dataFilters) : null,
    }));
  }

  /**
   * Update template
   */
  async updateTemplate(
    templateId: number,
    updates: {
      name?: string;
      description?: string;
      includeSections?: string[];
      customBranding?: TemplateBranding;
      dataFilters?: TemplateDataFilter;
      isDefault?: boolean;
    }
  ) {
    const db = await getDb();
    if (!db) throw new Error('Database connection failed');

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (updates.name) updateData.name = updates.name;
    if (updates.description) updateData.description = updates.description;
    if (updates.includeSections) updateData.includeSections = JSON.stringify(updates.includeSections);
    if (updates.customBranding) updateData.customBranding = JSON.stringify(updates.customBranding);
    if (updates.dataFilters) updateData.dataFilters = JSON.stringify(updates.dataFilters);
    if (updates.isDefault !== undefined) updateData.isDefault = updates.isDefault;

    await db.update(reportTemplates).set(updateData).where(eq(reportTemplates.id, templateId));

    return this.getTemplate(templateId);
  }

  /**
   * Delete template
   */
  async deleteTemplate(templateId: number) {
    const db = await getDb();
    if (!db) throw new Error('Database connection failed');

    await db.delete(reportTemplateFields).where(eq(reportTemplateFields.templateId, templateId));
    await db.delete(reportTemplates).where(eq(reportTemplates.id, templateId));

    return true;
  }

  /**
   * Add field to template
   */
  async addFieldToTemplate(
    templateId: number,
    fieldName: string,
    displayName: string,
    fieldType: 'text' | 'number' | 'date' | 'currency' | 'percentage' | 'chart',
    aggregationType?: 'sum' | 'average' | 'count' | 'min' | 'max' | 'none',
    displayOrder?: number
  ) {
    const db = await getDb();
    if (!db) throw new Error('Database connection failed');

    const [result] = await db.insert(reportTemplateFields).values({
      templateId,
      fieldName,
      displayName,
      fieldType,
      aggregationType: aggregationType || 'none',
      displayOrder: displayOrder || 0,
      isVisible: true,
    });

    return result.insertId;
  }

  /**
   * Update field visibility and order
   */
  async updateField(
    fieldId: number,
    updates: {
      isVisible?: boolean;
      displayOrder?: number;
      displayName?: string;
    }
  ) {
    const db = await getDb();
    if (!db) throw new Error('Database connection failed');

    const updateData: any = {};
    if (updates.isVisible !== undefined) updateData.isVisible = updates.isVisible;
    if (updates.displayOrder !== undefined) updateData.displayOrder = updates.displayOrder;
    if (updates.displayName) updateData.displayName = updates.displayName;

    await db.update(reportTemplateFields).set(updateData).where(eq(reportTemplateFields.id, fieldId));

    return true;
  }

  /**
   * Clone template
   */
  async cloneTemplate(templateId: number, newName: string) {
    const db = await getDb();
    if (!db) throw new Error('Database connection failed');

    const template = await this.getTemplate(templateId);
    if (!template) throw new Error('Template not found');

    const [newTemplate] = await db.insert(reportTemplates).values({
      farmId: template.farmId,
      name: newName,
      reportType: template.reportType,
      description: template.description,
      includeSections: template.includeSections ? JSON.stringify(template.includeSections) : '[]',
      customBranding: template.customBranding ? JSON.stringify(template.customBranding) : null,
      dataFilters: template.dataFilters ? JSON.stringify(template.dataFilters) : null,
      isDefault: false,
    });

    // Clone fields
    if (template.fields && template.fields.length > 0) {
      for (const field of template.fields) {
        await db.insert(reportTemplateFields).values({
          templateId: newTemplate.insertId,
          fieldName: field.fieldName,
          displayName: field.displayName,
          fieldType: field.fieldType,
          isVisible: field.isVisible,
          displayOrder: field.displayOrder,
          aggregationType: field.aggregationType,
        });
      }
    }

    return newTemplate.insertId;
  }

  /**
   * Set template as default for farm
   */
  async setDefaultTemplate(farmId: number, templateId: number) {
    const db = await getDb();
    if (!db) throw new Error('Database connection failed');

    // Remove default from all other templates
    await db
      .update(reportTemplates)
      .set({ isDefault: false })
      .where(eq(reportTemplates.farmId, farmId));

    // Set this one as default
    await db
      .update(reportTemplates)
      .set({ isDefault: true })
      .where(eq(reportTemplates.id, templateId));

    return true;
  }

  /**
   * Get default template for farm and report type
   */
  async getDefaultTemplate(farmId: number, reportType: 'financial' | 'livestock' | 'complete') {
    const db = await getDb();
    if (!db) throw new Error('Database connection failed');

    const templates = await db
      .select()
      .from(reportTemplates)
      .where(
        eq(reportTemplates.farmId, farmId) &&
        eq(reportTemplates.reportType, reportType) &&
        eq(reportTemplates.isDefault, true)
      )
      .limit(1);

    if (templates.length > 0) {
      return this.getTemplate(templates[0].id);
    }

    // Return first template of this type if no default
    const allTemplates = await db
      .select()
      .from(reportTemplates)
      .where(
        eq(reportTemplates.farmId, farmId) &&
        eq(reportTemplates.reportType, reportType)
      )
      .limit(1);

    if (allTemplates.length > 0) {
      return this.getTemplate(allTemplates[0].id);
    }

    return null;
  }

  /**
   * Get available sections for report type
   */
  getSectionsForReportType(reportType: 'financial' | 'livestock' | 'complete'): TemplateSection[] {
    if (reportType === 'financial') {
      return DEFAULT_SECTIONS.filter((s) => ['summary', 'financial', 'analytics', 'recommendations'].includes(s.name));
    } else if (reportType === 'livestock') {
      return DEFAULT_SECTIONS.filter((s) => ['summary', 'livestock', 'analytics', 'recommendations'].includes(s.name));
    } else {
      return DEFAULT_SECTIONS;
    }
  }
}

export const reportTemplateService = new ReportTemplateService();
