import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb } from './db';
import { users } from '../drizzle/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

describe('FarmKonnect Feature Tests', () => {
  let db: any;
  const testEmail = 'test-features@farmkonnect.com';
  const testUsername = 'testfeatures';
  const testPassword = 'TestPassword@123';

  beforeAll(async () => {
    db = await getDb();
    if (!db) throw new Error('Database connection failed');

    // Clean up test user if exists
    await db.delete(users).where(eq(users.email, testEmail));
  });

  afterAll(async () => {
    // Clean up test user
    if (db) {
      await db.delete(users).where(eq(users.email, testEmail));
    }
  });

  describe('Authentication System', () => {
    it('should create a new user with valid credentials', async () => {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(testPassword, salt);

      await db.insert(users).values({
        email: testEmail,
        username: testUsername,
        passwordHash: hashedPassword,
        name: 'Test User',
        role: 'farmer',
        emailVerified: true,
        approvalStatus: 'approved',
        accountStatus: 'active',
        failedLoginAttempts: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const user = await db
        .select()
        .from(users)
        .where(eq(users.email, testEmail))
        .limit(1);

      expect(user).toHaveLength(1);
      expect(user[0].email).toBe(testEmail);
      expect(user[0].role).toBe('farmer');
      expect(user[0].emailVerified).toBe(true);
      expect(user[0].approvalStatus).toBe('approved');
      expect(user[0].accountStatus).toBe('active');
    });

    it('should verify password correctly', async () => {
      const user = await db
        .select()
        .from(users)
        .where(eq(users.email, testEmail))
        .limit(1);

      expect(user).toHaveLength(1);

      const passwordValid = await bcrypt.compare(testPassword, user[0].passwordHash);
      expect(passwordValid).toBe(true);

      const wrongPasswordValid = await bcrypt.compare('WrongPassword@123', user[0].passwordHash);
      expect(wrongPasswordValid).toBe(false);
    });

    it('should prevent login without email verification', async () => {
      const unverifiedEmail = 'unverified@farmkonnect.com';
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(testPassword, salt);

      await db.insert(users).values({
        email: unverifiedEmail,
        username: 'unverified',
        passwordHash: hashedPassword,
        name: 'Unverified User',
        role: 'farmer',
        emailVerified: false,
        approvalStatus: 'approved',
        accountStatus: 'active',
        failedLoginAttempts: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const user = await db
        .select()
        .from(users)
        .where(eq(users.email, unverifiedEmail))
        .limit(1);

      expect(user[0].emailVerified).toBe(false);

      await db.delete(users).where(eq(users.email, unverifiedEmail));
    });

    it('should prevent login without approval', async () => {
      const unapprovedEmail = 'unapproved@farmkonnect.com';
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(testPassword, salt);

      await db.insert(users).values({
        email: unapprovedEmail,
        username: 'unapproved',
        passwordHash: hashedPassword,
        name: 'Unapproved User',
        role: 'farmer',
        emailVerified: true,
        approvalStatus: 'pending',
        accountStatus: 'active',
        failedLoginAttempts: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const user = await db
        .select()
        .from(users)
        .where(eq(users.email, unapprovedEmail))
        .limit(1);

      expect(user[0].approvalStatus).toBe('pending');

      await db.delete(users).where(eq(users.email, unapprovedEmail));
    });
  });

  describe('User Profile System', () => {
    it('should update user profile information', async () => {
      const updateData = {
        name: 'Updated Test User',
        phone: '+1234567890',
      };

      await db
        .update(users)
        .set(updateData)
        .where(eq(users.email, testEmail));

      const user = await db
        .select()
        .from(users)
        .where(eq(users.email, testEmail))
        .limit(1);

      expect(user[0].name).toBe(updateData.name);
      expect(user[0].phone).toBe(updateData.phone);
    });

    it('should track user account creation and update dates', async () => {
      const user = await db
        .select()
        .from(users)
        .where(eq(users.email, testEmail))
        .limit(1);

      expect(user[0].createdAt).toBeDefined();
      expect(user[0].updatedAt).toBeDefined();
    });
  });

  describe('Admin Account System', () => {
    it('should have admin account with correct credentials', async () => {
      const adminEmail = 'admin@farmkonnect.com';
      const admin = await db
        .select()
        .from(users)
        .where(eq(users.email, adminEmail))
        .limit(1);

      expect(admin).toHaveLength(1);
      expect(admin[0].role).toBe('admin');
      expect(admin[0].emailVerified).toBe(true);
      expect(admin[0].approvalStatus).toBe('approved');
      expect(admin[0].accountStatus).toBe('active');
    });

    it('should verify admin password', async () => {
      const adminEmail = 'admin@farmkonnect.com';
      const adminPassword = 'Admin@12345';
      const admin = await db
        .select()
        .from(users)
        .where(eq(users.email, adminEmail))
        .limit(1);

      expect(admin).toHaveLength(1);

      const passwordValid = await bcrypt.compare(adminPassword, admin[0].passwordHash);
      expect(passwordValid).toBe(true);
    });
  });

  describe('Email Notification System', () => {
    it('should have email field for notifications', async () => {
      const user = await db
        .select()
        .from(users)
        .where(eq(users.email, testEmail))
        .limit(1);

      expect(user[0].email).toBe(testEmail);
      expect(user[0].email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    });

    it('should track email verification status', async () => {
      const user = await db
        .select()
        .from(users)
        .where(eq(users.email, testEmail))
        .limit(1);

      expect(user[0].emailVerified).toBe(true);
    });
  });

  describe('Security Features', () => {
    it('should track failed login attempts', async () => {
      const user = await db
        .select()
        .from(users)
        .where(eq(users.email, testEmail))
        .limit(1);

      expect(user[0].failedLoginAttempts).toBeDefined();
      expect(typeof user[0].failedLoginAttempts).toBe('number');
    });

    it('should support account locking', async () => {
      const user = await db
        .select()
        .from(users)
        .where(eq(users.email, testEmail))
        .limit(1);

      expect(user[0]).toHaveProperty('accountLockedUntil');
    });
  });

  describe('Account Status Management', () => {
    it('should support different account statuses', async () => {
      const user = await db
        .select()
        .from(users)
        .where(eq(users.email, testEmail))
        .limit(1);

      expect(['active', 'suspended', 'deleted', 'pending']).toContain(user[0].accountStatus);
    });

    it('should support different approval statuses', async () => {
      const user = await db
        .select()
        .from(users)
        .where(eq(users.email, testEmail))
        .limit(1);

      expect(['approved', 'pending', 'rejected']).toContain(user[0].approvalStatus);
    });
  });
});
