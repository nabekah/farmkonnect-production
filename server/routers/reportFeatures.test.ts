import { describe, it, expect } from "vitest";
import { reportTemplateService, DEFAULT_SECTIONS } from "../_core/reportTemplateService";

describe("Report Template Service Logic", () => {
  describe("Section Management", () => {
    it("should get financial sections for financial report type", () => {
      const sections = reportTemplateService.getSectionsForReportType("financial");

      expect(sections.length).toBeGreaterThan(0);
      expect(sections.some((s) => s.name === "financial")).toBe(true);
      expect(sections.some((s) => s.name === "summary")).toBe(true);
    });

    it("should get livestock sections for livestock report type", () => {
      const sections = reportTemplateService.getSectionsForReportType("livestock");

      expect(sections.length).toBeGreaterThan(0);
      expect(sections.some((s) => s.name === "livestock")).toBe(true);
      expect(sections.some((s) => s.name === "summary")).toBe(true);
    });

    it("should get all sections for complete report type", () => {
      const sections = reportTemplateService.getSectionsForReportType("complete");

      expect(sections.length).toBeGreaterThan(0);
      expect(sections.length).toBe(DEFAULT_SECTIONS.length);
    });

    it("should have correct section structure", () => {
      const sections = reportTemplateService.getSectionsForReportType("financial");

      sections.forEach((section) => {
        expect(section).toHaveProperty("name");
        expect(section).toHaveProperty("label");
        expect(section).toHaveProperty("fields");
        expect(Array.isArray(section.fields)).toBe(true);
        expect(section.fields.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Template Service Structure", () => {
    it("should have all required methods", () => {
      expect(typeof reportTemplateService.createTemplate).toBe("function");
      expect(typeof reportTemplateService.getTemplate).toBe("function");
      expect(typeof reportTemplateService.getTemplatesForFarm).toBe("function");
      expect(typeof reportTemplateService.updateTemplate).toBe("function");
      expect(typeof reportTemplateService.deleteTemplate).toBe("function");
      expect(typeof reportTemplateService.cloneTemplate).toBe("function");
      expect(typeof reportTemplateService.setDefaultTemplate).toBe("function");
      expect(typeof reportTemplateService.addFieldToTemplate).toBe("function");
      expect(typeof reportTemplateService.updateField).toBe("function");
      expect(typeof reportTemplateService.getDefaultTemplate).toBe("function");
      expect(typeof reportTemplateService.getSectionsForReportType).toBe("function");
    });
  });

  describe("Default Sections", () => {
    it("should have all required default sections", () => {
      expect(DEFAULT_SECTIONS.length).toBeGreaterThan(0);

      const sectionNames = DEFAULT_SECTIONS.map((s) => s.name);
      expect(sectionNames).toContain("summary");
      expect(sectionNames).toContain("financial");
      expect(sectionNames).toContain("livestock");
      expect(sectionNames).toContain("crops");
      expect(sectionNames).toContain("analytics");
      expect(sectionNames).toContain("recommendations");
    });

    it("should have fields for each section", () => {
      DEFAULT_SECTIONS.forEach((section) => {
        expect(section.fields).toBeDefined();
        expect(Array.isArray(section.fields)).toBe(true);
        expect(section.fields.length).toBeGreaterThan(0);
      });
    });

    it("should have unique section names", () => {
      const names = DEFAULT_SECTIONS.map((s) => s.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(names.length);
    });
  });
});
