/**
 * Expense Category Color Scheme
 * Provides consistent visual distinction for different expense categories
 * across all financial dashboard visualizations
 */

export type ExpenseCategory = 
  | "feed"
  | "medication"
  | "labor"
  | "equipment"
  | "utilities"
  | "transport"
  | "veterinary"
  | "fertilizer"
  | "seeds"
  | "pesticides"
  | "water"
  | "rent"
  | "insurance"
  | "maintenance"
  | "other";

export type RevenueType =
  | "animal_sale"
  | "milk_production"
  | "egg_production"
  | "wool_production"
  | "meat_sale"
  | "crop_sale"
  | "produce_sale"
  | "breeding_service"
  | "other";

// Professional color palette for expense categories
// Using distinct, accessible colors that work in both light and dark modes
export const EXPENSE_CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  feed: "#8B5CF6",           // Purple - Feed/Nutrition
  medication: "#EC4899",      // Pink - Health/Medical
  labor: "#3B82F6",           // Blue - Human Resources
  equipment: "#F59E0B",       // Amber - Assets/Equipment
  utilities: "#10B981",       // Green - Utilities/Resources
  transport: "#06B6D4",       // Cyan - Transportation
  veterinary: "#F97316",      // Orange - Veterinary Services
  fertilizer: "#84CC16",      // Lime - Agricultural Inputs
  seeds: "#6366F1",           // Indigo - Agricultural Inputs
  pesticides: "#EF4444",      // Red - Agricultural Chemicals
  water: "#0EA5E9",           // Sky Blue - Water Management
  rent: "#D946EF",            // Fuchsia - Real Estate
  insurance: "#14B8A6",       // Teal - Insurance/Protection
  maintenance: "#A16207",     // Brown - Maintenance
  other: "#6B7280",           // Gray - Miscellaneous
};

// Revenue type colors
export const REVENUE_TYPE_COLORS: Record<RevenueType, string> = {
  animal_sale: "#059669",     // Emerald - Livestock Sales
  milk_production: "#0891B2", // Cyan - Dairy Products
  egg_production: "#F59E0B",  // Amber - Poultry Products
  wool_production: "#8B5CF6", // Purple - Fiber Products
  meat_sale: "#DC2626",       // Red - Meat Products
  crop_sale: "#16A34A",       // Green - Crop Sales
  produce_sale: "#CA8A04",    // Yellow - Produce Sales
  breeding_service: "#7C3AED",// Violet - Services
  other: "#6B7280",           // Gray - Other Revenue
};

// Category display names
export const EXPENSE_CATEGORY_NAMES: Record<ExpenseCategory, string> = {
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

export const REVENUE_TYPE_NAMES: Record<RevenueType, string> = {
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

// Category groupings for analysis
export const EXPENSE_CATEGORY_GROUPS = {
  production: ["feed", "medication", "veterinary", "fertilizer", "seeds", "pesticides"],
  labor: ["labor"],
  operations: ["utilities", "water", "transport", "maintenance"],
  assets: ["equipment", "rent"],
  protection: ["insurance"],
  other: ["other"],
};

export const REVENUE_CATEGORY_GROUPS = {
  livestock: ["animal_sale", "milk_production", "egg_production", "wool_production", "meat_sale", "breeding_service"],
  crops: ["crop_sale", "produce_sale"],
  other: ["other"],
};

// Get color for expense category
export function getExpenseCategoryColor(category: ExpenseCategory): string {
  return EXPENSE_CATEGORY_COLORS[category] || EXPENSE_CATEGORY_COLORS.other;
}

// Get color for revenue type
export function getRevenueTypeColor(type: RevenueType): string {
  return REVENUE_TYPE_COLORS[type] || REVENUE_TYPE_COLORS.other;
}

// Get display name for expense category
export function getExpenseCategoryName(category: ExpenseCategory): string {
  return EXPENSE_CATEGORY_NAMES[category] || "Other";
}

// Get display name for revenue type
export function getRevenueTypeName(type: RevenueType): string {
  return REVENUE_TYPE_NAMES[type] || "Other";
}

// Get all expense category colors as array (for chart legends)
export function getExpenseCategoryColorArray(): string[] {
  return Object.values(EXPENSE_CATEGORY_COLORS);
}

// Get all revenue type colors as array (for chart legends)
export function getRevenueTypeColorArray(): string[] {
  return Object.values(REVENUE_TYPE_COLORS);
}

// Get category group for a specific category
export function getExpenseCategoryGroup(category: ExpenseCategory): string {
  for (const [group, categories] of Object.entries(EXPENSE_CATEGORY_GROUPS)) {
    if (categories.includes(category)) {
      return group;
    }
  }
  return "other";
}

// Get revenue group for a specific type
export function getRevenueGroup(type: RevenueType): string {
  for (const [group, types] of Object.entries(REVENUE_CATEGORY_GROUPS)) {
    if (types.includes(type)) {
      return group;
    }
  }
  return "other";
}

// Color palette for category groups
export const GROUP_COLORS = {
  production: "#8B5CF6",
  labor: "#3B82F6",
  operations: "#10B981",
  assets: "#F59E0B",
  protection: "#EF4444",
  livestock: "#059669",
  crops: "#16A34A",
  other: "#6B7280",
};

// Get color for a category group
export function getGroupColor(group: string): string {
  return GROUP_COLORS[group as keyof typeof GROUP_COLORS] || GROUP_COLORS.other;
}
