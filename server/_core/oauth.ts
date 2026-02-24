import type { Express, Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import { googleOAuth } from "./googleOAuth";
import { logAuthenticationAttempt } from "./authAnalyticsLogger";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sessionService } from "./sdk";

const COOKIE_NAME = "session";
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  // Google OAuth: Generate authorization URL
  app.get("/api/oauth/google/authorize", async (req: Request, res: Response) => {
    try {
      const state = Math.random().toString(36).substring(2, 15);
      // Create a fresh OAuth2Client with current environment variables
      const clientId = process.env.GOOGLE_CLIENT_ID || "";
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
      const redirectUri = process.env.GOOGLE_REDIRECT_URL || "";
      
      const oauth2Client = new OAuth2Client(clientId, clientSecret, redirectUri);
      const authUrl = oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: ["openid", "email", "profile"],
        state,
      });
      
      console.log("[OAuth] Generated auth URL with redirect_uri:", redirectUri);
      res.json({ authUrl, state });
    } catch (error) {
      console.error("[OAuth] Failed to generate Google auth URL:", error);
      res.status(500).json({ error: "Failed to generate authorization URL" });
    }
  });

  // Google OAuth: Handle callback
  app.get("/api/oauth/google/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code) {
      await logAuthenticationAttempt({
        req,
        loginMethod: "google",
        success: false,
        failureReason: "Missing code parameter",
      });
      res.status(400).json({ error: "Authorization code is required" });
      return;
    }

    try {
      const tokenResponse = await googleOAuth.exchangeCodeForToken(code);
      const userInfo = await googleOAuth.getUserInfo(tokenResponse.access_token as string);

      if (!userInfo.id) {
        await logAuthenticationAttempt({
          req,
          loginMethod: "google",
          success: false,
          failureReason: "Google ID missing from user info",
        });
        res.status(400).json({ error: "Google ID missing from user info" });
        return;
      }

      // Upsert user with Google OAuth info
      await db.upsertUser({
        googleId: userInfo.id,
        name: userInfo.name || null,
        email: userInfo.email || null,
        loginMethod: "google",
        lastSignedIn: new Date(),
      });

      // Get the user to retrieve ID
      const user = await db.getUserByGoogleId(userInfo.id);
      if (!user) {
        throw new Error("Failed to create or retrieve user");
      }

      // Create session token using JWT
      const sessionToken = await sessionService.createSessionToken(user.id, {
        email: user.email,
        role: user.role,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      await logAuthenticationAttempt({
        req,
        userId: user.id,
        loginMethod: "google",
        success: true,
      });

      res.redirect(302, "/farmer-dashboard");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("[OAuth] Google callback failed:", errorMessage);

      await logAuthenticationAttempt({
        req,
        loginMethod: "google",
        success: false,
        failureReason: errorMessage,
      });

      res.redirect(302, `/login?error=${encodeURIComponent(errorMessage)}`);
    }
  });

  // Health check endpoint
  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      auth: "username/password + Google OAuth",
    });
  });

  console.log("[OAuth] Routes initialized (Google OAuth only)");
}
