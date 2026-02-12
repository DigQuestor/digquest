import pkg from 'pg';
const { Pool } = pkg;
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "./schema.js";

// Allow running without database in development mode
let pool: any = null;
let db: any = null;

if (!process.env.DATABASE_URL) {
  console.warn("⚠️  DATABASE_URL not set - database features will be unavailable (using memory storage)");
} else {
  pool = new Pool({ 
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
  db = drizzle(pool, { schema });
}

export { pool, db };
