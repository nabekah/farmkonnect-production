import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, InsertUserAuthProvider, users, userAuthProviders } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId && !user.googleId) {
    throw new Error("User must have either openId or googleId");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {};
    const updateSet: Record<string, unknown> = {};

    if (user.openId) {
      values.openId = user.openId;
    }
    if (user.googleId) {
      values.googleId = user.googleId;
    }

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserById(id: number | string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
  const result = await db.select().from(users).where(eq(users.id, numericId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByGoogleId(googleId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.googleId, googleId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function addAuthProvider(userId: number, provider: InsertUserAuthProvider) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot add auth provider: database not available");
    return;
  }

  try {
    await db.insert(userAuthProviders).values({
      userId,
      provider: provider.provider,
      providerId: provider.providerId,
    });
  } catch (error) {
    console.error("[Database] Failed to add auth provider:", error);
    throw error;
  }
}

export async function getUserAuthProviders(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get auth providers: database not available");
    return [];
  }

  const result = await db.select().from(userAuthProviders).where(eq(userAuthProviders.userId, userId));

  return result;
}

// TODO: add feature queries here as your schema grows.

// Create a new user during registration using raw SQL to bypass Drizzle ORM issues
export async function createUserAccount(userData: {
  name: string;
  email: string;
  phone?: string;
  role: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  // Check if user already exists using Drizzle
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, userData.email))
    .limit(1);

  if (existing.length > 0) {
    throw new Error("Email already registered");
  }

  // Use Drizzle's sql function to execute raw SQL with all parameters
  try {
    const phone = userData.phone || null;
    const role = userData.role || "user";
    
    // Execute raw SQL insert using Drizzle's sql function
    // Note: We exclude openId and googleId since they cannot be null in the database
    await db.execute(sql`
      INSERT INTO users (
        name, email, phone, role, loginMethod, approvalStatus, accountStatus, 
        mfaEnabled, failedLoginAttempts, accountStatusReason, mfaSecret, 
        mfaBackupCodes, lastFailedLoginAt, accountLockedUntil
      ) VALUES (
        ${userData.name}, ${userData.email}, ${phone}, ${role}, 
        ${"manual"}, ${"pending"}, ${"active"}, ${false}, ${0}, 
        ${null}, ${null}, ${null}, ${null}, ${null}
      )
    `);
    
    // Fetch and return the created user
    const createdUser = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        role: users.role,
        approvalStatus: users.approvalStatus,
        loginMethod: users.loginMethod,
      })
      .from(users)
      .where(eq(users.email, userData.email))
      .limit(1);

    if (!createdUser || createdUser.length === 0) {
      throw new Error("Failed to retrieve created user");
    }

    return createdUser[0];
  } catch (error: any) {
    console.error("Raw SQL insert error:", error);
    throw error;
  }
}
