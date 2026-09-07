import { Pool } from "pg";
import { ensureSchema } from "./init";

// Lazily-created singleton pool. IMPORTANT: this module must not throw or
// attempt a connection at import time — `npm run build` imports route
// handlers (which import lib/db/store.ts, which imports this module) without
// any real POSTGRES_URL configured, and the build must not fail because of
// that. All actual connection attempts happen inside getPool(), which is only
// invoked when a request handler actually runs a query.
let pool: Pool | null = null;
let ensured: Promise<void> | null = null;

function getConnectionString(): string {
  const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "No database connection string configured. Set POSTGRES_URL (or " +
        "DATABASE_URL) in your environment. See README-DB.md for local " +
        "development setup."
    );
  }
  return connectionString;
}

function isLocalConnection(connectionString: string): boolean {
  return /localhost|127\.0\.0\.1/.test(connectionString);
}

function createPool(): Pool {
  const connectionString = getConnectionString();
  const local = isLocalConnection(connectionString);
  // Neon / Vercel Postgres require SSL; local dev Postgres typically doesn't
  // have SSL configured at all, so skip it there.
  return new Pool({
    connectionString,
    ssl: local ? undefined : { rejectUnauthorized: false },
  });
}

/**
 * Returns the singleton connection pool, creating it (and kicking off a
 * one-time `ensureSchema` call) on first use. Safe to call repeatedly —
 * subsequent calls reuse the same pool and await the same schema-ready
 * promise.
 */
export async function getPool(): Promise<Pool> {
  if (!pool) {
    pool = createPool();
  }
  if (!ensured) {
    ensured = ensureSchema(pool).catch((err) => {
      // Allow retry on next call if schema setup failed.
      ensured = null;
      throw err;
    });
  }
  await ensured;
  return pool;
}
