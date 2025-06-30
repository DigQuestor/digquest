import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  root: ".",
  resolve: {
    alias: {
      "@": path.resolve("./client/src"),
      "@shared": path.resolve("./shared"),
      "@assets": path.resolve("./attached_assets"),
    },
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
  },
  build: {
    outDir: "dist/client",
    emptyOutDir: true,
    rollupOptions: {
      input: "./index.html",
    },
  },
});