import { useEffect, useRef } from "react";
import { useAuth } from "./useAuth";

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const WARNING_TIMEOUT_MS = SESSION_TIMEOUT_MS - 2 * 60 * 1000; // 2 minutes before timeout

export function useSessionTimeout() {
  const { user, logout } = useAuth();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningShownRef = useRef(false);

  useEffect(() => {
    if (!user) return;

    // Clear existing timeouts
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    warningShownRef.current = false;

    // Set warning timeout (2 minutes before actual timeout)
    warningTimeoutRef.current = setTimeout(() => {
      if (!warningShownRef.current) {
        warningShownRef.current = true;
        // Show warning notification
        const event = new CustomEvent("sessionWarning", {
          detail: { message: "Your session will expire in 2 minutes due to inactivity" },
        });
        window.dispatchEvent(event);
      }
    }, WARNING_TIMEOUT_MS);

    // Set logout timeout
    timeoutRef.current = setTimeout(async () => {
      await logout();
      // Show logout notification
      const event = new CustomEvent("sessionExpired", {
        detail: { message: "Your session has expired due to inactivity. Please sign in again." },
      });
      window.dispatchEvent(event);
    }, SESSION_TIMEOUT_MS);

    // Reset timeout on user activity
    const resetTimeout = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
      warningShownRef.current = false;

      warningTimeoutRef.current = setTimeout(() => {
        if (!warningShownRef.current) {
          warningShownRef.current = true;
          const event = new CustomEvent("sessionWarning", {
            detail: { message: "Your session will expire in 2 minutes due to inactivity" },
          });
          window.dispatchEvent(event);
        }
      }, WARNING_TIMEOUT_MS);

      timeoutRef.current = setTimeout(async () => {
        await logout();
        const event = new CustomEvent("sessionExpired", {
          detail: { message: "Your session has expired due to inactivity. Please sign in again." },
        });
        window.dispatchEvent(event);
      }, SESSION_TIMEOUT_MS);
    };

    // Listen for user activity
    const events = ["mousedown", "keydown", "scroll", "touchstart", "click"];
    events.forEach((event) => {
      window.addEventListener(event, resetTimeout);
    });

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
      events.forEach((event) => {
        window.removeEventListener(event, resetTimeout);
      });
    };
  }, [user, logout]);
}
