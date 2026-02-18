import type { VercelRequest, VercelResponse } from "@vercel/node";
import "dotenv/config";
import express from "express";
import compression from "compression";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "../server/_core/oauth";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";
import { initializeWeatherCron } from "../server/weatherCron";
import { initializeNotificationCron } from "../server/notificationCron";
import { initializeNotificationScheduler } from "../server/services/notificationScheduler";

// Create Express app instance
const app = express();

// Enable compression middleware
app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req: any, res: any) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// Configure body parser
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Cache middleware for API responses
function cacheMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (req.path.startsWith('/api/')) {
    res.set('Cache-Control', 'public, max-age=300, s-maxage=300');
  }
  next();
}

app.use(cacheMiddleware);

// ============================================================================
// OAuth routes
// ============================================================================
registerOAuthRoutes(app);

// ============================================================================
// tRPC API routes
// ============================================================================
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

// ============================================================================
// Catch-all for undefined routes (return 404)
// ============================================================================
// NOTE: Static files are served by Vercel's built-in static file serving
// from the public/ directory. This function only handles API routes.
app.use((req: express.Request, res: express.Response) => {
  console.log(`[API] 404 Not Found: ${req.method} ${req.path}`);
  res.status(404).json({ error: 'Not found' });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Error Handler]', err);
  const isDev = process.env.NODE_ENV === 'development';
  const message = isDev ? err.message : 'Internal Server Error';
  const stack = isDev ? err.stack : undefined;
  res.status(err.status || 500).json({
    error: message,
    ...(stack && { stack }),
  });
});

// Initialize background jobs (only once)
let initialized = false;
if (!initialized) {
  initialized = true;
  try {
    initializeWeatherCron();
    initializeNotificationCron();
    initializeNotificationScheduler();
  } catch (e) {
    console.error('Error initializing background jobs:', e);
  }
}

// Vercel serverless handler
export default function handler(req: VercelRequest, res: VercelResponse) {
  return app(req, res);
}
