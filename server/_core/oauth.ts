import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { googleOAuth } from "./googleOAuth";
import { logAuthenticationAttempt } from "./authAnalyticsLogger";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  // Manus OAuth callback
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      // Log failed attempt
      await logAuthenticationAttempt({
        req,
        loginMethod: "manus",
        success: false,
        failureReason: "Missing code or state parameters",
      });
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        // Log failed attempt
        await logAuthenticationAttempt({
          req,
          loginMethod: "manus",
          success: false,
          failureReason: "openId missing from user info",
        });
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      // Log successful login
      const user = await db.getUserByOpenId(userInfo.openId);
      await logAuthenticationAttempt({
        req,
        userId: user?.id,
        loginMethod: "manus",
        success: true,
      });

      res.redirect(302, "/farms");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("[OAuth] Manus callback failed:", {
        error: errorMessage,
        code,
        state: state?.substring(0, 20) + "...",
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // Log failed attempt
      await logAuthenticationAttempt({
        req,
        loginMethod: "manus",
        success: false,
        failureReason: errorMessage,
      });
      
      // Redirect to error page instead of JSON response
      const errorCode = errorMessage.includes('invalid') ? 'invalid_code' : 'token_exchange_failed';
      const redirectUrl = `/?auth_error=${errorCode}&error_message=${encodeURIComponent(errorMessage)}`;
      res.redirect(302, redirectUrl);
    }
  });

  // Google OAuth callback
  app.get("/api/oauth/google/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      // Log failed attempt
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
      // Exchange code for tokens
      const tokens = await googleOAuth.exchangeCodeForToken(code);
      
      if (!tokens.id_token) {
        // Log failed attempt
        await logAuthenticationAttempt({
          req,
          loginMethod: "google",
          success: false,
          failureReason: "id_token missing from Google response",
        });
        res.status(400).json({ error: "id_token missing from Google response" });
        return;
      }

      // Verify and decode ID token
      const payload = await googleOAuth.verifyIdToken(tokens.id_token);

      if (!payload.sub) {
        // Log failed attempt
        await logAuthenticationAttempt({
          req,
          loginMethod: "google",
          success: false,
          failureReason: "sub (user ID) missing from Google token",
        });
        res.status(400).json({ error: "sub (user ID) missing from Google token" });
        return;
      }

      // Check if user exists by Google ID
      let user = await db.getUserByGoogleId(payload.sub);

      if (!user) {
        // Check if user exists by email (for linking accounts)
        if (payload.email) {
          user = await db.getUserByEmail(payload.email);
        }

        // If still no user, create new one
        if (!user) {
          // Generate default name from email if Google doesn't provide one
          const defaultName = payload.name || payload.email?.split('@')[0] || 'User';
          await db.upsertUser({
            googleId: payload.sub,
            name: defaultName,
            email: payload.email ?? null,
            loginMethod: "google",
            lastSignedIn: new Date(),
          });
          user = await db.getUserByGoogleId(payload.sub);
        } else {
          // Link Google account to existing user
          const defaultName = payload.name || payload.email?.split('@')[0] || user.name || 'User';
          await db.upsertUser({
            ...user,
            googleId: payload.sub,
            name: defaultName,
            loginMethod: "google",
            lastSignedIn: new Date(),
          });
        }
      } else {
        // Update last signed in
        await db.upsertUser({
          ...user,
          lastSignedIn: new Date(),
        });
      }

      if (!user) {
        // Log failed attempt
        await logAuthenticationAttempt({
          req,
          loginMethod: "google",
          success: false,
          failureReason: "Failed to create or retrieve user",
        });
        res.status(500).json({ error: "Failed to create or retrieve user" });
        return;
      }

      // Create session token using the user's ID
      const sessionToken = await sdk.createSessionToken(user.openId || user.googleId || "", {
        name: user.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      // Log successful login
      await logAuthenticationAttempt({
        req,
        userId: user.id,
        loginMethod: "google",
        success: true,
      });

      // Redirect to home or to the state-encoded redirect URL
      const redirectUrl = state ? atob(state) : "/";
      res.redirect(302, redirectUrl);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("[GoogleOAuth] Callback failed:", {
        error: errorMessage,
        code: code?.substring(0, 20) + "...",
        state: state?.substring(0, 20) + "...",
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // Log failed attempt
      await logAuthenticationAttempt({
        req,
        loginMethod: "google",
        success: false,
        failureReason: errorMessage,
      });
      
      // Redirect to error page instead of JSON response
      let errorCode = 'callback_failed';
      if (errorMessage.includes('redirect_uri')) errorCode = 'redirect_uri_mismatch';
      if (errorMessage.includes('invalid')) errorCode = 'invalid_code';
      if (errorMessage.includes('token')) errorCode = 'token_error';
      
      const redirectUrl = `/?auth_error=${errorCode}&error_message=${encodeURIComponent(errorMessage)}`;
      res.redirect(302, redirectUrl);
    }
  });

  // Get Google OAuth authorization URL
  app.get("/api/oauth/google/authorize", (req: Request, res: Response) => {
    try {
      const redirectUri = req.query.redirect_uri as string || "/";
      const state = Buffer.from(redirectUri).toString("base64");
      const authUrl = googleOAuth.getAuthorizationUrl(state);
      
      res.json({ authUrl });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("[GoogleOAuth] Failed to generate auth URL:", {
        error: errorMessage,
        redirectUri: req.query.redirect_uri,
        stack: error instanceof Error ? error.stack : undefined
      });
      res.status(500).json({ error: "Failed to generate authorization URL", details: errorMessage });
    }
  });
}
