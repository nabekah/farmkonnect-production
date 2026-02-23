// This file is kept for backward compatibility but Manus OAuth has been removed
// The system now uses only username/password and Google OAuth authentication

import { SignJWT, jwtVerify } from "jose";
import type { User } from "../../drizzle/schema";
import { ENV } from "./env";

export type SessionPayload = {
  userId: string;
  email: string;
  role: string;
};

class SessionService {
  private secret: Uint8Array;

  constructor() {
    const secretKey = ENV.jwtSecret || "default-secret-key";
    this.secret = new TextEncoder().encode(secretKey);
    console.log("[Session] JWT service initialized (Manus OAuth removed)");
  }

  async createSessionToken(userId: string, payload: Partial<SessionPayload>): Promise<string> {
    const token = await new SignJWT({
      userId,
      ...payload,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("1y")
      .sign(this.secret);

    return token;
  }

  async verifySessionToken(token: string): Promise<SessionPayload> {
    try {
      const verified = await jwtVerify(token, this.secret);
      return verified.payload as SessionPayload;
    } catch (error) {
      throw new Error("Invalid or expired session token");
    }
  }
}

export const sessionService = new SessionService();

// Backward compatibility export
export const sdk = {
  authenticateRequest: async (req: any) => {
    const token = req.cookies?.session;
    if (!token) {
      return null;
    }
    try {
      const payload = await sessionService.verifySessionToken(token);
      const db = require("../db");
      const user = await db.getUserById(payload.userId);
      return user || null;
    } catch (error) {
      return null;
    }
  },
  exchangeCodeForToken: async (code: string) => {
    throw new Error("Manus OAuth has been removed");
  },
  getUserInfo: async (token: string) => {
    throw new Error("Manus OAuth has been removed");
  },
  createSessionToken: async (openId: string, options: any) => {
    throw new Error("Manus OAuth has been removed");
  },
};
