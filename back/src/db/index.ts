import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not defined. Please set it in your environment.');
}

export const pool = new Pool({ connectionString });
export const db = drizzle(pool, { schema });

export type Database = typeof db;
