import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();

// Convert import.meta.url to a directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------------------------
// 1️⃣ Serve static files
// ---------------------------
const staticPath = path.resolve(__dirname, "public");
app.use(express.static(staticPath));

// ---------------------------
// 2️⃣ SPA fallback
// ---------------------------
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
