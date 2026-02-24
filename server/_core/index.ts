import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import compression from "compression";
import cookieParser from "cookie-parser";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
// Dynamic import for vite (dev only) - serveStatic is always available
let setupVite: ((app: express.Express, server: any) => Promise<void>) | null = null;
let serveStatic: ((app: express.Express) => void) | null = null;
import { initializeWebSocketServer } from "./websocket";

// Optional cron imports - wrapped in try/catch for Railway compatibility
let initializeWeatherCron: (() => void) | null = null;
let initializeNotificationCron: (() => void) | null = null;
let initializeAlertScheduler: (() => void) | null = null;
let scheduledReportExecutor: { start: () => void } | null = null;
let initializeNotificationScheduler: (() => void) | null = null;
let RealTimeProductTracking: (new (server: any) => any) | null = null;

try {
  const weatherCron = await import("../weatherCron");
  initializeWeatherCron = weatherCron.initializeWeatherCron;
} catch (e) {
  console.warn("[Init] Weather cron not available:", (e as Error).message);
}

try {
  const notifCron = await import("../notificationCron");
  initializeNotificationCron = notifCron.initializeNotificationCron;
} catch (e) {
  console.warn("[Init] Notification cron not available:", (e as Error).message);
}

try {
  const alertSched = await import("./alertScheduler");
  initializeAlertScheduler = alertSched.initializeAlertScheduler;
} catch (e) {
  console.warn("[Init] Alert scheduler not available:", (e as Error).message);
}

try {
  const reportExec = await import("./scheduledReportExecutor");
  scheduledReportExecutor = reportExec.scheduledReportExecutor;
} catch (e) {
  console.warn("[Init] Report executor not available:", (e as Error).message);
}

try {
  const notifSched = await import("../services/notificationScheduler");
  initializeNotificationScheduler = notifSched.initializeNotificationScheduler;
} catch (e) {
  console.warn("[Init] Notification scheduler not available:", (e as Error).message);
}

try {
  const productTracking = await import("../services/realtimeProductTracking");
  RealTimeProductTracking = productTracking.RealTimeProductTracking;
} catch (e) {
  console.warn("[Init] Product tracking not available:", (e as Error).message);
}

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

// Cache middleware for static assets and API responses
function cacheMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|svg|webp|woff|woff2|ttf|eot)$/)) {
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
  } else if (req.path.startsWith('/api/')) {
    res.set('Cache-Control', 'public, max-age=300, s-maxage=300');
  } else {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
  }
  next();
}

// Performance headers middleware
function performanceHeaders(req: express.Request, res: express.Response, next: express.NextFunction) {
  res.set('Vary', 'Accept-Encoding');
  res.set('Link', '</assets>; rel=preconnect, <https://fonts.googleapis.com>; rel=preconnect, <https://fonts.gstatic.com>; rel=preconnect');
  next();
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  
  // Enable compression
  app.use(compression({
    level: 6,
    threshold: 1024,
    filter: (req: any, res: any) => {
      if (req.headers['x-no-compression']) return false;
      return compression.filter(req, res);
    }
  }));
  
  app.use(performanceHeaders);
  app.use(cacheMiddleware);
  
  // Cookie parser - required for session authentication
  app.use(cookieParser());
  
  // Body parser with larger limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  
  // OAuth routes (Google OAuth + health check)
  registerOAuthRoutes(app);

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // Global error handling
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

  // Vite dev server or static file serving
  if (process.env.NODE_ENV === "development") {
    const viteModule = await import("./vite");
    await viteModule.setupVite(app, server);
  } else {
    const viteModule = await import("./vite");
    viteModule.serveStatic(app);
    // Security headers for production
    app.use((req, res, next) => {
      res.set('X-Content-Type-Options', 'nosniff');
      res.set('X-Frame-Options', 'SAMEORIGIN');
      res.set('X-XSS-Protection', '1; mode=block');
      res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
      next();
    });
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    
    // Initialize WebSocket server
    initializeWebSocketServer(server);
    
    // Initialize optional services
    if (RealTimeProductTracking) {
      try {
        new RealTimeProductTracking(server);
        console.log('[ProductTracking] Real-time product tracking initialized');
      } catch (e) {
        console.warn('[ProductTracking] Failed to initialize:', (e as Error).message);
      }
    }
    
    if (initializeAlertScheduler) {
      try { initializeAlertScheduler(); } catch (e) { console.warn('[AlertScheduler] Failed:', (e as Error).message); }
    }
    
    if (scheduledReportExecutor) {
      try { scheduledReportExecutor.start(); } catch (e) { console.warn('[ReportExecutor] Failed:', (e as Error).message); }
    }
    
    if (initializeWeatherCron) {
      try { initializeWeatherCron(); } catch (e) { console.warn('[WeatherCron] Failed:', (e as Error).message); }
    }
    
    if (initializeNotificationCron) {
      try { initializeNotificationCron(); } catch (e) { console.warn('[NotificationCron] Failed:', (e as Error).message); }
    }
    
    if (initializeNotificationScheduler) {
      try { initializeNotificationScheduler(); } catch (e) { console.warn('[NotificationScheduler] Failed:', (e as Error).message); }
    }
  });
}

startServer().catch(console.error);
