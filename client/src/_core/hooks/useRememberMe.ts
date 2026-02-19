import { useEffect } from "react";
import { useAuth } from "./useAuth";

const REMEMBER_ME_KEY = "farmkonnect_remember_me";
const USER_EMAIL_KEY = "farmkonnect_user_email";

export function useRememberMe() {
  const { user } = useAuth();

  // Save user email when logged in and remember me is enabled
  useEffect(() => {
    if (user && user.email) {
      const rememberMe = localStorage.getItem(REMEMBER_ME_KEY) === "true";
      if (rememberMe) {
        localStorage.setItem(USER_EMAIL_KEY, user.email);
      }
    }
  }, [user]);

  // Clear remember me data on logout
  useEffect(() => {
    if (!user) {
      const rememberMe = localStorage.getItem(REMEMBER_ME_KEY) === "true";
      if (!rememberMe) {
        localStorage.removeItem(USER_EMAIL_KEY);
      }
    }
  }, [user]);
}

export function setRememberMe(enabled: boolean) {
  if (enabled) {
    localStorage.setItem(REMEMBER_ME_KEY, "true");
  } else {
    localStorage.removeItem(REMEMBER_ME_KEY);
    localStorage.removeItem(USER_EMAIL_KEY);
  }
}

export function getRememberMe(): boolean {
  return localStorage.getItem(REMEMBER_ME_KEY) === "true";
}

export function getSavedUserEmail(): string | null {
  return localStorage.getItem(USER_EMAIL_KEY);
}
