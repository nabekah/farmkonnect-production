import { useState } from "react";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Bell, BellOff, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function PushNotificationSettings() {
  const {
    supported,
    isSubscribed,
    preferences,
    subscribe,
    unsubscribe,
    updatePreferences,
    sendTestNotification,
  } = usePushNotifications();

  const [isLoading, setIsLoading] = useState(false);

  const handleToggleSubscription = async () => {
    setIsLoading(true);
    try {
      if (isSubscribed) {
        await unsubscribe();
      } else {
        await subscribe();
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!supported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            Push Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-3 text-sm text-muted-foreground">
            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <p>Push notifications are not supported in your browser. Please use a modern browser like Chrome, Firefox, or Edge.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Push Notifications
            </CardTitle>
            <CardDescription>Receive alerts for critical farm events</CardDescription>
          </div>
          <Badge variant={isSubscribed ? "default" : "secondary"}>
            {isSubscribed ? "Enabled" : "Disabled"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <Label htmlFor="notifications-toggle">Enable Push Notifications</Label>
          <Switch
            id="notifications-toggle"
            checked={isSubscribed}
            onCheckedChange={handleToggleSubscription}
            disabled={isLoading}
          />
        </div>

        {isSubscribed && (
          <>
            <div className="border-t pt-6 space-y-6">
              <div>
                <h3 className="font-medium mb-4">Alert Types</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="soil-moisture" className="font-normal">Soil Moisture Alerts</Label>
                    <Switch
                      id="soil-moisture"
                      checked={preferences.soilMoisture}
                      onCheckedChange={(checked) =>
                        updatePreferences({ soilMoisture: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="temperature" className="font-normal">Temperature Alerts</Label>
                    <Switch
                      id="temperature"
                      checked={preferences.temperature}
                      onCheckedChange={(checked) =>
                        updatePreferences({ temperature: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="humidity" className="font-normal">Humidity Alerts</Label>
                    <Switch
                      id="humidity"
                      checked={preferences.humidity}
                      onCheckedChange={(checked) =>
                        updatePreferences({ humidity: checked })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-6 space-y-4">
                <h3 className="font-medium">Alert Sensitivity</h3>
                <div className="space-y-2">
                  <Label htmlFor="critical-only" className="font-normal">Critical Alerts Only</Label>
                  <Switch
                    id="critical-only"
                    checked={preferences.criticalOnly}
                    onCheckedChange={(checked) =>
                      updatePreferences({ criticalOnly: checked })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Only receive notifications for critical severity alerts
                  </p>
                </div>
              </div>

              <div className="border-t pt-6 space-y-4">
                <h3 className="font-medium">Threshold Range</h3>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm">Minimum: {preferences.minThreshold}%</Label>
                    <Slider
                      value={[preferences.minThreshold]}
                      onValueChange={(value) =>
                        updatePreferences({ minThreshold: value[0] })
                      }
                      min={0}
                      max={50}
                      step={5}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Maximum: {preferences.maxThreshold}%</Label>
                    <Slider
                      value={[preferences.maxThreshold]}
                      onValueChange={(value) =>
                        updatePreferences({ maxThreshold: value[0] })
                      }
                      min={50}
                      max={100}
                      step={5}
                      className="mt-2"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <Button
                  variant="outline"
                  onClick={sendTestNotification}
                  className="w-full"
                >
                  Send Test Notification
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
