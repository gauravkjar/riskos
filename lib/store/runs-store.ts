"use client";

import type { RiskRun } from "@/lib/orchestrator/types";

const STORAGE_KEY = "riskos.runs.v1";
const listeners = new Set<() => void>();

let cachedRuns: RiskRun[] | null = null;
let cachedVersion = -1;
let version = 0;

function readAll(): RiskRun[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as RiskRun[]) : [];
  } catch {
    return [];
  }
}

function writeAll(runs: RiskRun[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(runs));
  version += 1;
  listeners.forEach((l) => l());
}

export function subscribeToRuns(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getRuns(): RiskRun[] {
  if (cachedRuns === null || cachedVersion !== version) {
    cachedRuns = readAll().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    cachedVersion = version;
  }
  return cachedRuns;
}

export function getRun(id: string): RiskRun | undefined {
  return getRuns().find((r) => r.id === id);
}

export function saveRun(run: RiskRun): void {
  const all = readAll();
  all.push(run);
  writeAll(all);
  setLatestRunId(run.id);
}

export function updateRun(id: string, patch: Partial<RiskRun>): void {
  const all = readAll();
  const idx = all.findIndex((r) => r.id === id);
  if (idx === -1) return;
  all[idx] = { ...all[idx], ...patch };
  writeAll(all);
}

const LATEST_KEY = "riskos.latestRunId.v1";

export function setLatestRunId(id: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LATEST_KEY, id);
  version += 1;
  listeners.forEach((l) => l());
}

export function getLatestRunId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(LATEST_KEY);
}

export function getLatestRun(): RiskRun | undefined {
  const id = getLatestRunId();
  if (!id) return undefined;
  return getRun(id);
}
