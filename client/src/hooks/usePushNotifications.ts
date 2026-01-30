import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export interface NotificationPreferences {
  enabled: boolean;
  soilMoisture: boolean;
  temperature: boolean;
  humidity: boolean;
  criticalOnly: boolean;
  minThreshold: number;
  maxThreshold: number;
}

export function usePushNotifications() {
  const [supported, setSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    enabled: false,
    soilMoisture: true,
    temperature: true,
    humidity: true,
    criticalOnly: false,
    minThreshold: 20,
    maxThreshold: 80,
  });

  // Check browser support
  useEffect(() => {
    const isSupported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    setSupported(isSupported);

    if (isSupported) {
      checkSubscription();
      loadPreferences();
    }
  }, []);

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.getSubscription();
      setSubscription(sub);
    } catch (error) {
      console.error("Error checking subscription:", error);
    }
  };

  const loadPreferences = () => {
    const stored = localStorage.getItem("notificationPreferences");
    if (stored) {
      try {
        setPreferences(JSON.parse(stored));
      } catch (error) {
        console.error("Error loading preferences:", error);
      }
    }
  };

  const requestPermission = async () => {
    try {
      if (Notification.permission === "granted") {
        return true;
      }

      if (Notification.permission !== "denied") {
        const permission = await Notification.requestPermission();
        return permission === "granted";
      }

      return false;
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
    }
  };

  const subscribe = async () => {
    try {
      const hasPermission = await requestPermission();
      if (!hasPermission) {
        toast.error("Notification permission denied");
        return false;
      }

      const registration = await navigator.serviceWorker.ready;
      const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;

      if (!vapidKey) {
        toast.error("Push notifications not configured");
        return false;
      }

      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
      });

      setSubscription(sub);
      localStorage.setItem("pushSubscription", JSON.stringify(sub));
      toast.success("Push notifications enabled!");
      return true;
    } catch (error) {
      console.error("Error subscribing to push:", error);
      toast.error("Failed to enable push notifications");
      return false;
    }
  };

  const unsubscribe = async () => {
    try {
      if (subscription) {
        await subscription.unsubscribe();
        setSubscription(null);
        localStorage.removeItem("pushSubscription");
        toast.success("Push notifications disabled");
        return true;
      }
    } catch (error) {
      console.error("Error unsubscribing:", error);
      toast.error("Failed to disable push notifications");
      return false;
    }
  };

  const updatePreferences = (newPreferences: Partial<NotificationPreferences>) => {
    const updated = { ...preferences, ...newPreferences };
    setPreferences(updated);
    localStorage.setItem("notificationPreferences", JSON.stringify(updated));
  };

  const sendTestNotification = () => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.controller?.postMessage({
        type: "SEND_TEST_NOTIFICATION",
        title: "Test Notification",
        options: {
          body: "This is a test push notification from FarmKonnect",
          icon: "/icon-192x192.png",
          badge: "/badge-72x72.png",
        },
      });
    }
  };

  return {
    supported,
    subscription,
    preferences,
    subscribe,
    unsubscribe,
    updatePreferences,
    sendTestNotification,
    isSubscribed: !!subscription,
  };
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): BufferSource {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer as BufferSource;
}
