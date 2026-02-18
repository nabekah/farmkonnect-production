import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Lock, Shield, Smartphone, MapPin, Clock, Trash2, CheckCircle, XCircle } from "lucide-react";

interface LoginSession {
  id: string;
  deviceIdentifier: string;
  deviceType: "Desktop" | "Mobile" | "Tablet";
  location: string;
  ipAddress: string;
  loginTime: Date;
  isTrusted: boolean;
}

interface TrustedDevice {
  id: string;
  identifier: string;
  type: "Desktop" | "Mobile" | "Tablet";
  lastUsedAt: Date;
  createdAt: Date;
}

interface SecurityAlert {
  id: string;
  type: "login" | "failed_attempt" | "unusual_activity" | "device_change";
  severity: "low" | "medium" | "high";
  message: string;
  timestamp: Date;
  resolved: boolean;
}

export function SecurityDashboard() {
  const [loginSessions, setLoginSessions] = useState<LoginSession[]>([]);
  const [trustedDevices, setTrustedDevices] = useState<TrustedDevice[]>([]);
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load security data
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    setLoading(true);
    try {
      // Mock data - replace with actual API calls
      setLoginSessions([
        {
          id: "session_1",
          deviceIdentifier: "Chrome on Windows",
          deviceType: "Desktop",
          location: "New York, USA",
          ipAddress: "192.168.1.1",
          loginTime: new Date(),
          isTrusted: true,
        },
        {
          id: "session_2",
          deviceIdentifier: "Safari on iPhone",
          deviceType: "Mobile",
          location: "San Francisco, USA",
          ipAddress: "203.0.113.45",
          loginTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
          isTrusted: false,
        },
      ]);

      setTrustedDevices([
        {
          id: "device_1",
          identifier: "Chrome on Windows",
          type: "Desktop",
          lastUsedAt: new Date(),
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      ]);

      setSecurityAlerts([
        {
          id: "alert_1",
          type: "login",
          severity: "low",
          message: "New login from Chrome on Windows in New York, USA",
          timestamp: new Date(),
          resolved: false,
        },
        {
          id: "alert_2",
          type: "failed_attempt",
          severity: "medium",
          message: "3 failed login attempts detected",
          timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
          resolved: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveDevice = (deviceId: string) => {
    setTrustedDevices(trustedDevices.filter((d) => d.id !== deviceId));
  };

  const handleSignOutSession = (sessionId: string) => {
    setLoginSessions(loginSessions.filter((s) => s.id !== sessionId));
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "destructive";
      case "medium":
        return "warning";
      case "low":
      default:
        return "secondary";
    }
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case "Mobile":
        return <Smartphone className="h-4 w-4" />;
      case "Tablet":
        return <Smartphone className="h-4 w-4" />;
      default:
        return <Lock className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Security Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loginSessions.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Devices currently logged in</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Trusted Devices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trustedDevices.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Skip 2FA on these devices</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Security Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{securityAlerts.filter((a) => !a.resolved).length}</div>
            <p className="text-xs text-muted-foreground mt-1">Unresolved alerts</p>
          </CardContent>
        </Card>
      </div>

      {/* Security Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Recent Security Alerts
          </CardTitle>
          <CardDescription>Monitor suspicious activity on your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {securityAlerts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No security alerts</p>
          ) : (
            securityAlerts.map((alert) => (
              <div key={alert.id} className="flex items-start gap-4 p-3 border rounded-lg">
                <div className="mt-1">
                  {alert.resolved ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{alert.message}</p>
                    <Badge variant={getSeverityColor(alert.severity)}>{alert.severity}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    <Clock className="h-3 w-3 inline mr-1" />
                    {alert.timestamp.toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Active Sessions
          </CardTitle>
          <CardDescription>Manage your active login sessions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loginSessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active sessions</p>
          ) : (
            loginSessions.map((session) => (
              <div key={session.id} className="flex items-start justify-between p-3 border rounded-lg">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="mt-1">{getDeviceIcon(session.deviceType)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{session.deviceIdentifier}</p>
                      {session.isTrusted && <Badge variant="outline">Trusted</Badge>}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {session.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {session.loginTime.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">IP: {session.ipAddress}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSignOutSession(session.id)}
                  className="ml-2"
                >
                  Sign Out
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Trusted Devices */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Trusted Devices
          </CardTitle>
          <CardDescription>Devices that can skip 2FA verification</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {trustedDevices.length === 0 ? (
            <p className="text-sm text-muted-foreground">No trusted devices</p>
          ) : (
            trustedDevices.map((device) => (
              <div key={device.id} className="flex items-start justify-between p-3 border rounded-lg">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="mt-1">{getDeviceIcon(device.type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{device.identifier}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Last used: {device.lastUsedAt.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Added: {device.createdAt.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveDevice(device.id)}
                  className="ml-2 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Security Recommendations */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Security Tips:</strong> Enable 2FA, use strong passwords, review trusted devices regularly, and sign out from unfamiliar locations.
        </AlertDescription>
      </Alert>
    </div>
  );
}
