export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Redirect to custom login page
export const getLoginUrl = () => {
  return `${window.location.origin}/login`;
};

// Generate Google OAuth login URL
export const getGoogleLoginUrl = async () => {
  try {
    const redirectUri = `${window.location.origin}/api/oauth/google/callback`;
    const response = await fetch(`/api/oauth/google/authorize?redirect_uri=${encodeURIComponent(redirectUri)}`);
    const data = await response.json();
    return data.authUrl;
  } catch (error) {
    console.error("Failed to get Google auth URL:", error);
    return null;
  }
};

