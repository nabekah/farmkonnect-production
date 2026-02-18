import type { VercelRequest, VercelResponse } from "@vercel/node";
import "dotenv/config";
import express from "express";
import compression from "compression";
import path from "path";
import fs from "fs";
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
// Static files from public directory
// ============================================================================
// Use process.cwd() to get the correct path in Vercel Functions
const publicDir = path.join(process.cwd(), 'public');

// Serve static files with proper cache headers
app.use(express.static(publicDir, {
  maxAge: '1d',
  etag: false,
  index: false, // Don't auto-serve index.html
}));

// ============================================================================
// SPA fallback: serve index.html for all non-API, non-static routes
// ============================================================================
app.get('*', (req: express.Request, res: express.Response) => {
  const indexPath = path.join(publicDir, 'index.html');
  
  try {
    if (fs.existsSync(indexPath)) {
      res.set({
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      });
      res.sendFile(indexPath);
    } else {
      console.error(`[SPA] index.html not found at: ${indexPath}`);
      res.status(404).json({ error: 'Not found' });
    }
  } catch (err) {
    console.error(`[SPA] Error serving index.html:`, err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
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
