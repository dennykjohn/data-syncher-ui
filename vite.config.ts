import path from "path";
import { defineConfig } from "vite";

import react from "@vitejs/plugin-react-swc";

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
