import { useLocation } from "wouter";
import { AlertCircle, Home, RotateCcw } from "lucide-react";
import { Button } from "./ui/button";

interface AuthError {
  code: string;
  message: string;
  userFriendlyMessage: string;
  suggestion: string;
}

const ERROR_MESSAGES: Record<string, AuthError> = {
  redirect_uri_mismatch: {
    code: "redirect_uri_mismatch",
    message: "The redirect URI does not match the one registered with the OAuth provider",
    userFriendlyMessage: "Sign-in configuration error",
    suggestion: "Please contact the administrator. The app's OAuth settings need to be updated."
  },
  invalid_code: {
    code: "invalid_code",
    message: "The authorization code is invalid or has expired",
    userFriendlyMessage: "Invalid authorization code",
    suggestion: "Please try signing in again. If the problem persists, clear your browser cache and try again."
  },
  token_exchange_failed: {
    code: "token_exchange_failed",
    message: "Failed to exchange the authorization code for a token",
    userFriendlyMessage: "Unable to complete sign-in",
    suggestion: "Please try signing in again. If the problem persists, try a different sign-in method."
  },
  token_error: {
    code: "token_error",
    message: "An error occurred while processing the authentication token",
    userFriendlyMessage: "Token processing error",
    suggestion: "Please try signing in again."
  },
  callback_failed: {
    code: "callback_failed",
    message: "The authentication callback failed",
    userFriendlyMessage: "Sign-in failed",
    suggestion: "Please try signing in again."
  }
};

export function AuthErrorPage() {
  const [location, setLocation] = useLocation();
  const params = new URLSearchParams(location.split("?")[1] || "");
  const errorCode = params.get("auth_error") || "unknown";
  const errorMessage = params.get("error_message") || "Unknown error";

  const error = ERROR_MESSAGES[errorCode] || {
    code: errorCode,
    message: errorMessage,
    userFriendlyMessage: "Authentication failed",
    suggestion: "Please try again or contact support."
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-red-50 dark:from-red-950 dark:via-gray-900 dark:to-red-950 p-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8 space-y-6">
          {/* Error Icon */}
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
          </div>

          {/* Error Title */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {error.userFriendlyMessage}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {error.suggestion}
            </p>
          </div>

          {/* Error Details (Development) */}
          {process.env.NODE_ENV === "development" && (
            <div className="bg-gray-100 dark:bg-gray-800 rounded p-4 space-y-2">
              <p className="text-xs font-mono text-gray-700 dark:text-gray-300">
                <span className="font-semibold">Error Code:</span> {error.code}
              </p>
              <p className="text-xs font-mono text-gray-700 dark:text-gray-300 break-words">
                <span className="font-semibold">Details:</span> {error.message}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={() => {
                // Try signing in again
                setLocation("/login");
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              size="lg"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            <Button
              onClick={() => setLocation("/")}
              variant="outline"
              className="w-full"
              size="lg"
            >
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          </div>

          {/* Support Link */}
          <div className="text-center">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Need help?{" "}
              <a
                href="mailto:support@farmconnekt.com"
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline"
              >
                Contact support
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
