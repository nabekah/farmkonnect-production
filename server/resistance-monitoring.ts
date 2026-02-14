/**
 * Resistance Monitoring System
 * Tracks treatment effectiveness over time to detect emerging resistance patterns
 */

export interface ResistanceRecord {
  id: string;
  pestDiseaseId: string;
  pestDiseaseName: string;
  treatmentName: string;
  activeIngredient: string;
  applicationDate: Date;
  effectiveness: number; // 0-100%
  affectedArea: number; // percentage
  fieldId: string;
  cropType: string;
  notes: string;
}

export interface ResistancePattern {
  pestDiseaseId: string;
  pestDiseaseName: string;
  treatmentName: string;
  resistanceLevel: 'susceptible' | 'low' | 'moderate' | 'high' | 'extreme';
  confidenceScore: number; // 0-100%
  trendDirection: 'improving' | 'stable' | 'declining';
  averageEffectiveness: number;
  recordCount: number;
  lastUpdated: Date;
  recommendations: string[];
}

export interface ResistanceAlert {
  id: string;
  severity: 'warning' | 'critical';
  pestDiseaseName: string;
  treatmentName: string;
  message: string;
  detectedDate: Date;
  recommendedActions: string[];
}

export class ResistanceMonitoringSystem {
  private resistanceRecords: Map<string, ResistanceRecord[]> = new Map();
  private patterns: Map<string, ResistancePattern> = new Map();
  private alerts: ResistanceAlert[] = [];
  private thresholds = {
    lowResistance: 85,
    moderateResistance: 70,
    highResistance: 50,
    extremeResistance: 30,
  };

  recordTreatmentEffectiveness(record: Omit<ResistanceRecord, 'id'>): ResistanceRecord {
    const id = `resistance-${Date.now()}`;
    const fullRecord: ResistanceRecord = { ...record, id };

    const key = `${record.pestDiseaseId}-${record.treatmentName}`;
    if (!this.resistanceRecords.has(key)) {
      this.resistanceRecords.set(key, []);
    }
    this.resistanceRecords.get(key)!.push(fullRecord);

    // Update pattern analysis
    this.updateResistancePattern(record.pestDiseaseId, record.treatmentName);

    return fullRecord;
  }

  private updateResistancePattern(pestDiseaseId: string, treatmentName: string): void {
    const key = `${pestDiseaseId}-${treatmentName}`;
    const records = this.resistanceRecords.get(key) || [];

    if (records.length === 0) return;

    const avgEffectiveness = records.reduce((sum, r) => sum + r.effectiveness, 0) / records.length;
    const recentRecords = records.slice(-5);
    const recentAvg = recentRecords.reduce((sum, r) => sum + r.effectiveness, 0) / recentRecords.length;

    let resistanceLevel: 'susceptible' | 'low' | 'moderate' | 'high' | 'extreme';
    if (avgEffectiveness >= this.thresholds.lowResistance) {
      resistanceLevel = 'susceptible';
    } else if (avgEffectiveness >= this.thresholds.moderateResistance) {
      resistanceLevel = 'low';
    } else if (avgEffectiveness >= this.thresholds.highResistance) {
      resistanceLevel = 'moderate';
    } else if (avgEffectiveness >= this.thresholds.extremeResistance) {
      resistanceLevel = 'high';
    } else {
      resistanceLevel = 'extreme';
    }

    const trendDirection: 'improving' | 'stable' | 'declining' =
      recentAvg > avgEffectiveness + 5 ? 'improving' : recentAvg < avgEffectiveness - 5 ? 'declining' : 'stable';

    const recommendations = this.generateRecommendations(resistanceLevel, trendDirection);

    const pattern: ResistancePattern = {
      pestDiseaseId,
      pestDiseaseName: records[0]?.pestDiseaseName || 'Unknown',
      treatmentName,
      resistanceLevel,
      confidenceScore: Math.min(100, records.length * 10),
      trendDirection,
      averageEffectiveness: Math.round(avgEffectiveness * 100) / 100,
      recordCount: records.length,
      lastUpdated: new Date(),
      recommendations,
    };

    this.patterns.set(key, pattern);

    // Check for alerts
    if (resistanceLevel === 'high' || resistanceLevel === 'extreme') {
      this.createAlert(pattern);
    }
  }

  private generateRecommendations(resistanceLevel: string, trendDirection: string): string[] {
    const recommendations: string[] = [];

    if (resistanceLevel === 'extreme') {
      recommendations.push('URGENT: Stop using this treatment immediately');
      recommendations.push('Switch to alternative chemical class');
      recommendations.push('Implement integrated pest management');
    } else if (resistanceLevel === 'high') {
      recommendations.push('Reduce treatment frequency');
      recommendations.push('Rotate with alternative treatments');
      recommendations.push('Increase application rate cautiously');
    } else if (resistanceLevel === 'moderate') {
      recommendations.push('Monitor effectiveness closely');
      recommendations.push('Plan rotation strategy');
      recommendations.push('Consider combination treatments');
    }

    if (trendDirection === 'declining') {
      recommendations.push('Increase monitoring frequency');
      recommendations.push('Prepare alternative treatment options');
    }

    return recommendations;
  }

  private createAlert(pattern: ResistancePattern): void {
    const severity = pattern.resistanceLevel === 'extreme' ? 'critical' : 'warning';
    const alert: ResistanceAlert = {
      id: `alert-${Date.now()}`,
      severity,
      pestDiseaseName: pattern.pestDiseaseName,
      treatmentName: pattern.treatmentName,
      message: `${pattern.resistanceLevel.toUpperCase()} resistance detected for ${pattern.treatmentName} against ${pattern.pestDiseaseName}. Average effectiveness: ${pattern.averageEffectiveness}%`,
      detectedDate: new Date(),
      recommendedActions: pattern.recommendations,
    };

    this.alerts.push(alert);
  }

  getResistancePattern(pestDiseaseId: string, treatmentName: string): ResistancePattern | undefined {
    const key = `${pestDiseaseId}-${treatmentName}`;
    return this.patterns.get(key);
  }

  getAllResistancePatterns(): ResistancePattern[] {
    return Array.from(this.patterns.values());
  }

  getResistanceAlerts(severity?: 'warning' | 'critical'): ResistanceAlert[] {
    return severity
      ? this.alerts.filter(a => a.severity === severity)
      : this.alerts;
  }

  getEffectivenessTrend(pestDiseaseId: string, treatmentName: string, months: number = 6): {
    dates: string[];
    effectiveness: number[];
    trend: string;
  } {
    const key = `${pestDiseaseId}-${treatmentName}`;
    const records = this.resistanceRecords.get(key) || [];

    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - months);

    const filteredRecords = records.filter(r => new Date(r.applicationDate) >= cutoffDate);

    if (filteredRecords.length === 0) {
      return { dates: [], effectiveness: [], trend: 'no data' };
    }

    const grouped = new Map<string, number[]>();
    filteredRecords.forEach(r => {
      const dateKey = new Date(r.applicationDate).toISOString().split('T')[0];
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      grouped.get(dateKey)!.push(r.effectiveness);
    });

    const dates = Array.from(grouped.keys()).sort();
    const effectiveness = dates.map(d => {
      const values = grouped.get(d) || [];
      return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100;
    });

    const firstAvg = effectiveness.slice(0, Math.ceil(effectiveness.length / 2)).reduce((a, b) => a + b) / Math.ceil(effectiveness.length / 2);
    const lastAvg = effectiveness.slice(Math.floor(effectiveness.length / 2)).reduce((a, b) => a + b) / Math.floor(effectiveness.length / 2);

    const trend = lastAvg > firstAvg + 5 ? 'improving' : lastAvg < firstAvg - 5 ? 'declining' : 'stable';

    return { dates, effectiveness, trend };
  }

  getFieldResistanceStatus(fieldId: string): {
    highRiskTreatments: string[];
    moderateRiskTreatments: string[];
    recommendations: string[];
  } {
    const fieldRecords: ResistanceRecord[] = [];
    this.resistanceRecords.forEach(records => {
      fieldRecords.push(...records.filter(r => r.fieldId === fieldId));
    });

    const highRiskTreatments: string[] = [];
    const moderateRiskTreatments: string[] = [];

    this.patterns.forEach(pattern => {
      const fieldPatternRecords = fieldRecords.filter(
        r => r.pestDiseaseId === pattern.pestDiseaseId && r.treatmentName === pattern.treatmentName
      );

      if (fieldPatternRecords.length > 0) {
        if (pattern.resistanceLevel === 'high' || pattern.resistanceLevel === 'extreme') {
          highRiskTreatments.push(`${pattern.treatmentName} (${pattern.resistanceLevel})`);
        } else if (pattern.resistanceLevel === 'moderate') {
          moderateRiskTreatments.push(`${pattern.treatmentName} (${pattern.resistanceLevel})`);
        }
      }
    });

    const recommendations: string[] = [];
    if (highRiskTreatments.length > 0) {
      recommendations.push('Immediate action required for high-risk treatments');
      recommendations.push('Consider field rotation or alternative crops');
    }
    if (moderateRiskTreatments.length > 0) {
      recommendations.push('Monitor moderate-risk treatments closely');
      recommendations.push('Plan treatment rotation strategy');
    }

    return { highRiskTreatments, moderateRiskTreatments, recommendations };
  }

  clearOldAlerts(daysOld: number = 30): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const initialLength = this.alerts.length;
    this.alerts = this.alerts.filter(a => new Date(a.detectedDate) > cutoffDate);

    return initialLength - this.alerts.length;
  }
}

export const resistanceMonitoringSystem = new ResistanceMonitoringSystem();
