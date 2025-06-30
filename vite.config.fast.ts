import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "client/src"),
      "@shared": path.resolve(process.cwd(), "shared"),
      "@assets": path.resolve(process.cwd(), "attached_assets"),
    },
  },
  root: path.resolve(process.cwd(), "client"),
  build: {
    outDir: path.resolve(process.cwd(), "dist/client"),
    emptyOutDir: true,
    minify: false, // Disable minification for faster build
    sourcemap: false, // Disable sourcemaps for faster build
    rollupOptions: {
      external: [], // Don't externalize anything
      output: {
        manualChunks: undefined, // Disable code splitting for faster build
      }
    },
  },
});