import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import compression from "compression";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { initializeWeatherCron } from "../weatherCron";
import { initializeNotificationCron } from "../notificationCron";
import { initializeWebSocketServer } from "./websocket";
import { initializeAlertScheduler } from "./alertScheduler";
import { scheduledReportExecutor } from "./scheduledReportExecutor";
import { initializeNotificationScheduler } from "../services/notificationScheduler";
import { RealTimeProductTracking } from "../services/realtimeProductTracking";

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
  // Cache static assets for 1 year (with content hash)
  if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|svg|webp|woff|woff2|ttf|eot)$/)) {
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
  }
  // Cache API responses for 5 minutes
  else if (req.path.startsWith('/api/')) {
    res.set('Cache-Control', 'public, max-age=300, s-maxage=300');
  }
  // Don't cache HTML pages
  else {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
  }
  next();
}

// Performance headers middleware
function performanceHeaders(req: express.Request, res: express.Response, next: express.NextFunction) {
  // Enable compression hints
  res.set('Vary', 'Accept-Encoding');
  
  // Add ETag for cache validation
  res.set('ETag', `"${Date.now()}"`);  
  
  // Preconnect hints for critical origins
  res.set('Link', '</assets>; rel=preconnect, <https://fonts.googleapis.com>; rel=preconnect, <https://fonts.gstatic.com>; rel=preconnect');
  
  next();
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  
  // Enable compression middleware (gzip + brotli)
  app.use(compression({
    level: 6,
    threshold: 1024, // Only compress responses larger than 1KB
    filter: (req: any, res: any) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    }
  }));
  
  // Apply performance headers
  app.use(performanceHeaders);
  
  // Apply cache middleware
  app.use(cacheMiddleware);
  
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // Global error handling middleware
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('[Error Handler]', err);
    
    // Don't send error details in production
    const isDev = process.env.NODE_ENV === 'development';
    const message = isDev ? err.message : 'Internal Server Error';
    const stack = isDev ? err.stack : undefined;
    
    res.status(err.status || 500).json({
      error: message,
      ...(stack && { stack }),
    });
  });

  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
    // Add security headers for production
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
  
  // Initialize real-time product tracking
  const productTracking = new RealTimeProductTracking(server);
  console.log('[ProductTracking] Real-time product tracking initialized');
  
  // Initialize alert scheduler
  initializeAlertScheduler();
  
  // Initialize scheduled report executor with improved error handling
  scheduledReportExecutor.start();
    
    // Initialize cron jobs after server starts
    initializeWeatherCron();
    initializeNotificationCron();
    
    // Initialize notification scheduler for automated reminders
    initializeNotificationScheduler();
  });
}

startServer().catch(console.error);
