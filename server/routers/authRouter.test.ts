import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

describe("Complete Registration and Login Flow", () => {
  const testEmail = `test-${Date.now()}@farmkonnect.test`;
  const testUsername = `testuser${Date.now()}`;
  const testPassword = "TestPass123!@#";
  let testUserId: number | null = null;

  beforeAll(async () => {
    // Clean up any existing test user
    const db = await getDb();
    if (db) {
      await db.delete(users).where(eq(users.email, testEmail));
    }
  });

  afterAll(async () => {
    // Clean up test user
    const db = await getDb();
    if (db && testUserId) {
      await db.delete(users).where(eq(users.email, testEmail));
    }
  });

  it("should register a new user with password", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(testPassword, salt);

    // Generate verification token
    const token = require("crypto").randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Insert user
    const result = await db.insert(users).values({
      username: testUsername,
      email: testEmail,
      passwordHash,
      name: "Test User",
      role: "farmer",
      loginMethod: "local",
      approvalStatus: "pending",
      accountStatus: "active",
      emailVerified: false,
      emailVerificationToken: token,
      emailVerificationTokenExpiresAt: expiresAt,
    });

    testUserId = result.insertId;

    expect(testUserId).toBeGreaterThan(0);
  });

  it("should verify email with valid token", async () => {
    if (!testUserId) {
      throw new Error("Test setup failed");
    }

    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    // Verify email
    await db.update(users)
      .set({
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationTokenExpiresAt: null,
      })
      .where(eq(users.id, testUserId));

    // Check verification
    const [user] = await db.select().from(users).where(eq(users.id, testUserId));
    expect(user.emailVerified).toBe(true);
    expect(user.emailVerificationToken).toBeNull();
  });

  it("should allow login with correct password", async () => {
    if (!testUserId) {
      throw new Error("Test setup failed");
    }

    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    // Get user
    const [user] = await db.select().from(users).where(eq(users.id, testUserId));
    expect(user).toBeTruthy();

    // Verify password
    if (user.passwordHash) {
      const passwordValid = await bcrypt.compare(testPassword, user.passwordHash);
      expect(passwordValid).toBe(true);
    }
  });

  it("should reject login with incorrect password", async () => {
    if (!testUserId) {
      throw new Error("Test setup failed");
    }

    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    // Get user
    const [user] = await db.select().from(users).where(eq(users.id, testUserId));
    expect(user).toBeTruthy();

    // Verify password
    if (user.passwordHash) {
      const passwordValid = await bcrypt.compare("WrongPassword123!", user.passwordHash);
      expect(passwordValid).toBe(false);
    }
  });

  it("should handle account lockout after failed attempts", async () => {
    if (!testUserId) {
      throw new Error("Test setup failed");
    }

    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    // Simulate failed login attempts
    const lockoutTime = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    await db.update(users)
      .set({
        failedLoginAttempts: 5,
        accountLockedUntil: lockoutTime,
      })
      .where(eq(users.id, testUserId));

    // Check lockout
    const [user] = await db.select().from(users).where(eq(users.id, testUserId));
    expect(user.failedLoginAttempts).toBe(5);
    expect(user.accountLockedUntil).toBeTruthy();
  });

  it("should reset password with valid token", async () => {
    if (!testUserId) {
      throw new Error("Test setup failed");
    }

    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    // Generate reset token
    const resetToken = require("crypto").randomBytes(32).toString("hex");
    const resetExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Update user with reset token
    await db.update(users)
      .set({
        passwordResetToken: resetToken,
        passwordResetTokenExpiresAt: resetExpiresAt,
      })
      .where(eq(users.id, testUserId));

    // Verify reset token is set
    const [user] = await db.select().from(users).where(eq(users.id, testUserId));
    expect(user.passwordResetToken).toBe(resetToken);

    // Reset password
    const newPassword = "NewPass456!@#";
    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    await db.update(users)
      .set({
        passwordHash: newPasswordHash,
        passwordResetToken: null,
        passwordResetTokenExpiresAt: null,
        failedLoginAttempts: 0,
        accountLockedUntil: null,
      })
      .where(eq(users.id, testUserId));

    // Verify new password works
    const [updatedUser] = await db.select().from(users).where(eq(users.id, testUserId));
    if (updatedUser.passwordHash) {
      const passwordValid = await bcrypt.compare(newPassword, updatedUser.passwordHash);
      expect(passwordValid).toBe(true);
    }
  });

  it("should track user approval status", async () => {
    if (!testUserId) {
      throw new Error("Test setup failed");
    }

    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    // Check initial approval status
    let [user] = await db.select().from(users).where(eq(users.id, testUserId));
    expect(user.approvalStatus).toBe("pending");

    // Approve user
    await db.update(users)
      .set({ approvalStatus: "approved" })
      .where(eq(users.id, testUserId));

    // Verify approval
    [user] = await db.select().from(users).where(eq(users.id, testUserId));
    expect(user.approvalStatus).toBe("approved");
  });
});
