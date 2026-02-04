import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useThemeColor } from "@/contexts/ThemeColorContext";
import { themeList, ThemeName } from "@/config/themes";
import { Check } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Bell, Shield, Palette, Key, Download, Copy, CheckCircle } from "lucide-react";
import { trpc } from "../lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

// Appearance Tab Component
function AppearanceTab() {
  const { currentTheme, setTheme, themeMode, setThemeMode } = useThemeColor();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Color Theme</CardTitle>
        <CardDescription>
          Choose your preferred color theme for the application
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Dark Mode Toggle */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
          <div>
            <p className="text-sm font-medium">Dark Mode</p>
            <p className="text-xs text-muted-foreground">Use system preference or toggle manually</p>
          </div>
          <button
            onClick={() => setThemeMode(themeMode === 'dark' ? 'light' : 'dark')}
            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
              themeMode === 'dark' ? 'bg-primary' : 'bg-muted-foreground/30'
            }`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                themeMode === 'dark' ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Theme Selector Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {themeList.map((theme) => (
            <button
              key={theme.name}
              onClick={() => setTheme(theme.name as ThemeName)}
              className={`relative p-4 rounded-lg border-2 transition-all ${
                currentTheme === theme.name
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              {/* Theme Color Preview */}
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-8 h-8 rounded-full border border-border"
                  style={{
                    backgroundColor: `hsl(${theme.colors.primary})`,
                  }}
                />
              </div>

              {/* Theme Label */}
              <p className="text-sm font-medium text-center">{theme.label}</p>

              {/* Check Mark */}
              {currentTheme === theme.name && (
                <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                  <Check className="w-4 h-4" />
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Theme Preview */}
        <div className="mt-8 pt-6 border-t">
          <h3 className="text-sm font-semibold mb-4">Color Theme Preview</h3>
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              <Button variant="default">Primary Button</Button>
              <Button variant="secondary">Secondary Button</Button>
              <Button variant="outline">Outline Button</Button>
            </div>
            <Card className="bg-card">
              <CardHeader>
                <CardTitle className="text-base">Card Preview</CardTitle>
                <CardDescription>This is how cards will look with the selected theme (currently {themeMode} mode)</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground">
                  Your selected theme and dark mode preference will be applied throughout the application and persisted across sessions.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// MFA Enrollment Component
function MFAEnrollmentCard() {
  const [showQR, setShowQR] = useState(false);
  const [password, setPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const utils = trpc.useUtils();

  const toast = (props: { title: string; description?: string; variant?: "default" | "destructive" }) => {
    const toastEl = document.createElement("div");
    toastEl.className = `fixed bottom-4 right-4 bg-${props.variant === "destructive" ? "red" : "green"}-600 text-white px-6 py-3 rounded-lg shadow-lg z-50`;
    toastEl.innerHTML = `<strong>${props.title}</strong>${props.description ? `<br/><span class="text-sm">${props.description}</span>` : ""}`;
    document.body.appendChild(toastEl);
    setTimeout(() => toastEl.remove(), 3000);
  };

  const { data: mfaStatus } = trpc.security.mfa.getMFAStatus.useQuery();

  const enrollMFA = trpc.security.mfa.enrollMFA.useMutation({
    onSuccess: (data) => {
      setShowQR(true);
      setBackupCodes(data.backupCodes);
      toast({ title: "MFA Enrollment Started", description: "Scan the QR code with your authenticator app" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const verifyMFA = trpc.security.mfa.verifyAndEnableMFA.useMutation({
    onSuccess: () => {
      toast({ title: "MFA Enabled", description: "Two-factor authentication is now active" });
      utils.security.mfa.getMFAStatus.invalidate();
      setShowQR(false);
      setPassword("");
      setVerificationCode("");
    },
    onError: (error) => {
      toast({ title: "Verification Failed", description: error.message, variant: "destructive" });
    },
  });

  const disableMFA = trpc.security.mfa.disableMFA.useMutation({
    onSuccess: () => {
      toast({ title: "MFA Disabled", description: "Two-factor authentication has been disabled" });
      utils.security.mfa.getMFAStatus.invalidate();
      setPassword("");
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleEnroll = () => {
    if (!password) {
      toast({ title: "Password Required", description: "Please enter your password", variant: "destructive" });
      return;
    }
    enrollMFA.mutate();
  };

  const handleVerify = () => {
    if (!verificationCode) {
      toast({ title: "Code Required", description: "Please enter the verification code", variant: "destructive" });
      return;
    }
    verifyMFA.mutate({ code: verificationCode });
  };

  const handleDisable = () => {
    if (!password) {
      toast({ title: "Password Required", description: "Please enter your password", variant: "destructive" });
      return;
    }
    if (confirm("Are you sure you want to disable MFA? This will make your account less secure.")) {
      disableMFA.mutate({ password });
    }
  };

  const downloadBackupCodes = () => {
    const blob = new Blob([backupCodes.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "farmkonnect-mfa-backup-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join("\n"));
    toast({ title: "Copied", description: "Backup codes copied to clipboard" });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Multi-Factor Authentication (MFA)
            </CardTitle>
            <CardDescription>
              Add an extra layer of security to your account with two-factor authentication
            </CardDescription>
          </div>
          {mfaStatus?.enabled && (
            <Badge variant="default" className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Enabled
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!mfaStatus?.enabled ? (
          <div className="space-y-4">
            {!showQR ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Enable MFA to protect your account with time-based one-time passwords (TOTP) using apps like Google Authenticator, Authy, or 1Password.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="mfa-password">Confirm Your Password</Label>
                  <Input
                    id="mfa-password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button onClick={handleEnroll} disabled={enrollMFA.isPending}>
                  {enrollMFA.isPending ? "Enrolling..." : "Enable MFA"}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 border rounded-lg space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Step 1: Scan QR Code</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Scan this QR code with your authenticator app:
                    </p>
                    {enrollMFA.data?.qrCodeUrl && (
                      <div className="flex justify-center p-4 bg-white rounded">
                        <img src={enrollMFA.data.qrCodeUrl} alt="MFA QR Code" className="w-48 h-48" />
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      Secret: <code className="bg-muted px-2 py-1 rounded">{enrollMFA.data?.secret}</code>
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Step 2: Save Backup Codes</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Save these backup codes in a secure location. You can use them to access your account if you lose your authenticator device.
                    </p>
                    <div className="bg-muted p-3 rounded font-mono text-sm space-y-1">
                      {backupCodes.map((code, i) => (
                        <div key={i}>{code}</div>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" variant="outline" onClick={downloadBackupCodes}>
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </Button>
                      <Button size="sm" variant="outline" onClick={copyBackupCodes}>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy
                      </Button>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Step 3: Verify</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Enter the 6-digit code from your authenticator app:
                    </p>
                    <div className="space-y-2">
                      <Input
                        placeholder="000000"
                        maxLength={6}
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                      />
                      <Button onClick={handleVerify} disabled={verifyMFA.isPending} className="w-full">
                        {verifyMFA.isPending ? "Verifying..." : "Verify and Enable MFA"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950">
              <p className="text-sm font-medium text-green-900 dark:text-green-100">
                ✓ Two-factor authentication is enabled and protecting your account
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="disable-mfa-password">Confirm Password to Disable</Label>
              <Input
                id="disable-mfa-password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button variant="destructive" onClick={handleDisable} disabled={disableMFA.isPending}>
              {disableMFA.isPending ? "Disabling..." : "Disable MFA"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Settings() {
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    // Simulate save
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">
            <User className="h-4 w-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="appearance">
            <Palette className="h-4 w-4 mr-2" />
            Appearance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal information and contact details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" defaultValue={user?.name || ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue={user?.email || ""} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" type="tel" defaultValue={user?.phone || ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Input id="role" defaultValue={user?.role || ""} disabled />
                </div>
              </div>
              <Button onClick={handleSaveProfile} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose what notifications you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Weather Alerts</p>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications for extreme weather conditions
                  </p>
                </div>
                <input type="checkbox" defaultChecked className="h-4 w-4" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Crop Updates</p>
                  <p className="text-sm text-muted-foreground">
                    Get notified about crop cycle milestones
                  </p>
                </div>
                <input type="checkbox" defaultChecked className="h-4 w-4" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Livestock Health</p>
                  <p className="text-sm text-muted-foreground">
                    Alerts for animal health events and vaccinations
                  </p>
                </div>
                <input type="checkbox" defaultChecked className="h-4 w-4" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Marketplace Orders</p>
                  <p className="text-sm text-muted-foreground">
                    Updates on your marketplace transactions
                  </p>
                </div>
                <input type="checkbox" defaultChecked className="h-4 w-4" />
              </div>
              <Button onClick={handleSaveProfile} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Preferences"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Manage your account security and authentication
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Login Method</Label>
                <Input value={user?.loginMethod || "N/A"} disabled />
              </div>
              <div className="space-y-2">
                <Label>Account Created</Label>
                <Input
                  value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                  disabled
                />
              </div>
              <div className="space-y-2">
                <Label>Last Signed In</Label>
                <Input
                  value={
                    user?.lastSignedIn ? new Date(user.lastSignedIn).toLocaleString() : "N/A"
                  }
                  disabled
                />
              </div>
            </CardContent>
          </Card>

          <MFAEnrollmentCard />
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          <AppearanceTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
