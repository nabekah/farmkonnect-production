/**
 * Irrigation Cost Analysis System
 * Calculates and analyzes irrigation costs including water, energy, labor, and equipment
 */

export interface IrrigationCostInput {
  fieldId: string;
  cropName: string;
  areaHectares: number;
  irrigationMethod: 'flood' | 'sprinkler' | 'drip' | 'furrow';
  waterSourceType: 'well' | 'canal' | 'tank' | 'river';
  pumpType: 'centrifugal' | 'submersible' | 'solar';
  totalWaterApplied: number; // liters
  pumpPower: number; // kW
  operatingHours: number; // hours
  laborHours: number; // hours
  seasonalIrrigations: number; // number of irrigation events
}

export interface IrrigationCost {
  fieldId: string;
  waterCost: number;
  energyCost: number;
  laborCost: number;
  equipmentCost: number;
  maintenanceCost: number;
  totalCost: number;
  costPerHectare: number;
  costPerCubicMeter: number;
  costPerIrrigation: number;
  costBreakdown: CostBreakdown;
  efficiency: EfficiencyMetrics;
}

export interface CostBreakdown {
  waterCost: {
    amount: number;
    percentage: number;
    unit: string;
  };
  energyCost: {
    amount: number;
    percentage: number;
    unit: string;
  };
  laborCost: {
    amount: number;
    percentage: number;
    unit: string;
  };
  equipmentCost: {
    amount: number;
    percentage: number;
    unit: string;
  };
  maintenanceCost: {
    amount: number;
    percentage: number;
    unit: string;
  };
}

export interface EfficiencyMetrics {
  applicationEfficiency: number; // percentage
  conveyanceEfficiency: number; // percentage
  distributionEfficiency: number; // percentage
  overallEfficiency: number; // percentage
  waterProductivity: number; // kg/m³
  energyProductivity: number; // kg/kWh
}

export interface CostComparison {
  method1: {
    name: string;
    totalCost: number;
    costPerHectare: number;
    efficiency: number;
  };
  method2: {
    name: string;
    totalCost: number;
    costPerHectare: number;
    efficiency: number;
  };
  savings: {
    amount: number;
    percentage: number;
    recommendation: string;
  };
}

export interface ROIAnalysis {
  initialInvestment: number;
  annualSavings: number;
  paybackPeriod: number; // years
  roi: number; // percentage
  netPresentValue: number;
  internalRateOfReturn: number;
  recommendation: string;
}

/**
 * Irrigation Cost Analysis Implementation
 */
export class IrrigationCostAnalyzer {
  private costRates = {
    water: {
      well: 0.15, // $/1000 liters
      canal: 0.10,
      tank: 0.05,
      river: 0.08,
    },
    electricity: 0.12, // $/kWh
    labor: 15, // $/hour
    equipment: {
      flood: 500, // $/hectare/season
      sprinkler: 800,
      drip: 1200,
      furrow: 600,
    },
    maintenance: {
      flood: 0.05, // 5% of equipment cost
      sprinkler: 0.08,
      drip: 0.10,
      furrow: 0.06,
    },
  };

  private efficiencyRates = {
    flood: { application: 0.60, conveyance: 0.85, distribution: 0.75 },
    sprinkler: { application: 0.75, conveyance: 0.90, distribution: 0.85 },
    drip: { application: 0.90, conveyance: 0.95, distribution: 0.95 },
    furrow: { application: 0.65, conveyance: 0.80, distribution: 0.70 },
  };

  /**
   * Calculate total irrigation cost
   */
  calculateIrrigationCost(input: IrrigationCostInput): IrrigationCost {
    const waterCost = this.calculateWaterCost(
      input.totalWaterApplied,
      input.waterSourceType
    );

    const energyCost = this.calculateEnergyCost(
      input.pumpPower,
      input.operatingHours
    );

    const laborCost = this.calculateLaborCost(input.laborHours);

    const equipmentCost = this.calculateEquipmentCost(
      input.irrigationMethod,
      input.areaHectares
    );

    const maintenanceCost = this.calculateMaintenanceCost(
      input.irrigationMethod,
      equipmentCost
    );

    const totalCost = waterCost + energyCost + laborCost + equipmentCost + maintenanceCost;
    const costPerHectare = totalCost / input.areaHectares;
    const costPerCubicMeter = totalCost / (input.totalWaterApplied / 1000);
    const costPerIrrigation = totalCost / input.seasonalIrrigations;

    const efficiency = this.calculateEfficiencyMetrics(
      input.irrigationMethod,
      input.cropName,
      input.totalWaterApplied,
      input.areaHectares
    );

    const costBreakdown = this.generateCostBreakdown(
      waterCost,
      energyCost,
      laborCost,
      equipmentCost,
      maintenanceCost,
      totalCost
    );

    return {
      fieldId: input.fieldId,
      waterCost,
      energyCost,
      laborCost,
      equipmentCost,
      maintenanceCost,
      totalCost,
      costPerHectare,
      costPerCubicMeter,
      costPerIrrigation,
      costBreakdown,
      efficiency,
    };
  }

  /**
   * Calculate water cost
   */
  private calculateWaterCost(
    totalWaterLiters: number,
    sourceType: 'well' | 'canal' | 'tank' | 'river'
  ): number {
    const rate = this.costRates.water[sourceType];
    const waterInThousandLiters = totalWaterLiters / 1000;
    return waterInThousandLiters * rate;
  }

  /**
   * Calculate energy cost
   */
  private calculateEnergyCost(pumpPowerKW: number, operatingHours: number): number {
    const energyConsumption = pumpPowerKW * operatingHours; // kWh
    return energyConsumption * this.costRates.electricity;
  }

  /**
   * Calculate labor cost
   */
  private calculateLaborCost(laborHours: number): number {
    return laborHours * this.costRates.labor;
  }

  /**
   * Calculate equipment cost
   */
  private calculateEquipmentCost(
    method: 'flood' | 'sprinkler' | 'drip' | 'furrow',
    areaHectares: number
  ): number {
    return this.costRates.equipment[method] * areaHectares;
  }

  /**
   * Calculate maintenance cost
   */
  private calculateMaintenanceCost(
    method: 'flood' | 'sprinkler' | 'drip' | 'furrow',
    equipmentCost: number
  ): number {
    return equipmentCost * this.costRates.maintenance[method];
  }

  /**
   * Calculate efficiency metrics
   */
  private calculateEfficiencyMetrics(
    method: 'flood' | 'sprinkler' | 'drip' | 'furrow',
    cropName: string,
    waterApplied: number,
    areaHectares: number
  ): EfficiencyMetrics {
    const methodEfficiency = this.efficiencyRates[method];

    // Crop water requirement (mm/day) - average for season
    const cropWaterRequirements: { [key: string]: number } = {
      rice: 6,
      wheat: 3,
      corn: 5,
      sugarcane: 6.5,
      cotton: 5,
    };

    const baseWaterReq = cropWaterRequirements[cropName.toLowerCase()] || 4;
    const seasonalWaterReq = baseWaterReq * 120 * areaHectares * 10; // 120 days, convert to liters

    const applicationEfficiency = methodEfficiency.application * 100;
    const conveyanceEfficiency = methodEfficiency.conveyance * 100;
    const distributionEfficiency = methodEfficiency.distribution * 100;
    const overallEfficiency =
      (applicationEfficiency * conveyanceEfficiency * distributionEfficiency) / 10000;

    // Water productivity (kg/m³) - estimated yield
    const estimatedYield = this.getEstimatedYield(cropName);
    const waterProductivity = estimatedYield / (waterApplied / 1000); // kg per m³

    // Energy productivity (kg/kWh) - estimated
    const energyProductivity = estimatedYield / 50; // Assume 50 kWh per season average

    return {
      applicationEfficiency,
      conveyanceEfficiency,
      distributionEfficiency,
      overallEfficiency,
      waterProductivity,
      energyProductivity,
    };
  }

  /**
   * Generate cost breakdown
   */
  private generateCostBreakdown(
    waterCost: number,
    energyCost: number,
    laborCost: number,
    equipmentCost: number,
    maintenanceCost: number,
    totalCost: number
  ): CostBreakdown {
    return {
      waterCost: {
        amount: waterCost,
        percentage: (waterCost / totalCost) * 100,
        unit: 'USD',
      },
      energyCost: {
        amount: energyCost,
        percentage: (energyCost / totalCost) * 100,
        unit: 'USD',
      },
      laborCost: {
        amount: laborCost,
        percentage: (laborCost / totalCost) * 100,
        unit: 'USD',
      },
      equipmentCost: {
        amount: equipmentCost,
        percentage: (equipmentCost / totalCost) * 100,
        unit: 'USD',
      },
      maintenanceCost: {
        amount: maintenanceCost,
        percentage: (maintenanceCost / totalCost) * 100,
        unit: 'USD',
      },
    };
  }

  /**
   * Compare irrigation methods
   */
  compareIrrigationMethods(input: IrrigationCostInput): CostComparison[] {
    const methods: Array<'flood' | 'sprinkler' | 'drip' | 'furrow'> = [
      'flood',
      'sprinkler',
      'drip',
      'furrow',
    ];

    const comparisons: CostComparison[] = [];

    for (let i = 0; i < methods.length - 1; i++) {
      const method1 = methods[i];
      const method2 = methods[i + 1];

      const cost1 = this.calculateIrrigationCost({
        ...input,
        irrigationMethod: method1,
      });

      const cost2 = this.calculateIrrigationCost({
        ...input,
        irrigationMethod: method2,
      });

      const savingsAmount = cost1.totalCost - cost2.totalCost;
      const savingsPercentage = (savingsAmount / cost1.totalCost) * 100;

      comparisons.push({
        method1: {
          name: method1,
          totalCost: cost1.totalCost,
          costPerHectare: cost1.costPerHectare,
          efficiency: cost1.efficiency.overallEfficiency,
        },
        method2: {
          name: method2,
          totalCost: cost2.totalCost,
          costPerHectare: cost2.costPerHectare,
          efficiency: cost2.efficiency.overallEfficiency,
        },
        savings: {
          amount: Math.abs(savingsAmount),
          percentage: Math.abs(savingsPercentage),
          recommendation:
            savingsAmount > 0
              ? `Switch to ${method2} to save $${Math.abs(savingsAmount).toFixed(2)} (${Math.abs(savingsPercentage).toFixed(1)}%)`
              : `${method1} is more cost-effective`,
        },
      });
    }

    return comparisons;
  }

  /**
   * Analyze ROI for irrigation system upgrade
   */
  analyzeROI(
    currentSystemCost: number,
    newSystemCost: number,
    currentAnnualCost: number,
    newAnnualCost: number,
    lifespan: number = 10
  ): ROIAnalysis {
    const initialInvestment = newSystemCost - currentSystemCost;
    const annualSavings = currentAnnualCost - newAnnualCost;
    const paybackPeriod = initialInvestment / annualSavings;

    // Simple ROI
    const roi = ((annualSavings * lifespan - initialInvestment) / initialInvestment) * 100;

    // Net Present Value (NPV) - assuming 10% discount rate
    const discountRate = 0.1;
    let npv = -initialInvestment;
    for (let year = 1; year <= lifespan; year++) {
      npv += annualSavings / Math.pow(1 + discountRate, year);
    }

    // Internal Rate of Return (IRR) - simplified calculation
    const irr = (annualSavings / initialInvestment) * 100;

    const recommendation =
      paybackPeriod <= 3
        ? `Highly recommended: Payback in ${paybackPeriod.toFixed(1)} years`
        : paybackPeriod <= 5
          ? `Recommended: Payback in ${paybackPeriod.toFixed(1)} years`
          : `Consider alternatives: Payback in ${paybackPeriod.toFixed(1)} years`;

    return {
      initialInvestment,
      annualSavings,
      paybackPeriod,
      roi,
      netPresentValue: npv,
      internalRateOfReturn: irr,
      recommendation,
    };
  }

  /**
   * Get seasonal cost summary
   */
  getSeasonalCostSummary(
    fieldId: string,
    irrigationCosts: IrrigationCost[],
    seasonalIrrigations: number
  ): {
    totalSeasonalCost: number;
    averageCostPerIrrigation: number;
    costTrend: string;
    recommendations: string[];
  } {
    const totalSeasonalCost = irrigationCosts.reduce((sum, cost) => sum + cost.totalCost, 0);
    const averageCostPerIrrigation = totalSeasonalCost / seasonalIrrigations;

    // Analyze cost trend
    let costTrend = 'stable';
    if (irrigationCosts.length > 1) {
      const firstHalf = irrigationCosts.slice(0, Math.floor(irrigationCosts.length / 2));
      const secondHalf = irrigationCosts.slice(Math.floor(irrigationCosts.length / 2));

      const firstAvg = firstHalf.reduce((sum, c) => sum + c.totalCost, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, c) => sum + c.totalCost, 0) / secondHalf.length;

      if (secondAvg > firstAvg * 1.1) costTrend = 'increasing';
      else if (secondAvg < firstAvg * 0.9) costTrend = 'decreasing';
    }

    const recommendations: string[] = [];

    if (averageCostPerIrrigation > 50) {
      recommendations.push('Consider switching to a more efficient irrigation method');\n    }\n\n    const avgEfficiency =\n      irrigationCosts.reduce((sum, c) => sum + c.efficiency.overallEfficiency, 0) /\n      irrigationCosts.length;\n    if (avgEfficiency < 70) {\n      recommendations.push('System efficiency is below optimal - check for leaks and maintenance issues');\n    }\n\n    if (costTrend === 'increasing') {\n      recommendations.push('Costs are increasing - investigate equipment degradation or water source issues');\n    }\n\n    if (recommendations.length === 0) {\n      recommendations.push('System is operating efficiently');\n    }\n\n    return {\n      totalSeasonalCost,\n      averageCostPerIrrigation,\n      costTrend,\n      recommendations,\n    };\n  }\n\n  /**\n   * Get estimated yield for crop\n   */\n  private getEstimatedYield(cropName: string): number {\n    const yields: { [key: string]: number } = {\n      rice: 5000,\n      wheat: 4500,\n      corn: 6000,\n      sugarcane: 70000,\n      cotton: 2000,\n    };\n    return yields[cropName.toLowerCase()] || 4000; // kg/hectare\n  }\n}\n\nexport const irrigationCostAnalyzer = new IrrigationCostAnalyzer();\n
