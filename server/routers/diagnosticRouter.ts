import { router, publicProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Diagnostic router for troubleshooting Railway deployment
 */
export const diagnosticRouter = router({
  /**
   * Check if database connection is working
   */
  checkDatabase: publicProcedure.query(async () => {
    try {
      const db = await getDb();
      if (!db) {
        return {
          status: "error",
          message: "Database connection failed - getDb() returned null",
          timestamp: new Date().toISOString(),
        };
      }

      // Try a simple query
      const result = await db.execute("SELECT 1 as test");
      return {
        status: "success",
        message: "Database connection successful",
        result,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: "error",
        message: `Database error: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date().toISOString(),
      };
    }
  }),

  /**
   * Check environment variables
   */
  checkEnv: publicProcedure.query(() => {
    const envVars = {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL: process.env.DATABASE_URL ? "SET" : "NOT SET",
      JWT_SECRET: process.env.JWT_SECRET ? "SET" : "NOT SET",
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? "SET" : "NOT SET",
      SENDGRID_API_KEY: process.env.SENDGRID_API_KEY ? "SET" : "NOT SET",
      PORT: process.env.PORT || "3000",
    };

    return {
      status: "success",
      envVars,
      timestamp: new Date().toISOString(),
    };
  }),

  /**
   * Check if admin account exists
   */
  checkAdminAccount: publicProcedure.query(async () => {
    try {
      const db = await getDb();
      if (!db) {
        return {
          status: "error",
          message: "Database connection failed",
          timestamp: new Date().toISOString(),
        };
      }

      // Check if admin account exists using Drizzle ORM
      const adminUsers = await db
        .select({
          id: users.id,
          email: users.email,
          emailVerified: users.emailVerified,
          approvalStatus: users.approvalStatus,
          accountStatus: users.accountStatus,
        })
        .from(users)
        .where(eq(users.email, "admin@farmkonnect.com"))
        .limit(1);

      if (!adminUsers || adminUsers.length === 0) {
        return {
          status: "error",
          message: "Admin account not found",
          timestamp: new Date().toISOString(),
        };
      }

      const admin = adminUsers[0];
      return {
        status: "success",
        admin: {
          email: admin.email,
          emailVerified: admin.emailVerified,
          approvalStatus: admin.approvalStatus,
          accountStatus: admin.accountStatus,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: "error",
        message: `Error checking admin account: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date().toISOString(),
      };
    }
  }),

  /**
   * Health check endpoint
   */
  health: publicProcedure.query(() => {
    return {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }),
});
