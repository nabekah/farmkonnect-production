export interface TaskNotification {
  id: string;
  taskId: string;
  workerId: string;
  type: 'approved' | 'rejected' | 'reassigned' | 'urgent';
  title: string;
  message: string;
  details?: {
    approvalNotes?: string;
    rejectionReason?: string;
    newDeadline?: Date;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
  };
  read: boolean;
  createdAt: Date;
  actionUrl?: string;
}

export interface NotificationPreferences {
  enableTaskApprovals: boolean;
  enableTaskRejections: boolean;
  enableTaskReassignments: boolean;
  enableUrgentAlerts: boolean;
  enableSoundNotifications: boolean;
  enableEmailNotifications: boolean;
  soundType: 'bell' | 'chime' | 'alert' | 'custom';
}

// In-memory notification store (in production, use database)
const notificationStore = new Map<string, TaskNotification[]>();
const preferencesStore = new Map<string, NotificationPreferences>();

export class TaskNotificationManager {
  private static readonly DEFAULT_PREFERENCES: NotificationPreferences = {
    enableTaskApprovals: true,
    enableTaskRejections: true,
    enableTaskReassignments: true,
    enableUrgentAlerts: true,
    enableSoundNotifications: true,
    enableEmailNotifications: false,
    soundType: 'bell',
  };

  static createNotification(
    taskId: string,
    workerId: string,
    type: TaskNotification['type'],
    title: string,
    message: string,
    details?: TaskNotification['details'],
    actionUrl?: string
  ): TaskNotification {
    const notification: TaskNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      taskId,
      workerId,
      type,
      title,
      message,
      details,
      read: false,
      createdAt: new Date(),
      actionUrl,
    };

    // Store notification
    if (!notificationStore.has(workerId)) {
      notificationStore.set(workerId, []);
    }
    notificationStore.get(workerId)!.push(notification);

    // Play sound if enabled
    this.playNotificationSound(workerId, type);

    // Send browser notification if supported
    this.sendBrowserNotification(title, message);

    return notification;
  }

  static getNotifications(workerId: string, limit = 50): TaskNotification[] {
    const notifications = notificationStore.get(workerId) || [];
    return notifications.slice(-limit).reverse();
  }

  static getUnreadCount(workerId: string): number {
    const notifications = notificationStore.get(workerId) || [];
    return notifications.filter((n) => !n.read).length;
  }

  static markAsRead(workerId: string, notificationId: string): void {
    const notifications = notificationStore.get(workerId);
    if (notifications) {
      const notification = notifications.find((n) => n.id === notificationId);
      if (notification) {
        notification.read = true;
      }
    }
  }

  static markAllAsRead(workerId: string): void {
    const notifications = notificationStore.get(workerId);
    if (notifications) {
      notifications.forEach((n) => {
        n.read = true;
      });
    }
  }

  static deleteNotification(workerId: string, notificationId: string): void {
    const notifications = notificationStore.get(workerId);
    if (notifications) {
      const index = notifications.findIndex((n) => n.id === notificationId);
      if (index > -1) {
        notifications.splice(index, 1);
      }
    }
  }

  static clearAllNotifications(workerId: string): void {
    notificationStore.delete(workerId);
  }

  static getPreferences(workerId: string): NotificationPreferences {
    return preferencesStore.get(workerId) || { ...this.DEFAULT_PREFERENCES };
  }

  static updatePreferences(workerId: string, preferences: Partial<NotificationPreferences>): void {
    const current = this.getPreferences(workerId);
    preferencesStore.set(workerId, { ...current, ...preferences });
  }

  private static playNotificationSound(workerId: string, type: TaskNotification['type']): void {
    const preferences = this.getPreferences(workerId);
    if (!preferences.enableSoundNotifications) return;

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Different sounds for different notification types
      const soundConfig = {
        approved: { frequency: 800, duration: 0.3 },
        rejected: { frequency: 400, duration: 0.5 },
        reassigned: { frequency: 600, duration: 0.4 },
        urgent: { frequency: 1000, duration: 0.2 },
      };

      const config = soundConfig[type];
      oscillator.frequency.value = config.frequency;
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + config.duration);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + config.duration);
    } catch (error) {
      console.warn('Could not play notification sound:', error);
    }
  }

  private static sendBrowserNotification(title: string, message: string): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body: message,
        icon: '/favicon.ico',
      });
    }
  }

  static requestNotificationPermission(): void {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }
}

// React hook for task notifications
import { useState, useEffect, useCallback } from 'react';

export function useTaskNotifications(workerId: string) {
  const [notifications, setNotifications] = useState<TaskNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Load initial notifications
    const initial = TaskNotificationManager.getNotifications(workerId);
    setNotifications(initial);
    setUnreadCount(TaskNotificationManager.getUnreadCount(workerId));

    // In production, set up WebSocket listener for real-time updates
    // For now, poll for updates
    const interval = setInterval(() => {
      const updated = TaskNotificationManager.getNotifications(workerId);
      setNotifications(updated);
      setUnreadCount(TaskNotificationManager.getUnreadCount(workerId));
    }, 5000);

    return () => clearInterval(interval);
  }, [workerId]);

  const markAsRead = useCallback(
    (notificationId: string) => {
      TaskNotificationManager.markAsRead(workerId, notificationId);
      setUnreadCount(TaskNotificationManager.getUnreadCount(workerId));
    },
    [workerId]
  );

  const markAllAsRead = useCallback(() => {
    TaskNotificationManager.markAllAsRead(workerId);
    setUnreadCount(0);
  }, [workerId]);

  const deleteNotification = useCallback(
    (notificationId: string) => {
      TaskNotificationManager.deleteNotification(workerId, notificationId);
      const updated = TaskNotificationManager.getNotifications(workerId);
      setNotifications(updated);
    },
    [workerId]
  );

  const clearAll = useCallback(() => {
    TaskNotificationManager.clearAllNotifications(workerId);
    setNotifications([]);
    setUnreadCount(0);
  }, [workerId]);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  };
}
