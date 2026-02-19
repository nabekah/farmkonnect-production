import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/contexts/ToastContext";

interface PasswordResetFormProps {
  token?: string;
  onSuccess?: () => void;
}

export function PasswordResetForm({ token, onSuccess }: PasswordResetFormProps) {
  const [step, setStep] = useState<"request" | "verify" | "reset" | "success">("request");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [tokenValid, setTokenValid] = useState(false);
  const { showToast } = useToast();

  const requestResetMutation = trpc.passwordReset.requestReset.useMutation();
  const verifyTokenQuery = trpc.passwordReset.verifyToken.useQuery(
    { token: token || "" },
    { enabled: !!token }
  );
  const resetPasswordMutation = trpc.passwordReset.resetPassword.useMutation();

  useEffect(() => {
    if (token && verifyTokenQuery.data) {
      setTokenValid(true);
      setStep("reset");
      setEmail(verifyTokenQuery.data.email);
    }
  }, [token, verifyTokenQuery.data]);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      showToast({
        type: "error",
        title: "Error",
        message: "Please enter your email address",
      });
      return;
    }

    try {
      await requestResetMutation.mutateAsync({ email });
      showToast({
        type: "success",
        title: "Reset Email Sent",
        message: "If an account exists with this email, a password reset link has been sent",
      });
      setStep("verify");
    } catch (error: any) {
      showToast({
        type: "error",
        title: "Error",
        message: error.message || "Failed to request password reset",
      });
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      showToast({
        type: "error",
        title: "Error",
        message: "Please enter both passwords",
      });
      return;
    }

    if (newPassword.length < 8) {
      showToast({
        type: "error",
        title: "Error",
        message: "Password must be at least 8 characters",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast({
        type: "error",
        title: "Error",
        message: "Passwords do not match",
      });
      return;
    }

    if (!token) {
      showToast({
        type: "error",
        title: "Error",
        message: "Invalid reset token",
      });
      return;
    }

    try {
      await resetPasswordMutation.mutateAsync({
        token,
        newPassword,
        confirmPassword,
      });

      showToast({
        type: "success",
        title: "Password Reset Successful",
        message: "Your password has been reset. You can now sign in with your new password.",
      });

      setStep("success");
      if (onSuccess) {
        setTimeout(onSuccess, 2000);
      }
    } catch (error: any) {
      showToast({
        type: "error",
        title: "Error",
        message: error.message || "Failed to reset password",
      });
    }
  };

  // Request step
  if (step === "request") {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Reset Your Password</CardTitle>
          <CardDescription>Enter your email address to receive a reset link</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRequestReset} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <Button type="submit" disabled={requestResetMutation.isPending} className="w-full">
              {requestResetMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Reset Link"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  // Verify step
  if (step === "verify") {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            Check Your Email
          </CardTitle>
          <CardDescription>We've sent a password reset link to {email}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-blue-900 font-semibold text-sm">Check your email</p>
              <p className="text-blue-800 text-sm mt-1">
                Click the link in the email to reset your password. The link will expire in 24 hours.
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => setStep("request")}
          >
            Back to Request
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Reset step
  if (step === "reset" && tokenValid) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Create New Password</CardTitle>
          <CardDescription>Enter your new password below</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <p className="text-xs text-gray-600 mt-1">Minimum 8 characters</p>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <Button type="submit" disabled={resetPasswordMutation.isPending} className="w-full">
              {resetPasswordMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Resetting...
                </>
              ) : (
                "Reset Password"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  // Success step
  if (step === "success") {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="w-5 h-5" />
            Password Reset Successful
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            Your password has been successfully reset. You can now sign in with your new password.
          </p>
          <Button className="w-full" onClick={onSuccess}>
            Continue to Sign In
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Loading state for token verification
  if (verifyTokenQuery.isLoading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-green-600" />
        </CardContent>
      </Card>
    );
  }

  // Error state for invalid token
  if (token && verifyTokenQuery.isError) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="w-5 h-5" />
            Invalid or Expired Link
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            The password reset link is invalid or has expired. Please request a new one.
          </p>
          <Button className="w-full" onClick={() => setStep("request")}>
            Request New Link
          </Button>
        </CardContent>
      </Card>
    );
  }

  return null;
}
