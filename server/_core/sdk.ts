// JWT-based session management for FarmKonnect
// Authentication: username/password + Google OAuth

import { SignJWT, jwtVerify } from "jose";
import type { User } from "../../drizzle/schema";
import { ENV } from "./env";
import { getUserById } from "../db";

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
    console.log("[Session] JWT session service initialized");
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

// Backward compatibility export used by context.ts
export const sdk = {
  authenticateRequest: async (req: any) => {
    const token = req.cookies?.session;
    if (!token) {
      return null;
    }
    try {
      const payload = await sessionService.verifySessionToken(token);
      const user = await getUserById(payload.userId);
      return user || null;
    } catch (error) {
      console.error("[Session] Auth request failed:", error);
      return null;
    }
  },
};
