import type { Pool } from "pg";

// Inlined copy of lib/db/schema.sql (kept there as a human-readable
// reference). Inlining avoids fragile on-disk file reads from inside a
// Next.js-bundled serverless function at request time.
const DDL = `
CREATE TABLE IF NOT EXISTS users (
  id text PRIMARY KEY,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  role text NOT NULL,
  created_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS profiles (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id),
  display_name text NOT NULL,
  created_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);

CREATE TABLE IF NOT EXISTS assessments (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id),
  profile_id text NOT NULL REFERENCES profiles(id),
  version integer NOT NULL,
  created_at timestamptz NOT NULL,
  answers jsonb NOT NULL,
  run jsonb NOT NULL,
  status text NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_assessments_user_id ON assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_assessments_profile_id ON assessments(profile_id);
CREATE INDEX IF NOT EXISTS idx_assessments_created_at ON assessments(created_at);

CREATE TABLE IF NOT EXISTS audit_events (
  id text PRIMARY KEY,
  user_id text,
  type text NOT NULL,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_events_created_at ON audit_events(created_at);

CREATE TABLE IF NOT EXISTS model_config_versions (
  id text PRIMARY KEY,
  version text NOT NULL,
  saved_at timestamptz NOT NULL,
  saved_by_user_id text NOT NULL,
  config jsonb NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_model_config_versions_saved_at ON model_config_versions(saved_at);
`;

let schemaEnsured: Promise<void> | null = null;

/**
 * Idempotently creates all tables/indexes if they don't already exist. Safe
 * to call on every cold start — memoized per-process so it only actually
 * hits the DB once. Callers should `await` this before their first query
 * (lib/db/pg.ts's pool getter does this automatically).
 */
export function ensureSchema(pool: Pool): Promise<void> {
  if (!schemaEnsured) {
    schemaEnsured = pool.query(DDL).then(
      () => undefined,
      (err) => {
        // Allow retry on next call if this attempt failed (e.g. transient
        // connection error at cold start).
        schemaEnsured = null;
        throw err;
      }
    );
  }
  return schemaEnsured;
}
