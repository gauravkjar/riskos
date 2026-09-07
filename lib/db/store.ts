import { randomUUID } from "crypto";
import type { PoolClient } from "pg";
import { getPool } from "./pg";
import type {
  AuditEvent,
  InvestorProfile,
  ModelConfigVersion,
  RiskAssessment,
  RiskAssessmentStatus,
  User,
} from "./schema";
import type { EngineConfig } from "@/lib/config/types";
import { defaultEngineConfig } from "@/lib/config/defaults";

function nowIso(): string {
  return new Date().toISOString();
}

// ---------- Row -> domain mapping ----------

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  role: string;
  created_at: string | Date;
}

function toIso(value: string | Date): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function mapUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    role: row.role as User["role"],
    createdAt: toIso(row.created_at),
  };
}

interface ProfileRow {
  id: string;
  user_id: string;
  display_name: string;
  created_at: string | Date;
}

function mapProfile(row: ProfileRow): InvestorProfile {
  return {
    id: row.id,
    userId: row.user_id,
    displayName: row.display_name,
    createdAt: toIso(row.created_at),
  };
}

interface AssessmentRow {
  id: string;
  user_id: string;
  profile_id: string;
  version: number;
  created_at: string | Date;
  answers: RiskAssessment["answers"];
  run: RiskAssessment["run"];
  status: string;
}

function mapAssessment(row: AssessmentRow): RiskAssessment {
  return {
    id: row.id,
    userId: row.user_id,
    profileId: row.profile_id,
    version: row.version,
    createdAt: toIso(row.created_at),
    // pg returns jsonb columns already parsed as JS objects/arrays.
    answers: row.answers,
    run: row.run,
    status: row.status as RiskAssessmentStatus,
  };
}

interface AuditEventRow {
  id: string;
  user_id: string | null;
  type: string;
  payload: Record<string, unknown>;
  created_at: string | Date;
}

function mapAuditEvent(row: AuditEventRow): AuditEvent {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    payload: row.payload,
    createdAt: toIso(row.created_at),
  };
}

interface ModelConfigVersionRow {
  id: string;
  version: string;
  saved_at: string | Date;
  saved_by_user_id: string;
  config: EngineConfig;
}

function mapModelConfigVersion(row: ModelConfigVersionRow): ModelConfigVersion {
  return {
    id: row.id,
    version: row.version,
    savedAt: toIso(row.saved_at),
    savedByUserId: row.saved_by_user_id,
    config: row.config,
  };
}

// ---------- Users ----------

export async function getUserByEmail(email: string): Promise<User | null> {
  const pool = await getPool();
  const normalized = email.trim().toLowerCase();
  const { rows } = await pool.query<UserRow>(
    "SELECT id, email, password_hash, role, created_at FROM users WHERE lower(email) = $1",
    [normalized]
  );
  return rows[0] ? mapUser(rows[0]) : null;
}

export async function getUserById(id: string): Promise<User | null> {
  const pool = await getPool();
  const { rows } = await pool.query<UserRow>(
    "SELECT id, email, password_hash, role, created_at FROM users WHERE id = $1",
    [id]
  );
  return rows[0] ? mapUser(rows[0]) : null;
}

export async function createUser(input: {
  email: string;
  passwordHash: string;
  role: User["role"];
}): Promise<User> {
  const pool = await getPool();
  const normalizedEmail = input.email.trim().toLowerCase();

  const existing = await pool.query<{ id: string }>(
    "SELECT id FROM users WHERE lower(email) = $1",
    [normalizedEmail]
  );
  if (existing.rows.length > 0) {
    throw new Error("A user with this email already exists.");
  }

  const user: User = {
    id: randomUUID(),
    email: normalizedEmail,
    passwordHash: input.passwordHash,
    role: input.role,
    createdAt: nowIso(),
  };
  await pool.query(
    "INSERT INTO users (id, email, password_hash, role, created_at) VALUES ($1, $2, $3, $4, $5)",
    [user.id, user.email, user.passwordHash, user.role, user.createdAt]
  );
  return user;
}

export async function getAllUsers(): Promise<User[]> {
  const pool = await getPool();
  const { rows } = await pool.query<UserRow>(
    "SELECT id, email, password_hash, role, created_at FROM users"
  );
  return rows.map(mapUser);
}

export async function hasAnyUserWithRole(role: User["role"]): Promise<boolean> {
  const pool = await getPool();
  const { rows } = await pool.query<{ exists: boolean }>(
    "SELECT EXISTS(SELECT 1 FROM users WHERE role = $1) AS exists",
    [role]
  );
  return rows[0]?.exists ?? false;
}

// ---------- Investor profiles ----------

export async function createProfile(input: {
  userId: string;
  displayName: string;
}): Promise<InvestorProfile> {
  const pool = await getPool();
  const profile: InvestorProfile = {
    id: randomUUID(),
    userId: input.userId,
    displayName: input.displayName,
    createdAt: nowIso(),
  };
  await pool.query(
    "INSERT INTO profiles (id, user_id, display_name, created_at) VALUES ($1, $2, $3, $4)",
    [profile.id, profile.userId, profile.displayName, profile.createdAt]
  );
  return profile;
}

export async function getProfilesByUser(userId: string): Promise<InvestorProfile[]> {
  const pool = await getPool();
  const { rows } = await pool.query<ProfileRow>(
    "SELECT id, user_id, display_name, created_at FROM profiles WHERE user_id = $1",
    [userId]
  );
  return rows.map(mapProfile);
}

// ---------- Risk assessments ----------

export async function createAssessment(input: {
  userId: string;
  profileId: string;
  answers: RiskAssessment["answers"];
  run: RiskAssessment["run"];
}): Promise<RiskAssessment> {
  const pool = await getPool();
  const client: PoolClient = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows: countRows } = await client.query<{ count: string }>(
      "SELECT COUNT(*)::int AS count FROM assessments WHERE profile_id = $1",
      [input.profileId]
    );
    const priorCount = Number(countRows[0]?.count ?? 0);
    const version = priorCount + 1;

    // Never overwrite/delete history: mark prior versions superseded, then
    // append a new one, atomically.
    await client.query("UPDATE assessments SET status = $1 WHERE profile_id = $2", [
      "superseded",
      input.profileId,
    ]);

    const assessment: RiskAssessment = {
      id: randomUUID(),
      userId: input.userId,
      profileId: input.profileId,
      version,
      createdAt: nowIso(),
      answers: input.answers,
      run: input.run,
      status: "active",
    };

    await client.query(
      `INSERT INTO assessments
        (id, user_id, profile_id, version, created_at, answers, run, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        assessment.id,
        assessment.userId,
        assessment.profileId,
        assessment.version,
        assessment.createdAt,
        JSON.stringify(assessment.answers),
        JSON.stringify(assessment.run),
        assessment.status,
      ]
    );

    await client.query("COMMIT");
    return assessment;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function getAssessmentsByUser(userId: string): Promise<RiskAssessment[]> {
  const pool = await getPool();
  const { rows } = await pool.query<AssessmentRow>(
    `SELECT id, user_id, profile_id, version, created_at, answers, run, status
     FROM assessments WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );
  return rows.map(mapAssessment);
}

/**
 * Returns the assessment only if it belongs to `requestingUserId`. This is
 * the primary ownership check; API routes must ALSO re-check ownership (or
 * role) on the returned record before responding, per the belt-and-suspenders
 * requirement.
 */
export async function getAssessmentById(
  id: string,
  requestingUserId: string
): Promise<RiskAssessment | null> {
  const pool = await getPool();
  const { rows } = await pool.query<AssessmentRow>(
    `SELECT id, user_id, profile_id, version, created_at, answers, run, status
     FROM assessments WHERE id = $1`,
    [id]
  );
  const row = rows[0];
  if (!row) return null;
  if (row.user_id !== requestingUserId) return null;
  return mapAssessment(row);
}

/**
 * Admin-only in intent: returns ALL assessments across ALL users. This
 * function does not itself check role — callers (route handlers) must gate
 * access with `requireRole(...)` before calling this.
 */
export async function getAllAssessments(): Promise<RiskAssessment[]> {
  const pool = await getPool();
  const { rows } = await pool.query<AssessmentRow>(
    `SELECT id, user_id, profile_id, version, created_at, answers, run, status
     FROM assessments ORDER BY created_at DESC`
  );
  return rows.map(mapAssessment);
}

// ---------- Audit events ----------

export async function appendAuditEvent(input: {
  userId: string | null;
  type: string;
  payload: Record<string, unknown>;
}): Promise<AuditEvent> {
  const pool = await getPool();
  const event: AuditEvent = {
    id: randomUUID(),
    userId: input.userId,
    type: input.type,
    payload: input.payload,
    createdAt: nowIso(),
  };
  await pool.query(
    "INSERT INTO audit_events (id, user_id, type, payload, created_at) VALUES ($1, $2, $3, $4, $5)",
    [event.id, event.userId, event.type, JSON.stringify(event.payload), event.createdAt]
  );
  return event;
}

export async function getAuditEvents(): Promise<AuditEvent[]> {
  const pool = await getPool();
  const { rows } = await pool.query<AuditEventRow>(
    "SELECT id, user_id, type, payload, created_at FROM audit_events ORDER BY created_at DESC"
  );
  return rows.map(mapAuditEvent);
}

// ---------- Model configuration versions ----------

/**
 * Bumps a "major.minor" version string, e.g. "1.0" -> "1.1". Mirrors the
 * client-side bumpVersion logic in lib/store/config-store.ts (kept in sync
 * intentionally rather than shared, since that module is a browser-only
 * localStorage store for the unrelated internal ad-hoc profiler tool).
 */
function bumpVersion(version: string): string {
  const [major, minor] = version.split(".").map(Number);
  return `${major}.${(minor ?? 0) + 1}`;
}

export async function getModelConfigHistory(): Promise<ModelConfigVersion[]> {
  const pool = await getPool();
  const { rows } = await pool.query<ModelConfigVersionRow>(
    "SELECT id, version, saved_at, saved_by_user_id, config FROM model_config_versions ORDER BY saved_at ASC"
  );
  return rows.map(mapModelConfigVersion);
}

/**
 * Returns the most recently saved model config, or the shipped default
 * if nothing has been saved yet.
 */
export async function getLatestModelConfig(): Promise<EngineConfig> {
  const pool = await getPool();
  const { rows } = await pool.query<ModelConfigVersionRow>(
    "SELECT id, version, saved_at, saved_by_user_id, config FROM model_config_versions ORDER BY saved_at DESC LIMIT 1"
  );
  if (rows.length === 0) {
    return defaultEngineConfig;
  }
  return mapModelConfigVersion(rows[0]).config;
}

export async function saveModelConfigVersion(input: {
  savedByUserId: string;
  config: Omit<EngineConfig, "version" | "savedAt">;
}): Promise<ModelConfigVersion> {
  const pool = await getPool();
  const client: PoolClient = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows } = await client.query<{ version: string }>(
      "SELECT version FROM model_config_versions ORDER BY saved_at DESC LIMIT 1"
    );
    const currentVersion = rows[0]?.version ?? defaultEngineConfig.version;
    const nextVersion = bumpVersion(currentVersion);

    const config: EngineConfig = {
      ...input.config,
      version: nextVersion,
      savedAt: nowIso(),
    };
    const row: ModelConfigVersion = {
      id: randomUUID(),
      version: nextVersion,
      savedAt: config.savedAt,
      savedByUserId: input.savedByUserId,
      config,
    };

    await client.query(
      `INSERT INTO model_config_versions (id, version, saved_at, saved_by_user_id, config)
       VALUES ($1, $2, $3, $4, $5)`,
      [row.id, row.version, row.savedAt, row.savedByUserId, JSON.stringify(row.config)]
    );

    await client.query("COMMIT");
    return row;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
