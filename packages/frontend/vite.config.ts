import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:3000",
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/setupTests.ts",
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: [
        "src/App.tsx",
        "src/router.tsx",
        "src/pages/**/*.tsx",
        "src/store/**/*.tsx",
        "src/components/**/*.tsx",
      ],
      thresholds: {
        lines: 80,
        statements: 80,
        functions: 78,
        branches: 65,
      },
    },
  },
});
