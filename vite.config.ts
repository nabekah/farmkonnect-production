import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";

const plugins = [react(), tailwindcss()];

export default defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    minify: "terser",
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom"],
          "vendor-ui": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-select",
            "@radix-ui/react-tabs",
          ],
          "vendor-charts": ["chart.js", "react-chartjs-2"],
          "vendor-trpc": ["@trpc/client", "@trpc/react-query"],
          "vendor-utils": ["date-fns", "clsx", "tailwind-merge"],
        },
      },
    },
    reportCompressedSize: true,
    chunkSizeWarningLimit: 500,
    cssCodeSplit: true,
  },
  server: {
    host: "0.0.0.0",
    middlewareMode: false,
    allowedHosts: true as const,
    hmr: {
      overlay: false,
    },
    fs: {
      strict: false,
      allow: ["."],
    },
    cors: true,
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "@trpc/client",
      "@trpc/react-query",
      "chart.js",
      "react-chartjs-2",
      "date-fns",
    ],
  },
});
