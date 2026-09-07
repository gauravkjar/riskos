import {
  defaultAllocationTable,
  defaultPortfolioSizeRules,
} from "@/lib/config/defaults";
import type {
  AllocationTableConfig,
  PortfolioSizeRulesConfig,
} from "@/lib/config/types";
import type { AllocationKey, AllocationLine, BandCode } from "./types";

export function availableBasketSizes(
  band: BandCode,
  rules: PortfolioSizeRulesConfig = defaultPortfolioSizeRules
): number[] {
  return rules.availableBasketSizesByBand[band];
}

export function defaultBasketSize(
  band: BandCode,
  rules: PortfolioSizeRulesConfig = defaultPortfolioSizeRules
): number {
  return rules.defaultBasketSizeByBand[band];
}

export function allocationKey(band: BandCode, basketSize: number): AllocationKey {
  return `${band}-${basketSize}`;
}

export function allocationForKey(
  key: AllocationKey,
  table: AllocationTableConfig = defaultAllocationTable
): AllocationLine[] {
  const rows = table.allocations[key];
  if (!rows) {
    throw new Error(`No allocation configured for key ${key}`);
  }
  return rows;
}

export function allocationForBand(
  band: BandCode,
  basketSize?: number,
  table: AllocationTableConfig = defaultAllocationTable,
  rules: PortfolioSizeRulesConfig = defaultPortfolioSizeRules
): { key: AllocationKey; lines: AllocationLine[] } {
  const size = basketSize ?? defaultBasketSize(band, rules);
  const key = allocationKey(band, size);
  return { key, lines: allocationForKey(key, table) };
}
