import { describe, it, expect, beforeEach } from 'vitest';

// Field Analytics Integration Tests

interface FieldAnalyticsData {
  fieldId: number;
  fieldName: string;
  totalArea: number;
  averageYield: number;
  yieldTrend: 'improving' | 'stable' | 'declining';
  profitMargin: number;
  soilHealth: number;
  waterEfficiency: number;
  nitrogenUtilization: number;
  diseaseIncidence: number;
  costPerHectare: number;
  revenuePerHectare: number;
  roi: number;
}

interface MapLocation {
  fieldId: number;
  latitude: number;
  longitude: number;
  areaHectares: number;
}

interface CropRecommendation {
  cropName: string;
  compatibilityScore: number;
  yieldPotential: number;
  profitMargin: number;
  riskLevel: 'low' | 'medium' | 'high';
}

interface HistoricalRecord {
  year: number;
  cropName: string;
  yieldPerHectare: number;
  quality: string;
}

interface RotationPlan {
  fieldId: number;
  strategy: 'two_year' | 'three_year' | 'four_year';
  soilHealthScore: number;
  diseaseRiskReduction: number;
  yieldOptimization: number;
}

class FieldAnalyticsEngine {
  private fields: Map<number, FieldAnalyticsData> = new Map();
  private maps: Map<number, MapLocation> = new Map();
  private recommendations: Map<number, CropRecommendation[]> = new Map();
  private history: Map<number, HistoricalRecord[]> = new Map();
  private rotations: Map<number, RotationPlan> = new Map();

  // Field Analytics
  addFieldAnalytics(data: FieldAnalyticsData): void {
    this.fields.set(data.fieldId, data);
  }

  getFieldAnalytics(fieldId: number): FieldAnalyticsData | undefined {
    return this.fields.get(fieldId);
  }

  calculateROI(fieldId: number): number {
    const field = this.fields.get(fieldId);
    if (!field) return 0;
    return ((field.revenuePerHectare - field.costPerHectare) / field.costPerHectare) * 100;
  }

  calculateProfitPerHectare(fieldId: number): number {
    const field = this.fields.get(fieldId);
    if (!field) return 0;
    return field.revenuePerHectare - field.costPerHectare;
  }

  getTotalProfit(fieldId: number): number {
    const field = this.fields.get(fieldId);
    if (!field) return 0;
    return (field.revenuePerHectare - field.costPerHectare) * field.totalArea;
  }

  // Map Integration
  addFieldLocation(location: MapLocation): void {
    this.maps.set(location.fieldId, location);
  }

  getFieldLocation(fieldId: number): MapLocation | undefined {
    return this.maps.get(fieldId);
  }

  calculateDistance(loc1: MapLocation, loc2: MapLocation): number {
    const R = 6371; // Earth's radius in km
    const dLat = ((loc2.latitude - loc1.latitude) * Math.PI) / 180;
    const dLon = ((loc2.longitude - loc1.longitude) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((loc1.latitude * Math.PI) / 180) * Math.cos((loc2.latitude * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Crop Recommendations
  addCropRecommendations(fieldId: number, recommendations: CropRecommendation[]): void {
    this.recommendations.set(fieldId, recommendations);
  }

  getCropRecommendations(fieldId: number): CropRecommendation[] {
    return this.recommendations.get(fieldId) || [];
  }

  getTopRecommendation(fieldId: number): CropRecommendation | null {
    const recs = this.recommendations.get(fieldId);
    if (!recs || recs.length === 0) return null;
    return recs.reduce((top, current) => (current.compatibilityScore > top.compatibilityScore ? current : top));
  }

  calculateAverageCompatibility(fieldId: number): number {
    const recs = this.recommendations.get(fieldId);
    if (!recs || recs.length === 0) return 0;
    return recs.reduce((sum, r) => sum + r.compatibilityScore, 0) / recs.length;
  }

  // Historical Data
  addHistoricalRecords(fieldId: number, records: HistoricalRecord[]): void {
    this.history.set(fieldId, records);
  }

  getHistoricalRecords(fieldId: number): HistoricalRecord[] {
    return this.history.get(fieldId) || [];
  }

  calculateAverageHistoricalYield(fieldId: number): number {
    const records = this.history.get(fieldId);
    if (!records || records.length === 0) return 0;
    return records.reduce((sum, r) => sum + r.yieldPerHectare, 0) / records.length;
  }

  calculateYieldTrend(fieldId: number): 'improving' | 'stable' | 'declining' {
    const records = this.history.get(fieldId);
    if (!records || records.length < 2) return 'stable';

    const sorted = [...records].sort((a, b) => a.year - b.year);
    const recent = sorted.slice(-2);
    const older = sorted.slice(0, -2);

    if (older.length === 0) return 'stable';

    const recentAvg = recent.reduce((sum, r) => sum + r.yieldPerHectare, 0) / recent.length;
    const olderAvg = older.reduce((sum, r) => sum + r.yieldPerHectare, 0) / older.length;

    const change = ((recentAvg - olderAvg) / olderAvg) * 100;

    if (change > 5) return 'improving';
    if (change < -5) return 'declining';
    return 'stable';
  }

  // Crop Rotation
  addRotationPlan(plan: RotationPlan): void {
    this.rotations.set(plan.fieldId, plan);
  }

  getRotationPlan(fieldId: number): RotationPlan | undefined {
    return this.rotations.get(fieldId);
  }

  calculateRotationBenefit(fieldId: number): number {
    const plan = this.rotations.get(fieldId);
    if (!plan) return 0;
    return (plan.soilHealthScore + plan.diseaseRiskReduction + plan.yieldOptimization) / 3;
  }

  // Cross-feature Analytics
  calculateFieldScore(fieldId: number): number {
    const analytics = this.fields.get(fieldId);
    if (!analytics) return 0;

    let score = 0;
    score += analytics.soilHealth * 0.25;
    score += analytics.waterEfficiency * 0.2;
    score += analytics.nitrogenUtilization * 0.2;
    score += (100 - analytics.diseaseIncidence) * 0.15;
    score += (analytics.roi / 2) * 0.2; // Cap at 50 for ROI

    return Math.min(100, score);
  }

  compareFields(fieldId1: number, fieldId2: number): { better: number; score1: number; score2: number } {
    const score1 = this.calculateFieldScore(fieldId1);
    const score2 = this.calculateFieldScore(fieldId2);

    return {
      better: score1 > score2 ? fieldId1 : fieldId2,
      score1,
      score2,
    };
  }

  predictFutureYield(fieldId: number, years: number): number {
    const field = this.fields.get(fieldId);
    if (!field) return 0;

    let predictedYield = field.averageYield;

    if (field.yieldTrend === 'improving') {
      predictedYield *= 1 + 0.05 * years; // 5% annual improvement
    } else if (field.yieldTrend === 'declining') {
      predictedYield *= 1 - 0.03 * years; // 3% annual decline
    }

    return Math.max(0, predictedYield);
  }

  calculateSustainabilityScore(fieldId: number): number {
    const analytics = this.fields.get(fieldId);
    if (!analytics) return 0;

    let score = 0;
    score += analytics.soilHealth * 0.3;
    score += analytics.waterEfficiency * 0.25;
    score += (100 - analytics.diseaseIncidence) * 0.2;
    score += (100 - analytics.costPerHectare / 20) * 0.25; // Normalize cost

    return Math.min(100, Math.max(0, score));
  }
}

// Tests
describe('Field Analytics Integration', () => {
  let engine: FieldAnalyticsEngine;

  beforeEach(() => {
    engine = new FieldAnalyticsEngine();
  });

  describe('Field Analytics', () => {
    it('should add and retrieve field analytics', () => {
      const analytics: FieldAnalyticsData = {
        fieldId: 1,
        fieldName: 'North Field',
        totalArea: 5.2,
        averageYield: 4800,
        yieldTrend: 'improving',
        profitMargin: 35,
        soilHealth: 78,
        waterEfficiency: 82,
        nitrogenUtilization: 75,
        diseaseIncidence: 5,
        costPerHectare: 1200,
        revenuePerHectare: 3200,
        roi: 167,
      };

      engine.addFieldAnalytics(analytics);
      const retrieved = engine.getFieldAnalytics(1);

      expect(retrieved).toBeDefined();
      expect(retrieved?.fieldName).toBe('North Field');
      expect(retrieved?.averageYield).toBe(4800);
    });

    it('should calculate ROI correctly', () => {
      const analytics: FieldAnalyticsData = {
        fieldId: 1,
        fieldName: 'Test Field',
        totalArea: 5.0,
        averageYield: 5000,
        yieldTrend: 'stable',
        profitMargin: 30,
        soilHealth: 75,
        waterEfficiency: 80,
        nitrogenUtilization: 70,
        diseaseIncidence: 8,
        costPerHectare: 1000,
        revenuePerHectare: 3000,
        roi: 200,
      };

      engine.addFieldAnalytics(analytics);
      const roi = engine.calculateROI(1);

      expect(roi).toBeCloseTo(200, 0);
    });

    it('should calculate profit per hectare', () => {
      const analytics: FieldAnalyticsData = {
        fieldId: 1,
        fieldName: 'Test Field',
        totalArea: 5.0,
        averageYield: 5000,
        yieldTrend: 'stable',
        profitMargin: 30,
        soilHealth: 75,
        waterEfficiency: 80,
        nitrogenUtilization: 70,
        diseaseIncidence: 8,
        costPerHectare: 1000,
        revenuePerHectare: 3000,
        roi: 200,
      };

      engine.addFieldAnalytics(analytics);
      const profit = engine.calculateProfitPerHectare(1);

      expect(profit).toBe(2000);
    });

    it('should calculate total profit', () => {
      const analytics: FieldAnalyticsData = {
        fieldId: 1,
        fieldName: 'Test Field',
        totalArea: 5.0,
        averageYield: 5000,
        yieldTrend: 'stable',
        profitMargin: 30,
        soilHealth: 75,
        waterEfficiency: 80,
        nitrogenUtilization: 70,
        diseaseIncidence: 8,
        costPerHectare: 1000,
        revenuePerHectare: 3000,
        roi: 200,
      };

      engine.addFieldAnalytics(analytics);
      const totalProfit = engine.getTotalProfit(1);

      expect(totalProfit).toBe(10000); // (3000 - 1000) * 5
    });
  });

  describe('Map Integration', () => {
    it('should add and retrieve field locations', () => {
      const location: MapLocation = {
        fieldId: 1,
        latitude: 40.7128,
        longitude: -74.006,
        areaHectares: 5.2,
      };

      engine.addFieldLocation(location);
      const retrieved = engine.getFieldLocation(1);

      expect(retrieved).toBeDefined();
      expect(retrieved?.latitude).toBe(40.7128);
      expect(retrieved?.longitude).toBe(-74.006);
    });

    it('should calculate distance between fields', () => {
      const loc1: MapLocation = {
        fieldId: 1,
        latitude: 40.7128,
        longitude: -74.006,
        areaHectares: 5.2,
      };

      const loc2: MapLocation = {
        fieldId: 2,
        latitude: 40.7100,
        longitude: -74.0050,
        areaHectares: 3.8,
      };

      const distance = engine.calculateDistance(loc1, loc2);

      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeLessThan(1); // Should be less than 1 km
    });
  });

  describe('Crop Recommendations', () => {
    it('should add and retrieve crop recommendations', () => {
      const recommendations: CropRecommendation[] = [
        {
          cropName: 'Corn',
          compatibilityScore: 92,
          yieldPotential: 8500,
          profitMargin: 35,
          riskLevel: 'low',
        },
        {
          cropName: 'Soybean',
          compatibilityScore: 88,
          yieldPotential: 3200,
          profitMargin: 32,
          riskLevel: 'low',
        },
      ];

      engine.addCropRecommendations(1, recommendations);
      const retrieved = engine.getCropRecommendations(1);

      expect(retrieved.length).toBe(2);
      expect(retrieved[0].cropName).toBe('Corn');
    });

    it('should get top recommendation', () => {
      const recommendations: CropRecommendation[] = [
        {
          cropName: 'Corn',
          compatibilityScore: 92,
          yieldPotential: 8500,
          profitMargin: 35,
          riskLevel: 'low',
        },
        {
          cropName: 'Soybean',
          compatibilityScore: 88,
          yieldPotential: 3200,
          profitMargin: 32,
          riskLevel: 'low',
        },
      ];

      engine.addCropRecommendations(1, recommendations);
      const top = engine.getTopRecommendation(1);

      expect(top).toBeDefined();
      expect(top?.cropName).toBe('Corn');
      expect(top?.compatibilityScore).toBe(92);
    });

    it('should calculate average compatibility', () => {
      const recommendations: CropRecommendation[] = [
        {
          cropName: 'Corn',
          compatibilityScore: 90,
          yieldPotential: 8500,
          profitMargin: 35,
          riskLevel: 'low',
        },
        {
          cropName: 'Soybean',
          compatibilityScore: 80,
          yieldPotential: 3200,
          profitMargin: 32,
          riskLevel: 'low',
        },
      ];

      engine.addCropRecommendations(1, recommendations);
      const avg = engine.calculateAverageCompatibility(1);

      expect(avg).toBe(85);
    });
  });

  describe('Historical Data', () => {
    it('should add and retrieve historical records', () => {
      const records: HistoricalRecord[] = [
        { year: 2022, cropName: 'Wheat', yieldPerHectare: 4200, quality: 'grade_a' },
        { year: 2023, cropName: 'Corn', yieldPerHectare: 4800, quality: 'grade_a' },
        { year: 2024, cropName: 'Soybean', yieldPerHectare: 3800, quality: 'grade_b' },
      ];

      engine.addHistoricalRecords(1, records);
      const retrieved = engine.getHistoricalRecords(1);

      expect(retrieved.length).toBe(3);
      expect(retrieved[0].cropName).toBe('Wheat');
    });

    it('should calculate average historical yield', () => {
      const records: HistoricalRecord[] = [
        { year: 2022, cropName: 'Wheat', yieldPerHectare: 4200, quality: 'grade_a' },
        { year: 2023, cropName: 'Corn', yieldPerHectare: 4800, quality: 'grade_a' },
        { year: 2024, cropName: 'Soybean', yieldPerHectare: 3600, quality: 'grade_b' },
      ];

      engine.addHistoricalRecords(1, records);
      const avg = engine.calculateAverageHistoricalYield(1);

      expect(avg).toBeCloseTo(4200, 0);
    });

    it('should determine yield trend', () => {
      const records: HistoricalRecord[] = [
        { year: 2022, cropName: 'Wheat', yieldPerHectare: 4000, quality: 'grade_a' },
        { year: 2023, cropName: 'Corn', yieldPerHectare: 4200, quality: 'grade_a' },
        { year: 2024, cropName: 'Soybean', yieldPerHectare: 4500, quality: 'grade_a' },
      ];

      engine.addHistoricalRecords(1, records);
      const trend = engine.calculateYieldTrend(1);

      expect(trend).toBe('improving');
    });
  });

  describe('Crop Rotation', () => {
    it('should add and retrieve rotation plans', () => {
      const plan: RotationPlan = {
        fieldId: 1,
        strategy: 'three_year',
        soilHealthScore: 78,
        diseaseRiskReduction: 65,
        yieldOptimization: 82,
      };

      engine.addRotationPlan(plan);
      const retrieved = engine.getRotationPlan(1);

      expect(retrieved).toBeDefined();
      expect(retrieved?.strategy).toBe('three_year');
    });

    it('should calculate rotation benefit', () => {
      const plan: RotationPlan = {
        fieldId: 1,
        strategy: 'three_year',
        soilHealthScore: 80,
        diseaseRiskReduction: 60,
        yieldOptimization: 80,
      };

      engine.addRotationPlan(plan);
      const benefit = engine.calculateRotationBenefit(1);

      expect(benefit).toBeCloseTo(73.33, 1);
    });
  });

  describe('Cross-feature Analytics', () => {
    it('should calculate comprehensive field score', () => {
      const analytics: FieldAnalyticsData = {
        fieldId: 1,
        fieldName: 'Test Field',
        totalArea: 5.0,
        averageYield: 5000,
        yieldTrend: 'stable',
        profitMargin: 30,
        soilHealth: 80,
        waterEfficiency: 80,
        nitrogenUtilization: 80,
        diseaseIncidence: 5,
        costPerHectare: 1000,
        revenuePerHectare: 3000,
        roi: 200,
      };

      engine.addFieldAnalytics(analytics);
      const score = engine.calculateFieldScore(1);

      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should compare two fields', () => {
      const field1: FieldAnalyticsData = {
        fieldId: 1,
        fieldName: 'Field 1',
        totalArea: 5.0,
        averageYield: 5000,
        yieldTrend: 'improving',
        profitMargin: 35,
        soilHealth: 85,
        waterEfficiency: 85,
        nitrogenUtilization: 80,
        diseaseIncidence: 3,
        costPerHectare: 1000,
        revenuePerHectare: 3000,
        roi: 200,
      };

      const field2: FieldAnalyticsData = {
        fieldId: 2,
        fieldName: 'Field 2',
        totalArea: 4.0,
        averageYield: 4000,
        yieldTrend: 'stable',
        profitMargin: 30,
        soilHealth: 70,
        waterEfficiency: 70,
        nitrogenUtilization: 70,
        diseaseIncidence: 10,
        costPerHectare: 1200,
        revenuePerHectare: 2800,
        roi: 133,
      };

      engine.addFieldAnalytics(field1);
      engine.addFieldAnalytics(field2);

      const comparison = engine.compareFields(1, 2);

      expect(comparison.better).toBe(1);
      expect(comparison.score1).toBeGreaterThan(comparison.score2);
    });

    it('should predict future yield', () => {
      const analytics: FieldAnalyticsData = {
        fieldId: 1,
        fieldName: 'Test Field',
        totalArea: 5.0,
        averageYield: 5000,
        yieldTrend: 'improving',
        profitMargin: 30,
        soilHealth: 75,
        waterEfficiency: 80,
        nitrogenUtilization: 70,
        diseaseIncidence: 8,
        costPerHectare: 1000,
        revenuePerHectare: 3000,
        roi: 200,
      };

      engine.addFieldAnalytics(analytics);
      const futureYield = engine.predictFutureYield(1, 3);

      expect(futureYield).toBeGreaterThan(5000);
    });

    it('should calculate sustainability score', () => {
      const analytics: FieldAnalyticsData = {
        fieldId: 1,
        fieldName: 'Test Field',
        totalArea: 5.0,
        averageYield: 5000,
        yieldTrend: 'stable',
        profitMargin: 30,
        soilHealth: 80,
        waterEfficiency: 85,
        nitrogenUtilization: 75,
        diseaseIncidence: 5,
        costPerHectare: 1000,
        revenuePerHectare: 3000,
        roi: 200,
      };

      engine.addFieldAnalytics(analytics);
      const sustainability = engine.calculateSustainabilityScore(1);

      expect(sustainability).toBeGreaterThan(0);
      expect(sustainability).toBeLessThanOrEqual(100);
    });
  });

  describe('End-to-End Integration', () => {
    it('should manage complete field analytics workflow', () => {
      // Add field analytics
      const analytics: FieldAnalyticsData = {
        fieldId: 1,
        fieldName: 'North Field',
        totalArea: 5.2,
        averageYield: 4800,
        yieldTrend: 'improving',
        profitMargin: 35,
        soilHealth: 78,
        waterEfficiency: 82,
        nitrogenUtilization: 75,
        diseaseIncidence: 5,
        costPerHectare: 1200,
        revenuePerHectare: 3200,
        roi: 167,
      };

      engine.addFieldAnalytics(analytics);

      // Add location
      const location: MapLocation = {
        fieldId: 1,
        latitude: 40.7128,
        longitude: -74.006,
        areaHectares: 5.2,
      };

      engine.addFieldLocation(location);

      // Add recommendations
      const recommendations: CropRecommendation[] = [
        {
          cropName: 'Corn',
          compatibilityScore: 92,
          yieldPotential: 8500,
          profitMargin: 35,
          riskLevel: 'low',
        },
      ];

      engine.addCropRecommendations(1, recommendations);

      // Add historical data
      const records: HistoricalRecord[] = [
        { year: 2022, cropName: 'Wheat', yieldPerHectare: 4200, quality: 'grade_a' },
        { year: 2023, cropName: 'Corn', yieldPerHectare: 4800, quality: 'grade_a' },
      ];

      engine.addHistoricalRecords(1, records);

      // Add rotation plan
      const plan: RotationPlan = {
        fieldId: 1,
        strategy: 'three_year',
        soilHealthScore: 78,
        diseaseRiskReduction: 65,
        yieldOptimization: 82,
      };

      engine.addRotationPlan(plan);

      // Verify all data is accessible
      expect(engine.getFieldAnalytics(1)).toBeDefined();
      expect(engine.getFieldLocation(1)).toBeDefined();
      expect(engine.getCropRecommendations(1).length).toBe(1);
      expect(engine.getHistoricalRecords(1).length).toBe(2);
      expect(engine.getRotationPlan(1)).toBeDefined();

      // Calculate comprehensive metrics
      const fieldScore = engine.calculateFieldScore(1);
      const sustainability = engine.calculateSustainabilityScore(1);
      const futureYield = engine.predictFutureYield(1, 3);

      expect(fieldScore).toBeGreaterThan(0);
      expect(sustainability).toBeGreaterThan(0);
      expect(futureYield).toBeGreaterThan(0);
    });
  });
});
