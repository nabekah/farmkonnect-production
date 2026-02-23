import { useEffect } from "react";
import { useLocation } from "wouter";

export function LoginPage() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Redirect to the custom login page instead of showing Manus OAuth
    setLocation("/login");
  }, [setLocation]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 dark:from-green-950 dark:via-gray-900 dark:to-green-950">
      <div className="flex flex-col items-center gap-4 p-8">
        <div className="w-16 h-16 bg-green-600 rounded-lg flex items-center justify-center animate-pulse">
          <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
          </svg>
        </div>
        <p className="text-sm text-muted-foreground">Redirecting to login...</p>
      </div>
    </div>
  );
}
