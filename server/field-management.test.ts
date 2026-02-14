import { describe, it, expect, beforeEach } from 'vitest';

// Field Management System Tests

interface Field {
  id: number;
  fieldId: string;
  fieldName: string;
  fieldCode: string;
  areaHectares: number;
  soilType: string;
  soilPH: number;
  fieldStatus: 'active' | 'fallow' | 'preparation' | 'harvested' | 'archived';
  cropId?: number;
  cropName?: string;
}

interface FieldSegment {
  id: number;
  segmentId: string;
  fieldId: number;
  segmentName: string;
  segmentCode: string;
  areaHectares: number;
  segmentationType: 'geographic' | 'soil_type' | 'irrigation' | 'crop_variety' | 'management_zone';
  soilPH: number;
  moistureLevel: number;
  nitrogenLevel: number;
  phosphorusLevel: number;
  potassiumLevel: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  segmentStatus: 'active' | 'inactive' | 'treatment' | 'monitoring';
}

interface FieldHealthRecord {
  id: number;
  recordId: string;
  segmentId: number;
  recordDate: string;
  healthScore: number;
  diseasePresence: string[];
  pestPresence: string[];
  cropCondition: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
}

interface FieldYieldRecord {
  id: number;
  yieldId: string;
  segmentId: number;
  fieldId: number;
  harvestDate: string;
  quantityHarvested: number;
  unit: string;
  yieldPerHectare: number;
  quality: 'premium' | 'grade_a' | 'grade_b' | 'grade_c' | 'rejected';
}

class FieldManagementSystem {
  private fields: Map<number, Field> = new Map();
  private segments: Map<number, FieldSegment> = new Map();
  private healthRecords: Map<number, FieldHealthRecord> = new Map();
  private yieldRecords: Map<number, FieldYieldRecord> = new Map();
  private fieldIdCounter = 1;
  private segmentIdCounter = 1;
  private recordIdCounter = 1;
  private yieldIdCounter = 1;

  // Field Management Operations
  createField(data: Omit<Field, 'id' | 'fieldId'>): Field {
    const field: Field = {
      id: this.fieldIdCounter++,
      fieldId: `f-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...data,
    };
    this.fields.set(field.id, field);
    return field;
  }

  getField(fieldId: number): Field | undefined {
    return this.fields.get(fieldId);
  }

  getAllFields(): Field[] {
    return Array.from(this.fields.values());
  }

  updateField(fieldId: number, updates: Partial<Field>): boolean {
    const field = this.fields.get(fieldId);
    if (!field) return false;
    Object.assign(field, updates);
    return true;
  }

  deleteField(fieldId: number): boolean {
    return this.fields.delete(fieldId);
  }

  getFieldsByStatus(status: string): Field[] {
    return Array.from(this.fields.values()).filter(f => f.fieldStatus === status);
  }

  getTotalFieldArea(): number {
    return Array.from(this.fields.values()).reduce((sum, f) => sum + f.areaHectares, 0);
  }

  getAverageSoilPH(): number {
    const fields = Array.from(this.fields.values());
    if (fields.length === 0) return 0;
    return fields.reduce((sum, f) => sum + f.soilPH, 0) / fields.length;
  }

  // Field Segmentation Operations
  createSegment(data: Omit<FieldSegment, 'id' | 'segmentId'>): FieldSegment {
    const segment: FieldSegment = {
      id: this.segmentIdCounter++,
      segmentId: `seg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...data,
    };
    this.segments.set(segment.id, segment);
    return segment;
  }

  getSegment(segmentId: number): FieldSegment | undefined {
    return this.segments.get(segmentId);
  }

  getSegmentsByField(fieldId: number): FieldSegment[] {
    return Array.from(this.segments.values()).filter(s => s.fieldId === fieldId);
  }

  getSegmentsByRiskLevel(riskLevel: string): FieldSegment[] {
    return Array.from(this.segments.values()).filter(s => s.riskLevel === riskLevel);
  }

  updateSegmentStatus(segmentId: number, status: string): boolean {
    const segment = this.segments.get(segmentId);
    if (!segment) return false;
    (segment as any).segmentStatus = status;
    return true;
  }

  calculateSegmentRiskLevel(segment: FieldSegment): 'low' | 'medium' | 'high' | 'critical' {
    let riskScore = 0;

    // Soil pH risk
    if (segment.soilPH < 6.0 || segment.soilPH > 7.5) riskScore += 20;

    // Moisture risk
    if (segment.moistureLevel < 40 || segment.moistureLevel > 80) riskScore += 20;

    // Nitrogen risk
    if (segment.nitrogenLevel < 30 || segment.nitrogenLevel > 70) riskScore += 15;

    // Phosphorus risk
    if (segment.phosphorusLevel < 15 || segment.phosphorusLevel > 50) riskScore += 15;

    // Potassium risk
    if (segment.potassiumLevel < 100 || segment.potassiumLevel > 250) riskScore += 15;

    if (riskScore >= 70) return 'critical';
    if (riskScore >= 50) return 'high';
    if (riskScore >= 25) return 'medium';
    return 'low';
  }

  // Health Monitoring Operations
  recordHealthData(data: Omit<FieldHealthRecord, 'id' | 'recordId'>): FieldHealthRecord {
    const record: FieldHealthRecord = {
      id: this.recordIdCounter++,
      recordId: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...data,
    };
    this.healthRecords.set(record.id, record);
    return record;
  }

  getHealthRecordsBySegment(segmentId: number): FieldHealthRecord[] {
    return Array.from(this.healthRecords.values()).filter(r => r.segmentId === segmentId);
  }

  getLatestHealthRecord(segmentId: number): FieldHealthRecord | undefined {
    const records = this.getHealthRecordsBySegment(segmentId);
    if (records.length === 0) return undefined;
    return records.sort((a, b) => new Date(b.recordDate).getTime() - new Date(a.recordDate).getTime())[0];
  }

  calculateHealthScore(segment: FieldSegment): number {
    let score = 100;

    // Deduct points for suboptimal conditions
    if (segment.soilPH < 6.0 || segment.soilPH > 7.5) score -= 15;
    if (segment.moistureLevel < 40 || segment.moistureLevel > 80) score -= 15;
    if (segment.nitrogenLevel < 30 || segment.nitrogenLevel > 70) score -= 10;
    if (segment.phosphorusLevel < 15 || segment.phosphorusLevel > 50) score -= 10;
    if (segment.potassiumLevel < 100 || segment.potassiumLevel > 250) score -= 10;

    return Math.max(0, score);
  }

  // Yield Tracking Operations
  recordYield(data: Omit<FieldYieldRecord, 'id' | 'yieldId' | 'yieldPerHectare'>): FieldYieldRecord {
    const yieldPerHectare = data.quantityHarvested / data.areaHectares || 0;
    const record: FieldYieldRecord = {
      id: this.yieldIdCounter++,
      yieldId: `yield-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      yieldPerHectare,
      ...data,
    };
    this.yieldRecords.set(record.id, record);
    return record;
  }

  getYieldRecordsBySegment(segmentId: number): FieldYieldRecord[] {
    return Array.from(this.yieldRecords.values()).filter(r => r.segmentId === segmentId);
  }

  getYieldRecordsByField(fieldId: number): FieldYieldRecord[] {
    return Array.from(this.yieldRecords.values()).filter(r => r.fieldId === fieldId);
  }

  getAverageYieldPerHectare(fieldId: number): number {
    const records = this.getYieldRecordsByField(fieldId);
    if (records.length === 0) return 0;
    return records.reduce((sum, r) => sum + r.yieldPerHectare, 0) / records.length;
  }

  getYieldTrend(fieldId: number): 'improving' | 'stable' | 'declining' {
    const records = this.getYieldRecordsByField(fieldId).sort((a, b) => 
      new Date(b.harvestDate).getTime() - new Date(a.harvestDate).getTime()
    );

    if (records.length < 2) return 'stable';

    const recent = records.slice(0, Math.ceil(records.length / 2));
    const older = records.slice(Math.ceil(records.length / 2));

    const recentAvg = recent.reduce((sum, r) => sum + r.yieldPerHectare, 0) / recent.length;
    const olderAvg = older.reduce((sum, r) => sum + r.yieldPerHectare, 0) / older.length;

    const change = ((recentAvg - olderAvg) / olderAvg) * 100;

    if (change > 5) return 'improving';
    if (change < -5) return 'declining';
    return 'stable';
  }

  // Segmentation Analytics
  getSegmentationCoverage(fieldId: number): number {
    const field = this.fields.get(fieldId);
    if (!field) return 0;

    const segments = this.getSegmentsByField(fieldId);
    const totalArea = segments.reduce((sum, s) => sum + s.areaHectares, 0);

    return (totalArea / field.areaHectares) * 100;
  }

  getSegmentsNeedingAttention(fieldId: number): FieldSegment[] {
    const segments = this.getSegmentsByField(fieldId);
    return segments.filter(s => 
      s.riskLevel === 'high' || s.riskLevel === 'critical' || s.segmentStatus === 'treatment'
    );
  }

  getSegmentDistribution(fieldId: number): Record<string, number> {
    const segments = this.getSegmentsByField(fieldId);
    const distribution: Record<string, number> = {};

    for (const segment of segments) {
      distribution[segment.segmentationType] = (distribution[segment.segmentationType] || 0) + 1;
    }

    return distribution;
  }
}

// Tests
describe('Field Management System', () => {
  let system: FieldManagementSystem;

  beforeEach(() => {
    system = new FieldManagementSystem();
  });

  describe('Field Management', () => {
    it('should create a field', () => {
      const field = system.createField({
        fieldName: 'North Field',
        fieldCode: 'F1',
        areaHectares: 5.2,
        soilType: 'loam',
        soilPH: 6.8,
        fieldStatus: 'active',
      });

      expect(field).toBeDefined();
      expect(field.fieldName).toBe('North Field');
      expect(field.areaHectares).toBe(5.2);
    });

    it('should retrieve a field by ID', () => {
      const created = system.createField({
        fieldName: 'Test Field',
        fieldCode: 'F1',
        areaHectares: 3.0,
        soilType: 'clay',
        soilPH: 7.0,
        fieldStatus: 'active',
      });

      const retrieved = system.getField(created.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.fieldName).toBe('Test Field');
    });

    it('should update a field', () => {
      const field = system.createField({
        fieldName: 'Original Name',
        fieldCode: 'F1',
        areaHectares: 5.0,
        soilType: 'loam',
        soilPH: 6.8,
        fieldStatus: 'active',
      });

      const updated = system.updateField(field.id, { fieldName: 'Updated Name', fieldStatus: 'fallow' });
      expect(updated).toBe(true);

      const retrieved = system.getField(field.id);
      expect(retrieved?.fieldName).toBe('Updated Name');
      expect(retrieved?.fieldStatus).toBe('fallow');
    });

    it('should delete a field', () => {
      const field = system.createField({
        fieldName: 'To Delete',
        fieldCode: 'F1',
        areaHectares: 2.0,
        soilType: 'sandy',
        soilPH: 6.5,
        fieldStatus: 'active',
      });

      const deleted = system.deleteField(field.id);
      expect(deleted).toBe(true);

      const retrieved = system.getField(field.id);
      expect(retrieved).toBeUndefined();
    });

    it('should get fields by status', () => {
      system.createField({
        fieldName: 'Active Field',
        fieldCode: 'F1',
        areaHectares: 5.0,
        soilType: 'loam',
        soilPH: 6.8,
        fieldStatus: 'active',
      });

      system.createField({
        fieldName: 'Fallow Field',
        fieldCode: 'F2',
        areaHectares: 3.0,
        soilType: 'clay',
        soilPH: 7.0,
        fieldStatus: 'fallow',
      });

      const activeFields = system.getFieldsByStatus('active');
      expect(activeFields.length).toBe(1);
      expect(activeFields[0].fieldName).toBe('Active Field');
    });

    it('should calculate total field area', () => {
      system.createField({
        fieldName: 'Field 1',
        fieldCode: 'F1',
        areaHectares: 5.0,
        soilType: 'loam',
        soilPH: 6.8,
        fieldStatus: 'active',
      });

      system.createField({
        fieldName: 'Field 2',
        fieldCode: 'F2',
        areaHectares: 3.5,
        soilType: 'clay',
        soilPH: 7.0,
        fieldStatus: 'active',
      });

      const totalArea = system.getTotalFieldArea();
      expect(totalArea).toBe(8.5);
    });

    it('should calculate average soil pH', () => {
      system.createField({
        fieldName: 'Field 1',
        fieldCode: 'F1',
        areaHectares: 5.0,
        soilType: 'loam',
        soilPH: 6.8,
        fieldStatus: 'active',
      });

      system.createField({
        fieldName: 'Field 2',
        fieldCode: 'F2',
        areaHectares: 3.0,
        soilType: 'clay',
        soilPH: 7.2,
        fieldStatus: 'active',
      });

      const avgPH = system.getAverageSoilPH();
      expect(avgPH).toBeCloseTo(7.0, 1);
    });
  });

  describe('Field Segmentation', () => {
    it('should create a field segment', () => {
      const segment = system.createSegment({
        fieldId: 1,
        segmentName: 'North-West Zone',
        segmentCode: 'F1-S1',
        areaHectares: 2.6,
        segmentationType: 'geographic',
        soilPH: 6.8,
        moistureLevel: 65,
        nitrogenLevel: 45,
        phosphorusLevel: 28,
        potassiumLevel: 180,
        riskLevel: 'low',
        segmentStatus: 'active',
      });

      expect(segment).toBeDefined();
      expect(segment.segmentName).toBe('North-West Zone');
      expect(segment.areaHectares).toBe(2.6);
    });

    it('should get segments by field', () => {
      system.createSegment({
        fieldId: 1,
        segmentName: 'Segment 1',
        segmentCode: 'F1-S1',
        areaHectares: 2.6,
        segmentationType: 'geographic',
        soilPH: 6.8,
        moistureLevel: 65,
        nitrogenLevel: 45,
        phosphorusLevel: 28,
        potassiumLevel: 180,
        riskLevel: 'low',
        segmentStatus: 'active',
      });

      system.createSegment({
        fieldId: 1,
        segmentName: 'Segment 2',
        segmentCode: 'F1-S2',
        areaHectares: 2.6,
        segmentationType: 'geographic',
        soilPH: 6.5,
        moistureLevel: 55,
        nitrogenLevel: 38,
        phosphorusLevel: 22,
        potassiumLevel: 165,
        riskLevel: 'medium',
        segmentStatus: 'active',
      });

      const segments = system.getSegmentsByField(1);
      expect(segments.length).toBe(2);
    });

    it('should get segments by risk level', () => {
      system.createSegment({
        fieldId: 1,
        segmentName: 'Low Risk',
        segmentCode: 'F1-S1',
        areaHectares: 2.6,
        segmentationType: 'geographic',
        soilPH: 6.8,
        moistureLevel: 65,
        nitrogenLevel: 45,
        phosphorusLevel: 28,
        potassiumLevel: 180,
        riskLevel: 'low',
        segmentStatus: 'active',
      });

      system.createSegment({
        fieldId: 1,
        segmentName: 'High Risk',
        segmentCode: 'F1-S2',
        areaHectares: 2.6,
        segmentationType: 'geographic',
        soilPH: 5.5,
        moistureLevel: 85,
        nitrogenLevel: 80,
        phosphorusLevel: 60,
        potassiumLevel: 280,
        riskLevel: 'high',
        segmentStatus: 'treatment',
      });

      const highRiskSegments = system.getSegmentsByRiskLevel('high');
      expect(highRiskSegments.length).toBe(1);
      expect(highRiskSegments[0].segmentName).toBe('High Risk');
    });

    it('should calculate segment risk level', () => {
      const lowRiskSegment: FieldSegment = {
        id: 1,
        segmentId: 'seg-001',
        fieldId: 1,
        segmentName: 'Low Risk',
        segmentCode: 'F1-S1',
        areaHectares: 2.6,
        segmentationType: 'geographic',
        soilPH: 6.8,
        moistureLevel: 65,
        nitrogenLevel: 45,
        phosphorusLevel: 28,
        potassiumLevel: 180,
        riskLevel: 'low',
        segmentStatus: 'active',
      };

      const calculatedRisk = system.calculateSegmentRiskLevel(lowRiskSegment);
      expect(calculatedRisk).toBe('low');

      const criticalSegment: FieldSegment = {
        ...lowRiskSegment,
        soilPH: 4.5,
        moistureLevel: 90,
        nitrogenLevel: 85,
        phosphorusLevel: 65,
        potassiumLevel: 300,
      };

      const criticalRisk = system.calculateSegmentRiskLevel(criticalSegment);
      expect(criticalRisk).toBe('critical');
    });

    it('should update segment status', () => {
      const segment = system.createSegment({
        fieldId: 1,
        segmentName: 'Test Segment',
        segmentCode: 'F1-S1',
        areaHectares: 2.6,
        segmentationType: 'geographic',
        soilPH: 6.8,
        moistureLevel: 65,
        nitrogenLevel: 45,
        phosphorusLevel: 28,
        potassiumLevel: 180,
        riskLevel: 'low',
        segmentStatus: 'active',
      });

      const updated = system.updateSegmentStatus(segment.id, 'treatment');
      expect(updated).toBe(true);

      const retrieved = system.getSegment(segment.id);
      expect(retrieved?.segmentStatus).toBe('treatment');
    });
  });

  describe('Health Monitoring', () => {
    it('should record health data', () => {
      const record = system.recordHealthData({
        segmentId: 1,
        recordDate: '2026-02-14',
        healthScore: 85,
        diseasePresence: ['powdery_mildew'],
        pestPresence: ['aphids'],
        cropCondition: 'good',
      });

      expect(record).toBeDefined();
      expect(record.healthScore).toBe(85);
      expect(record.diseasePresence).toContain('powdery_mildew');
    });

    it('should get health records by segment', () => {
      system.recordHealthData({
        segmentId: 1,
        recordDate: '2026-02-10',
        healthScore: 80,
        diseasePresence: [],
        pestPresence: [],
        cropCondition: 'good',
      });

      system.recordHealthData({
        segmentId: 1,
        recordDate: '2026-02-14',
        healthScore: 85,
        diseasePresence: ['powdery_mildew'],
        pestPresence: [],
        cropCondition: 'good',
      });

      const records = system.getHealthRecordsBySegment(1);
      expect(records.length).toBe(2);
    });

    it('should get latest health record', () => {
      system.recordHealthData({
        segmentId: 1,
        recordDate: '2026-02-10',
        healthScore: 80,
        diseasePresence: [],
        pestPresence: [],
        cropCondition: 'good',
      });

      system.recordHealthData({
        segmentId: 1,
        recordDate: '2026-02-14',
        healthScore: 85,
        diseasePresence: ['powdery_mildew'],
        pestPresence: [],
        cropCondition: 'good',
      });

      const latest = system.getLatestHealthRecord(1);
      expect(latest?.recordDate).toBe('2026-02-14');
      expect(latest?.healthScore).toBe(85);
    });

    it('should calculate health score', () => {
      const healthySegment: FieldSegment = {
        id: 1,
        segmentId: 'seg-001',
        fieldId: 1,
        segmentName: 'Healthy',
        segmentCode: 'F1-S1',
        areaHectares: 2.6,
        segmentationType: 'geographic',
        soilPH: 6.8,
        moistureLevel: 65,
        nitrogenLevel: 45,
        phosphorusLevel: 28,
        potassiumLevel: 180,
        riskLevel: 'low',
        segmentStatus: 'active',
      };

      const score = system.calculateHealthScore(healthySegment);
      expect(score).toBe(100);

      const unhealthySegment: FieldSegment = {
        ...healthySegment,
        soilPH: 5.0,
        moistureLevel: 85,
        nitrogenLevel: 80,
        phosphorusLevel: 60,
        potassiumLevel: 280,
      };

      const unhealthyScore = system.calculateHealthScore(unhealthySegment);
      expect(unhealthyScore).toBeLessThan(100);
    });
  });

  describe('Yield Tracking', () => {
    it('should record yield data', () => {
      const yieldRecord = system.recordYield({
        segmentId: 1,
        fieldId: 1,
        harvestDate: '2025-08-15',
        quantityHarvested: 1300,
        unit: 'kg',
        areaHectares: 2.6,
        quality: 'grade_a',
      });

      expect(yieldRecord).toBeDefined();
      expect(yieldRecord.quantityHarvested).toBe(1300);
      expect(yieldRecord.yieldPerHectare).toBeCloseTo(500, 0);
    });

    it('should get yield records by segment', () => {
      system.recordYield({
        segmentId: 1,
        fieldId: 1,
        harvestDate: '2025-08-15',
        quantityHarvested: 1300,
        unit: 'kg',
        areaHectares: 2.6,
        quality: 'grade_a',
      });

      system.recordYield({
        segmentId: 1,
        fieldId: 1,
        harvestDate: '2024-08-15',
        quantityHarvested: 1200,
        unit: 'kg',
        areaHectares: 2.6,
        quality: 'grade_a',
      });

      const records = system.getYieldRecordsBySegment(1);
      expect(records.length).toBe(2);
    });

    it('should calculate average yield per hectare', () => {
      system.recordYield({
        segmentId: 1,
        fieldId: 1,
        harvestDate: '2025-08-15',
        quantityHarvested: 1300,
        unit: 'kg',
        areaHectares: 2.6,
        quality: 'grade_a',
      });

      system.recordYield({
        segmentId: 2,
        fieldId: 1,
        harvestDate: '2025-08-15',
        quantityHarvested: 1400,
        unit: 'kg',
        areaHectares: 2.6,
        quality: 'grade_a',
      });

      const avgYield = system.getAverageYieldPerHectare(1);
      expect(avgYield).toBeCloseTo(519.23, 1);
    });

    it('should determine yield trend', () => {
      system.recordYield({
        segmentId: 1,
        fieldId: 1,
        harvestDate: '2024-08-15',
        quantityHarvested: 1000,
        unit: 'kg',
        areaHectares: 2.6,
        quality: 'grade_a',
      });

      system.recordYield({
        segmentId: 2,
        fieldId: 1,
        harvestDate: '2025-08-15',
        quantityHarvested: 1400,
        unit: 'kg',
        areaHectares: 2.6,
        quality: 'grade_a',
      });

      const trend = system.getYieldTrend(1);
      expect(trend).toBe('improving');
    });
  });

  describe('Segmentation Analytics', () => {
    it('should calculate segmentation coverage', () => {
      const field = system.createField({
        fieldName: 'Test Field',
        fieldCode: 'F1',
        areaHectares: 5.0,
        soilType: 'loam',
        soilPH: 6.8,
        fieldStatus: 'active',
      });

      system.createSegment({
        fieldId: field.id,
        segmentName: 'Segment 1',
        segmentCode: 'F1-S1',
        areaHectares: 2.5,
        segmentationType: 'geographic',
        soilPH: 6.8,
        moistureLevel: 65,
        nitrogenLevel: 45,
        phosphorusLevel: 28,
        potassiumLevel: 180,
        riskLevel: 'low',
        segmentStatus: 'active',
      });

      system.createSegment({
        fieldId: field.id,
        segmentName: 'Segment 2',
        segmentCode: 'F1-S2',
        areaHectares: 2.5,
        segmentationType: 'geographic',
        soilPH: 6.8,
        moistureLevel: 65,
        nitrogenLevel: 45,
        phosphorusLevel: 28,
        potassiumLevel: 180,
        riskLevel: 'low',
        segmentStatus: 'active',
      });

      const coverage = system.getSegmentationCoverage(field.id);
      expect(coverage).toBe(100);
    });

    it('should identify segments needing attention', () => {
      const field = system.createField({
        fieldName: 'Test Field',
        fieldCode: 'F1',
        areaHectares: 5.0,
        soilType: 'loam',
        soilPH: 6.8,
        fieldStatus: 'active',
      });

      system.createSegment({
        fieldId: field.id,
        segmentName: 'Healthy Segment',
        segmentCode: 'F1-S1',
        areaHectares: 2.5,
        segmentationType: 'geographic',
        soilPH: 6.8,
        moistureLevel: 65,
        nitrogenLevel: 45,
        phosphorusLevel: 28,
        potassiumLevel: 180,
        riskLevel: 'low',
        segmentStatus: 'active',
      });

      system.createSegment({
        fieldId: field.id,
        segmentName: 'Problem Segment',
        segmentCode: 'F1-S2',
        areaHectares: 2.5,
        segmentationType: 'geographic',
        soilPH: 5.0,
        moistureLevel: 85,
        nitrogenLevel: 80,
        phosphorusLevel: 60,
        potassiumLevel: 280,
        riskLevel: 'high',
        segmentStatus: 'treatment',
      });

      const needingAttention = system.getSegmentsNeedingAttention(field.id);
      expect(needingAttention.length).toBe(1);
      expect(needingAttention[0].segmentName).toBe('Problem Segment');
    });

    it('should get segment distribution by type', () => {
      const field = system.createField({
        fieldName: 'Test Field',
        fieldCode: 'F1',
        areaHectares: 5.0,
        soilType: 'loam',
        soilPH: 6.8,
        fieldStatus: 'active',
      });

      system.createSegment({
        fieldId: field.id,
        segmentName: 'Geographic 1',
        segmentCode: 'F1-S1',
        areaHectares: 2.5,
        segmentationType: 'geographic',
        soilPH: 6.8,
        moistureLevel: 65,
        nitrogenLevel: 45,
        phosphorusLevel: 28,
        potassiumLevel: 180,
        riskLevel: 'low',
        segmentStatus: 'active',
      });

      system.createSegment({
        fieldId: field.id,
        segmentName: 'Soil Type',
        segmentCode: 'F1-S2',
        areaHectares: 2.5,
        segmentationType: 'soil_type',
        soilPH: 6.8,
        moistureLevel: 65,
        nitrogenLevel: 45,
        phosphorusLevel: 28,
        potassiumLevel: 180,
        riskLevel: 'low',
        segmentStatus: 'active',
      });

      const distribution = system.getSegmentDistribution(field.id);
      expect(distribution['geographic']).toBe(1);
      expect(distribution['soil_type']).toBe(1);
    });
  });

  describe('End-to-End Integration', () => {
    it('should manage complete field lifecycle', () => {
      // Create field
      const field = system.createField({
        fieldName: 'Integration Test Field',
        fieldCode: 'F1',
        areaHectares: 5.0,
        soilType: 'loam',
        soilPH: 6.8,
        fieldStatus: 'active',
        cropName: 'Wheat',
      });

      expect(field).toBeDefined();

      // Create segments
      const segment1 = system.createSegment({
        fieldId: field.id,
        segmentName: 'North Segment',
        segmentCode: 'F1-S1',
        areaHectares: 2.5,
        segmentationType: 'geographic',
        soilPH: 6.8,
        moistureLevel: 65,
        nitrogenLevel: 45,
        phosphorusLevel: 28,
        potassiumLevel: 180,
        riskLevel: 'low',
        segmentStatus: 'active',
      });

      expect(segment1).toBeDefined();

      // Record health data
      const healthRecord = system.recordHealthData({
        segmentId: segment1.id,
        recordDate: '2026-02-14',
        healthScore: 85,
        diseasePresence: [],
        pestPresence: [],
        cropCondition: 'good',
      });

      expect(healthRecord.healthScore).toBe(85);

      // Record yield
      const yieldRecord = system.recordYield({
        segmentId: segment1.id,
        fieldId: field.id,
        harvestDate: '2025-08-15',
        quantityHarvested: 1300,
        unit: 'kg',
        areaHectares: 2.5,
        quality: 'grade_a',
      });

      expect(yieldRecord.yieldPerHectare).toBeCloseTo(520, 0);

      // Verify analytics
      const coverage = system.getSegmentationCoverage(field.id);
      expect(coverage).toBe(50); // 2.5 out of 5.0 hectares

      const avgYield = system.getAverageYieldPerHectare(field.id);
      expect(avgYield).toBeCloseTo(520, 0);

      // Update field status
      system.updateField(field.id, { fieldStatus: 'harvested' });
      const updated = system.getField(field.id);
      expect(updated?.fieldStatus).toBe('harvested');
    });

    it('should handle multiple fields with segmentation', () => {
      // Create multiple fields
      const field1 = system.createField({
        fieldName: 'Field 1',
        fieldCode: 'F1',
        areaHectares: 5.0,
        soilType: 'loam',
        soilPH: 6.8,
        fieldStatus: 'active',
      });

      const field2 = system.createField({
        fieldName: 'Field 2',
        fieldCode: 'F2',
        areaHectares: 3.0,
        soilType: 'clay',
        soilPH: 7.2,
        fieldStatus: 'active',
      });

      // Create segments for each field
      system.createSegment({
        fieldId: field1.id,
        segmentName: 'F1 Segment 1',
        segmentCode: 'F1-S1',
        areaHectares: 2.5,
        segmentationType: 'geographic',
        soilPH: 6.8,
        moistureLevel: 65,
        nitrogenLevel: 45,
        phosphorusLevel: 28,
        potassiumLevel: 180,
        riskLevel: 'low',
        segmentStatus: 'active',
      });

      system.createSegment({
        fieldId: field2.id,
        segmentName: 'F2 Segment 1',
        segmentCode: 'F2-S1',
        areaHectares: 1.5,
        segmentationType: 'soil_type',
        soilPH: 7.2,
        moistureLevel: 70,
        nitrogenLevel: 50,
        phosphorusLevel: 32,
        potassiumLevel: 190,
        riskLevel: 'low',
        segmentStatus: 'active',
      });

      // Verify field-specific segments
      const field1Segments = system.getSegmentsByField(field1.id);
      const field2Segments = system.getSegmentsByField(field2.id);

      expect(field1Segments.length).toBe(1);
      expect(field2Segments.length).toBe(1);
      expect(field1Segments[0].segmentName).toBe('F1 Segment 1');
      expect(field2Segments[0].segmentName).toBe('F2 Segment 1');

      // Verify total area calculation
      const totalArea = system.getTotalFieldArea();
      expect(totalArea).toBe(8.0);
    });
  });
});
