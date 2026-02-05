import React, { useState, useEffect, useCallback } from 'react';
import { Bell, X, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  FieldWorkerNotification,
  formatNotificationTime,
  getNotificationIcon,
  getNotificationColor,
  getStoredNotifications,
  storeNotification,
} from '@/lib/fieldWorkerNotifications';

interface FieldWorkerNotificationCenterProps {
  workerId: number;
  onNotificationReceived?: (notification: FieldWorkerNotification) => void;
}

export function FieldWorkerNotificationCenter({
  workerId,
  onNotificationReceived,
}: FieldWorkerNotificationCenterProps) {
  const [notifications, setNotifications] = useState<FieldWorkerNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<FieldWorkerNotification | null>(
    null
  );

  // Load notifications from localStorage on mount
  useEffect(() => {
    const stored = getStoredNotifications(workerId);
    setNotifications(stored);
    updateUnreadCount(stored);
  }, [workerId]);

  const updateUnreadCount = useCallback((notifs: FieldWorkerNotification[]) => {
    const count = notifs.filter((n) => !n.read).length;
    setUnreadCount(count);
  }, []);

  // Simulate receiving notifications (in production, this would be WebSocket)
  useEffect(() => {
    const handleNotification = (event: CustomEvent<FieldWorkerNotification>) => {
      const notification = event.detail;
      setNotifications((prev) => [notification, ...prev]);
      updateUnreadCount([notification, ...notifications]);
      storeNotification(notification);

      if (onNotificationReceived) {
        onNotificationReceived(notification);
      }

      // Play notification sound if enabled
      playNotificationSound();
    };

    window.addEventListener(
      'fieldWorkerNotification',
      handleNotification as EventListener
    );

    return () => {
      window.removeEventListener(
        'fieldWorkerNotification',
        handleNotification as EventListener
      );
    };
  }, [notifications, updateUnreadCount, onNotificationReceived]);

  const playNotificationSound = () => {
    // Create a simple beep sound
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  const markAsRead = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
    updateUnreadCount(
      notifications.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
  };

  const dismissNotification = (notificationId: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    updateUnreadCount(notifications.filter((n) => n.id !== notificationId));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const getNotificationIcon2 = (type: string) => {
    switch (type) {
      case 'task_assigned':
        return <Clock className="h-5 w-5" />;
      case 'activity_approved':
        return <CheckCircle2 className="h-5 w-5" />;
      case 'urgent_alert':
        return <AlertCircle className="h-5 w-5" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  return (
    <>
      {/* Notification Bell Icon */}
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge
                className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-xs"
                variant="default"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-80 p-0">
          <div className="border-b p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Notifications</h3>
              {notifications.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllNotifications}
                  className="text-xs"
                >
                  Clear All
                </Button>
              )}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No notifications yet</p>
              </div>
            ) : (
              <div className="space-y-1">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                      !notification.read ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => {
                      markAsRead(notification.id);
                      setSelectedNotification(notification);
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-1 ${getNotificationColor(notification.priority)}`}>
                        {getNotificationIcon2(notification.type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-foreground">
                          {notification.title}
                        </p>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatNotificationTime(notification.createdAt)}
                        </p>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          dismissNotification(notification.id);
                        }}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Notification Detail Dialog */}
      <Dialog open={!!selectedNotification} onOpenChange={() => setSelectedNotification(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {getNotificationIcon2(selectedNotification?.type || '')}
              {selectedNotification?.title}
            </DialogTitle>
            <DialogDescription>
              {formatNotificationTime(selectedNotification?.createdAt || new Date())}
            </DialogDescription>
          </DialogHeader>

          {selectedNotification && (
            <div className="space-y-4">
              <p className="text-foreground">{selectedNotification.message}</p>

              <Badge className={getNotificationColor(selectedNotification.priority)}>
                {selectedNotification.priority}
              </Badge>

              {selectedNotification.actionUrl && (
                <Button
                  className="w-full"
                  onClick={() => {
                    window.location.href = selectedNotification.actionUrl!;
                    setSelectedNotification(null);
                  }}
                >
                  {selectedNotification.actionLabel || 'View Details'}
                </Button>
              )}

              <Button
                variant="outline"
                className="w-full"
                onClick={() => setSelectedNotification(null)}
              >
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
