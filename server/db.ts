import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Determine if we need SSL based on the connection string
const needsSSL = process.env.DATABASE_URL?.includes('neon.tech') || 
                 process.env.DATABASE_URL?.includes('amazonaws.com') ||
                 process.env.DATABASE_URL?.includes('azure.com');

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: needsSSL ? { rejectUnauthorized: false } : false
});
export const db = drizzle({ client: pool, schema });