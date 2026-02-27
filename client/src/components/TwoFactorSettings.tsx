import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import {
  Shield,
  Smartphone,
  Copy,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  Download,
} from "lucide-react";

export function TwoFactorSettings() {
  const [totpSecret, setTotpSecret] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [totpCode, setTotpCode] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [smsCode, setSmsCode] = useState("");
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Queries and mutations
  const mfaStatus = trpc.mfa.getMFAStatus.useQuery();
  const enableTOTP = trpc.mfa.enableTOTP.useMutation({
    onSuccess: (data) => {
      setTotpSecret(data.secret);
      setBackupCodes(data.backupCodes);
    },
  });
  const verifyTOTP = trpc.mfa.verifyAndActivateTOTP.useMutation();
  const enableSMS = trpc.mfa.enableSMS.useMutation();
  const verifySMS = trpc.mfa.verifySMSCode.useMutation();
  const disableMFA = trpc.mfa.disableMFA.useMutation();

  const handleEnableTOTP = async () => {
    await enableTOTP.mutateAsync();
  };

  const handleVerifyTOTP = async () => {
    if (totpCode.length !== 6) {
      alert("Please enter a 6-digit code");
      return;
    }
    await verifyTOTP.mutateAsync({ code: totpCode });
    setTotpCode("");
    setTotpSecret(null);
  };

  const handleEnableSMS = async () => {
    if (!phoneNumber) {
      alert("Please enter a phone number");
      return;
    }
    await enableSMS.mutateAsync({ phoneNumber });
  };

  const handleVerifySMS = async () => {
    if (smsCode.length !== 6) {
      alert("Please enter a 6-digit code");
      return;
    }
    await verifySMS.mutateAsync({ code: smsCode });
    setSmsCode("");
    setPhoneNumber("");
  };

  const handleDisableMFA = async (method: "totp" | "sms") => {
    if (confirm(`Are you sure you want to disable ${method.toUpperCase()}?`)) {
      await disableMFA.mutateAsync({ method });
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleDownloadBackupCodes = () => {
    const content = backupCodes.join("\n");
    const element = document.createElement("a");
    element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(content));
    element.setAttribute("download", "farmkonnect-backup-codes.txt");
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (mfaStatus.isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  const status = mfaStatus.data;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Two-Factor Authentication
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Add an extra layer of security to your account
        </p>
      </div>

      <Tabs defaultValue="totp" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="totp" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Authenticator App
          </TabsTrigger>
          <TabsTrigger value="sms" className="flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            SMS
          </TabsTrigger>
        </TabsList>

        {/* TOTP Tab */}
        <TabsContent value="totp" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Authenticator App (TOTP)</CardTitle>
              <CardDescription>
                Use an authenticator app like Google Authenticator, Authy, or Microsoft Authenticator
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {status?.totpEnabled ? (
                <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <AlertDescription className="text-green-800 dark:text-green-300">
                    Authenticator app is enabled for your account
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  {!totpSecret ? (
                    <Button onClick={handleEnableTOTP} disabled={enableTOTP.isPending}>
                      {enableTOTP.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Setting up...
                        </>
                      ) : (
                        "Enable Authenticator App"
                      )}
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
                        <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <AlertDescription className="text-blue-800 dark:text-blue-300">
                          Scan the QR code below with your authenticator app
                        </AlertDescription>
                      </Alert>

                      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                        <div className="text-sm font-mono text-center text-gray-600 dark:text-gray-400">
                          Secret Key: {totpSecret}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Enter 6-digit code from your app
                        </label>
                        <div className="flex gap-2">
                          <Input
                            type="text"
                            placeholder="000000"
                            value={totpCode}
                            onChange={(e) => setTotpCode(e.target.value.slice(0, 6))}
                            maxLength={6}
                            className="font-mono text-center text-2xl tracking-widest"
                          />
                          <Button
                            onClick={handleVerifyTOTP}
                            disabled={totpCode.length !== 6 || verifyTOTP.isPending}
                          >
                            {verifyTOTP.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "Verify"
                            )}
                          </Button>
                        </div>
                      </div>

                      {backupCodes.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Backup Codes
                            </label>
                            <button
                              onClick={() => setShowBackupCodes(!showBackupCodes)}
                              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              {showBackupCodes ? (
                                <>
                                  <EyeOff className="h-4 w-4 inline mr-1" />
                                  Hide
                                </>
                              ) : (
                                <>
                                  <Eye className="h-4 w-4 inline mr-1" />
                                  Show
                                </>
                              )}
                            </button>
                          </div>

                          {showBackupCodes && (
                            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-2">
                              {backupCodes.map((code) => (
                                <div
                                  key={code}
                                  className="flex items-center justify-between text-sm font-mono"
                                >
                                  <span className="text-gray-600 dark:text-gray-400">{code}</span>
                                  <button
                                    onClick={() => handleCopyCode(code)}
                                    className="text-blue-600 dark:text-blue-400 hover:underline"
                                  >
                                    {copiedCode === code ? (
                                      <CheckCircle2 className="h-4 w-4" />
                                    ) : (
                                      <Copy className="h-4 w-4" />
                                    )}
                                  </button>
                                </div>
                              ))}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleDownloadBackupCodes}
                                className="w-full mt-4"
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Download Codes
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {status?.totpEnabled && (
                <Button
                  variant="destructive"
                  onClick={() => handleDisableMFA("totp")}
                  disabled={disableMFA.isPending}
                >
                  {disableMFA.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Disabling...
                    </>
                  ) : (
                    "Disable Authenticator App"
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SMS Tab */}
        <TabsContent value="sms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>SMS Text Message</CardTitle>
              <CardDescription>
                Receive verification codes via SMS to your phone
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {status?.smsEnabled ? (
                <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <AlertDescription className="text-green-800 dark:text-green-300">
                    SMS 2FA is enabled for {status.smsPhoneNumber}
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  {!phoneNumber ? (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Phone Number
                      </label>
                      <div className="flex gap-2">
                        <Input
                          type="tel"
                          placeholder="+1 (555) 123-4567"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                        />
                        <Button
                          onClick={handleEnableSMS}
                          disabled={!phoneNumber || enableSMS.isPending}
                        >
                          {enableSMS.isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            "Send Code"
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
                        <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <AlertDescription className="text-blue-800 dark:text-blue-300">
                          Enter the 6-digit code sent to {phoneNumber}
                        </AlertDescription>
                      </Alert>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Verification Code
                        </label>
                        <div className="flex gap-2">
                          <Input
                            type="text"
                            placeholder="000000"
                            value={smsCode}
                            onChange={(e) => setSmsCode(e.target.value.slice(0, 6))}
                            maxLength={6}
                            className="font-mono text-center text-2xl tracking-widest"
                          />
                          <Button
                            onClick={handleVerifySMS}
                            disabled={smsCode.length !== 6 || verifySMS.isPending}
                          >
                            {verifySMS.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "Verify"
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {status?.smsEnabled && (
                <Button
                  variant="destructive"
                  onClick={() => handleDisableMFA("sms")}
                  disabled={disableMFA.isPending}
                >
                  {disableMFA.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Disabling...
                    </>
                  ) : (
                    "Disable SMS 2FA"
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
