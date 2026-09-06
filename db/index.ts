import { env } from 'cloudflare:workers';

const schemaSql = `
  CREATE TABLE IF NOT EXISTS synced_states (
    key TEXT PRIMARY KEY NOT NULL,
    payload TEXT NOT NULL,
    revision INTEGER NOT NULL DEFAULT 1,
    updated_at TEXT NOT NULL
  )
`;

export async function getSyncDatabase() {
  const database = (env as unknown as { DB?: D1Database }).DB;
  if (!database) throw new Error('Cloud sync database is unavailable.');
  await database.prepare(schemaSql).run();
  return database;
}
