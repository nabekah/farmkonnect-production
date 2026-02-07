/**
 * Activity Notification System
 * Manages real-time notifications for activity events
 */

export type NotificationType = 'submitted' | 'approved' | 'rejected' | 'updated' | 'alert';

export interface ActivityNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  activityId?: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}

export class ActivityNotificationManager {
  private notifications: ActivityNotification[] = [];
  private listeners: ((notifications: ActivityNotification[]) => void)[] = [];

  /**
   * Add a new notification
   */
  addNotification(notification: Omit<ActivityNotification, 'id' | 'timestamp' | 'read'>) {
    const newNotification: ActivityNotification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      read: false,
    };

    this.notifications.unshift(newNotification);

    // Keep only last 50 notifications
    if (this.notifications.length > 50) {
      this.notifications = this.notifications.slice(0, 50);
    }

    this.notifyListeners();
    return newNotification;
  }

  /**
   * Mark notification as read
   */
  markAsRead(notificationId: string) {
    const notification = this.notifications.find((n) => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.notifyListeners();
    }
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead() {
    this.notifications.forEach((n) => (n.read = true));
    this.notifyListeners();
  }

  /**
   * Delete notification
   */
  deleteNotification(notificationId: string) {
    this.notifications = this.notifications.filter((n) => n.id !== notificationId);
    this.notifyListeners();
  }

  /**
   * Get all notifications
   */
  getNotifications(): ActivityNotification[] {
    return [...this.notifications];
  }

  /**
   * Get unread count
   */
  getUnreadCount(): number {
    return this.notifications.filter((n) => !n.read).length;
  }

  /**
   * Subscribe to notification changes
   */
  subscribe(listener: (notifications: ActivityNotification[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * Notify all listeners of changes
   */
  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.getNotifications()));
  }
}

// Global notification manager instance
export const notificationManager = new ActivityNotificationManager();

/**
 * Notification templates
 */
export const notificationTemplates = {
  activitySubmitted: (title: string) => ({
    type: 'submitted' as const,
    title: 'Activity Submitted',
    message: `Your activity "${title}" has been submitted for review.`,
  }),

  activityApproved: (title: string) => ({
    type: 'approved' as const,
    title: 'Activity Approved',
    message: `Your activity "${title}" has been approved.`,
  }),

  activityRejected: (title: string, reason?: string) => ({
    type: 'rejected' as const,
    title: 'Activity Rejected',
    message: `Your activity "${title}" was rejected. ${reason ? `Reason: ${reason}` : ''}`,
  }),

  activityUpdated: (title: string) => ({
    type: 'updated' as const,
    title: 'Activity Updated',
    message: `Activity "${title}" has been updated.`,
  }),

  excessiveHours: (workerName: string) => ({
    type: 'alert' as const,
    title: 'Excessive Hours Alert',
    message: `${workerName} has exceeded daily work hour limits.`,
  }),

  inactivityAlert: (workerName: string) => ({
    type: 'alert' as const,
    title: 'Inactivity Alert',
    message: `${workerName} has been inactive for an extended period.`,
  }),
};
