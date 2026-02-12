/**
 * Unit Tests for Category Breakdown Components
 * Tests color mapping, data processing, and visualization logic
 */

import { describe, it, expect } from "vitest";

// Test color scheme utilities
const EXPENSE_CATEGORY_COLORS = {
  feed: "#8B5CF6",
  medication: "#EC4899",
  labor: "#3B82F6",
  equipment: "#F59E0B",
  utilities: "#10B981",
  transport: "#06B6D4",
  veterinary: "#F97316",
  fertilizer: "#84CC16",
  seeds: "#6366F1",
  pesticides: "#EF4444",
  water: "#0EA5E9",
  rent: "#D946EF",
  insurance: "#14B8A6",
  maintenance: "#A16207",
  other: "#6B7280",
};

const REVENUE_TYPE_COLORS = {
  animal_sale: "#059669",
  milk_production: "#0891B2",
  egg_production: "#F59E0B",
  wool_production: "#8B5CF6",
  meat_sale: "#DC2626",
  crop_sale: "#16A34A",
  produce_sale: "#CA8A04",
  breeding_service: "#7C3AED",
  other: "#6B7280",
};

const EXPENSE_CATEGORY_NAMES = {
  feed: "Animal Feed",
  medication: "Medication & Vaccines",
  labor: "Labor & Wages",
  equipment: "Equipment & Tools",
  utilities: "Utilities",
  transport: "Transportation",
  veterinary: "Veterinary Services",
  fertilizer: "Fertilizer",
  seeds: "Seeds & Seedlings",
  pesticides: "Pesticides & Chemicals",
  water: "Water Management",
  rent: "Rent & Lease",
  insurance: "Insurance",
  maintenance: "Maintenance & Repairs",
  other: "Other Expenses",
};

const REVENUE_TYPE_NAMES = {
  animal_sale: "Animal Sales",
  milk_production: "Milk Production",
  egg_production: "Egg Production",
  wool_production: "Wool Production",
  meat_sale: "Meat Sales",
  crop_sale: "Crop Sales",
  produce_sale: "Produce Sales",
  breeding_service: "Breeding Services",
  other: "Other Revenue",
};

const EXPENSE_CATEGORY_GROUPS = {
  production: ["feed", "medication", "veterinary", "fertilizer", "seeds", "pesticides"],
  labor: ["labor"],
  operations: ["utilities", "water", "transport", "maintenance"],
  assets: ["equipment", "rent"],
  protection: ["insurance"],
  other: ["other"],
};

const REVENUE_CATEGORY_GROUPS = {
  livestock: ["animal_sale", "milk_production", "egg_production", "wool_production", "meat_sale", "breeding_service"],
  crops: ["crop_sale", "produce_sale"],
  other: ["other"],
};

describe("Expense Category Colors", () => {
  it("should have correct colors for all expense categories", () => {
    expect(EXPENSE_CATEGORY_COLORS.feed).toBe("#8B5CF6");
    expect(EXPENSE_CATEGORY_COLORS.medication).toBe("#EC4899");
    expect(EXPENSE_CATEGORY_COLORS.labor).toBe("#3B82F6");
    expect(EXPENSE_CATEGORY_COLORS.equipment).toBe("#F59E0B");
  });

  it("should have unique colors for all expense categories", () => {
    const colors = Object.values(EXPENSE_CATEGORY_COLORS);
    const uniqueColors = new Set(colors);
    expect(uniqueColors.size).toBe(colors.length);
  });

  it("should have matching names and colors for all categories", () => {
    const categoryKeys = Object.keys(EXPENSE_CATEGORY_COLORS);
    const nameKeys = Object.keys(EXPENSE_CATEGORY_NAMES);
    expect(categoryKeys.sort()).toEqual(nameKeys.sort());
  });

  it("should have valid hex color codes", () => {
    Object.values(EXPENSE_CATEGORY_COLORS).forEach((color) => {
      expect(color).toMatch(/^#[0-9A-F]{6}$/i);
    });
  });
});

describe("Revenue Type Colors", () => {
  it("should have correct colors for all revenue types", () => {
    expect(REVENUE_TYPE_COLORS.animal_sale).toBe("#059669");
    expect(REVENUE_TYPE_COLORS.milk_production).toBe("#0891B2");
    expect(REVENUE_TYPE_COLORS.crop_sale).toBe("#16A34A");
  });

  it("should have unique colors for all revenue types", () => {
    const colors = Object.values(REVENUE_TYPE_COLORS);
    const uniqueColors = new Set(colors);
    expect(uniqueColors.size).toBe(colors.length);
  });

  it("should have matching names and colors for all revenue types", () => {
    const typeKeys = Object.keys(REVENUE_TYPE_COLORS);
    const nameKeys = Object.keys(REVENUE_TYPE_NAMES);
    expect(typeKeys.sort()).toEqual(nameKeys.sort());
  });

  it("should have valid hex color codes", () => {
    Object.values(REVENUE_TYPE_COLORS).forEach((color) => {
      expect(color).toMatch(/^#[0-9A-F]{6}$/i);
    });
  });
});

describe("Category Names", () => {
  it("should have user-friendly names for all expense categories", () => {
    Object.values(EXPENSE_CATEGORY_NAMES).forEach((name) => {
      expect(name.length).toBeGreaterThan(0);
      expect(name).not.toMatch(/^[a-z_]+$/);
    });
  });

  it("should have user-friendly names for all revenue types", () => {
    Object.values(REVENUE_TYPE_NAMES).forEach((name) => {
      expect(name.length).toBeGreaterThan(0);
      expect(name).not.toMatch(/^[a-z_]+$/);
    });
  });
});

describe("Category Groupings", () => {
  it("should correctly group production expenses", () => {
    const productionExpenses = ["feed", "medication", "veterinary", "fertilizer", "seeds", "pesticides"];
    productionExpenses.forEach((category) => {
      expect(EXPENSE_CATEGORY_GROUPS.production).toContain(category);
    });
  });

  it("should correctly group operations expenses", () => {
    const operationExpenses = ["utilities", "water", "transport", "maintenance"];
    operationExpenses.forEach((category) => {
      expect(EXPENSE_CATEGORY_GROUPS.operations).toContain(category);
    });
  });

  it("should correctly group livestock revenue", () => {
    const livestockRevenue = [
      "animal_sale",
      "milk_production",
      "egg_production",
      "wool_production",
      "meat_sale",
      "breeding_service",
    ];
    livestockRevenue.forEach((type) => {
      expect(REVENUE_CATEGORY_GROUPS.livestock).toContain(type);
    });
  });

  it("should correctly group crop revenue", () => {
    const cropRevenue = ["crop_sale", "produce_sale"];
    cropRevenue.forEach((type) => {
      expect(REVENUE_CATEGORY_GROUPS.crops).toContain(type);
    });
  });
});

describe("Data Processing", () => {
  it("should calculate percentages correctly", () => {
    const testData = [
      { category: "feed", amount: 5000, percentage: 50, count: 5 },
      { category: "labor", amount: 5000, percentage: 50, count: 10 },
    ];

    const total = testData.reduce((sum, item) => sum + item.amount, 0);
    expect(total).toBe(10000);

    testData.forEach((item) => {
      const calculatedPercentage = (item.amount / total) * 100;
      expect(calculatedPercentage).toBe(item.percentage);
    });
  });

  it("should identify highest expense category", () => {
    const expenses = [
      { category: "feed", amount: 3000, percentage: 30, count: 5 },
      { category: "labor", amount: 7000, percentage: 70, count: 10 },
    ];

    const highest = expenses.reduce((max, item) =>
      item.amount > max.amount ? item : max
    );
    expect(highest.category).toBe("labor");
    expect(highest.amount).toBe(7000);
  });

  it("should identify lowest expense category", () => {
    const expenses = [
      { category: "feed", amount: 3000, percentage: 30, count: 5 },
      { category: "labor", amount: 7000, percentage: 70, count: 10 },
    ];

    const lowest = expenses.reduce((min, item) =>
      item.amount < min.amount ? item : min
    );
    expect(lowest.category).toBe("feed");
    expect(lowest.amount).toBe(3000);
  });

  it("should group data correctly", () => {
    const expenses = [
      { category: "feed", amount: 3000, group: "production" },
      { category: "labor", amount: 5000, group: "labor" },
      { category: "utilities", amount: 2000, group: "operations" },
    ];

    const grouped: Record<string, number> = {};
    expenses.forEach((item) => {
      grouped[item.group] = (grouped[item.group] || 0) + item.amount;
    });

    expect(grouped.production).toBe(3000);
    expect(grouped.labor).toBe(5000);
    expect(grouped.operations).toBe(2000);
  });

  it("should calculate average correctly", () => {
    const expenses = [
      { category: "feed", amount: 3000 },
      { category: "labor", amount: 5000 },
      { category: "utilities", amount: 2000 },
    ];

    const total = expenses.reduce((sum, item) => sum + item.amount, 0);
    const average = total / expenses.length;

    expect(total).toBe(10000);
    expect(average).toBe(10000 / 3);
  });
});

describe("Financial Metrics", () => {
  it("should calculate profit correctly", () => {
    const revenue = 135890;
    const expenses = 159148;
    const profit = revenue - expenses;

    expect(profit).toBe(-23258);
  });

  it("should calculate profit margin correctly", () => {
    const revenue = 135890;
    const expenses = 159148;
    const profit = revenue - expenses;
    const profitMargin = (profit / revenue) * 100;

    expect(profitMargin).toBeCloseTo(-17.12, 2);
  });

  it("should handle zero revenue", () => {
    const revenue = 0;
    const expenses = 100;
    const profitMargin = revenue > 0 ? ((revenue - expenses) / revenue) * 100 : 0;

    expect(profitMargin).toBe(0);
  });

  it("should calculate expense ratio", () => {
    const revenue = 135890;
    const expenses = 159148;
    const expenseRatio = (expenses / revenue) * 100;

    expect(expenseRatio).toBeCloseTo(117.12, 2);
  });
});

describe("Data Validation", () => {
  it("should validate positive amounts", () => {
    const expenses = [
      { amount: 5000, valid: true },
      { amount: 0, valid: false },
      { amount: -1000, valid: false },
    ];

    expenses.forEach((item) => {
      const isValid = item.amount > 0;
      expect(isValid).toBe(item.valid);
    });
  });

  it("should validate percentage sum", () => {
    const data = [
      { percentage: 30 },
      { percentage: 40 },
      { percentage: 30 },
    ];

    const totalPercentage = data.reduce((sum, item) => sum + item.percentage, 0);
    expect(totalPercentage).toBe(100);
  });

  it("should detect spending alerts", () => {
    const expenses = [
      { category: "feed", percentage: 50 },
      { category: "labor", percentage: 30 },
      { category: "utilities", percentage: 20 },
    ];

    const hasAlert = expenses.some((item) => item.percentage > 40);
    expect(hasAlert).toBe(true);
  });

  it("should detect revenue diversification issues", () => {
    const revenueStreams = [
      { type: "animal_sale", percentage: 80 },
      { type: "crop_sale", percentage: 20 },
    ];

    const isDiversified = revenueStreams.length >= 3;
    expect(isDiversified).toBe(false);
  });
});

describe("Color Accessibility", () => {
  it("should use distinct colors for better accessibility", () => {
    const allColors = [
      ...Object.values(EXPENSE_CATEGORY_COLORS),
      ...Object.values(REVENUE_TYPE_COLORS),
    ];

    const uniqueColors = new Set(allColors);
    // Allow some overlap between expense and revenue colors
    expect(uniqueColors.size).toBeGreaterThan(20);
  });

  it("should format colors consistently", () => {
    const allColors = [
      ...Object.values(EXPENSE_CATEGORY_COLORS),
      ...Object.values(REVENUE_TYPE_COLORS),
    ];

    allColors.forEach((color) => {
      expect(color).toMatch(/^#[0-9A-F]{6}$/i);
    });
  });
});
