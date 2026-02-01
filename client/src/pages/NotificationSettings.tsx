import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Bell, Mail, MessageSquare, Smartphone, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export default function NotificationSettings() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [criticalAlerts, setCriticalAlerts] = useState(true);
  const [warningAlerts, setWarningAlerts] = useState(true);
  const [infoAlerts, setInfoAlerts] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Fetch current preferences
  const { data: preferences, isLoading } = trpc.notificationSettings.getPreferences.useQuery();

  // Update preferences mutation
  const updateMutation = trpc.notificationSettings.updatePreferences.useMutation({
    onSuccess: () => {
      setTestResult({ success: true, message: "Settings saved successfully!" });
      setTimeout(() => setTestResult(null), 3000);
    },
    onError: (error) => {
      setTestResult({ success: false, message: error.message });
      setTimeout(() => setTestResult(null), 5000);
    },
  });

  // Test notification mutation
  const testMutation = trpc.notificationSettings.sendTestNotification.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        setTestResult({ success: true, message: "Test notification sent successfully!" });
      } else {
        setTestResult({ success: false, message: result.message || "Failed to send test notification" });
      }
      setTimeout(() => setTestResult(null), 5000);
    },
    onError: (error) => {
      setTestResult({ success: false, message: error.message });
      setTimeout(() => setTestResult(null), 5000);
    },
  });

  // Load preferences when data is available
  useEffect(() => {
    if (preferences) {
      setEmailEnabled(preferences.emailEnabled);
      setSmsEnabled(preferences.smsEnabled);
      setPushEnabled(preferences.pushEnabled);
      setCriticalAlerts(preferences.criticalAlerts);
      setWarningAlerts(preferences.warningAlerts);
      setInfoAlerts(preferences.infoAlerts);
      setPhoneNumber(preferences.phoneNumber || "");
    }
  }, [preferences]);

  const handleSave = () => {
    updateMutation.mutate({
      emailEnabled,
      smsEnabled,
      pushEnabled,
      phoneNumber: phoneNumber || undefined,
      criticalAlerts,
      warningAlerts,
      infoAlerts,
    });
  };

  const handleTestNotification = (channel: 'email' | 'sms' | 'push') => {
    testMutation.mutate({ channel });
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Bell className="h-8 w-8 text-blue-600" />
          Notification Settings
        </h1>
        <p className="text-muted-foreground mt-2">
          Configure how you receive alerts and notifications from FarmKonnect
        </p>
      </div>

      {testResult && (
        <div className={`p-4 rounded-lg border-2 flex items-center gap-3 ${
          testResult.success
            ? 'bg-green-50 border-green-200 text-green-900'
            : 'bg-red-50 border-red-200 text-red-900'
        }`}>
          {testResult.success ? (
            <CheckCircle2 className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          <span>{testResult.message}</span>
        </div>
      )}

      {/* Notification Channels */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Channels</CardTitle>
          <CardDescription>
            Choose how you want to receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email Notifications */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-4">
              <Mail className="h-6 w-6 text-blue-600" />
              <div>
                <h3 className="font-semibold">Email Notifications</h3>
                <p className="text-sm text-muted-foreground">
                  Receive notifications via email
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={emailEnabled}
                onCheckedChange={setEmailEnabled}
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleTestNotification('email')}
                disabled={!emailEnabled || testMutation.isPending}
              >
                {testMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Test"}
              </Button>
            </div>
          </div>

          {/* SMS Notifications */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-4">
              <MessageSquare className="h-6 w-6 text-green-600" />
              <div>
                <h3 className="font-semibold">SMS Notifications</h3>
                <p className="text-sm text-muted-foreground">
                  Receive notifications via text message
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={smsEnabled}
                onCheckedChange={setSmsEnabled}
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleTestNotification('sms')}
                disabled={!smsEnabled || !phoneNumber || testMutation.isPending}
              >
                {testMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Test"}
              </Button>
            </div>
          </div>

          {/* Push Notifications */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-4">
              <Smartphone className="h-6 w-6 text-purple-600" />
              <div>
                <h3 className="font-semibold">Push Notifications</h3>
                <p className="text-sm text-muted-foreground">
                  Receive in-app notifications
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={pushEnabled}
                onCheckedChange={setPushEnabled}
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleTestNotification('push')}
                disabled={!pushEnabled || testMutation.isPending}
              >
                {testMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Test"}
              </Button>
            </div>
          </div>

          {/* Phone Number */}
          {smsEnabled && (
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number (for SMS)</Label>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="+1234567890"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Include country code (e.g., +233 for Ghana)
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alert Types */}
      <Card>
        <CardHeader>
          <CardTitle>Alert Types</CardTitle>
          <CardDescription>
            Choose which types of alerts you want to receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-semibold text-red-600">Critical Alerts</h3>
              <p className="text-sm text-muted-foreground">
                Urgent issues requiring immediate attention (animal health emergencies, system failures)
              </p>
            </div>
            <Switch
              checked={criticalAlerts}
              onCheckedChange={setCriticalAlerts}
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-semibold text-yellow-600">Warning Alerts</h3>
              <p className="text-sm text-muted-foreground">
                Important updates that need attention (water quality issues, low inventory)
              </p>
            </div>
            <Switch
              checked={warningAlerts}
              onCheckedChange={setWarningAlerts}
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-semibold text-blue-600">Info Alerts</h3>
              <p className="text-sm text-muted-foreground">
                General updates and notifications (task completions, reports ready)
              </p>
            </div>
            <Switch
              checked={infoAlerts}
              onCheckedChange={setInfoAlerts}
            />
          </div>
        </CardContent>
      </Card>

      {/* API Configuration Notice */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="text-yellow-900">API Configuration Required</CardTitle>
          <CardDescription className="text-yellow-800">
            To enable SMS and email notifications, configure your API keys
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-yellow-900">
          <p>
            <strong>SendGrid API Key:</strong> Required for email notifications. Get your key from{" "}
            <a href="https://sendgrid.com" target="_blank" rel="noopener noreferrer" className="underline">
              sendgrid.com
            </a>
          </p>
          <p>
            <strong>Twilio Credentials:</strong> Required for SMS notifications. Get your Account SID and Auth Token from{" "}
            <a href="https://twilio.com" target="_blank" rel="noopener noreferrer" className="underline">
              twilio.com
            </a>
          </p>
          <p className="mt-4">
            Add these environment variables to your server configuration:
          </p>
          <pre className="bg-yellow-100 p-3 rounded text-xs overflow-x-auto">
            SENDGRID_API_KEY=your_sendgrid_key_here{"\n"}
            TWILIO_ACCOUNT_SID=your_twilio_sid_here{"\n"}
            TWILIO_AUTH_TOKEN=your_twilio_token_here{"\n"}
            TWILIO_PHONE_NUMBER=your_twilio_phone_here
          </pre>
          <p className="text-xs mt-2">
            See <code>ADVANCED_FEATURES_STATUS.md</code> for detailed setup instructions.
          </p>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <Button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          size="lg"
        >
          {updateMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Saving...
            </>
          ) : (
            "Save Settings"
          )}
        </Button>
      </div>
    </div>
  );
}
