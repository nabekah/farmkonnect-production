/**
 * Real-time notification system for field worker events
 * Handles task assignments, activity approvals, and urgent alerts
 */

export type NotificationType = 'task_assigned' | 'activity_approved' | 'urgent_alert' | 'weather_alert' | 'equipment_alert';

export interface FieldWorkerNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  farmId: number;
  workerId: number;
  taskId?: number;
  activityId?: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  read: boolean;
  createdAt: Date;
  actionUrl?: string;
  actionLabel?: string;
}

/**
 * Create notification for task assignment
 */
export function createTaskAssignmentNotification(
  taskId: number,
  taskTitle: string,
  assignedBy: string,
  farmId: number,
  workerId: number,
  priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium'
): FieldWorkerNotification {
  return {
    id: `task_${taskId}_${Date.now()}`,
    type: 'task_assigned',
    title: 'New Task Assigned',
    message: `${assignedBy} assigned you: "${taskTitle}"`,
    farmId,
    workerId,
    taskId,
    priority,
    read: false,
    createdAt: new Date(),
    actionUrl: `/field-worker/tasks/${taskId}`,
    actionLabel: 'View Task',
  };
}

/**
 * Create notification for activity approval
 */
export function createActivityApprovalNotification(
  activityId: number,
  activityTitle: string,
  approvedBy: string,
  farmId: number,
  workerId: number,
  approved: boolean
): FieldWorkerNotification {
  return {
    id: `activity_${activityId}_${Date.now()}`,
    type: 'activity_approved',
    title: approved ? 'Activity Approved' : 'Activity Rejected',
    message: `${approvedBy} ${approved ? 'approved' : 'rejected'} your activity: "${activityTitle}"`,
    farmId,
    workerId,
    activityId,
    priority: approved ? 'low' : 'high',
    read: false,
    createdAt: new Date(),
    actionUrl: `/field-worker/activities/${activityId}`,
    actionLabel: 'View Activity',
  };
}

/**
 * Create urgent alert notification
 */
export function createUrgentAlertNotification(
  title: string,
  message: string,
  farmId: number,
  workerId: number,
  alertType: 'pest' | 'disease' | 'weather' | 'equipment' = 'pest'
): FieldWorkerNotification {
  return {
    id: `alert_${alertType}_${Date.now()}`,
    type: 'urgent_alert',
    title,
    message,
    farmId,
    workerId,
    priority: 'urgent',
    read: false,
    createdAt: new Date(),
  };
}

/**
 * Create weather alert notification
 */
export function createWeatherAlertNotification(
  weatherCondition: string,
  recommendation: string,
  farmId: number,
  workerId: number
): FieldWorkerNotification {
  return {
    id: `weather_${Date.now()}`,
    type: 'weather_alert',
    title: 'Weather Alert',
    message: `${weatherCondition}: ${recommendation}`,
    farmId,
    workerId,
    priority: 'high',
    read: false,
    createdAt: new Date(),
  };
}

/**
 * Create equipment alert notification
 */
export function createEquipmentAlertNotification(
  equipmentName: string,
  issue: string,
  farmId: number,
  workerId: number
): FieldWorkerNotification {
  return {
    id: `equipment_${Date.now()}`,
    type: 'equipment_alert',
    title: 'Equipment Alert',
    message: `${equipmentName}: ${issue}`,
    farmId,
    workerId,
    priority: 'medium',
    read: false,
    createdAt: new Date(),
  };
}

/**
 * Format notification for display
 */
export function formatNotificationTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

/**
 * Get notification icon based on type
 */
export function getNotificationIcon(type: NotificationType): string {
  switch (type) {
    case 'task_assigned':
      return '📋';
    case 'activity_approved':
      return '✅';
    case 'urgent_alert':
      return '⚠️';
    case 'weather_alert':
      return '🌤️';
    case 'equipment_alert':
      return '🔧';
    default:
      return '📢';
  }
}

/**
 * Get notification color based on priority
 */
export function getNotificationColor(priority: string): string {
  switch (priority) {
    case 'urgent':
      return 'bg-red-500';
    case 'high':
      return 'bg-orange-500';
    case 'medium':
      return 'bg-yellow-500';
    case 'low':
      return 'bg-blue-500';
    default:
      return 'bg-gray-500';
  }
}

/**
 * Store notification in localStorage
 */
export function storeNotification(notification: FieldWorkerNotification): void {
  const key = `notifications_${notification.workerId}`;
  const existing = localStorage.getItem(key);
  const notifications = existing ? JSON.parse(existing) : [];
  notifications.push({
    ...notification,
    createdAt: notification.createdAt.toISOString(),
  });
  localStorage.setItem(key, JSON.stringify(notifications));
}

/**
 * Retrieve notifications from localStorage
 */
export function getStoredNotifications(workerId: number): FieldWorkerNotification[] {
  const key = `notifications_${workerId}`;
  const stored = localStorage.getItem(key);
  if (!stored) return [];

  return JSON.parse(stored).map((n: any) => ({
    ...n,
    createdAt: new Date(n.createdAt),
  }));
}

/**
 * Clear notifications from localStorage
 */
export function clearStoredNotifications(workerId: number): void {
  const key = `notifications_${workerId}`;
  localStorage.removeItem(key);
}
