import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    exclude: ["**/node_modules/**", "**/.tmp/**"],
    environment: "jsdom",
    globals: true,
    testTimeout: 15000,
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./"),
    },
  },
});
