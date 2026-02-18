import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Alert, AlertDescription } from "./ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { trpc } from "@/lib/trpc";
import { Copy, CheckCircle, AlertCircle, Smartphone, MessageSquare } from "lucide-react";

export function TwoFactorAuthSetup() {
  const [activeTab, setActiveTab] = useState<"totp" | "sms">("totp");
  const [totpToken, setTotpToken] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [smsOtp, setSmsOtp] = useState("");
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const setupTotpQuery = trpc.securityFeatures.setupTotp.useQuery();
  const enableTotpMutation = trpc.securityFeatures.enableTotp.useMutation();
  const setupSmsMutation = trpc.securityFeatures.setupSms.useMutation();
  const verifySmsOtpMutation = trpc.securityFeatures.verifySmsOtp.useMutation();

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleEnableTotp = async () => {
    if (!setupTotpQuery.data || !totpToken) return;

    try {
      await enableTotpMutation.mutateAsync({
        secret: setupTotpQuery.data.secret,
        token: totpToken,
        backupCodes: setupTotpQuery.data.backupCodes,
      });
      setShowBackupCodes(true);
    } catch (error) {
      console.error("Failed to enable TOTP:", error);
    }
  };

  const handleSetupSms = async () => {
    if (!phoneNumber) return;

    try {
      await setupSmsMutation.mutateAsync({ phoneNumber });
    } catch (error) {
      console.error("Failed to setup SMS:", error);
    }
  };

  const handleVerifySmsOtp = async () => {
    if (!smsOtp) return;

    try {
      await verifySmsOtpMutation.mutateAsync({ otp: smsOtp });
    } catch (error) {
      console.error("Failed to verify SMS OTP:", error);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Two-Factor Authentication</CardTitle>
          <CardDescription>
            Add an extra layer of security to your FarmKonnect account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "totp" | "sms")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="totp" className="flex items-center gap-2">
                <Smartphone className="w-4 h-4" />
                Authenticator App
              </TabsTrigger>
              <TabsTrigger value="sms" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                SMS
              </TabsTrigger>
            </TabsList>

            {/* TOTP Setup */}
            <TabsContent value="totp" className="space-y-4">
              {setupTotpQuery.isLoading ? (
                <div className="text-center py-8">Loading...</div>
              ) : setupTotpQuery.data ? (
                <>
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Scan this QR code with your authenticator app (Google Authenticator, Authy, Microsoft Authenticator, etc.)
                    </AlertDescription>
                  </Alert>

                  {/* QR Code Display */}
                  <div className="flex justify-center p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-2">QR Code</p>
                      <p className="text-xs text-muted-foreground">
                        {setupTotpQuery.data.qrCode}
                      </p>
                    </div>
                  </div>

                  {/* Manual Entry */}
                  <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <p className="text-sm font-semibold mb-2">Or enter manually:</p>
                    <p className="font-mono text-sm break-all">{setupTotpQuery.data.secret}</p>
                  </div>

                  {/* Token Verification */}
                  <div>
                    <label className="text-sm font-medium">Enter 6-digit code from app</label>
                    <Input
                      type="text"
                      placeholder="000000"
                      value={totpToken}
                      onChange={(e) => setTotpToken(e.target.value.slice(0, 6))}
                      maxLength={6}
                      className="font-mono text-center text-lg tracking-widest mt-2"
                    />
                  </div>

                  <Button
                    onClick={handleEnableTotp}
                    disabled={totpToken.length !== 6 || enableTotpMutation.isPending}
                    className="w-full"
                  >
                    {enableTotpMutation.isPending ? "Verifying..." : "Verify & Enable"}
                  </Button>

                  {/* Backup Codes */}
                  {showBackupCodes && setupTotpQuery.data.backupCodes && (
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <h3 className="font-semibold">Save Your Backup Codes</h3>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Store these codes in a safe place. Each code can be used once to recover your account.
                      </p>
                      <div className="space-y-2">
                        {setupTotpQuery.data.backupCodes.map((code) => (
                          <div
                            key={code}
                            className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border"
                          >
                            <code className="font-mono text-sm">{code}</code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyCode(code)}
                            >
                              {copiedCode === code ? (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : null}
            </TabsContent>

            {/* SMS Setup */}
            <TabsContent value="sms" className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  We'll send you a verification code via SMS each time you log in
                </AlertDescription>
              </Alert>

              <div>
                <label className="text-sm font-medium">Phone Number</label>
                <Input
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="mt-2"
                />
              </div>

              <Button
                onClick={handleSetupSms}
                disabled={!phoneNumber || setupSmsMutation.isPending}
                className="w-full"
              >
                {setupSmsMutation.isPending ? "Sending..." : "Send Verification Code"}
              </Button>

              {setupSmsMutation.isSuccess && (
                <>
                  <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-700 dark:text-green-300">
                      Verification code sent to your phone
                    </AlertDescription>
                  </Alert>

                  <div>
                    <label className="text-sm font-medium">Enter 6-digit code</label>
                    <Input
                      type="text"
                      placeholder="000000"
                      value={smsOtp}
                      onChange={(e) => setSmsOtp(e.target.value.slice(0, 6))}
                      maxLength={6}
                      className="font-mono text-center text-lg tracking-widest mt-2"
                    />
                  </div>

                  <Button
                    onClick={handleVerifySmsOtp}
                    disabled={smsOtp.length !== 6 || verifySmsOtpMutation.isPending}
                    className="w-full"
                  >
                    {verifySmsOtpMutation.isPending ? "Verifying..." : "Verify & Enable"}
                  </Button>
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Security Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Security Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• Keep your backup codes in a secure location</p>
          <p>• Never share your authentication codes with anyone</p>
          <p>• Use a strong, unique password along with 2FA</p>
          <p>• Review your login activity regularly</p>
        </CardContent>
      </Card>
    </div>
  );
}
