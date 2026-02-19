import { db as getDb } from "../_core/db";
import { users, emailVerificationTokens } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

export interface EmailVerificationResult {
  success: boolean;
  message: string;
  token?: string;
  expiresAt?: Date;
}

/**
 * Generate email verification token
 */
export async function generateVerificationToken(
  email: string
): Promise<EmailVerificationResult> {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    // Generate random token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store token in database
    await db.insert(emailVerificationTokens).values({
      email,
      token,
      expiresAt,
      isUsed: false,
    });

    return {
      success: true,
      message: "Verification token generated",
      token,
      expiresAt,
    };
  } catch (error) {
    console.error("Failed to generate verification token:", error);
    return {
      success: false,
      message: "Failed to generate verification token",
    };
  }
}

/**
 * Verify email token
 */
export async function verifyEmailToken(
  email: string,
  token: string
): Promise<EmailVerificationResult> {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    // Find token
    const tokenRecord = await db
      .select()
      .from(emailVerificationTokens)
      .where(eq(emailVerificationTokens.email, email))
      .limit(1);

    if (!tokenRecord || tokenRecord.length === 0) {
      return {
        success: false,
        message: "Verification token not found",
      };
    }

    const record = tokenRecord[0];

    // Check if token is valid
    if (record.token !== token) {
      return {
        success: false,
        message: "Invalid verification token",
      };
    }

    // Check if token is expired
    if (new Date() > record.expiresAt) {
      return {
        success: false,
        message: "Verification token has expired",
      };
    }

    // Check if token is already used
    if (record.isUsed) {
      return {
        success: false,
        message: "Verification token has already been used",
      };
    }

    // Mark token as used
    await db
      .update(emailVerificationTokens)
      .set({ isUsed: true })
      .where(eq(emailVerificationTokens.email, email));

    // Update user email verification status
    await db
      .update(users)
      .set({ emailVerified: true })
      .where(eq(users.email, email));

    return {
      success: true,
      message: "Email verified successfully",
    };
  } catch (error) {
    console.error("Failed to verify email token:", error);
    return {
      success: false,
      message: "Failed to verify email token",
    };
  }
}

/**
 * Resend verification email
 */
export async function resendVerificationEmail(
  email: string
): Promise<EmailVerificationResult> {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    // Check if user exists
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user || user.length === 0) {
      return {
        success: false,
        message: "User not found",
      };
    }

    // Check if email is already verified
    if (user[0].emailVerified) {
      return {
        success: false,
        message: "Email is already verified",
      };
    }

    // Generate new token
    return await generateVerificationToken(email);
  } catch (error) {
    console.error("Failed to resend verification email:", error);
    return {
      success: false,
      message: "Failed to resend verification email",
    };
  }
}

/**
 * Check if email is verified
 */
export async function isEmailVerified(email: string): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user || user.length === 0) {
      return false;
    }

    return user[0].emailVerified || false;
  } catch (error) {
    console.error("Failed to check email verification:", error);
    return false;
  }
}
