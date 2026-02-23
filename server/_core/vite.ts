import express from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";

export async function setupVite(app: express.Express, server: Server) {
  // Dynamic import - only loaded in development
  const { createServer: createViteServer } = await import("vite");
  const { default: viteConfig } = await import("../../vite.config");

  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: express.Express) {
  // Try multiple possible paths for the static files
  const possiblePaths = [
    // Vercel production path
    path.join(process.cwd(), "dist", "public"),
    // Relative to this file
    path.resolve(import.meta.dirname, "../../dist/public"),
    // Alternative: just dist
    path.join(process.cwd(), "dist"),
  ];

  let finalDistPath: string | null = null;
  let debugInfo: string[] = [];

  debugInfo.push(`[Static] Current working directory: ${process.cwd()}`);
  debugInfo.push(`[Static] Script directory: ${import.meta.dirname}`);

  // Find the first existing path
  for (const possiblePath of possiblePaths) {
    debugInfo.push(`[Static] Checking path: ${possiblePath}`);
    if (fs.existsSync(possiblePath)) {
      debugInfo.push(`[Static] ✓ Found: ${possiblePath}`);
      finalDistPath = possiblePath;
      break;
    } else {
      debugInfo.push(`[Static] ✗ Not found: ${possiblePath}`);
    }
  }

  // Log debug info
  debugInfo.forEach(msg => console.log(msg));

  if (!finalDistPath) {
    console.error("[Static] ERROR: Could not find dist/public directory!");
    console.error("[Static] Available directories:");
    try {
      const cwdContents = fs.readdirSync(process.cwd());
      console.error(`[Static] ${process.cwd()}: ${cwdContents.join(", ")}`);
    } catch (e) {
      console.error(`[Static] Could not read ${process.cwd()}`);
    }

    // Serve a debug page
    app.use("*", (_req, res) => {
      res.status(200).set({ "Content-Type": "text/html" }).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>FarmKonnect - Build Error</title>
            <style>
              body { font-family: monospace; padding: 20px; background: #f5f5f5; }
              .error { background: #fee; border: 1px solid #f00; padding: 10px; border-radius: 5px; }
              pre { background: #fff; padding: 10px; overflow-x: auto; }
            </style>
          </head>
          <body>
            <h1>FarmKonnect - Build Configuration Error</h1>
            <div class="error">
              <h2>Static files not found</h2>
              <p>The application could not locate the built static files.</p>
              <h3>Debug Information:</h3>
              <pre>${debugInfo.join("\n")}</pre>
              <p><strong>This is a build/deployment configuration issue, not an application error.</strong></p>
            </div>
          </body>
        </html>
      `);
    });
    return;
  }

  console.log(`[Static] ✓ Serving static files from: ${finalDistPath}`);

  // Serve static files with proper cache headers
  app.use(express.static(finalDistPath, {
    maxAge: "1d",
    etag: false,
  }));

  // Serve index.html for all routes that don't match a file
  app.use("*", (req, res) => {
    const indexPath = path.resolve(finalDistPath, "index.html");
    
    if (!fs.existsSync(indexPath)) {
      console.error(`[Static] index.html not found at: ${indexPath}`);
      res.status(404).send("index.html not found");
      return;
    }

    // Set proper headers for index.html
    res.set({
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
    });

    res.sendFile(indexPath);
  });
}
