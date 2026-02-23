import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Mail, Loader2, ArrowLeft } from "lucide-react";
import { trpc } from "@/lib/trpc";

export function EmailVerificationPage() {
  const [, setLocation] = useLocation();
  const [token, setToken] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [status, setStatus] = useState<"idle" | "verifying" | "success" | "error" | "expired">("idle");
  const [message, setMessage] = useState<string>("");
  const [resendCountdown, setResendCountdown] = useState<number>(0);

  // Get token from URL query parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get("token");
    const emailParam = params.get("email");
    
    if (tokenParam) {
      setToken(tokenParam);
      setEmail(emailParam || "");
    }
  }, []);

  // Auto-verify if token is present
  useEffect(() => {
    if (token && status === "idle") {
      handleVerifyEmail();
    }
  }, [token]);

  // Handle countdown timer for resend
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  const verifyEmailMutation = trpc.auth.verifyEmail.useMutation({
    onSuccess: () => {
      setStatus("success");
      setMessage("Email verified successfully! Redirecting to login...");
      setTimeout(() => setLocation("/login"), 2000);
    },
    onError: (error) => {
      if (error.message.includes("expired")) {
        setStatus("expired");
        setMessage("Verification link has expired. Please request a new one.");
      } else {
        setStatus("error");
        setMessage(error.message || "Failed to verify email. Please try again.");
      }
    },
  });

  const resendVerificationMutation = trpc.auth.requestEmailVerification.useMutation({
    onSuccess: () => {
      setMessage("Verification email sent! Check your inbox.");
      setResendCountdown(60);
    },
    onError: (error) => {
      setMessage(error.message || "Failed to resend verification email.");
    },
  });

  const handleVerifyEmail = async () => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token provided.");
      return;
    }

    setStatus("verifying");
    verifyEmailMutation.mutate({ token });
  };

  const handleResendEmail = async () => {
    if (!email) {
      setMessage("Email address is required to resend verification.");
      return;
    }

    resendVerificationMutation.mutate({ email });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-width-md">
        {/* Back Button */}
        <button
          onClick={() => setLocation("/")}
          className="flex items-center text-green-600 hover:text-green-700 mb-6 font-medium"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </button>

        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              {status === "success" ? (
                <CheckCircle2 className="w-12 h-12 text-green-600" />
              ) : status === "verifying" ? (
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
              ) : (
                <Mail className="w-12 h-12 text-green-600" />
              )}
            </div>
            <CardTitle className="text-2xl">
              {status === "success"
                ? "Email Verified!"
                : status === "verifying"
                ? "Verifying Email..."
                : status === "expired"
                ? "Link Expired"
                : "Verify Your Email"}
            </CardTitle>
            <CardDescription className="mt-2">
              {status === "success"
                ? "Your email has been verified successfully."
                : status === "verifying"
                ? "Please wait while we verify your email address..."
                : status === "expired"
                ? "Your verification link has expired."
                : "Click the link in your email or enter the code below to verify your account."}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Status Message */}
            {message && (
              <Alert className={status === "success" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}>
                <AlertCircle className={`h-4 w-4 ${status === "success" ? "text-green-600" : "text-red-600"}`} />
                <AlertDescription className={status === "success" ? "text-green-800" : "text-red-800"}>
                  {message}
                </AlertDescription>
              </Alert>
            )}

            {/* Email Input */}
            {status !== "success" && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  disabled={status === "verifying"}
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2">
              {status === "success" ? (
                <Button
                  onClick={() => setLocation("/login")}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  Go to Login
                </Button>
              ) : status === "verifying" ? (
                <Button disabled className="w-full">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </Button>
              ) : (
                <>
                  <Button
                    onClick={handleVerifyEmail}
                    disabled={!token || status === "verifying"}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {status === "verifying" ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      "Verify Email"
                    )}
                  </Button>

                  <Button
                    onClick={handleResendEmail}
                    variant="outline"
                    disabled={resendCountdown > 0 || !email}
                    className="w-full"
                  >
                    {resendCountdown > 0
                      ? `Resend in ${resendCountdown}s`
                      : "Resend Verification Email"}
                  </Button>
                </>
              )}
            </div>

            {/* Help Text */}
            <div className="text-center text-sm text-gray-600 pt-4">
              <p>Didn't receive the email?</p>
              <button
                onClick={() => setLocation("/login")}
                className="text-green-600 hover:text-green-700 font-medium"
              >
                Try logging in again
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-600">
          <p>
            By verifying your email, you agree to our{" "}
            <a href="/terms" className="text-green-600 hover:text-green-700">
              Terms of Service
            </a>
            {" "}and{" "}
            <a href="/privacy" className="text-green-600 hover:text-green-700">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
