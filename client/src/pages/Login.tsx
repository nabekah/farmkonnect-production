import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { trpc } from "@/lib/trpc";
import { AlertCircle, Loader2, Mail, Lock, Chrome } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loginMutation = trpc.auth.loginWithPassword.useMutation({
    onSuccess: (data) => {
      // Redirect to dashboard on successful login
      setLocation("/dashboard");
    },
    onError: (error) => {
      setError(error.message);
      setIsLoading(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await loginMutation.mutateAsync({
        usernameOrEmail,
        password,
      });
    } catch (err: any) {
      setError(err.message || "Login failed. Please try again.");
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);
      // Redirect to Google OAuth authorization endpoint
      const redirectUri = `${window.location.origin}/api/oauth/google/callback`;
      const response = await fetch(`/api/oauth/google/authorize?redirect_uri=${encodeURIComponent(redirectUri)}`);
      const data = await response.json();
      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        setError("Failed to initialize Google login. Please try again.");
        setIsLoading(false);
      }
    } catch (err: any) {
      setError(err.message || "Google login failed. Please try again.");
      setIsLoading(false);
    }
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-green-700 mb-2">FarmKonnect</h1>
          <p className="text-gray-600">Digital Agriculture Management Platform</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="space-y-2">
            <CardTitle>Sign In to Your Account</CardTitle>
            <CardDescription>Enter your credentials to access FarmKonnect</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Username/Email and Password Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="usernameOrEmail" className="text-sm font-medium">
                  Username or Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="usernameOrEmail"
                    type="text"
                    placeholder="Enter your username or email"
                    value={usernameOrEmail}
                    onChange={(e) => setUsernameOrEmail(e.target.value)}
                    disabled={isLoading}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            {/* OAuth Options */}
            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleGoogleLogin}
                disabled={isLoading}
              >
                <Chrome className="mr-2 h-4 w-4" />
                Sign in with Google
              </Button>


            </div>

            {/* Sign Up Link */}
            <div className="text-center text-sm">
              <span className="text-gray-600">Don't have an account? </span>
              <Link href="/register" className="text-green-600 hover:text-green-700 font-medium">
                Sign up
              </Link>
            </div>

            {/* Forgot Password Link */}
            <div className="text-center text-sm">
              <Link href="/forgot-password" className="text-blue-600 hover:text-blue-700">
                Forgot your password?
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-gray-600 mt-6">
          By signing in, you agree to our{" "}
          <Link href="/terms" className="text-green-600 hover:text-green-700">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-green-600 hover:text-green-700">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}
