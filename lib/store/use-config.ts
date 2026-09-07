"use client";

import { useSyncExternalStore } from "react";
import { defaultEngineConfig } from "@/lib/config/defaults";
import { getEngineConfig, subscribeToConfig } from "./config-store";

export function useEngineConfig() {
  return useSyncExternalStore(
    subscribeToConfig,
    () => getEngineConfig(),
    () => defaultEngineConfig
  );
}
