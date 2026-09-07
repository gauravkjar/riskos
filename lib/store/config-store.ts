"use client";

import { defaultEngineConfig } from "@/lib/config/defaults";
import type { EngineConfig } from "@/lib/config/types";

const STORAGE_KEY = "riskos.engineConfig.v1";
const HISTORY_KEY = "riskos.engineConfigHistory.v1";
const listeners = new Set<() => void>();

let cachedConfig: EngineConfig | null = null;
let cachedVersion = -1;
let version = 0;

export function subscribeToConfig(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getEngineConfig(): EngineConfig {
  if (typeof window === "undefined") return defaultEngineConfig;
  if (cachedConfig === null || cachedVersion !== version) {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      cachedConfig = raw ? (JSON.parse(raw) as EngineConfig) : defaultEngineConfig;
    } catch {
      cachedConfig = defaultEngineConfig;
    }
    cachedVersion = version;
  }
  return cachedConfig;
}

export function getConfigHistory(): EngineConfig[] {
  if (typeof window === "undefined") return [defaultEngineConfig];
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as EngineConfig[]) : [defaultEngineConfig];
  } catch {
    return [defaultEngineConfig];
  }
}

function bumpVersion(version: string): string {
  const [major, minor] = version.split(".").map(Number);
  return `${major}.${(minor ?? 0) + 1}`;
}

export function saveEngineConfig(next: Omit<EngineConfig, "version" | "savedAt">): EngineConfig {
  const current = getEngineConfig();
  const updated: EngineConfig = {
    ...next,
    version: bumpVersion(current.version),
    savedAt: new Date().toISOString(),
  };
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    const history = getConfigHistory();
    history.push(updated);
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    version += 1;
    listeners.forEach((l) => l());
  }
  return updated;
}

export function resetEngineConfig(): EngineConfig {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(HISTORY_KEY);
    version += 1;
    listeners.forEach((l) => l());
  }
  return defaultEngineConfig;
}
