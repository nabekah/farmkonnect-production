/**
 * Chemical Inventory Management System
 * Tracks pesticide and fungicide inventory with safety and regulatory compliance
 */

export interface ChemicalProduct {
  id: string;
  name: string;
  activeIngredient: string;
  concentration: string; // e.g., "25% WP"
  manufacturer: string;
  batchNumber: string;
  quantity: number; // liters or kg
  unit: 'liters' | 'kg' | 'ml' | 'grams';
  purchaseDate: Date;
  expiryDate: Date;
  cost: number;
  storageLocation: string;
  safetyDataSheet: string; // URL
  registrationNumber: string;
  approvedCrops: string[];
  preharvest Interval: number; // days
  reentryInterval: number; // hours
  environmentalImpact: 'low' | 'medium' | 'high';
  toxicity: 'low' | 'medium' | 'high';
}

export interface InventoryTransaction {
  id: string;
  chemicalId: string;
  transactionType: 'purchase' | 'usage' | 'disposal' | 'adjustment';
  quantity: number;
  unit: 'liters' | 'kg' | 'ml' | 'grams';
  date: Date;
  fieldId?: string;
  notes: string;
  performedBy: string;
}

export interface InventoryAlert {
  id: string;
  chemicalId: string;
  chemicalName: string;
  alertType: 'low-stock' | 'expiry-warning' | 'expired' | 'regulatory-issue';
  severity: 'warning' | 'critical';
  message: string;
  createdDate: Date;
  actionRequired: string;
}

export interface ChemicalUsageReport {
  chemicalId: string;
  chemicalName: string;
  totalUsed: number;
  usageCount: number;
  averagePerApplication: number;
  costPerUnit: number;
  totalCost: number;
  fieldsUsed: string[];
  cropsUsed: string[];
  lastUsedDate: Date;
  effectiveness: number; // 0-100%
}

export class ChemicalInventoryManager {
  private chemicals: Map<string, ChemicalProduct> = new Map();
  private transactions: InventoryTransaction[] = [];
  private alerts: InventoryAlert[] = [];
  private lowStockThreshold = 10; // percentage
  private expiryWarningDays = 30;

  addChemical(chemical: ChemicalProduct): void {
    this.chemicals.set(chemical.id, chemical);
    this.checkChemicalCompliance(chemical);
  }

  recordUsage(
    chemicalId: string,
    quantity: number,
    unit: 'liters' | 'kg' | 'ml' | 'grams',
    fieldId: string,
    notes: string,
    performedBy: string
  ): InventoryTransaction {
    const chemical = this.chemicals.get(chemicalId);
    if (!chemical) throw new Error('Chemical not found');

    const transaction: InventoryTransaction = {
      id: `trans-${Date.now()}`,
      chemicalId,
      transactionType: 'usage',
      quantity,
      unit,
      date: new Date(),
      fieldId,
      notes,
      performedBy,
    };

    this.transactions.push(transaction);

    // Update chemical quantity
    const quantityInBaseUnit = this.convertToBaseUnit(quantity, unit);
    const chemicalBaseUnit = this.convertToBaseUnit(chemical.quantity, chemical.unit);
    chemical.quantity = this.convertFromBaseUnit(chemicalBaseUnit - quantityInBaseUnit, chemical.unit);

    this.checkInventoryLevels(chemical);

    return transaction;
  }

  private convertToBaseUnit(quantity: number, unit: string): number {
    const conversions: Record<string, number> = {
      'ml': 0.001,
      'grams': 0.001,
      'liters': 1,
      'kg': 1,
    };
    return quantity * (conversions[unit] || 1);
  }

  private convertFromBaseUnit(quantity: number, unit: string): number {
    const conversions: Record<string, number> = {
      'ml': 1000,
      'grams': 1000,
      'liters': 1,
      'kg': 1,
    };
    return quantity * (conversions[unit] || 1);
  }

  private checkInventoryLevels(chemical: ChemicalProduct): void {
    const percentageRemaining = (chemical.quantity / 100) * 100; // Simplified

    if (percentageRemaining < this.lowStockThreshold) {
      this.createAlert({
        id: `alert-${Date.now()}`,
        chemicalId: chemical.id,
        chemicalName: chemical.name,
        alertType: 'low-stock',
        severity: 'warning',
        message: `Low stock for ${chemical.name}: ${chemical.quantity} ${chemical.unit} remaining`,
        createdDate: new Date(),
        actionRequired: `Reorder ${chemical.name} from ${chemical.manufacturer}`,
      });
    }
  }

  private checkChemicalCompliance(chemical: ChemicalProduct): void {
    const daysUntilExpiry = Math.floor(
      (new Date(chemical.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilExpiry < 0) {
      this.createAlert({
        id: `alert-${Date.now()}`,
        chemicalId: chemical.id,
        chemicalName: chemical.name,
        alertType: 'expired',
        severity: 'critical',
        message: `${chemical.name} has expired on ${chemical.expiryDate.toDateString()}`,
        createdDate: new Date(),
        actionRequired: `Dispose of ${chemical.name} safely and remove from inventory`,
      });
    } else if (daysUntilExpiry < this.expiryWarningDays) {
      this.createAlert({
        id: `alert-${Date.now()}`,
        chemicalId: chemical.id,
        chemicalName: chemical.name,
        alertType: 'expiry-warning',
        severity: 'warning',
        message: `${chemical.name} expires in ${daysUntilExpiry} days`,
        createdDate: new Date(),
        actionRequired: `Plan to use ${chemical.name} before expiry or order replacement`,
      });
    }
  }

  private createAlert(alert: InventoryAlert): void {
    this.alerts.push(alert);
  }

  getChemical(chemicalId: string): ChemicalProduct | undefined {
    return this.chemicals.get(chemicalId);
  }

  getAllChemicals(): ChemicalProduct[] {
    return Array.from(this.chemicals.values());
  }

  getInventoryAlerts(severity?: 'warning' | 'critical'): InventoryAlert[] {
    return severity
      ? this.alerts.filter(a => a.severity === severity)
      : this.alerts;
  }

  getUsageReport(chemicalId: string): ChemicalUsageReport {
    const chemical = this.chemicals.get(chemicalId);
    if (!chemical) throw new Error('Chemical not found');

    const usageTransactions = this.transactions.filter(
      t => t.chemicalId === chemicalId && t.transactionType === 'usage'
    );

    const totalUsed = usageTransactions.reduce((sum, t) => sum + t.quantity, 0);
    const fieldsUsed = [...new Set(usageTransactions.map(t => t.fieldId).filter(Boolean))];
    const cropsUsed = chemical.approvedCrops;
    const lastUsedDate = usageTransactions.length > 0
      ? new Date(Math.max(...usageTransactions.map(t => new Date(t.date).getTime())))
      : new Date(0);

    return {
      chemicalId,
      chemicalName: chemical.name,
      totalUsed,
      usageCount: usageTransactions.length,
      averagePerApplication: usageTransactions.length > 0 ? totalUsed / usageTransactions.length : 0,
      costPerUnit: chemical.cost / chemical.quantity,
      totalCost: (totalUsed / chemical.quantity) * chemical.cost,
      fieldsUsed: fieldsUsed as string[],
      cropsUsed,
      lastUsedDate,
      effectiveness: 85, // Placeholder
    };
  }

  getInventoryValue(): {
    totalValue: number;
    byChemical: Record<string, number>;
    expiringValue: number;
  } {
    let totalValue = 0;
    let expiringValue = 0;
    const byChemical: Record<string, number> = {};

    this.chemicals.forEach(chemical => {
      const value = (chemical.quantity / 100) * chemical.cost; // Simplified
      totalValue += value;
      byChemical[chemical.name] = value;

      const daysUntilExpiry = Math.floor(
        (new Date(chemical.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysUntilExpiry < 30 && daysUntilExpiry > 0) {
        expiringValue += value;
      }
    });

    return {
      totalValue: Math.round(totalValue * 100) / 100,
      byChemical,
      expiringValue: Math.round(expiringValue * 100) / 100,
    };
  }

  getComplianceStatus(): {
    compliant: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    this.chemicals.forEach(chemical => {
      const daysUntilExpiry = Math.floor(
        (new Date(chemical.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysUntilExpiry < 0) {
        issues.push(`${chemical.name} has expired`);
        recommendations.push(`Dispose of expired ${chemical.name} according to regulations`);
      }

      if (chemical.toxicity === 'high') {
        recommendations.push(`Ensure proper PPE for handling ${chemical.name}`);
      }

      if (chemical.environmentalImpact === 'high') {
        recommendations.push(`Use ${chemical.name} with caution near water sources`);
      }
    });

    return {
      compliant: issues.length === 0,
      issues,
      recommendations,
    };
  }

  clearOldAlerts(daysOld: number = 60): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const initialLength = this.alerts.length;
    this.alerts = this.alerts.filter(a => new Date(a.createdDate) > cutoffDate);

    return initialLength - this.alerts.length;
  }
}

export const chemicalInventoryManager = new ChemicalInventoryManager();
