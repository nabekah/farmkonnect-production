import { useEffect, useState } from 'react';
import { useWebSocket, WebSocketMessage } from '@/hooks/useWebSocket';
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';

interface ToastNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  timestamp: string;
}

export function RealtimeToast() {
  const { lastMessage, isConnected } = useWebSocket();
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);

  useEffect(() => {
    if (lastMessage && lastMessage.type !== 'connected' && lastMessage.type !== 'pong') {
      // Add new notification
      const notification: ToastNotification = {
        id: Date.now().toString(),
        type: lastMessage.type,
        title: lastMessage.title || 'Notification',
        message: lastMessage.message || '',
        severity: lastMessage.severity || 'info',
        timestamp: lastMessage.timestamp || new Date().toISOString(),
      };

      setNotifications(prev => [notification, ...prev].slice(0, 5)); // Keep last 5

      // Auto-remove after 10 seconds
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== notification.id));
      }, 10000);

      // Play sound for critical alerts
      if (notification.severity === 'critical') {
        playAlertSound();
      }
    }
  }, [lastMessage]);

  const playAlertSound = () => {
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZUQ0PVqzn77BdGAg+ltryxnMpBSuAzvLZiTYIGGe77OmfTRAMUKXi8LdjHAY4kdfy0HotBSR3x/DdkEAKFF604+yoVRQKRp/g8r5sIQUxh9Hz04IzBh5uwO/jmVENEFas5++wXRgIPpba8sZzKQUrgM7y2Yk2CBhnu+zpn00QDFA=');
      audio.volume = 0.3;
      audio.play().catch(() => {});
    } catch (e) {}
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />;
      default:
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 border-red-200 text-red-900';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-900';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-900';
      default:
        return 'bg-green-50 border-green-200 text-green-900';
    }
  };

  return (
    <>
      {/* Connection status indicator */}
      <div className="fixed bottom-4 left-4 z-50">
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
          isConnected ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-50 text-gray-700 border border-gray-200'
        }`}>
          <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
          <span>{isConnected ? 'Live' : 'Offline'}</span>
        </div>
      </div>

      {/* Toast notifications */}
      <div className="fixed top-20 right-4 z-50 space-y-2 max-w-md">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-4 rounded-lg border-2 shadow-lg animate-in slide-in-from-right ${getSeverityColor(notification.severity)}`}
          >
            <div className="flex items-start gap-3">
              {getSeverityIcon(notification.severity)}
              <div className="flex-1">
                <h4 className="font-semibold mb-1">{notification.title}</h4>
                <p className="text-sm opacity-90">{notification.message}</p>
                <p className="text-xs opacity-70 mt-2">
                  {new Date(notification.timestamp).toLocaleTimeString()}
                </p>
              </div>
              <button
                onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
                className="text-current opacity-50 hover:opacity-100"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
