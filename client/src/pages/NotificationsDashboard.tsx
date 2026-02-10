import React, { useState, useEffect } from 'react';
import { Bell, X, Check, Trash2, Settings, Filter, Clock, AlertCircle, TrendingUp, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';

interface Notification {
  id: number;
  title: string;
  body: string;
  type: 'alert' | 'health' | 'market' | 'recommendation' | 'community';
  severity: 'critical' | 'warning' | 'info';
  timestamp: number;
  read: boolean;
  data?: Record<string, any>;
}

export default function NotificationsDashboard() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  // Fetch notification history
  const { data: notificationHistory, isLoading } = trpc.pushNotifications.getNotificationHistory.useQuery({
    limit: 50,
    offset: 0,
  });

  // Get unread count
  const { data: unreadData } = trpc.pushNotifications.getUnreadCount.useQuery();

  // Get preferences
  const { data: preferencesData } = trpc.pushNotifications.getPreferences.useQuery();

  // Real-time updates
  const { notifications: realtimeNotifications } = useRealtimeUpdates();

  useEffect(() => {
    if (notificationHistory?.notifications) {
      setNotifications(notificationHistory.notifications);
    }
  }, [notificationHistory]);

  // Add real-time notifications
  useEffect(() => {
    if (realtimeNotifications && realtimeNotifications.length > 0) {
      setNotifications((prev) => [
        ...realtimeNotifications.map((n: any) => ({
          ...n,
          read: false,
        })),
        ...prev,
      ]);
    }
  }, [realtimeNotifications]);

  const markAsRead = async (notificationId: number) => {
    try {
      await trpc.pushNotifications.markAsRead.mutate({ notificationId });
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const deleteNotification = async (notificationId: number) => {
    try {
      await trpc.pushNotifications.deleteNotification.mutate({ notificationId });
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !n.read;
    return n.type === filter;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getNotificationIcon = (type: string) => {
    const icons: Record<string, any> = {
      alert: AlertCircle,
      health: AlertCircle,
      market: TrendingUp,
      recommendation: Bell,
      community: Users,
    };
    return icons[type] || Bell;
  };

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      critical: 'bg-red-100 text-red-800 border-red-300',
      warning: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      info: 'bg-blue-100 text-blue-800 border-blue-300',
    };
    return colors[severity] || 'bg-gray-100 text-gray-800';
  };

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600 mt-1">Stay updated with farm alerts and updates</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{unreadCount}</div>
              <p className="text-sm text-gray-600">Unread</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {notifications.filter((n) => n.severity === 'critical').length}
              </div>
              <p className="text-sm text-gray-600">Critical</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {notifications.filter((n) => n.severity === 'warning').length}
              </div>
              <p className="text-sm text-gray-600">Warnings</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{notifications.length}</div>
              <p className="text-sm text-gray-600">Total</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">Unread ({unreadCount})</TabsTrigger>
          <TabsTrigger value="alert">Alerts</TabsTrigger>
          <TabsTrigger value="market">Market</TabsTrigger>
          <TabsTrigger value="community">Community</TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-gray-500">Loading notifications...</div>
            </div>
          ) : filteredNotifications.length > 0 ? (
            <div className="space-y-3">
              {filteredNotifications.map((notification) => {
                const Icon = getNotificationIcon(notification.type);
                return (
                  <Card
                    key={notification.id}
                    className={`cursor-pointer transition ${
                      !notification.read ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                    onClick={() => setSelectedNotification(notification)}
                  >
                    <CardContent className="pt-6">
                      <div className="flex gap-4">
                        {/* Icon */}
                        <div
                          className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            notification.severity === 'critical'
                              ? 'bg-red-100'
                              : notification.severity === 'warning'
                              ? 'bg-yellow-100'
                              : 'bg-blue-100'
                          }`}
                        >
                          <Icon
                            className={`w-6 h-6 ${
                              notification.severity === 'critical'
                                ? 'text-red-600'
                                : notification.severity === 'warning'
                                ? 'text-yellow-600'
                                : 'text-blue-600'
                            }`}
                          />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                              <p className="text-sm text-gray-600 mt-1">{notification.body}</p>
                            </div>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-2"></div>
                            )}
                          </div>

                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={getSeverityColor(notification.severity)}>
                                {notification.severity}
                              </Badge>
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatTime(notification.timestamp)}
                              </span>
                            </div>

                            <div className="flex gap-2">
                              {!notification.read && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markAsRead(notification.id);
                                  }}
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotification(notification.id);
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No notifications</h3>
              <p className="text-gray-600 mt-1">You're all caught up!</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Notification Preferences */}
      {preferencesData && (
        <Card>
          <CardHeader>
            <CardTitle>Notification Preferences</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-900">Weather Alerts</label>
                <input type="checkbox" defaultChecked={preferencesData.preferences?.weatherAlerts} />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-900">Health Alerts</label>
                <input type="checkbox" defaultChecked={preferencesData.preferences?.healthAlerts} />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-900">Market Updates</label>
                <input type="checkbox" defaultChecked={preferencesData.preferences?.marketUpdates} />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-900">Crop Recommendations</label>
                <input type="checkbox" defaultChecked={preferencesData.preferences?.cropRecommendations} />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-900">Community Updates</label>
                <input type="checkbox" defaultChecked={preferencesData.preferences?.communityUpdates} />
              </div>
            </div>
            <Button className="w-full mt-6">Save Preferences</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
