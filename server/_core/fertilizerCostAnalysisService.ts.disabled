import { getDb } from '../db';
import { fertilizerCosts, costAnalysis, fertilizerApplications, cropCycles, yieldRecords } from '../../drizzle/schema';
import { eq, and, gte, lte } from 'drizzle-orm';

export interface CostAnalysisResult {
  cycleId: number;
  totalCostSpent: number;
  costPerHectare: number;
  costPerKgYield?: number;
  roiPercentage?: number;
  averageCostPerApplication: number;
  mostExpensiveType?: string;
  costBreakdown: Record<string, number>;
  recommendations: string[];
}

export class FertilizerCostAnalysisService {
  /**
   * Analyze fertilizer costs for a crop cycle
   */
  async analyzeCycleCosts(cycleId: number): Promise<CostAnalysisResult> {
    const dbPromise = getDb();
    const db = await dbPromise;
    if (!db) throw new Error('Database connection failed');

    // Get crop cycle details
    const cycles = await db.select().from(cropCycles).where(eq(cropCycles.id, cycleId)).limit(1);
    const cycle = cycles[0];

    if (!cycle) {
      throw new Error(`Crop cycle ${cycleId} not found`);
    }

    // Get all fertilizer applications for this cycle
    const applications = await db.select().from(fertilizerApplications).where(eq(fertilizerApplications.cycleId, cycleId));

    if (applications.length === 0) {
      return {
        cycleId,
        totalCostSpent: 0,
        costPerHectare: 0,
        averageCostPerApplication: 0,
        costBreakdown: {},
        recommendations: ['No fertilizer applications recorded for this cycle'],
      };
    }

    // Get current costs for each fertilizer type
    const costBreakdown: Record<string, { quantity: number; cost: number }> = {};
    let totalCostSpent = 0;

    for (const app of applications) {
      const fertilizerType = app.fertilizerType;
      const quantity = Number(app.quantityKg) || 0;

      // Get latest cost for this fertilizer type
      const costRecords = await db.select().from(fertilizerCosts)
        .where(and(
          eq(fertilizerCosts.fertilizerType, fertilizerType),
          lte(fertilizerCosts.effectiveDate, new Date())
        ))
        .orderBy((costs: any) => costs.effectiveDate)
        .limit(1);
      const costRecord = costRecords[0];

      const costPerKg = costRecord ? Number(costRecord.costPerKg) : 0;
      const applicationCost = quantity * costPerKg;

      if (!costBreakdown[fertilizerType]) {
        costBreakdown[fertilizerType] = { quantity: 0, cost: 0 };
      }

      costBreakdown[fertilizerType].quantity += quantity;
      costBreakdown[fertilizerType].cost += applicationCost;
      totalCostSpent += applicationCost;
    }

    // Calculate cost per hectare
    const farmSize = Number(cycle.areaPlantedHectares) || 1;
    const costPerHectare = totalCostSpent / farmSize;

    // Calculate cost per kg yield
    let costPerKgYield: number | undefined;
    const yieldRecords2 = await db.select().from(yieldRecords).where(eq(yieldRecords.cycleId, cycleId)).limit(1);
    const yieldRecord = yieldRecords2[0];

    if (yieldRecord) {
      const totalYield = Number(yieldRecord.yieldQuantityKg) || 0;
      if (totalYield > 0) {
        costPerKgYield = totalCostSpent / totalYield;
      }
    }

    // Calculate ROI (simplified - assumes yield value)
    let roiPercentage: number | undefined;
    if (yieldRecord) {
      const estimatedYieldValue = Number(yieldRecord.yieldQuantityKg) * 50; // Assume $50 per kg
      roiPercentage = ((estimatedYieldValue - totalCostSpent) / totalCostSpent) * 100;
    }

    // Find most expensive fertilizer type
    let mostExpensiveType = '';
    let maxCost = 0;
    for (const [type, data] of Object.entries(costBreakdown)) {
      if (data.cost > maxCost) {
        maxCost = data.cost;
        mostExpensiveType = type;
      }
    }

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      costPerHectare,
      costBreakdown,
      roiPercentage || 0
    );

    // Save analysis to database
    await db.insert(costAnalysis).values({
      cycleId,
      totalCostSpent: totalCostSpent.toString(),
      costPerHectare: costPerHectare.toString(),
      costPerKgYield: costPerKgYield?.toString(),
      roiPercentage: roiPercentage?.toString(),
      averageCostPerApplication: (totalCostSpent / applications.length).toString(),
      mostExpensiveType,
    });

    return {
      cycleId,
      totalCostSpent,
      costPerHectare,
      costPerKgYield,
      roiPercentage,
      averageCostPerApplication: totalCostSpent / applications.length,
      mostExpensiveType,
      costBreakdown: Object.fromEntries(
        Object.entries(costBreakdown).map(([type, data]) => [type, data.cost])
      ),
      recommendations,
    };
  }

  /**
   * Get cost trend for a fertilizer type
   */
  async getCostTrend(
    fertilizerType: string,
    days: number = 90
  ): Promise<Array<{ date: string; costPerKg: number }>> {
    const dbPromise = getDb();
    const db = await dbPromise;
    if (!db) throw new Error('Database connection failed');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const costs = await db.select().from(fertilizerCosts)
      .where(and(
        eq(fertilizerCosts.fertilizerType, fertilizerType),
        gte(fertilizerCosts.effectiveDate, startDate)
      ))
      .orderBy((c: any) => c.effectiveDate);

    return costs.map((cost) => ({
      date: cost.effectiveDate.toISOString().split('T')[0],
      costPerKg: Number(cost.costPerKg),
    }));
  }

  /**
   * Compare costs between fertilizer types
   */
  async compareFertilizerCosts(): Promise<
    Array<{ type: string; currentCostPerKg: number; supplier: string }>
  > {
    const dbPromise = getDb();
    const db = await dbPromise;
    if (!db) throw new Error('Database connection failed');

    const costs = await db.select().from(fertilizerCosts)
      .where(lte(fertilizerCosts.effectiveDate, new Date()))
      .orderBy((c: any) => c.effectiveDate);

    // Group by fertilizer type and get latest cost
    const latestCosts: Record<string, any> = {};
    for (const cost of costs) {
      if (!latestCosts[cost.fertilizerType]) {
        latestCosts[cost.fertilizerType] = cost;
      }
    }

    return Object.values(latestCosts).map((cost) => ({
      type: cost.fertilizerType,
      currentCostPerKg: Number(cost.costPerKg),
      supplier: cost.supplier || 'Unknown',
    }));
  }

  /**
   * Generate cost-saving recommendations
   */
  private generateRecommendations(
    costPerHectare: number,
    costBreakdown: Record<string, { quantity: number; cost: number }>,
    roiPercentage: number
  ): string[] {
    const recommendations: string[] = [];

    // Check if cost per hectare is high
    if (costPerHectare > 500) {
      recommendations.push(
        'High fertilizer cost per hectare detected. Consider reviewing application rates or exploring alternative fertilizers.'
      );
    }

    // Check ROI
    if (roiPercentage < 100) {
      recommendations.push(
        'ROI is below 100%. Consider optimizing fertilizer application timing and rates for better returns.'
      );
    }

    // Check for expensive fertilizers
    const expensiveTypes = Object.entries(costBreakdown)
      .filter(([, data]) => data.cost > 200)
      .map(([type]) => type);

    if (expensiveTypes.length > 0) {
      recommendations.push(
        `Consider evaluating alternatives to ${expensiveTypes.join(', ')} to reduce costs.`
      );
    }

    // Check for balanced fertilizer use
    if (Object.keys(costBreakdown).length < 2) {
      recommendations.push(
        'Consider using a balanced mix of fertilizer types for better soil health and crop performance.'
      );
    }

    if (recommendations.length === 0) {
      recommendations.push('Current fertilizer cost strategy appears optimal.');
    }

    return recommendations;
  }
}

export const fertilizerCostAnalysisService = new FertilizerCostAnalysisService();
