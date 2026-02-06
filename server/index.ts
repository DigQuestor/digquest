import express from "express";
import path from "path";

const app = express();

// ---------------------------
// 1️⃣ Serve static files
// ---------------------------
// After build, dist/public contains sitemap.xml, robots.txt, and other static assets
const staticPath = path.resolve(__dirname, "public");
app.use(express.static(staticPath));

// ---------------------------
// 2️⃣ SPA fallback
// ---------------------------
// Serve your index.html for all other routes (React SPA)
app.use("*", (_req, res) => {
  res.sendFile(path.resolve(__dirname, "../client/index.html"));
});

// ---------------------------
// 3️⃣ Start the server
// ---------------------------
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
