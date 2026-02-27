import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { AlertCircle, Loader2, Shield, Smartphone, HelpCircle } from "lucide-react";

interface TwoFactorVerificationProps {
  userId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function TwoFactorVerification({
  userId,
  onSuccess,
  onCancel,
}: TwoFactorVerificationProps) {
  const [totpCode, setTotpCode] = useState("");
  const [smsCode, setSmsCode] = useState("");
  const [backupCode, setBackupCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("totp");

  // Mutations for verification
  const verifyTOTP = trpc.mfa.verifyTOTPLogin.useMutation({
    onSuccess: () => {
      onSuccess();
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  const verifySMS = trpc.mfa.verifySMSLogin.useMutation({
    onSuccess: () => {
      onSuccess();
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  const verifyBackupCode = trpc.mfa.verifyBackupCode.useMutation({
    onSuccess: () => {
      onSuccess();
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  const handleVerifyTOTP = async () => {
    if (totpCode.length !== 6) {
      setError("Please enter a 6-digit code");
      return;
    }
    setError(null);
    await verifyTOTP.mutateAsync({ userId, code: totpCode });
  };

  const handleVerifySMS = async () => {
    if (smsCode.length !== 6) {
      setError("Please enter a 6-digit code");
      return;
    }
    setError(null);
    await verifySMS.mutateAsync({ userId, code: smsCode });
  };

  const handleVerifyBackupCode = async () => {
    if (!backupCode.trim()) {
      setError("Please enter a backup code");
      return;
    }
    setError(null);
    await verifyBackupCode.mutateAsync({ userId, code: backupCode });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-2xl">Two-Factor Authentication</CardTitle>
          <CardDescription>
            Enter your verification code to continue
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <Alert className="bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800">
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              <AlertDescription className="text-red-800 dark:text-red-300">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="totp" className="text-xs">
                <Shield className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">App</span>
              </TabsTrigger>
              <TabsTrigger value="sms" className="text-xs">
                <Smartphone className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">SMS</span>
              </TabsTrigger>
              <TabsTrigger value="backup" className="text-xs">
                <HelpCircle className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Backup</span>
              </TabsTrigger>
            </TabsList>

            {/* TOTP Verification */}
            <TabsContent value="totp" className="space-y-4 mt-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Enter code from your authenticator app
                </label>
                <Input
                  type="text"
                  placeholder="000000"
                  value={totpCode}
                  onChange={(e) => {
                    setTotpCode(e.target.value.slice(0, 6));
                    setError(null);
                  }}
                  maxLength={6}
                  className="font-mono text-center text-3xl tracking-widest"
                  autoFocus
                />
              </div>
              <Button
                onClick={handleVerifyTOTP}
                disabled={totpCode.length !== 6 || verifyTOTP.isPending}
                className="w-full"
              >
                {verifyTOTP.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify"
                )}
              </Button>
            </TabsContent>

            {/* SMS Verification */}
            <TabsContent value="sms" className="space-y-4 mt-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Enter code from your SMS
                </label>
                <Input
                  type="text"
                  placeholder="000000"
                  value={smsCode}
                  onChange={(e) => {
                    setSmsCode(e.target.value.slice(0, 6));
                    setError(null);
                  }}
                  maxLength={6}
                  className="font-mono text-center text-3xl tracking-widest"
                />
              </div>
              <Button
                onClick={handleVerifySMS}
                disabled={smsCode.length !== 6 || verifySMS.isPending}
                className="w-full"
              >
                {verifySMS.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify"
                )}
              </Button>
            </TabsContent>

            {/* Backup Code */}
            <TabsContent value="backup" className="space-y-4 mt-4">
              <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800">
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <AlertDescription className="text-amber-800 dark:text-amber-300 text-sm">
                  Use a backup code if you don't have access to your authenticator app or phone
                </AlertDescription>
              </Alert>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Enter backup code
                </label>
                <Input
                  type="text"
                  placeholder="XXXX-XXXX-XXXX"
                  value={backupCode}
                  onChange={(e) => {
                    setBackupCode(e.target.value.toUpperCase());
                    setError(null);
                  }}
                  className="font-mono"
                />
              </div>
              <Button
                onClick={handleVerifyBackupCode}
                disabled={!backupCode.trim() || verifyBackupCode.isPending}
                className="w-full"
              >
                {verifyBackupCode.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify"
                )}
              </Button>
            </TabsContent>
          </Tabs>

          <Button
            variant="outline"
            onClick={onCancel}
            className="w-full"
            disabled={verifyTOTP.isPending || verifySMS.isPending || verifyBackupCode.isPending}
          >
            Cancel
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
