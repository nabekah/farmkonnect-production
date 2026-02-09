// Simplified predictive analytics service
// Uses statistical models and can be enhanced with TensorFlow.js later

import { getDb } from '../db';
import * as schema from '../../drizzle/schema';
import { eq, gte, desc } from 'drizzle-orm';

export class PredictiveAnalyticsService {
  // Livestock Health Prediction
  async predictLivestockHealth(animalId: number) {
    const db = await getDb();
    if (!db) return { prediction: 'database_unavailable', confidence: 0, healthScore: 0, recommendations: [] };
    
    // Fetch historical health records
    const healthRecords = await db.select()
      .from(schema.animalHealthRecords)
      .where(eq(schema.animalHealthRecords.animalId, animalId))
      .orderBy(desc(schema.animalHealthRecords.recordDate))
      .limit(10);

    if (healthRecords.length < 3) {
      return {
        prediction: 'insufficient_data',
        confidence: 0,
        message: 'Need at least 3 health records for prediction',
        healthScore: 0.5,
        recommendations: ['Add more health records to enable predictions'],
      };
    }

    // Calculate health score based on event types and frequency
    const eventScores: Record<string, number> = {
      vaccination: 0.9,
      checkup: 0.7,
      treatment: 0.4,
      surgery: 0.2,
    };

    let totalScore = 0;
    let recentScore = 0;

    healthRecords.forEach((record: any, index: number) => {
      const score = eventScores[record.eventType] || 0.5;
      totalScore += score;
      if (index < 3) recentScore += score; // Last 3 records
    });

    const avgScore = totalScore / healthRecords.length;
    const recentAvgScore = recentScore / Math.min(3, healthRecords.length);
    const healthScore = (avgScore + recentAvgScore) / 2;

    // Determine prediction
    let prediction: string;
    if (healthScore > 0.7) prediction = 'healthy';
    else if (healthScore > 0.4) prediction = 'at_risk';
    else prediction = 'critical';

    return {
      prediction,
      confidence: Math.abs(healthScore - 0.5) * 2,
      healthScore,
      recommendations: this.generateHealthRecommendations(healthScore),
    };
  }

  // Feed Cost Optimization
  async optimizeFeedCosts(farmId: number) {
    const db = await getDb();
    if (!db) return { currentCost: 0, estimatedSavings: 0, recommendations: [] };
    
    // Fetch feed expenses from last 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const feedExpenses = await db.select()
      .from(schema.farmExpenses)
      .where(eq(schema.farmExpenses.category, 'feed'))
      .orderBy(desc(schema.farmExpenses.expenseDate));

    const totalCost = feedExpenses.reduce((sum: number, e: any) => sum + parseFloat(e.amount), 0);

    // Calculate potential savings (15-25% based on best practices)
    const potentialSavings = totalCost * 0.20;

    return {
      currentCost: totalCost,
      estimatedSavings: potentialSavings,
      recommendations: [
        {
          action: 'Optimize feeding schedule',
          impact: 'Reduce waste by 10-15%',
          savings: totalCost * 0.12,
        },
        {
          action: 'Switch to bulk purchasing',
          impact: 'Lower unit cost by 5-8%',
          savings: totalCost * 0.06,
        },
        {
          action: 'Monitor feed conversion ratio',
          impact: 'Improve efficiency',
          savings: totalCost * 0.02,
        },
      ],
    };
  }

  // Harvest Time Prediction
  async predictOptimalHarvestTime(pondId: number) {
    const db = await getDb();
    if (!db) return { prediction: 'database_unavailable', message: 'Database not available', daysUntilHarvest: 0, confidence: 0 };
    
    // Fetch pond stocking activities
    const activities = await db.select()
      .from(schema.fishPondActivities)
      .where(eq(schema.fishPondActivities.pondId, pondId))
      .orderBy(desc(schema.fishPondActivities.activityDate));

    const stockingActivity = activities.find((a: any) => a.activityType === 'stocking');
    if (!stockingActivity) {
      return {
        prediction: 'no_stocking_data',
        message: 'No stocking date found for this pond',
        daysUntilHarvest: 0,
        confidence: 0,
      };
    }

    // Calculate days since stocking
    const stockingDate = new Date(stockingActivity.activityDate);
    const daysSinceStocking = Math.floor((Date.now() - stockingDate.getTime()) / (1000 * 60 * 60 * 24));

    // Typical fish farming cycle: 120-180 days
    const typicalCycleDays = 150;
    const daysUntilHarvest = Math.max(0, typicalCycleDays - daysSinceStocking);

    const optimalHarvestDate = new Date();
    optimalHarvestDate.setDate(optimalHarvestDate.getDate() + daysUntilHarvest);

    // Estimate current weight (simple linear growth model)
    const targetWeight = 500; // grams
    const growthRate = targetWeight / typicalCycleDays;
    const currentEstimatedWeight = Math.min(targetWeight, growthRate * daysSinceStocking);

    return {
      prediction: 'ready',
      optimalHarvestDate: optimalHarvestDate.toISOString(),
      daysUntilHarvest,
      currentEstimatedWeight: Math.round(currentEstimatedWeight),
      targetWeight,
      confidence: activities.length > 5 ? 0.80 : 0.60,
      recommendations: [
        'Monitor water quality daily',
        'Maintain optimal feeding schedule',
        'Check for signs of disease',
        'Prepare harvesting equipment',
      ],
    };
  }

  // Helper methods
  private generateHealthRecommendations(healthScore: number): string[] {
    if (healthScore > 0.7) {
      return [
        'Continue regular checkups',
        'Maintain current feeding schedule',
        'Monitor for any changes in behavior',
      ];
    } else if (healthScore > 0.4) {
      return [
        'Schedule veterinary checkup soon',
        'Review feeding and housing conditions',
        'Monitor closely for symptoms',
        'Consider preventive treatments',
      ];
    } else {
      return [
        'Immediate veterinary attention required',
        'Isolate from other animals if necessary',
        'Review recent health history',
        'Prepare for potential treatment',
      ];
    }
  }
}

export const analyticsService = new PredictiveAnalyticsService();
