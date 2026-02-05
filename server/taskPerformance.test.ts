import { describe, it, expect } from 'vitest';

// Task Performance Analytics Utilities
interface Task {
  id: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  taskType: string;
  dueDate: Date;
  createdAt: Date;
  completedAt?: Date;
  photoRequirements: number;
  photosAttached: number;
}

function calculateCompletionRate(tasks: Task[]): number {
  if (tasks.length === 0) return 0;
  const completed = tasks.filter((t) => t.status === 'completed').length;
  return (completed / tasks.length) * 100;
}

function identifyOverdueTasks(tasks: Task[]): Task[] {
  const now = new Date();
  return tasks.filter((t) => t.dueDate < now && t.status !== 'completed');
}

function calculateAverageCompletionTime(tasks: Task[]): number {
  const completedTasks = tasks.filter((t) => t.status === 'completed' && t.completedAt);
  if (completedTasks.length === 0) return 0;

  const totalTime = completedTasks.reduce((sum, t) => {
    const time = (t.completedAt!.getTime() - t.createdAt.getTime()) / 1000; // in seconds
    return sum + time;
  }, 0);

  return totalTime / completedTasks.length;
}

function calculatePhotoComplianceRate(tasks: Task[]): number {
  const tasksWithPhotoReqs = tasks.filter((t) => t.photoRequirements > 0);
  if (tasksWithPhotoReqs.length === 0) return 100;

  const compliant = tasksWithPhotoReqs.filter((t) => t.photosAttached >= t.photoRequirements).length;
  return (compliant / tasksWithPhotoReqs.length) * 100;
}

function groupTasksByStatus(tasks: Task[]): Record<string, number> {
  return {
    pending: tasks.filter((t) => t.status === 'pending').length,
    in_progress: tasks.filter((t) => t.status === 'in_progress').length,
    completed: tasks.filter((t) => t.status === 'completed').length,
  };
}

function groupTasksByPriority(tasks: Task[]): Record<string, number> {
  return {
    urgent: tasks.filter((t) => t.priority === 'urgent').length,
    high: tasks.filter((t) => t.priority === 'high').length,
    medium: tasks.filter((t) => t.priority === 'medium').length,
    low: tasks.filter((t) => t.priority === 'low').length,
  };
}

function groupTasksByType(tasks: Task[]): Record<string, number> {
  const distribution: Record<string, number> = {};
  tasks.forEach((t) => {
    distribution[t.taskType] = (distribution[t.taskType] || 0) + 1;
  });
  return distribution;
}

describe('Task Performance Analytics', () => {
  const mockTasks: Task[] = [
    {
      id: 'task-1',
      status: 'completed',
      priority: 'high',
      taskType: 'irrigation',
      dueDate: new Date(Date.now() - 86400000), // 1 day ago
      createdAt: new Date(Date.now() - 172800000), // 2 days ago
      completedAt: new Date(Date.now() - 3600000), // 1 hour ago
      photoRequirements: 2,
      photosAttached: 2,
    },
    {
      id: 'task-2',
      status: 'in_progress',
      priority: 'medium',
      taskType: 'soil_testing',
      dueDate: new Date(Date.now() + 86400000), // 1 day from now
      createdAt: new Date(Date.now() - 86400000), // 1 day ago
      photoRequirements: 1,
      photosAttached: 0,
    },
    {
      id: 'task-3',
      status: 'pending',
      priority: 'low',
      taskType: 'pest_control',
      dueDate: new Date(Date.now() + 172800000), // 2 days from now
      createdAt: new Date(Date.now() - 43200000), // 12 hours ago
      photoRequirements: 3,
      photosAttached: 0,
    },
    {
      id: 'task-4',
      status: 'pending',
      priority: 'urgent',
      taskType: 'monitoring',
      dueDate: new Date(Date.now() - 86400000), // 1 day ago (overdue)
      createdAt: new Date(Date.now() - 259200000), // 3 days ago
      photoRequirements: 1,
      photosAttached: 0,
    },
  ];

  it('should calculate completion rate correctly', () => {
    const rate = calculateCompletionRate(mockTasks);
    expect(rate).toBe(25); // 1 out of 4 tasks completed
  });

  it('should identify overdue tasks', () => {
    const overdue = identifyOverdueTasks(mockTasks);
    expect(overdue.length).toBe(1); // Only task-4 is overdue
    expect(overdue[0].id).toBe('task-4');
  });

  it('should calculate average completion time', () => {
    const avgTime = calculateAverageCompletionTime(mockTasks);
    expect(avgTime).toBeGreaterThan(0);
    expect(typeof avgTime).toBe('number');
  });

  it('should return 0 average time when no completed tasks', () => {
    const tasksWithoutCompleted = mockTasks.filter((t) => t.status !== 'completed');
    const avgTime = calculateAverageCompletionTime(tasksWithoutCompleted);
    expect(avgTime).toBe(0);
  });

  it('should calculate photo compliance rate', () => {
    const rate = calculatePhotoComplianceRate(mockTasks);
    expect(rate).toBe(25); // 1 out of 4 tasks meets photo requirements
  });

  it('should return 100% compliance when no photo requirements', () => {
    const tasksNoPhotoReqs = mockTasks.map((t) => ({ ...t, photoRequirements: 0 }));
    const rate = calculatePhotoComplianceRate(tasksNoPhotoReqs);
    expect(rate).toBe(100);
  });

  it('should group tasks by status correctly', () => {
    const grouped = groupTasksByStatus(mockTasks);
    expect(grouped.pending).toBe(2);
    expect(grouped.in_progress).toBe(1);
    expect(grouped.completed).toBe(1);
  });

  it('should group tasks by priority correctly', () => {
    const grouped = groupTasksByPriority(mockTasks);
    expect(grouped.urgent).toBe(1);
    expect(grouped.high).toBe(1);
    expect(grouped.medium).toBe(1);
    expect(grouped.low).toBe(1);
  });

  it('should group tasks by type correctly', () => {
    const grouped = groupTasksByType(mockTasks);
    expect(grouped['irrigation']).toBe(1);
    expect(grouped['soil_testing']).toBe(1);
    expect(grouped['pest_control']).toBe(1);
    expect(grouped['monitoring']).toBe(1);
  });

  it('should handle empty task list', () => {
    const emptyTasks: Task[] = [];
    expect(calculateCompletionRate(emptyTasks)).toBe(0);
    expect(identifyOverdueTasks(emptyTasks)).toHaveLength(0);
    expect(calculateAverageCompletionTime(emptyTasks)).toBe(0);
    expect(calculatePhotoComplianceRate(emptyTasks)).toBe(100);
  });

  it('should calculate efficiency score', () => {
    const completionRate = calculateCompletionRate(mockTasks);
    const complianceRate = calculatePhotoComplianceRate(mockTasks);
    const efficiencyScore = Math.round((completionRate * complianceRate) / 100);

    expect(efficiencyScore).toBeGreaterThanOrEqual(0);
    expect(efficiencyScore).toBeLessThanOrEqual(100);
  });

  it('should track worker productivity metrics', () => {
    const stats = {
      tasksCompleted: mockTasks.filter((t) => t.status === 'completed').length,
      tasksInProgress: mockTasks.filter((t) => t.status === 'in_progress').length,
      tasksPending: mockTasks.filter((t) => t.status === 'pending').length,
    };

    expect(stats.tasksCompleted).toBe(1);
    expect(stats.tasksInProgress).toBe(1);
    expect(stats.tasksPending).toBe(2);
    expect(stats.tasksCompleted + stats.tasksInProgress + stats.tasksPending).toBe(4);
  });
});
