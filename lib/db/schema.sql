-- Human-readable reference copy of the schema. The application does NOT read
-- this file at runtime (Next.js bundling of on-disk file reads inside
-- serverless functions is fragile) — the same DDL is inlined as a template
-- string in lib/db/init.ts, which is what actually runs against the DB. Keep
-- the two in sync if you change one.

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
