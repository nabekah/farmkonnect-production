import { Button } from "./ui/button";
import { getLoginUrl, getGoogleLoginUrl } from "@/const";
import { useState } from "react";
import { setRememberMe } from "@/_core/hooks/useRememberMe";

export function LoginPage() {
  const [rememberMe, setRememberMeState] = useState(false);

  const handleRememberMeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRememberMeState(e.target.checked);
    setRememberMe(e.target.checked);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 dark:from-green-950 dark:via-gray-900 dark:to-green-950">
      <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 bg-green-600 rounded-lg flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-center">
            FarmKonnect
          </h1>
          <p className="text-sm text-muted-foreground text-center max-w-sm">
            Smart Farm Management Made Simple. Sign in to access your agricultural operations dashboard.
          </p>
        </div>

        <div className="w-full space-y-3">
          <Button
            onClick={() => {
              window.location.href = getLoginUrl();
            }}
            size="lg"
            className="w-full shadow-lg hover:shadow-xl transition-all bg-blue-600 hover:bg-blue-700 text-white"
          >
            Sign in with Manus
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300 dark:border-gray-600"></span>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-950 text-gray-500">or</span>
            </div>
          </div>

          <Button
            onClick={() => {
              window.location.href = getGoogleLoginUrl();
            }}
            size="lg"
            variant="outline"
            className="w-full shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign in with Google
          </Button>
        </div>

        <div className="w-full flex items-center gap-2 px-2">
          <input
            type="checkbox"
            id="rememberMe"
            checked={rememberMe}
            onChange={handleRememberMeChange}
            className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
          />
          <label htmlFor="rememberMe" className="text-sm text-gray-700 dark:text-gray-300">
            Remember me on this device
          </label>
        </div>

        <div className="pt-4 border-t border-gray-300 dark:border-gray-600 w-full">
          <p className="text-xs text-center text-gray-500 dark:text-gray-400">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
