import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();

// ES module __dirname replacement
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from dist/public
const staticPath = path.resolve(__dirname, "public");
app.use(express.static(staticPath));

// Explicitly serve sitemap.xml and robots.txt
app.get("/sitemap.xml", (_req, res) => {
  res.sendFile(path.resolve(staticPath, "sitemap.xml"));
});

app.get("/robots.txt", (_req, res) => {
  res.sendFile(path.resolve(staticPath, "robots.txt"));
});

// Serve frontend fallback for React SPA
app.use("*", (_req, res) => {
  res.sendFile(path.resolve(__dirname, "../index.html"));
});

// Start server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
