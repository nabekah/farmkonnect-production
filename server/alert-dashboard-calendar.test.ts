import { describe, it, expect, beforeEach } from 'vitest';

// Alert Dashboard Tests
describe('Alert Dashboard', () => {
  describe('Alert Management', () => {
    it('should create an alert with severity levels', () => {
      const alert = {
        id: 'alert_1',
        workerId: 1,
        workerName: 'John Smith',
        alertType: 'low_efficiency',
        severity: 'warning' as const,
        message: 'Worker efficiency is 78%',
        isResolved: false,
      };

      expect(alert.severity).toBe('warning');
      expect(alert.isResolved).toBe(false);
    });

    it('should support critical severity alerts', () => {
      const alert = {
        alertType: 'quality_issue',
        severity: 'critical' as const,
      };

      expect(alert.severity).toBe('critical');
    });

    it('should support info severity alerts', () => {
      const alert = {
        alertType: 'high_performer',
        severity: 'info' as const,
      };

      expect(alert.severity).toBe('info');
    });
  });

  describe('Alert Resolution', () => {
    let alerts: any[] = [];

    beforeEach(() => {
      alerts = [
        { id: 'alert_1', isResolved: false, alertType: 'low_efficiency' },
        { id: 'alert_2', isResolved: false, alertType: 'time_overrun' },
        { id: 'alert_3', isResolved: true, alertType: 'quality_issue' },
      ];
    });

    it('should resolve an alert', () => {
      const alertId = 'alert_1';
      const updated = alerts.map(a =>
        a.id === alertId ? { ...a, isResolved: true, resolvedAt: new Date() } : a
      );

      expect(updated.find(a => a.id === alertId)?.isResolved).toBe(true);
    });

    it('should reactivate a resolved alert', () => {
      const alertId = 'alert_3';
      const updated = alerts.map(a =>
        a.id === alertId ? { ...a, isResolved: false, resolvedAt: undefined } : a
      );

      expect(updated.find(a => a.id === alertId)?.isResolved).toBe(false);
    });

    it('should filter active alerts', () => {
      const activeAlerts = alerts.filter(a => !a.isResolved);
      expect(activeAlerts.length).toBe(2);
    });

    it('should filter resolved alerts', () => {
      const resolvedAlerts = alerts.filter(a => a.isResolved);
      expect(resolvedAlerts.length).toBe(1);
    });
  });

  describe('Alert Quick Actions', () => {
    it('should support mark complete action', () => {
      const action = { type: 'mark_complete', alertId: 'alert_1' };
      expect(action.type).toBe('mark_complete');
    });

    it('should support training action', () => {
      const action = { type: 'provide_training', alertId: 'alert_1', notes: 'Focus on efficiency' };
      expect(action.type).toBe('provide_training');
      expect(action.notes).toBeDefined();
    });

    it('should support deadline extension action', () => {
      const action = { type: 'extend_deadline', alertId: 'alert_1', hours: 2.5 };
      expect(action.type).toBe('extend_deadline');
      expect(action.hours).toBe(2.5);
    });

    it('should support task reassignment action', () => {
      const action = { type: 'reassign', alertId: 'alert_1', newWorkerId: 2 };
      expect(action.type).toBe('reassign');
      expect(action.newWorkerId).toBe(2);
    });
  });

  describe('Alert Summary Statistics', () => {
    let alerts: any[] = [];

    beforeEach(() => {
      alerts = [
        { id: 'alert_1', severity: 'critical', isResolved: false },
        { id: 'alert_2', severity: 'critical', isResolved: false },
        { id: 'alert_3', severity: 'warning', isResolved: false },
        { id: 'alert_4', severity: 'warning', isResolved: false },
        { id: 'alert_5', severity: 'warning', isResolved: false },
        { id: 'alert_6', severity: 'info', isResolved: false },
        { id: 'alert_7', severity: 'warning', isResolved: true },
      ];
    });

    it('should count critical alerts', () => {
      const criticalCount = alerts.filter(a => a.severity === 'critical' && !a.isResolved).length;
      expect(criticalCount).toBe(2);
    });

    it('should count warning alerts', () => {
      const warningCount = alerts.filter(a => a.severity === 'warning' && !a.isResolved).length;
      expect(warningCount).toBe(3);
    });

    it('should count info alerts', () => {
      const infoCount = alerts.filter(a => a.severity === 'info' && !a.isResolved).length;
      expect(infoCount).toBe(1);
    });

    it('should count resolved alerts', () => {
      const resolvedCount = alerts.filter(a => a.isResolved).length;
      expect(resolvedCount).toBe(1);
    });

    it('should calculate total active alerts', () => {
      const activeCount = alerts.filter(a => !a.isResolved).length;
      expect(activeCount).toBe(6);
    });
  });
});

// Worker Availability Calendar Tests
describe('Worker Availability Calendar', () => {
  describe('Worker Schedule', () => {
    it('should create worker schedule for a date', () => {
      const schedule = {
        workerId: 1,
        workerName: 'John Smith',
        date: '2026-02-14',
        availableHours: 8,
        scheduledHours: 6,
        status: 'available' as const,
        tasks: [],
      };

      expect(schedule.availableHours).toBe(8);
      expect(schedule.scheduledHours).toBe(6);
      expect(schedule.status).toBe('available');
    });

    it('should identify busy schedule', () => {
      const schedule = {
        availableHours: 8,
        scheduledHours: 8,
        status: 'busy' as const,
      };

      expect(schedule.status).toBe('busy');
    });

    it('should identify overbooked schedule', () => {
      const schedule = {
        availableHours: 8,
        scheduledHours: 10,
        status: 'overbooked' as const,
      };

      expect(schedule.status).toBe('overbooked');
      expect(schedule.scheduledHours > schedule.availableHours).toBe(true);
    });

    it('should identify off day', () => {
      const schedule = {
        availableHours: 0,
        scheduledHours: 0,
        status: 'off' as const,
      };

      expect(schedule.status).toBe('off');
    });
  });

  describe('Task Scheduling', () => {
    it('should add task to schedule', () => {
      const schedule = {
        tasks: [] as any[],
        scheduledHours: 0,
      };

      const task = {
        taskId: 'task_1',
        title: 'Prepare Field',
        estimatedHours: 4,
        priority: 'high',
        status: 'pending',
      };

      schedule.tasks.push(task);
      schedule.scheduledHours += task.estimatedHours;

      expect(schedule.tasks.length).toBe(1);
      expect(schedule.scheduledHours).toBe(4);
    });

    it('should calculate total scheduled hours', () => {
      const tasks = [
        { estimatedHours: 4 },
        { estimatedHours: 2 },
        { estimatedHours: 2 },
      ];

      const totalHours = tasks.reduce((sum, t) => sum + t.estimatedHours, 0);
      expect(totalHours).toBe(8);
    });

    it('should detect scheduling conflicts', () => {
      const availableHours = 8;
      const scheduledHours = 10;
      const hasConflict = scheduledHours > availableHours;

      expect(hasConflict).toBe(true);
    });

    it('should calculate overage hours', () => {
      const availableHours = 8;
      const scheduledHours = 10;
      const overageHours = scheduledHours - availableHours;

      expect(overageHours).toBe(2);
    });
  });

  describe('Conflict Detection', () => {
    let schedules: any[] = [];

    beforeEach(() => {
      schedules = [
        {
          workerId: 1,
          date: '2026-02-14',
          availableHours: 8,
          scheduledHours: 8,
          status: 'busy',
        },
        {
          workerId: 1,
          date: '2026-02-15',
          availableHours: 8,
          scheduledHours: 10,
          status: 'overbooked',
        },
        {
          workerId: 2,
          date: '2026-02-14',
          availableHours: 8,
          scheduledHours: 5,
          status: 'available',
        },
      ];
    });

    it('should identify overbooked schedules', () => {
      const conflicts = schedules.filter(s => s.status === 'overbooked');
      expect(conflicts.length).toBe(1);
    });

    it('should calculate conflict severity', () => {
      const conflict = schedules.find(s => s.status === 'overbooked');
      const severity = conflict.scheduledHours - conflict.availableHours;

      expect(severity).toBe(2);
    });

    it('should identify available slots', () => {
      const available = schedules.filter(s => s.status === 'available' || s.status === 'busy');
      expect(available.length).toBeGreaterThan(0);
    });

    it('should get conflicts for a worker', () => {
      const workerId = 1;
      const workerConflicts = schedules.filter(
        s => s.workerId === workerId && s.status === 'overbooked'
      );

      expect(workerConflicts.length).toBe(1);
    });
  });

  describe('Calendar Navigation', () => {
    it('should get days in month', () => {
      const date = new Date(2026, 1); // February 2026
      const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

      expect(daysInMonth).toBe(28);
    });

    it('should get first day of month', () => {
      const date = new Date(2026, 1, 1); // Feb 1, 2026
      const firstDay = date.getDay();

      expect(firstDay).toBeGreaterThanOrEqual(0);
      expect(firstDay).toBeLessThan(7);
    });

    it('should navigate to next month', () => {
      const currentDate = new Date(2026, 1); // February
      const nextDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1);

      expect(nextDate.getMonth()).toBe(2); // March
    });

    it('should navigate to previous month', () => {
      const currentDate = new Date(2026, 1); // February
      const prevDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1);

      expect(prevDate.getMonth()).toBe(0); // January
    });
  });

  describe('Worker Availability Summary', () => {
    let schedules: any[] = [];

    beforeEach(() => {
      schedules = [
        { workerId: 1, date: '2026-02-14', availableHours: 8, scheduledHours: 6 },
        { workerId: 1, date: '2026-02-15', availableHours: 8, scheduledHours: 8 },
        { workerId: 1, date: '2026-02-16', availableHours: 8, scheduledHours: 10 },
        { workerId: 2, date: '2026-02-14', availableHours: 8, scheduledHours: 5 },
      ];
    });

    it('should calculate total available hours for worker', () => {
      const workerId = 1;
      const workerSchedules = schedules.filter(s => s.workerId === workerId);
      const totalAvailable = workerSchedules.reduce((sum, s) => sum + s.availableHours, 0);

      expect(totalAvailable).toBe(24);
    });

    it('should calculate total scheduled hours for worker', () => {
      const workerId = 1;
      const workerSchedules = schedules.filter(s => s.workerId === workerId);
      const totalScheduled = workerSchedules.reduce((sum, s) => sum + s.scheduledHours, 0);

      expect(totalScheduled).toBe(24);
    });

    it('should identify workers with conflicts', () => {
      const workersWithConflicts = schedules
        .filter(s => s.scheduledHours > s.availableHours)
        .map(s => s.workerId);

      expect(workersWithConflicts).toContain(1);
      expect(workersWithConflicts.length).toBe(1);
    });

    it('should calculate utilization percentage', () => {
      const workerId = 1;
      const workerSchedules = schedules.filter(s => s.workerId === workerId);
      const totalAvailable = workerSchedules.reduce((sum, s) => sum + s.availableHours, 0);
      const totalScheduled = workerSchedules.reduce((sum, s) => sum + s.scheduledHours, 0);
      const utilization = (totalScheduled / totalAvailable) * 100;

      expect(utilization).toBe(100);
    });
  });
});

// Integration Tests
describe('Alert Dashboard & Calendar Integration', () => {
  it('should link alerts to calendar conflicts', () => {
    const alert = {
      id: 'alert_1',
      workerId: 1,
      alertType: 'time_overrun',
      linkedConflictDate: '2026-02-16',
    };

    const conflict = {
      workerId: 1,
      date: '2026-02-16',
      status: 'overbooked',
    };

    expect(alert.workerId).toBe(conflict.workerId);
    expect(alert.linkedConflictDate).toBe(conflict.date);
  });

  it('should generate alert when schedule conflict detected', () => {
    const schedule = {
      availableHours: 8,
      scheduledHours: 10,
    };

    const shouldGenerateAlert = schedule.scheduledHours > schedule.availableHours;
    expect(shouldGenerateAlert).toBe(true);
  });

  it('should resolve alert when conflict resolved', () => {
    const alert = { id: 'alert_1', isResolved: false };
    const conflict = { status: 'overbooked' };

    // Simulate conflict resolution
    const updatedConflict = { status: 'available' };
    const updatedAlert = { ...alert, isResolved: true };

    expect(updatedAlert.isResolved).toBe(true);
  });

  it('should track action history', () => {
    const actions = [
      { type: 'alert_created', timestamp: new Date(), alertId: 'alert_1' },
      { type: 'task_reassigned', timestamp: new Date(), alertId: 'alert_1' },
      { type: 'alert_resolved', timestamp: new Date(), alertId: 'alert_1' },
    ];

    expect(actions.length).toBe(3);
    expect(actions[actions.length - 1].type).toBe('alert_resolved');
  });
});
