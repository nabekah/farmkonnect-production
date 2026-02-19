import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { AlertCircle, Copy, Check, Shield } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/contexts/ToastContext";

export function TwoFactorSetup() {
  const [step, setStep] = useState<"check" | "setup" | "verify" | "backup">("check");
  const [method, setMethod] = useState<"totp" | "sms">("totp");
  const [secret, setSecret] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState("");
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();

  const isEnabledQuery = trpc.twoFactorAuth.isEnabled.useQuery();
  const generateSecretMutation = trpc.twoFactorAuth.generateSecret.useMutation();
  const enableMutation = trpc.twoFactorAuth.enable.useMutation();
  const disableMutation = trpc.twoFactorAuth.disable.useMutation();

  const handleGenerateSecret = async () => {
    try {
      const result = await generateSecretMutation.mutateAsync({ method });
      setSecret(result.secret);
      setQrCode(result.qrCodeUrl);
      setBackupCodes(result.backupCodes);
      setStep("verify");
    } catch (error: any) {
      showToast({
        type: "error",
        title: "Error",
        message: error.message || "Failed to generate 2FA secret",
      });
    }
  };

  const handleEnable2FA = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      showToast({
        type: "error",
        title: "Invalid Code",
        message: "Please enter a valid 6-digit code",
      });
      return;
    }

    try {
      await enableMutation.mutateAsync({
        method,
        secret,
        verificationCode,
        backupCodes,
      });

      showToast({
        type: "success",
        title: "2FA Enabled",
        message: "Two-factor authentication has been enabled successfully",
      });

      setStep("backup");
    } catch (error: any) {
      showToast({
        type: "error",
        title: "Error",
        message: error.message || "Failed to enable 2FA",
      });
    }
  };

  const handleDisable2FA = async () => {
    if (!window.confirm("Are you sure you want to disable 2FA? This will reduce your account security.")) {
      return;
    }

    try {
      await disableMutation.mutateAsync({ password: "" });

      showToast({
        type: "success",
        title: "2FA Disabled",
        message: "Two-factor authentication has been disabled",
      });

      isEnabledQuery.refetch();
      setStep("check");
    } catch (error: any) {
      showToast({
        type: "error",
        title: "Error",
        message: error.message || "Failed to disable 2FA",
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isEnabledQuery.isLoading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (step === "check" && isEnabledQuery.data?.enabled) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-600" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>Your account is protected with 2FA</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800 font-semibold">✓ 2FA is enabled</p>
            <p className="text-green-700 text-sm mt-1">Your admin account is protected with two-factor authentication.</p>
          </div>

          <Button variant="destructive" onClick={handleDisable2FA} disabled={disableMutation.isPending}>
            {disableMutation.isPending ? "Disabling..." : "Disable 2FA"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (step === "check") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>Secure your admin account with 2FA</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-blue-900 font-semibold">Recommended for Admin Accounts</p>
              <p className="text-blue-800 text-sm mt-1">
                Two-factor authentication adds an extra layer of security to your account by requiring a code from your phone in addition to your password.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <label className="block">
              <input
                type="radio"
                name="method"
                value="totp"
                checked={method === "totp"}
                onChange={(e) => setMethod(e.target.value as "totp" | "sms")}
                className="mr-2"
              />
              <span className="font-semibold">Authenticator App (Recommended)</span>
              <p className="text-sm text-gray-600 ml-6">Use Google Authenticator, Authy, or Microsoft Authenticator</p>
            </label>

            <label className="block">
              <input
                type="radio"
                name="method"
                value="sms"
                checked={method === "sms"}
                onChange={(e) => setMethod(e.target.value as "totp" | "sms")}
                className="mr-2"
              />
              <span className="font-semibold">SMS Text Message</span>
              <p className="text-sm text-gray-600 ml-6">Receive codes via text message</p>
            </label>
          </div>

          <Button onClick={handleGenerateSecret} disabled={generateSecretMutation.isPending} className="w-full">
            {generateSecretMutation.isPending ? "Setting up..." : "Set Up 2FA"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (step === "verify") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Verify Your Setup</CardTitle>
          <CardDescription>Scan the QR code or enter the secret key</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {method === "totp" && (
            <>
              <div className="bg-gray-100 p-4 rounded-lg flex justify-center">
                <img src={qrCode} alt="QR Code" className="w-48 h-48" />
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Secret Key (if QR code doesn't work):</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-white p-2 border rounded font-mono text-sm break-all">{secret}</code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(secret)}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-semibold mb-2">Enter 6-digit code from your authenticator:</label>
            <input
              type="text"
              maxLength={6}
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              className="w-full px-3 py-2 border rounded-lg text-center text-2xl tracking-widest font-mono"
            />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep("check")} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleEnable2FA} disabled={enableMutation.isPending} className="flex-1">
              {enableMutation.isPending ? "Verifying..." : "Verify & Enable"}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === "backup") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Save Your Backup Codes</CardTitle>
          <CardDescription>Store these codes in a safe place</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-yellow-900 font-semibold">Important</p>
              <p className="text-yellow-800 text-sm mt-1">
                Save these backup codes in a secure location. You can use them to access your account if you lose access to your authenticator.
              </p>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            {backupCodes.map((code, index) => (
              <div key={index} className="flex items-center justify-between font-mono text-sm">
                <span>{code}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(code)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>

          <Button onClick={() => setStep("check")} className="w-full">
            Done - I've Saved My Codes
          </Button>
        </CardContent>
      </Card>
    );
  }

  return null;
}
