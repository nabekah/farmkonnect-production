import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { trpc } from "@/lib/trpc";
import { AlertCircle, CheckCircle2, Loader2, Mail } from "lucide-react";

export default function VerifyEmail() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<"loading" | "success" | "error" | "expired">("loading");
  const [message, setMessage] = useState("");
  const [token, setToken] = useState("");

  const verifyMutation = trpc.auth.verifyEmail.useMutation({
    onSuccess: () => {
      setStatus("success");
      setMessage("Email verified successfully! Redirecting to login...");
      setTimeout(() => {
        setLocation("/login");
      }, 2000);
    },
    onError: (error) => {
      if (error.message.includes("expired")) {
        setStatus("expired");
        setMessage("Verification token has expired. Please request a new one.");
      } else {
        setStatus("error");
        setMessage(error.message || "Failed to verify email. Please try again.");
      }
    },
  });

  const requestNewTokenMutation = trpc.auth.requestEmailVerification.useMutation({
    onSuccess: () => {
      setMessage("New verification email sent! Please check your inbox.");
      setStatus("loading");
    },
    onError: (error) => {
      setMessage(error.message || "Failed to send verification email.");
    },
  });

  useEffect(() => {
    // Get token from URL query parameter
    const params = new URLSearchParams(window.location.search);
    const verificationToken = params.get("token");

    if (!verificationToken) {
      setStatus("error");
      setMessage("No verification token provided. Please check your email link.");
      return;
    }

    setToken(verificationToken);

    // Automatically verify email when component mounts
    verifyMutation.mutate({ token: verificationToken });
  }, []);

  const handleRequestNewToken = async () => {
    // We need the email to request a new token
    // For now, show a message to contact support or go back to registration
    setMessage("Please contact support or register again to get a new verification email.");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-green-700 mb-2">FarmKonnect</h1>
          <p className="text-gray-600">Email Verification</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="space-y-2 text-center">
            <CardTitle>Verify Your Email</CardTitle>
            <CardDescription>We're verifying your email address</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Status Display */}
            {status === "loading" && (
              <div className="flex flex-col items-center space-y-4">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 bg-green-100 rounded-full animate-pulse"></div>
                  <Loader2 className="absolute inset-0 m-auto w-8 h-8 text-green-600 animate-spin" />
                </div>
                <div className="text-center">
                  <p className="text-gray-700 font-medium">Verifying your email...</p>
                  <p className="text-sm text-gray-500 mt-1">Please wait while we confirm your email address.</p>
                </div>
              </div>
            )}

            {status === "success" && (
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <div className="text-center">
                  <p className="text-gray-700 font-medium text-lg">Email Verified!</p>
                  <p className="text-sm text-gray-500 mt-1">Your email has been successfully verified.</p>
                </div>
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">{message}</AlertDescription>
                </Alert>
              </div>
            )}

            {status === "error" && (
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <div className="text-center">
                  <p className="text-gray-700 font-medium text-lg">Verification Failed</p>
                  <p className="text-sm text-gray-500 mt-1">We couldn't verify your email address.</p>
                </div>
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{message}</AlertDescription>
                </Alert>
                <div className="w-full space-y-2">
                  <Button
                    onClick={() => setLocation("/register")}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    Back to Registration
                  </Button>
                  <Button
                    onClick={() => setLocation("/login")}
                    variant="outline"
                    className="w-full"
                  >
                    Go to Login
                  </Button>
                </div>
              </div>
            )}

            {status === "expired" && (
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Mail className="w-8 h-8 text-yellow-600" />
                </div>
                <div className="text-center">
                  <p className="text-gray-700 font-medium text-lg">Token Expired</p>
                  <p className="text-sm text-gray-500 mt-1">Your verification link has expired.</p>
                </div>
                <Alert className="bg-yellow-50 border-yellow-200">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">{message}</AlertDescription>
                </Alert>
                <Button
                  onClick={handleRequestNewToken}
                  disabled={requestNewTokenMutation.isPending}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {requestNewTokenMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Request New Verification Email"
                  )}
                </Button>
                <Button
                  onClick={() => setLocation("/login")}
                  variant="outline"
                  className="w-full"
                >
                  Go to Login
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-gray-600 mt-6">
          Need help?{" "}
          <a href="/support" className="text-green-600 hover:text-green-700 font-medium">
            Contact Support
          </a>
        </p>
      </div>
    </div>
  );
}
