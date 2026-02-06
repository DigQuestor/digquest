import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const app = express();

// ES module replacement for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from dist/public
const staticPath = path.resolve(__dirname, "public");
app.use(express.static(staticPath));

// Verify files exist at startup
const filesToCheck = ["sitemap.xml", "robots.txt"];
filesToCheck.forEach((file) => {
  const fullPath = path.join(staticPath, file);
  if (fs.existsSync(fullPath)) {
    console.log(`✅ Found ${file} at ${fullPath}`);
  } else {
    console.warn(`⚠️ Missing ${file}! Expected at ${fullPath}`);
  }
});

// Explicit routes for sitemap and robots
app.get("/sitemap.xml", (_req, res) => {
  res.sendFile(path.resolve(staticPath, "sitemap.xml"));
});

app.get("/robots.txt", (_req, res) => {
  res.sendFile(path.resolve(staticPath, "robots.txt"));
});

// SPA fallback (React frontend)
app.use("*", (_req, res) => {
  res.sendFile(path.resolve(__dirname, "../index.html"));
});

// Start server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
