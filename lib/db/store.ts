import { randomUUID } from "crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import type {
  AuditEvent,
  Database,
  InvestorProfile,
  ModelConfigVersion,
  RiskAssessment,
  User,
} from "./schema";
import type { EngineConfig } from "@/lib/config/types";
import { defaultEngineConfig } from "@/lib/config/defaults";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "db.json");

function emptyDb(): Database {
  return { users: [], profiles: [], assessments: [], auditEvents: [], modelConfigVersions: [] };
}

function ensureDbFile(): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!existsSync(DB_PATH)) {
    writeFileSync(DB_PATH, JSON.stringify(emptyDb(), null, 2), "utf8");
  }
}

function readDb(): Database {
  ensureDbFile();
  try {
    const raw = readFileSync(DB_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<Database>;
    return {
      users: parsed.users ?? [],
      profiles: parsed.profiles ?? [],
      assessments: parsed.assessments ?? [],
      auditEvents: parsed.auditEvents ?? [],
      modelConfigVersions: parsed.modelConfigVersions ?? [],
    };
  } catch {
    return emptyDb();
  }
}

function writeDb(db: Database): void {
  writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf8");
}

// Simple in-process write queue so concurrent async callers don't interleave
// read-modify-write cycles and clobber each other. Not safe across multiple
// server processes — this is a single-process dev/demo store.
let writeLock: Promise<unknown> = Promise.resolve();

function enqueue<T>(fn: (db: Database) => T): Promise<T> {
  const result = writeLock.then(() => {
    const db = readDb();
    const value = fn(db);
    writeDb(db);
    return value;
  });
  // Swallow errors for the chain itself so one failure doesn't wedge the
  // queue forever; the caller still sees the rejection via `result`.
  writeLock = result.catch(() => undefined);
  return result;
}

function nowIso(): string {
  return new Date().toISOString();
}

// ---------- Users ----------

export async function getUserByEmail(email: string): Promise<User | null> {
  const db = readDb();
  const normalized = email.trim().toLowerCase();
  return db.users.find((u) => u.email.toLowerCase() === normalized) ?? null;
}

export async function getUserById(id: string): Promise<User | null> {
  const db = readDb();
  return db.users.find((u) => u.id === id) ?? null;
}

export async function createUser(input: {
  email: string;
  passwordHash: string;
  role: User["role"];
}): Promise<User> {
  return enqueue((db) => {
    const existing = db.users.find(
      (u) => u.email.toLowerCase() === input.email.trim().toLowerCase()
    );
    if (existing) {
      throw new Error("A user with this email already exists.");
    }
    const user: User = {
      id: randomUUID(),
      email: input.email.trim().toLowerCase(),
      passwordHash: input.passwordHash,
      role: input.role,
      createdAt: nowIso(),
    };
    db.users.push(user);
    return user;
  });
}

export async function getAllUsers(): Promise<User[]> {
  const db = readDb();
  return db.users;
}

export async function hasAnyUserWithRole(role: User["role"]): Promise<boolean> {
  const db = readDb();
  return db.users.some((u) => u.role === role);
}

// ---------- Investor profiles ----------

export async function createProfile(input: {
  userId: string;
  displayName: string;
}): Promise<InvestorProfile> {
  return enqueue((db) => {
    const profile: InvestorProfile = {
      id: randomUUID(),
      userId: input.userId,
      displayName: input.displayName,
      createdAt: nowIso(),
    };
    db.profiles.push(profile);
    return profile;
  });
}

export async function getProfilesByUser(userId: string): Promise<InvestorProfile[]> {
  const db = readDb();
  return db.profiles.filter((p) => p.userId === userId);
}

// ---------- Risk assessments ----------

export async function createAssessment(input: {
  userId: string;
  profileId: string;
  answers: RiskAssessment["answers"];
  run: RiskAssessment["run"];
}): Promise<RiskAssessment> {
  return enqueue((db) => {
    const priorForProfile = db.assessments.filter(
      (a) => a.profileId === input.profileId
    );
    // Never overwrite/delete history: mark prior versions superseded, then
    // append a new one.
    for (const prior of priorForProfile) {
      prior.status = "superseded";
    }
    const version = priorForProfile.length + 1;
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
    db.assessments.push(assessment);
    return assessment;
  });
}

export async function getAssessmentsByUser(userId: string): Promise<RiskAssessment[]> {
  const db = readDb();
  return db.assessments
    .filter((a) => a.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
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
  const db = readDb();
  const assessment = db.assessments.find((a) => a.id === id);
  if (!assessment) return null;
  if (assessment.userId !== requestingUserId) return null;
  return assessment;
}

/**
 * Admin-only in intent: returns ALL assessments across ALL users. This
 * function does not itself check role — callers (route handlers) must gate
 * access with `requireRole(...)` before calling this.
 */
export async function getAllAssessments(): Promise<RiskAssessment[]> {
  const db = readDb();
  return [...db.assessments].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// ---------- Audit events ----------

export async function appendAuditEvent(input: {
  userId: string | null;
  type: string;
  payload: Record<string, unknown>;
}): Promise<AuditEvent> {
  return enqueue((db) => {
    const event: AuditEvent = {
      id: randomUUID(),
      userId: input.userId,
      type: input.type,
      payload: input.payload,
      createdAt: nowIso(),
    };
    db.auditEvents.push(event);
    return event;
  });
}

export async function getAuditEvents(): Promise<AuditEvent[]> {
  const db = readDb();
  return [...db.auditEvents].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
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
  const db = readDb();
  return [...db.modelConfigVersions].sort((a, b) => a.savedAt.localeCompare(b.savedAt));
}

/**
 * Returns the most recently saved model config, or the shipped default
 * (wrapped to look like a version row, id "default") if nothing has been
 * saved yet.
 */
export async function getLatestModelConfig(): Promise<EngineConfig> {
  const db = readDb();
  if (db.modelConfigVersions.length === 0) {
    return defaultEngineConfig;
  }
  const latest = [...db.modelConfigVersions].sort((a, b) =>
    b.savedAt.localeCompare(a.savedAt)
  )[0];
  return latest.config;
}

export async function saveModelConfigVersion(input: {
  savedByUserId: string;
  config: Omit<EngineConfig, "version" | "savedAt">;
}): Promise<ModelConfigVersion> {
  return enqueue((db) => {
    const currentVersion =
      db.modelConfigVersions.length === 0
        ? defaultEngineConfig.version
        : [...db.modelConfigVersions].sort((a, b) => b.savedAt.localeCompare(a.savedAt))[0]
            .config.version;
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
    db.modelConfigVersions.push(row);
    return row;
  });
}
