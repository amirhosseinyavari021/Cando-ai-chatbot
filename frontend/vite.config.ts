import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// In dev, we proxy /api → backend. In prod, Nginx must proxy /api to backend.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:5001", // keep consistent with backend PORT
        changeOrigin: true,
      },
    },
  },
});
