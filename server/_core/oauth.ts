import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { googleOAuth } from "./googleOAuth";

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
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
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

      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Manus callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });

  // Google OAuth callback
  app.get("/api/oauth/google/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      // Exchange code for tokens
      const tokens = await googleOAuth.exchangeCodeForToken(code);
      
      if (!tokens.id_token) {
        res.status(400).json({ error: "id_token missing from Google response" });
        return;
      }

      // Verify and decode ID token
      const payload = await googleOAuth.verifyIdToken(tokens.id_token);

      if (!payload.sub) {
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
          await db.upsertUser({
            googleId: payload.sub,
            name: payload.name || null,
            email: payload.email ?? null,
            loginMethod: "google",
            lastSignedIn: new Date(),
          });
          user = await db.getUserByGoogleId(payload.sub);
        } else {
          // Link Google account to existing user
          await db.upsertUser({
            ...user,
            googleId: payload.sub,
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

      // Redirect to home or to the state-encoded redirect URL
      const redirectUrl = state ? atob(state) : "/";
      res.redirect(302, redirectUrl);
    } catch (error) {
      console.error("[GoogleOAuth] Callback failed", error);
      res.status(500).json({ error: "Google OAuth callback failed" });
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
      console.error("[GoogleOAuth] Failed to generate auth URL", error);
      res.status(500).json({ error: "Failed to generate authorization URL" });
    }
  });
}
