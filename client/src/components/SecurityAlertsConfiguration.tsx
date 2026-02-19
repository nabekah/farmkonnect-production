import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { AlertCircle, Bell, Lock, Smartphone, MapPin, Zap } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/contexts/ToastContext";

export function SecurityAlertsConfiguration() {
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);

  const preferencesQuery = trpc.securityManagement.getAlertPreferences.useQuery();
  const updateMutation = trpc.securityManagement.updateAlertPreference.useMutation();

  const preferences = preferencesQuery.data || [];

  const handleToggle = async (eventType: string, enabled: boolean) => {
    setSaving(true);
    try {
      await updateMutation.mutateAsync({
        eventType: eventType as any,
        enabled,
      });

      showToast({
        type: "success",
        title: "Updated",
        message: "Alert preference saved",
      });

      preferencesQuery.refetch();
    } catch (error: any) {
      showToast({
        type: "error",
        title: "Error",
        message: error.message || "Failed to update preference",
      });
    } finally {
      setSaving(false);
    }
  };

  const getPreference = (eventType: string) => {
    return preferences.find((p) => p.eventType === eventType)?.enabled ?? true;
  };

  const alertTypes = [
    {
      id: "ACCOUNT_LOCKED",
      title: "Account Locked",
      description: "Notified when your account is locked due to failed login attempts",
      icon: Lock,
      severity: "critical",
    },
    {
      id: "MULTIPLE_FAILED_LOGINS",
      title: "Multiple Failed Logins",
      description: "Notified when multiple failed login attempts are detected",
      icon: AlertCircle,
      severity: "high",
    },
    {
      id: "2FA_DISABLED",
      title: "2FA Disabled",
      description: "Notified when two-factor authentication is disabled",
      icon: Smartphone,
      severity: "critical",
    },
    {
      id: "PASSWORD_CHANGED",
      title: "Password Changed",
      description: "Notified when your password is changed",
      icon: Lock,
      severity: "medium",
    },
    {
      id: "SUSPICIOUS_LOGIN",
      title: "Suspicious Login",
      description: "Notified when login from unusual location or device is detected",
      icon: MapPin,
      severity: "high",
    },
    {
      id: "NEW_DEVICE_LOGIN",
      title: "New Device Login",
      description: "Notified when your account is accessed from a new device",
      icon: Smartphone,
      severity: "medium",
    },
    {
      id: "RATE_LIMIT_EXCEEDED",
      title: "Rate Limit Exceeded",
      description: "Notified when rate limit is exceeded",
      icon: Zap,
      severity: "high",
    },
    {
      id: "SECURITY_BREACH",
      title: "Security Breach",
      description: "Notified of any security incidents affecting your account",
      icon: AlertCircle,
      severity: "critical",
    },
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-50 border-red-200";
      case "high":
        return "bg-orange-50 border-orange-200";
      case "medium":
        return "bg-yellow-50 border-yellow-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Security Alerts</h2>
        <p className="text-gray-600 text-sm mt-1">Configure which security events trigger email notifications</p>
      </div>

      {/* Info Box */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Bell className="w-5 h-5" />
            Email Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-900">
          <p>
            We'll send security alerts to your registered email address. These notifications help you stay informed about
            important account activity and potential security threats.
          </p>
        </CardContent>
      </Card>

      {/* Alert Types */}
      <div className="space-y-3">
        {alertTypes.map((alert) => {
          const Icon = alert.icon;
          const isEnabled = getPreference(alert.id);

          return (
            <Card key={alert.id} className={`border ${getSeverityColor(alert.severity)}`}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <Icon className="w-5 h-5 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{alert.title}</h3>
                        <span className={`text-xs px-2 py-1 rounded ${getSeverityBadgeColor(alert.severity)}`}>
                          {alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{alert.description}</p>
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isEnabled}
                        onChange={(e) => handleToggle(alert.id, e.target.checked)}
                        disabled={saving}
                        className="rounded"
                      />
                      <span className="text-sm font-semibold">{isEnabled ? "On" : "Off"}</span>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Best Practices */}
      <Card>
        <CardHeader>
          <CardTitle>Security Best Practices</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex gap-3">
            <div className="text-green-600 font-bold">✓</div>
            <div>
              <p className="font-semibold">Enable Critical Alerts</p>
              <p className="text-gray-600">Keep critical alerts enabled to be notified of account lockouts and 2FA changes</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="text-green-600 font-bold">✓</div>
            <div>
              <p className="font-semibold">Monitor Suspicious Activity</p>
              <p className="text-gray-600">Enable suspicious login and new device alerts to catch unauthorized access early</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="text-green-600 font-bold">✓</div>
            <div>
              <p className="font-semibold">Check Your Email</p>
              <p className="text-gray-600">Make sure your email account is secure and you check it regularly for alerts</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="text-green-600 font-bold">✓</div>
            <div>
              <p className="font-semibold">Act Quickly</p>
              <p className="text-gray-600">If you receive an alert for activity you didn't perform, change your password immediately</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alert Throttling Info */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-900">
            <AlertCircle className="w-5 h-5" />
            Alert Throttling
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-yellow-900">
          <p>
            To prevent alert spam, we limit notifications for the same event type to one per 5 minutes. This helps ensure
            you receive important alerts without being overwhelmed.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
