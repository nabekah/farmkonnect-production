import { defineConfig } from "vitest/config";
import path from "path";

const templateRoot = path.resolve(import.meta.dirname);

export default defineConfig({
  root: templateRoot,
  resolve: {
    alias: {
      "@": path.resolve(templateRoot, "client", "src"),
      "@shared": path.resolve(templateRoot, "shared"),
      "@assets": path.resolve(templateRoot, "attached_assets"),
    },
  },
  test: {
    environment: "node",
    include: ["server/**/*.test.ts", "server/**/*.spec.ts"],
    // Performance optimizations
    threads: true,
    maxThreads: 4,
    minThreads: 1,
    isolate: true,
    globals: true,
    // Parallel test execution
    testTimeout: 10000,
    hookTimeout: 10000,
    // Coverage optimization
    coverage: {
      enabled: false,
    },
    // Disable reporters for faster execution
    reporters: ["default"],
    // Cache test results
    cache: {
      dir: ".vitest",
    },
  },
});
