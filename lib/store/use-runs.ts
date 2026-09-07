"use client";

import { useSyncExternalStore } from "react";
import { getLatestRun, getRuns, subscribeToRuns } from "./runs-store";
import type { RiskRun } from "@/lib/orchestrator/types";

const EMPTY_RUNS: RiskRun[] = [];

export function useRuns() {
  return useSyncExternalStore(
    subscribeToRuns,
    () => getRuns(),
    () => EMPTY_RUNS
  );
}

export function useLatestRun() {
  return useSyncExternalStore(
    subscribeToRuns,
    () => getLatestRun(),
    () => undefined
  );
}
