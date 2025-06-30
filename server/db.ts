import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Debug environment variables
console.log("Available environment variables:");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("DATABASE_URL exists:", !!process.env.DATABASE_URL);
console.log("All env vars starting with 'DATABASE':", Object.keys(process.env).filter(key => key.includes('DATABASE')));

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is missing from environment variables");
  console.error("Available variables:", Object.keys(process.env).sort());
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });
