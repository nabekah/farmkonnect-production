import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Copy, Eye, EyeOff } from "lucide-react";

export const MFASetup: React.FC = () => {
  const [activeTab, setActiveTab] = useState("totp");
  const [totpCode, setTotpCode] = useState("");
  const [smsPhone, setSmsPhone] = useState("");
  const [smsCode, setSmsCode] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: mfaStatus } = trpc.mfa.getMFAStatus.useQuery();
  const { data: backupCodes } = trpc.mfa.getBackupCodes.useQuery();

  const enableTotpMutation = trpc.mfa.enableTOTP.useMutation();
  const verifyTotpMutation = trpc.mfa.verifyAndActivateTOTP.useMutation();
  const enableSmsMutation = trpc.mfa.enableSMS.useMutation();
  const verifySmsCodeMutation = trpc.mfa.verifySMSCode.useMutation();
  const disableMfaMutation = trpc.mfa.disableMFA.useMutation();

  const handleEnableTOTP = async () => {
    try {
      await enableTotpMutation.mutateAsync();
    } catch (error) {
      console.error("Error enabling TOTP:", error);
    }
  };

  const handleVerifyTOTP = async () => {
    try {
      await verifyTotpMutation.mutateAsync({ code: totpCode });
      setTotpCode("");
    } catch (error) {
      console.error("Error verifying TOTP:", error);
    }
  };

  const handleEnableSMS = async () => {
    try {
      await enableSmsMutation.mutateAsync({ phoneNumber: smsPhone });
    } catch (error) {
      console.error("Error enabling SMS:", error);
    }
  };

  const handleVerifySMS = async () => {
    try {
      await verifySmsCodeMutation.mutateAsync({ code: smsCode });
      setSmsCode("");
      setSmsPhone("");
    } catch (error) {
      console.error("Error verifying SMS:", error);
    }
  };

  const handleDisableMFA = async (method: "totp" | "sms") => {
    try {
      await disableMfaMutation.mutateAsync({ method });
    } catch (error) {
      console.error("Error disabling MFA:", error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Multi-Factor Authentication (MFA)</CardTitle>
          <CardDescription>Enhance your account security with two-factor authentication</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="totp">Authenticator App</TabsTrigger>
              <TabsTrigger value="sms">SMS</TabsTrigger>
            </TabsList>

            {/* TOTP Setup */}
            <TabsContent value="totp" className="space-y-4">
              {mfaStatus?.totpEnabled ? (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Authenticator app is enabled and active
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <Alert className="border-blue-200 bg-blue-50">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      Use an authenticator app like Google Authenticator, Microsoft Authenticator, or Authy
                    </AlertDescription>
                  </Alert>

                  {enableTotpMutation.data ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-gray-100 rounded-lg">
                        <p className="text-sm font-medium mb-2">Secret Key:</p>
                        <div className="flex items-center gap-2">
                          <code className={`flex-1 p-2 bg-white rounded text-sm ${showSecret ? "" : "blur"}`}>
                            {enableTotpMutation.data.secret}
                          </code>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowSecret(!showSecret)}
                          >
                            {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(enableTotpMutation.data.secret)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        {copied && <p className="text-xs text-green-600 mt-1">Copied!</p>}
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Enter 6-digit code from your app:</label>
                        <div className="flex gap-2">
                          <Input
                            type="text"
                            placeholder="000000"
                            maxLength="6"
                            value={totpCode}
                            onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
                          />
                          <Button
                            onClick={handleVerifyTOTP}
                            disabled={totpCode.length !== 6 || verifyTotpMutation.isPending}
                          >
                            Verify
                          </Button>
                        </div>
                      </div>

                      {enableTotpMutation.data.backupCodes && (
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                          <p className="text-sm font-medium text-yellow-800 mb-2">Backup Codes:</p>
                          <p className="text-xs text-yellow-700 mb-2">
                            Save these codes in a safe place. Use them if you lose access to your authenticator.
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            {enableTotpMutation.data.backupCodes.map((code: string) => (
                              <code key={code} className="text-xs bg-white p-1 rounded border">
                                {code}
                              </code>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Button onClick={handleEnableTOTP} disabled={enableTotpMutation.isPending}>
                      Enable Authenticator App
                    </Button>
                  )}
                </>
              )}

              {mfaStatus?.totpEnabled && (
                <Button
                  variant="destructive"
                  onClick={() => handleDisableMFA("totp")}
                  disabled={disableMfaMutation.isPending}
                >
                  Disable Authenticator App
                </Button>
              )}
            </TabsContent>

            {/* SMS Setup */}
            <TabsContent value="sms" className="space-y-4">
              {mfaStatus?.smsEnabled ? (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    SMS 2FA is enabled for {mfaStatus.smsPhoneNumber}
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <Alert className="border-blue-200 bg-blue-50">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      Receive authentication codes via SMS to your phone
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Phone Number:</label>
                    <div className="flex gap-2">
                      <Input
                        type="tel"
                        placeholder="+1 (555) 123-4567"
                        value={smsPhone}
                        onChange={(e) => setSmsPhone(e.target.value)}
                      />
                      <Button
                        onClick={handleEnableSMS}
                        disabled={!smsPhone || enableSmsMutation.isPending}
                      >
                        Send Code
                      </Button>
                    </div>
                  </div>

                  {enableSmsMutation.data && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Enter code from SMS:</label>
                      <div className="flex gap-2">
                        <Input
                          type="text"
                          placeholder="000000"
                          maxLength="6"
                          value={smsCode}
                          onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, ""))}
                        />
                        <Button
                          onClick={handleVerifySMS}
                          disabled={smsCode.length !== 6 || verifySmsCodeMutation.isPending}
                        >
                          Verify
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {mfaStatus?.smsEnabled && (
                <Button
                  variant="destructive"
                  onClick={() => handleDisableMFA("sms")}
                  disabled={disableMfaMutation.isPending}
                >
                  Disable SMS 2FA
                </Button>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Backup Codes */}
      {(mfaStatus?.totpEnabled || mfaStatus?.smsEnabled) && (
        <Card>
          <CardHeader>
            <CardTitle>Backup Codes</CardTitle>
            <CardDescription>Use these codes if you lose access to your authentication method</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {backupCodes?.backupCodes.map((code: string) => (
                <code key={code} className="text-sm bg-gray-100 p-2 rounded border">
                  {code}
                </code>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
