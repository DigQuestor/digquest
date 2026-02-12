import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import pg from "pg";
import { registerRoutes } from "./routes.js";
import { runMigrations } from "./db/migrate.js";

const PgStore = connectPgSimple(session);
const { Pool } = pg;

const app = express();

// ES module replacement for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from dist/public
// Middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Trust proxy - required for secure cookies behind reverse proxies like Render
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

// Create PostgreSQL connection pool for session store
const sessionPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false
});

// Session middleware with persistent PostgreSQL store
app.use(session({
  store: new PgStore({
    pool: sessionPool,
    tableName: 'session', // Table name for storing sessions
    createTableIfMissing: true, // Auto-create session table if it doesn't exist
  }),
  secret: process.env.SESSION_SECRET || "your-secret-key",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
  }
}));

// Run database migrations on startup
if (process.env.DATABASE_URL) {
  await runMigrations();
}

// Register API routes
await registerRoutes(app);

// Serve static files from dist/public
// Serve static files from dist/public
const staticPath = path.resolve(__dirname, "../dist/public");
app.use(express.static(staticPath));

// Note: sitemap.xml and robots.txt are handled dynamically in routes.ts

// SPA fallback (React frontend)
app.use("*", (_req, res) => {
  res.sendFile(path.resolve(staticPath, "index.html"));
});

// Start server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
