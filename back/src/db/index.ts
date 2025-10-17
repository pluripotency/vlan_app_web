import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';
import { config } from '../config';

const connectionString = config.database.url;

export const pool = new Pool({ connectionString });
export const db = drizzle(pool, { schema });

export type Database = typeof db;
