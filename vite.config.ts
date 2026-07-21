import path from "path";

import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vitest/config";

// Local Django (runserver). Override with VITE_DEV_PROXY_TARGET=http://127.0.0.1:8000
const devApiTarget =
  process.env.VITE_DEV_PROXY_TARGET || "http://127.0.0.1:8000";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
  server: {
    proxy: {
      // Same-origin /api → Django: avoids CORS on http://localhost:5173 → http://127.0.0.1:8000
      "/api": {
        target: devApiTarget,
        changeOrigin: true,
      },
    },
  },
});
