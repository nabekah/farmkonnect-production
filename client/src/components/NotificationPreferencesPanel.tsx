import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { notificationSoundManager, SoundType } from "@/lib/notificationSoundManager";
import { useToast } from "@/hooks/use-toast";
import { Volume2, Bell, Music } from "lucide-react";

export function NotificationPreferencesPanel() {
  const { toast } = useToast();
  const config = notificationSoundManager.getConfig();
  
  const [soundsEnabled, setSoundsEnabled] = useState(config.enabled);
  const [volume, setVolume] = useState(config.volume * 100);
  const [soundType, setSoundType] = useState<SoundType>(config.type);
  const [notificationTypes, setNotificationTypes] = useState({
    alerts: true,
    messages: true,
    updates: true,
    reminders: true,
  });

  const handleSoundToggle = (enabled: boolean) => {
    setSoundsEnabled(enabled);
    notificationSoundManager.setConfig({ enabled });
    toast({
      title: "Notification sounds " + (enabled ? "enabled" : "disabled"),
    });
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0] / 100;
    setVolume(value[0]);
    notificationSoundManager.setVolume(newVolume);
  };

  const handleSoundTypeChange = (type: SoundType) => {
    setSoundType(type);
    notificationSoundManager.setConfig({ type });
    notificationSoundManager.playSound(type);
  };

  const handleNotificationTypeToggle = (type: keyof typeof notificationTypes) => {
    setNotificationTypes(prev => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  const soundTypes: SoundType[] = ['chime', 'bell', 'alert', 'notification', 'success', 'error'];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="w-5 h-5" />
            Sound Alerts
          </CardTitle>
          <CardDescription>Configure notification sound preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Enable notification sounds</p>
              <p className="text-sm text-gray-500">Play audio alerts for notifications</p>
            </div>
            <Switch
              checked={soundsEnabled}
              onCheckedChange={handleSoundToggle}
            />
          </div>

          {soundsEnabled && (
            <>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4" />
                  <p className="font-medium">Volume</p>
                  <span className="text-sm text-gray-500 ml-auto">{Math.round(volume)}%</span>
                </div>
                <Slider
                  value={[volume]}
                  onValueChange={handleVolumeChange}
                  min={0}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  <p className="font-medium">Sound Type</p>
                </div>
                <Select value={soundType} onValueChange={(value) => handleSoundTypeChange(value as SoundType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {soundTypes.map(type => (
                      <SelectItem key={type} value={type}>
                        <span className="capitalize">{type}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">Click to preview the selected sound</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notification Types</CardTitle>
          <CardDescription>Choose which notifications trigger alerts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(notificationTypes).map(([type, enabled]) => (
            <div key={type} className="flex items-center justify-between">
              <div>
                <p className="font-medium capitalize">{type}</p>
                <p className="text-sm text-gray-500">
                  {type === 'alerts' && 'Critical farm alerts and warnings'}
                  {type === 'messages' && 'Messages from team members'}
                  {type === 'updates' && 'System updates and maintenance'}
                  {type === 'reminders' && 'Task reminders and schedules'}
                </p>
              </div>
              <Switch
                checked={enabled}
                onCheckedChange={() => handleNotificationTypeToggle(type as keyof typeof notificationTypes)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Button
        onClick={() => {
          toast({
            title: "Preferences saved",
            description: "Your notification preferences have been updated",
          });
        }}
        className="w-full"
      >
        Save Preferences
      </Button>
    </div>
  );
}
