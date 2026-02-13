import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "client", "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
  },
  root: "./client",
  build: {
    outDir: "../dist/public",
    emptyOutDir: true,
    rollupOptions: {
      input: "./client/index.html",
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            return;
          }

          if (id.includes("react") || id.includes("scheduler")) {
            return "vendor-react";
          }

          if (id.includes("@tanstack/react-query")) {
            return "vendor-query";
          }

          if (id.includes("@radix-ui")) {
            return "vendor-radix";
          }

          if (id.includes("react-hook-form") || id.includes("@hookform/resolvers") || id.includes("zod")) {
            return "vendor-forms";
          }

          if (id.includes("lucide-react") || id.includes("react-icons")) {
            return "vendor-icons";
          }

          if (id.includes("recharts") || id.includes("embla-carousel")) {
            return "vendor-viz";
          }

          if (id.includes("wouter") || id.includes("react-helmet")) {
            return "vendor-routing";
          }

          return "vendor-misc";
        },
      },
    },
  },
});
