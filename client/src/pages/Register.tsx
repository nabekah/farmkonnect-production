import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { trpc } from "@/lib/trpc";
import { AlertCircle, Loader2, Mail, Lock, User, CheckCircle2, AlertTriangle } from "lucide-react";

interface PasswordRequirement {
  label: string;
  regex: RegExp;
  met: boolean;
}

export default function Register() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    name: "",
    password: "",
    confirmPassword: "",
    role: "farmer" as const,
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const passwordRequirements: PasswordRequirement[] = [
    { label: "At least 8 characters", regex: /.{8,}/, met: false },
    { label: "One uppercase letter", regex: /[A-Z]/, met: false },
    { label: "One lowercase letter", regex: /[a-z]/, met: false },
    { label: "One number", regex: /[0-9]/, met: false },
    { label: "One special character", regex: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, met: false },
  ];

  // Update password requirements based on current password
  const updatedRequirements = passwordRequirements.map((req) => ({
    ...req,
    met: req.regex.test(formData.password),
  }));

  const allRequirementsMet = updatedRequirements.every((req) => req.met);
  const passwordsMatch = formData.password === formData.confirmPassword && formData.password.length > 0;

  const registerMutation = trpc.auth.registerWithPassword.useMutation({
    onSuccess: (data) => {
      setSuccess(true);
      setError(null);
      // Redirect to email verification page
      setTimeout(() => {
        setLocation("/verify-email?email=" + encodeURIComponent(formData.email));
      }, 2000);
    },
    onError: (error) => {
      setError(error.message);
      setIsLoading(false);
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Validate form
    if (!formData.username || !formData.email || !formData.name || !formData.password) {
      setError("Please fill in all fields");
      setIsLoading(false);
      return;
    }

    if (!allRequirementsMet) {
      setError("Password does not meet all requirements");
      setIsLoading(false);
      return;
    }

    if (!passwordsMatch) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      await registerMutation.mutateAsync({
        username: formData.username,
        email: formData.email,
        name: formData.name,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        role: formData.role,
      });
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto" />
              <h2 className="text-2xl font-bold">Registration Successful!</h2>
              <p className="text-gray-600">
                We've sent a verification email to <strong>{formData.email}</strong>. Please check your inbox and click
                the verification link to activate your account.
              </p>
              <p className="text-sm text-gray-500">Redirecting to verification page...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-green-700 mb-2">FarmKonnect</h1>
          <p className="text-gray-600">Create Your Account</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="space-y-2">
            <CardTitle>Join FarmKonnect</CardTitle>
            <CardDescription>Register to start managing your farm digitally</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="name"
                    type="text"
                    name="name"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {/* Username */}
              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-medium">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="username"
                    type="text"
                    name="username"
                    placeholder="john_doe"
                    value={formData.username}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    className="pl-10"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500">Letters, numbers, underscores, and hyphens only</p>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    name="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {/* Role Selection */}
              <div className="space-y-2">
                <label htmlFor="role" className="text-sm font-medium">
                  Role
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="farmer">Farmer</option>
                  <option value="agent">Agricultural Agent</option>
                  <option value="veterinarian">Veterinarian</option>
                  <option value="buyer">Buyer</option>
                  <option value="transporter">Transporter</option>
                </select>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    name="password"
                    placeholder="Enter a strong password"
                    value={formData.password}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {/* Password Requirements */}
              {formData.password && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3 space-y-2">
                  <p className="text-sm font-medium text-blue-900">Password Requirements:</p>
                  {updatedRequirements.map((req, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      {req.met ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-gray-400" />
                      )}
                      <span className={req.met ? "text-green-700" : "text-gray-600"}>{req.label}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Confirm Password */}
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    name="confirmPassword"
                    placeholder="Re-enter your password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    className="pl-10"
                    required
                  />
                </div>
                {formData.confirmPassword && (
                  <div className="flex items-center gap-2 text-sm">
                    {passwordsMatch ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span className="text-green-700">Passwords match</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <span className="text-red-700">Passwords do not match</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={isLoading || !allRequirementsMet || !passwordsMatch}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>

            {/* Sign In Link */}
            <div className="text-center text-sm">
              <span className="text-gray-600">Already have an account? </span>
              <Link href="/login" className="text-green-600 hover:text-green-700 font-medium">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-gray-600 mt-6">
          By registering, you agree to our{" "}
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
