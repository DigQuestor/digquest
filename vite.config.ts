import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  root: "client", // Set client as the root directory for Vite
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client/src"),
      "@shared": path.resolve(__dirname, "client/shared") // <-- match TS path alias
    }
  },
  build: {
    outDir: "../dist/public" // Output relative to root (client dir)
  },
  server: {
    port: 5173,
    host: true // Allow external access
  }
});
