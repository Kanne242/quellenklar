import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';

const here = dirname(fileURLToPath(import.meta.url));
const supabaseDir = join(here, '..', '..', '..', 'supabase');

export const DEMO_USER = '00000000-0000-4000-8000-000000000001';
export const DEMO_PROJECT = '10000000-0000-4000-8000-000000000001';
export const OTHER_USER = '00000000-0000-4000-8000-000000000002';

/** Erzeugt eine frische Datenbank mit allen Migrationen und optional den Testdaten. */
export async function createTestDb(options: { seed?: boolean } = {}): Promise<PGlite> {
  const db = await PGlite.create({ extensions: { pgcrypto } });
  await db.exec(readFileSync(join(here, 'supabase-stubs.sql'), 'utf8'));

  const migrationsDir = join(supabaseDir, 'migrations');
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();
  for (const file of files) {
    try {
      await db.exec(readFileSync(join(migrationsDir, file), 'utf8'));
    } catch (error) {
      throw new Error(`Migration ${file} fehlgeschlagen: ${(error as Error).message}`, {
        cause: error,
      });
    }
  }
  // Wie in Supabase: Backend-Rolle darf alles im Schema public.
  await db.exec('grant all on all tables in schema public to service_role;');

  if (options.seed) {
    await db.exec(readFileSync(join(supabaseDir, 'seed.sql'), 'utf8'));
  }
  return db;
}

/** Führt Abfragen als angemeldeter Nutzer (Rolle `authenticated`) aus. */
export async function asUser<T>(db: PGlite, userId: string, fn: () => Promise<T>): Promise<T> {
  await db.exec(`set request.jwt.claim.sub = '${userId}'; set role authenticated;`);
  try {
    return await fn();
  } finally {
    await db.exec(`reset role; reset request.jwt.claim.sub;`);
  }
}

export async function asAnon<T>(db: PGlite, fn: () => Promise<T>): Promise<T> {
  await db.exec('set role anon;');
  try {
    return await fn();
  } finally {
    await db.exec('reset role;');
  }
}

export async function createAuthUser(db: PGlite, id: string, email: string): Promise<void> {
  await db.query('insert into auth.users (id, email) values ($1, $2)', [id, email]);
}
