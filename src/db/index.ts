import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';
import { seedIfEmpty } from './seed';

const url = process.env.DATABASE_URL || 'file:hydroponics.db';

export const client = createClient({
  url,
});

export const db = drizzle(client, { schema });

export async function initDb() {
  await client.execute('PRAGMA foreign_keys = ON;');
  await client.execute('PRAGMA journal_mode = WAL;');
  await client.execute('PRAGMA busy_timeout = 5000;');
  
  await client.execute(`
    CREATE TABLE IF NOT EXISTS plants (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      scientific_name TEXT,
      category TEXT NOT NULL,
      ph_min REAL NOT NULL,
      ph_max REAL NOT NULL,
      ec_min REAL NOT NULL,
      ec_max REAL NOT NULL,
      cf_min REAL NOT NULL,
      cf_max REAL NOT NULL,
      ppm500_min INTEGER NOT NULL,
      ppm500_max INTEGER NOT NULL,
      ppm700_min INTEGER NOT NULL,
      ppm700_max INTEGER NOT NULL,
      is_custom_calculations INTEGER NOT NULL DEFAULT 0,
      temp_min_c REAL,
      temp_max_c REAL,
      light_requirement TEXT NOT NULL DEFAULT '12 - 16 hours/day',
      growth_tips TEXT,
      image_url TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS plant_issues (
      id TEXT PRIMARY KEY,
      plant_id TEXT NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      cause_description TEXT NOT NULL,
      resolution_description TEXT NOT NULL,
      image_url TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);
}

let dbInitPromise: Promise<void> | null = null;
export async function ensureDb(): Promise<void> {
  if (!dbInitPromise) {
    dbInitPromise = (async () => {
      await initDb();
      await seedIfEmpty();
    })();
  }
  return dbInitPromise;
}

export * from './schema';
