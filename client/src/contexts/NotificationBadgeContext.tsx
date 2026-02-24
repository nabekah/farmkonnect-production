import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

interface NotificationCounts {
  alerts: number;
  notifications: number;
  tasks: number;
  messages: number;
  total: number;
}

interface NotificationBadgeContextType {
  counts: NotificationCounts;
  incrementCount: (type: keyof Omit<NotificationCounts, 'total'>) => void;
  decrementCount: (type: keyof Omit<NotificationCounts, 'total'>) => void;
  setCount: (type: keyof Omit<NotificationCounts, 'total'>, count: number) => void;
  resetCounts: () => void;
  updateFromWebSocket: (data: Record<string, any>) => void;
}

const NotificationBadgeContext = createContext<NotificationBadgeContextType | undefined>(undefined);

export function NotificationBadgeProvider({ children }: { children: React.ReactNode }) {
  const [counts, setCounts] = useState<NotificationCounts>({
    alerts: 0,
    notifications: 0,
    tasks: 0,
    messages: 0,
    total: 0,
  });

  const updateTotal = useCallback((newCounts: Omit<NotificationCounts, 'total'>) => {
    const total = Object.values(newCounts).reduce((sum, count) => sum + count, 0);
    return { ...newCounts, total };
  }, []);

  const incrementCount = useCallback((type: keyof Omit<NotificationCounts, 'total'>) => {
    setCounts(prev => {
      const newCounts = { ...prev, [type]: prev[type] + 1 };
      return updateTotal(newCounts);
    });
  }, [updateTotal]);

  const decrementCount = useCallback((type: keyof Omit<NotificationCounts, 'total'>) => {
    setCounts(prev => {
      const newCounts = { ...prev, [type]: Math.max(0, prev[type] - 1) };
      return updateTotal(newCounts);
    });
  }, [updateTotal]);

  const setCount = useCallback((type: keyof Omit<NotificationCounts, 'total'>, count: number) => {
    setCounts(prev => {
      const newCounts = { ...prev, [type]: Math.max(0, count) };
      return updateTotal(newCounts);
    });
  }, [updateTotal]);

  const resetCounts = useCallback(() => {
    setCounts({
      alerts: 0,
      notifications: 0,
      tasks: 0,
      messages: 0,
      total: 0,
    });
  }, []);

  const updateFromWebSocket = useCallback((data: Record<string, any>) => {
    if (data.type === 'alerts_update' && data.event === 'insert') {
      incrementCount('alerts');
    } else if (data.type === 'notifications_update' && data.event === 'insert') {
      incrementCount('notifications');
    } else if (data.type === 'tasks_update' && data.event === 'insert') {
      incrementCount('tasks');
    } else if (data.type === 'database_update') {
      // Handle generic database updates
      if (data.table === 'alerts') incrementCount('alerts');
      else if (data.table === 'notifications') incrementCount('notifications');
      else if (data.table === 'tasks') incrementCount('tasks');
    }
  }, [incrementCount]);

  const value: NotificationBadgeContextType = {
    counts,
    incrementCount,
    decrementCount,
    setCount,
    resetCounts,
    updateFromWebSocket,
  };

  return (
    <NotificationBadgeContext.Provider value={value}>
      {children}
    </NotificationBadgeContext.Provider>
  );
}

export function useNotificationBadges() {
  const context = useContext(NotificationBadgeContext);
  if (!context) {
    throw new Error('useNotificationBadges must be used within NotificationBadgeProvider');
  }
  return context;
}
