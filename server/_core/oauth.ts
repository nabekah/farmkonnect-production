import type { Express, Request, Response } from "express";
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
  // Google OAuth callback
  app.get("/api/oauth/google/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      await logAuthenticationAttempt({
        req,
        loginMethod: "google",
        success: false,
        failureReason: "Missing code or state parameters",
      });
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      const tokenResponse = await googleOAuth.exchangeCodeForToken(code);
      const userInfo = await googleOAuth.getUserInfo(tokenResponse.access_token);

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

      res.redirect(302, "/dashboard");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("[OAuth] Google callback failed:", {
        error: errorMessage,
        code,
        state: state?.substring(0, 20) + "...",
        stack: error instanceof Error ? error.stack : undefined,
      });

      await logAuthenticationAttempt({
        req,
        loginMethod: "google",
        success: false,
        failureReason: errorMessage,
      });

      res.redirect(302, `/login?error=${encodeURIComponent(errorMessage)}`);
    }
  });

  console.log("[OAuth] Initialized with Google OAuth only");
}
