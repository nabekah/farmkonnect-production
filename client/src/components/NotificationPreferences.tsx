import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Bell, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export interface NotificationPreference {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

export interface NotificationPreferences {
  breeding: NotificationPreference;
  stock: NotificationPreference;
  weather: NotificationPreference;
  vaccination: NotificationPreference;
  harvest: NotificationPreference;
  marketplace: NotificationPreference;
  iot: NotificationPreference;
  training: NotificationPreference;
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  quietHoursEnabled: boolean;
}

interface NotificationPreferencesProps {
  preferences: NotificationPreferences;
  onSave: (preferences: NotificationPreferences) => Promise<void>;
  isSaving?: boolean;
}

export function NotificationPreferences({
  preferences,
  onSave,
  isSaving = false,
}: NotificationPreferencesProps) {
  const { toast } = useToast();
  const [localPreferences, setLocalPreferences] = useState(preferences);
  const [hasChanges, setHasChanges] = useState(false);

  const handleTogglePreference = (key: keyof NotificationPreferences) => {
    if (typeof localPreferences[key] === 'object' && localPreferences[key] !== null) {
      const pref = localPreferences[key] as NotificationPreference;
      setLocalPreferences({
        ...localPreferences,
        [key]: { ...pref, enabled: !pref.enabled },
      });
    } else {
      setLocalPreferences({
        ...localPreferences,
        [key]: !localPreferences[key],
      });
    }
    setHasChanges(true);
  };

  const handleQuietHoursChange = (field: 'start' | 'end', value: string) => {
    setLocalPreferences({
      ...localPreferences,
      [field === 'start' ? 'quietHoursStart' : 'quietHoursEnd']: value,
    });
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      await onSave(localPreferences);
      setHasChanges(false);
      toast({
        title: 'Success',
        description: 'Notification preferences saved',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save preferences',
        variant: 'destructive',
      });
    }
  };

  const handleReset = () => {
    setLocalPreferences(preferences);
    setHasChanges(false);
  };

  return (
    <div className="space-y-6">
      {/* Notification Types */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Types
          </CardTitle>
          <CardDescription>
            Choose which notifications you want to receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: 'breeding', label: 'Breeding Reminders', description: 'Get reminded about upcoming breeding dates' },
            { key: 'stock', label: 'Stock Alerts', description: 'Be notified when inventory is low' },
            { key: 'weather', label: 'Weather Alerts', description: 'Receive weather warnings and forecasts' },
            { key: 'vaccination', label: 'Vaccination Reminders', description: 'Get reminded about vaccination schedules' },
            { key: 'harvest', label: 'Harvest Reminders', description: 'Be notified when crops are ready to harvest' },
            { key: 'marketplace', label: 'Marketplace Updates', description: 'Receive order and transaction updates' },
            { key: 'iot', label: 'IoT Sensor Alerts', description: 'Get alerts from IoT devices and sensors' },
            { key: 'training', label: 'Training Reminders', description: 'Be reminded about training sessions' },
          ].map(({ key, label, description }) => (
            <div key={key} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50">
              <div className="flex-1">
                <Label className="text-base font-medium cursor-pointer">{label}</Label>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
              <Switch
                checked={(localPreferences[key as keyof NotificationPreferences] as any)?.enabled || false}
                onCheckedChange={() => handleTogglePreference(key as keyof NotificationPreferences)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Delivery Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Delivery Methods
          </CardTitle>
          <CardDescription>
            Choose how you want to receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50">
            <div>
              <Label className="text-base font-medium cursor-pointer">Push Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive notifications in your browser</p>
            </div>
            <Switch
              checked={localPreferences.pushEnabled}
              onCheckedChange={() => handleTogglePreference('pushEnabled')}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50">
            <div>
              <Label className="text-base font-medium cursor-pointer">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive notifications via email</p>
            </div>
            <Switch
              checked={localPreferences.emailEnabled}
              onCheckedChange={() => handleTogglePreference('emailEnabled')}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50">
            <div>
              <Label className="text-base font-medium cursor-pointer">SMS Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive notifications via SMS</p>
            </div>
            <Switch
              checked={localPreferences.smsEnabled}
              onCheckedChange={() => handleTogglePreference('smsEnabled')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Quiet Hours */}
      <Card>
        <CardHeader>
          <CardTitle>Quiet Hours</CardTitle>
          <CardDescription>
            Pause notifications during specific hours
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50">
            <Label className="text-base font-medium cursor-pointer">Enable Quiet Hours</Label>
            <Switch
              checked={localPreferences.quietHoursEnabled}
              onCheckedChange={() => handleTogglePreference('quietHoursEnabled')}
            />
          </div>

          {localPreferences.quietHoursEnabled && (
            <div className="grid grid-cols-2 gap-4 p-3 rounded-lg bg-muted/30">
              <div>
                <Label className="text-sm font-medium">Start Time</Label>
                <input
                  type="time"
                  value={localPreferences.quietHoursStart}
                  onChange={(e) => handleQuietHoursChange('start', e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">End Time</Label>
                <input
                  type="time"
                  value={localPreferences.quietHoursEnd}
                  onChange={(e) => handleQuietHoursChange('end', e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-lg"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-2 justify-end">
        {hasChanges && (
          <Button variant="outline" onClick={handleReset}>
            Reset
          </Button>
        )}
        <Button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className="gap-2"
        >
          <CheckCircle className="h-4 w-4" />
          {isSaving ? 'Saving...' : 'Save Preferences'}
        </Button>
      </div>
    </div>
  );
}
