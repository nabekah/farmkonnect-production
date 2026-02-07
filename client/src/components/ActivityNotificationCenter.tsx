import { useEffect, useState } from 'react';
import { Bell, X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  notificationManager,
  ActivityNotification,
} from '@/lib/activityNotifications';

const notificationIcons: Record<string, React.ReactNode> = {
  submitted: <Info className="h-4 w-4 text-blue-500" />,
  approved: <CheckCircle className="h-4 w-4 text-green-500" />,
  rejected: <AlertCircle className="h-4 w-4 text-red-500" />,
  updated: <Info className="h-4 w-4 text-blue-500" />,
  alert: <AlertCircle className="h-4 w-4 text-yellow-500" />,
};

export function ActivityNotificationCenter() {
  const [notifications, setNotifications] = useState<ActivityNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Subscribe to notification updates
    const unsubscribe = notificationManager.subscribe((updatedNotifications) => {
      setNotifications(updatedNotifications);
    });

    // Initialize with current notifications
    setNotifications(notificationManager.getNotifications());

    return unsubscribe;
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAsRead = (notificationId: string) => {
    notificationManager.markAsRead(notificationId);
  };

  const handleDelete = (notificationId: string) => {
    notificationManager.deleteNotification(notificationId);
  };

  const handleMarkAllAsRead = () => {
    notificationManager.markAllAsRead();
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="text-xs"
              >
                Mark all as read
              </Button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg border transition-colors ${
                    notification.read
                      ? 'bg-muted border-border'
                      : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {notificationIcons[notification.type]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{notification.title}</p>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(notification.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="h-6 w-6 p-0"
                        >
                          ✓
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(notification.id)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
