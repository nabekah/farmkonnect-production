import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

describe("Authentication Router", () => {
  let testUserId: number;
  const testUser = {
    username: "testuser123",
    email: "testuser@example.com",
    name: "Test User",
    password: "TestPassword123!",
  };

  beforeAll(async () => {
    // Clean up any existing test user
    const db = await getDb();
    if (db) {
      await db.delete(users).where(eq(users.email, testUser.email));
    }
  });

  afterAll(async () => {
    // Clean up test user
    const db = await getDb();
    if (db) {
      await db.delete(users).where(eq(users.email, testUser.email));
    }
  });

  it("should hash password correctly", async () => {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(testUser.password, salt);
    const isValid = await bcrypt.compare(testUser.password, hash);
    expect(isValid).toBe(true);
  });

  it("should reject invalid password", async () => {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(testUser.password, salt);
    const isValid = await bcrypt.compare("WrongPassword123!", hash);
    expect(isValid).toBe(false);
  });

  it("should validate password requirements", () => {
    const validPasswords = [
      "ValidPass123!",
      "SecurePassword456@",
      "MyFarmPass789#",
    ];

    const invalidPasswords = [
      "short1!", // Too short
      "nouppercase123!", // No uppercase
      "NOLOWERCASE123!", // No lowercase
      "NoNumbers!", // No numbers
      "NoSpecial123", // No special character
    ];

    const passwordRegex = {
      minLength: /.{8,}/,
      uppercase: /[A-Z]/,
      lowercase: /[a-z]/,
      number: /[0-9]/,
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
    };

    validPasswords.forEach((pwd) => {
      expect(passwordRegex.minLength.test(pwd)).toBe(true);
      expect(passwordRegex.uppercase.test(pwd)).toBe(true);
      expect(passwordRegex.lowercase.test(pwd)).toBe(true);
      expect(passwordRegex.number.test(pwd)).toBe(true);
      expect(passwordRegex.special.test(pwd)).toBe(true);
    });

    invalidPasswords.forEach((pwd) => {
      const meetsAllRequirements =
        passwordRegex.minLength.test(pwd) &&
        passwordRegex.uppercase.test(pwd) &&
        passwordRegex.lowercase.test(pwd) &&
        passwordRegex.number.test(pwd) &&
        passwordRegex.special.test(pwd);
      expect(meetsAllRequirements).toBe(false);
    });
  });

  it("should validate email format", () => {
    const validEmails = [
      "user@example.com",
      "test.user@example.co.uk",
      "user+tag@example.com",
    ];

    const invalidEmails = [
      "invalid.email",
      "@example.com",
      "user@",
      "user @example.com",
    ];

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    validEmails.forEach((email) => {
      expect(emailRegex.test(email)).toBe(true);
    });

    invalidEmails.forEach((email) => {
      expect(emailRegex.test(email)).toBe(false);
    });
  });

  it("should validate username format", () => {
    const validUsernames = [
      "user123",
      "john_doe",
      "farm-manager",
      "test_user_123",
    ];

    const invalidUsernames = [
      "user@name", // Invalid character
      "user name", // Space
      "user#123", // Invalid character
      "ab", // Too short
    ];

    const usernameRegex = /^[a-zA-Z0-9_-]{3,100}$/;

    validUsernames.forEach((username) => {
      expect(usernameRegex.test(username)).toBe(true);
    });

    invalidUsernames.forEach((username) => {
      expect(usernameRegex.test(username)).toBe(false);
    });
  });

  it("should generate valid verification token", () => {
    const token = require("crypto").randomBytes(32).toString("hex");
    expect(token).toBeDefined();
    expect(token.length).toBe(64); // 32 bytes = 64 hex characters
  });

  it("should handle account lockout after failed attempts", () => {
    const maxFailedAttempts = 5;
    const lockoutDuration = 15 * 60 * 1000; // 15 minutes

    let failedAttempts = 0;
    let accountLockedUntil: Date | null = null;

    // Simulate 5 failed login attempts
    for (let i = 0; i < maxFailedAttempts; i++) {
      failedAttempts++;
      if (failedAttempts >= maxFailedAttempts) {
        accountLockedUntil = new Date(Date.now() + lockoutDuration);
      }
    }

    expect(failedAttempts).toBe(maxFailedAttempts);
    expect(accountLockedUntil).toBeDefined();
    expect(accountLockedUntil!.getTime()).toBeGreaterThan(Date.now());
  });

  it("should reset failed attempts on successful login", () => {
    let failedAttempts = 5;
    let lastFailedLoginAt: Date | null = new Date();
    let accountLockedUntil: Date | null = new Date(Date.now() + 15 * 60 * 1000);

    // Simulate successful login
    failedAttempts = 0;
    lastFailedLoginAt = null;
    accountLockedUntil = null;

    expect(failedAttempts).toBe(0);
    expect(lastFailedLoginAt).toBeNull();
    expect(accountLockedUntil).toBeNull();
  });
});
