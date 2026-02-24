import { OAuth2Client } from "google-auth-library";
import { ENV } from "./env";

export interface GoogleTokenPayload {
  iss: string;
  azp: string;
  aud: string;
  sub: string;
  email: string;
  email_verified: boolean;
  at_hash: string;
  name: string;
  picture: string;
  given_name: string;
  family_name: string;
  locale: string;
  iat: number;
  exp: number;
}

class GoogleOAuthService {
  private client: OAuth2Client | null = null;

  constructor() {
    this.initializeClient();
  }

  private initializeClient() {
    const clientId = ENV.googleClientId;
    const clientSecret = ENV.googleClientSecret;
    const redirectUrl = ENV.googleRedirectUrl;

    if (!clientId || !clientSecret || !redirectUrl) {
      console.warn(
        "[GoogleOAuth] Missing configuration: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, or GOOGLE_REDIRECT_URL"
      );
    }

    this.client = new OAuth2Client(clientId, clientSecret, redirectUrl);
    console.log("[GoogleOAuth] Initialized with clientId:", clientId, "redirectUrl:", redirectUrl);
  }

  private getClient(): OAuth2Client {
    if (!this.client) {
      this.initializeClient();
    }
    return this.client!;
  }

  /**
   * Get the Google OAuth authorization URL
   * @param state - State parameter for CSRF protection
   * @returns Authorization URL
   */
  getAuthorizationUrl(state: string): string {
    return this.getClient().generateAuthUrl({
      access_type: "offline",
      scope: ["openid", "email", "profile"],
      state,
    });
  }

  /**
   * Exchange authorization code for tokens
   * @param code - Authorization code from Google
   * @returns Token response with id_token, access_token, etc.
   */
  async exchangeCodeForToken(code: string) {
    const { tokens } = await this.getClient().getToken(code);
    return tokens;
  }

  /**
   * Verify and decode ID token
   * @param idToken - ID token from Google
   * @returns Decoded token payload
   */
  async verifyIdToken(idToken: string): Promise<GoogleTokenPayload> {
    const ticket = await this.getClient().verifyIdToken({
      idToken,
      audience: ENV.googleClientId,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      throw new Error("Failed to get payload from ID token");
    }

    return payload as GoogleTokenPayload;
  }

  /**
   * Get user info from access token
   * @param accessToken - Access token from Google
   * @returns User information
   */
  async getUserInfo(accessToken: string) {
    const response = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to get user info from Google");
    }

    return response.json();
  }
}

export const googleOAuth = new GoogleOAuthService();
